import { isEqual } from 'lodash';
import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { StreamModel } from './model.stream';
import { Model } from './model';
import { Value } from './value';
import { printDebug } from '../util/debug';
import {
    IModel,
    IDevice,
    IValue,
    IValueNumber,
    IValueString,
    IValueBlob,
    IValueXml,
    IValueTemplate,
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
        Model.validateMethod('Device', 'constructor', arguments);
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
        this.validate('findValueByName', arguments);
        return this.value.filter((val) => val.name === name);
    }

    public findValueByType(type: string): Value[] {
        this.validate('findValueByType', arguments);
        return this.value.filter((val) => val.type === type);
    }

    public async loadAllChildren(): Promise<void> {
        for (let i = 0; i < this.value.length; i++) {
            if (typeof this.value[i] === 'string') {
                const id: string = this.value[i] as unknown as string;
                this.value[i] = new Value();
                this.value[i].meta.id = id;
                await this.value[i].refresh();
            }
            this.value[i].loadAllChildren();
        }
    }

    private async _createValue(params: IValue): Promise<Value> {
        let value = new Value();
        const values = this.findValueByName(params.name);
        if (values.length !== 0) {
            printDebug(`Using existing value with id ${values[0].id()}`);
            value = values[0];
        }

        const oldJson = value.toJSON();
        value.parse(params);
        const newJson = value.toJSON();

        value.parent = this;
        if (!isEqual(oldJson, newJson)) {
            await value.create();
            if (values.length === 0) {
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

    public async createValue(
        name: string,
        permission: 'r' | 'w' | 'rw' | 'wr',
        valueTemplate: IValueTemplate
    ): Promise<Value> {
        this.validate('createValue', arguments);

        const value = {} as IValue;
        value.name = name;
        value.permission = permission;
        value.type = valueTemplate.type;
        switch (valueTemplate.value_type) {
            case 'number':
                value.number = valueTemplate.number;
                break;
            case 'string':
                value.string = valueTemplate.string;
                break;
            case 'blob':
                value.blob = valueTemplate.blob;
                break;
            case 'xml':
                value.xml = valueTemplate.xml;
                break;
        }

        return await this._createValue(value);
    }

    public async createNumberValue(
        params: IValue & IValueNumber
    ): Promise<Value> {
        this.validate('createNumberValue', arguments);

        const numberValue = {} as IValueNumber;
        numberValue.min = params.min;
        numberValue.max = params.max;
        numberValue.step = params.step;
        numberValue.unit = params.unit;
        numberValue.si_conversion = params.si_conversion;
        numberValue.mapping = params.mapping;
        numberValue.ordered_mapping = params.ordered_mapping;
        numberValue.meaningful_zero = params.meaningful_zero;

        params.number = numberValue;

        return await this._createValue(params);
    }

    public async createStringValue(
        params: IValue & IValueString
    ): Promise<Value> {
        this.validate('createStringValue', arguments);

        const stringValue = {} as IValueString;
        stringValue.max = params.max;
        stringValue.encoding = params.encoding;

        params.string = stringValue;

        return await this._createValue(params);
    }

    public async createBlobValue(params: IValue & IValueBlob): Promise<Value> {
        this.validate('createBlobValue', arguments);

        const blobValue = {} as IValueBlob;
        blobValue.max = params.max;
        blobValue.encoding = params.encoding;

        params.blob = blobValue;

        return await this._createValue(params);
    }

    public async createXmlValue(params: IValue & IValueXml): Promise<Value> {
        this.validate('createXmlValue', arguments);

        const xmlValue = {} as IValueXml;
        xmlValue.xsd = params.xsd;
        xmlValue.namespace = params.namespace;

        params.xml = xmlValue;

        return await this._createValue(params);
    }

    public removeChild(child: IModel): void {
        this.value = this.value.filter((value: Value) => {
            return child !== value;
        });
    }

    public static find = async (
        params: Record<string, any>,
        quantity: number | 'all' = 1,
        usage = ''
    ) => {
        Device.validate('find', [params, quantity, usage]);

        if (usage === '') {
            usage = `Find ${quantity} device`;
        }

        const query: Record<string, any> = {
            expand: 3,
        };
        for (const key in params) {
            query[`this_${key}`] = params[key];
        }

        const data = await PermissionModel.request(
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
        usage = ''
    ) => {
        Device.validate('findByName', [name, quantity, usage]);

        if (usage === '') {
            usage = `Find ${quantity} device with name ${name}`;
        }
        return Device.find({ name: name }, quantity, usage);
    };

    public static findAllByName = async (name: string, usage = '') => {
        Device.validate('findAllByName', [name, usage]);

        return Device.findByName(name, 'all', usage);
    };

    public static findByProduct = async (
        product: string,
        quantity: number | 'all' = 1,
        usage = ''
    ) => {
        Device.validate('findByProduct', [product, quantity, usage]);

        if (usage === '') {
            usage = `Find ${quantity} device with product ${product}`;
        }
        return Device.find({ product: product }, quantity, usage);
    };

    public static findAllByProduct = async (product: string, usage = '') => {
        Device.validate('findAllByProduct', [product, usage]);

        return Device.findByProduct(product, 'all', usage);
    };

    public static findById = async (id: string) => {
        Device.validate('findById', [id]);
        const res = await Model.fetch(`${Device.endpoint}/${id}`, {
            expand: 3,
        });
        return Device.fromArray(res)[0];
    };

    public static fetch = async () => {
        const params = { expand: 3 };
        const url = Device.endpoint;
        const data = await Model.fetch(url, params);
        const res = Device.fromArray(data);
        for (let i = 0; i < res.length; i++) {
            await res[i].loadAllChildren();
        }
        return res;
    };

    private static validate(name: string, params: any): void {
        Model.validateMethod('Device', name, params);
    }
}
