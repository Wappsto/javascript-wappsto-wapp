import { Type } from 'class-transformer';
import isEqual from 'lodash.isequal';
import { printDebug, printWarning } from '../util/debug';
import { generateFilterRequest } from '../util/filter';
import { convertFilterToJson, convertFilterToString } from '../util/helpers';
import {
    Filter,
    ICreateValue,
    IDevice,
    IModel,
    IValueBase,
    IValueBlob,
    IValueNumber,
    IValueString,
    IValueXml,
    JSONObject,
    ValidateParams,
    ValuePermission,
    ValueType,
} from '../util/interfaces';
import { addModel, getModel } from '../util/modelStore';
import { ValueTemplate } from '../util/value_template';
import { Model } from './model';
import { ConnectionModel } from './model.connection';
import { PermissionModel } from './model.permission';
import { State } from './state';
import { Value } from './value';

export class Device extends ConnectionModel implements IDevice {
    static endpoint = '/2.1/device';
    static attributes = [
        'name',
        'product',
        'serial',
        'description',
        'protocol',
        'communication',
        'version',
        'manufacturer',
    ];
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

    getAttributes(): string[] {
        return Device.attributes;
    }

    static getFilter(filter?: Filter, omit_filter?: Filter): string[] {
        Device.#validate('getFilter', [filter, omit_filter]);
        return convertFilterToJson(
            'device',
            Device.attributes,
            filter?.device,
            omit_filter?.device
        ).concat(Value.getFilter(filter, omit_filter));
    }

    static getFilterResult(filter?: Filter, omit_filter?: Filter): string {
        Device.#validate('getFilterResult', [filter, omit_filter]);
        const fields = [Model.getMetaFilterResult()].concat(Device.attributes);

        const strFilter = convertFilterToString(
            Device.attributes,
            filter?.device,
            omit_filter?.device
        );

        return `device ${strFilter} { ${fields.join(
            ' '
        )} ${Value.getFilterResult(filter, omit_filter)}}`;
    }

    addChildrenToStore(): void {
        super.addChildrenToStore();
        this.value.forEach((val: IModel) => {
            if (val?.addChildrenToStore) {
                val.addChildrenToStore();
            }
        });
    }

    findValueByName(name: string): Value[] {
        this.validate('findValueByName', arguments);
        return this.value.filter((val) => val.name === name);
    }

    findValueByType(type: string): Value[] {
        this.validate('findValueByType', arguments);
        return this.value.filter((val) => val.type === type);
    }

    async loadAllChildren(
        json: JSONObject | null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _reloadAll = false
    ): Promise<void> {
        const proms: Promise<void>[] = [];
        let values: (Value | string)[] | undefined;
        if (json) {
            if (json.value !== undefined) {
                values = json.value as (Value | string)[];
            } else if (json[0]) {
                if (typeof json[0] === 'object' && 'value' in json[0]) {
                    values = json[0].value as (Value | string)[];
                } else {
                    printWarning(
                        `Device: loadAllChildren: value not found in json: ${json}`
                    );
                }
            }

            if (values !== undefined) {
                const oldValues = this.value;
                this.value = [];

                for (let i = 0; i < values.length; i++) {
                    let id: string;
                    let data: JSONObject | undefined = undefined;

                    if (typeof values[i] === 'string') {
                        id = values[i] as string;
                    } else {
                        data = values[i] as Value;
                        id = (data as Value).meta.id ?? '';
                    }

                    const val = oldValues.find((val) => val.meta.id === id);
                    if (val) {
                        this.value.push(val);
                        if (data) {
                            val.parse(data);
                        }
                    } else {
                        if (data) {
                            const newValue = ((await getModel('value', id)) ??
                                new Value()) as Value;
                            newValue.parse(data);
                            newValue.parent = this;
                            this.value.push(newValue);
                            proms.push(
                                new Promise(async (resolve) => {
                                    await newValue.loadAllChildren(
                                        data,
                                        _reloadAll
                                    );
                                    addModel(newValue);
                                    resolve();
                                })
                            );
                        } else {
                            this.value.push(values[i] as Value);
                        }
                    }
                }
            }
        }

        for (let i = 0; i < this.value.length; i++) {
            if (typeof this.value[i] === 'object') {
                this.value[i].parent = this;

                if (values === undefined) {
                    proms.push(
                        new Promise(async (resolve) => {
                            await this.value[i].loadAllChildren(null, false);
                            this.value[i] = addModel(this.value[i]) as Value;
                            resolve();
                        })
                    );
                } else {
                    this.value[i] = addModel(this.value[i]) as Value;
                }
            } else if (typeof this.value[i] === 'string') {
                await this.#fetchMissingValues(i);
                break;
            }
        }

        await Promise.all(proms);
    }

