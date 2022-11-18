import isEqual from 'lodash.isequal';
import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { ConnectionModel } from './model.connection';
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
import { ValueTemplate } from '../util/value_template';

export class Device extends ConnectionModel implements IDevice {
    static endpoint = '/2.1/device';
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
        super('device', 2);
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

    public addChildrenToStore(): void {
        super.addChildrenToStore();
        this.value.forEach((val: IModel) => {
            if (val?.addChildrenToStore) {
                val.addChildrenToStore();
            }
        });
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
        json: Record<string, any> | null,
        reloadAll = false
    ): Promise<void> {
        const proms: any[] = [];
        let values: any | undefined;
        if (json) {
            if (json.value !== undefined) {
                values = json.value;
            } else if (json[0]) {
                values = json[0]['value'];
            }

            if (values !== undefined) {
                const oldValues = this.value;
                this.value = [];

                for (let i = 0; i < values.length; i++) {
                    let id: string;
                    let data: Record<string, any> | undefined = undefined;
                    let newValue: Value | undefined = undefined;

                    if (typeof values[i] === 'string') {
                        id = values[i] as string;
                    } else {
                        id = values[i].meta.id;
                        data = values[i];
                    }

                    const val = oldValues.find((val) => val.meta.id === id);
                    if (val) {
                        this.value.push(val);
                        if (data) {
                            val.parse(data);
                        }
                    } else {
                        if (data) {
                            newValue = new Value();
                            newValue.parse(data);
                            newValue.parent = this;
                            this.value.push(newValue);
                            proms.push(newValue.loadAllChildren(null, false));
                        } else {
                            this.value.push(values[i]);
                        }
                    }
                }
            }
        }

        for (let i = 0; i < this.value.length; i++) {
            if (typeof this.value[i] === 'object') {
                this.value[i].parent = this;
                if (values === undefined) {
                    proms.push(this.value[i].loadAllChildren(null, false));
                }
            } else if (typeof this.value[i] === 'string') {
                await this.fetchMissingValues(i);
                break;
            }
        }

        await Promise.all(proms);
    }

    private async _createValue(params: ValueType): Promise<Value> {
        let oldDelta;
        let oldPeriod = 0;
        let oldType;

        let value = new Value();
        const values = this.findValueByName(params.name);
        if (values.length !== 0) {
            printDebug(`Using existing value with id ${values[0].id()}`);
            value = values[0];
            oldDelta = params.delta;
            params.delta = value.delta;
            if (params.period) {
                oldPeriod = Number(params.period);
            }
            params.period = value.period;
            oldType = value.getValueType();
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
            value.period = oldPeriod.toString();
        }

        value.parent = this;

        if (!isEqual(oldJson, newJson)) {
            if (oldType !== undefined && params[oldType] === undefined) {
                value.removeValueType(oldType);
            }

            if (values.length !== 0) {
                await value.update();
            } else {
                await value.create();
                this.value.push(value);
            }
        }

        const poms: any[] = [];
        if (['r', 'rw', 'wr'].includes(params.permission)) {
            poms.push(value.createState({ type: 'Report' }));
        }
        if (['w', 'rw', 'wr'].includes(params.permission)) {
            poms.push(value.createState({ type: 'Control' }));
        }
        await Promise.all(poms);

        await value.created();

        return value;
    }

