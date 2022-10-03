import { Model } from './model';
import { Relationship, IModel, IOntologyModel } from '../util/interfaces';
import { getModel } from '../util/modelStore';

export class Ontology extends Model implements IOntologyModel {
    static endpoint = '/2.1/ontology';
    name?: string;
    description?: string;
    data?: any;
    relationship: Relationship = '';
    to: Record<string, string[]> = {};
    models: IModel[] = [];

    constructor(from?: IModel, relationship?: Relationship, to?: IModel) {
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

    public getUrl(): string {
        const url = super.getUrl();
        if (!this.meta.id) {
            return `${url}?merge=true`;
        }
        return url;
    }

    public toJSON(): Record<string, any> {
        const res = super.toJSON();
        res['to'] = {};
        this.models.forEach((m: IModel) => {
            const type = m.getType();
            if (res['to'][type] === undefined) {
                res['to'][type] = [];
            }
            res['to'][type].push(m.id());
        });

        return res;
    }

    public removeTo(to: IModel): boolean {
        Ontology.validate('removeTo', [to]);

        for (let i = 0; i < this.models.length; i++) {
            if (this.models[i].id() === to.id()) {
                this.models.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    public addModel(to: IModel): boolean {
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
                    this.addModel(m);
                }
            });
        });
    }

    public parse(json: Record<string, any>): boolean {
        const res = super.parse(json);
        this.fetchModels();
        return res;
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
