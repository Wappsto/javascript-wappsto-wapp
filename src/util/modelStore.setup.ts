import { Network } from '../models/network';
import { Device } from '../models/device';
import { Value } from '../models/value';
import { State } from '../models/state';
import { OntologyNode } from '../models/ontology.node';
import { IModel } from './interfaces';
import { printDebug } from './debug';
import { setModelCreateCallback } from './modelStore';

function loadModel(type: string, id: string): IModel | undefined {
    let model: IModel | undefined;

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
            break;
    }
    if (model !== undefined) {
        model.meta.id = id;
        model.reload(true);
    }
    return model;
}

export function setupModelStore(): void {
    setModelCreateCallback(loadModel);
}
