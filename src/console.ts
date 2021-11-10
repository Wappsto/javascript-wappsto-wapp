import wappsto from './http_wrapper';

const defaultConsole = Object.assign({}, console);

function replacer(_: string, value: any): any {
    if (value === undefined) {
        return 'undefined';
    } else if (value === null) {
        return 'null';
    } else if (typeof value === 'function') {
        return 'function';
    }
    return value;
}

function sendExtsync(key: string, ...args: any[]): any {
    const time = new Date().toISOString();
    const data = JSON.stringify(
        {
            key,
            args,
            time,
        },
        replacer
    );

    const req = wappsto
        .post('/2.1/extsync/wappsto/editor/console', data)
        .catch(function () {});
    return req;
}

export function start(): void {
    /* eslint-disable no-native-reassign */
    console = {
        log: (...args: any[]) => {
            sendExtsync('log', ...args);
            defaultConsole.log(...args);
        },
        error: (...args: any[]) => {
            sendExtsync('error', ...args);
            defaultConsole.error(...args);
        },
        info: (...args: any[]) => {
            sendExtsync('info', ...args);
            defaultConsole.info(...args);
        },
        warn: (...args: any[]) => {
            sendExtsync('warn', ...args);
            defaultConsole.warn(...args);
        },
    } as any;

    process.on('uncaughtException', (err) => {
        const req = sendExtsync('error', [err.stack]);
        req.finally(function () {
            process.exit(1);
        });
    });
}

export function stop(): void {
    Object.assign(console, defaultConsole);
}
