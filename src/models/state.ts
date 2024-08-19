import { convertFilterToJson, convertFilterToString } from '../util/helpers';
import { findModel } from '../util/modelStore';
import { IState, StateStatus, StateType, ValidateParams } from '../util/types';
import { Model } from './model';
import { StreamModel } from './model.stream';

export class State extends StreamModel implements IState {
    static endpoint = '/2.1/state';
    static attributes = ['data', 'type', 'timestamp'];
    data = 'NA';
    status?: StateStatus;
    type: 'Report' | 'Control' = 'Report';
    timestamp: string = new Date().toISOString();
    status_payment?: string;

    constructor(type?: StateType, data?: string) {
        super('state');
        Model.validateMethod('State', 'constructor', arguments);
        this.type = type || 'Report';
        this.data = data || 'NA';
    }

    getAttributes(): string[] {
        return State.attributes;
    }

    static getFilter(): string[] {
        return convertFilterToJson('state', State.attributes);
    }

    static getFilterResult(): string {
        const fields = [Model.getMetaFilterResult()].concat(State.attributes);
        const strFilter = convertFilterToString(State.attributes);

        return `state ${strFilter} { ${fields.join(' ')} }`;
    }

    protected usePutForUpdate(): boolean {
        return false;
    }

    static #validate(name: string, params: ValidateParams): void {
        Model.validateMethod('State', name, params);
    }

    static fetchById = async (id: string) => {
        State.#validate('fetchById', [id]);
        const model = findModel('state', id);
        if (model) {
            return model as State;
        }

        const data = await Model.fetch({ endpoint: `${State.endpoint}/${id}` });
        const res = State.fromArray(data);
        if (res[0]) {
            return res[0] as State;
        }
        return undefined;
    };

    static fetch = async () => {
        const url = State.endpoint;

        const data = await Model.fetch({ endpoint: url });
        return State.fromArray(data) as State[];
    };
}
