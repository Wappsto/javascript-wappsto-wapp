import { _config } from '../util/config';

export function printDebug(message: string): void {
    if (_config.debug) {
        console.log(`WAPPSTO DEBUG: ${message}`);
    }
}

export function printRequest(message: string): void {
    if (_config.requests) {
        console.log(`WAPPSTO REQUEST: ${message}`);
    }
}

export function printError(message: string | unknown): void {
    if (typeof message === 'string') {
        console.error(`WAPPSTO ERROR: ${message}`);
    } else {
        const e = message as Error;
        console.error(`WAPPSTO ERROR: ${e.stack}`);
    }
}

export function printWarning(message: string): void {
    console.warn(`WAPPSTO WARN: ${message}`);
}
