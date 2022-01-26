import { Model } from './model';
import { StreamModel } from './model.stream';
import { IState, StateStatus, StateType } from '../util/interfaces';

export class State extends StreamModel implements IState {
    static endpoint = '/2.0/state';

    data: string = '';
    status?: StateStatus = 'Send';
    type: StateType = 'Report';
    timestamp: string = new Date().toISOString();
    status_payment?: string;

    constructor(type?: StateType) {
        super('state');
        Model.validateMethod('State', 'constructor', arguments);
        this.type = type || 'Report';
    }

    attributes(): string[] {
        return ['data', 'type', 'timestamp', 'status'];
    }

    public static fetch = async () => {
        let params = { expand: 1 };
        let url = State.endpoint;

        let data = await Model.fetch(url, params);
        return State.fromArray(data);
    };
}
