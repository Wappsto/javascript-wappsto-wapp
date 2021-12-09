import { Model } from './model';
import { IMeta } from './meta';
import { session, baseUrl } from '../session';
import { StreamModel } from './model.stream';
import { printDebug, printError } from '../util/debug';
import { isUUID } from '../util/uuid';

var WebSocket = require('universal-websocket-client');

type SignalHandler = (event: string) => void;
type ServiceHandler = (event: any) => Promise<true | undefined>;

interface StreamModelHash {
    [key: string]: StreamModel[];
}

interface StreamServiceHash {
    [key: string]: ServiceHandler[];
}

interface StreamSignalHash {
    [key: string]: SignalHandler[];
}

export const enum EventType {
    create = 'create',
    update = 'update',
    delete = 'delete',
    direct = 'direct',
}

export class StreamEvent {
    meta: IMeta = {};
    path: string = '';
    timestamp: string = '';
    event: EventType = EventType.update;
    data?: any;
    extsync?: any;
    meta_object?: IMeta;
}

export class Stream extends Model {
    static endpoint = '/2.1/stream';
    socket?: WebSocket;
    websocketUrl: string = '';
    ignoreReconnect: boolean = false;
    models: StreamModelHash = {};
    services: StreamServiceHash = {};
    handlers: StreamSignalHash = {};
    subscriptions: string[] = [];
    opened: boolean = false;
    backoff: number = 1000;

    constructor() {
        super('stream', '2.1');
        this.websocketUrl = `${baseUrl}`;
        if (!this.websocketUrl.endsWith('/')){
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

    attributes(): string[] {
        return [];
    }

    private open(): Promise<void> {
        return new Promise<void>((resolve, _) => {
            let self = this;

            if (this.socket) {
                resolve();
                return;
            } else {
                let wait = () => {
                    setTimeout(() => {
                        if (this.socket) {
                            resolve();
                        } else {
                            wait();
                        }
                    }, 1000);
                };

                if (this.opened) {
                    wait();
                    return;
                }
            }
            this.opened = true;

            printDebug('Open WebSocket on ' + this.websocketUrl);
            this.ignoreReconnect = false;

            let openTimeout: ReturnType<typeof setTimeout> = setTimeout(() => {
                self.reconnect();
            }, 1000 + this.backoff);

            let socket = new WebSocket(this.websocketUrl);

            if (socket) {
                socket.onopen = () => {
                    this.backoff = 1000;
                    this.socket = socket;
                    clearTimeout(openTimeout);
                    this.addListeners();
                    resolve();
                };
            }
        });
    }

    close() {
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

        this.send_message(
            'POST',
            '/services/2.1/websocket/open/subscription',
            subscription
        );
    }

    public subscribe(model: StreamModel): void {
        this.open().then(() => {
            printDebug('Subscribe new model to stream');
            if (!this.models[model.path()]) {
                this.models[model.path()] = [];
            }
            this.models[model.path()].push(model);

            printDebug('Add subscription ' + model.path());

            this.addSubscription(model.path());
        });
    }

    public subscribeService(service: string, callback: ServiceHandler): void {
        this.open().then(() => {
            printDebug('Subscribe new service to stream');
            if (!this.services[service]) {
                this.services[service] = [];
            }
            this.services[service].push(callback);

            printDebug('Add service subscription ' + service);

            this.addSubscription(service);
        });
    }

    public addSignalHandler(type: string, handler: SignalHandler): void {
        this.open().then(() => {
            printDebug('Add Signal Handler to stream');
            if (!this.handlers[type]) {
                this.handlers[type] = [];
            }
            this.handlers[type].push(handler);
        });
    }

    private reconnect() {
        this.backoff = this.backoff * 2;
        printDebug('Stream Reconnecting');
        this.close();
        this.open().then(() => {
            this.send_message('PATCH', '/services/2.1/websocket/open', {
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

    private handleMessage(
        type: string,
        event: StreamEvent,
        _: string = ''
    ): void {
        let paths: string[] = [];
        let services: string[] = [];
        if (type === 'message') {
            let items: string[] = event.path
                .split('/')
                .filter((s) => s.length > 0);
            if (!items) {
                return;
            }

            let last = items[items.length - 1];

            paths.push(
                '/' + items.slice(items.length - 2, items.length).join('/')
            );

            if (!isUUID(last)) {
                paths.push(
                    '/' + items.slice(items.length - 3, items.length).join('/')
                );
            }

            services.push(`/${items[0]}`);
        } else {
            services.push(type);
        }
        paths.forEach((path) => {
            this.models[path]?.forEach((model: StreamModel) => {
                model.handleStream(event);
            });
        });
        services.forEach((path) => {
            let tmpList = this.services[path];
            tmpList?.forEach((callback: ServiceHandler) => {
                let p = callback(event);
                if (p) {
                    p.then((res) => {
                        if (res === true) {
                            this.services[path] = this.services[path].filter(
                                (item) => item !== callback
                            );
                        }
                    });
                }
            });
        });
    }

    private send_message(
        method: string,
        url: string,
        body: any | undefined = undefined
    ) {
        var hash = {
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
        //this.socket?.send(0x9);
    }

    private addListeners() {
        let self = this;

        if (!this.socket) {
            return;
        }

        let reconnect = () => {
            printDebug('Starting reconnect');
            setTimeout(function () {
                self.reconnect();
            }, self.backoff);
        };

        this.socket.onmessage = function (ev: any): void {
            let message;
            if (ev.type === 'message') {
                try {
                    message = JSON.parse(ev.data);
                } catch (e) {
                    printError('Failed to parse stream event');
                    return;
                }
            } else {
                printError("Can't handle binary stream data");
            }

            if (message.jsonrpc) {
                if (message.result) {
                    if (message.result.value !== true) {
                        printDebug(
                            `Stream rpc result: ${JSON.stringify(
                                message.result.value
                            )}`
                        );
                    }
                } else {
                    printError(
                        `Stream rpc error: ${JSON.stringify(message.error)}`
                    );
                }
                return;
            }

            let messages: StreamEvent[] = [];
            if (message.constructor !== Array) {
                messages = [message];
            } else {
                messages = message;
            }

            messages.forEach((msg: StreamEvent) => {
                if (msg.meta_object?.type === 'extsync') {
                    const newData = msg.extsync || msg.data;
                    if (newData.request) {
                        self.handleMessage('extsync_request', newData);
                    } else if (
                        newData.uri !== 'extsync/wappsto/editor/console'
                    ) {
                        self.handleMessage('extsync_request', newData);
                    }
                    return;
                }
                let traceId = self.checkAndSendTrace(msg);
                self.handleMessage('message', msg, traceId);
            });
        };

        this.socket.onerror = function (event: any) {
            try {
                self.handleEvent('error', event);
            } catch (e) {
                printError('Stream error: ' + self.websocketUrl);
            }
        };

        this.socket.onclose = function (event: CloseEvent) {
            if (self.ignoreReconnect) {
                self.handleEvent('close', event);
            } else {
                reconnect();
            }
        };
    }

    private checkAndSendTrace(_: StreamEvent): string {
        return '';
        /*if (message.hasOwnProperty('meta') && message.meta.hasOwnProperty('trace')) {
          return Tracer.sendTrace(this.stream.util.session, message.meta.trace, null, null, {
          'stream_id': message.meta.id
          });
          }*/
    }

    public static fetch = async (): Promise<Stream[]> => {
        let data: any = await Model.fetch(Stream.endpoint);
        return Stream.fromArray(data);
    };
}

let openStream: Stream = new Stream();

export { openStream };
