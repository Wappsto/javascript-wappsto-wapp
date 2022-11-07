import { Model } from './model';
import { openStream } from '../stream_helpers';
import { printError } from '../util/debug';
import { checkList } from '../util/helpers';
import { PermissionModel } from './model.permission';
import { IStreamModel, IStreamEvent, StreamCallback } from '../util/interfaces';

interface IStreamCallbacks {
    event: StreamCallback[];
    change: StreamCallback[];
    delete: StreamCallback[];
    create: StreamCallback[];
}

export class StreamModel extends PermissionModel implements IStreamModel {
    streamCallback: IStreamCallbacks = {
        event: [],
        change: [],
        delete: [],
        create: [],
    } as IStreamCallbacks;

    public async onEvent(callback: StreamCallback): Promise<boolean> {
        Model.validateMethod('Model', 'onEvent', arguments);
        const res = await openStream.subscribe(this);
        if (!checkList(this.streamCallback.event, callback)) {
            this.streamCallback.event.push(callback);
        }
        return res;
    }

    public async onChange(callback: StreamCallback): Promise<boolean> {
        Model.validateMethod('Model', 'onChange', arguments);
        const res = await openStream.subscribe(this);
        if (!checkList(this.streamCallback.change, callback)) {
            this.streamCallback.change.push(callback);
        }
        return res;
    }

    public async onDelete(callback: StreamCallback): Promise<boolean> {
        Model.validateMethod('Model', 'onDelete', arguments);
        const res = await openStream.subscribe(this);
        if (!checkList(this.streamCallback.delete, callback)) {
            this.streamCallback.delete.push(callback);
        }
        return res;
    }

    public async onCreate(callback: StreamCallback): Promise<boolean> {
        Model.validateMethod('Model', 'onDelete', arguments);
        const res = await openStream.subscribe(this);
        if (this.streamCallback.create.indexOf(callback) === -1) {
            this.streamCallback.create.push(callback);
        }
        return res;
    }

    public async clearAllCallbacks(): Promise<boolean> {
        const res = await openStream.unsubscribe(this);
        this.streamCallback.event = [];
        this.streamCallback.change = [];
        this.streamCallback.delete = [];
        this.streamCallback.create = [];
        return res;
    }

    async handleStream(event: IStreamEvent): Promise<void> {
        switch (event.event) {
            case 'create':
                this.parseChildren(event.data);
                for (let i = 0; i < this.streamCallback.create.length; i++) {
                    const cb = this.streamCallback.create[i];
                    await cb(this);
                }
                break;
            case 'update':
                if (this.parse(event.data)) {
                    for (
                        let i = 0;
                        i < this.streamCallback.change.length;
                        i++
                    ) {
                        const cb = this.streamCallback.change[i];
                        await cb(this);
                    }
                }
                for (let i = 0; i < this.streamCallback.event.length; i++) {
                    const cb = this.streamCallback.event[i];
                    await cb(this);
                }
                break;
            case 'delete':
                for (let i = 0; i < this.streamCallback.delete.length; i++) {
                    const cb = this.streamCallback.delete[i];
                    await cb(this);
                }
                break;
            /* istanbul ignore next */
            default:
                printError(`Unhandled stream event type: ${event.event}`);
                break;
        }
    }
}
