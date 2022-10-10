import { isArray, isEqual, pick, omit } from 'lodash';
import { StreamModel } from './model.stream';
import { Model } from './model';

interface IDataMeta {
    id?: string;
    type?: string;
    version?: number;
}

export class Data extends StreamModel {
    static endpoint = '/2.1/data';
    data_meta: IDataMeta = {};
    data: any = {};
    oldKeys: Array<string> = [];

    constructor(id?: string, type?: string) {
        super('data', '2.1');

        this.data_meta.type = type;
        this.data_meta.id = id;
        this.data_meta.version = 1;
    }

    url(): string {
        return Data.endpoint;
    }

    attributes(): string[] {
        return ['meta', 'data_meta', 'data'];
    }

    set(name: string, item: any): void {
        this.data[name] = item;
    }

    get(name: string): any {
        return this.data[name];
    }

    remove(name: string): void {
        delete this.data[name];
    }

    keys(): Array<string> {
        return Object.keys(this.data);
    }

    values(): Array<any> {
        return Object.values(this.data);
    }

    entries(): Array<Array<any>> {
        return Object.entries(this.data);
    }

    public static findByDataId = async (id: string) => {
        const json: any[] = await Model.fetch(Data.endpoint, {
            'this_data_meta.id': id,
            expand: 1,
        });

        const res: Data[] = [];
        json.forEach((item) => {
            const data = new Data();
            data.parse(item);
            res.push(data);
        });
        return res;
    };

    public parse(json: Record<string, any>): boolean {
        Model.validateMethod('Model', 'parse', arguments);
        if (isArray(json)) {
            json = json[0];
        }

        const oldModel = this.toJSON();
        Object.assign(this, pick(json, this.attributes()));

        if (this.data_meta.version !== 1) {
            this.data = {};
            Object.assign(this.data, omit(json, ['meta', 'data_meta']));
            this.oldKeys = Object.keys(
                omit(this.data, ['meta', 'data_meta', 'data'])
            );
        }
        const newModel = this.toJSON();

        return !isEqual(oldModel, newModel);
    }

    public toJSON(): Record<string, any> {
        const result: Record<string, any> = super.toJSON();

        this.oldKeys.forEach((k: string) => {
            result[k] = null;
        });

        return result;
    }
}
