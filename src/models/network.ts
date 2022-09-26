import { isEqual } from 'lodash';
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
        return networks[0];
    }

    const network = new Network();
    network.name = params.name;
    network.description = params.description;
    await network.create();

    return network;
}

export class Network extends ConnectionModel implements INetwork {
    static endpoint = '/2.0/network';
    name: string;
    description?: string;
    @Type(() => Device)
    device: Device[] = [];

    get devices() {
        return this.device;
    }

    constructor(name?: string) {
        super('network');
        Model.validateMethod('Network', 'constructor', arguments);
        this.name = name || '';
    }

    attributes(): string[] {
        return ['name', 'description'];
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
                        newDevice = await Device.findById(id);
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
                const id: string = this.device[i] as unknown as string;
                this.device[i] = await Device.findById(id);
            } else if (i >= 3) {
                this.device[i] = await Device.findById(
                    /* istanbul ignore next */
                    this.device[i].meta.id || ''
                );
            }
            if (this.device[i]) {
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
            /* istanbul ignore next */
            printDebug(`Using existing device with id ${devices[0]?.id()}`);
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

    public setParent(parent: IModel): void {
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
            expand: 4,
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

        return Network.fromArray(data);
    };

    static findByName = async (
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

    static findAllByName = async (name: string, usage = '') => {
        Network.validate('findAllByName', [name, usage]);
        return Network.findByName(name, 'all', usage);
    };

    static findById = async (id: string) => {
        Network.validate('findById', [id]);
        const res = await Model.fetch(`${Network.endpoint}/${id}`, {
            expand: 4,
        });
        return Network.fromArray(res)[0];
    };

    static fetch = async (name = '', params: Record<string, any> = {}) => {
        Network.validate('fetch', [name, params]);
        Object.assign(params, { expand: 4 });
        if (name !== '') {
            Object.assign(params, {
                'this_name=': name,
            });
        }
        const data = await Model.fetch(Network.endpoint, params);
        const res = Network.fromArray(data);
        for (let i = 0; i < res.length; i++) {
            await res[i].loadAllChildren(null);
        }
        return res;
    };

    private static validate(name: string, params: any): void {
        Model.validateMethod('Network', name, params);
    }
}
