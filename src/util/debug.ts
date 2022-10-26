import { _config } from './config';
import { toString } from './helpers';

export function printDebug(message: string): void {
    if (_config.debug) {
        console.log(`WAPPSTO DEBUG: ${message}`);
    }
}

export function printRequest(
    func: string,
    url: string,
    config: Record<string, any>,
    data: Record<string, any>,
    response?: Record<string, any>
) {
    if (_config.requests && !url.includes('/console')) {
        const msg = `${func} ${url} ${toString(config)} ${toString(
            data
        )} => ${toString(response)}`;
        console.log(`WAPPSTO REQUEST: ${msg}`);
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
