import WebSocket from 'universal-websocket-client';
import { Model } from './model';
import { session, baseUrl, extSyncToken } from '../session';
import { _config } from '../util/config';
import {
    printDebug,
    printError,
    printStream,
    printWarning,
} from '../util/debug';
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
    backOff = 1;
    waiting: any = [];
    onRequestHandlers: Record<number, RequestHandler[]> = { 0: [], 1: [] };
    onRequestEvents: Record<number, any[]> = { 0: [], 1: [] };
    rpc_response: Record<number, any> = {};
    reconnect_timer: any = undefined;

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
                this.websocketUrl = `${w.location.origin}${this.websocketUrl}`;
            }
        }
        this.websocketUrl = this.websocketUrl.replace(/^http/, 'ws');

        this.websocketUrl += `?X-Session=${session}`;
    }

    public reset(): void {
        this.ignoreReconnect = false;
        this.opened = false;
        this.models = {};
        this.services = {};
        this.subscriptions = [];
        this.onRequestHandlers = { 0: [], 1: [] };
        this.onRequestEvents = { 0: [], 1: [] };
        this.waiting = [];
        this.backOff = 1;
        Object.values(this.rpc_response).forEach((resolve: any) => {
            printStream('Clean up', resolve);
            resolve(false);
        });
        this.rpc_response = {};
        clearTimeout(this.reconnect_timer);
    }

    #getTimeout(): number {
        /* istanbul ignore next */
        if (this.backOff >= _config.reconnectCount) {
            printError(
                `Stream failed to connect after ${this.backOff} attempts, exit!`
            );
            if (isBrowser()) {
                return Infinity;
            } else {
                process.exit(11);
            }
        }
        return this.backOff * 2 * 1000;
    }

    #open(): Promise<void> {
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
                    this.#reconnect();
                },
                1000 + this.#getTimeout()
            );

            try {
                const socket = new WebSocket(this.websocketUrl);

                socket.onopen = () => {
                    this.socket = socket;
                    clearTimeout(openTimeout);
                    this.#addListeners();
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

    public close(): void {
        if (this.socket) {
            printDebug(`Closing WebSocket on ${this.url}`);
            this.ignoreReconnect = true;
            this.socket.close();
            this.opened = false;
            this.socket = undefined;
        }
    }

    async #addSubscription(subscription: string): Promise<boolean> {
        if (this.subscriptions.includes(subscription)) {
            return true;
        }

        this.subscriptions.push(subscription);

        return this.#sendMessage(
            'POST',
            '/services/2.1/websocket/open/subscription',
            `/2.1${subscription}`
        );
    }

    async #removeSubscription(subscription: string): Promise<boolean> {
        if (!this.subscriptions.includes(subscription)) {
            /* istanbul ignore next */
            return true;
        }

        const index = this.subscriptions.indexOf(subscription);
        if (index !== -1) {
            this.subscriptions.splice(index, 1);
        }
        return this.#sendMessage(
            'DELETE',
            '/services/2.1/websocket/open/subscription',
            `/2.1${subscription}`
        );
    }

    public async subscribe(
        model: IStreamModel,
        full = false
    ): Promise<boolean> {
        this.validate('subscribe', arguments);
        const path = this.#generatePathFromService(model.path(), full);

        if (!this.models[path]) {
            this.models[path] = [];
        }

        if (this.models[path].indexOf(model) === -1) {
            this.models[path].push(model);
            await this.#open();

            printDebug(`Add subscription: ${model.path()}`);
            return this.#addSubscription(path);
        }
        return false;
    }

    public async unsubscribe(model: IStreamModel): Promise<boolean> {
        this.validate('subscribe', arguments);
        if (this.models[model.path()]) {
            const index = this.models[model.path()].indexOf(model);
            if (index !== -1) {
                this.models[model.path()].splice(index, 1);
            }

            return this.#removeSubscription(model.path());
        }
        return true;
    }

    public async subscribeInternal(
        type: string,
        handler: ServiceHandler
    ): Promise<boolean> {
        this.validate('subscribeInternal', arguments);
        return this.subscribeService('extsync', async (event) => {
            let res: boolean | undefined = false;
            try {
                let body;
                if (typeof event.body === 'string') {
                    body = JSON.parse(event.body);
                } else {
                    body = event.body;
                }
                if (body.type === type) {
                    res = await handler(body);
                }
            } catch (e) {
                /* istanbul ignore next */
                printError('Failed to parse body in internal event as JSON');
            }
            return res;
        });
    }

    #generatePathFromService(service: string, full: boolean): string {
        let path = `${service}${full ? '?full=true' : ''}`;
        if (path[0] !== '/') {
            path = `/${path}`;
        }
        return path;
    }

    public async subscribeService(
        service: string,
        handler: ServiceHandler,
        full = false
    ): Promise<boolean> {
        this.validate('subscribeService', arguments);
        await this.#open();

        const path = this.#generatePathFromService(service, full);
        if (!this.services[path]) {
            this.services[path] = [];
        }
        this.services[path].push(handler);

        printDebug(`Add service subscription: ${path}`);

        return this.#addSubscription(path);
    }

    public async unsubscribeService(
        service: string,
        handler: ServiceHandler,
        full = false
    ): Promise<boolean> {
        this.validate('subscribeService', arguments);
        const path = this.#generatePathFromService(service, full);
        let res = true;

        if (this.services[path] !== undefined) {
            const index = this.services[path].indexOf(handler);
            if (index !== -1) {
                this.services[path].splice(index, 1);
            }

            if (this.services[path].length === 0) {
                res = await this.#removeSubscription(path);
            }
        }
        return res;
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
        } catch (e: any) {
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
            if (e.response.data?.code !== undefined) {
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
        msg: any,
        headers?: Record<string, string>
    ): Promise<void> {
        this.validate('sendResponse', arguments);

        try {
            await wappsto.patch(
                `/2.1/extsync/response/${event?.meta?.id}`,
                headers
                    ? {
                          code,
                          body: msg,
                          headers,
                      }
                    : {
                          code,
                          body: msg,
                      }
            );
        } catch (e: any) {
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

    async #runRequestHandlers(type: number) {
        if (this.onRequestEvents[type].length === 0) {
            return;
        }

        const event = this.onRequestEvents[type][0];
        try {
            const handlers = this.onRequestHandlers[type];
            for (let i = 0; i < handlers.length; i++) {
                try {
                    let path = '';
                    const query: Record<string, string> = {};
                    try {
                        const arrUri = event.uri.split('?');
                        path = `/${arrUri[0]}`;
                        if (arrUri[1]) {
                            arrUri[1].split('&').forEach((item: string) => {
                                const items = item.split('=');
                                query[items[0]] = items[1];
                            });
                        }
                    } catch (e: any) {
                        printWarning(
                            `Failed to decode ExtSync url (${event.uri}): ${e.message}`
                        );
                    }

                    path = path.replace('/extsync', '').replace('/request', '');
                    if (extSyncToken) {
                        path = path.replace(`/${extSyncToken}`, '');
                    }

                    const res = await handlers[i](
                        event.body,
                        event.method,
                        path || '/',
                        query,
                        event.headers
                    );
                    let code = 200;
                    let body = res;
                    let headers;

                    let data;
                    try {
                        data = JSON.parse(res);
                    } catch (e) {
                        data = res;
                    }

                    if (data?.body) {
                        body = data.body;
                        if (data.code) {
                            code = data.code;
                        }
                        if (data.headers) {
                            headers = data.headers;
                        }
                    }
                    this.sendResponse(event, code, body, headers);
                } catch (err: any) {
                    if (!(err instanceof IgnoreError)) {
                        printError(err);
                        this.sendResponse(event, 400, { error: err.message });
                    }
                }
            }
        } catch (e) {
            /* istanbul ignore next */
            this.sendResponse(event, 501, e);
            /* istanbul ignore next */
            printError('An error happened when calling request handler');
            /* istanbul ignore next */
            printError(toString(e));
        }

        this.onRequestEvents[type].shift();

        this.#runRequestHandlers(type);
    }

    #onRequestHandler = (event: any): boolean => {
        const type = Number(event.uri === 'extsync/');

        this.onRequestEvents[type].push(event);

        if (this.onRequestEvents[type].length === 1) {
            this.#runRequestHandlers(type);
        }
        return false;
    };

    public async onRequest(
        handler: RequestHandler,
        internal: boolean
    ): Promise<boolean> {
        this.validate('onRequest', arguments);
        const doSubscribe =
            this.onRequestHandlers[0].length === 0 &&
            this.onRequestHandlers[1].length === 0;

        this.onRequestHandlers[Number(internal)].push(handler);
        if (doSubscribe) {
            return this.subscribeService(
                '/extsync/request',
                this.#onRequestHandler
            );
        }
        return true;
    }

    public async cancelRequest(
        handler: RequestHandler,
        internal: boolean
    ): Promise<boolean> {
        this.validate('onRequest', arguments);

        let res = true;
        const index = this.onRequestHandlers[Number(internal)].indexOf(handler);
        if (index !== -1) {
            this.onRequestHandlers[Number(internal)].splice(index, 1);
        }

        if (
            this.onRequestHandlers[0].length === 0 &&
            this.onRequestHandlers[1].length === 0
        ) {
            res = await this.unsubscribeService(
                '/extsync/request',
                this.#onRequestHandler
            );
        }
        return res;
    }

    #reconnect(): void {
        this.backOff++;
        printDebug(`Stream Reconnecting for the ${this.backOff} times`);
        this.close();
        this.#open().then(() => {
            this.#sendMessage('PATCH', '/services/2.1/websocket/open', {
                subscription: this.subscriptions.map((s) => `/2.1${s}`),
            });
        });
    }

    #filterCallback(
        callback: ServiceHandler,
        path: string,
        result: boolean
    ): void {
        if (result === true) {
            this.services[path] = this.services[path].filter(
                (item) => item !== callback
            );
        }
    }

    #handleMessage(type: string, event: IStreamEvent): void {
        printStream('handleMessage', type, event);
        const paths: string[] = [];
        const services: string[] = [];
        if (type === 'message' && event.path) {
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

        printStream('services', services, this.services);
        printStream('paths', paths, this.models);

        paths.forEach((path: string) => {
            this.models[path]?.forEach((model: IStreamModel) => {
                model.handleStream(event);
            });
        });

        services.forEach((service: string) => {
            const tmpList = this.services[service];
            tmpList?.forEach((callback: ServiceHandler) => {
                const p = callback(event);
                if (p) {
                    if (p === true) {
                        this.#filterCallback(callback, service, true);
                    } else {
                        p.then((res) => {
                            this.#filterCallback(
                                callback,
                                service,
                                res || false
                            );
                        });
                    }
                }
            });
        });
    }

    async #sendMessage(
        method: string,
        url: string,
        body: any | undefined = undefined
    ): Promise<boolean> {
        let res = false;
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
            const p = new Promise<boolean>((resolve) => {
                this.rpc_response[hash.id] = resolve;
            });
            this.socket?.send(toString(hash));
            printStream('Waiting for', hash);
            const timeoutPromise = new Promise<boolean>((resolve) => {
                setTimeout(resolve, 1000, false);
            });
            res = await Promise.race([p, timeoutPromise]);
            delete this.rpc_response[hash.id];
            printStream('ready', hash.id);
        } catch (e) {
            /* istanbul ignore next */
            printError(`Failed to send message on WebSocket: ${e}`);
            /* istanbul ignore next */
            delete this.rpc_response[hash.id];
        }
        return res;
    }

    #handleRPCMessage(message: any): boolean {
        if (message.jsonrpc) {
            if (message.result) {
                if (this.rpc_response[message.id]) {
                    this.rpc_response[message.id](message.result.value);
                }
                this.backOff = 1;

                printDebug(
                    `Stream rpc ${message.id} result: ${toString(
                        message.result.value
                    )}`
                );
            } else {
                printError(`Stream rpc error: ${toString(message.error)}`);
            }
            return true;
        }
        return false;
    }

    #handleWappstoMessage(message: any) {
        if (message.data?.uri !== 'extsync/wappsto/editor/console') {
            printDebug(`Stream message: ${toString(message)}`);
        }

        if (message.meta_object?.type === 'extsync') {
            const newData = message.extsync || message.data;
            if (newData.request) {
                this.#handleMessage('extsync/request', newData);
            } else if (newData.uri !== 'extsync/wappsto/editor/console') {
                this.#handleMessage('extsync', newData);
            }
            return;
        }
        this.#checkAndSendTrace(message);
        this.#handleMessage('message', message);
        clearTrace('ok');
    }

    async #handleStreamMessage(message: any): Promise<void> {
        if (this.#handleRPCMessage(message)) {
            return;
        }

        let messages: IStreamEvent[] = [];
        if (message.constructor !== Array) {
            messages = [message];
        } else {
            messages = message;
        }

        messages.forEach((msg) => {
            this.#handleWappstoMessage(msg);
        });
    }

    #addListeners(): void {
        if (!this.socket) {
            /* istanbul ignore next */
            return;
        }

        const reconnect = () => {
            this.reconnect_timer = setTimeout(() => {
                this.#reconnect();
            }, this.#getTimeout());
        };

        this.socket.onmessage = (ev: any) => {
            /* istanbul ignore else */
            if (ev.type !== 'message') {
                /* istanbul ignore next */
                printError("Can't handle binary stream data");
                return;
            }

            try {
                const message = JSON.parse(ev.data);
                this.#handleStreamMessage(message);
            } catch (e) {
                /* istanbul ignore next */
                printError('Failed to parse stream event');
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.socket.onerror = (_event: any) => {
            /* istanbul ignore next */
            printError(`Stream error: ${this.websocketUrl}`);
        };

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.socket.onclose = (_event: CloseEvent) => {
            if (this.socket && !this.ignoreReconnect) {
                reconnect();
            }
        };
    }

    #checkAndSendTrace(event: IStreamEvent): void {
        if (event?.meta?.trace) {
            trace(event.meta.trace);
        }
    }
}
