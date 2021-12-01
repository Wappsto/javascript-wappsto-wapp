import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { Model } from './model';
import { Device } from './device';
import { Value } from './value';

export async function createNetwork(name: string): Promise<Network> {
    let networks = await Network.fetch(name);
    if (networks.length !== 0) {
        return networks[0];
    }

    let network = new Network();
    network.name = name;
    await network.create();

    return network;
}

export class Network extends PermissionModel {
    static endpoint = '/2.0/network';
    name?: string;
    @Type(() => Device)
    device: Device[] = [];

    get devices() {
        return this.device;
    }

    constructor(name?: string) {
        super('network');
        this.name = name;
    }

    attributes(): string[] {
        return ['name', 'device'];
    }

    public findDeviceByName(name: string): Device[] {
        return this.device.filter((dev) => dev.name === name);
    }

    public findValueByName(name: string): Value[] {
        let values: Value[] = [];
        this.device.forEach((dev) => {
            values = values.concat(dev.findValueByName(name));
        });
        return values;
    }

    public findValueByType(type: string): Value[] {
        let values: Value[] = [];
        this.device.forEach((dev) => {
            values = values.concat(dev.findValueByType(type));
        });
        return values;
    }

    public async createDevice(
        name: string,
        product: string,
        serial: string,
        description: string,
        protocol: string,
        communication: string,
        version: string,
        manufacturer: string
    ): Promise<Device> {
        let devices = await Device.fetch(name, this.getUrl());
        if (devices.length !== 0) {
            devices[0].parent = this;
            return devices[0];
        }

        let device = new Device();
        device.name = name;
        device.product = product;
        device.serial = serial;
        device.description = description;
        device.protocol = protocol;
        device.communication = communication;
        device.version = version;
        device.manufacturer = manufacturer;
        device.parent = this;
        await device.create();

        return device;
    }

    static findById = async (id: string) => {
        let data: any = await Model.fetch(`${Network.endpoint}/${id}`, {
            expand: 4,
        });
        return Network.fromArray(data)[0];
    };

    static findByName = async (
        name: string,
        quantity: number = 1,
        usage: string = ''
    ) => {
        if (usage === '') {
            usage = `Find ${quantity} network with name ${name}`;
        }

        let data = await PermissionModel.request(
            Network.endpoint,
            quantity,
            usage,
            {
                this_name: name,
                expand: 4,
            }
        );
        return Network.fromArray(data);
    };

    static fetch = async (name: string = '', params: any = {}) => {
        Object.assign(params, { expand: 4 });
        if (name !== '') {
            Object.assign(params, {
                'this_name=': name,
            });
        }
        let data: any[] = await Model.fetch(Network.endpoint, params);
        return Network.fromArray(data);
    };
}
