import { printWarning } from '../util/debug';
import { compareModels, uniqueModels } from '../util/helpers';
import {
    IEdge,
    IModel,
    IOntologyEdge,
    IOntologyModel,
    JSONObject,
} from '../util/types';
import { Model } from './model';
import { OntologyEdge } from './ontology.edge';

export class OntologyModel extends Model implements IOntologyModel {
    edges: OntologyEdge[] = [];
    parentEdges: OntologyEdge[] = [];
    #ontologyLoaded = false;

    /**
     * Get the ontology edges of the current object.
     *
     * @note This is here for backwards compatibility.
     * @deprecated Should use edges instead.
     * @return The ontology edges of the current object.
     */
    get ontology() {
        return this.edges;
    }

    /**
     * Set the ontology edges of the current object.
     *
     * @note This is here for backwards compatibility.
     * @deprecated Should use edges instead.
     * @param edges - The ontology edges to set.
     */
    set ontology(edges: OntologyEdge[]) {
        this.edges = edges;
    }

    getParentEdges(): IOntologyEdge[] {
        return this.parentEdges;
    }

    addEdge(edge: OntologyEdge): void {
        this.#ontologyLoaded = true;
        this.edges.push(edge);
    }

    async createEdge(params: IEdge): Promise<OntologyEdge> {
        Model.validateMethod('OntologyModel', 'createEdge', arguments);

        await this.getAllEdges();

        let create = false;
        let onto = await this.findEdge(params);
        if (!onto) {
            onto = new OntologyEdge(this, params.relationship, params.to);
            this.edges.push(onto);
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

    async addParentEdge(
        params: IOntologyEdge,
        to: IOntologyModel
    ): Promise<void> {
        Model.validateMethod('OntologyModel', 'addParentEdge', arguments);

        const edge = await this.findEdge({
            relationship: params.relationship,
            to,
        });
        if (!edge) {
            this.parentEdges.push(params as OntologyEdge);
        }
    }

    removeParentEdge(edge: IOntologyEdge): void {
        this.parentEdges = this.parentEdges.filter((e) => {
            return !compareModels(e, edge);
        });
    }

    async deleteEdges(): Promise<void> {
        await this.getAllEdges();

        while (this.edges.length) {
            await this.edges[0].delete();
        }
    }

    async deleteEdge(params: IEdge): Promise<void> {
        Model.validateMethod('OntologyModel', 'deleteEdge', arguments);

        const edge = await this.findEdge(params);
        if (edge) {
            await edge.delete();
        }
    }

    async deleteModelFromEdge(params: IEdge): Promise<void> {
        Model.validateMethod('OntologyModel', 'deleteModelFromEdge', arguments);
        const edge = await this.findEdge(params);
        if (edge) {
            edge.removeModel(params.to);
            params.to.removeParentEdge(edge);
            if (edge.models.length === 0) {
                await edge.delete();
            } else {
                await edge.update();
            }
        }
    }

    removeEdge(edge: IModel): void {
        Model.validateMethod('OntologyModel', 'removeEdge', arguments);

        for (let i = 0; i < this.edges.length; i++) {
            if (compareModels(this.edges[i], edge)) {
                this.edges.splice(i, 1);
                return;
            }
        }
    }

    async findEdge(params: IEdge): Promise<OntologyEdge | undefined> {
        await this.getAllEdges();

        for (let i = 0; i < this.edges.length; i++) {
            const o = this.edges[i];
            if (o.relationship === params.relationship) {
                if (o.models.find((m) => compareModels(m, params.to))) {
                    return o as OntologyEdge;
                }
            }
        }
        return undefined;
    }

    async deleteBranch(): Promise<void> {
        await this.getAllEdges();

        let edges = this.edges;
        this.edges = [];

        for (let i = 0; i < edges.length; i++) {
            await edges[i].deleteBranch();
        }

        edges = this.parentEdges;
        this.parentEdges = [];

        for (let i = 0; i < edges.length; i++) {
            await (edges[i].parent as OntologyModel)?.deleteModelFromEdge({
                relationship: edges[i].relationship,
                to: this,
            });
        }

        if (this.getClass() === 'ontology_node') {
            await this.delete();
        }
    }

    async getAllEdges(force?: boolean): Promise<IOntologyEdge[]> {
        Model.validateMethod('OntologyModel', 'getAllEdges', arguments);

        if (this.meta.id === undefined) {
            printWarning('getAllEdges called on an deleted node');
            return [];
        }

        if (!this.#ontologyLoaded || force) {
            this.#ontologyLoaded = true;
            this.edges = await OntologyEdge.fetch({
                endpoint: `${this.getUrl()}/ontology`,
            });

            this.edges.forEach((o) => {
                o.setParent(this);
            });
        }
        return this.edges;
    }

    async transverse(
        path: string,
        getAll?: boolean
    ): Promise<IOntologyModel[]> {
        if (this.meta.id === undefined) {
            printWarning('transverse called on an deleted node');
            return [];
        }

        const params: JSONObject = { path: path };

        if (getAll) {
            params['all_edge'] = true;
        }

        const models: IOntologyModel[] = [];
        const leafs = await OntologyEdge.fetch({
            endpoint: `${this.getUrl()}/ontology`,
            params,
        });

        leafs.forEach((leaf: IOntologyEdge) => {
            models.push(...leaf.models);
        });

        return models.filter(uniqueModels);
    }
}
