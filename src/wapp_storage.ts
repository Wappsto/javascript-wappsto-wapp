import { Data } from './models/data';
import { Model } from './models/model';
import { printError } from './util/debug';
import { isBrowser } from './util/helpers';
import { IWappStorage, StorageChangeHandler } from './util/interfaces';

const storages: Record<string, WappStorage> = {};

/**
 * Initializes a WappStorage instance with the given name.
 *
 * @param {string} name - The name of the WappStorage instance. If not provided, the default name will be used.
 * @return {Promise<WappStorage<T>>} A promise that resolves to the initialized WappStorage instance.
 */
export async function wappStorage<T = unknown>(name?: string) {
    Model.validateMethod('WappStorage', 'wappStorage', arguments);
    if (name === undefined) {
        name = 'default';
    }
    if (storages[name] === undefined) {
        const storage = new WappStorage<T>(name);
        await storage.init();
        storages[name] = storage;
    }
    return storages[name] as WappStorage<T>;
}

/**
 * Class representing a WappStorage instance.
 *
 * @implements IWappStorage
 * @template T - The type of the stored data.
 */
export class WappStorage<T = unknown> implements IWappStorage {
    name = '';
    id = '';
    #data: Data<T>;
    #onChangeCallback?: () => void;

    /**
     * Initializes a WappStorage instance with the provided name.
     *
     * @param {string} name - The name of the WappStorage instance.
     */
    constructor(name: string) {
        WappStorage.#validate('constructor', arguments);
        this.name = name;
        this.id = `wapp_storage_${this.name}`;
        this.#data = new Data<T>(this.id, 'wapp_storage');
    }

    /**
     * Initializes the WappStorage instance by fetching data based on the provided name.
     *
     * @return {Promise<void>} A Promise that resolves once the initialization is complete.
     */
    async init(): Promise<void> {
        const data = await Data.findByDataId(this.id);
        if (data.length > 0) {
            this.#data = data[0] as Data<T>;
        } else {
            await this.#data.create();
        }
    }

