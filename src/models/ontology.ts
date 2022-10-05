import { Model } from './model';
import {
    Relationship,
    IOntologyModel,
    IOntologyEdge,
} from '../util/interfaces';
import { getModel } from '../util/modelStore';

export class Ontology extends Model implements IOntologyEdge {
    static endpoint = '/2.1/ontology';
    name?: string;
    description?: string;
    data?: any;
    relationship: Relationship = '';
    to: Record<string, string[]> = {};
    models: IOntologyModel[] = [];

    constructor(
        from?: IOntologyModel,
        relationship?: Relationship,
        to?: IOntologyModel
    ) {
        super('ontology', '2.1');
        Model.validateMethod('Ontology', 'constructor', arguments);

        this.parent = from;
        if (relationship) {
            this.relationship = relationship;
        }
        if (to) {
            this.models.push(to);
        }
    }

    attributes(): string[] {
        return ['name', 'description', 'relationship', 'data', 'to'];
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

    public addModel(to: IOntologyModel): boolean {
        if (this.models.find((o) => o === to) === undefined) {
            this.models.push(to);
            return true;
        }
        return false;
    }

    public fetchModels(): void {
        Object.keys(this.to).forEach((type: string) => {
            this.to[type].forEach((id: string) => {
                const m = getModel(type, id);
                if (m) {
                    this.addModel(m as IOntologyModel);
                }
            });
        });
    }

    public parse(json: Record<string, any>): boolean {
        const res = super.parse(json);
        this.fetchModels();
        return res;
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

    static fetch = async (
        endpoint: string,
        params: Record<string, any> = {}
    ): Promise<Ontology[]> => {
        Ontology.validate('fetch', [endpoint, params]);

        const data = await Model.fetch(endpoint, params);
        const res = Ontology.fromArray(data);

        res.forEach((o) => {
            o.fetchModels();
        });

        return res;
    };

    private static validate(name: string, params: any): void {
        Model.validateMethod('Ontology', name, params);
    }
}
