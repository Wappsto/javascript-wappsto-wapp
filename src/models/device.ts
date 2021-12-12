import * as _ from 'lodash';
import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { StreamModel } from './model.stream';
import { Model } from './model';
import {
    Value,
    IValue,
    IValueNumber,
    IValueString,
    IValueBlob,
    IValueXml,
} from './value';
import { printDebug } from '../util/debug';

export interface IDevice {
    name: string;
    product?: string;
    serial?: string;
    description?: string;
    protocol?: string;
    communication?: string;
    version?: string;
    manufacturer?: string;
}

export class Device extends StreamModel implements IDevice {
    static endpoint = '/2.0/device';
    name: string;
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
        this.name = name || '';
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
        ];
    }

    public findValueByName(name: string): Value[] {
        return this.value.filter((val) => val.name === name);
    }

    public findValueByType(type: string): Value[] {
        return this.value.filter((val) => val.type === type);
    }

    public async createValue(params: IValue): Promise<Value> {
        if (
            !params.permission ||
            !['r', 'w', 'rw', 'wr'].includes(params.permission.toLowerCase())
        ) {
            throw new Error('Invalid value for value permission');
        }
        params.permission = params.permission.toLowerCase();

        let value = new Value();
        let values = this.findValueByName(params.name);
        if (values.length !== 0) {
            printDebug(`Using existing value with id ${values[0].meta.id}`);
            value = values[0];
        }

        let oldJson = value.toJSON();
        if (!params.number && !params.string && !params.blob && !params.xml) {
            throw new Error('You must suply a valid type');
        }
        value.parse(params);
        value.parent = this;

        let newJson = value.toJSON();
        if (!_.isEqual(oldJson, newJson)) {
            if (values.length !== 0) {
                await value.update();
            } else {
                await value.create();
                this.value.push(value);
            }
        }

        if (['r', 'rw', 'wr'].includes(params.permission)) {
            await value.createState({ type: 'Report' });
        }
        if (['w', 'rw', 'wr'].includes(params.permission)) {
            await value.createState({ type: 'Control' });
        }

        return value;
    }

    public async createNumberValue(
        params: IValue & IValueNumber
    ): Promise<Value> {
        let numberValue = {} as IValueNumber;
        numberValue.min = params.min;
        numberValue.max = params.max;
        numberValue.step = params.step;
        numberValue.unit = params.unit;
        numberValue.si_conversion = params.si_conversion;
        numberValue.mapping = params.mapping;
        numberValue.ordered_mapping = params.ordered_mapping;
        numberValue.meaningful_zero = params.meaningful_zero;

        params.number = numberValue;

        return this.createValue(params);
    }

    public async createStringValue(
        params: IValue & IValueString
    ): Promise<Value> {
        let stringValue = {} as IValueString;
        stringValue.max = params.max;
        stringValue.encoding = params.encoding;

        params.string = stringValue;

        return this.createValue(params);
    }

    public async createBlobValue(params: IValue & IValueBlob): Promise<Value> {
        let blobValue = {} as IValueBlob;
        blobValue.max = params.max;
        blobValue.encoding = params.encoding;

        params.blob = blobValue;

        return this.createValue(params);
    }

    public async createXmlValue(params: IValue & IValueXml): Promise<Value> {
        let xmlValue = {} as IValueXml;
        xmlValue.xsd = params.xsd;
        xmlValue.namespace = params.namespace;

        params.xml = xmlValue;

        return this.createValue(params);
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

    public static findByProduct = async (
        product: string,
        quantity: number = 1,
        usage: string = ''
    ) => {
        if (usage === '') {
            usage = `Find ${quantity} device with product ${product}`;
        }
        let data = await PermissionModel.request(
            Device.endpoint,
            quantity,
            usage,
            {
                this_product: product,
                expand: 3,
            }
        );
        return Device.fromArray(data);
    };

    public static fetch = async (name: string = '', parentUrl: string = '') => {
        let params = { expand: 3 };
        let url = Device.endpoint;
        if (name !== '') {
            Object.assign(params, {
                'this_name=': name,
            });
        }
        if (parentUrl !== '') {
            url = parentUrl + '/device';
        }
        let data: any[] = await Model.fetch(url, params);
        return Device.fromArray(data);
    };
}
