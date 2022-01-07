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
    IState,
    ILogRequest,
    ILogResponse,
    RefreshStreamCallback,
    ValueStreamCallback,
} from '../util/interfaces';

export class Value extends StreamModel implements IValue {
    static endpoint = '/2.0/value';

    name: string;
    permission: 'r' | 'w' | 'rw' | 'wr' = 'r';
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
        Model.checker.IValueFunc.methodArgs('constructor').check([name]);
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

    public static fetch = async () => {
        let params = { expand: 2 };
        let url = Value.endpoint;

        let data = await Model.fetch(url, params);
        return Value.fromArray(data);
    };

    private findState(type: string): State | undefined {
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

    private findStateAndUpdate(
        type: string,
        data: string | number,
        timestamp: string | undefined
    ): void {
        let state = this.findState(type);
        if (state) {
            state.data = data.toString();
            state.timestamp = timestamp || this.getTime();
            state.update();
        }
    }

    private findStateAndCallback(
        type: string,
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
        Model.checker.IValueFunc.methodArgs('createState').check([params]);

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
        state.parent = this;
        let newJson = state.toJSON();

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

    private findStateAndData(type: string): string | undefined {
        let state = this.findState(type);
        if (state) {
            return state.data;
        }
        return undefined;
    }

    private findStateAndTimestamp(type: string): string | undefined {
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

    public report(
        data: string | number,
        timestamp: string | undefined = undefined
    ): void {
        Model.checker.IValueFunc.methodArgs('report').check([data, timestamp]);

        this.findStateAndUpdate('Report', data, timestamp);
    }

    public control(
        data: string | number,
        timestamp: string | undefined = undefined
    ): void {
        Model.checker.IValueFunc.methodArgs('control').check([data, timestamp]);

        this.findStateAndUpdate('Control', data, timestamp);
    }

    public onControl(callback: ValueStreamCallback): void {
        Model.checker.IValueFunc.methodArgs('onControl').check([callback]);

        this.findStateAndCallback('Control', callback);
    }

    public onReport(callback: ValueStreamCallback): void {
        Model.checker.IValueFunc.methodArgs('onReport').check([callback]);

        this.findStateAndCallback('Report', callback);
    }

    public onRefresh(callback: RefreshStreamCallback): void {
        Model.checker.IValueFunc.methodArgs('onRefresh').check([callback]);

        this.onChange(() => {
            if (this.status === 'update') {
                callback(this);
                this.status = '';
            }
        });
    }

    private findStateAndLog = async (
        type: string,
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
        Model.checker.IValueFunc.methodArgs('getReportLog').check([request]);

        return this.findStateAndLog('Report', request);
    };

    public getControlLog = async (
        request: ILogRequest
    ): Promise<ILogResponse> => {
        Model.checker.IValueFunc.methodArgs('getControlLog').check([request]);

        return this.findStateAndLog('Control', request);
    };

    static find = async (
        params: Record<string, any>,
        quantity: number | 'all' = 1,
        usage: string = ''
    ) => {
        Model.checker.IValueFunc.methodArgs('find').check([
            params,
            quantity,
            usage,
        ]);
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
        Model.checker.IValueFunc.methodArgs('findByName').check([
            name,
            quantity,
            usage,
        ]);
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
        Model.checker.IValueFunc.methodArgs('findByType').check([
            type,
            quantity,
            usage,
        ]);
        if (usage === '') {
            usage = `Find ${quantity} value with type ${type}`;
        }
        return Value.find({ type: type }, quantity, usage);
    };

    static findAllByName = async (name: string, usage: string = '') => {
        Model.checker.IValueFunc.methodArgs('findAllByName').check([
            name,
            usage,
        ]);
        return Value.findByName(name, 'all', usage);
    };

    static findAllByType = async (type: string, usage: string = '') => {
        Model.checker.IValueFunc.methodArgs('findAllByType').check([
            type,
            usage,
        ]);
        return Value.findByType(type, 'all', usage);
    };
}
