import { Type } from 'class-transformer';
import isEqual from 'lodash.isequal';
import { printDebug, printWarning } from '../util/debug';
import { generateFilterRequest } from '../util/filter';
import { convertFilterToJson, convertFilterToString } from '../util/helpers';
import {
    Filter,
    IDevice,
    IModel,
    INetwork,
    JSONObject,
    ValidateParams,
} from '../util/interfaces';
import { addModel, getModel } from '../util/modelStore';
import { Device } from './device';
import { Model } from './model';
import { ConnectionModel } from './model.connection';
import { PermissionModel } from './model.permission';
import { Value } from './value';

export async function createNetwork(params: INetwork): Promise<Network> {
    Model.validateMethod('Network', 'createNetwork', arguments);

    const networks = await Network.fetchByName(params.name);
    if (networks.length !== 0) {
        printDebug(`Using existing network with id ${networks[0].id()}`);
        networks[0].addChildrenToStore();
        return networks[0];
    }

    const network = new Network();
    network.name = params.name;
    network.description = params.description;
    await network.create();

    return network;
}

export class Network extends ConnectionModel implements INetwork {
    static endpoint = '/2.1/network';
    static attributes = ['name', 'description'];
    name: string;
    description?: string;
    @Type(() => Device)
    device: Device[] = [];

    get devices() {
        return this.device;
    }

    constructor(name?: string) {
        super('network', 3);
        Model.validateMethod('Network', 'constructor', arguments);
        this.name = name || '';
    }

    getAttributes(): string[] {
        return Network.attributes;
    }

    public static getFilter(filter?: Filter, omit_filter?: Filter): string[] {
        Network.#validate('getFilter', [filter, omit_filter]);
        return convertFilterToJson(
            'network',
            Network.attributes,
            filter?.network,
            omit_filter?.network
        ).concat(Device.getFilter(filter, omit_filter));
    }

    public static getFilterResult(
        filter?: Filter,
        omit_filter?: Filter
    ): string {
        Network.#validate('getFilterResult', [filter, omit_filter]);
        const fields = [Model.getMetaFilterResult()]
            .concat(Network.attributes)
            .join(' ');

        const strFilter = convertFilterToString(
            Network.attributes,
            filter?.network,
            omit_filter?.network
        );

        return `network ${strFilter} { ${fields} ${Device.getFilterResult(
            filter,
            omit_filter
        )}}`;
    }

    public addChildrenToStore(): void {
        super.addChildrenToStore();
        this.device.forEach((dev: IModel) => {
            if (dev?.addChildrenToStore) {
                dev.addChildrenToStore();
            }
        });
    }

    public findDeviceByName(name: string): Device[] {
        this.validate('findDeviceByName', arguments);
        return this.device.filter((dev) => dev.name === name);
    }

    public findDeviceByProduct(product: string): Device[] {
        this.validate('findDeviceByProduct', arguments);
        return this.device.filter((dev) => dev.product === product);
    }

    public findValueByName(name: string): Value[] {
        this.validate('findValueByName', arguments);
        let values: Value[] = [];
        this.device.forEach((dev) => {
            values = values.concat(dev.findValueByName(name));
        });
        return values;
    }

    public findValueByType(type: string): Value[] {
        this.validate('findValueByType', arguments);
        let values: Value[] = [];
        this.device.forEach((dev) => {
            values = values.concat(dev.findValueByType(type));
        });
        return values;
    }

