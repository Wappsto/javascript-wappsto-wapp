import { findModel } from '../util/modelStore';
import { ValidateParams } from '../util/types';
import { Model } from './model';
import { StreamModel } from './model.stream';

export class Icon extends StreamModel {
    static endpoint = '/2.1/icon';
    static attributes = [];

    constructor() {
        super('icon');
        Model.validateMethod('Icon', 'constructor', arguments);
    }

    getAttributes(): string[] {
        return Icon.attributes;
    }

    static #validate(name: string, params: ValidateParams): void {
        Model.validateMethod('Icon', name, params);
    }

    static fetchById = async (id: string) => {
        Icon.#validate('fetchById', [id]);
        const model = findModel('icon', id);
        if (model) {
            return model as Icon;
        }

        const data = await Model.fetch({ endpoint: `${Icon.endpoint}/${id}` });
        const res = Icon.fromArray(data);
        if (res[0]) {
            return res[0] as Icon;
        }
        return undefined;
    };

    static fetch = async () => {
        const url = Icon.endpoint;

        const data = await Model.fetch({ endpoint: url });
        return Icon.fromArray(data) as Icon[];
    };
}
