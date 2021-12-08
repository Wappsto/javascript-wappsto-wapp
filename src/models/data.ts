import { Model } from './model';

interface IDataMeta {
    id?: string;
    type?: string;
}

export class Data extends Model {
    static endpoint = '/2.1/data';
    data_meta?: IDataMeta = {};
    data?: any = {};

    constructor(id?: string, type?: string) {
        super('data', '2.1');
        if (!this.data_meta) {
            this.data_meta = {};
        }
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

    set(name: string, item: any): void {
        this.data[name] = item;
    }

    get(name: string): any {
        return this.data[name];
    }

    public static fetch = async () => {
        let data: any[] = await Model.fetch(Data.endpoint);
        return Data.fromArray(data);
    };

    public static findById = async (id: string) => {
        let data: any[] = await Model.fetch(Data.endpoint, {
            'this_data_meta.id': id,
        });
        return Data.fromArray(data);
    };
}
