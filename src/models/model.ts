import * as _ from 'lodash';
import wappsto from '../util/http_wrapper';
import { printError } from '../util/http_wrapper';
import { IMeta } from './meta';
import settings from '../util/settings';

interface IRestriction {
    retrieve: boolean;
    update: boolean;
    delete: boolean;
    create: boolean;
}

export class Model {
    meta: IMeta = {};

    url(): string {
        return '';
    }

    attributes(): string[] {
        return [];
    }

    private static generateOptions(params?: any, body?: any): any {
        let options: any = {
            params: {},
        };
        if (params) {
            Object.assign(options.params, params);
        }
        if (settings.verbose) {
            options.params['verbose'] = true;
        }
        if (body) {
            options['body'] = body;
        }
        if (Object.keys(options.params).length === 0) {
            options = _.omit(options, 'params');
        }
        return options;
    }

    private getUrl(path?: string): string {
        if (path) {
            return this.url() + '/' + path;
        }
        return this.url();
    }

    public create = async () => {
        try {
            let response = await wappsto.post(
                this.getUrl(),
                Model.generateOptions({}, this.toJSON())
            );
            this.parse(response.data);
        } catch (e) {
            printError(e);
        }
    };

    public update = async () => {
        try {
            let response = await wappsto.put(
                this.getUrl(this.meta.id),
                Model.generateOptions({}, this.toJSON())
            );
            this.parse(response.data);
        } catch (e) {
            printError(e);
        }
    };

    public refresh = async () => {
        try {
            let response = await wappsto.get(
                this.getUrl(this.meta.id),
                Model.generateOptions()
            );
            this.parse(response.data);
        } catch (e) {
            printError(e);
        }
    };

    public findById = async (id: string) => {
        try {
            let response = await wappsto.get(
                this.getUrl(''),
                Model.generateOptions({ 'this.id': id })
            );
            return this.fromArray(response.data);
        } catch (e) {
            printError(e);
        }
    };

    public shareWith = async (
        user: string,
        restriction: IRestriction = {
            retrieve: true,
            update: true,
            delete: false,
            create: false,
        }
    ) => {
        try {
            let response = await wappsto.patch(
                `/acl/${this.meta.id}`,
                Model.generateOptions(
                    { propagate: true },
                    {
                        permission: [
                            {
                                meta: { id: user },
                                restriction: [
                                    {
                                        method: {
                                            retrieve: restriction.retrieve,
                                            update: restriction.update,
                                            delete: restriction.delete,
                                            create: restriction.create,
                                        },
                                    },
                                ],
                            },
                        ],
                    }
                )
            );
            return response.data;
        } catch (e) {
            printError(e);
        }
    };

    public static fetch = async (endpoint: string, params?: any) => {
        try {
            let response = await wappsto.get(
                endpoint,
                Model.generateOptions(params)
            );
            return response.data;
        } catch (e) {
            printError(e);
        }
        return [];
    };

    parse(json: any): void {
        Object.assign(this, json);
    }

    static fromJSON(_: any): any {}
    fromArray(_: any): any {}
    static fromArray(_: any): any {}

    toJSON(): any {
        let meta = Object.assign(
            {},
            _.pick(this.meta, ['id', 'type', 'version'])
        );
        return Object.assign({ meta: meta }, _.pick(this, this.attributes()));
    }
}
