import { compareModels } from '../util/helpers';
import {
    FetchRequest,
    IOntologyEdge,
    IOntologyModel,
    JSONObject,
    Relationship,
    ValidateParams,
} from '../util/interfaces';
import { getModel } from '../util/modelStore';
import { Model } from './model';

export class Ontology extends Model implements IOntologyEdge {
    static endpoint = '/2.1/ontology';
    static attributes = ['name', 'description', 'relationship', 'data', 'to'];
    name?: string;
    description?: string;
    data?: unknown;
    relationship: Relationship = '';
    to: Record<string, string[]> = {};
    models: IOntologyModel[] = [];
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
            this.models.push(to);
        }
    }

    getAttributes(): string[] {
        return Ontology.attributes;
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

    addModel(to: IOntologyModel): boolean {
        let res = false;
        if (this.models.find((o) => compareModels(o, to)) === undefined) {
            this.models.push(to);
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
                        const m = await getModel(type, id);
                        if (m) {
                            this.addModel(m as IOntologyModel);
                        } else if (m === false) {
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
        Ontology.#validate('fetchById', [id]);
        const data = await Model.fetch({
            endpoint: `${Ontology.endpoint}/${id}`,
        });
        const ontologies = Ontology.fromArray(data);

        if (ontologies[0]) {
            const ontology = ontologies[0] as Ontology;
            await ontology.loadAllChildren(null);
            return ontology;
        }
        return undefined;
    };

    static fetch = async (parameters: FetchRequest): Promise<Ontology[]> => {
        Ontology.#validate('fetch', [parameters]);

        const params = parameters;
        if (!params.params) {
            params.params = { expand: 1 };
        } else {
            params.params['expand'] = 1;
        }
        const data = await Model.fetch(params);
        const res = Ontology.fromArray(data);

        const proms: Promise<void>[] = [];
        res.forEach((o, index) => {
            if (typeof o === 'string') {
                proms.push(
                    new Promise(async (resolve) => {
                        const onto = await Ontology.fetchById(o);
                        if (onto) {
                            res[index] = onto;
                        }
                        resolve();
                    })
                );
            } else {
                proms.push(o.fetchModels());
            }
        });

        await Promise.all(proms);
        return res as Ontology[];
    };

    static #validate(name: string, params: ValidateParams): void {
        Model.validateMethod('OntologyEdge', name, params);
    }
}
