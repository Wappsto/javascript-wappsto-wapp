import { Model } from './model';
import { session, baseUrl } from '../session';
import { _config } from '../util/config';
import { printDebug, printError } from '../util/debug';
import { isUUID } from '../util/uuid';
import { isBrowser } from '../util/browser';
import wappsto from '../util/http_wrapper';
import { printHttpError } from '../util/http_wrapper';
import {
    IStreamEvent,
    ServiceHandler,
    SignalHandler,
    RequestHandler,
    IStreamModel,
} from '../util/interfaces';
/* eslint-disable @typescript-eslint/no-var-requires */
const WebSocket = require('universal-websocket-client');

interface StreamModelHash {
    [key: string]: IStreamModel[];
}

interface StreamServiceHash {
    [key: string]: ServiceHandler[];
}

interface StreamSignalHash {
    [key: string]: SignalHandler[];
}

export class Stream extends Model {
    static endpoint = '/2.1/stream';
    socket?: WebSocket;
    websocketUrl = '';
    ignoreReconnect = false;
    models: StreamModelHash = {};
    services: StreamServiceHash = {};
    handlers: StreamSignalHash = {};
    subscriptions: string[] = [];
    opened = false;
    backoff = 1;
    waiting: any = [];
    onRequestHandlers: Record<number, RequestHandler[]> = { 0: [], 1: [] };

    constructor() {
        super('stream', '2.1');
        this.websocketUrl = `${baseUrl}`;
        if (!this.websocketUrl.endsWith('/')) {
            this.websocketUrl += `/`;
        }
        this.websocketUrl += `2.1/websocket/open`;

        if (
            !this.websocketUrl.startsWith('http') &&
            typeof window === 'object' &&
            window &&
            window.location &&
            window.location.origin
        ) {
            this.websocketUrl = window.location.origin + this.websocketUrl;
        }
        this.websocketUrl = this.websocketUrl.replace(/^http/, 'ws');

        this.websocketUrl += '?X-Session=' + session;
    }

    private getTimeout(): number {
        if (this.backoff >= _config.reconnectCount) {
            printError(
                `Stream failed to connect after ${this.backoff} attemps, exit!`
            );
            if (isBrowser()) {
                return Infinity;
            } else {
                process.exit(-1);
            }
        }
        return this.backoff * 2 * 1000;
    }

    private open(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.socket) {
                resolve();
                return;
            } else {
                if (this.opened) {
                    this.waiting.push(resolve);
                    return;
                }
            }
            this.opened = true;

            printDebug(`Open WebSocket on ${this.websocketUrl}`);
            this.ignoreReconnect = false;

            const openTimeout: ReturnType<typeof setTimeout> = setTimeout(
                () => {
                    /* istanbul ignore next */
                    this.reconnect();
                },
                1000 + this.getTimeout()
            );

            const socket = new WebSocket(this.websocketUrl);

