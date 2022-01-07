import * as _ from 'lodash';
import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { StreamModel } from './model.stream';
import { Model } from './model';
import { Value } from './value';
import { printDebug } from '../util/debug';
import {
    IDevice,
    IValue,
    IValueNumber,
    IValueString,
    IValueBlob,
    IValueXml,
} from '../util/interfaces';

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
        Model.checker.IDeviceFunc.methodArgs('constructor').check([name]);
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
        Model.checker.IDeviceFunc.methodArgs('findValueByName').check([name]);
        return this.value.filter((val) => val.name === name);
    }

    public findValueByType(type: string): Value[] {
        Model.checker.IDeviceFunc.methodArgs('findValueByType').check([type]);
        return this.value.filter((val) => val.type === type);
    }

    public async createValue(params: IValue): Promise<Value> {
        Model.checker.IDeviceFunc.methodArgs('createValue').check([params]);

        let value = new Value();
        let values = this.findValueByName(params.name);
        if (values.length !== 0) {
            printDebug(`Using existing value with id ${values[0].meta.id}`);
            value = values[0];
        }
        if (!params.number && !params.string && !params.blob && !params.xml) {
            throw new Error('You must suply a valid type');
        }

        let oldJson = value.toJSON();
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
        Model.checker.IDeviceFunc.methodArgs('createNumberValue').check([
            params,
        ]);

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
        Model.checker.IDeviceFunc.methodArgs('createStringValue').check([
            params,
        ]);

        let stringValue = {} as IValueString;
        stringValue.max = params.max;
        stringValue.encoding = params.encoding;

        params.string = stringValue;

        return this.createValue(params);
    }

    public async createBlobValue(params: IValue & IValueBlob): Promise<Value> {
        Model.checker.IDeviceFunc.methodArgs('createBlobValue').check([params]);

        let blobValue = {} as IValueBlob;
        blobValue.max = params.max;
        blobValue.encoding = params.encoding;

        params.blob = blobValue;

        return this.createValue(params);
    }

    public async createXmlValue(params: IValue & IValueXml): Promise<Value> {
        Model.checker.IDeviceFunc.methodArgs('createXmlValue').check([params]);

        let xmlValue = {} as IValueXml;
        xmlValue.xsd = params.xsd;
        xmlValue.namespace = params.namespace;

        params.xml = xmlValue;

        return this.createValue(params);
    }

    static find = async (
        params: Record<string, any>,
        quantity: number | 'all' = 1,
        usage: string = ''
    ) => {
        Model.checker.IDeviceFunc.methodArgs('find').check([
            params,
            quantity,
            usage,
        ]);

        if (usage === '') {
            usage = `Find ${quantity} device`;
        }

        let query: Record<string, any> = {
            expand: 3,
        };
        for (let key in params) {
            query[`this_${key}`] = params[key];
        }

        let data = await PermissionModel.request(
            Device.endpoint,
            quantity,
            usage,
            query
        );
        return Device.fromArray(data);
    };

    public static findByName = async (
        name: string,
        quantity: number | 'all' = 1,
        usage: string = ''
    ) => {
        Model.checker.IDeviceFunc.methodArgs('findByName').check([
            name,
            quantity,
            usage,
        ]);

        if (usage === '') {
            usage = `Find ${quantity} device with name ${name}`;
        }
        return Device.find({ name: name }, quantity, usage);
    };

    public static findAllByName = async (name: string, usage: string = '') => {
        Model.checker.IDeviceFunc.methodArgs('findAllByName').check([
            name,
            usage,
        ]);

        return Device.findByName(name, 'all', usage);
    };

    public static findByProduct = async (
        product: string,
        quantity: number | 'all' = 1,
        usage: string = ''
    ) => {
        Model.checker.IDeviceFunc.methodArgs('findByProduct').check([
            product,
            quantity,
            usage,
        ]);

        if (usage === '') {
            usage = `Find ${quantity} device with product ${product}`;
        }
        return Device.find({ product: product }, quantity, usage);
    };

    public static findAllByProduct = async (
        product: string,
        usage: string = ''
    ) => {
        Model.checker.IDeviceFunc.methodArgs('findAllByProduct').check([
            product,
            usage,
        ]);

        return Device.findByProduct(product, 'all', usage);
    };

    public static fetch = async () => {
        let params = { expand: 3 };
        let url = Device.endpoint;
        let data = await Model.fetch(url, params);
        return Device.fromArray(data);
    };
}
