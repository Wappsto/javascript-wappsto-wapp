import { Model } from './model';
import { StreamModel } from './model.stream';

export interface IState {
    type: string;
    data?: string;
    timestamp?: string;
}
export class State extends StreamModel implements IState {
    static endpoint = '/2.0/state';

    data: string = '';
    status?: string;
    type: string = '';
    timestamp: string = new Date().toISOString();
    status_payment?: string;

    constructor(type?: string) {
        super('state');

        this.type = type || '';
    }

    attributes(): string[] {
        return ['data', 'status', 'type', 'timestamp', 'status_payment'];
    }

    public static fetch = async (type: string = '', parentUrl: string = '') => {
        let params = { expand: 1 };
        let url = State.endpoint;
        if (type !== '') {
            Object.assign(params, {
                'this_type=': type,
            });
        }
        if (parentUrl !== '') {
            url = parentUrl + '/state';
        }

        let data: any[] = await Model.fetch(url, params);
        return State.fromArray(data);
    };
}
