import wappsto from './util/http_wrapper';

const defaultConsole = Object.assign({}, console);

function sendExtsync(key: string, ...args: any[]): any {
    const time = new Date().toISOString();
    const data = JSON.stringify({
        key,
        args,
        time,
    });

    const req = wappsto
        .post('/2.1/extsync/wappsto/editor/console', data)
        .catch(function () {});
    return req;
}

export function startLogging(): void {
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

export function stopLogging(): void {
    Object.assign(console, defaultConsole);
}
