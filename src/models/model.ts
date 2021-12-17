import * as _ from 'lodash';
import { plainToClass } from 'class-transformer';
import wappsto from '../util/http_wrapper';
import { printHttpError } from '../util/http_wrapper';
import { IMeta } from './meta';
import { config } from '../util/config';

interface IModel {
    getUrl(): string;
}

export class Model implements IModel {
    meta: IMeta = {};
    parent?: IModel;

    constructor(type: string, version = '2.0') {
        this.meta.type = type;
        this.meta.version = version;
    }

    public url(): string {
        return `/${this.meta.version}/${this.meta.type}`;
    }

    public path(): string {
        if (this.meta.id) {
            return `/${this.meta.type}/${this.meta.id}`;
        } else {
            return `/${this.meta.type}`;
        }
    }

    public attributes(): string[] {
        return [];
    }

    protected static generateOptions(params?: any): any {
        let options: any = {
            params: {},
        };
        if (params) {
            Object.assign(options.params, params);
        }
        if (config().verbose) {
            options.params['verbose'] = true;
        }
        if (Object.keys(options.params).length === 0) {
            options = _.omit(options, 'params');
        }
        return options;
    }

    public getUrl(): string {
        if (this.meta.id) {
            return this.url() + '/' + this.meta.id;
        } else if (this.parent) {
            return this.parent.getUrl() + '/' + this.meta.type;
        }
        return this.url();
    }

    public _create = async (params: any = {}): Promise<void> => {
        let response = await wappsto.post(
            this.getUrl(),
            this.toJSON(),
            Model.generateOptions(params)
        );
        this.parse(response.data);
    };

    public create = async (params: any = {}): Promise<void> => {
        try {
            await this._create(params);
        } catch (e) {
            printHttpError(e);
        }
    };

    public update = async (): Promise<void> => {
        try {
            let response = await wappsto.patch(
                this.getUrl(),
                this.toJSON(),
                Model.generateOptions()
            );
            this.parse(response.data);
        } catch (e) {
            printHttpError(e);
        }
    };

    public refresh = async (): Promise<void> => {
        try {
            let response = await wappsto.get(
                this.getUrl(),
                Model.generateOptions()
            );
            this.parse(response.data);
        } catch (e) {
            printHttpError(e);
        }
    };

    public delete = async (): Promise<void> => {
        try {
            await wappsto.delete(this.getUrl(), Model.generateOptions());
        } catch (e) {
            printHttpError(e);
        }
    };

    public static fetch = async (
        endpoint: string,
        params?: any
    ): Promise<any[]> => {
        try {
            let response = await wappsto.get(
                endpoint,
                Model.generateOptions(params)
            );

            if (response?.data) {
                if (_.isArray(response?.data)) {
                    return response.data;
                } else if (response.data) {
                    return [response.data];
                }
            } else {
                return [];
            }
        } catch (e) {
            printHttpError(e);
        }
        return [];
    };

    public parse(json: any): boolean {
        if (_.isArray(json)) {
            json = json[0];
        }
        let oldModel = this.toJSON();
        Object.assign(this, _.pick(json, this.attributes().concat(['meta'])));
        let newModel = this.toJSON();
        return !_.isEqual(oldModel, newModel);
    }

    static fromArray<T>(this: new () => T, json: any[]): T[] {
        return plainToClass(this, json);
    }

    public toJSON(): any {
        let meta = Object.assign(
            {},
            _.pick(this.meta, ['id', 'type', 'version'])
        );
        return Object.assign({ meta: meta }, _.pick(this, this.attributes()));
    }
}
