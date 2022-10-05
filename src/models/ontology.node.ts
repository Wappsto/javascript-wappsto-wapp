import { Model } from './model';
import { Data } from './data';

export class OntologyNode extends Data {
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
    const node = new OntologyNode(name);
    await node.create();

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
