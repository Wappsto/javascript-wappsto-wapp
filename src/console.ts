import wappsto from './util/http_wrapper';

const defaultConsole = Object.assign({}, console);

function sendExtsync(key: string, ...args: any[]): any {
    const time = new Date().toISOString();
    const data = JSON.stringify({
        key,
        args,
        time,
    });

    wappsto
        .post('/2.0/extsync/wappsto/editor/console', data)
        .catch(function () {});
}

export function startLogging(): void {
    let newFunc = function (name: string) {
        return function (...args: any[]) {
            sendExtsync(name, arguments);
            defaultConsole.log(...args);
        };
    };
    console.log = newFunc('log');
    console.info = newFunc('info');
    console.error = newFunc('error');
    console.warn = newFunc('warn');

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
