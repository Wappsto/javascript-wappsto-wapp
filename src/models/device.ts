import * as _ from 'lodash';
import { Model } from './model';
import { Value } from './value';

export class Device extends Model {
    static endpoint = '/2.0/device';
    name?: string;
    product?: string;
    serial?: string;
    description?: string;
    protocol?: string;
    communication?: string;
    version?: string;
    manufacturer?: string;
    value: Value[] = [];

    constructor(name?: string) {
        super();
        this.name = name;
    }

    get values() {
        return this.value;
    }

    url(): string {
        return Device.endpoint;
    }

    attributes(): string[] {
        return [
            'name',
            'product',
            'serial',
            'description',
            'protocol',
            'communication',
            'version',
            'manufacturer',
            'value',
        ];
    }

    public static fetch = async () => {
        let data: any[] = await Model.fetch(Device.endpoint + '?expand=2');
        let devices: Device[] = [];

        data?.forEach((json: any) => {
            devices.push(Device.fromJSON(json));
        });
        return devices;
    };

    static fromJSON(json: any): Device {
        let device = new Device();
        let values: Value[] = [];
        json.value?.forEach((val: any) => {
            values.push(Value.fromJSON(val));
        });
        return Object.assign(device, _.omit(json, ['value']), {
            value: values,
        });
    }
}