    #set(
        name: string | Record<string, T>,
        item?: T,
        secret?: boolean
    ): Promise<boolean> {
        if (typeof name === 'string') {
            if (item) {
                this.#data.set(name, item, secret);
            } else {
                throw new Error('Missing parameter "item" in set function');
            }
        } else {
            Object.keys(name).forEach((key) => {
                this.#data.set(key, name[key], secret);
            });
        }
        return this.update();
    }

    /**
     * Sets the value of a key-value pair in the storage.
     *
     * @param {string | Record<string, T>} name - The name of the key or an object containing multiple key-value pairs.
     * @param {T} [item] - The value to set for the specified key. This parameter is optional when setting multiple key-value pairs.
     * @return {Promise<boolean>} A Promise that resolves to true if the value was successfully set, and false otherwise.
     */
    set(name: string | Record<string, T>, item?: T): Promise<boolean> {
        WappStorage.#validate('set', arguments);
        return this.#set(name, item);
    }

    /**
     * Sets the secret value of a key-value pair in the storage.
     *
     * @param {string | Record<string, T>} name - The name of the key or an object containing multiple key-value pairs.
     * @param {T} [item] - The value to set as a secret for the specified key. This parameter is optional when setting multiple key-value pairs.
     * @return {Promise<boolean>} A Promise that resolves to true if the secret value was successfully set, and false otherwise.
     */
    async setSecret(
        name: string | Record<string, T>,
        item?: T
    ): Promise<boolean> {
        WappStorage.#validate('set', arguments);
        if (isBrowser()) {
            printError('You can only set secrets from the background');
            return false;
        }
        return this.#set(name, item, true);
    }

    #get(name: string | string[], secret?: boolean) {
        if (typeof name === 'string') {
            return this.#data.get(name, secret);
        } else {
            return name.map((key) => this.#data.get(key, secret));
        }
    }

    /**
     * Retrieves the value associated with the given name.
     *
     * @param {string | string[]} name - The name of the value to retrieve.
     * @return {any} The value associated with the given name.
     */
    get(name: string): T | undefined;
    get(name: string[]): (T | undefined)[];
    get(name: string | string[]) {
        WappStorage.#validate('get', arguments);
        return this.#get(name);
    }

    /**
     * Retrieves the secret value associated with the given name.
     *
     * @param {string | string[]} name - The name of the secret value to retrieve.
     * @return {any} The secret value associated with the given name, or undefined if the value is not found.
     */
    getSecret(name: string): T | undefined;
    getSecret(name: string[]): (T | undefined)[];
    getSecret(name: string | string[]) {
        WappStorage.#validate('getSecret', arguments);
        if (isBrowser()) {
            printError('You can only get secrets from the background');
            return;
        }
        return this.#get(name, true);
    }

    /**
     * Returns an array of all the keys in the storage.
     *
     * @return {Array<string>} An array of keys.
     */
    keys(): Array<string> {
        return this.#data.keys();
    }

    /**
     * Returns an array of all the values in the storage
     *
     * @return {Array<any>} An array of values.
     */
    values() {
        return this.#data.values();
    }

    /**
     * Retrieves an iterator of all the key-value pairs in the storage.
     *
     * @return {Iterator<[string, T]>} An iterator of key-value pairs.
     */
    entries() {
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

    /**
     * Removes the specified name(s) from the storage.
     *
     * @param {string | string[]} name - The name or an array of names to be removed.
     * @return {Promise<boolean>} A promise that resolves to true if the name(s) were successfully removed, and false otherwise.
     */
    remove(name: string | string[]): Promise<boolean> {
        WappStorage.#validate('remove', arguments);
        return this.#remove(name);
    }

    /**
     * Removes a secret value from the storage.
     *
     * @param {string | string[]} name - The name of the secret value to remove, or an array of names.
     * @return {Promise<boolean>} A promise that resolves to true if the secret value was successfully removed, and false otherwise.
     */
    async removeSecret(name: string | string[]): Promise<boolean> {
        WappStorage.#validate('removeSecret', arguments);
        if (isBrowser()) {
            printError('You can only remove secrets from the background');
            return false;
        }
        return this.#remove(name, true);
    }

    /**
     * Updates the data and returns a promise that resolves to a boolean indicating whether the update was successful.
     *
     * @return {Promise<boolean>} A promise that resolves to true if the update was successful, and false otherwise.
     */
    update(): Promise<boolean> {
        return this.#data.update();
    }

    async #handleStreamUpdate() {
        if (this.#onChangeCallback) {
            await this.#onChangeCallback();
        }
    }

    /**
     * Registers a callback function to be invoked when the storage changes.
     *
     * @param {StorageChangeHandler} cb - The callback function to be invoked.
     * @return {Promise<boolean>} A promise that resolves to true if the callback was successfully registered, and false otherwise.
     */
    onChange(cb: StorageChangeHandler): Promise<boolean> {
        WappStorage.#validate('onChange', arguments);
        this.#onChangeCallback = cb;
        return this.#data.onChange(this.#handleStreamUpdate.bind(this));
    }

    /**
     * Unregister the callback function that was previously registered with onChange.
     *
     * @return {Promise<boolean>} A promise that resolves to true if the callback was successfully unregistered, and false otherwise.
     */
    async cancelOnChange() {
        WappStorage.#validate('cancelOnChange', arguments);
        if (!this.#onChangeCallback) {
            return false;
        }
        return this.#data.cancelOnChange(this.#handleStreamUpdate.bind(this));
    }

    /**
     * Reloads the data from the server.
     *
     * @return {Promise<boolean>} A promise that resolves to a boolean indicating whether the reload was successful.
     */
    reload(): Promise<boolean> {
        return this.#data.reload();
    }

    /**
     * Resets the state of the wapp storage.
     *
     * @return {Promise<void>} A promise that resolves when the reset is complete.
     */
    async reset(): Promise<void> {
        await this.#data.delete();
        this.#data = new Data(this.id, 'wapp_storage');
        await this.#data.create();
    }

    static #validate(name: string, params: IArguments): void {
        Model.validateMethod('WappStorage', name, params);
    }
}
