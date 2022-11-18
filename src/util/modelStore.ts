import { IModel } from './interfaces';

type createCallback = (type: string, id: string) => Promise<IModel | undefined>;

const models: Record<string, IModel> = {};
let createModel: createCallback | undefined = undefined;

export function setModelCreateCallback(callback: createCallback): void {
    createModel = callback;
}

export function addModel(model?: IModel): void {
    if (model) {
        models[model.id()] = model;
    }
}

export async function getModel(
    type: string,
    id: string
): Promise<IModel | undefined> {
    const model = models[id];
    if (model !== undefined) {
        return model;
    }
    if (createModel !== undefined) {
        const m = await createModel(type, id);
        addModel(m);
        return m;
    }
    /* istanbul ignore next */
    return undefined;
}
