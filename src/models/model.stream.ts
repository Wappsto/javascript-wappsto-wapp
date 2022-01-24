import { Model } from './model';
import { openStream } from './stream';
import { printError } from '../util/debug';
import { PermissionModel } from './model.permission';
import { IStreamModel, IStreamEvent, StreamCallback } from '../util/interfaces';

interface IStreamCallbacks {
    change: StreamCallback[];
    delete: StreamCallback[];
    create: StreamCallback[];
}

export class StreamModel extends PermissionModel implements IStreamModel {
    streamCallback: IStreamCallbacks = {} as IStreamCallbacks;

    constructor(type: string, version = '2.0') {
        super(type, version);
        this.clearAllCallbacks();
    }

    public onChange(callback: StreamCallback): void {
        Model.checker.StreamCallback.check(callback);
        openStream.subscribe(this);
        this.streamCallback.change.push(callback);
    }

    public onDelete(callback: StreamCallback): void {
        Model.checker.StreamCallback.check(callback);
        openStream.subscribe(this);
        this.streamCallback.delete.push(callback);
    }

    public onCreate(callback: StreamCallback): void {
        Model.checker.StreamCallback.check(callback);
        openStream.subscribe(this);
        this.streamCallback.create.push(callback);
    }

    public clearAllCallbacks(): void {
        this.streamCallback.change = [];
        this.streamCallback.delete = [];
        this.streamCallback.create = [];
    }

    handleStream(event: IStreamEvent): void {
        switch (event?.event) {
            case 'create':
                this.streamCallback.create.forEach((cb) => {
                    cb(this);
                });
                break;
            case 'update':
                if (this.parse(event.data)) {
                    this.streamCallback.change.forEach((cb) => {
                        cb(this);
                    });
                }
                break;
            case 'delete':
                this.streamCallback.delete.forEach((cb) => {
                    cb(this);
                });
                break;
            default:
                printError('Unhandled stream event type: ' + event?.event);
                break;
        }
    }
}
