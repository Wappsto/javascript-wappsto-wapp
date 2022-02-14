import { Model } from './model';
import { StreamModel } from './model.stream';
import { IState } from '../util/interfaces';

export class State extends StreamModel implements IState {
    static endpoint = '/2.0/state';

    data = '';
    status?: string;
    type: 'Report' | 'Control' = 'Report';
    timestamp: string = new Date().toISOString();
    status_payment?: string;

    constructor(type?: 'Report' | 'Control') {
        super('state');
        Model.validateMethod('State', 'constructor', arguments);
        this.type = type || 'Report';
    }

    attributes(): string[] {
        return ['data', 'type', 'timestamp'];
    }

    public static fetch = async () => {
        const params = { expand: 1 };
        const url = State.endpoint;

        const data = await Model.fetch(url, params);
        return State.fromArray(data);
    };
}