    public async loadAllChildren(
        json: JSONObject | null,
        reloadAll = false
    ): Promise<void> {
        const proms: Promise<void>[] = [];
        let devices: (Device | string)[] | undefined;
        if (json) {
            if (json.device !== undefined) {
                devices = json.device as (Device | string)[];
            } else if (json[0]) {
                if (typeof json[0] === 'object' && 'device' in json[0]) {
                    devices = json[0].device as (Device | string)[];
                } else {
                    printWarning(
                        `Network: loadAllChildren: the key 'device' not found in json: ${json[0]}`
                    );
                }
            }

            if (devices !== undefined) {
                const oldDevices = this.device;
                this.device = [];
                for (let i = 0; i < devices.length; i++) {
                    let id: string;
                    let data: JSONObject | undefined = undefined;

                    if (typeof devices[i] === 'string') {
                        id = devices[i] as string;
                    } else {
                        data = devices[i] as Device;
                        id = (data as Device).meta.id ?? '';
                    }

                    const dev = oldDevices.find((dev) => dev.meta.id === id);
                    if (dev) {
                        this.device.push(dev);
                        if (data) {
                            dev.parse(data);
                            if (reloadAll) {
                                proms.push(
                                    dev.loadAllChildren(data, reloadAll)
                                );
                            }
                        }
                    } else {
                        if (data) {
                            const newDevice = ((await getModel('device', id)) ??
                                new Device()) as Device;
                            newDevice.parse(data);
                            newDevice.parent = this;
                            this.device.push(newDevice);
                            proms.push(
                                new Promise(async (resolve) => {
                                    await newDevice.loadAllChildren(
                                        data,
                                        false
                                    );
                                    addModel(newDevice);
                                    resolve();
                                })
                            );
                        } else {
                            this.device.push(devices[i] as Device);
                        }
                    }
                }
            }
        }

        for (let i = 0; i < this.device.length; i++) {
            if (typeof this.device[i] === 'object') {
                this.device[i].parent = this;
                if (devices === undefined) {
                    proms.push(
                        new Promise(async (resolve) => {
                            await this.device[i].loadAllChildren(null, false);
                            this.device[i] = addModel(this.device[i]) as Device;
                            resolve();
                        })
                    );
                } else {
                    this.device[i] = addModel(this.device[i]) as Device;
                }
            } else if (typeof this.device[i] === 'string') {
                await this.#fetchMissingDevices(i);
                break;
            }
        }

        await Promise.all(proms);
    }

    public async createDevice(params: IDevice): Promise<Device> {
        this.validate('createDevice', arguments);

        let device: Device;
        const devices = this.findDeviceByName(params.name);
        if (devices.length !== 0) {
            printDebug(`Using existing device with id ${devices[0].id()}`);
            device = devices[0];
        } else {
            device = new Device();
        }

        const oldJson = device.toJSON();
        device.parse(params);
        const newJson = device.toJSON();

        device.parent = this;

        if (!isEqual(oldJson, newJson)) {
            if (devices.length !== 0) {
                await device.update();
            } else {
                await device.create();
                this.device.push(device);
            }
        }

        return device;
    }

    public parseChildren(json: JSONObject): boolean {
        let res = false;
        const devices = Device.fromArray([json]);
        if (devices.length) {
            this.device.push(devices[0]);
            res = true;
        }
        return res;
    }

    public removeChild(child: IModel): void {
        this.device = this.device.filter((device: Device) => {
            return child !== device;
        });
    }

    public setParent(parent: IModel | undefined): void {
        this.parent = parent;
        this.device.forEach((dev) => {
            if (typeof dev === 'object') {
                dev.setParent(this);
            }
        });
    }

