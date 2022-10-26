import { Model } from './model';
import { StreamModel } from './model.stream';
import { IState, StateStatus } from '../util/interfaces';

export class State extends StreamModel implements IState {
    static endpoint = '/2.1/state';

    data = '';
    status?: StateStatus;
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

    protected usePutForUpdate(): boolean {
        return false;
    }

    private static validate(name: string, params: any): void {
        Model.validateMethod('State', name, params);
    }

    static findById = async (id: string) => {
        State.validate('findById', [id]);
        const res = await Model.fetch(`${State.endpoint}/${id}`, { expand: 1 });
        return State.fromArray(res)[0];
    };

    public static fetch = async () => {
        const params = { expand: 1 };
        const url = State.endpoint;

        const data = await Model.fetch(url, params);
        return State.fromArray(data);
    };
}
