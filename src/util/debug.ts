import { config } from '../util/config';

export function printDebug(message: string): void {
    /* istanbul ignore next */
    if (config().debug) {
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
