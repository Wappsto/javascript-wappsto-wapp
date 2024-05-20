import { IOntologyNode, JSONObject } from '../util/interfaces';
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

export async function createNode(name: string): Promise<OntologyNode> {
    Model.validateMethod('OntologyNode', 'createNode', arguments);

    let node = await findNode(name);
    if (node === undefined) {
        node = new OntologyNode(name);
        await node.create();
    }

    await node.getAllEdges();

    return node;
}

export async function getAllNodes(): Promise<OntologyNode[]> {
    const json: JSONObject[] = await Model.fetch({
        endpoint: Data.endpoint,
        params: {
            'this_data_meta.type': 'ontology_node',
            expand: 1,
        },
    });

    const res: OntologyNode[] = [];
    json.forEach((item) => {
        const node = new OntologyNode();
        node.parse(item);
        res.push(node);
    });
    return res;
}

export async function findNode(name: string): Promise<OntologyNode> {
    Model.validateMethod('OntologyNode', 'findNode', arguments);

    const json: JSONObject[] = await Model.fetch({
        endpoint: Data.endpoint,
        params: {
            'this_data_meta.id': `ontology_node_${name}`,
            expand: 1,
        },
    });

    const res: OntologyNode[] = [];
    json.forEach((item) => {
        const node = new OntologyNode();
        node.parse(item);
        res.push(node);
    });
    return res[0];
}
