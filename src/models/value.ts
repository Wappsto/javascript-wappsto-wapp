import * as _ from 'lodash';
import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { StreamModel } from './model.stream';
import { Model } from './model';
import { State } from './state';
import { printDebug } from '../util/debug';
import {
    IValue,
    IValueNumber,
    IValueString,
    IValueBlob,
    IValueXml,
    ValuePermission,
    IState,
    StateType,
    ILogRequest,
    ILogResponse,
    RefreshStreamCallback,
    ValueStreamCallback,
} from '../util/interfaces';

export class Value extends StreamModel implements IValue {
    static endpoint = '/2.0/value';

    name: string;
    permission: ValuePermission = 'r';
    tmp_permission: ValuePermission = 'r';
    type?: string;
    period?: string;
    delta?: string;
    number?: IValueNumber;
    string?: IValueString;
    blob?: IValueBlob;
    xml?: IValueXml;
    status?: string;
    @Type(() => State)
    state: State[] = [];

    constructor(name?: string) {
        super('value');
        Model.validateMethod('Value', 'constructor', arguments);
        this.name = name || '';
    }

    get states() {
        return this.state;
    }

    attributes(): string[] {
        return [
            'name',
            'permission',
            'type',
            'period',
            'delta',
            'number',
            'string',
            'blob',
            'xml',
            'status',
        ];
    }

    public perserve(): void {
        this.tmp_permission = this.permission;
    }

    public restore(): void {
        this.permission = this.tmp_permission;
    }

    public static fetch = async () => {
        let params = { expand: 2 };
        let url = Value.endpoint;

        let data = await Model.fetch(url, params);
        return Value.fromArray(data);
    };

    private findState(type: StateType): State | undefined {
        let res: State | undefined = undefined;
        this.state.forEach((state) => {
            if (state.type === type) {
                res = state;
            }
        });
        return res;
    }

    private getTime(): string {
        return new Date().toISOString();
    }

    private async findStateAndUpdate(
        type: StateType,
        data: string | number,
        timestamp: string | undefined
    ): Promise<void> {
        let state = this.findState(type);
        if (state) {
            state.data = data.toString();
            state.timestamp = timestamp || this.getTime();
            await state.update();
        }
    }

    private findStateAndCallback(
        type: StateType,
        callback: ValueStreamCallback
    ): void {
        let state = this.findState(type);
        if (state) {
            state.onChange(() => {
                if (state) {
                    callback(this, state.data, state.timestamp);
                }
            });
        }
    }

    public createState = async (params: IState) => {
        this.validate('createState', [params]);

        let create = false;
        let state = this.findState(params.type);
        if (!state) {
            state = new State(params.type);
            create = true;
        } else {
            printDebug(`Using existing state with id ${state.meta.id}`);
        }

        let oldJson = state.toJSON();
        state.parse(params);
        let newJson = state.toJSON();

        state.parent = this;
        if (create || !_.isEqual(oldJson, newJson)) {
            if (create) {
                await state.create();
                this.state.push(state);
            } else {
                await state.update();
            }
        }

        return state;
    };

    private findStateAndData(type: StateType): string | undefined {
        let state = this.findState(type);
        if (state) {
            return state.data;
        }
        return undefined;
    }

    private findStateAndTimestamp(type: StateType): string | undefined {
        let state = this.findState(type);
        if (state) {
            return state.timestamp;
        }
        return undefined;
    }

    public getReportData(): string | undefined {
        return this.findStateAndData('Report');
    }

    public getControlData(): string | undefined {
        return this.findStateAndData('Control');
    }

    public getControlTimestamp(): string | undefined {
        return this.findStateAndTimestamp('Control');
    }

    public getReportTimestamp(): string | undefined {
        return this.findStateAndTimestamp('Report');
    }

    public async report(
        data: string | number,
        timestamp: string | undefined = undefined
    ): Promise<void> {
        this.validate('report', arguments);

        this.findStateAndUpdate('Report', data, timestamp);
    }

    public async control(
        data: string | number,
        timestamp: string | undefined = undefined
    ): Promise<void> {
        this.validate('control', arguments);

        this.findStateAndUpdate('Control', data, timestamp);
    }

    public onControl(callback: ValueStreamCallback): void {
        this.validate('onControl', arguments);

        this.findStateAndCallback('Control', callback);
    }

    public onReport(callback: ValueStreamCallback): void {
        this.validate('onReport', arguments);

        this.findStateAndCallback('Report', callback);
    }

    public onRefresh(callback: RefreshStreamCallback): void {
        this.validate('onRefresh', arguments);

        this.onChange(() => {
            if (this.status === 'update') {
                callback(this);
                this.status = '';
            }
        });
    }

    private findStateAndLog = async (
        type: StateType,
        request: ILogRequest
    ): Promise<ILogResponse> => {
        let state = this.findState(type);
        if (state) {
            let response = await Model.fetch(
                `/2.1/log/${state.meta.id}/state`,
                request
            );
            return response[0] as ILogResponse;
        }
        return {
            meta: {
                id: '',
                type: 'log',
                version: '2.1',
            },
            data: [],
            more: false,
            type: 'state',
        };
    };

    public getReportLog = async (
        request: ILogRequest
    ): Promise<ILogResponse> => {
        this.validate('getReportLog', [request]);

        return this.findStateAndLog('Report', request);
    };

    public getControlLog = async (
        request: ILogRequest
    ): Promise<ILogResponse> => {
        this.validate('getControlLog', [request]);

        return this.findStateAndLog('Control', request);
    };

    static find = async (
        params: Record<string, any>,
        quantity: number | 'all' = 1,
        usage: string = ''
    ) => {
        Value.validate('find', [params, quantity, usage]);
        if (usage === '') {
            usage = `Find ${quantity} value`;
        }

        let query: Record<string, any> = {
            expand: 2,
        };
        for (let key in params) {
            query[`this_${key}`] = params[key];
        }

        let data = await PermissionModel.request(
            Value.endpoint,
            quantity,
            usage,
            query
        );
        return Value.fromArray(data);
    };

    static findByName = async (
        name: string,
        quantity: number | 'all' = 1,
        usage: string = ''
    ) => {
        Value.validate('findByName', [name, quantity, usage]);
        if (usage === '') {
            usage = `Find ${quantity} value with name ${name}`;
        }
        return Value.find({ name: name }, quantity, usage);
    };

    static findByType = async (
        type: string,
        quantity: number | 'all' = 1,
        usage: string = ''
    ) => {
        Value.validate('findByType', [type, quantity, usage]);
        if (usage === '') {
            usage = `Find ${quantity} value with type ${type}`;
        }
        return Value.find({ type: type }, quantity, usage);
    };

    static findAllByName = async (name: string, usage: string = '') => {
        Value.validate('findAllByName', [name, usage]);
        return Value.findByName(name, 'all', usage);
    };

    static findAllByType = async (type: string, usage: string = '') => {
        Value.validate('findAllByType', [type, usage]);
        return Value.findByType(type, 'all', usage);
    };

    private static validate(name: string, params: any): void {
        Model.validateMethod('Value', name, params);
    }
}
