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

export function checkList(list: any[], check: any): boolean {
    for (let i = 0; i < list.length; i++) {
        if (list[i] === check || list[i].toString() === check.toString()) {
            return true;
        }
    }
    return false;
}
