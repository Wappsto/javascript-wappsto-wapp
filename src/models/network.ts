import isEqual from 'lodash.isequal';
import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { ConnectionModel } from './model.connection';
import { Model } from './model';
import { Device } from './device';
import { Value } from './value';
import { printDebug } from '../util/debug';
import {
    generateFilterRequest,
    convertFilterToJson,
    convertFilterToString,
} from '../util/helpers';
import { addModel } from '../util/modelStore';
import { IModel, INetwork, IDevice, Filter } from '../util/interfaces';

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
        const fields = [Model.getFilterResult()]
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
        json: Record<string, any> | null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _reloadAll = false
    ): Promise<void> {
        const proms: any[] = [];
        let devices: any | undefined;
        if (json) {
            if (json.device !== undefined) {
                devices = json.device;
            } else if (json[0]) {
                devices = json[0]['device'];
            }

            if (devices !== undefined) {
                const oldDevices = this.device;
                this.device = [];
                for (let i = 0; i < devices.length; i++) {
                    let id: string;
                    let data: Record<string, any> | undefined = undefined;
                    let newDevice: Device | undefined = undefined;

                    if (typeof devices[i] === 'string') {
                        id = devices[i] as string;
                    } else {
                        id = devices[i].meta.id;
                        data = devices[i];
                    }

                    const dev = oldDevices.find((dev) => dev.meta.id === id);
                    if (dev) {
                        this.device.push(dev);
                        if (data) {
                            dev.parse(data);
                        }
                    } else {
                        if (data) {
                            newDevice = new Device();
                            newDevice.parse(data);
                            newDevice.parent = this;
                            addModel(newDevice);
                            this.device.push(newDevice);
                            proms.push(newDevice.loadAllChildren(data, false));
                        } else {
                            this.device.push(devices[i]);
                        }
                    }
                }
            }
        }

        for (let i = 0; i < this.device.length; i++) {
            if (typeof this.device[i] === 'object') {
                addModel(this.device[i]);
                this.device[i].parent = this;
                if (devices === undefined) {
                    proms.push(this.device[i].loadAllChildren(null, false));
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

        let device = new Device();
        const devices = this.findDeviceByName(params.name);
        if (devices.length !== 0) {
            printDebug(`Using existing device with id ${devices[0].id()}`);
            device = devices[0];
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

    public parseChildren(json: Record<string, any>): boolean {
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
        params: Record<string, any>,
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = '',
        filterRequest?: Record<string, any>
    ) => {
        Network.#validate('find', [
            params,
            quantity,
            readOnly,
            usage,
            filterRequest,
        ]);
        if (usage === '') {
            usage = `Find ${quantity} network`;
        }

        const query: Record<string, any> = {
            expand: 3,
        };
        if (!filterRequest) {
            for (const key in params) {
                query[`this_${key}`] = `=${params[key]}`;
            }
        }

        const data = await PermissionModel.request(
            Network.endpoint,
            quantity,
            usage,
            query,
            filterRequest,
            readOnly
        );

        const networks = Network.fromArray(data);
        const promises: any[] = [];

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
        if (usage === '') {
            usage = `Find ${quantity} network with name ${name}`;
        }
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
        if (usage === '') {
            usage = `Find ${quantity} network using filter`;
        }
        const filterRequest = generateFilterRequest(
            Network.getFilter(filter, omit_filter),
            Network.getFilterResult(filter, omit_filter)
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

        const promises: any[] = [];
        networks.forEach((net) => {
            promises.push(net.loadAllChildren(null));
        });
        await Promise.all(promises);
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
        const promises: any[] = [];

        devices.forEach((dev: any, index: number) => {
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

    static #validate(name: string, params: any): void {
        Model.validateMethod('Network', name, params);
    }
}
