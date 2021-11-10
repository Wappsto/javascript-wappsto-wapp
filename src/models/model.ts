import * as _ from 'lodash';
import wappsto from '../util/http_wrapper';
import { printError } from '../util/http_wrapper';
import { IMeta } from './meta';
import settings from '../util/settings';

interface IRestriction {
    retrieve:boolean,
    update:boolean,
    delete:boolean,
    create:boolean
}

export class Model {
    meta: IMeta = {};

    url(): string {
        return '';
    }

    attributes(): string[] {
        return [];
    }

    private static handleQuery(url: string): string {
        if (settings.verbose) {
            if (url.includes('?')) {
                url += '&';
            } else {
                url += '?';
            }
            url += 'verbose=true';
        }
        return url;
    }

    private getUrl(path: string): string {
        let url = this.url() + path;
        return Model.handleQuery(url);
    }

    public create = async () => {
        try {
            let response = await wappsto.post(this.getUrl(''), this.toJSON());
            this.parse(response.data);
        } catch (e) {
            printError(e);
        }
    };

    public update = async () => {
        try {
            let response = await wappsto.put(
                this.getUrl('/' + this.meta.id),
                this.toJSON()
            );
            this.parse(response.data);
        } catch (e) {
            printError(e);
        }
    };

    public refresh = async () => {
        try {
            let response = await wappsto.get(this.getUrl('/' + this.meta.id));
            this.parse(response.data);
        } catch (e) {
            printError(e);
        }
    };

    public shareWith = async (user:string, restriction:IRestriction={retrieve: true, update: true, delete: false, create: false}) => {
        try {
            let response = await wappsto.patch(`/acl/${this.meta.id}?propagate=true`, {
                permission: [{
                    meta: {id: user},
                    restriction: [{
                        method: {
                            retrieve: restriction.retrieve,
                            update: restriction.update,
                            delete: restriction.delete,
                            create: restriction.create,
                        }
                    }
                    ]
                }]
            });
            return response.data;
        } catch (e) {
            printError(e);
        }
    };

    public static fetch = async (endpoint: string) => {
        try {
            let response = await wappsto.get(Model.handleQuery(endpoint));
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

    toJSON(): any {
        let meta = Object.assign(
            {},
            _.pick(this.meta, ['id', 'type', 'version'])
        );
        return Object.assign({ meta: meta }, _.pick(this, this.attributes()));
    }
}
