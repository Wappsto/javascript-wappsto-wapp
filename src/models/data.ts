import * as _ from 'lodash';
import { Model } from './model';

interface IDataMeta {
    id?: string;
    type?: string;
}

export class Data extends Model {
    static endpoint = '/2.0/data';
    data_meta: IDataMeta = {};
    data?: any = {};

    constructor(id?: string, type?: string) {
        super('data', '2.0');

        this.data_meta.type = type;
        this.data_meta.id = id;
    }

    url(): string {
        return Data.endpoint;
    }

    attributes(): string[] {
        return ['meta', 'data_meta'];
    }

    set(name: string, item: any): void {
        this.data[name] = item;
    }

    get(name: string): any {
        return this.data[name];
    }

    public static findByDataId = async (id: string) => {
        let json: any[] = await Model.fetch(Data.endpoint, {
            'this_data_meta.id': id,
            expand: 1,
        });

        let res: Data[] = [];
        json.forEach((item) => {
            let data = new Data();
            data.parse(item);
            res.push(data);
        });
        return res;
    };

    public parse(json: Record<string, any>): boolean {
        Model.validateMethod('Model', 'parse', arguments);
        if (_.isArray(json)) {
            json = json[0];
        }
        let oldModel = this.toJSON();
        Object.assign(this, _.pick(json, this.attributes()));
        Object.assign(this.data, _.omit(json, this.attributes()));
        let newModel = this.toJSON();

        return !_.isEqual(oldModel, newModel);
    }

    public toJSON(): Record<string, any> {
        let obj = super.toJSON();
        return Object.assign(obj, this.data);
    }
}
