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
    IValueBase,
    IValueNumber,
    IValueString,
    IValueBlob,
    IValueXml,
    ValueType,
    ValuePermission,
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

    public async loadAllChildren(
        json: Record<string, any> | null
    ): Promise<void> {
        if (json?.value) {
            for (let i = 0; i < json.value.length; i++) {
                let id: string;
                let data: Record<string, any> | undefined = undefined;
                let newValue: Value | undefined = undefined;

                if (typeof json.value[i] === 'string') {
                    id = json.value[i] as string;
                } else {
                    id = json.value[i].meta.id;
                    data = json.value[i];
                }

                const val = this.value.find((val) => val.meta.id === id);
                if (val) {
                    if (data) {
                        val.parse(data);
                    }
                } else {
                    if (data) {
                        newValue = new Value();
                    } else {
                        newValue = await Value.findById(id);
                    }
                }

                if (newValue) {
                    if (data) {
                        newValue.parse(data);
                    }
                    newValue.parent = this;
                    this.value.push(newValue);
                }
            }
        }
        for (let i = 0; i < this.value.length; i++) {
            if (typeof this.value[i] === 'string') {
                // This is needed to convert a value type into string
                const id: string = this.value[i] as unknown as string;
                this.value[i] = await Value.findById(id);
                this.value[i].parent = this;
            }
            this.value[i].created();
            await this.value[i].loadAllChildren(null);
        }
    }

    private async _createValue(params: ValueType): Promise<Value> {
        let oldDelta;
        let oldPeriod = '0';
        let value = new Value();
        const values = this.findValueByName(params.name);
        if (values.length !== 0) {
            printDebug(`Using existing value with id ${values[0].id()}`);
            value = values[0];
            oldDelta = params.delta;
            params.delta = value.delta;
            if (params.period) {
                oldPeriod = params.period;
            }
            params.period = value.period;
        }

        const disableLog = params.disableLog;
        delete params.disableLog;
        if (disableLog === true) {
            value.meta.historical = false;
        }

        const oldJson = value.toJSON();
        value.parse(params);
        const newJson = value.toJSON();

        if (value.delta === undefined) {
            value.delta = oldDelta;
        }
        if (value.period === undefined) {
            value.period = oldPeriod;
        }

        value.parent = this;

        if (!isEqual(oldJson, newJson)) {
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

        value.created();
        return value;
    }

    public async createValue(
        name: string,
        permission: ValuePermission,
        valueTemplate: ValueType,
        period = '0',
        delta: number | 'inf' = 0,
        disableLog = false
    ): Promise<Value> {
        this.validate('createValue', arguments);

        valueTemplate.name = name;
        valueTemplate.permission = permission;
        valueTemplate.period = period;
        valueTemplate.delta = delta.toString();
        valueTemplate.disableLog = disableLog;

        return await this._createValue(valueTemplate);
    }

    private getValueBase(
        params: IValueNumber | IValueString | IValueBlob | IValueXml
    ): IValueBase {
        return {
            name: params.name,
            permission: params.permission,
            type: params.type,
            description: params.description,
            period: params.period,
            delta: params.delta,
            disableLog: params.disableLog,
        };
    }

    public async createNumberValue(params: IValueNumber): Promise<Value> {
        this.validate('createNumberValue', arguments);
        const base = this.getValueBase(params);
        base.delta = params.delta ?? '0';
        return await this._createValue({
            ...base,
            number: {
                min: params.min,
                max: params.max,
                step: params.step,
                unit: params.unit,
                si_conversion: params.si_conversion,
                mapping: params.mapping,
                ordered_mapping: params.ordered_mapping,
                meaningful_zero: params.meaningful_zero,
            },
        });
    }

    public async createStringValue(params: IValueString): Promise<Value> {
        this.validate('createStringValue', arguments);
        const base = this.getValueBase(params);
        return await this._createValue({
            ...base,
            string: {
                max: params.max,
                encoding: params.encoding,
            },
        });
    }

    public async createBlobValue(params: IValueBlob): Promise<Value> {
        this.validate('createBlobValue', arguments);
        const base = this.getValueBase(params);
        return await this._createValue({
            ...base,
            blob: {
                max: params.max,
                encoding: params.encoding,
            },
        });
    }

    public async createXmlValue(params: IValueXml): Promise<Value> {
        this.validate('createXmlValue', arguments);
        const base = this.getValueBase(params);
        return await this._createValue({
            ...base,
            xml: {
                xsd: params.xsd,
                namespace: params.namespace,
            },
        });
    }

    public parseChildren(json: Record<string, any>): boolean {
        let res = false;
        const values = Value.fromArray([json]);
        if (values.length) {
            this.value.push(values[0]);
            res = true;
        }
        return res;
    }

    public removeChild(child: IModel): void {
        this.value = this.value.filter((value: Value) => {
            return child !== value;
        });
    }

    public setParent(parent: IModel): void {
        super.setParent(parent);
        this.value.forEach((val) => {
            if (typeof val !== 'string') {
                val.setParent(this);
            }
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
            query[`this_${key}`] = `=${params[key]}`;
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
            await res[i].loadAllChildren(null);
        }
        return res;
    };

    private static validate(name: string, params: any): void {
        Model.validateMethod('Device', name, params);
    }
}
