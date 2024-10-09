import { openStream } from '../stream_helpers';
import { printDebug, printError } from '../util/debug';
import { checkList, compareCallback } from '../util/helpers';
import {
    StreamEvent,
    IStreamModel,
    StreamCallback,
    StreamHandler,
    StreamCallbacks,
    EventQueue,
    StreamHandlerCallbacks,
    EventHandler,
} from '../util/types';
import { Model } from './model';
import { PermissionModel } from './model.permission';

function getServiceFromEndpoint(obj: any): string {
    return obj.endpoint.split('/').at(-1);
}

function getStreamCallback(type: string, list: StreamHandler[]) {
    return async (event: StreamEvent) => {
        if (event.event === type) {
            for (let i = 0; i < list.length; i++) {
                await list[i](event);
            }
        }
        return false;
    };
}

export class StreamModel extends PermissionModel implements IStreamModel {
    #streamCallback: StreamCallbacks = {
        event: [],
        change: [],
        delete: [],
        create: [],
    };
    #eventQueue: EventQueue = {
        event: [],
        create: [],
        delete: [],
        change: [],
    };
    static streamCallback: StreamHandlerCallbacks = {
        update: [],
        delete: [],
        create: [],
    };

    static async onCreate<T>(
        this: new () => T,
        callback: StreamHandler
    ): Promise<boolean> {
        Model.validateMethod('Model', 'onCreate', arguments);

        const list = (this as unknown as StreamModel).streamCallback.create;
        const service = getServiceFromEndpoint(this);
        const cb = getStreamCallback('create', list);

        list.push(callback);

        if (list.length === 1) {
            return await openStream.subscribeEvent(`/${service}`, cb);
        }
        return true;
    }

    static async onChange<T>(
        this: new () => T,
        callback: StreamHandler
    ): Promise<boolean> {
        Model.validateMethod('Model', 'onChange', arguments);

        const list = (this as unknown as StreamModel).streamCallback.update;
        const service = getServiceFromEndpoint(this);
        const cb = getStreamCallback('update', list);

        list.push(callback);

        if (list.length === 1) {
            return await openStream.subscribeEvent(`/${service}`, cb);
        }
        return true;
    }

    static async onDelete<T>(
        this: new () => T,
        callback: StreamHandler
    ): Promise<boolean> {
        Model.validateMethod('Model', 'onDelete', arguments);

        const list = (this as unknown as StreamModel).streamCallback.delete;
        const service = getServiceFromEndpoint(this);
        const cb = getStreamCallback('delete', list);

        list.push(callback);

        if (list.length === 1) {
            return await openStream.subscribeEvent(`/${service}`, cb);
        }
        return true;
    }

    static async cancelCallback(
        all: StreamHandlerCallbacks,
        type: 'create' | 'update' | 'delete',
        callback: StreamHandler
    ): Promise<boolean> {
        const index = all[type].findIndex((c) => compareCallback(c, callback));
        if (index !== -1) {
            all[type].splice(index, 1);
        } else {
            printDebug('Failed to find callback to remove');
            return false;
        }

        if (
            all.update.length === 0 &&
            all.delete.length === 0 &&
            all.create.length === 0
        ) {
            const list = (this as unknown as StreamModel).streamCallback.delete;
            const service = getServiceFromEndpoint(this);
            const cb = getStreamCallback(type, list);

            return await openStream.unsubscribeEvent(service, cb);
        }
        return true;
    }

    static async cancelOnCreate<T>(
        this: new () => T,
        callback: StreamCallback
    ): Promise<boolean> {
        Model.validateMethod('Model', 'cancelOnCreate', arguments);

        const m = this as unknown as StreamModel;
        return m.cancelCallback(m.streamCallback, 'create', callback);
    }

    static async cancelOnChange<T>(
        this: new () => T,
        callback: StreamCallback
    ): Promise<boolean> {
        Model.validateMethod('Model', 'cancelOnChange', arguments);

        const m = this as unknown as StreamModel;
        return m.cancelCallback(m.streamCallback, 'update', callback);
    }

    static async cancelOnDelete<T>(
        this: new () => T,
        callback: StreamCallback
    ): Promise<boolean> {
        Model.validateMethod('Model', 'cancelOnDelete', arguments);

        const m = this as unknown as StreamModel;
        return m.cancelCallback(m.streamCallback, 'delete', callback);
    }

    async onEvent(callback: StreamCallback): Promise<boolean> {
        Model.validateMethod('Model', 'onEvent', arguments);
        const res = await openStream.subscribe(this);
        if (!checkList(this.#streamCallback.event, callback)) {
            this.#streamCallback.event.push(callback);
        } else {
            printDebug(`Skipping duplicate event callback for ${this.id()}`);
        }
        return res;
    }

    async onChange(callback: StreamCallback): Promise<boolean> {
        Model.validateMethod('Model', 'onChange', arguments);
        const res = await openStream.subscribe(this);
        if (!checkList(this.#streamCallback.change, callback)) {
            this.#streamCallback.change.push(callback);
        } else {
            printDebug(`Skipping duplicate change callback for ${this.id()}`);
        }
        return res;
    }

    async onDelete(callback: StreamCallback): Promise<boolean> {
        Model.validateMethod('Model', 'onDelete', arguments);
        const res = await openStream.subscribe(this);
        if (!checkList(this.#streamCallback.delete, callback)) {
            this.#streamCallback.delete.push(callback);
        } else {
            printDebug(`Skipping duplicate delete callback for ${this.id()}`);
        }
        return res;
    }

    async onCreate(callback: StreamCallback): Promise<boolean> {
        Model.validateMethod('Model', 'onDelete', arguments);
        const res = await openStream.subscribe(this);
        if (this.#streamCallback.create.indexOf(callback) === -1) {
            this.#streamCallback.create.push(callback);
        } else {
            printDebug(`Skipping duplicate create callback for ${this.id()}`);
        }
        return res;
    }

    async cancelOnEvent(callback: StreamCallback): Promise<boolean> {
        return this.#cancelCallback(this.#streamCallback.event, callback);
    }

    async cancelOnChange(callback: StreamCallback): Promise<boolean> {
        return this.#cancelCallback(this.#streamCallback.change, callback);
    }

    async cancelOnDelete(callback: StreamCallback): Promise<boolean> {
        return this.#cancelCallback(this.#streamCallback.delete, callback);
    }

    async cancelOnCreate(callback: StreamCallback): Promise<boolean> {
        return this.#cancelCallback(this.#streamCallback.create, callback);
    }

    async #cancelCallback(
        list: StreamCallback[],
        callback: StreamCallback
    ): Promise<boolean> {
        let res = true;
        const index = list.findIndex((c) => compareCallback(c, callback));
        if (index !== -1) {
            list.splice(index, 1);
        } else {
            res = false;
            printDebug('Failed to find callback to remove');
        }
        if (
            this.#streamCallback.event.length === 0 &&
            this.#streamCallback.change.length === 0 &&
            this.#streamCallback.delete.length === 0 &&
            this.#streamCallback.create.length === 0
        ) {
            res = await openStream.unsubscribe(this);
        }
        return res;
    }

    async clearAllCallbacks(): Promise<boolean> {
        const res = await openStream.unsubscribe(this);
        this.#streamCallback.event = [];
        this.#streamCallback.change = [];
        this.#streamCallback.delete = [];
        this.#streamCallback.create = [];
        return res;
    }

    async #runQueue(
        type: string,
        handlers: StreamCallback[],
        eventHandler?: EventHandler
    ): Promise<void> {
        if (this.#eventQueue[type].length === 0) {
            return;
        }

        if (
            !eventHandler ||
            eventHandler(this.#eventQueue[type][0]) !== false
        ) {
            for (let i = 0; i < handlers.length; i++) {
                await handlers[i](this);
            }
        }

        if (type === 'change') {
            for (let i = 0; i < this.#streamCallback.event.length; i++) {
                await this.#streamCallback.event[i](this);
            }
        }

        this.#eventQueue[type].shift();

        this.#runQueue(type, handlers, eventHandler);
    }

    #enqueueEvent(
        type: string,
        event: StreamEvent,
        eventHandler?: EventHandler
    ): void {
        this.#eventQueue[type].push(event);

        if (this.#eventQueue[type].length === 1) {
            this.#runQueue(type, this.#streamCallback[type], eventHandler);
        }
    }

    async handleStream(event: StreamEvent): Promise<void> {
        switch (event.event) {
            case 'create':
                this.#enqueueEvent('create', event, (event: StreamEvent) => {
                    this.parseChild(event.data ?? {});
                });
                break;
            case 'update':
                this.#enqueueEvent('change', event, (event: StreamEvent) => {
                    return this.parse(event.data ?? {});
                });
                break;
            case 'delete':
                this.#enqueueEvent('delete', event);
                break;
            /* istanbul ignore next */
            default:
                printError(`Unhandled stream event type: ${event.event}`);
                break;
        }
    }
}
