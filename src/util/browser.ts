export function isBrowser(): boolean {
    return !(
        typeof process !== 'undefined' &&
        Object.prototype.toString.call(process) === '[object process]'
    ); // || global['forceBrowser'];
}
