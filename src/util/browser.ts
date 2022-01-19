export function isBrowser(): boolean {
    return typeof process !== 'object';
}
