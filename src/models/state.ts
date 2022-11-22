import { Model } from './model';
import { StreamModel } from './model.stream';
import { convertFilterToJson, convertFilterToString } from '../util/helpers';
import { IState, StateStatus, StateType, Filter } from '../util/interfaces';

export class State extends StreamModel implements IState {
    static endpoint = '/2.1/state';
    static attributes = ['data', 'type', 'timestamp'];
    data = '';
    status?: StateStatus;
    type: 'Report' | 'Control' = 'Report';
    timestamp: string = new Date().toISOString();
    status_payment?: string;

    constructor(type?: StateType) {
        super('state');
        Model.validateMethod('State', 'constructor', arguments);
        this.type = type || 'Report';
    }

    getAttributes(): string[] {
        return State.attributes;
    }

    public static getFilter(filter?: Filter): string[] {
        State.validate('getFilter', [filter]);
        return convertFilterToJson('state', State.attributes);
    }

    public static getFilterResult(filter?: Filter): string {
        State.validate('getFilterResult', [filter]);
        const fields = [Model.getFilterResult()].concat(State.attributes);
        const strFilter = convertFilterToString(State.attributes);

        return `state ${strFilter} { ${fields.join(' ')} }`;
    }

    protected usePutForUpdate(): boolean {
        return false;
    }

    private static validate(name: string, params: any): void {
        Model.validateMethod('State', name, params);
    }

    public static fetchById = async (id: string) => {
        State.validate('fetchById', [id]);
        const data = await Model.fetch({ endpoint: `${State.endpoint}/${id}` });
        const res = State.fromArray(data);
        return res[0];
    };

    public static fetch = async () => {
        const url = State.endpoint;

        const data = await Model.fetch({ endpoint: url });
        return State.fromArray(data);
    };
}
