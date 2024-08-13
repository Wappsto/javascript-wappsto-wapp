import { addModel, findModel } from '../util/modelStore';
import { IOntologyNode, JSONObject } from '../util/types';
import { Data } from './data';
import { Model } from './model';
import { setLoadOntologyCallback } from './model.ontology';
import { clearOntologyEdgeStatus, getAllEdges } from './ontology.edge';

let _allNodesLoaded = false;
const _allNodes: OntologyNode<Record<string, unknown>>[] = [];

export class OntologyNode<
        T extends Record<string, unknown> = Record<string, string>
    >
    extends Data<T>
    implements IOntologyNode
{
    constructor(name?: string) {
        super(`ontology_node_${name || 'default'}`, 'ontology_node');
    }

    getClass(): string {
        if (this.data_meta.type) {
            return this.data_meta.type;
        }
        /* istanbul ignore next */
        return super.getClass();
    }
}

export async function createNode<
    T extends Record<string, unknown> = Record<string, string>
>(name: string): Promise<OntologyNode<T>> {
    Model.validateMethod('OntologyNode', 'createNode', arguments);

    await loadOntology();

    let node = await findNode<T>(name);
    if (node === undefined) {
        node = new OntologyNode<T>(name);
        await node.create();
    }

    return node;
}

export async function getAllNodes<
    T extends Record<string, unknown> = Record<string, string>
>(): Promise<OntologyNode<T>[]> {
    if (_allNodesLoaded) {
        return _allNodes as OntologyNode<T>[];
    }
    _allNodesLoaded = true;

    const json: JSONObject[] = await Model.fetch({
        endpoint: Data.endpoint,
        params: {
            'this_data_meta.type': 'ontology_node',
            expand: 1,
        },
    });

    json.forEach((item) => {
        let model = findModel(
            'data',
            (item?.data_meta as JSONObject)?.id as string
        );

        if (!model) {
            model = new OntologyNode<T>();
            model.parse(item);
            addModel(model);
        }
        _allNodes.push(model as OntologyNode<T>);
    });

    return _allNodes as OntologyNode<T>[];
}

export async function findNode<
    T extends Record<string, unknown> = Record<string, string>
>(name: string): Promise<OntologyNode<T>> {
    Model.validateMethod('OntologyNode', 'findNode', arguments);

    const node = findModel('data', `ontology_node_${name}`);

    if (node) {
        return node as OntologyNode<T>;
    }

    const json: JSONObject[] = await Model.fetch({
        endpoint: Data.endpoint,
        params: {
            'this_data_meta.id': `ontology_node_${name}`,
            expand: 1,
        },
    });

    const res: OntologyNode<T>[] = [];
    json.forEach((item) => {
        const node = new OntologyNode<T>();
        node.parse(item);
        res.push(node);
    });
    return res[0];
}

export async function loadOntology() {
    const nodes = await getAllNodes();
    await getAllEdges();
    return nodes;
}

export function clearOntologyStatus() {
    _allNodesLoaded = false;
    _allNodes.length = 0;
    clearOntologyEdgeStatus();
}

setLoadOntologyCallback(loadOntology as unknown as () => Promise<void>);
