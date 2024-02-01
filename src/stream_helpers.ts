import { Model } from './models/model';
import { IgnoreError, Stream } from './models/stream';
import { printDebug } from './util/debug';
import { isBrowser } from './util/helpers';
import { RequestHandler } from './util/interfaces';

const openStream: Stream = new Stream();
let request_handlers: Record<string, RequestHandler> = {};
let backgroundIsStarted = false;
let startBackgroundTimer: ReturnType<typeof setTimeout>;

export { openStream, startBackgroundTimer };

export function streamHelperReset() {
    backgroundIsStarted = false;
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
    if (typeof event === 'string') {
        try {
            data = JSON.parse(event);
        } catch (e) {
            /* istanbul ignore next */
            printDebug('Failed to parse event - Foreground/Background handler');
            /* istanbul ignore next */
            return false;
        }
    } else {
        data = event;
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
    const allProms = [];
    request_handlers[type] = callback;
    if (Object.keys(request_handlers).length === 1) {
        allProms.push(openStream.onRequest(_handleRequest, true));
    }
    allProms.push(openStream.subscribeInternal(type, _handleRequest));
    const allRes = await Promise.all(allProms);
    res = allRes[0];
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

export function onWebHook(handler: RequestHandler): Promise<boolean> {
    Model.validateMethod('Stream', 'onWebHook', arguments);
    return openStream.onRequest(handler, false);
}

export function cancelOnWebHook(handler: RequestHandler): Promise<boolean> {
    Model.validateMethod('Stream', 'onWebHook', arguments);
    return openStream.cancelRequest(handler, false);
}

async function cancelFrom(type: string): Promise<boolean> {
    if (request_handlers[type]) {
        delete request_handlers[type];
        if (Object.keys(request_handlers).length === 0) {
            return openStream.cancelRequest(_handleRequest, true);
        }
    }
    return true;
}

export function cancelFromBackground(): Promise<boolean> {
    return cancelFrom('background');
}

export function cancelFromForeground(): Promise<boolean> {
    return cancelFrom('foreground');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleIsBackgroundStarted(_message: any): undefined {
    if (request_handlers['foreground']) {
        openStream.sendEvent('backgroundIsStarted', '');
    }
    return;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleBackgroundIsStarted(_message: any): undefined {
    backgroundIsStarted = true;
    return;
}

export async function waitForBackground(timeout = 10): Promise<boolean> {
    Model.validateMethod('Stream', 'waitForBackground', arguments);
    if (backgroundIsStarted) {
        return true;
    }
    await openStream.subscribeInternal(
        'backgroundIsStarted',
        handleBackgroundIsStarted
    );
    let count = timeout;
    do {
        await openStream.sendEvent('isBackgroundStarted', '');
        let waits = 10;
        while (!backgroundIsStarted && waits) {
            await new Promise((r) => setTimeout(r, 100));
            waits -= 1;
        }
        count -= 1;
    } while (count !== 0 && !backgroundIsStarted);

    return !!count;
}

if (!isBrowser()) {
    startBackgroundTimer = setTimeout(() => {
        openStream.subscribeInternal(
            'isBackgroundStarted',
            handleIsBackgroundStarted
        );
    }, 0);
}
