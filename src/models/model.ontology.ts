import { compareModels, uniqueModels } from '../util/helpers';
import {
    IModel,
    IOntology,
    IOntologyEdge,
    IOntologyModel,
    JSONObject,
} from '../util/interfaces';
import { Model } from './model';
import { Ontology } from './ontology';

export class OntologyModel extends Model implements IOntologyModel {
    ontology: Ontology[] = [];
    ontologyLoaded = false;

    async createEdge(params: IOntology): Promise<Ontology> {
        Model.validateMethod('OntologyModel', 'createEdge', arguments);

        await this.getAllEdges();

        let create = false;
        let onto = await this.findEdge(params);
        if (!onto) {
            onto = new Ontology(this, params.relationship, params.to);
            this.ontology.push(onto);
            create = true;
        }

        if (params.name !== undefined) {
            onto.name = params.name;
        }
        if (params.description !== undefined) {
            onto.description = params.description;
        }
        if (params.data !== undefined) {
            onto.data = params.data;
        }

        if (create) {
            await onto.create();
        }

        return onto;
    }

    async deleteEdges(): Promise<void> {
        await this.getAllEdges();

        while (this.ontology.length) {
            await this.ontology[0].delete();
        }
    }

    async deleteEdge(params: IOntology): Promise<void> {
        Model.validateMethod('OntologyModel', 'deleteEdge', arguments);

        const edge = await this.findEdge(params);
        if (edge) {
            await edge.delete();
        }
    }

    removeEdge(edge: IModel): void {
        Model.validateMethod('OntologyModel', 'removeEdge', arguments);

        for (let i = 0; i < this.ontology.length; i++) {
            if (compareModels(this.ontology[i], edge)) {
                this.ontology.splice(i, 1);
                return;
            }
        }
    }

    async findEdge(params: IOntology): Promise<Ontology | undefined> {
        await this.getAllEdges();

        for (let i = 0; i < this.ontology.length; i++) {
            const o = this.ontology[i];
            if (o.relationship === params.relationship) {
                if (o.models.find((m) => compareModels(m, params.to))) {
                    return o;
                }
            }
        }
        return undefined;
    }

    async deleteBranch(): Promise<void> {
        await this.getAllEdges();

        const onto = this.ontology;
        this.ontology = [];

        for (let i = 0; i < onto.length; i++) {
            await onto[i].deleteBranch();
        }

        if (this.getClass() === 'ontology_node') {
            await this.delete();
        }
    }

    async getAllEdges(force?: boolean): Promise<IOntologyEdge[]> {
        Model.validateMethod('OntologyModel', 'getAllEdges', arguments);

        if (!this.ontologyLoaded || force) {
            this.ontologyLoaded = true;
            this.ontology = await Ontology.fetch({
                endpoint: `${this.getUrl()}/ontology`,
            });
            this.ontology.forEach((o) => {
                o.setParent(this);
            });
        }
        return this.ontology;
    }

    async transverse(
        path: string,
        getAll?: boolean
    ): Promise<IOntologyModel[]> {
        const params: JSONObject = { path: path };

        if (getAll) {
            params['all_edge'] = true;
        }

        const models: IOntologyModel[] = [];
        const leafs = await Ontology.fetch({
            endpoint: `${this.getUrl()}/ontology`,
            params,
        });

        leafs.forEach((leaf: IOntologyEdge) => {
            models.push(...leaf.models);
        });

        return models.filter(uniqueModels);
    }
}
