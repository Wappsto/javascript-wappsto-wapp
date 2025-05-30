import WebSocket from 'universal-websocket-client';
import { baseUrl, extSyncToken, session } from '../session';
import { _config } from '../util/config';
import {
    fatalError,
    printDebug,
    printError,
    printStream,
    printWarning,
} from '../util/debug';
import {
    compareCallback,
    isUUID,
    isVersion,
    toSafeString,
} from '../util/helpers';
import wappsto, { getErrorMessage } from '../util/http_wrapper';
import {
    ExtsyncResponse,
    IStreamModel,
    JSONValue,
    RequestHandler,
    RPCMessage,
    RPCResult,
    ServiceHandler,
    StreamData,
    StreamEvent,
    StreamHandler,
} from '../util/types';
import { Model } from './model';

export class IgnoreStreamEventException extends Error {
    constructor(msg: string) {
        super(msg);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, IgnoreStreamEventException.prototype);
    }
}

interface StreamModelHash {
    [key: string]: IStreamModel[];
}

interface StreamServiceHash {
    [key: string]: ServiceHandler[];
}

interface StreamHandlerHash {
    [key: string]: StreamHandler[];
}

export class Stream extends Model {
    static endpoint = '/2.1/stream';
    websocketUrl = '';
    websocketService = '';

    #socket?: WebSocket;
    #ignoreReconnect = false;
    #models: StreamModelHash = {};
    #services: StreamServiceHash = {};
    #events: StreamHandlerHash = {};
    #subscriptions: string[] = [];
    #opened = false;
    #backOff = 1;
    #waiting: ((value: void | PromiseLike<void>) => void)[] = [];
    #onRequestHandlers: Record<number, RequestHandler[]> = { 0: [], 1: [] };
    #onRequestEvents: Record<number, ExtsyncResponse[]> = { 0: [], 1: [] };
    #rpc_response: Record<
        number,
        (value: boolean | PromiseLike<boolean>) => void
    > = {};
    #reconnect_timer?: ReturnType<typeof setTimeout> = undefined;
    #enableWatchdog = true;
    #watchdogTimer?: ReturnType<typeof setTimeout> = undefined;
    #watchDogTriggerTimeout?: ReturnType<typeof setTimeout> = undefined;
    #openTimeout?: ReturnType<typeof setTimeout> = undefined;
    #lastStreamMessage = 0;

    constructor(service?: string, startWatchdog = true) {
        super('stream');
        this.#enableWatchdog = startWatchdog;
        this.websocketService = service ?? 'websocket';
        this.websocketUrl = `${baseUrl}`;
        if (!this.websocketUrl.endsWith('/')) {
            this.websocketUrl += `/`;
        }
        this.websocketUrl += `2.1/${this.websocketService}/open`;

        /* istanbul ignore next */
        if (
            !this.websocketUrl.startsWith('http') &&
            typeof window === 'object'
        ) {
            const w = window;
            if (w.location && w.location.origin) {
                this.websocketUrl = `${w.location.origin}${this.websocketUrl}`;
            }
        }
        this.websocketUrl = this.websocketUrl.replace(/^http/, 'ws');

        this.websocketUrl += `?X-Session=${session}`;
    }

    reset(): void {
        this.#ignoreReconnect = false;
        this.#opened = false;
        this.#models = {};
        this.#services = {};
        this.#subscriptions = [];
        this.#onRequestHandlers = { 0: [], 1: [] };
        this.#onRequestEvents = { 0: [], 1: [] };
        this.#waiting = [];
        this.#backOff = 1;
        Object.values(this.#rpc_response).forEach((resolve) => {
            printStream('Clean up', resolve);
            resolve(false);
        });
        this.#rpc_response = {};
        clearTimeout(this.#reconnect_timer);
        clearTimeout(this.#watchDogTriggerTimeout);
        clearTimeout(this.#watchdogTimer);
        clearTimeout(this.#openTimeout);
    }

    #getTimeout(): number {
        /* istanbul ignore next */
        if (this.#backOff >= _config.reconnectCount) {
            fatalError(
                `Stream failed to connect after ${
                    this.#backOff
                } attempts, exit!`
            );
            return Infinity;
        }
        return this.#backOff * 2 * 1000;
    }

    #open(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.#socket) {
                resolve();
                return;
            } else {
                if (this.#opened) {
                    this.#waiting.push(resolve);
                    return;
                }
            }
            this.#opened = true;

            printDebug(`Open WebSocket on ${this.websocketUrl}`);
            this.#ignoreReconnect = false;

            this.#openTimeout = setTimeout(() => {
                /* istanbul ignore next */
                this.#reconnect();
            }, 1000 + this.#getTimeout());

