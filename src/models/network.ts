import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { Model } from './model';
import { Device } from './device';
import { Value } from './value';

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
            values.concat(dev.findValueByName(name));
        });
        return values;
    }

    public findValueByType(type: string): Value[] {
        let values: Value[] = [];
        this.device.forEach((dev) => {
            values.concat(dev.findValueByType(type));
        });
        return values;
    }

    static getUrl(): string {
        return Network.endpoint;
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

    static fetch = async () => {
        let data: any[] = await Model.fetch(Network.endpoint, { expand: 4 });
        return Network.fromArray(data);
    };
}
