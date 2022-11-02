import { Model } from './models/model';
import { IgnoreError, Stream } from './models/stream';
import { printDebug } from './util/debug';
import { RequestHandler } from './util/interfaces';
import { isBrowser } from './util/helpers';

const openStream: Stream = new Stream();

export { openStream };

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

const request_handlers: Record<string, RequestHandler> = {};

async function _handleRequest(event: any) {
    let data: any = {};
    try {
        data = JSON.parse(event);
    } catch (e) {
        /* istanbul ignore next */
        printDebug('Failed to parse event - Foreground/Background handler');
        /* istanbul ignore next */
        return;
    }

    if (request_handlers[data.type]) {
        return await request_handlers[data.type](data.message);
    } else {
        throw new IgnoreError('Wrong request handler');
    }
}

function handleRequest(type: string, callback: RequestHandler): void {
    if (Object.keys(request_handlers).length === 0) {
        openStream.onRequest(_handleRequest, true);
    }
    request_handlers[type] = callback;
}

export function fromForeground(callback: RequestHandler): void {
    Model.validateMethod('Stream', 'fromForeground', arguments);
    handleRequest('foreground', callback);
}

export function fromBackground(callback: RequestHandler): void {
    Model.validateMethod('Stream', 'fromForeground', arguments);
    handleRequest('background', callback);
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

let backgroudIsStarted = false;

function handleIsBackgroundStarted(message: any): void {
    if (request_handlers['foreground']) {
        openStream.sendEvent('backgroudIsStarted', '');
    }
}

function handleBackgroundIsStarted(message: any): void {
    backgroudIsStarted = true;
}

export async function waitForBackground(timeout = 10): Promise<boolean> {
    Model.validateMethod('Stream', 'waitForBackground', arguments);
    if (backgroudIsStarted) {
        return true;
    }
    openStream.subscribeInternal(
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
