import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { Model } from './model';
import { Value, IValueNumber, IValueString, IValueBlob, IValueXml } from './value';
import { printError } from '../util/debug';

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

    public async createValue(
        name: string,
        permission: string,
        type: string,
        period: string,
        delta: string,
        status: string,
        number: IValueNumber | undefined = undefined,
        string: IValueString | undefined = undefined,
        blob: IValueBlob | undefined = undefined,
        xml: IValueXml | undefined = undefined
    ): Promise<Value> {
        let values = await Value.fetch(name, this.getUrl());
        if (values.length !== 0) {
            return values[0];
        }

        let value = new Value();
        value.name = name;
        value.permission = permission;
        value.type = type;
        value.period = period;
        value.delta = delta;
        value.status = status;
        if (number) {
            value.number = number;
        } else if (string) {
            value.string = string;
        } else if (blob) {
            value.blob = blob;
        } else if (xml) {
            value.xml = xml;
        } else {
            printError('You must suply a valid type');
        }
        value.parent = this;
        await value.create();

        return value;
    }

    public async createNumberValue(
        name: string,
        permission: string,
        type: string,
        period: string,
        delta: string,
        status: string,
        min: number,
        max: number,
        step: number,
        unit: string,
        si_unit: string = ''
    ): Promise<Value> {
        let valueNumber = {} as IValueNumber;
        valueNumber.min = min;
        valueNumber.max = max;
        valueNumber.step = step;
        valueNumber.unit = unit;
        valueNumber.si_unit = si_unit;


        return this.createValue(
            name,
            permission,
            type,
            period,
            delta,
            status,
            valueNumber
        );
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
            Device.endpoint,
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
        let data: any = await Model.fetch(Device.endpoint, {
            this_product: product,
            expand: 3,
        });
        return Device.fromArray(data);
    };

    public static fetch = async (name: string = '', parentUrl: string = '') => {
        let params = { expand: 3 };
        let url = Device.endpoint;
        if (name !== '') {
            Object.assign(params, {
                this_name: name,
            });
        }
        if (parentUrl !== '') {
            url = parentUrl + '/device';
        }
        let data: any[] = await Model.fetch(url, params);
        return Device.fromArray(data);
    };
}