            if (socket) {
                socket.onopen = () => {
                    this.socket = socket;
                    clearTimeout(openTimeout);
                    this.addListeners();
                    resolve();
                    this.waiting.forEach((r: any) => {
                        r();
                    });
                    this.waiting = [];
                };
            }
        });
    }

    public close() {
        if (this.socket) {
            printDebug('Closing WebSocket');
            this.ignoreReconnect = true;
            this.socket.close();
            this.opened = false;
            this.socket = undefined;
        }
    }

    private addSubscription(subscription: string): void {
        if (this.subscriptions.includes(subscription)) {
            return;
        }

        this.subscriptions.push(subscription);

        this.sendMessage(
            'POST',
            '/services/2.1/websocket/open/subscription',
            subscription
        );
    }

    private removeSubscription(subscription: string): void {
        if (!this.subscriptions.includes(subscription)) {
            return;
        }

        const index = this.subscriptions.indexOf(subscription);
        if (index !== -1) {
            this.subscriptions.splice(index, 1);
        }
        this.sendMessage(
            'DELETE',
            '/services/2.1/websocket/open/subscription',
            subscription
        );
    }

    public subscribe(model: IStreamModel): boolean {
        this.validate('subscribe', arguments);

        if (!this.models[model.path()]) {
            this.models[model.path()] = [];
        }
        if (this.models[model.path()].indexOf(model) === -1) {
            this.models[model.path()].push(model);

            this.open().then(() => {
                printDebug(`Add subscription: ${model.path()}`);
                this.addSubscription(model.path());
            });

            return true;
        }
        return false;
    }

    public unsubscribe(model: IStreamModel): void {
        this.validate('subscribe', arguments);

        if (this.models[model.path()]) {
            const index = this.models[model.path()].indexOf(model);
            if (index !== -1) {
                this.models[model.path()].splice(index, 1);
            }

            this.removeSubscription(model.path());
        }
    }

    public async sendInternal(type: string): Promise<any> {
        this.validate('sendInternal', arguments);

        return await this.sendEvent(type, '');
    }

    public subscribeInternal(type: string, handler: ServiceHandler): void {
        this.validate('subscribeInternal', arguments);

        this.subscribeService('extsync', (event) => {
            try {
                const body = JSON.parse(event.body);
                if (body.type === type) {
                    return handler(body);
                }
            } catch (e) {
                printError('Failed to parse body in internal event as JSON');
            }
            return false;
        });
    }

    public subscribeService(service: string, handler: ServiceHandler): void {
        this.validate('subscribeService', arguments);

        this.open().then(() => {
            if (service[0] !== '/') {
                service = '/' + service;
            }
            if (!this.services[service]) {
                this.services[service] = [];
            }
            this.services[service].push(handler);

            printDebug(`Add service subscription: ${service}`);

            this.addSubscription(service);
        });
    }

    public unsubscribeService(service: string, handler: ServiceHandler): void {
        this.validate('subscribeService', arguments);

        if (service[0] !== '/') {
            service = '/' + service;
        }
        if (this.services[service] !== undefined) {
            const index = this.services[service].indexOf(handler);
            if (index !== -1) {
                this.services[service].splice(index, 1);
            }

            if (this.services[service].length === 0) {
                this.removeSubscription(service);
            }
        }
    }

    public addSignalHandler(type: string, handler: SignalHandler): void {
        this.validate('addSignalHandler', arguments);

        this.open().then(() => {
            printDebug(`Add Signal Handler: ${type}`);
            if (!this.handlers[type]) {
                this.handlers[type] = [];
            }
            this.handlers[type].push(handler);
        });
    }

    public async sendEvent(type: string, msg: string): Promise<any> {
        this.validate('sendEvent', arguments);

        let result = {};
        try {
            const data = {
                type: type,
                msg: msg,
            };
            const response = await wappsto.post('/2.0/extsync', data);
            result = response.data;
        } catch (e) {
            /* istanbul ignore next */
            printHttpError(e);
        }
        return result;
    }

    public async sendRequest(msg: any): Promise<any> {
        this.validate('sendRequest', arguments);

        let result = {};
        try {
            const response = await wappsto.post('/2.0/extsync/request', msg);
            result = response.data;
        } catch (e) {
            /* istanbul ignore next */
            printHttpError(e);
        }
        return result;
    }

    public async sendResponse(
        event: any,
        code: number,
        msg: any
    ): Promise<void> {
        this.validate('sendResponse', arguments);

        try {
            const data = {
                code: code,
                body: msg,
            };
            await wappsto.patch(
                `/2.0/extsync/response/${event?.meta?.id}`,
                data
            );
        } catch (e) {
            printHttpError(e);
        }
    }

    private onRequestHandler = async (
        event: any
    ): Promise<true | undefined> => {
        try {
            let res;
            const handlers =
                this.onRequestHandlers[Number(event.uri === 'extsync/')];
            for (let i = 0; i < handlers.length; i++) {
                const p = handlers[i](event.body);
                if (p) {
                    if (p.then) {
                        p.then((res: any) => {
                            this.sendResponse(event, 200, res);
                        }).catch((res: any) => {
                            this.sendResponse(event, 400, res);
                        });
                        continue;
                    } else {
                        res = p;
                    }
                }
                this.sendResponse(event, 200, res);
            }
        } catch (e) {
            this.sendResponse(event, 501, e);
            printError('An error happend when calling request handler');
            printError(JSON.stringify(e));
        }

        return undefined;
    };

    public onRequest(handler: RequestHandler, internal: boolean): void {
        this.validate('onRequest', arguments);

        if (
            this.onRequestHandlers[0].length === 0 &&
            this.onRequestHandlers[1].length === 0
        ) {
            this.subscribeService('/extsync/request', this.onRequestHandler);
        }
        this.onRequestHandlers[Number(internal)].push(handler);
    }

    public cancelRequest(handler: RequestHandler, internal: boolean): void {
        this.validate('onRequest', arguments);

        const index = this.onRequestHandlers[Number(internal)].indexOf(handler);
        if (index !== -1) {
            this.onRequestHandlers[Number(internal)].splice(index, 1);
        }

        if (
            this.onRequestHandlers[0].length === 0 &&
            this.onRequestHandlers[1].length === 0
        ) {
            this.unsubscribeService('/extsync/request', this.onRequestHandler);
        }
    }

    private reconnect() {
        this.backoff++;
        printDebug(`Stream Reconnecting for the ${this.backoff} times`);
        this.close();
        this.open().then(() => {
            this.sendMessage('PATCH', '/services/2.1/websocket/open', {
                subscription: this.subscriptions,
            });
        });
    }

    private handleEvent(type: string, event: any): void {
        printDebug(`Handle Event: ${type}`);
        this.handlers[type]?.forEach((handler: SignalHandler) => {
            handler(event);
        });
    }

    private filterCallback(
        callback: ServiceHandler,
        path: string,
        result: boolean | undefined
    ): void {
        if (result === true) {
            this.services[path] = this.services[path].filter(
                (item) => item !== callback
            );
        }
    }

    private handleMessage(type: string, event: IStreamEvent, _ = ''): void {
        const paths: string[] = [];
        const services: string[] = [];
        if (type === 'message') {
            if (!event.path) {
                return;
            }
            const items: string[] = event.path
                .split('/')
                .filter((s) => s.length > 0);
            if (!items) {
                /* istanbul ignore next */
                return;
            }

            const last = items[items.length - 1];

            paths.push(
                '/' + items.slice(items.length - 2, items.length).join('/')
            );

            if (!isUUID(last)) {
                paths.push(
                    '/' + items.slice(items.length - 3, items.length).join('/')
                );
            }
            items.forEach((i) => {
                if (!isUUID(i)) {
                    services.push(`/${i}`);
                }
            });
        } else {
            services.push(`/${type}`);
        }

        paths.forEach((path) => {
            this.models[path]?.forEach((model: IStreamModel) => {
                model.handleStream(event);
            });
        });
        services.forEach((path) => {
            const tmpList = this.services[path];
            tmpList?.forEach((callback: ServiceHandler) => {
                const p = callback(event);
                if (p) {
                    if (p === true) {
                        this.filterCallback(callback, path, p);
                    } else {
                        p.then((res) => {
                            this.filterCallback(callback, path, res);
                        });
                    }
                }
            });
        });
    }

    private sendMessage(
        method: string,
        url: string,
        body: any | undefined = undefined
    ) {
        const hash = {
            jsonrpc: '2.0',
            method: method,
            id: Math.floor(Math.random() * 100000),
            params: {
                url: url,
                data: undefined,
            },
        };
        if (body) {
            hash.params.data = body;
        }

        printDebug(
            `Sending a ${method} message to ${url}: ${JSON.stringify(hash)}`
        );
        this.socket?.send(JSON.stringify(hash));
    }

    private addListeners() {
        if (!this.socket) {
            /* istanbul ignore next */
            return;
        }

        const reconnect = () => {
            setTimeout(() => {
                this.reconnect();
            }, this.getTimeout());
        };

        this.socket.onmessage = (ev: any) => {
            let message;
            if (ev.type === 'message') {
                try {
                    message = JSON.parse(ev.data);
                } catch (e) {
                    /* istanbul ignore next */
                    printError('Failed to parse stream event');
                    /* istanbul ignore next */
                    return;
                }
            } else {
                /* istanbul ignore next */
                printError("Can't handle binary stream data");
            }

            if (message.jsonrpc) {
                if (message.result) {
                    if (message.result.value !== true) {
                        this.backoff = 1;
                    }
                    printDebug(
                        `Stream rpc ${message.id} result: ${JSON.stringify(
                            message.result.value
                        )}`
                    );
                } else {
                    printError(
                        `Stream rpc error: ${JSON.stringify(message.error)}`
                    );
                }
                return;
            }

            let messages: IStreamEvent[] = [];
            if (message.constructor !== Array) {
                messages = [message];
            } else {
                messages = message;
            }

            messages.forEach((msg: IStreamEvent) => {
                printDebug(`Stream message: ${JSON.stringify(msg)}`);
                if (msg.meta_object?.type === 'extsync') {
                    const newData = msg.extsync || msg.data;
                    if (newData.request) {
                        this.handleMessage('extsync/request', newData);
                    } else if (
                        newData.uri !== 'extsync/wappsto/editor/console'
                    ) {
                        this.handleMessage('extsync', newData);
                    }
                    return;
                }
                const traceId = this.checkAndSendTrace(msg);
                this.handleMessage('message', msg, traceId);
            });
        };

        this.socket.onerror = (event: any) => {
            try {
                this.handleEvent('error', event);
            } catch (e) {
                /* istanbul ignore next */
                printError('Stream error: ' + this.websocketUrl);
            }
        };

        this.socket.onclose = (event: CloseEvent) => {
            if (this.ignoreReconnect) {
                this.handleEvent('close', event);
            } else {
                reconnect();
            }
        };
    }

    private checkAndSendTrace(_: IStreamEvent): string {
        return '';
        /*if (message.hasOwnProperty('meta') && message.meta.hasOwnProperty('trace')) {
          return Tracer.sendTrace(this.stream.util.session, message.meta.trace, null, null, {
          'stream_id': message.meta.id
          });
          }*/
    }
}

