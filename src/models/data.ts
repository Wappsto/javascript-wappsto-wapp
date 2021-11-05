import { IMeta } from './meta';
import { Model, IModel } from './model';

interface IDataMeta {
    id?: string;
    type?: string;
}

export class Data extends Model implements IModel {
    meta: IMeta = {};
    data_meta: IDataMeta = {};
    data?: any = {};

    constructor(id?: string, type?: string) {
        super('2.0/data');
        this.data_meta.type = type;
        this.data_meta.id = id;

        this.meta.redirect = id;
    }
}
