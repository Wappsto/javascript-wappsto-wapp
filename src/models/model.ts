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

type Constructor<T> = {
    new (): T;
    fromJSON(json: any): T;
    fromArray(data: any): T[];
};

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

    public create = async (): Promise<void> => {
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

    public update = async (): Promise<void> => {
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

    public refresh = async (): Promise<void> => {
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

    static findById<T extends Model>(
        this: Constructor<T>,
        id: string
    ): Promise<T> {
        return new Promise<T>((resolve) => {
            let tmp = new this();
            tmp.findById(id).then(() => {
                resolve(tmp);
            });
        });
    }

    public findById = async (id: string): Promise<any> => {
        try {
            let response = await wappsto.get(this.getUrl(id));
            this.parse(response.data);
        } catch (e) {
            printError(e);
        }
    };

    __shareWith = async (
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
                    {},
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

    public static fetch = async (
        endpoint: string,
        params?: any
    ): Promise<any[]> => {
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

    fromArray<T extends Model>(this: Constructor<T>, data: any): T[] {
        return this.fromArray(data);
    }

    static fromArray<T extends Model>(this: Constructor<T>, data: any): T[] {
        let array: T[] = [];

        data?.forEach((json: any) => {
            array.push(this.fromJSON(json));
        });
        return array;
    }

    static fromJSON<T extends Model>(this: Constructor<T>, json: any): T {
        let m = new this();
        return Object.assign(m, json);
    }

    toJSON(): any {
        let meta = Object.assign(
            {},
            _.pick(this.meta, ['id', 'type', 'version'])
        );
        return Object.assign({ meta: meta }, _.pick(this, this.attributes()));
    }
}
