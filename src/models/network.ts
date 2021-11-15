import * as _ from 'lodash';
import { Model } from './model';
import { Device } from './device';

export class Network extends Model {
    static endpoint = '/2.0/network';
    name?: string;
    device: Device[] = [];

    get devices() {
        return this.device;
    }

    constructor(name?: string) {
        super();
        this.name = name;
    }

    url(): string {
        return Network.endpoint;
    }

    attributes(): string[] {
        return ['name', 'device'];
    }

    static getUrl(): string {
        return Network.endpoint;
    }

    static fetch = async () => {
        let data: any[] = await Model.fetch(Network.endpoint, { expand: 3 });
        return Network.fromArray(data);
    };

    static fromJSON(json: any): Network {
        let network = new Network();
        let devices: Device[] = [];
        json.device?.forEach((dev: any) => {
            devices.push(Device.fromJSON(dev));
        });
        return Object.assign(network, _.omit(json, ['device']), {
            device: devices,
        });
    }
}
