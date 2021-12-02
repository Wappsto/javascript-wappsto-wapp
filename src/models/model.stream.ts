import { StreamEvent, openStream } from './stream';
import { printError } from '../util/debug';
import { PermissionModel } from './model.permission';

type StreamCallback = () => void;

interface IStreamCallbacks {
    change: StreamCallback[];
    delete: StreamCallback[];
    create: StreamCallback[];
}

export class StreamModel extends PermissionModel {
    streamCallback: IStreamCallbacks = {} as IStreamCallbacks;

    constructor(type: string, version = '2.0') {
        super(type, version);
        this.streamCallback.change = [];
        this.streamCallback.delete = [];
        this.streamCallback.create = [];
    }

    public parse(_: any): boolean {
        return false;
    }

    path(): string {
        return '';
    }

    public onChange(callback: StreamCallback): void {
        openStream.subscribe(this);
        this.streamCallback.change.push(callback);
    }

    public onDelete(callback: StreamCallback): void {
        openStream.subscribe(this);
        this.streamCallback.delete.push(callback);
    }

    public onCreate(callback: StreamCallback): void {
        openStream.subscribe(this);
        this.streamCallback.create.push(callback);
    }

    handleStream(event: StreamEvent): void {
        switch (event?.event) {
            case 'create':
                this.streamCallback.create.forEach((cb) => {
                    cb();
                });
                break;
            case 'update':
                if (this.parse(event.data)) {
                    this.streamCallback.change.forEach((cb) => {
                        cb();
                    });
                }
                break;
            case 'delete':
                this.streamCallback.delete.forEach((cb) => {
                    cb();
                });
                break;
            default:
                printError('Unhandled stream event type: ' + event?.event);
                break;
        }
    }
}
