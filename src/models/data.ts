import { Model } from './model';

interface IDataMeta {
    id?: string;
    type?: string;
}

export class Data extends Model {
    static endpoint = '/2.0/device';
    data_meta: IDataMeta = {};
    data?: any = {};

    constructor(id?: string, type?: string) {
        super();
        this.data_meta.type = type;
        this.data_meta.id = id;

        this.meta.redirect = id;
    }

    url(): string {
        return Data.endpoint;
    }

    attributes(): string[] {
        return ['data_meta'];
    }

    toJSON(): any {
        let json = super.toJSON();
        return Object.assign(json, this.data);
    }

    public static fetch = async () => {
        let data: any[] = await Model.fetch(Data.endpoint);
        let datas: Data[] = [];

        data?.forEach((json: any) => {
            datas.push(Data.fromJSON(json));
        });
        return datas;
    };

    static fromJSON(json: any): Data {
        let data = Object.create(Data.prototype);
        return Object.assign(data, json);
    }
}
