import { compareModels } from '../util/helpers';
import {
    FetchRequest,
    IOntologyEdge,
    IOntologyModel,
    JSONObject,
    Relationship,
    ValidateParams,
} from '../util/types';
import { findModel, getModel } from '../util/modelStore';
import { Model } from './model';
import { OntologyModel } from './model.ontology';

let _allEdgesLoaded = false;
let _allEdges: OntologyEdge[] = [];

export class OntologyEdge extends Model implements IOntologyEdge {
    static endpoint = '/2.1/ontology';
    static attributes = ['name', 'description', 'relationship', 'data', 'to'];
    name?: string;
    description?: string;
    data?: unknown;
    relationship: Relationship = '';
    to: Record<string, string[]> = {};
    models: OntologyModel[] = [];
    failedModels: Record<string, string[]> = {};

    constructor(
        from?: IOntologyModel,
        relationship?: Relationship,
        to?: IOntologyModel
    ) {
        super('ontology');
        Model.validateMethod('OntologyEdge', 'constructor', arguments);

        this.parent = from;
        if (relationship) {
            this.relationship = relationship;
        }
        if (to) {
            this.models.push(to as OntologyModel);
            to.addParentEdge(this, to);
        }
    }

    getAttributes(): string[] {
        return OntologyEdge.attributes;
    }

    toJSON(): JSONObject {
        const res = super.toJSON();
        const toModels: Record<string, string[]> = {};

        this.models.forEach((m: IOntologyModel) => {
            const type = m.getType();

            try {
                toModels[type].push(m.id());
            } catch (e) {
                toModels[type] = [m.id()];
            }
        });

        res['to'] = toModels;
        return res;
    }

    #addModel(to: IOntologyModel): boolean {
        let res = false;
        if (this.models.find((o) => compareModels(o, to)) === undefined) {
            this.models.push(to as OntologyModel);
            res = true;
        }
        return res;
    }

    removeModel(to: IOntologyModel): boolean {
        let res = false;
        if (this.models.find((o) => compareModels(o, to)) !== undefined) {
            this.models.splice(this.models.indexOf(to as OntologyModel), 1);
            res = true;
        }
        return res;
    }

    #addFailedModel(type: string, id: string) {
        try {
            if (!this.failedModels[type].includes(id)) {
                this.failedModels[type].push(id);
            }
        } catch (e) {
            this.failedModels[type] = [id];
        }
    }

    async fetchModels(): Promise<void> {
        const proms: Promise<void>[] = [];
        Object.keys(this.to).forEach((type: string) => {
            this.to[type].forEach((id: string) => {
                proms.push(
                    new Promise(async (resolve: () => void) => {
                        const model = await getModel(type, id);
                        if (model) {
                            const ontologyModel = model as IOntologyModel;
                            this.#addModel(ontologyModel);
                            await ontologyModel.addParentEdge(
                                this,
                                ontologyModel
                            );
                        } else if (model === false) {
                            this.#addFailedModel(type, id);
                        }
                        resolve();
                    })
                );
            });
        });
        await Promise.all(proms);

        if (!this.from) {
            return;
        }

        proms.length = 0;
        Object.keys(this.from).forEach((type: string) => {
            this.from[type].forEach((id: string) => {
                proms.push(
                    new Promise(async (resolve: () => void) => {
                        const model = await getModel(type, id);
                        if (model) {
                            (model as IOntologyModel).addEdge(this);
                        } else if (model === false) {
                            this.#addFailedModel(type, id);
                        }
                        resolve();
                    })
                );
            });
        });

        await Promise.all(proms);
    }

    async delete(): Promise<void> {
        await super.delete();
        this.models.forEach((m) => m.removeParentEdge(this));
        if (this.parent) {
            const p = this.parent as IOntologyModel;
            p.removeEdge(this);
        }
    }

    async deleteBranch(): Promise<void> {
        const models = this.models;
        this.models = [];

        for (let i = 0; i < models.length; i++) {
            await models[i].deleteBranch();
        }

        await this.delete();
    }

    static fetchById = async (id: string) => {
        OntologyEdge.#validate('fetchById', [id]);
        const model = findModel('ontology', id);
        if (model) {
            return model as OntologyEdge;
        }

        const data = await Model.fetch({
            endpoint: `${OntologyEdge.endpoint}/${id}`,
        });
        const ontologies = OntologyEdge.fromArray(data);

        if (ontologies[0]) {
            const ontology = ontologies[0] as OntologyEdge;
            await ontology.fetchModels();
            return ontology;
        }
        return undefined;
    };

    static fetch = async (
        parameters: FetchRequest
    ): Promise<OntologyEdge[]> => {
        OntologyEdge.#validate('fetch', [parameters]);

        const params = parameters;
        if (!params.params) {
            params.params = { expand: 1 };
        } else {
            params.params['expand'] = 1;
        }
        const data = await Model.fetch(params);
        const res = OntologyEdge.fromArray(data);

        const proms: Promise<void>[] = [];
        res.forEach((o, index) => {
            if (typeof o === 'string') {
                proms.push(
                    new Promise(async (resolve) => {
                        const onto = await OntologyEdge.fetchById(o);
                        const promises: Promise<void>[] = [];
                        if (onto) {
                            res[index] = onto;
                            onto.models.forEach((m) => {
                                promises.push(m.addParentEdge(onto, m));
                            });
                        }
                        await Promise.all(promises);
                        resolve();
                    })
                );
            } else {
                proms.push(o.fetchModels());
            }
        });

        await Promise.all(proms);
        return res as OntologyEdge[];
    };

    static #validate(name: string, params: ValidateParams): void {
        Model.validateMethod('OntologyEdge', name, params);
    }
}

export async function getAllEdges() {
    if (_allEdgesLoaded) {
        return _allEdges;
    }
    _allEdgesLoaded = true;

    const data = await Model.fetch({
        endpoint: '/2.1/ontology',
        params: { expand: 1 },
    });
    const res = OntologyEdge.fromArray(data);
    const proms: Promise<void>[] = [];
    res.forEach((o, index) => {
        if (typeof o === 'string') {
            proms.push(
                new Promise(async (resolve) => {
                    const onto = await OntologyEdge.fetchById(o);
                    const promises: Promise<void>[] = [];
                    if (onto) {
                        res[index] = onto;
                        onto.models.forEach((m) => {
                            promises.push(m.addParentEdge(onto, m));
                        });
                    }
                    await Promise.all(promises);
                    resolve();
                })
            );
        } else {
            proms.push(o.fetchModels());
        }
    });

    await Promise.all(proms);

    _allEdges = res as OntologyEdge[];
    return _allEdges as OntologyEdge[];
}

export function clearOntologyEdgeStatus() {
    _allEdgesLoaded = false;
    _allEdges = [];
}
