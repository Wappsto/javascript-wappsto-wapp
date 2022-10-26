import { Model } from './model';
import { session, baseUrl } from '../session';
import { _config } from '../util/config';
import { printDebug, printError } from '../util/debug';
import { isUUID, isBrowser, isVersion, toString } from '../util/helpers';
import wappsto from '../util/http_wrapper';
import { getErrorMessage } from '../util/http_wrapper';
import { trace, clearTrace } from '../util/trace';
import {
    IStreamEvent,
    ServiceHandler,
    RequestHandler,
    IStreamModel,
} from '../util/interfaces';
/* eslint-disable @typescript-eslint/no-var-requires */
const WebSocket = require('universal-websocket-client');

export class IgnoreError extends Error {
    constructor(msg: string) {
        super(msg);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, IgnoreError.prototype);
    }
}

interface StreamModelHash {
    [key: string]: IStreamModel[];
}

interface StreamServiceHash {
    [key: string]: ServiceHandler[];
}

export class Stream extends Model {
    static endpoint = '/2.1/stream';
    socket?: WebSocket;
    websocketUrl = '';
    ignoreReconnect = false;
    models: StreamModelHash = {};
    services: StreamServiceHash = {};
    subscriptions: string[] = [];
    opened = false;
    backoff = 1;
    waiting: any = [];
    onRequestHandlers: Record<number, RequestHandler[]> = { 0: [], 1: [] };

    constructor() {
        super('stream');
        this.websocketUrl = `${baseUrl}`;
        if (!this.websocketUrl.endsWith('/')) {
            this.websocketUrl += `/`;
        }
        this.websocketUrl += `2.1/websocket/open`;

        /* istanbul ignore next */
        if (
            !this.websocketUrl.startsWith('http') &&
            typeof window === 'object'
        ) {
            const w = window as any;
            if (w.location && w.location.origin) {
                this.websocketUrl = w.location.origin + this.websocketUrl;
            }
        }
        this.websocketUrl = this.websocketUrl.replace(/^http/, 'ws');

        this.websocketUrl += '?X-Session=' + session;
    }

