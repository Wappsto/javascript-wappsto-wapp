import { Type } from 'class-transformer';
import { Model } from './model';
import { State } from './state';

interface ValueNumber {
    min: number;
    max: number;
    step: number;
    unit?: string;
    si_unit?: string;
}

interface ValueString {
    max: number;
    encoding?: string;
}

interface ValueBlob {
    max: number;
    encoding?: string;
}

interface ValueXml {
    max: number;
    encoding?: string;
}

type ValueStreamCallback = (data: string, timestamp: string) => void;
type RefreshStreamCallback = () => void;

export class Value extends Model {
    static endpoint = '/2.0/value';

    name?: string;
    permission?: string;
    type?: string;
    period?: string;
    delta?: string;
    number?: ValueNumber;
    string?: ValueString;
    blob?: ValueBlob;
    xml?: ValueXml;
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

    public static fetch = async () => {
        let data: any[] = await Model.fetch(Value.endpoint + '?expand=1');
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

    public static findByName = async (name: string) => {
        let data: any = await Model.fetch(
            `${Value.endpoint}?this_name=${name}`,
            {
                expand: 2,
            }
        );
        return Value.fromArray(data);
    };

    public static findByType = async (type: string) => {
        let data: any = await Model.fetch(
            `${Value.endpoint}?this_type=${type}`,
            {
                expand: 2,
            }
        );
        return Value.fromArray(data);
    };
}
