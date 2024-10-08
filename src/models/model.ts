import { plainToInstance } from 'class-transformer';
import isEqual from 'lodash.isequal';
import omit from 'lodash.omit';
import pick from 'lodash.pick';
import { _config } from '../util/config';
import { printDebug, printError } from '../util/debug';
import { isUUID, replaceAll } from '../util/helpers';
import wappsto, { printHttpError } from '../util/http_wrapper';
import {
    FetchRequest,
    Filter,
    IModel,
    JSONObject,
    Meta,
    ValidateParams,
} from '../util/types';
import { addModel, removeModel } from '../util/modelStore';
import { getTypeChecker } from '../util/checker';

export class Model implements IModel {
    static checker = getTypeChecker();
    [x: string]: any;
    meta: Meta = { version: '2.1' };
    parent?: IModel;
    expand: number;
    #updateQueue: {
        data: JSONObject;
        resolve: (value: boolean | PromiseLike<boolean>) => void;
    }[] = [];

    constructor(type: string, expand = 0, version = '2.1') {
        this.meta.type = type;
        this.meta.version = version;
        this.expand = expand;
    }

    id(): string {
        return this.meta.id || '';
    }

    getType(): string {
        return this.meta.type || '';
    }

    getVersion(): string {
        return this.meta.version ?? '2.1';
    }

    url(): string {
        return `/${this.getVersion()}/${this.getType()}`;
    }

    path(): string {
        return `/${this.getType()}/${this.id()}`;
    }

    getClass(): string {
        return this.getType();
    }

    protected usePutForUpdate(): boolean {
        return true;
    }

    /* eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
    removeChild(_: IModel): void {}

    /* istanbul ignore next */
    getAttributes(): string[] {
        return [];
    }

    addChildrenToStore(): void {
        addModel(this);
    }

    setParent(parent?: IModel): void {
        Model.validateMethod('Model', 'setParent', arguments);
        this.parent = parent;
    }

    getParent() {
        return this.parent;
    }

    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    preserve(): void {}

    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    restore(): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static getMetaFilterResult(_filter?: Filter): string {
        return 'meta{id type version connection name_by_user}';
    }

    protected validate(name: string, params: ValidateParams): void {
        Model.validateMethod(this.getType(), name, params);
    }

    getUrl(): string {
        if (this.meta.id) {
            return `${this.url()}/${this.id()}`;
        } else if (this.parent) {
            return `${this.parent.getUrl()}/${this.getType()}`;
        }
        return this.url();
    }

    async _create(params: JSONObject = {}): Promise<void> {
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
        this.preserve();
        if (response?.data) {
            this.parse(response.data);
        }
        this.restore();
        addModel(this);
    }

    async create(params: JSONObject = {}): Promise<void> {
        Model.validateMethod('Model', 'create', arguments);
        try {
            await this._create(params);
        } catch (e) {
            printHttpError('Model.create', e);
            throw e;
        }
    }

    async #update(): Promise<void> {
        if (!this.#updateQueue.length) {
            return;
        }

        printDebug(`Processing update queue: ${this.#updateQueue.length}`);
        const event = this.#updateQueue[0];
        try {
            const func = this.usePutForUpdate() ? wappsto.put : wappsto.patch;
            const response = await func(
                this.getUrl(),
                event.data,
                Model.generateOptions()
            );
            this.parse(response?.data);
            event.resolve(true);
        } catch (e) {
            printHttpError('Model.update', e);
            event.resolve(false);
        }

        this.#updateQueue.shift();

        this.#update();
    }

    async update(customKeys?: string[]): Promise<boolean> {
        if (this.meta.id !== undefined) {
            return new Promise<boolean>((resolve) => {
                printDebug(
                    `Adding to update queue: ${this.#updateQueue.length}`
                );
                this.#updateQueue.push({
                    data: this.toJSON(customKeys),
                    resolve,
                });
                if (this.#updateQueue.length === 1) {
                    this.#update();
                }
            });
        }
        return false;
    }

    /* istanbul ignore next */
    async loadAllChildren(
        json: JSONObject | null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        reloadAll = false
        /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    ): Promise<void> {}

    async reloadAndParse(
        reloadAll?: boolean,
        defaultExpand = 0
    ): Promise<boolean> {
        Model.validateMethod('Model', 'reload', arguments);

        if (this.meta.id === undefined) {
            return false;
        }

        const response = await wappsto.get(
            this.getUrl(),
            Model.generateOptions({
                expand: reloadAll ? this.expand : defaultExpand,
            })
        );
        this.parse(response.data);
        await this.loadAllChildren(response.data, reloadAll);
        return true;
    }

    async reload(reloadAll?: boolean, defaultExpand = 0): Promise<boolean> {
        Model.validateMethod('Model', 'reload', arguments);

        let result = false;
        try {
            result = await this.reloadAndParse(reloadAll, defaultExpand);
        } catch (e) {
            this.meta.id = undefined;
            printHttpError('Model.reload', e);
        }
        return result;
    }

    async delete(): Promise<void> {
        if (this.meta.id !== undefined) {
            try {
                await wappsto.delete(this.getUrl(), Model.generateOptions());
            } catch (e) {
                printHttpError('Model.delete', e);
            }
            removeModel(this);
            this.parent?.removeChild(this);
            this.meta.id = undefined;
        }
    }

    parse(json: JSONObject): boolean {
        Model.validateMethod('Model', 'parse', arguments);
        if (Array.isArray(json)) {
            json = json[0];
        }

        const oldModel = this.toJSON();
        Object.assign(this, pick(json, this.getAttributes().concat(['meta'])));
        const newModel = this.toJSON();

        return !isEqual(oldModel, newModel);
    }

    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parseChild(json: JSONObject): boolean {
        return false;
    }

    toJSON(customKeys?: string[]): JSONObject {
        if (customKeys) {
            return Object.assign(
                {},
                this.#removeUndefined(pick(this, customKeys))
            );
        }
        const meta = Object.assign(
            {},
            pick(this.meta, [
                'id',
                'type',
                'version',
                'historical',
                'name_by_user',
                'tag_by_user',
            ])
        );

        return Object.assign(
            { meta: meta },
            this.#removeUndefined(pick(this, this.getAttributes()))
        );
    }

    static fetch = async (params: FetchRequest): Promise<JSONObject[]> => {
        Model.validateMethod('Model', 'fetch', [params]);
        let res: JSONObject[] = [];
        try {
            const query = Model.generateOptions(
                Object.assign(
                    { method: ['retrieve'] },
                    params.params || {},
                    params.go_internal === false ? {} : { go_internal: true },
                    params.body !== undefined ? { fetch: true } : {}
                )
            );
            let response;
            if (params.body) {
                response = await wappsto.post(
                    params.endpoint,
                    params.body,
                    query
                );
            } else {
                response = await wappsto.get(params.endpoint, query);
            }

            if (response.data) {
                if (Array.isArray(response.data)) {
                    res = response.data;
                } else {
                    res = [response.data];
                }
            }
        } catch (e) {
            const msg = printHttpError('Model.fetch', e);
            if (params.throw_error) {
                throw msg;
            }
        }
        return res;
    };

    static fromArray<T>(
        this: new () => T,
        json: JSONObject[],
        parent?: IModel
    ): (T | string)[] {
        const obj = plainToInstance(this, json) || [];
        return obj.map((o: T) => {
            if (o && typeof o !== 'string') {
                const o2 = o as unknown as IModel;
                o2.setParent(parent);
                return addModel(o2) as T;
            }
            return o;
        });
    }

    static validateMethod(
        type: string | undefined,
        name: string,
        params: ValidateParams,
        isStatic = false
    ): void {
        if (type !== undefined && _config.validation !== 'none') {
            const funcName = `i${type.toLowerCase()}${
                isStatic ? 'static' : ''
            }func`;
            const c = Object.keys(Model.checker).find(
                (k) => k.toLowerCase() === funcName
            );

            /* istanbul ignore else */
            if (c) {
                const m = Model.checker[c].methodArgs(name);
                try {
                    m.check(Array.from(params));
                } catch (e: unknown) {
                    const err = replaceAll((e as Error).message, 'value.', '');
                    (e as Error).message = `${type}.${name}: ${err}`;
                    throw e;
                }
            } else {
                printError(
                    `Failed to find functions for ${type} when looking for ${name}`
                );
            }
        }
    }

    protected static generateOptions(params?: JSONObject): JSONObject {
        const options: { params: JSONObject } = {
            params: {},
        };
        if (params) {
            Object.assign(options.params, params);
        }
        if (_config.verbose) {
            options.params['verbose'] = true;
        }
        if (Object.keys(options.params).length === 0) {
            return omit(options, 'params');
        }
        return options;
    }

    #removeUndefined(obj: JSONObject, deep = 10) {
        if (obj && deep > 0) {
            Object.keys(obj).forEach((key) => {
                const value = obj[key];
                if (typeof value === 'object') {
                    if (Array.isArray(value)) {
                        obj[key] = value.filter(
                            (v) => typeof v !== 'undefined'
                        );
                    } else {
                        this.#removeUndefined(value, (deep -= 1));
                    }
                } else if (typeof value === 'undefined') {
                    delete obj[key];
                }
            });
        }
        return obj;
    }
}
