import { Model } from './models/model';
import { IgnoreError, Stream } from './models/stream';
import { printDebug } from './util/debug';
import { RequestHandler } from './util/interfaces';
import { isBrowser } from './util/helpers';

const openStream: Stream = new Stream();
let request_handlers: Record<string, RequestHandler> = {};
let backgroudIsStarted = false;

export { openStream };

export function streamHelperReset() {
    backgroudIsStarted = false;
    request_handlers = {};
}

async function sendRequest(type: string, msg: any): Promise<any> {
    const data = {
        type: type,
        message: msg,
    };
    return openStream.sendRequest(data);
}

export async function sendToForeground(msg: any): Promise<any> {
    return sendRequest('background', msg);
}

export async function sendToBackground(msg: any): Promise<any> {
    return sendRequest('foreground', msg);
}

export async function signalForeground(msg: any): Promise<void> {
    await openStream.sendEvent('background', msg);
}

export async function signalBackground(msg: any): Promise<void> {
    await openStream.sendEvent('foreground', msg);
}

async function _handleRequest(event: any): Promise<boolean> {
    let res = true;
    let data: any = {};
    try {
        data = JSON.parse(event);
    } catch (e) {
        /* istanbul ignore next */
        printDebug('Failed to parse event - Foreground/Background handler');
        /* istanbul ignore next */
        return false;
    }

    if (request_handlers[data.type]) {
        res = await request_handlers[data.type](data.message);
    } else {
        throw new IgnoreError('Wrong request handler');
    }
    return res;
}

async function handleRequest(
    type: string,
    callback: RequestHandler
): Promise<boolean> {
    let res = true;
    request_handlers[type] = callback;
    if (Object.keys(request_handlers).length === 1) {
        res = await openStream.onRequest(_handleRequest, true);
    }
    return res;
}

export function fromForeground(callback: RequestHandler): Promise<boolean> {
    Model.validateMethod('Stream', 'fromForeground', arguments);
    return handleRequest('foreground', callback);
}

export function fromBackground(callback: RequestHandler): Promise<boolean> {
    Model.validateMethod('Stream', 'fromForeground', arguments);
    return handleRequest('background', callback);
}

export function onWebHook(handler: RequestHandler): void {
    Model.validateMethod('Stream', 'onWebHook', arguments);
    openStream.onRequest(handler, false);
}

export function cancelOnWebHook(handler: RequestHandler): void {
    Model.validateMethod('Stream', 'onWebHook', arguments);
    openStream.cancelRequest(handler, false);
}

function cancelFrom(type: string): void {
    if (request_handlers[type]) {
        delete request_handlers[type];
        if (Object.keys(request_handlers).length === 0) {
            openStream.cancelRequest(_handleRequest, true);
        }
    }
}

export function cancelFromBackground(): void {
    cancelFrom('background');
}

export function cancelFromForeground(): void {
    cancelFrom('foreground');
}

function handleIsBackgroundStarted(message: any): undefined {
    if (request_handlers['foreground']) {
        openStream.sendEvent('backgroudIsStarted', '');
    }
    return;
}

function handleBackgroundIsStarted(message: any): undefined {
    backgroudIsStarted = true;
    return;
}

export async function waitForBackground(timeout = 10): Promise<boolean> {
    Model.validateMethod('Stream', 'waitForBackground', arguments);
    if (backgroudIsStarted) {
        return true;
    }
    await openStream.subscribeInternal(
        'backgroudIsStarted',
        handleBackgroundIsStarted
    );
    let count = timeout;
    do {
        await openStream.sendEvent('isBackgroudStarted', '');
        let waits = 10;
        while (!backgroudIsStarted && waits) {
            await new Promise((r) => setTimeout(r, 100));
            waits -= 1;
        }
        count -= 1;
    } while (count !== 0 && !backgroudIsStarted);

    return !!count;
}

if (!isBrowser()) {
    setTimeout(() => {
        openStream.subscribeInternal(
            'isBackgroudStarted',
            handleIsBackgroundStarted
        );
    }, 0);
}
