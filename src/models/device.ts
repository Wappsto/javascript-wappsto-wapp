import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { Model } from './model';
import { Value } from './value';

export class Device extends PermissionModel {
    static endpoint = '/2.0/device';
    name?: string;
    product?: string;
    serial?: string;
    description?: string;
    protocol?: string;
    communication?: string;
    version?: string;
    manufacturer?: string;
    @Type(() => Value)
    value: Value[] = [];

    constructor(name?: string) {
        super('device');
        this.name = name;
    }

    get values() {
        return this.value;
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

    public findValueByName(name: string): Value[] {
        return this.value.filter((val) => val.name === name);
    }

    public findValueByType(type: string): Value[] {
        return this.value.filter((val) => val.type === type);
    }

    public static findByName = async (
        name: string,
        quantity: number = 1,
        usage: string = ''
    ) => {
        if (usage === '') {
            usage = `Find ${quantity} device with name ${name}`;
        }

        let data = await PermissionModel.request(
            `${Device.endpoint}`,
            quantity,
            usage,
            {
                this_name: name,
                expand: 3,
            }
        );
        return Device.fromArray(data);
    };

    public static findByProduct = async (product: string) => {
        let data: any = await Model.fetch(
            `${Device.endpoint}?this_product=${product}`,
            {
                expand: 3,
            }
        );
        return Device.fromArray(data);
    };

    public static fetch = async () => {
        let data: any[] = await Model.fetch(Device.endpoint, { expand: 3 });
        return Device.fromArray(data);
    };
}
