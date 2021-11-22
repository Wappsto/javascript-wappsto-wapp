import { StreamEvent } from './stream';
import StreamHandler from '../stream_handler';

type StreamCallback = () => void;

interface IStreamCallbacks {
    change: StreamCallback[];
    delete: StreamCallback[];
    create: StreamCallback[];
}

export class StreamModel {
    streamCallback: IStreamCallbacks = {} as IStreamCallbacks;

    public parse(_: any): boolean {
        return false;
    }

    path(): string {
        return '';
    }

    private subscribe(): void {
        StreamHandler.subscribe(this);
    }

    public onChange(callback: StreamCallback): void {
        this.subscribe();
        this.streamCallback.change.push(callback);
    }

    public onDelete(callback: StreamCallback): void {
        this.subscribe();
        this.streamCallback.delete.push(callback);
    }

    public onCreate(callback: StreamCallback): void {
        this.subscribe();
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
                console.log('Unhandled event type: ' + event?.event);
                break;
        }
    }
}
