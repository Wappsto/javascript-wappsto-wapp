import { IOntologyNode, JSONObject } from '../util/types';
import { Data } from './data';
import { Model } from './model';

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

    let node = await findNode<T>(name);
    if (node === undefined) {
        node = new OntologyNode<T>(name);
        await node.create();
    }

    await node.getAllEdges();

    return node;
}

export async function getAllNodes<
    T extends Record<string, unknown> = Record<string, string>
>(): Promise<OntologyNode<T>[]> {
    const json: JSONObject[] = await Model.fetch({
        endpoint: Data.endpoint,
        params: {
            'this_data_meta.type': 'ontology_node',
            expand: 1,
        },
    });

    const res: OntologyNode<T>[] = [];
    json.forEach((item) => {
        const node = new OntologyNode<T>();
        node.parse(item);
        res.push(node);
    });
    return res;
}

export async function findNode<
    T extends Record<string, unknown> = Record<string, string>
>(name: string): Promise<OntologyNode<T>> {
    Model.validateMethod('OntologyNode', 'findNode', arguments);

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