const openStream: Stream = new Stream();

export { openStream };

async function sendRequest(type: string, msg: any): Promise<any> {
    const data = {
        type: type,
        message: msg,
    };
    return await openStream.sendRequest(data);
}

export async function sendToForeground(msg: any): Promise<any> {
    return sendRequest('background', msg);
}

export async function sendToBackground(msg: any): Promise<any> {
    return sendRequest('foreground', msg);
}

const request_handlers: Record<string, RequestHandler> = {};

async function _handleRequest(event: any) {
    try {
        const data = JSON.parse(event);
        if (request_handlers[data.type]) {
            return request_handlers[data.type](data.message);
        }
    } catch (e) {
        /* istanbul ignore next */
        printDebug('Failed to parse event - Foreground/Background handler');
    }
    return undefined;
}

function handleRequest(type: string, callback: RequestHandler): void {
    if (Object.keys(request_handlers).length === 0) {
        openStream.onRequest(_handleRequest, true);
    }
    request_handlers[type] = callback;
}

export function fromForeground(callback: RequestHandler): void {
    Model.validateMethod('Stream', 'fromForeground', arguments);
    handleRequest('foreground', callback);
}

export function fromBackground(callback: RequestHandler): void {
    Model.validateMethod('Stream', 'fromForeground', arguments);
    handleRequest('background', callback);
}

export function onWebHook(handler: RequestHandler): void {
    Model.validateMethod('Stream', 'onWebHook', arguments);
    openStream.onRequest(handler, false);
}

export function cancelOnWebHook(handler: RequestHandler): void {
    Model.validateMethod('Stream', 'onWebHook', arguments);
    openStream.cancelRequest(handler, false);
}

function cancelFrom(type: string): void {
    if (request_handlers[type]) {
        delete request_handlers[type];
        if (Object.keys(request_handlers).length === 0) {
            openStream.cancelRequest(_handleRequest, true);
        }
    }
}

export function cancelFromBackground(): void {
    cancelFrom('background');
}

export function cancelFromForeground(): void {
    cancelFrom('foreground');
}