    async #createValue(params: ValueType): Promise<Value> {
        let oldType;

        let value: Value;
        const values = this.findValueByName(params.name);
        if (values.length !== 0) {
            printDebug(`Using existing value with id ${values[0].id()}`);
            value = values[0];

            oldType = value.getValueType();
        } else {
            value = new Value();
        }

        const disableLog = params.disableLog;
        delete params.disableLog;
        if (disableLog === true) {
            value.meta.historical = false;
        }

        const disablePeriodAndDelta = params.disablePeriodAndDelta;
        delete params.disablePeriodAndDelta;

        const oldJson = value.toJSON();
        value.parse(params);
        const newJson = value.toJSON();

        if (value.period === undefined) {
            value.period = '0';
        }

        value.parent = this;

        if (disablePeriodAndDelta === true) {
            value.delta = undefined;
            value.period = undefined;
        }

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

        let data;
        let timestamp;
        if (params.initialState) {
            if (typeof params.initialState === 'object') {
                data = params.initialState.data?.toString();
                timestamp = params.initialState.timestamp?.toString();
            } else {
                data = params.initialState.toString();
            }
        }

        const promises: Promise<void | State>[] = [];
        if (['r', 'rw', 'wr'].includes(params.permission)) {
            promises.push(
                value.createState({
                    type: 'Report',
                    timestamp,
                    data,
                })
            );
        }
        if (['w', 'rw', 'wr'].includes(params.permission)) {
            promises.push(
                value.createState({
                    type: 'Control',
                    timestamp,
                    data,
                })
            );
        }
        if (params.permission === 'r') {
            promises.push(value.deleteState('Control'));
        } else if (params.permission === 'w') {
            promises.push(value.deleteState('Report'));
        }
        await Promise.all(promises);

        await value.created();

