import * as _ from 'lodash';
import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { StreamModel } from './model.stream';
import { Model } from './model';
import { IMeta } from './meta';
import { State, IState } from './state';
import { printDebug } from '../util/debug';

type ValueStreamCallback = (
    value: Value,
    data: string,
    timestamp: string
) => void;
type RefreshStreamCallback = (value: Value) => void;

export interface IValue {
    name: string;
    permission: string;
    type?: string;
    period?: string;
    delta?: string;
    number?: IValueNumber;
    string?: IValueString;
    blob?: IValueBlob;
    xml?: IValueXml;
}

export interface IValueNumber {
    min: number;
    max: number;
    step: number;
    unit?: string;
    si_conversion?: string;
    mapping?: Record<string, any>;
    ordered_mapping?: boolean;
    meaningful_zero?: boolean;
}

export interface IValueString {
    max: number;
    encoding?: string;
}

export interface IValueBlob {
    max: number;
    encoding?: string;
}

export interface IValueXml {
    xsd?: string;
    namespace?: string;
}

export interface ILogRequest {
    count?: number;
    start?: Date;
    end?: Date;
}

export interface ILogResponse {
    meta: IMeta;
    data: Record<string, any>;
    more: boolean;
    type: string;
}

export class Value extends StreamModel implements IValue {
    static endpoint = '/2.0/value';

    name: string;
    permission: string;
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
        this.name = name || '';
        this.permission = '';
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
        if (!['Report', 'Control'].includes(params.type)) {
            throw new Error('Invalid value for state type');
        }

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
        this.findStateAndUpdate('Report', data, timestamp);
    }

    public control(
        data: string | number,
        timestamp: string | undefined = undefined
    ): void {
        this.findStateAndUpdate('Control', data, timestamp);
    }

    public onControl(callback: ValueStreamCallback): void {
        this.findStateAndCallback('Control', callback);
    }

    public onReport(callback: ValueStreamCallback): void {
        this.findStateAndCallback('Report', callback);
    }

    public onRefresh(callback: RefreshStreamCallback): void {
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
        return this.findStateAndLog('Report', request);
    };

    public getControlLog = async (
        request: ILogRequest
    ): Promise<ILogResponse> => {
        return this.findStateAndLog('Control', request);
    };

    static findByName = async (
        name: string,
        quantity: number = 1,
        usage: string = ''
    ) => {
        if (usage === '') {
            usage = `Find ${quantity} value with name ${name}`;
        }

        let data = await PermissionModel.request(
            Value.endpoint,
            quantity,
            usage,
            {
                this_name: name,
                expand: 2,
            }
        );
        return Value.fromArray(data);
    };

    static findByType = async (
        type: string,
        quantity: number = 1,
        usage: string = ''
    ) => {
        if (usage === '') {
            usage = `Find ${quantity} value with type ${type}`;
        }

        let data = await PermissionModel.request(
            Value.endpoint,
            quantity,
            usage,
            {
                this_type: type,
                expand: 2,
            }
        );
        return Value.fromArray(data);
    };
}
