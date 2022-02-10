export function isBrowser(): boolean {
    return (
        typeof window !== 'undefined' &&
        Object.prototype.toString.call(window) === '[object Window]'
    );
}
