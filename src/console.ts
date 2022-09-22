import wappsto from './util/http_wrapper';
import { printDebug, printWarning } from './util/debug';
import { isBrowser } from './util/helpers';

const defaultConsole = Object.assign({}, console);

function newFunc(name: string) {
    return function (...args: any[]) {
        sendExtsync(name, arguments);
        defaultConsole.log(...args);
    };
}

function sendExtsync(key: string, ...args: any[]): any {
    const time = new Date().toISOString();
    const data = JSON.stringify({
        key: key,
        arguments: args[0],
        time: time,
    });

    return wappsto
        .post('/2.0/extsync/wappsto/editor/console', data)
        ?.catch((e: any) => {
            /* istanbul ignore next */
            printDebug(e);
        });
}

export function backgroundLogging(): void {
    console.log = newFunc('log');
    console.info = newFunc('info');
    console.error = newFunc('error');
    console.warn = newFunc('warn');

    /* istanbul ignore next */
    process.on('uncaughtException', (err) => {
        defaultConsole.error(err);
        const req = sendExtsync('error', [err.stack]);
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
