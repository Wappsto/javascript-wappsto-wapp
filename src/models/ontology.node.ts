import { Model } from './model';
import { Data } from './data';
import { IOntologyNode } from '../util/interfaces';

export class OntologyNode extends Data implements IOntologyNode {
    constructor(name?: string) {
        super(`ontology_node_${name || 'default'}`, 'ontology_node');
    }

    public getClass(): string {
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
    const json: any[] = await Model.fetch(Data.endpoint, {
        'this_data_meta.type': 'ontology_node',
        expand: 1,
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

    const json: any[] = await Model.fetch(Data.endpoint, {
        'this_data_meta.id': `ontology_node_${name}`,
        expand: 1,
    });

    const res: OntologyNode[] = [];
    json.forEach((item) => {
        const node = new OntologyNode();
        node.parse(item);
        res.push(node);
    });
    return res[0];
}
