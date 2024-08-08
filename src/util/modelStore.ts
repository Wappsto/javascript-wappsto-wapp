import { Data } from '../models';
import { IModel } from './types';

type createCallback = (
    type: string,
    id: string
) => Promise<IModel | false | undefined>;

const models: Record<string, IModel> = {};
let createModel: createCallback | undefined = undefined;

export function setModelCreateCallback(callback: createCallback): void {
    createModel = callback;
}

export function addModel(model: IModel): IModel;
export function addModel(model: undefined): undefined;
export function addModel(model?: IModel) {
    if (model && model.id()) {
        if (models[model.id()]) {
            models[model.id()].parse(
                model as unknown as Record<string, unknown>
            );
        } else {
            models[model.id()] = model;
        }
        return models[model.id()];
    }
    return model;
}

export async function getModel(
    type: string,
    id: string
): Promise<IModel | false | undefined> {
    const model = findModel(type, id);
    if (model) {
        return model;
    }

    if (createModel !== undefined) {
        const m = await createModel(type, id);
        if (m) {
            addModel(m);
        }
        return m;
    }

    /* istanbul ignore next */
    return undefined;
}

export function findModel(type: string, id: string): IModel | undefined {
    const model = models[id];
    if (model !== undefined) {
        return model;
    }

    if (type === 'data') {
        const data_model = Object.values(models).find((m: IModel) => {
            if (
                m.getType() === 'data' &&
                (m as Data<Record<string, unknown>>).data_meta.id === id
            ) {
                return true;
            }
            return false;
        });
        if (data_model) {
            return data_model;
        }
    }

    return undefined;
}

export function removeModel(model: IModel): void {
    delete models[model.id()];
}