    private getTimeout(): number {
        /* istanbul ignore next */
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

            try {
                const socket = new WebSocket(this.websocketUrl);

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
            } catch (e) {
                /* istanbul ignore next */
                printDebug(`Failed to open WebSocket: ${e}`);
            }
        });
    }

    public close() {
        if (this.socket) {
            printDebug(`Closing WebSocket on ${this.url}`);
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
            `/2.1${subscription}`
        );
    }

    private removeSubscription(subscription: string): void {
        if (!this.subscriptions.includes(subscription)) {
            /* istanbul ignore next */
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

    public subscribe(model: IStreamModel, full = true): boolean {
        this.validate('subscribe', arguments);
        const path = this.generatePathFromService(model.path(), full);

        if (!this.models[path]) {
            this.models[path] = [];
        }
        if (this.models[path].indexOf(model) === -1) {
            this.models[path].push(model);

            this.open().then(() => {
                printDebug(`Add subscription: ${model.path()}`);
                this.addSubscription(path);
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

    public subscribeInternal(type: string, handler: ServiceHandler): void {
        this.validate('subscribeInternal', arguments);
        this.subscribeService('extsync', (event) => {
            let res: boolean | Promise<undefined | true> = false;
            try {
                const body = JSON.parse(event.body);
                if (body.type === type) {
                    res = handler(body);
                }
            } catch (e) {
                /* istanbul ignore next */
                printError('Failed to parse body in internal event as JSON');
            }
            return res;
        });
    }

    private generatePathFromService(service: string, full: boolean): string {
        let path = `${service}${full ? '' : '?full=true'}`;
        if (path[0] !== '/') {
            path = '/' + path;
        }
        return path;
    }

    public subscribeService(
        service: string,
        handler: ServiceHandler,
        full = true
    ): void {
        this.validate('subscribeService', arguments);

        this.open().then(() => {
            const path = this.generatePathFromService(service, full);
            if (!this.services[path]) {
                this.services[path] = [];
            }
            this.services[path].push(handler);

            printDebug(`Add service subscription: ${path}`);

            this.addSubscription(path);
        });
    }

    public unsubscribeService(
        service: string,
        handler: ServiceHandler,
        full = true
    ): void {
        this.validate('subscribeService', arguments);
        const path = this.generatePathFromService(service, full);

        if (this.services[path] !== undefined) {
            const index = this.services[path].indexOf(handler);
            if (index !== -1) {
                this.services[path].splice(index, 1);
            }

            if (this.services[path].length === 0) {
                this.removeSubscription(path);
            }
        }
    }

    public async sendEvent(type: string, msg: any): Promise<any> {
        this.validate('sendEvent', arguments);

        let result = {};
        try {
            const data = {
                type: type,
                message: msg,
            };
            const response = await wappsto.post('/2.1/extsync', data);
            result = response.data;
        } catch (e) {
            /* istanbul ignore next */
            const errorMsg = getErrorMessage(e);
            printError(
                `Failed to send ${type} event (${toString(
                    msg
                )}) because: ${errorMsg}`
            );
        }
        return result;
    }

    public async sendRequest(msg: any): Promise<any> {
        this.validate('sendRequest', arguments);

        let result = {};
        try {
            const response = await wappsto.post('/2.1/extsync/request', msg);
            result = response.data;
        } catch (e: any) {
            /* 1istanbul ignore next */
            if (e.response.data?.code) {
                const errorMsg = getErrorMessage(e);
                printError(
                    `Failed to send request (${toString(
                        msg
                    )}) because: ${errorMsg}`
                );
            } else {
                result = e.response.data;
            }
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
                `/2.1/extsync/response/${event?.meta?.id}`,
                data
            );
        } catch (e) {
            /* istanbul ignore next */
            const errorMsg = getErrorMessage(e);
            /* istanbul ignore next */
            printError(
                `Failed to send response (${toString(
                    msg
                )}) with code ${code} because: ${errorMsg}`
            );
        }
    }

    private onRequestHandler = (event: any): boolean => {
        try {
            let res;
            const handlers =
                this.onRequestHandlers[Number(event.uri === 'extsync/')];
            for (let i = 0; i < handlers.length; i++) {
                let p;
                try {
                    p = handlers[i](event.body);
                } catch (err: any) {
                    if (!(err instanceof IgnoreError)) {
                        printError(err);
                        this.sendResponse(event, 400, { error: err.message });
                    }
                }
                if (p) {
                    if (p.then) {
                        p.then((res: any) => {
                            this.sendResponse(event, 200, res);
                        }).catch((err: any) => {
                            if (!(err instanceof IgnoreError)) {
                                printError(err);
                                this.sendResponse(event, 400, {
                                    error: err.message,
                                });
                            }
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
            printError(toString(e));
        }
        return false;
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

    private handleMessage(type: string, event: IStreamEvent): void {
        const paths: string[] = [];
        const services: string[] = [];
        if (type === 'message') {
            if (!event.path) {
                /* istanbul ignore next */
                return;
            }
            const items: string[] = event.path
                .split('/')
                .filter((s) => s.length > 0);
            if (!items) {
                /* istanbul ignore next */
                return;
            }
            if (isVersion(items[0])) {
                items.shift();
            }
            const last = items[items.length - 1];

            paths.push(
                `/${items.slice(items.length - 2, items.length).join('/')}`
            );

            if (!isUUID(last)) {
                paths.push(
                    `/${items
                        .slice(items.length - 3, items.length - 1)
                        .join('/')}`
                );
            }
            items.forEach((i) => {
                if (!isUUID(i) && !isVersion(i)) {
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

        printDebug(`Sending a ${method} message to ${url}: ${toString(hash)}`);
        try {
            this.socket?.send(toString(hash));
        } catch (e) {
            /* istanbul ignore next */
            printError(`Failed to send message on WebSocket: ${e}`);
        }
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
            /* istanbul ignore else */
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
                printError("Can't handle binary stream data");
            }

            if (message.jsonrpc) {
                if (message.result) {
                    if (message.result.value !== true) {
                        this.backoff = 1;
                    }
                    printDebug(
                        `Stream rpc ${message.id} result: ${toString(
                            message.result.value
                        )}`
                    );
                } else {
                    printError(`Stream rpc error: ${toString(message.error)}`);
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
                if (msg.data?.uri !== 'extsync/wappsto/editor/console') {
                    printDebug(`Stream message: ${toString(msg)}`);
                }
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
                this.checkAndSendTrace(msg);
                this.handleMessage('message', msg);
                clearTrace('ok');
            });
        };

        this.socket.onerror = (event: any) => {
            /* istanbul ignore next */
            printError('Stream error: ' + this.websocketUrl);
        };

        this.socket.onclose = (event: CloseEvent) => {
            if (!this.ignoreReconnect) {
                reconnect();
            }
        };
    }

    private checkAndSendTrace(event: IStreamEvent): void {
        if (event?.meta?.trace) {
            trace(event.meta.trace);
        }
    }
}
