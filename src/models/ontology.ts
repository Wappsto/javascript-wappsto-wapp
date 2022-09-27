import { Model } from './model';
import { Relationship, IModel } from '../util/interfaces';

export class Ontology extends Model {
    static endpoint = '/2.1/ontology';
    name?: string;
    description?: string;
    relationship: Relationship;
    from: IModel;
    to: IModel;

    constructor(from: IModel, relationship: Relationship, to: IModel) {
        super('ontology', '2.1');
        Model.validateMethod('Ontology', 'constructor', arguments);

        this.from = from;
        this.relationship = relationship;
        this.to = to;
    }

    public toJSON(): Record<string, any> {
        const res = super.toJSON();
        res['to'] = {};
        res['to'][this.to.getType()] = [this.to.id()];

        return res;
    }
}
