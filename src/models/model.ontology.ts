import { Model } from './model';
import { Ontology } from './ontology';
import {
    IModel,
    IOntology,
    IOntologyModel,
    IOntologyEdge,
} from '../util/interfaces';

export class OntologyModel extends Model implements IOntologyModel {
    ontology: Ontology[] = [];
    ontologyLoaded = false;

    public async createEdge(params: IOntology): Promise<Ontology> {
        Model.validateMethod('Ontology', 'createEdge', arguments);

        const onto = new Ontology(this, params.relationship, params.to);
        this.ontology.push(onto);

        if (params.name !== undefined) {
            onto.name = params.name;
        }
        if (params.description !== undefined) {
            onto.description = params.description;
        }
        if (params.data !== undefined) {
            onto.data = params.data;
        }

        await onto.create();

        return onto;
    }

    public async deleteEdges(): Promise<void> {
        Model.validateMethod('Ontology', 'deleteEdges', arguments);

        if (!this.ontologyLoaded) {
            await this.getAllEdges();
        }

        while (this.ontology.length) {
            await this.ontology[0].delete();
        }
    }

    public removeEdge(edge: IModel): void {
        for (let i = 0; i < this.ontology.length; i++) {
            if (this.ontology[i].id() === edge.id()) {
                this.ontology.splice(i, 1);
                return;
            }
        }
    }

    public async deleteBranch(): Promise<void> {
        const onto = this.ontology;
        this.ontology = [];

        for (let i = 0; i < onto.length; i++) {
            await onto[i].deleteBranch();
        }

        if (this.getClass() === 'ontology_node') {
            await this.delete();
        }
    }

    public async getAllEdges(): Promise<IOntologyEdge[]> {
        Model.validateMethod('Ontology', 'getAllEdges', arguments);

        this.ontologyLoaded = true;
        this.ontology = await Ontology.fetch(`${this.getUrl()}/ontology`);
        this.ontology.forEach((o) => {
            o.setParent(this);
        });
        return this.ontology;
    }
}
