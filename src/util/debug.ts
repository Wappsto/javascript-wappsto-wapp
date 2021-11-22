import settings from '../util/settings';

export function printDebug(message: string): void {
    if (settings.debug) {
        console.log(`WAPPSTO DEBUG: ${message}`);
    }
}

export function printError(message: string): void {
    console.error(`WAPPSTO ERROR: ${message}`);
}

export function printWarning(message: string): void {
    console.warn(`WAPPSTO WARN: ${message}`);
}
