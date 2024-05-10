import { _config } from './config';
import { isBrowser, toSafeString } from './helpers';
import { JSONObject, JSONValue } from './interfaces';

export function printDebug(message: string): void {
    if (_config.debug) {
        console.log(`WAPPSTO DEBUG: ${message}`);
    }
}

export function printRequest(
    func: string,
    url: string,
    config?: JSONObject,
    data?: JSONValue | string,
    response?: JSONValue
) {
    if (_config.requests && !url.includes('/console')) {
        const msg = `${func} ${url} ${toSafeString(config)} ${toSafeString(
            data
        )} => ${toSafeString(response)}`;
        console.log(`WAPPSTO REQUEST: ${msg}`);
    }
}

export function printError(message: string | unknown, stdout = console): void {
    if (typeof message === 'string') {
        stdout.error(`WAPPSTO ERROR: ${message}`);
    } else {
        const e = message as Error;
        stdout.error(`WAPPSTO ERROR: ${e.stack}`);
    }
}

export function printWarning(message: string): void {
    console.warn(`WAPPSTO WARN: ${message}`);
}

export function printStream(message: string, ...args: unknown[]): void {
    if (_config.stream) {
        console.log(`WAPPSTO STREAM: ${message}`, ...args);
    }
}

/* istanbul ignore next */
export function fatalError(message: string) {
    if (isBrowser()) {
        console.error(`WAPPSTO FATAL ERROR: ${message}`);
    } else {
        process.stderr.write(`WAPPSTO FATAL ERROR: ${message}\n`);
        process.exit(11);
    }
}
