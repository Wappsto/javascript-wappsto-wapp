import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { Model } from './model';
import { State } from './state';

export interface IValueNumber {
    min: number;
    max: number;
    step: number;
    unit?: string;
    si_conversion?: string;
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
    max: number;
    encoding?: string;
}

type ValueStreamCallback = (data: string, timestamp: string) => void;
type RefreshStreamCallback = () => void;

export class Value extends PermissionModel {
    static endpoint = '/2.0/value';

    name?: string;
    permission?: string;
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
        this.name = name;
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
            'state',
        ];
    }

    public static fetch = async (name: string = '', parentUrl: string = '') => {
        let params = { expand: 2 };
        let url = Value.endpoint;
        if (name !== '') {
            Object.assign(params, {
                'this_name=': name,
            });
        }
        if (parentUrl !== '') {
            url = parentUrl + '/value';
        }

        let data: any[] = await Model.fetch(url, params);
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

    private get_time(): string {
        return new Date().toISOString();
    }

    private findStateAndUpdate(
        type: string,
        data: string,
        timestamp: string | undefined
    ): void {
        let state = this.findState(type);
        if (state) {
            state.data = data;
            state.timestamp = timestamp || this.get_time();
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
                    callback(state.data, state.timestamp);
                }
            });
        }
    }

    public createState = async (
        type: string,
        data: string,
        timestamp: string
    ) => {
        if (!['Report', 'Control'].includes(type)) {
            throw new Error('Invalid value for state type');
        }

        let states = await State.fetch(type, this.getUrl());
        if (states.length !== 0) {
            return states[0];
        }

        let state = new State(type);
        state.data = data;
        state.timestamp = timestamp;
        await state.create();

        return state;
    };

    private findStateAndData(type: string): string | undefined {
        let state = this.findState(type);
        if (state) {
            return state.data;
        }
        return undefined;
    }

    public getReportData(): string | undefined {
        return this.findStateAndData('Report');
    }

    public getControlData(): string | undefined {
        return this.findStateAndData('Control');
    }

    public getData(): string | undefined {
        let res = this.getReportData();
        if (res) {
            return res;
        }
        return this.getControlData();
    }

    public report(data: string, timestamp: string | undefined): void {
        this.findStateAndUpdate('Report', data, timestamp);
    }

    public control(data: string, timestamp: string | undefined): void {
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
                callback();
                this.status = '';
            }
        });
    }

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

    public static findByType = async (type: string) => {
        let data: any = await Model.fetch(Value.endpoint, {
            this_type: type,
            expand: 2,
        });
        return Value.fromArray(data);
    };
}
