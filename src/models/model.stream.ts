import { openStream } from '../stream_helpers';
import { printDebug, printError } from '../util/debug';
import { checkList, compareCallback } from '../util/helpers';
import { StreamEvent, IStreamModel, StreamCallback } from '../util/interfaces';
import { Model } from './model';
import { PermissionModel } from './model.permission';

export type EventHandler = (event: StreamEvent) => boolean | void;

type StreamCallbacks = {
    [key: string]: StreamCallback[];
    event: StreamCallback[];
    change: StreamCallback[];
    delete: StreamCallback[];
    create: StreamCallback[];
};

type EventQueue = {
    [key: string]: StreamEvent[];
    event: StreamEvent[];
    change: StreamEvent[];
    delete: StreamEvent[];
    create: StreamEvent[];
};

export class StreamModel extends PermissionModel implements IStreamModel {
    #streamCallback: StreamCallbacks = {
        event: [],
        change: [],
        delete: [],
        create: [],
    } as StreamCallbacks;
    #eventQueue: EventQueue = {
        event: [],
        create: [],
        delete: [],
        change: [],
    };

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
