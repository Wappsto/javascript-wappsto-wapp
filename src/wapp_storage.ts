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

    async set(name: string, item: any): Promise<void> {
        WappStorage.validate('set', arguments);
        this.data.set(name, item);
        await this.data.update();
    }

    get(name: string): any {
        WappStorage.validate('get', arguments);
        return this.data.get(name);
    }

    onChange(cb: StorageChangeHandler): void {
        WappStorage.validate('onChange', arguments);
        this.data.onChange((data) => {
            cb();
        });
    }

    async reload(): Promise<void> {
        await this.data.reload();
    }

    reset(): void {
        this.data.delete();
        this.data = new Data(this.id, 'wapp_storage');
        this.data.create();
    }

    private static validate(name: string, params: any): void {
        Model.validateMethod('WappStorage', name, params);
    }
}
