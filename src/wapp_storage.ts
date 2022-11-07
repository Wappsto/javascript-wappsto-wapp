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

    set(name: string, item: any): Promise<boolean> {
        WappStorage.validate('set', arguments);
        this.data.set(name, item);
        return this.update();
    }

    get(name: string): any {
        WappStorage.validate('get', arguments);
        return this.data.get(name);
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

    remove(name: string): Promise<boolean> {
        WappStorage.validate('remove', arguments);
        this.data.remove(name);
        return this.data.update();
    }

    update(): Promise<boolean> {
        return this.data.update();
    }

    onChange(cb: StorageChangeHandler): Promise<boolean> {
        WappStorage.validate('onChange', arguments);
        return this.data.onChange(async (data) => {
            await cb();
        });
    }

    reload(): Promise<void> {
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
