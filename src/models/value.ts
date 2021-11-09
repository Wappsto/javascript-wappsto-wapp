import * as _ from 'lodash';
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
    state: State[] = [];

    constructor(name?: string) {
        super();
        this.name = name;
    }

    get states() {
        return this.state;
    }

    url(): string {
        return Value.endpoint;
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
        let values: Value[] = [];

        data?.forEach((json: any) => {
            values.push(Value.fromJSON(json));
        });
        return values;
    };

    static fromJSON(json: any): Value {
        let value = Object.create(Value.prototype);
        let states: State[] = [];
        json.state?.forEach((val: any) => {
            states.push(State.fromJSON(val));
        });
        return Object.assign(value, _.omit(json, ['state']), { state: states });
    }
}
