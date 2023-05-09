import isEqual from 'lodash.isequal';
import pick from 'lodash.pick';
import omit from 'lodash.omit';
import { StreamModel } from './model.stream';
import { Model } from './model';
import { isBrowser } from '../util/helpers';

interface IDataMeta {
    id?: string;
    type?: string;
    version?: number;
}

export class Data extends StreamModel {
    static endpoint = '/2.1/data';
    static attributes = ['meta', 'data_meta', 'data'];
    data_meta: IDataMeta = {};
    data: any = {};
    _secret_background: any = {};
    clearSecret = false;
    oldKeys: Array<string> = [];

    constructor(id?: string, type?: string) {
        super('data');

        this.data_meta.type = type;
        this.data_meta.id = id;
        this.data_meta.version = 1;
    }

    url(): string {
        return Data.endpoint;
    }

    private checkSecret() {
        if (isBrowser()) {
            throw new Error(
                'Secret Storage is only available in the background'
            );
        }
    }

    getAttributes(): string[] {
        if (
            Object.keys(this._secret_background).length === 0 &&
            !this.clearSecret
        ) {
            return Data.attributes;
        } else {
            return [...Data.attributes, '_secret_background'];
        }
    }

    set(name: string, item: any, secret = false): void {
        if (secret) {
            this.checkSecret();
            this._secret_background[name] = item;
        } else {
            this.data[name] = item;
        }
    }

    get(name: string, secret = false): any {
        if (secret) {
            this.checkSecret();
            return this._secret_background[name];
        } else {
            return this.data[name];
        }
    }

    remove(name: string, secret = false): void {
        if (secret) {
            this.checkSecret();
            this.clearSecret = true;
            delete this._secret_background[name];
        } else {
            delete this.data[name];
        }
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

    /**
     * Finds instances of the Data model with a specific ID.
     * @param {string} id - The ID to search for.
     * @returns {Promise<Data[]>} A Promise that resolves to an array of Data instances matching the provided ID.
     */
    public static async findByDataId(id: string): Promise<Data[]> {
        const json: any[] = await Model.fetch({
            endpoint: Data.endpoint,
            params: {
                'this_data_meta.id': id,
                expand: 1,
            },
        });

        return json.map((item) => {
            const data = new Data();
            data.parse(item);
            return data;
        });
    }

    public parse(json: Record<string, any>): boolean {
        Model.validateMethod('Model', 'parse', arguments);
        if (Array.isArray(json)) {
            json = json[0];
        }

        const oldModel = this.toJSON();
        Object.assign(this, pick(json, this.getAttributes()));

        if (this.data_meta.version !== 1) {
            this.data_meta.version = 1;
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
