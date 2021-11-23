import { Model } from './model';
import { IMeta } from './meta';

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

    constructor() {
        super('stream', '2.1');
    }

    attributes(): string[] {
        return [];
    }

    public static fetch = async (): Promise<Stream[]> => {
        let data: any = await Model.fetch(Stream.endpoint);
        return Stream.fromArray(data);
    };
}
