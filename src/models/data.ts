import isEqual from 'lodash.isequal';
import omit from 'lodash.omit';
import pick from 'lodash.pick';
import { isBrowser } from '../util/helpers';
import { Model } from './model';
import { StreamModel } from './model.stream';
import { JSONObject } from '../util/interfaces';

interface IDataMeta {
    id?: string;
    type?: string;
    version?: number;
}

export class Data<T = unknown> extends StreamModel {
    static endpoint = '/2.1/data';
    static attributes = ['meta', 'data_meta', 'data'];
    data_meta: IDataMeta = {};
    data: Record<string, T> = {};
    _secret_background: Record<string, T> = {};
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

    #checkSecret() {
        if (isBrowser()) {
            throw new Error(
                'Secret Storage is only available in the background'
            );
        }
    }

    getAttributes(): string[] {
        if (isBrowser()) {
            return Data.attributes;
        } else {
            return [...Data.attributes, '_secret_background'];
        }
    }

    set(name: string, item: T, secret = false): void {
        if (secret) {
            this.#checkSecret();
            this._secret_background[name] = item;
        } else {
            this.data[name] = item;
        }
    }

    get(name: string, secret = false): T | undefined {
        if (secret) {
            this.#checkSecret();
            return this._secret_background[name];
        } else {
            return this.data[name];
        }
    }

    remove(name: string, secret = false): void {
        if (secret) {
            this.#checkSecret();
            this.clearSecret = true;
            delete this._secret_background[name];
        } else {
            delete this.data[name];
        }
    }

    keys() {
        return Object.keys(this.data);
    }

    values() {
        return Object.values(this.data);
    }

    entries() {
        return Object.entries(this.data);
    }

    /**
     * Finds instances of the Data model with a specific ID.
     * @param id - The ID to search for.
     * @returns A Promise that resolves to an array of Data instances matching the provided ID.
     */
    static async findByDataId(id: string): Promise<Data[]> {
        const json: JSONObject[] = await Model.fetch({
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

    parse(json: JSONObject): boolean {
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

    toJSON() {
        const result = super.toJSON();

        this.oldKeys.forEach((k: string) => {
            (result as Record<string, unknown>)[k] = null;
        });

        return result;
    }
}
