import { IMeta } from './meta';
import { State } from './state';

class ValueNumber {}

class ValueString {}

class ValueBlob {}

class ValueXml {}

export class Value {
    meta: IMeta = {};
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
}