    static find = async (
        params: JSONObject,
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = '',
        filterRequest?: JSONObject
    ) => {
        Network.#validate('find', [
            params,
            quantity,
            readOnly,
            usage,
            filterRequest,
        ]);

        usage ||= `Find ${quantity} network`;
        const query: JSONObject = {
            expand: 3,
        };
        if (!filterRequest) {
            for (const key in params) {
                query[`this_${key}`] = `=${params[key]}`;
            }
        }

        const data = await PermissionModel.request({
            endpoint: Network.endpoint,
            quantity,
            message: usage,
            params: query,
            body: filterRequest,
            readOnly,
        });

        const networks = Network.fromArray(data);
        const promises: Promise<void>[] = [];

        networks.forEach((net, index) => {
            if (net.loadAllChildren) {
                promises.push(net.loadAllChildren(null));
            } else if (typeof net === 'string') {
                promises.push(
                    new Promise<void>((resolve) => {
                        const id = net as unknown as string;
                        Network.fetchById(id).then((network) => {
                            networks[index] = network;
                            resolve();
                        });
                    })
                );
            }
        });
        await Promise.all(promises);

        networks.forEach((network) => {
            if (network?.addChildrenToStore) {
                network.addChildrenToStore();
            }
        });

        return networks;
    };

    static findByName = (
        name: string,
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = ''
    ) => {
        Network.#validate('findByName', [name, quantity, readOnly, usage]);

        usage ||= `Find ${quantity} network with name ${name}`;
        return Network.find({ name: name }, quantity, readOnly, usage);
    };

    static findAllByName = (name: string, readOnly = false, usage = '') => {
        Network.#validate('findAllByName', [name, readOnly, usage]);
        return Network.findByName(name, 'all', readOnly, usage);
    };

    static findById = async (id: string, readOnly = false) => {
        Network.#validate('findById', [id, readOnly]);
        const networks = await Network.find(
            { 'meta.id': id },
            1,
            readOnly,
            `Find network with id ${id}`
        );
        return networks[0];
    };

    static findByFilter = async (
        filter: Filter,
        omit_filter: Filter = {},
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = ''
    ) => {
        Network.#validate('findByFilter', [
            filter,
            omit_filter,
            quantity,
            readOnly,
            usage,
        ]);

        usage ||= `Find ${quantity} network using filter`;
        const filterRequest = generateFilterRequest(
            Network.getFilterResult,
            filter,
            omit_filter
        );
        return await Network.find({}, quantity, readOnly, usage, filterRequest);
    };

    static findAllByFilter = async (
        filter: Filter,
        omit_filter: Filter = {},
        readOnly = false,
        usage = ''
    ) => {
        Network.#validate('findAllByFilter', [
            filter,
            omit_filter,
            readOnly,
            usage,
        ]);
        return Network.findByFilter(
            filter,
            omit_filter,
            'all',
            readOnly,
            usage
        );
    };

    public static fetchById = async (id: string) => {
        Network.#validate('fetchById', [id]);
        const data = await Model.fetch({
            endpoint: `${Network.endpoint}/${id}`,
            params: {
                expand: 3,
            },
        });
        const networks = Network.fromArray(data);
        for (let i = 0; i < networks.length; i++) {
            await networks[i].loadAllChildren(null);
        }
        return networks[0];
    };

    static fetchByName = async (name = '') => {
        Network.#validate('fetchByName', [name]);
        const params = { expand: 3 };
        if (name !== '') {
            Object.assign(params, {
                'this_name=': name,
            });
        }
        const data = await Model.fetch({ endpoint: Network.endpoint, params });
        const networks = Network.fromArray(data);
        const promises: Promise<void>[] = [];
        networks.forEach((net) => {
            promises.push(net.loadAllChildren(null));
        });
        await Promise.all(promises);
        return networks;
    };

    public static fetch = async () => {
        const params = { expand: 3 };
        const url = Network.endpoint;
        const data = await Model.fetch({ endpoint: url, params });
        const networks = Network.fromArray(data);
        const promises: Promise<void>[] = [];
        networks.forEach((network, index) => {
            if (network.loadAllChildren) {
                promises.push(network.loadAllChildren(null));
            } else if (typeof network === 'string') {
                promises.push(
                    new Promise<void>((resolve) => {
                        const id = network as unknown as string;
                        Network.fetchById(id).then((net) => {
                            networks[index] = net;
                            resolve();
                        });
                    })
                );
            }
        });
        await Promise.all(promises);

        networks.forEach((network) => {
            if (network?.addChildrenToStore) {
                network.addChildrenToStore();
            }
        });

        return networks;
    };

    async #fetchMissingDevices(offset: number): Promise<void> {
        const data = await Model.fetch({
            endpoint: `${this.url()}/${this.id()}/device`,
            params: {
                expand: 2,
                offset: offset,
            },
        });
        const devices = Device.fromArray(data);
        const promises: Promise<void>[] = [];

        devices.forEach((dev: Device, index: number) => {
            this.device[offset + index] = dev;
        });

        for (let i = 0; i < this.device.length; i++) {
            if (typeof this.device[i] === 'string') {
                promises.push(this.#fetchMissingDevices(i));
                break;
            }
        }

        devices.forEach((dev) => {
            if (typeof dev === 'object') {
                promises.push(dev.loadAllChildren(null));
            }
        });

        await Promise.all(promises);
    }

    static #validate(name: string, params: ValidateParams): void {
        Model.validateMethod('Network', name, params);
    }
}
