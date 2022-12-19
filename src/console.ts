import wappsto from './util/http_wrapper';
import { printError, printWarning } from './util/debug';
import { isBrowser, toString } from './util/helpers';

const defaultConsole = Object.assign({}, console);
let stopExtSync = false;
let debugQueue: any[] = [];

function generateExtsyncMessage(key: string, ...args: any[]): any {
    const time = new Date().toISOString();
    const data = toString({
        key: key,
        arguments: args[0],
        time: time,
    });
    return data;
}

async function sendExtsync(data: any): Promise<any> {
    let res;
    try {
        res = await wappsto.post('/2.1/extsync/wappsto/editor/console', data);
    } catch (e: any) {
        if (e.response) {
            printError(
                `Failed to send debug message (${JSON.stringify(e.response)})`,
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

    const res = await sendExtsync(event);
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
            debugQueue.push(generateExtsyncMessage(name, arguments));
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
        const req = sendExtsync(generateExtsyncMessage('error', [err.stack]));
        req.finally(function () {
            process.exit(1);
        });
    });

    /* istanbul ignore next */
    process.on('unhandledRejection', (reason, promise) => {
        console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
    });
}

export function startLogging(): void {
    if (console.error === defaultConsole.error && !isBrowser()) {
        backgroundLogging();
    } else {
        printWarning(
            'DEPLICATED - The "startLogging" is not needed to be called anymore'
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
