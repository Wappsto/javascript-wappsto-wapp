import isEqual from 'lodash.isequal';
import omit from 'lodash.omit';
import pick from 'lodash.pick';
import { isBrowser, toSafeObject } from '../util/helpers';
import { Model } from './model';
import { StreamModel } from './model.stream';
import { DataMeta, IData, JSONObject } from '../util/types';
import { findModel } from '../util/modelStore';
import { _config } from '../util/config';

export class Data<T extends Record<string, unknown>>
    extends StreamModel
    implements IData
{
    static endpoint = '/2.1/data';
    static attributes = ['meta', 'data_meta', 'data'];
    data_meta: DataMeta = {};
    data: T = {} as T;
    _secret_background: T = {} as T;
    #clearSecret = false;
    #oldKeys: Array<string> = [];

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
        if (isBrowser() || _config.wappStorageSecret === false) {
            return Data.attributes;
        } else {
            return [...Data.attributes, '_secret_background'];
        }
    }

    set<K extends keyof T>(name: K, item: T[K], secret = false): void {
        if (secret) {
            this.#checkSecret();
            if (item && typeof item === 'object') {
                this._secret_background[name] = toSafeObject(item) as T[K];
            } else {
                this._secret_background[name] = item;
            }
        } else {
            if (item && typeof item === 'object') {
                this.data[name] = toSafeObject(item) as T[K];
            } else {
                this.data[name] = item;
            }
        }
    }

    get<K extends keyof T>(name: K, secret = false): T[K] | undefined {
        if (secret) {
            this.#checkSecret();
            if (typeof this._secret_background[name] === 'object') {
                return toSafeObject(this._secret_background[name]) as
                    | T[K]
                    | undefined;
            } else {
                return this._secret_background[name];
            }
        } else {
            if (typeof this.data[name] === 'object') {
                return toSafeObject(this.data[name]) as T[K] | undefined;
            }
            return this.data[name];
        }
    }

    remove<K extends keyof T>(name: K, secret = false): void {
        if (secret) {
            this.#checkSecret();
            this.#clearSecret = true;
            delete this._secret_background[name];
        } else {
            delete this.data[name];
        }
    }

    keys<K extends keyof T>() {
        return toSafeObject(Object.keys(this.data)) as K[];
    }

    values<K extends keyof T>() {
        return toSafeObject(Object.values(this.data)) as T[K][];
    }

    entries<K extends keyof T>() {
        return toSafeObject(Object.entries(this.data)) as [K, T[K]][];
    }

    static async fetchById<
        T extends Record<string, unknown> = Record<string, unknown>,
    >(id: string) {
        Data.#validate('fetchById', [id]);
        const model = findModel('data', id);
        if (model) {
            return model as Data<T>;
        }

        const data = await Model.fetch({
            endpoint: `${Data.endpoint}/${id}`,
        });
        const res = Data.fromArray<Data<T>>(data);
        if (res[0]) {
            const data = res[0] as Data<T>;
            await data.loadAllChildren(null);
            return data;
        }
        return undefined;
    }

    /**
     * Finds instances of the Data model with a specific ID.
     * @param id - The ID to search for.
     * @returns A Promise that resolves to an array of Data instances matching the provided ID.
     */
    static async findByDataId<
        T extends Record<string, unknown> = Record<string, unknown>,
    >(id: string) {
        const json: JSONObject[] = await Model.fetch({
            endpoint: Data.endpoint,
            params: {
                'this_data_meta.id': id,
                expand: 1,
            },
        });

        return json.map((item) => {
            const data = new Data<T>();
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
            this.data = {} as T;
            Object.assign(this.data, omit(json, ['meta', 'data_meta']));
            this.#oldKeys = Object.keys(
                omit(this.data, ['meta', 'data_meta', 'data'])
            );
        }
        const newModel = this.toJSON();

        return !isEqual(oldModel, newModel);
    }

    toJSON() {
        const result = super.toJSON();

        this.#oldKeys.forEach((k: string) => {
            (result as Record<string, unknown>)[k] = null;
        });

        return result;
    }

    static #validate(method: string, args: unknown[]) {
        Model.validateMethod('Data', method, args);
    }
}
