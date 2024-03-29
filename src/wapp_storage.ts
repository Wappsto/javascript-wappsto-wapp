import { Data } from './models/data';
import { Model } from './models/model';
import { printError } from './util/debug';
import { isBrowser } from './util/helpers';
import { IWappStorage, StorageChangeHandler } from './util/interfaces';

const storages: Record<string, WappStorage> = {};

export async function wappStorage(name?: string) {
    Model.validateMethod('WappStorage', 'wappStorage', arguments);
    if (name === undefined) {
        name = 'default';
    }
    if (storages[name] === undefined) {
        const storage = new WappStorage(name);
        await storage.init();
        storages[name] = storage;
    }
    return storages[name];
}

export class WappStorage implements IWappStorage {
    name = '';
    id = '';
    #data: Data;
    #onChangeCallback?: () => void;

    constructor(name: string) {
        WappStorage.#validate('constructor', arguments);
        this.name = name;
        this.id = `wapp_storage_${this.name}`;
        this.#data = new Data(this.id, 'wapp_storage');
    }

    async init(): Promise<void> {
        const data = await Data.findByDataId(this.id);
        if (data.length > 0) {
            this.#data = data[0];
        } else {
            await this.#data.create();
        }
    }

    #set(
        name: string | Record<string, any>,
        item?: any,
        secret?: boolean
    ): Promise<boolean> {
        if (typeof name === 'string') {
            this.#data.set(name, item, secret);
        } else {
            Object.keys(name).forEach((key) => {
                this.#data.set(key, name[key], secret);
            });
        }
        return this.update();
    }

    set(name: string | Record<string, any>, item?: any): Promise<boolean> {
        WappStorage.#validate('set', arguments);
        return this.#set(name, item);
    }

    async setSecret(
        name: string | Record<string, any>,
        item?: any
    ): Promise<boolean> {
        WappStorage.#validate('set', arguments);
        if (isBrowser()) {
            printError('You can only set secrets from the background');
            return false;
        }
        return this.#set(name, item, true);
    }

    #get(name: string | string[], secret?: boolean): any {
        if (typeof name === 'string') {
            return this.#data.get(name, secret);
        } else {
            return name.map((key) => this.#data.get(key, secret));
        }
    }

    get(name: string | string[]): any {
        WappStorage.#validate('get', arguments);
        return this.#get(name);
    }

    getSecret(name: string | string[]): any {
        WappStorage.#validate('getSecret', arguments);
        if (isBrowser()) {
            printError('You can only get secrets from the background');
            return;
        }
        return this.#get(name, true);
    }

    keys(): Array<string> {
        return this.#data.keys();
    }

    values(): Array<any> {
        return this.#data.values();
    }

    entries(): Array<Array<any>> {
        return this.#data.entries();
    }

    #remove(name: string | string[], secret?: boolean): Promise<boolean> {
        if (typeof name === 'string') {
            this.#data.remove(name, secret);
        } else {
            name.forEach((key) => this.#data.remove(key, secret));
        }
        return this.#data.update();
    }

    remove(name: string | string[]): Promise<boolean> {
        WappStorage.#validate('remove', arguments);
        return this.#remove(name);
    }

    async removeSecret(name: string | string[]): Promise<boolean> {
        WappStorage.#validate('removeSecret', arguments);
        if (isBrowser()) {
            printError('You can only remove secrets from the background');
            return false;
        }
        return this.#remove(name, true);
    }

    update(): Promise<boolean> {
        return this.#data.update();
    }

    async #handleStreamUpdate() {
        if (this.#onChangeCallback) {
            await this.#onChangeCallback();
        }
    }

    onChange(cb: StorageChangeHandler): Promise<boolean> {
        WappStorage.#validate('onChange', arguments);
        this.#onChangeCallback = cb;
        return this.#data.onChange(async () => this.#handleStreamUpdate());
    }

    cancelOnChange() {
        WappStorage.#validate('cancelOnChange', arguments);
        if (this.#onChangeCallback) {
            this.#data.cancelOnChange(async () => this.#handleStreamUpdate());
        }
    }

    reload(): Promise<boolean> {
        return this.#data.reload();
    }

    async reset(): Promise<void> {
        await this.#data.delete();
        this.#data = new Data(this.id, 'wapp_storage');
        await this.#data.create();
    }

    static #validate(name: string, params: any): void {
        Model.validateMethod('WappStorage', name, params);
    }
}
