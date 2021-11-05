import * as _ from 'lodash';
import wappsto from '../axios_wrapper';
import { printError } from '../axios_wrapper';
import { IMeta } from './meta';

export class Model {
    meta: IMeta = {};

    constructor() {}

    getUrl(): string {
        return '';
    }

    getAttributes(): string[] {
        return [];
    }

    public create = async () => {
        try {
            let response = await wappsto.post(this.getUrl(), this.toJSON());
            this.parse(response.data);
        } catch (e) {
            printError(e);
        }
    };

    public update = async () => {
        try {
            let response = await wappsto.put(
                this.getUrl() + '/' + this.meta.id,
                this.toJSON()
            );
            this.parse(response.data);
        } catch (e) {
            printError(e);
        }
    };

    public static fetch = async (endpoint: string) => {
        try {
            let response = await wappsto.get(endpoint);
            return response.data;
        } catch (e) {
            printError(e);
        }
        return [];
    };

    parse(json: any): void {
        Object.assign(this, json);
    }

    static fromJSON(json: any): any {
        json = json;
    }

    toJSON(): any {
        return Object.assign({}, _.pick(this, this.getAttributes()));
    }
}
