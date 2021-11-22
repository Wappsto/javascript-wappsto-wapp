import { Model } from './model';

export class State extends Model {
    static endpoint = '/2.0/state';

    data: string = '';
    status?: string;
    type: string = '';
    timestamp: string = '';
    status_payment?: string;

    constructor(type?: string) {
        super('state');

        this.type = type || '';
    }

    attributes(): string[] {
        return ['data', 'status', 'type', 'timestamp', 'status_payment'];
    }

    public static fetch = async () => {
        let data: any[] = await Model.fetch(State.endpoint, { expand: 1 });
        return State.fromArray(data);
    };
}
