import { printError, printWarning } from './util/debug';
import { isBrowser, toSafeString } from './util/helpers';
import wappsto from './util/http_wrapper';
import { JSONObject } from './util/interfaces';

const defaultConsole = Object.assign({}, console);
let stopExtSync = false;
type consoleEvent = { type: string; data: string | JSONObject };
let debugQueue: consoleEvent[] = [];

function generateConsoleMessage(key: string, ...args: any[]): any {
    const time = new Date().toISOString();
    const data = {
        type: key,
        data: toSafeString({
            key: key,
            arguments: args[0],
            time: time,
        }),
    };
    return data;
}

async function sendConsoleEvent(event: consoleEvent): Promise<any> {
    let res;
    try {
        res = await wappsto.post(`/2.1/console/${event.type}`, event.data);
    } catch (e: any) {
        if (e.response) {
            printError(
                `Failed to send debug message (${toSafeString(e.response)})`,
                defaultConsole
            );
            if (e.response.data && e.response.data.code === 117000000) {
                return false;
            }
            return e.response;
        } else {
            printError(`Failed to send debug message`, defaultConsole);
        }
        return null;
    }
    return res;
}

async function sendDebugQueue() {
    if (debugQueue.length === 0) {
        return;
    }

    const event = debugQueue[0];

    const res = await sendConsoleEvent(event);
    if (res === false) {
        stopExtSync = true;
        printError(
            `Stopping background logging - discarding ${debugQueue.length} messages`
        );
        debugQueue = [];
        return;
    }

    debugQueue.shift();
    sendDebugQueue();
}

function newFunc(name: string) {
    return function (...args: any[]) {
        if (process.env.DISABLE_LOG === undefined && !stopExtSync) {
            debugQueue.push(generateConsoleMessage(name, arguments));
            if (debugQueue.length === 1) {
                sendDebugQueue();
            }
        }
        defaultConsole.log(...args);
    };
}

export function backgroundLogging(): void {
    console.log = newFunc('log');
    console.info = newFunc('info');
    console.error = newFunc('error');
    console.warn = newFunc('warn');

    /* istanbul ignore next */
    process.on('uncaughtException', (err) => {
        defaultConsole.error(err);
        const req = sendConsoleEvent(
            generateConsoleMessage('error', [err.stack])
        );
        req.finally(function () {
            process.exit(1);
        });
    });

    /* istanbul ignore next */
    process.on('unhandledRejection', (reason, promise) => {
        defaultConsole.error(
            'Unhandled Rejection at:',
            promise,
            'reason:',
            reason
        );
        const req = sendConsoleEvent(generateConsoleMessage('error', [reason]));
        req.finally(function () {
            process.exit(1);
        });
    });
}

export function startLogging(): void {
    if (console.error === defaultConsole.error && !isBrowser()) {
        backgroundLogging();
    } else {
        printWarning(
            'DEPRECATED - The "startLogging" is not needed to be called any more'
        );
    }
}

export function stopLogging(): void {
    Object.assign(console, defaultConsole);
}

/* istanbul ignore next */
if (!isBrowser()) {
    /* istanbul ignore next */
    backgroundLogging();
}
