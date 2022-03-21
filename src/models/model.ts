import { isArray, isEqual, pick, omit } from 'lodash';
import { plainToClass } from 'class-transformer';
import { isUUID } from '../util/helpers';
import wappsto from '../util/http_wrapper';
import { printHttpError } from '../util/http_wrapper';
import { printError } from '../util/debug';
import { _config } from '../util/config';
import { getTraceId } from '../util/trace';
import { IMeta, IModel } from '../util/interfaces';
import interfaceTI from '../util/interfaces-ti';
import { createCheckers } from 'ts-interface-checker';

export class Model implements IModel {
    meta: IMeta = {};
    parent?: IModel;
    static checker = createCheckers(interfaceTI);

    constructor(type: string, version = '2.0') {
        this.meta.type = type;
        this.meta.version = version;
    }

    public id(): string {
        return this.meta.id || '';
    }

    public url(): string {
        return `/${this.meta.version}/${this.meta.type}`;
    }

    public path(): string {
        return `/${this.meta.type}/${this.id()}`;
    }

    /* eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
    public removeChild(_: IModel): void {}

    /* istanbul ignore next */
    public attributes(): string[] {
        return [];
    }

    public setParent(parent: IModel): void {
        Model.validateMethod('Model', 'setParent', arguments);
        this.parent = parent;
    }

    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    public perserve(): void {}

    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    public restore(): void {}

    protected validate(name: string, params: any): void {
        Model.validateMethod(this.meta.type, name, params);
    }

    public getUrl(): string {
        if (this.meta.id) {
            return this.url() + '/' + this.id();
        } else if (this.parent) {
            return this.parent.getUrl() + '/' + this.meta.type;
        }
        return this.url();
    }

    public async _create(params: Record<string, any> = {}): Promise<void> {
        Model.validateMethod('Model', 'create', arguments);
        if (this.parent) {
            let valid = false;
            this.getUrl()
                .split('/')
                .forEach((u) => {
                    if (isUUID(u)) {
                        valid = true;
                    }
                });
            /* istanbul ignore next */
            if (!valid) {
                throw new Error(
                    "Can't create a child under a parent that do not have an ID"
                );
            }
        }

        const response = await wappsto.post(
            this.getUrl(),
            this.toJSON(),
            Model.generateOptions(params)
        );
        this.perserve();
        this.parse(response.data);
        this.restore();
    }

    public async create(params: Record<string, any> = {}): Promise<void> {
        Model.validateMethod('Model', 'create', arguments);
        try {
            await this._create(params);
        } catch (e) {
            /* istanbul ignore next */
            printHttpError(e);
        }
    }

    public async update(): Promise<void> {
        try {
            const response = await wappsto.patch(
                this.getUrl(),
                this.toJSON(),
                Model.generateOptions()
            );
            this.parse(response.data);
        } catch (e) {
            /* istanbul ignore next */
            printHttpError(e);
        }
    }

    public async reload(): Promise<void> {
        try {
            const response = await wappsto.get(
                this.getUrl(),
                Model.generateOptions()
            );
            this.parse(response.data);
        } catch (e) {
            /* istanbul ignore next */
            printHttpError(e);
        }
    }

    public async delete(): Promise<void> {
        try {
            await wappsto.delete(this.getUrl(), Model.generateOptions());
            this.parent?.removeChild(this);
            this.meta.id = undefined;
        } catch (e) {
            /* istanbul ignore next */
            printHttpError(e);
        }
    }

    public parse(json: Record<string, any>): boolean {
        Model.validateMethod('Model', 'parse', arguments);
        if (isArray(json)) {
            json = json[0];
        }
        const oldModel = this.toJSON();
        Object.assign(this, pick(json, this.attributes().concat(['meta'])));
        const newModel = this.toJSON();
        return !isEqual(oldModel, newModel);
    }

    /* istanbul ignore next */
    public parseChildren(json: Record<string, any>): boolean {
        return false;
    }

    public toJSON(): Record<string, any> {
        const meta = Object.assign(
            {},
            pick(this.meta, ['id', 'type', 'version'])
        );

        return Object.assign(
            { meta: meta },
            this.removeUndefined(pick(this, this.attributes()))
        );
    }

    public static fetch = async (
        endpoint: string,
        params?: Record<string, any>,
        throwError?: boolean
    ): Promise<Record<string, any>[]> => {
        Model.validateMethod('Model', 'fetch', [endpoint, params, throwError]);
        let res: any[] = [];
        try {
            const response = await wappsto.get(
                endpoint,
                Model.generateOptions(params)
            );

            if (response?.data) {
                if (isArray(response.data)) {
                    res = response.data;
                } else if (response.data) {
                    res = [response.data];
                }
            }
        } catch (e) {
            const msg = printHttpError(e);
            if (throwError) {
                throw msg;
            }
        }
        return res;
    };

    public static fromArray<T>(
        this: new () => T,
        json: Record<string, any>[],
        parent?: IModel
    ): T[] {
        const obj = plainToClass(this, json);
        obj.forEach((o: T) => {
            const o2 = o as unknown as IModel;
            o2.setParent(parent);
        });
        return obj;
    }

    public static validateMethod(
        type: string | undefined,
        name: string,
        params: any
    ): void {
        if (type !== undefined && _config.validation !== 'none') {
            const c = Object.keys(Model.checker).find(
                (k) => k.toLowerCase() === `i${type.toLowerCase()}func`
            );

            /* istanbul ignore else */
            if (c) {
                const m = Model.checker[c].methodArgs(name);
                try {
                    m.check(Array.from(params));
                } catch (e: any) {
                    const err = e.message.replaceAll('value.', '');
                    e.message = `${type}.${name}: ${err}`;
                    throw e;
                }
            } else {
                printError(`Failed to find functions for ${type}`);
            }
        }
    }

    protected static generateOptions(
        params?: Record<string, any>
    ): Record<string, any> {
        let options: Record<string, any> = {
            params: {},
        };
        if (params) {
            Object.assign(options.params, params);
        }
        if (_config.verbose) {
            options.params['verbose'] = true;
        }
        if (getTraceId()) {
            options.params['trace'] = getTraceId();
        }
        if (Object.keys(options.params).length === 0) {
            options = omit(options, 'params');
        }
        return options;
    }

    private removeUndefined(obj: Record<string, any>) {
        if (obj) {
            Object.keys(obj).forEach((key) => {
                const value = obj[key];
                const type = typeof value;
                if (type === 'object') {
                    this.removeUndefined(value);
                } else if (type === 'undefined') {
                    delete obj[key];
                }
            });
        }
        return obj;
    }
}
