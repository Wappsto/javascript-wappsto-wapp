import isEqual from 'lodash.isequal';
import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { ConnectionModel } from './model.connection';
import { Model } from './model';
import { Device } from './device';
import { Value } from './value';
import { printDebug } from '../util/debug';
import { IModel, INetwork, IDevice } from '../util/interfaces';

export async function createNetwork(params: INetwork): Promise<Network> {
    Model.validateMethod('Network', 'createNetwork', arguments);

    const networks = await Network.fetch(params.name);
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

    attributes(): string[] {
        return ['name', 'description'];
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
        reloadAll = false
    ): Promise<void> {
        if (json?.device) {
            for (let i = 0; i < json.device.length; i++) {
                let id: string;
                let data: Record<string, any> | undefined = undefined;
                let newDevice: Device | undefined = undefined;

                if (typeof json.device[i] === 'string') {
                    id = json.device[i] as string;
                } else {
                    id = json.device[i].meta.id;
                    data = json.device[i];
                }

                const dev = this.device.find((dev) => dev.meta.id === id);
                if (dev) {
                    if (data) {
                        dev.parse(data);
                    }
                } else {
                    if (data) {
                        newDevice = new Device();
                    } else {
                        newDevice = await Device.fetchById(id);
                    }
                }

                if (newDevice) {
                    if (data) {
                        newDevice.parse(data);
                    }
                    newDevice.parent = this;
                    this.device.push(newDevice);
                }
            }
        }

        for (let i = 0; i < this.device.length; i++) {
            if (typeof this.device[i] === 'string') {
                await this.fetchMissingDevices(i);
                break;
            }
        }

        for (let i = 0; i < this.device.length; i++) {
            if (typeof this.device[i] === 'object') {
                this.device[i].parent = this;
                if (reloadAll) {
                    await this.device[i].reload(true);
                } else {
                    await this.device[i].loadAllChildren(null, reloadAll);
                }
            }
        }
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
        usage = ''
    ) => {
        Network.validate('find', [params, quantity, usage]);
        if (usage === '') {
            usage = `Find ${quantity} network`;
        }

        const query: Record<string, any> = {
            expand: 3,
        };
        for (const key in params) {
            query[`this_${key}`] = `=${params[key]}`;
        }

        const data = await PermissionModel.request(
            Network.endpoint,
            quantity,
            usage,
            query
        );

        const networks = Network.fromArray(data);
        const poms: any[] = [];

        networks.forEach((net, index) => {
            if (net.loadAllChildren) {
                poms.push(net.loadAllChildren(null));
            } else {
                poms.push(
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
        await Promise.all(poms);
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
        usage = ''
    ) => {
        Network.validate('findByName', [name, quantity, usage]);
        if (usage === '') {
            usage = `Find ${quantity} network with name ${name}`;
        }
        return Network.find({ name: name }, quantity, usage);
    };

    static findAllByName = (name: string, usage = '') => {
        Network.validate('findAllByName', [name, usage]);
        return Network.findByName(name, 'all', usage);
    };

    static findById = async (id: string) => {
        Network.validate('findById', [id]);
        const networks = await Network.find(
            { 'meta.id': id },
            1,
            `Find network with id ${id}`
        );
        return networks[0];
    };

    public static fetchById = async (id: string) => {
        Network.validate('fetchById', [id]);
        const data = await Model.fetch(`${Network.endpoint}/${id}`, {
            expand: 3,
        });
        const networks = Network.fromArray(data);
        for (let i = 0; i < networks.length; i++) {
            await networks[i].loadAllChildren(null);
        }
        return networks[0];
    };

    static fetch = async (name = '', params: Record<string, any> = {}) => {
        Network.validate('fetch', [name, params]);
        Object.assign(params, { expand: 3 });
        if (name !== '') {
            Object.assign(params, {
                'this_name=': name,
            });
        }
        const data = await Model.fetch(Network.endpoint, params);
        const networks = Network.fromArray(data);
        const poms: any[] = [];
        networks.forEach((net) => {
            poms.push(net.loadAllChildren(null));
        });
        await Promise.all(poms);
        return networks;
    };

    private async fetchMissingDevices(offset: number): Promise<void> {
        const data = await Model.fetch(`${this.url()}/${this.id()}/device`, {
            expand: 2,
            offset: offset,
        });
        const devices = Device.fromArray(data);

        for (let i = 0; i < devices.length; i++) {
            if (typeof devices[i] === 'string') {
                await this.fetchMissingDevices(i + offset);
                break;
            }
        }

        const poms: any[] = [];
        devices.forEach((dev) => {
            if (typeof dev === 'object') {
                poms.push(dev.loadAllChildren(null));
            }
        });
        await Promise.all(poms);

        devices.forEach((dev: any, index: number) => {
            this.device[offset + index] = dev;
        });
    }

    private static validate(name: string, params: any): void {
        Model.validateMethod('Network', name, params);
    }
}
