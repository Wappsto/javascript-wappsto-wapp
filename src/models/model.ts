import isEqual from 'lodash.isequal';
import pick from 'lodash.pick';
import omit from 'lodash.omit';
import { plainToClass } from 'class-transformer';
import { isUUID, replaceAll } from '../util/helpers';
import wappsto from '../util/http_wrapper';
import { printHttpError } from '../util/http_wrapper';
import { printError } from '../util/debug';
import { _config } from '../util/config';
import { getTraceId } from '../util/trace';
import { IMeta, IModel } from '../util/interfaces';
import interfaceTI from '../util/interfaces-ti';
import { addModel } from '../util/modelStore';
import { createCheckers } from 'ts-interface-checker';

export class Model implements IModel {
    meta: IMeta = { version: '2.1' };
    parent?: IModel;
    expand: number;
    static checker = createCheckers(interfaceTI);

    constructor(type: string, expand = 0, version = '2.1') {
        this.meta.type = type;
        this.meta.version = version;
        this.expand = expand;
    }

    public id(): string {
        return this.meta.id || '';
    }

    public getType(): string {
        return this.meta.type || '';
    }

    public getVersion(): string {
        return this.meta.version;
    }

    public url(): string {
        return `/${this.getVersion()}/${this.getType()}`;
    }

    public path(): string {
        return `/${this.getType()}/${this.id()}`;
    }

    public getClass(): string {
        return this.getType();
    }

    protected usePutForUpdate(): boolean {
        return true;
    }

    /* eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
    public removeChild(_: IModel): void {}

    /* istanbul ignore next */
    public attributes(): string[] {
        return [];
    }

    public addChildrenToStore(): void {
        addModel(this);
    }

    public setParent(parent?: IModel): void {
        Model.validateMethod('Model', 'setParent', arguments);
        this.parent = parent;
    }

    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    public perserve(): void {}

    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    public restore(): void {}

    protected validate(name: string, params: any): void {
        Model.validateMethod(this.getType(), name, params);
    }

    public getUrl(): string {
        if (this.meta.id) {
            return `${this.url()}/${this.id()}`;
        } else if (this.parent) {
            return `${this.parent.getUrl()}/${this.getType()}`;
        }
        return this.url();
    }

    public async _create(params: Record<string, any> = {}): Promise<void> {
        Model.validateMethod('Model', 'create', arguments);
        if (this.parent) {
            let valid = false;
            this.getUrl()
                .split('?')[0]
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
        addModel(this);
    }

    public async create(params: Record<string, any> = {}): Promise<void> {
        Model.validateMethod('Model', 'create', arguments);
        try {
            await this._create(params);
        } catch (e) {
            /* istanbul ignore next */
            printHttpError('Model.create', e);
        }
    }

    public async update(): Promise<boolean> {
        if (this.meta.id !== undefined) {
            try {
                let func;
                if (this.usePutForUpdate()) {
                    func = wappsto.put;
                } else {
                    func = wappsto.patch;
                }
                const response = await func(
                    this.getUrl(),
                    this.toJSON(),
                    Model.generateOptions()
                );
                this.parse(response?.data);
                return true;
            } catch (e) {
                /* istanbul ignore next */
                printHttpError('Model.update', e);
            }
        }
        return false;
    }

    /* istanbul ignore next */
    public async loadAllChildren(
        json: Record<string, any> | null,
        reloadAll = false
        /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    ): Promise<void> {}

    public async reload(
        reloadAll?: boolean,
        defaultExpand = 0
    ): Promise<boolean> {
        Model.validateMethod('Model', 'reload', arguments);

        let res = false;
        if (this.meta.id !== undefined) {
            try {
                const response = await wappsto.get(
                    this.getUrl(),
                    Model.generateOptions({
                        expand: reloadAll ? this.expand : defaultExpand,
                    })
                );
                this.parse(response.data);
                await this.loadAllChildren(response.data, reloadAll);
                res = true;
            } catch (e) {
                this.meta.id = undefined;
                printHttpError('Model.reload', e);
            }
        }
        return res;
    }

    public async delete(): Promise<void> {
        if (this.meta.id !== undefined) {
            try {
                await wappsto.delete(this.getUrl(), Model.generateOptions());
            } catch (e) {
                /* istanbul ignore next */
                printHttpError('Model.delete', e);
            }
            this.parent?.removeChild(this);
            this.meta.id = undefined;
        }
    }

    public parse(json: Record<string, any>): boolean {
        Model.validateMethod('Model', 'parse', arguments);
        if (Array.isArray(json)) {
            json = json[0];
        }
        const oldModel = this.toJSON();
        Object.assign(this, pick(json, this.attributes().concat(['meta'])));
        const newModel = this.toJSON();

        addModel(this);

        return !isEqual(oldModel, newModel);
    }

    /* istanbul ignore next */
    public parseChildren(json: Record<string, any>): boolean {
        return false;
    }

    public toJSON(): Record<string, any> {
        const meta = Object.assign(
            {},
            pick(this.meta, ['id', 'type', 'version', 'historical'])
        );

        return Object.assign(
            { meta: meta },
            this.removeUndefined(pick(this, this.attributes()))
        );
    }

    public static fetch = async (
        endpoint: string,
        params?: Record<string, any>,
        throwError?: boolean,
        go_internal?: boolean
    ): Promise<Record<string, any>[]> => {
        Model.validateMethod('Model', 'fetch', [
            endpoint,
            params,
            throwError,
            go_internal,
        ]);
        let res: any[] = [];
        try {
            const query = Model.generateOptions(
                Object.assign(
                    params || {},
                    go_internal === false ? {} : { go_internal: true }
                )
            );
            const response = await wappsto.get(endpoint, query);

            if (response.data) {
                if (Array.isArray(response.data)) {
                    res = response.data;
                } else {
                    res = [response.data];
                }
            }
        } catch (e) {
            const msg = printHttpError('Model.fetch', e);
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
            if (o && typeof o !== 'string') {
                const o2 = o as unknown as IModel;
                o2.setParent(parent);
                addModel(o2);
            }
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
                    const err = replaceAll(e.message, 'value.', '');
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

    private removeUndefined(obj: Record<string, any>, deep = 10) {
        if (obj && deep > 0) {
            Object.keys(obj).forEach((key) => {
                const value = obj[key];
                const type = typeof value;
                if (type === 'object') {
                    this.removeUndefined(value, (deep -= 1));
                } else if (type === 'undefined') {
                    delete obj[key];
                }
            });
        }
        return obj;
    }
}
