import { printWarning } from './debug';
import {
    FilterSubType,
    FilterValueOperatorType,
    FilterValueType,
    IModel,
    LogGroupBy,
    LogValue,
    LogValues,
    Timestamp,
} from './types';

export function isBrowser(): boolean {
    return (
        typeof window !== 'undefined' &&
        Object.prototype.toString.call(window) === '[object Window]'
    );
}

export function isUUID(data: string) {
    const reg =
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-b8-9][a-f0-9]{3}-[a-f0-9]{12}$/i;
    return reg.test(data);
}

export function isVersion(data: string) {
    const reg = /^\d\.\d$/i;
    return reg.test(data);
}

export function compareCallback(cb1: unknown, cb2: unknown) {
    return (
        cb1 === cb2 || (cb1 as object).toString() === (cb2 as object).toString()
    );
}

export function checkListIndex(list: unknown[], check: unknown) {
    for (let i = 0; i < list.length; i++) {
        if (compareCallback(list[i], check)) {
            return i;
        }
    }
    return -1;
}

export function checkList(list: unknown[], check: unknown) {
    return checkListIndex(list, check) !== -1;
}

export function getNextTimestamp(date: Date): Date {
    return new Date(date.setMilliseconds(date.getMilliseconds() + 1));
}

export function getNextPeriod(date: Date, period: LogGroupBy): Date {
    switch (period) {
        case 'minute':
            date.setMilliseconds(0);
            date.setSeconds(0);
            return new Date(date.setMinutes(date.getMinutes() + 1));
        case 'hour':
            date.setMilliseconds(0);
            date.setSeconds(0);
            date.setMinutes(0);
            return new Date(date.setHours(date.getHours() + 1));
        case 'day':
            date.setMilliseconds(0);
            date.setSeconds(0);
            date.setMinutes(0);
            date.setHours(0);
            return new Date(date.setDate(date.getDate() + 1));
    }
    return date;
}

export function getSecondsToNextPeriod(period: number) {
    const now = Date.now();
    const midnight = new Date(new Date().setUTCHours(0, 0, 0, 0)).getTime();

    const seconds_since_midnight = (now - midnight) / 1000;
    const seconds_to_next_period =
        (Math.floor(seconds_since_midnight / period) + 1) * period;
    return seconds_to_next_period - seconds_since_midnight;
}

export function randomIntFromInterval(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function isPositiveInteger(str: number | string) {
    const num = Number(str);

    return Number.isInteger(num) && num > 0;
}

function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function replaceAll(str: string, find: string, replace: string): string {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

export function compareModels(m1: IModel, m2: IModel) {
    return m1.id() === m2.id();
}

export function uniqueModels(value: IModel, index: number, self: IModel[]) {
    return self.findIndex((model) => compareModels(model, value)) === index;
}

export function getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: unknown) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return 'Circular REF';
            }
            seen.add(value);
        }
        return value;
    };
}

export function toSafeString(json: unknown): string {
    if (!json) {
        return '';
    }
    if (typeof json === 'string') {
        return json;
    }
    return JSON.stringify(json, getCircularReplacer());
}

export function toSafeObject(json: unknown): Record<string, unknown> {
    return JSON.parse(toSafeString(json));
}

export function toTime(date: Timestamp): number {
    if (typeof date === 'string') {
        return Date.parse(date);
    }

    if (typeof date === 'object') {
        return date.getTime();
    }

    /* istanbul ignore next */
    return date;
}

export function compareDates(date1: Timestamp, date2: Timestamp): boolean {
    const d1 = toTime(date1);
    const d2 = toTime(date2);

    return d1 >= d2;
}

export function toISOString(date: Timestamp) {
    if (typeof date === 'string') {
        return date;
    }

    try {
        return new Date(date).toISOString();
    } catch (e) {
        printWarning(`Failed to convert timestamp (${date}) to string`);
        return '';
    }
}

function isOperatorValue(
    obj:
        | FilterValueType
        | Record<string, Record<string, FilterValueType>>
        | Record<string, FilterValueType>
): obj is FilterValueOperatorType {
    if (obj && typeof obj === 'object') {
        return 'operator' in obj && 'value' in obj;
    }
    return false;
}

function attributesToFilter(
    type: string,
    operator: string,
    filter: FilterSubType,
    attributes: string[]
) {
    const strFilter: string[] = [];
    attributes.forEach((att: string) => {
        if (filter[att] === undefined) {
            return;
        } else if (isOperatorValue(filter[att])) {
            const opr = filter[att] as FilterValueOperatorType;
            strFilter.push(`${type}_${att}${opr.operator}[${opr.value}]`);
        } else if (
            typeof filter[att] === 'string' ||
            typeof filter[att] === 'number'
        ) {
            strFilter.push(`${type}_${att}${operator}${filter[att]}`);
        } else if (Array.isArray(filter[att])) {
            const arr = filter[att] as string[] | number[];
            strFilter.push(`${type}_${att}${operator}[${arr.join(',')}]`);
        } else if (typeof filter[att] === 'object') {
            for (const [k, v] of Object.entries(filter[att] ?? {})) {
                if (isOperatorValue(v)) {
                    const opr = v;
                    strFilter.push(
                        `${type}_${att}.${k}${opr.operator}${opr.value}`
                    );
                } else {
                    const str = `${type}_${att}.${k}${operator}`;
                    if (Array.isArray(v)) {
                        strFilter.push(`${str}[${v.join(',')}]`);
                    } else if (typeof v === 'string') {
                        strFilter.push(`${str}${v}`);
                    } else if (typeof v === 'number') {
                        strFilter.push(`${str}${(v as number).toString()}`);
                    }
                }
            }
            /* istanbul ignore next */
        } else if (filter[att] !== undefined) {
            /* istanbul ignore next */
            strFilter.push(`${type}_${att}${operator}${filter[att]}`);
        }
    });
    return strFilter;
}

export function convertFilterToJson(
    type: string,
    attributes: string[],
    filter?: FilterSubType,
    omit_filter?: FilterSubType
): string[] {
    let strFilter: string[] = [];
    if (filter) {
        strFilter = strFilter.concat(
            attributesToFilter(type, '=', filter, attributes)
        );
    }
    if (omit_filter) {
        strFilter = strFilter.concat(
            attributesToFilter(type, '!=', omit_filter, attributes)
        );
    }
    return strFilter;
}

export function convertFilterToString(
    attributes: string[],
    filter?: FilterSubType,
    omit_filter?: FilterSubType
): string {
    let strFilter: string[] = [];
    if (filter) {
        strFilter = strFilter.concat(
            attributesToFilter('this', '=', filter, attributes)
        );
    }
    if (omit_filter) {
        strFilter = strFilter.concat(
            attributesToFilter('this', '!=', omit_filter, attributes)
        );
    }
    if (strFilter.length > 0) {
        return `(attribute: [${strFilter.map((str) => `"${str}"`).join(',')}])`;
    }
    return '';
}

export function sortByTimestamp(a: LogValue, b: LogValue): number {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateA.getTime() - dateB.getTime();
}

export function isLogValues<T>(data: LogValues | T): data is LogValues {
    if (Array.isArray(data)) {
        return data.some((value) => {
            return value.data !== undefined && value.timestamp !== undefined;
        });
    }
    return false;
}
