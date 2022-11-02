import { IModel } from './interfaces';

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
                return 'CREF';
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