    public createValue(
        name: string,
        permission: ValuePermission,
        valueTemplate: ValueType,
        period: number | string = 0,
        delta: number | 'inf' = 0,
        disableLog = false
    ): Promise<Value> {
        this.validate('createValue', arguments);

        valueTemplate.name = name;
        valueTemplate.permission = permission;
        valueTemplate.period = period;
        valueTemplate.delta = delta.toString();
        valueTemplate.disableLog = disableLog;

        return this._createValue(valueTemplate);
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

    public createNumberValue(params: IValueNumber): Promise<Value> {
        this.validate('createNumberValue', arguments);
        const base = this.getValueBase(params);
        base.delta = params.delta ?? '0';
        return this._createValue({
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

    public createStringValue(params: IValueString): Promise<Value> {
        this.validate('createStringValue', arguments);
        const base = this.getValueBase(params);
        return this._createValue({
            ...base,
            string: {
                max: params.max,
                encoding: params.encoding,
            },
        });
    }

    public createBlobValue(params: IValueBlob): Promise<Value> {
        this.validate('createBlobValue', arguments);
        const base = this.getValueBase(params);
        return this._createValue({
            ...base,
            blob: {
                max: params.max,
                encoding: params.encoding,
            },
        });
    }

    public createXmlValue(params: IValueXml): Promise<Value> {
        this.validate('createXmlValue', arguments);
        const base = this.getValueBase(params);
        return this._createValue({
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

    public setParent(parent?: IModel): void {
        super.setParent(parent);
        this.value.forEach((val) => {
            if (typeof val === 'object') {
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
            expand: 2,
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
        const devices = Device.fromArray(data);
        const poms: any[] = [];
        devices.forEach((dev) => {
            poms.push(dev.loadAllChildren(null));
        });
        await Promise.all(poms);
        devices.forEach((device) => {
            if (device?.addChildrenToStore) {
                device.addChildrenToStore();
            }
        });
        return devices;
    };

    public static findByName(
        name: string,
        quantity: number | 'all' = 1,
        usage = ''
    ) {
        Device.validate('findByName', [name, quantity, usage]);

        if (usage === '') {
            usage = `Find ${quantity} device with name ${name}`;
        }
        return Device.find({ name: name }, quantity, usage);
    }

    public static findAllByName(name: string, usage = '') {
        Device.validate('findAllByName', [name, usage]);

        return Device.findByName(name, 'all', usage);
    }

    public static findByProduct(
        product: string,
        quantity: number | 'all' = 1,
        usage = ''
    ) {
        Device.validate('findByProduct', [product, quantity, usage]);

        if (usage === '') {
            usage = `Find ${quantity} device with product ${product}`;
        }
        return Device.find({ product: product }, quantity, usage);
    }

    public static findAllByProduct(product: string, usage = '') {
        Device.validate('findAllByProduct', [product, usage]);

        return Device.findByProduct(product, 'all', usage);
    }

    public static findById = async (id: string) => {
        Device.validate('findById', [id]);
        const devices = await Device.find(
            { 'meta.id': id },
            1,
            `Find device with id ${id}`
        );
        return devices[0];
    };

    public static fetchById = async (id: string) => {
        Device.validate('fetchById', [id]);
        const data = await Model.fetch(`${Device.endpoint}/${id}`, {
            expand: 2,
        });
        const res = Device.fromArray(data);
        for (let i = 0; i < res.length; i++) {
            await res[i].loadAllChildren(null);
        }
        return res[0];
    };

    public static fetch = async () => {
        const params = { expand: 2 };
        const url = Device.endpoint;
        const data = await Model.fetch(url, params);
        const devices = Device.fromArray(data);
        const poms: any[] = [];
        devices.forEach((dev) => {
            poms.push(dev.loadAllChildren(null));
        });
        await Promise.all(poms);
        return devices;
    };

    public async setConnectionStatus(
        state: boolean | number
    ): Promise<boolean> {
        Device.validate('setConnectionStatus', [state]);
        let res = false;
        const value = this.findValueByType(
            ValueTemplate.CONNECTION_STATUS.type
        );
        if (value.length > 0) {
            res = await value[0].report(state ? '1' : '0');
        }
        return res;
    }

    private async fetchMissingValues(offset: number): Promise<void> {
        const data = await Model.fetch(`${this.url()}/${this.id()}/value`, {
            expand: 1,
            offset: offset,
        });
        const values = Value.fromArray(data);
        const poms: any[] = [];

        values.forEach((val: any, index: number) => {
            this.value[offset + index] = val;
        });

        for (let i = 0; i < this.value.length; i++) {
            if (typeof this.value[i] === 'string') {
                poms.push(this.fetchMissingValues(i));
                break;
            }
        }

        values.forEach((val) => {
            if (typeof val === 'object') {
                poms.push(val.loadAllChildren(null));
            }
        });
        await Promise.all(poms);
    }

    private static validate(name: string, params: any): void {
        Model.validateMethod('Device', name, params);
    }
}