            try {
                const socket = new WebSocket(this.websocketUrl);

                socket.onopen = () => {
                    this.#socket = socket;
                    clearTimeout(this.#openTimeout);
                    this.#addListeners();
                    resolve();
                    this.#waiting.forEach((r) => {
                        r();
                    });
                    this.#waiting = [];
                };
            } catch (e) {
                /* istanbul ignore next */
                printDebug(`Failed to open WebSocket: ${e}`);
            }
        });
    }

    close(): void {
        if (this.#socket) {
            printDebug(`Closing WebSocket on ${this.url()}`);
            this.#ignoreReconnect = true;
            this.#socket.close();
            this.#opened = false;
            this.#socket = undefined;
        }
    }

    async #addSubscription(subscription: string): Promise<boolean> {
        if (this.#subscriptions.includes(subscription)) {
            return true;
        }

        this.#subscriptions.push(subscription);

        return this.#sendMessage(
            'POST',
            `/services/2.1/${this.websocketService}/open/subscription`,
            `/2.1${subscription}`
        );
    }

    async #removeSubscription(subscription: string): Promise<boolean> {
        if (!this.#subscriptions.includes(subscription)) {
            /* istanbul ignore next */
            return true;
        }

        const index = this.#subscriptions.indexOf(subscription);
        if (index !== -1) {
            this.#subscriptions.splice(index, 1);
        }

        return this.#sendMessage(
            'DELETE',
            `/services/2.1/${this.websocketService}/open/subscription`,
            `/2.1${subscription}`
        );
    }

    async subscribe(model: IStreamModel, full = false): Promise<boolean> {
        this.validate('subscribe', arguments);
        const path = this.#generatePathFromService(model.path(), full);

        if (!this.#models[path]) {
            this.#models[path] = [];
        }

        if (this.#models[path].indexOf(model) === -1) {
            this.#models[path].push(model);
            await this.#open();

            printDebug(`Add subscription: ${model.path()}`);
            return this.#addSubscription(path);
        }
        return false;
    }

    async unsubscribe(model: IStreamModel): Promise<boolean> {
        this.validate('subscribe', arguments);
        if (this.#models[model.path()]) {
            const index = this.#models[model.path()].indexOf(model);
            if (index !== -1) {
                this.#models[model.path()].splice(index, 1);
            }

            return this.#removeSubscription(model.path());
        }
        return true;
    }

    async subscribeInternal(
        type: string,
        handler: RequestHandler
    ): Promise<boolean> {
        this.validate('subscribeInternal', arguments);
        return this.subscribeService('extsync', async (data: StreamData) => {
            const d = data as unknown as ExtsyncResponse;
            let res: JSONValue = false;
            try {
                let body;
                if (typeof d.body === 'string') {
                    body = JSON.parse(d.body);
                } else {
                    body = d.body;
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

    async subscribeService(
        service: string,
        handler: ServiceHandler,
        full = false
    ): Promise<boolean> {
        this.validate('subscribeService', arguments);
        await this.#open();

        const path = this.#generatePathFromService(service, full);
        if (!this.#services[path]) {
            this.#services[path] = [];
        }
        this.#services[path].push(handler);

        printDebug(`Add service subscription: ${path}`);

        return this.#addSubscription(path);
    }

    async unsubscribeService(
        service: string,
        handler: ServiceHandler,
        full = false
    ): Promise<boolean> {
        this.validate('subscribeService', arguments);
        const path = this.#generatePathFromService(service, full);
        let res = true;

        if (this.#services[path] !== undefined) {
            const index = this.#services[path].findIndex((c) =>
                compareCallback(c, handler)
            );
            if (index !== -1) {
                this.#services[path].splice(index, 1);
            }

            if (
                this.#services[path].length === 0 &&
                !this.#events[path]?.length
            ) {
                res = await this.#removeSubscription(path);
            }
        }
        return res;
    }

    async subscribeEvent(
        service: string,
        handler: StreamHandler
    ): Promise<boolean> {
        this.validate('subscribeEvent', arguments);
        await this.#open();

        const path = this.#generatePathFromService(service, false);
        if (!this.#events[path]) {
            this.#events[path] = [];
        }
        this.#events[path].push(handler);

        printDebug(`Add event subscription: ${path}`);

        return this.#addSubscription(path);
    }

    async unsubscribeEvent(
        service: string,
        handler: StreamHandler
    ): Promise<boolean> {
        this.validate('subscribeEvent', arguments);
        const path = this.#generatePathFromService(service, false);
        let res = true;

        if (this.#events[path] !== undefined) {
            const index = this.#events[path].findIndex((c) =>
                compareCallback(c, handler)
            );

            //const index = this.#events[path].indexOf(handler);
            if (index !== -1) {
                this.#events[path].splice(index, 1);
            } else {
                printDebug('Failed to find callback to remove');
            }

            if (
                this.#events[path].length === 0 &&
                !this.#services[path]?.length
            ) {
                res = await this.#removeSubscription(path);
            }
        }
        return res;
    }

    #sendPing() {
        this.#socket?.send('ping');
    }

    async sendEvent(type: string, msg: JSONValue): Promise<JSONValue> {
        this.validate('sendEvent', arguments);

        let result = {};
        try {
            const data = {
                type: type,
                message: msg,
            };
            const response = await wappsto.post('/2.1/extsync', data);
            result = response.data;
        } catch (e: unknown) {
            /* istanbul ignore next */
            const errorMsg = getErrorMessage(e);
            printError(
                `Failed to send ${type} event (${toSafeString(
                    msg
                )}) because: ${errorMsg}`
            );
        }
        return result;
    }

    async sendRequest(msg: JSONValue): Promise<JSONValue> {
        this.validate('sendRequest', arguments);

        let result = {};
        try {
            const response = await wappsto.post('/2.1/extsync/request', msg);
            result = response.data;
        } catch (e: any) {
            /* istanbul ignore next */
            if (e?.response?.data?.code !== undefined) {
                const errorMsg = getErrorMessage(e);
                printError(
                    `Failed to send request (${toSafeString(
                        msg
                    )}) because: ${errorMsg}`
                );
            } else {
                result = e?.response?.data;
            }
        }
        return result;
    }

    async #sendResponse(
        event: ExtsyncResponse,
        code: number,
        msg: JSONValue,
        headers?: Record<string, string>
    ): Promise<void> {
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
        } catch (e: unknown) {
            /* istanbul ignore next */
            const errorMsg = getErrorMessage(e);
            /* istanbul ignore next */
            printError(
                `Failed to send response (${toSafeString(
                    msg
                )}) with code ${code} because: ${errorMsg}`
            );
        }
    }

    async #runRequestHandlers(type: number) {
        if (this.#onRequestEvents[type].length === 0) {
            return;
        }

        const event = this.#onRequestEvents[type][0];
        try {
            const handlers = this.#onRequestHandlers[type];
            for (let i = 0; i < handlers.length; i++) {
                try {
                    let path = '';
                    const query: Record<string, string> = {};
                    try {
                        const arrUri = event.uri?.split('?');
                        if (arrUri) {
                            path = `/${arrUri[0]}`;
                            if (arrUri[1]) {
                                arrUri[1].split('&').forEach((item: string) => {
                                    const items = item.split('=');
                                    query[items[0]] = items[1];
                                });
                            }
                        }
                    } catch (e: unknown) {
                        printWarning(
                            `Failed to decode ExtSync url (${event.uri}): ${
                                (e as Error).message
                            }`
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
                    let headers: Record<string, string> | undefined = undefined;

                    let data: JSONValue;
                    try {
                        data = JSON.parse(res as string);
                    } catch (e) {
                        data = res;
                    }

                    if (data && typeof data === 'object' && 'body' in data) {
                        body = data.body;
                        if ('code' in data) {
                            code =
                                typeof data.code === 'number'
                                    ? data.code
                                    : parseInt(data.code as string);
                        }
                        if (
                            'headers' in data &&
                            typeof data.headers === 'object' &&
                            !Array.isArray(data.headers)
                        ) {
                            headers = data.headers as Record<string, string>;
                        }
                    }
                    this.#sendResponse(event, code, body, headers);
                } catch (err: unknown) {
                    if (!(err instanceof IgnoreStreamEventException)) {
                        printError(err);
                        this.#sendResponse(event, 400, {
                            error: (err as Error).message,
                        });
                    }
                }
            }
        } catch (e) {
            /* istanbul ignore next */
            this.#sendResponse(event, 501, e as JSONValue);
            /* istanbul ignore next */
            printError('An error happened when calling request handler');
            /* istanbul ignore next */
            printError(toSafeString(e));
        }

        this.#onRequestEvents[type].shift();

        this.#runRequestHandlers(type);
    }

    #onRequestHandler = (data: StreamData): boolean => {
        const d = data as unknown as ExtsyncResponse;
        const type = Number(d.uri === 'extsync/');

        this.#onRequestEvents[type].push(d);

        if (this.#onRequestEvents[type].length === 1) {
            this.#runRequestHandlers(type);
        }
        return false;
    };

    async onRequest(
        handler: RequestHandler,
        internal: boolean
    ): Promise<boolean> {
        this.validate('onRequest', arguments);
        const doSubscribe =
            this.#onRequestHandlers[0].length === 0 &&
            this.#onRequestHandlers[1].length === 0;

        this.#onRequestHandlers[Number(internal)].push(handler);
        if (doSubscribe) {
            return this.subscribeService(
                '/extsync/request',
                this.#onRequestHandler
            );
        }
        return true;
    }

    async cancelRequest(
        handler: RequestHandler,
        internal: boolean
    ): Promise<boolean> {
        this.validate('onRequest', arguments);

        let res = true;
        const index =
            this.#onRequestHandlers[Number(internal)].indexOf(handler);
        if (index !== -1) {
            this.#onRequestHandlers[Number(internal)].splice(index, 1);
        }

        if (
            this.#onRequestHandlers[0].length === 0 &&
            this.#onRequestHandlers[1].length === 0
        ) {
            res = await this.unsubscribeService(
                '/extsync/request',
                this.#onRequestHandler
            );
        }
        return res;
    }

    #reconnect(): void {
        this.#backOff++;
        printDebug(`Stream Reconnecting for the ${this.#backOff} times`);
        this.close();
        this.#open().then(() => {
            this.#sendMessage(
                'PATCH',
                `/services/2.1/${this.websocketService}/open`,
                {
                    subscription: this.#subscriptions.map((s) => `/2.1${s}`),
                }
            );
        });
    }

    #removeCallbackUsingFilter(
        callback: ServiceHandler,
        path: string,
        result: boolean
    ): void {
        if (result === true) {
            this.#services[path] = this.#services[path].filter(
                (item) => item !== callback
            );
        }
    }

    #handleService(type: string, event: StreamEvent, data: StreamData): void {
        this.#handleStreamService([`/${type}`], [], event, data);
    }

    #handleMessage(type: string, event: StreamEvent, data?: StreamData): void {
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
        }

        this.#handleStreamService(services, paths, event, data);
    }

    #handleStreamService(
        services: string[],
        paths: string[],
        event: StreamEvent,
        data?: StreamData
    ): void {
        printStream('services', services, this.#services);
        printStream('paths', paths, this.#models);

        paths.forEach((path: string) => {
            this.#models[path]?.forEach((model: IStreamModel) => {
                model.handleStream(event);
            });
        });

        services.forEach((service: string) => {
            this.#events[service]?.forEach((callback: StreamHandler) => {
                callback(event);
            });
        });

        if (!data) {
            return;
        }

        services.forEach((service: string) => {
            const tmpList = this.#services[service];
            tmpList?.forEach((callback: ServiceHandler) => {
                const p = callback(data);
                if (p) {
                    Promise.resolve(p).then((res) => {
                        this.#removeCallbackUsingFilter(
                            callback,
                            service,
                            !!res || false
                        );
                    });
                }
            });
        });
    }

    async #sendMessage(
        method: string,
        url: string,
        body: JSONValue | undefined = undefined
    ): Promise<boolean> {
        let res = false;
        const hash: RPCMessage = {
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
            `Sending a ${method} message to ${url}: ${toSafeString(hash)}`
        );
        try {
            const p = new Promise<boolean>((resolve) => {
                this.#rpc_response[hash.id] = resolve;
            });
            this.#socket?.send(toSafeString(hash));
            printStream('Waiting for', hash);
            const timeoutPromise = new Promise<boolean>((resolve) => {
                setTimeout(resolve, 1000, false);
            });
            res = await Promise.race([p, timeoutPromise]);
            delete this.#rpc_response[hash.id];
            printStream('RPC response ready for', hash.id, 'with result', res);
        } catch (e) {
            /* istanbul ignore next */
            printError(`Failed to send message on WebSocket: ${e}`);
            /* istanbul ignore next */
            delete this.#rpc_response[hash.id];
        }
        return res;
    }

    #handleRPCMessage(message: RPCResult): boolean {
        if (message.jsonrpc) {
            if (message.result) {
                if (this.#rpc_response[message.id]) {
                    this.#rpc_response[message.id](message.result.value);
                }
                this.#backOff = 1;

                printDebug(
                    `Stream rpc ${message.id} result: ${toSafeString(
                        message.result.value
                    )}`
                );
            } else {
                printError(`Stream rpc error: ${toSafeString(message.error)}`);
            }
            return true;
        }
        return false;
    }

    #handleWappstoMessage(message: StreamEvent) {
        const newData = (message.extsync ||
            message.data) as unknown as ExtsyncResponse;
        if (!newData?.uri?.startsWith('/console')) {
            printDebug(`Stream message: ${toSafeString(message)}`);
        }

        if (message.meta_object?.type === 'extsync') {
            if (newData.body === '{"type":"ping","message":"pong"}') {
                return;
            }

            if (newData.request) {
                this.#handleService(
                    'extsync/request',
                    message,
                    newData as unknown as StreamData
                );
            } else if (!newData.uri?.startsWith('/console')) {
                this.#handleService(
                    'extsync',
                    message,
                    newData as unknown as StreamData
                );
            }
            return;
        }
        this.#handleMessage('message', message, message.data);
    }

    async #handleStreamMessage(
        message: StreamEvent | RPCResult
    ): Promise<void> {
        if (this.#handleRPCMessage(message as RPCResult)) {
            return;
        }

        let messages: StreamEvent[] = [];
        if (message.constructor !== Array) {
            messages = [message as StreamEvent];
        } else {
            messages = message;
        }

        messages.forEach((msg) => {
            this.#handleWappstoMessage(msg);
        });
    }

    #triggerWatchdog(): void {
        const diff = Math.trunc((Date.now() - this.#lastStreamMessage) / 60000);
        printDebug(
            `Trigger Watchdog because we did not receive any stream messages for ${diff} minutes`
        );
        this.#sendPing();
        this.#watchDogTriggerTimeout = setTimeout(() => {
            printWarning('Reconnecting stream because Watchdog Triggered!');
            this.#reconnect();
        }, 5000);
    }

    #startWatchDog(): void {
        if (!this.#enableWatchdog) {
            if (this.#watchdogTimer) {
                clearTimeout(this.#watchdogTimer);
            }
            return;
        }

        this.#lastStreamMessage = Date.now();

        if (this.#watchdogTimer) {
            clearTimeout(this.#watchdogTimer);
        } else {
            printDebug(
                `Starting Stream Watchdog with timeout of ${_config.watchdogTimeout} minutes`
            );
        }

        if (this.#watchDogTriggerTimeout) {
            printDebug('Stream is alive');
            clearTimeout(this.#watchDogTriggerTimeout);
            this.#watchDogTriggerTimeout = undefined;
        }

        this.#watchdogTimer = setTimeout(() => {
            this.#triggerWatchdog();
        }, _config.watchdogTimeout * 60000);
    }

    #addListeners(): void {
        if (!this.#socket) {
            /* istanbul ignore next */
            return;
        }

        const reconnect = () => {
            this.#reconnect_timer = setTimeout(() => {
                this.#reconnect();
            }, this.#getTimeout());
        };

        this.#socket.onmessage = (ev: { type: string; data: string }) => {
            this.#startWatchDog();

            /* istanbul ignore next */
            if (ev.type !== 'message') {
                /* istanbul ignore next */
                printError("Can't handle binary stream data");
                return;
            }

            if (ev.data === 'pong') {
                printStream('Received a Stream Pong message');
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
        this.#socket.onerror = (_event: unknown) => {
            /* istanbul ignore next */
            printError(`Stream error: ${this.websocketUrl}`);
        };

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.#socket.onclose = (_event: CloseEvent) => {
            if (this.#socket && !this.#ignoreReconnect) {
                reconnect();
            }
        };
    }
}
