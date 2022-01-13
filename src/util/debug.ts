import { config } from '../util/config';

export function printDebug(message: string): void {
    if (config().debug) {
        /* istanbul ignore next */
        console.log(`WAPPSTO DEBUG: ${message}`);
    }
}

export function printError(message: string): void {
    console.error(`WAPPSTO ERROR: ${message}`);
}

export function printWarning(message: string): void {
    /* istanbul ignore next */
    console.warn(`WAPPSTO WARN: ${message}`);
}
