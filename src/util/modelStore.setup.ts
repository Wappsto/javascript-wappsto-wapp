import { Device } from '../models/device';
import { Network } from '../models/network';
import { OntologyNode } from '../models/ontology.node';
import { State } from '../models/state';
import { Value } from '../models/value';
import { printDebug, printWarning } from './debug';
import { IModel } from './interfaces';
import { setModelCreateCallback } from './modelStore';

async function loadModel(
    type: string,
    id: string
): Promise<IModel | false | undefined> {
    let model: IModel;

    printDebug(`ModelStore is loading a ${type} with id ${id}`);

    switch (type) {
        case 'network':
            model = new Network();
            break;
        case 'device':
            model = new Device();
            break;
        case 'value':
            model = new Value();
            break;
        case 'state':
            model = new State();
            break;
        case 'data':
            model = new OntologyNode();
            break;
        default:
            return undefined;
    }
    model.meta.id = id;
    if (!(await model.reload(true))) {
        printWarning(`Failed to load ${type} model with id ${id}`);
        return false;
    }
    return model;
}

export function setupModelStore(): void {
    setModelCreateCallback(loadModel);
}
