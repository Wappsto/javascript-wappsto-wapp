import * as _ from 'lodash';
import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { StreamModel } from './model.stream';
import { Model } from './model';
import { Device } from './device';
import { Value } from './value';
import { printDebug } from '../util/debug';
import { INetwork, IDevice } from '../util/interfaces';

export async function createNetwork(params: INetwork): Promise<Network> {
    Model.validateMethod('Network', 'createNetwork', arguments);

    let networks = await Network.fetch(params.name);
    if (networks.length !== 0) {
        printDebug(`Using existing network with id ${networks[0].meta.id}`);
        return networks[0];
    }

    let network = new Network();
    network.name = params.name;
    network.description = params.description;
    await network.create();

    return network;
}

export class Network extends StreamModel implements INetwork {
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

    public async loadAllChildren(): Promise<void> {
        for (let i = 0; i < this.device.length; i++) {
            if (typeof this.device[i] === 'string') {
                let id: string = this.device[i] as unknown as string;
                this.device[i] = new Device();
                this.device[i].meta.id = id;
                await this.device[i].refresh();
            }
            this.device[i].loadAllChildren();
        }
    }

    public async createDevice(params: IDevice): Promise<Device> {
        this.validate('createDevice', arguments);

        let device = new Device();
        let devices = this.findDeviceByName(params.name);
        if (devices.length !== 0) {
            printDebug(`Using existing device with id ${devices[0]?.meta.id}`);
            device = devices[0];
        }

        let oldJson = device.toJSON();
        device.parse(params);
        let newJson = device.toJSON();

        device.parent = this;

        if (!_.isEqual(oldJson, newJson)) {
            if (devices.length !== 0) {
                await device.update();
            } else {
                await device.create();
                this.device.push(device);
            }
        }

        return device;
    }

    static find = async (
        params: Record<string, any>,
        quantity: number | 'all' = 1,
        usage: string = ''
    ) => {
        Network.validate('find', [params, quantity, usage]);
        if (usage === '') {
            usage = `Find ${quantity} network`;
        }

        let query: Record<string, any> = {
            expand: 4,
        };
        for (let key in params) {
            query[`this_${key}`] = params[key];
        }

        let data = await PermissionModel.request(
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
        usage: string = ''
    ) => {
        Network.validate('findByName', [name, quantity, usage]);
        if (usage === '') {
            usage = `Find ${quantity} network with name ${name}`;
        }
        return Network.find({ name: name }, quantity, usage);
    };

    static findAllByName = async (name: string, usage: string = '') => {
        Network.validate('findAllByName', [name, usage]);
        return Network.findByName(name, 'all', usage);
    };

    static findById = async (id: string) => {
        Network.validate('findById', [id]);
        let res = await Model.fetch(`${Network.endpoint}/${id}`, {});
        return this.fromArray(res)[0];
    };

    static fetch = async (
        name: string = '',
        params: Record<string, any> = {}
    ) => {
        Network.validate('fetch', [name, params]);
        Object.assign(params, { expand: 4 });
        if (name !== '') {
            Object.assign(params, {
                'this_name=': name,
            });
        }
        let data = await Model.fetch(Network.endpoint, params);
        let res = Network.fromArray(data);
        for (let i = 0; i < res.length; i++) {
            await res[i].loadAllChildren();
        }
        return res;
    };

    private static validate(name: string, params: any): void {
        Model.validateMethod('Network', name, params);
    }
}
