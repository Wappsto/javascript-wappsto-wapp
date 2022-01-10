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
    Model.checker.INetworkFunc.methodArgs('createNetwork').check([params]);

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
        Model.checker.INetworkFunc.methodArgs('constructor').check([name]);
        this.name = name || '';
    }

    attributes(): string[] {
        return ['name', 'description'];
    }

    public findDeviceByName(name: string): Device[] {
        Model.checker.INetworkFunc.methodArgs('findDeviceByName').check([name]);
        return this.device.filter((dev) => dev.name === name);
    }

    public findValueByName(name: string): Value[] {
        Model.checker.INetworkFunc.methodArgs('findValueByName').check([name]);
        let values: Value[] = [];
        this.device.forEach((dev) => {
            values = values.concat(dev.findValueByName(name));
        });
        return values;
    }

    public findValueByType(type: string): Value[] {
        Model.checker.INetworkFunc.methodArgs('findValueByType').check([type]);
        let values: Value[] = [];
        this.device.forEach((dev) => {
            values = values.concat(dev.findValueByType(type));
        });
        return values;
    }

    public async createDevice(params: IDevice): Promise<Device> {
        Model.checker.INetworkFunc.methodArgs('createDevice').check([params]);

        let device = new Device();
        let devices = this.findDeviceByName(params.name);
        if (devices.length !== 0) {
            printDebug(`Using existing device with id ${devices[0]?.meta.id}`);
            device = devices[0];
        }

        let oldJson = device.toJSON();
        device.parse(params);
        device.parent = this;
        let newJson = device.toJSON();

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
        Model.checker.INetworkFunc.methodArgs('find').check([
            params,
            quantity,
            usage,
        ]);
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
        Model.checker.INetworkFunc.methodArgs('findByName').check([
            name,
            quantity,
            usage,
        ]);
        if (usage === '') {
            usage = `Find ${quantity} network with name ${name}`;
        }
        return Network.find({ name: name }, quantity, usage);
    };

    static findAllByName = async (name: string, usage: string = '') => {
        Model.checker.INetworkFunc.methodArgs('findAllByName').check([
            name,
            usage,
        ]);
        return Network.findByName(name, 'all', usage);
    };

    static fetch = async (
        name: string = '',
        params: Record<string, any> = {}
    ) => {
        Model.checker.INetworkFunc.methodArgs('fetch').check([name, params]);
        Object.assign(params, { expand: 4 });
        if (name !== '') {
            Object.assign(params, {
                'this_name=': name,
            });
        }
        let data = await Model.fetch(Network.endpoint, params);
        return Network.fromArray(data);
    };
}