        return value;
    }

    createValue(
        name: string | ICreateValue,
        permission?: ValuePermission,
        valueTemplate?: ValueType,
        period?: number | string,
        delta?: number | 'inf',
        disableLog?: boolean,
        disablePeriodAndDelta?: boolean
    ): Promise<Value> {
        this.validate('createValue', arguments);
        let template = valueTemplate;

        if (typeof name === 'string') {
            if (template === undefined) {
                throw new Error(
                    'Missing parameter "valueTemplate" in createValue function'
                );
            }
            if (permission === undefined) {
                throw new Error(
                    'Missing parameter "permission" in createValue function'
                );
            }
            template.name = name;
            template.permission = permission;
            template.period = period || 0;
            template.delta = delta?.toString() || '0';
            template.disableLog = disableLog;
            template.disablePeriodAndDelta = disablePeriodAndDelta;
        } else {
            template = name.template;
            template.name = name.name;
            template.permission = name.permission;
            template.period = name.period || 0;
            template.delta = name.delta?.toString() || '0';
            template.disableLog = name.disableLog;
            template.initialState = name.initialState;
            template.disablePeriodAndDelta = name.disablePeriodAndDelta;
        }

        return this.#createValue(template);
    }

    #getValueBase(
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
            initialState: params.initialState,
            disablePeriodAndDelta: params.disablePeriodAndDelta,
        };
    }

    createNumberValue(params: IValueNumber): Promise<Value> {
        this.validate('createNumberValue', arguments);
        const base = this.#getValueBase(params);
        base.delta = params.delta ?? '0';
        return this.#createValue({
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

    createStringValue(params: IValueString): Promise<Value> {
        this.validate('createStringValue', arguments);
        const base = this.#getValueBase(params);
        return this.#createValue({
            ...base,
            string: {
                max: params.max,
                encoding: params.encoding,
            },
        });
    }

    createBlobValue(params: IValueBlob): Promise<Value> {
        this.validate('createBlobValue', arguments);
        const base = this.#getValueBase(params);
        return this.#createValue({
            ...base,
            blob: {
                max: params.max,
                encoding: params.encoding,
            },
        });
    }

    createXmlValue(params: IValueXml): Promise<Value> {
        this.validate('createXmlValue', arguments);
        const base = this.#getValueBase(params);
        return this.#createValue({
            ...base,
            xml: {
                xsd: params.xsd,
                namespace: params.namespace,
            },
        });
    }

    parseChild(json: JSONObject): boolean {
        let res = false;
        const values = Value.fromArray([json]);
        if (values.length) {
            this.value.push(values[0] as Value);
            res = true;
        }
        return res;
    }

    removeChild(child: IModel): void {
        this.value = this.value.filter((value: Value) => {
            return child !== value;
        });
    }

    setParent(parent?: IModel): void {
        super.setParent(parent);
        this.value.forEach((val) => {
            if (typeof val === 'object') {
                val.setParent(this);
            }
        });
    }

    static find = async (
        params: JSONObject,
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = '',
        filterRequest?: JSONObject
    ) => {
        Device.#validate('find', [
            params,
            quantity,
            readOnly,
            usage,
            filterRequest,
        ]);

        usage ||= `Find ${quantity} device`;

        const query: JSONObject = {
            expand: 2,
        };
        if (!filterRequest) {
            for (const key in params) {
                query[`this_${key}`] = `=${params[key]}`;
            }
        }

        const data = await PermissionModel.request({
            endpoint: Device.endpoint,
            quantity,
            message: usage,
            params: query,
            body: filterRequest,
            readOnly,
        });

        const devices = Device.fromArray(data);
        const promises: Promise<void>[] = [];

        devices.forEach((dev, index) => {
            if (typeof dev === 'string') {
                promises.push(
                    new Promise<void>((resolve) => {
                        const id = dev as unknown as string;
                        Device.fetchById(id).then((device) => {
                            if (device) {
                                devices[index] = device;
                            }
                            resolve();
                        });
                    })
                );
            } else if (dev.loadAllChildren) {
                promises.push(dev.loadAllChildren(null));
            }
        });
        await Promise.all(promises);

        devices.forEach((device) => {
            if (typeof device !== 'string' && device?.addChildrenToStore) {
                device.addChildrenToStore();
            }
        });
        return devices as Device[];
    };

    static findByName(
        name: string,
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = ''
    ) {
        Device.#validate('findByName', [name, quantity, readOnly, usage]);

        usage ||= `Find ${quantity} device with name ${name}`;
        return Device.find({ name: name }, quantity, readOnly, usage);
    }

    static findAllByName(name: string, readOnly = false, usage = '') {
        Device.#validate('findAllByName', [name, readOnly, usage]);

        return Device.findByName(name, 'all', readOnly, usage);
    }

    static findByProduct(
        product: string,
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = ''
    ) {
        Device.#validate('findByProduct', [product, quantity, readOnly, usage]);

        usage ||= `Find ${quantity} device with product ${product}`;
        return Device.find({ product: product }, quantity, readOnly, usage);
    }

    static findAllByProduct(product: string, readOnly = false, usage = '') {
        Device.#validate('findAllByProduct', [product, readOnly, usage]);

        return Device.findByProduct(product, 'all', readOnly, usage);
    }

    static findById = async (id: string, readOnly = false) => {
        Device.#validate('findById', [id, readOnly]);
        const devices = await Device.find(
            { 'meta.id': id },
            1,
            readOnly,
            `Find device with id ${id}`
        );
        return devices[0];
    };

    static findByFilter = async (
        filter: Filter,
        omit_filter: Filter = {},
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = ''
    ) => {
        Device.#validate('findByFilter', [
            filter,
            omit_filter,
            quantity,
            readOnly,
            usage,
        ]);

        usage ||= `Find ${quantity} device using filter`;
        const filterRequest = generateFilterRequest(
            Device.getFilterResult,
            filter,
            omit_filter
        );
        return await Device.find({}, quantity, readOnly, usage, filterRequest);
    };

    static findAllByFilter = async (
        filter: Filter,
        omit_filter: Filter = {},
        readOnly = false,
        usage = ''
    ) => {
        Device.#validate('findAllByFilter', [
            filter,
            omit_filter,
            readOnly,
            usage,
        ]);
        return Device.findByFilter(filter, omit_filter, 'all', readOnly, usage);
    };

    static fetchById = async (id: string) => {
        Device.#validate('fetchById', [id]);
        const data = await Model.fetch({
            endpoint: `${Device.endpoint}/${id}`,
            params: {
                expand: 2,
            },
        });
        const res = Device.fromArray(data);
        if (res[0]) {
            const device = res[0] as Device;
            await device.loadAllChildren(null);
            return device;
        }
        return undefined;
    };

    static fetch = async () => {
        const params = { expand: 2 };
        const url = Device.endpoint;
        const data = await Model.fetch({ endpoint: url, params });
        const devices = Device.fromArray(data);
        const promises: Promise<void>[] = [];
        devices.forEach((dev, index) => {
            if (typeof dev === 'string') {
                promises.push(
                    new Promise<void>((resolve) => {
                        const id = dev as unknown as string;
                        Device.fetchById(id).then((device) => {
                            if (device) {
                                devices[index] = device;
                            }
                            resolve();
                        });
                    })
                );
            } else if (dev.loadAllChildren) {
                promises.push(dev.loadAllChildren(null));
            }
        });
        await Promise.all(promises);

        devices.forEach((device) => {
            if (typeof device !== 'string' && device?.addChildrenToStore) {
                device.addChildrenToStore();
            }
        });

        return devices as Device[];
    };

    async setConnectionStatus(state: boolean | number): Promise<boolean> {
        Device.#validate('setConnectionStatus', [state]);
        let res = false;
        const value = this.findValueByType(
            ValueTemplate.CONNECTION_STATUS.type
        );
        const reportState = state ? '1' : '0';
        if (value.length > 0) {
            res = await value[0].report(reportState);
        } else {
            const newValue = await this.createValue({
                name: 'Connection',
                permission: 'r',
                template: ValueTemplate.CONNECTION_STATUS,
                initialState: reportState,
            });
            res = !!newValue;
        }

        return res;
    }

    async #fetchMissingValues(offset: number): Promise<void> {
        const data = await Model.fetch({
            endpoint: `${this.url()}/${this.id()}/value`,
            params: {
                expand: 1,
                offset: offset,
            },
        });
        const values = Value.fromArray(data);
        const promises: Promise<void>[] = [];

        let stringIdsOffset = -1;
        values.forEach((val, index: number) => {
            if (typeof val === 'string') {
                if (stringIdsOffset === -1) {
                    stringIdsOffset = index;
                }
            } else {
                this.value[offset + index] = val;
            }
        });

        if (stringIdsOffset !== -1) {
            promises.push(this.#fetchMissingValues(stringIdsOffset));
        }

        values.forEach((val) => {
            if (typeof val === 'object') {
                promises.push(val.loadAllChildren(null));
            }
        });
        await Promise.all(promises);
    }

    static #validate(name: string, params: ValidateParams): void {
        Model.validateMethod('Device', name, params);
    }
}
