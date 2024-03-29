import { compareModels } from '../util/helpers';
import {
    FetchRequest,
    IOntologyEdge,
    IOntologyModel,
    Relationship,
} from '../util/interfaces';
import { getModel } from '../util/modelStore';
import { Model } from './model';

export class Ontology extends Model implements IOntologyEdge {
    static endpoint = '/2.1/ontology';
    static attributes = ['name', 'description', 'relationship', 'data', 'to'];
    name?: string;
    description?: string;
    data?: any;
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

    public toJSON(): Record<string, any> {
        const res = super.toJSON();
        res['to'] = {};
        this.models.forEach((m: IOntologyModel) => {
            const type = m.getType();
            if (res['to'][type] === undefined) {
                res['to'][type] = [];
            }
            res['to'][type].push(m.id());
        });

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
        if (!this.failedModels[type]) {
            this.failedModels[type] = [];
        }
        if (!this.failedModels[type].includes(id)) {
            this.failedModels[type].push(id);
        }
    }

    public async fetchModels(): Promise<void> {
        const proms: any[] = [];
        Object.keys(this.to).forEach((type: string) => {
            this.to[type].forEach((id: string) => {
                proms.push(
                    new Promise(async (resolve: any) => {
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

    public async delete(): Promise<void> {
        await super.delete();
        if (this.parent) {
            const p = this.parent as IOntologyModel;
            p.removeEdge(this);
        }
    }

    public async deleteBranch(): Promise<void> {
        const models = this.models;
        this.models = [];

        for (let i = 0; i < models.length; i++) {
            await models[i].deleteBranch();
        }

        await this.delete();
    }

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

        const proms: any[] = [];
        res.forEach((o) => {
            proms.push(o.fetchModels());
        });

        await Promise.all(proms);
        return res;
    };

    static #validate(name: string, params: any): void {
        Model.validateMethod('OntologyEdge', name, params);
    }
}
