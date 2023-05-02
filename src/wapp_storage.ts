import { Model } from './models/model';
import { Data } from './models/data';
import { StorageChangeHandler } from './util/interfaces';

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

export class WappStorage {
    name = '';
    id = '';
    data: Data;

    constructor(name: string) {
        WappStorage.validate('constructor', arguments);
        this.name = name;
        this.id = `wapp_storage_${this.name}`;
        this.data = new Data(this.id, 'wapp_storage');
    }

    async init(): Promise<void> {
        const data = await Data.findByDataId(this.id);
        if (data.length > 0) {
            this.data = data[0];
        } else {
            await this.data.create();
        }
    }

    set(name: string | Record<string, any>, item?: any): Promise<boolean> {
        WappStorage.validate('set', arguments);
        if (typeof name === 'string') {
            this.data.set(name, item);
        } else {
            Object.keys(name).forEach((key) => {
                this.data.set(key, name[key]);
            });
        }
        return this.update();
    }

    get(name: string | string[]): any {
        WappStorage.validate('get', arguments);
        if (typeof name === 'string') {
            return this.data.get(name);
        } else {
            return name.map((key) => this.data.get(key));
        }
    }

    keys(): Array<string> {
        return this.data.keys();
    }

    values(): Array<any> {
        return this.data.values();
    }

    entries(): Array<Array<any>> {
        return this.data.entries();
    }

    remove(name: string | string[]): Promise<boolean> {
        WappStorage.validate('remove', arguments);
        if (typeof name === 'string') {
            this.data.remove(name);
        } else {
            name.forEach((key) => this.data.remove(key));
        }
        return this.data.update();
    }

    update(): Promise<boolean> {
        return this.data.update();
    }

    onChange(cb: StorageChangeHandler): Promise<boolean> {
        WappStorage.validate('onChange', arguments);
        return this.data.onChange(async () => {
            await cb();
        });
    }

    reload(): Promise<boolean> {
        return this.data.reload();
    }

    async reset(): Promise<void> {
        await this.data.delete();
        this.data = new Data(this.id, 'wapp_storage');
        await this.data.create();
    }

    private static validate(name: string, params: any): void {
        Model.validateMethod('WappStorage', name, params);
    }
}
