import { IModel, LogValue } from './interfaces';

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

export function checkList(list: any[], check: any): boolean {
    for (let i = 0; i < list.length; i++) {
        if (list[i] === check || list[i].toString() === check.toString()) {
            return true;
        }
    }
    return false;
}

export function getSecondsToNextPeriod(period: number): number {
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
    return (key: string, value: any) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return 'Circular REF';
            }
            seen.add(value);
        }
        return value;
    };
}

export function toString(json: Record<string, any> | unknown): string {
    if (!json) {
        return '';
    }
    if (typeof json === 'string') {
        return json;
    }
    return JSON.stringify(json, getCircularReplacer());
}

export function toTime(date: Date | string | number): number {
    if (typeof date === 'string') {
        return Date.parse(date);
    }

    if (typeof date === 'object') {
        return date.getTime();
    }

    /* istanbul ignore next */
    return date;
}

export function compareDates(
    date1: Date | string | number,
    date2: Date | string | number
): boolean {
    const d1 = toTime(date1);
    const d2 = toTime(date2);

    return d1 >= d2;
}

function attributesToFilter(
    type: string,
    operator: string,
    filter: Record<string, any>,
    attributes: string[]
) {
    const strFilter: string[] = [];
    attributes.forEach((att: string) => {
        if (Array.isArray(filter[att])) {
            strFilter.push(
                `${type}_${att}${operator}[${filter[att].join(',')}]`
            );
        } else if (typeof filter[att] === 'object') {
            for (const [k, v] of Object.entries(filter[att])) {
                const str = `${type}_${att}.${k}${operator}`;
                if (Array.isArray(v)) {
                    strFilter.push(`${str}[${v.join(',')}]`);
                } else if (typeof v === 'string') {
                    strFilter.push(`${str}${v}`);
                } else if (typeof v === 'number') {
                    strFilter.push(`${str}${v.toString()}`);
                }
            }
        } else if (filter[att] !== undefined) {
            strFilter.push(`${type}_${att}${operator}${filter[att]}`);
        }
    });
    return strFilter;
}

export function convertFilterToJson(
    type: string,
    attributes: string[],
    filter?: Record<string, any>,
    omit_filter?: Record<string, any>
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
    filter?: Record<string, any>,
    omit_filter?: Record<string, any>
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

export function generateFilterRequest(
    request: Record<string, any>,
    result: string
) {
    return { filter: { attribute: request }, return: `{${result}}` };
}

export function sortByTimestamp(a: LogValue, b: LogValue): number {
    const dateA = new Date(a.timestamp || 0);
    const dateB = new Date(b.timestamp || 0);
    return dateA.getTime() - dateB.getTime();
}
