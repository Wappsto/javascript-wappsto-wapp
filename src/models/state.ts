import { Model } from './model';
import { StreamModel } from './model.stream';
import { IState } from '../util/interfaces';

export class State extends StreamModel implements IState {
    static endpoint = '/2.0/state';

    data: string = '';
    status?: string;
    type: 'Report' | 'Control' = 'Report';
    timestamp: string = new Date().toISOString();
    status_payment?: string;

    constructor(type?: 'Report' | 'Control') {
        super('state');
        this.validate('constructor', arguments);
        this.type = type || 'Report';
    }

    attributes(): string[] {
        return ['data', 'type', 'timestamp'];
    }

    public static fetch = async () => {
        let params = { expand: 1 };
        let url = State.endpoint;

        let data = await Model.fetch(url, params);
        return State.fromArray(data);
    };
}
