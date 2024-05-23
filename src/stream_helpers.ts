import { Notification } from './models';
import { Model } from './models/model';
import { IgnoreError, Stream } from './models/stream';
import { printDebug } from './util/debug';
import { isBrowser } from './util/helpers';
import {
    JSONValue,
    RequestHandler,
    RequestType,
    StreamData,
    WappRequestHandler,
} from './util/types';

const openStream: Stream = new Stream();
let request_handlers: Record<string, RequestHandler> = {};
let backgroundIsStarted = false;
let startBackgroundTimer: ReturnType<typeof setTimeout> | undefined;
let permissionUpdateCallback: undefined | (() => void);

export function streamHelperReset() {
    backgroundIsStarted = false;
    request_handlers = {};
}

async function sendRequest(type: string, msg: JSONValue) {
    const data = {
        type: type,
        message: msg,
    } as RequestType;
    return openStream.sendRequest(data);
}

/**
 * Sends a message to the foreground.
 *
 * @param msg - The message to be sent.
 * @return A promise that resolves with the response from the foreground.
 */
export async function sendToForeground<T = JSONValue, R = JSONValue>(msg: T) {
    return sendRequest('background', msg as JSONValue) as Promise<R>;
}

/**
 * Sends a message to the background.
 *
 * @param msg - The message to be sent.
 * @return A promise that resolves with the response from the background.
 */
export async function sendToBackground<T = JSONValue, R = JSONValue>(msg: T) {
    return sendRequest('foreground', msg as JSONValue) as Promise<R>;
}

/**
 * Signals the foreground with a message.
 *
 * @param msg - The message to be sent.
 * @return A promise that resolves when the signal is sent.
 */
export async function signalForeground<T = JSONValue>(msg: T) {
    await openStream.sendEvent('background', msg as JSONValue);
}

/**
 * Sends a signal to the background with a message.
 *
 * @param msg - The message to be sent.
 * @return A promise that resolves when the signal is sent.
 */
export async function signalBackground<T = JSONValue>(msg: T) {
    await openStream.sendEvent('foreground', msg as JSONValue);
}

async function _handleRequest(event: JSONValue): Promise<JSONValue> {
    let res: JSONValue = true;
    let data: RequestType;
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
        data = event as RequestType;
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

/**
 * Register a callback function that handles requests from the foreground.
 *
 * @param callback - The callback function for handling the request.
 * @return A Promise that resolves to true if the request was handled successfully, and false otherwise.
 */
export function fromForeground<T = unknown>(
    callback: WappRequestHandler<T>
): Promise<boolean> {
    Model.validateMethod('Stream', 'fromForeground', arguments);
    return handleRequest('foreground', callback as RequestHandler);
}

/**
 * Register a callback function that handles requests from the background.
 *
 * @param callback - The callback function for handling the request.
 * @return A Promise that resolves to true if the request was handled successfully, and false otherwise.
 */
export function fromBackground<T = unknown>(
    callback: WappRequestHandler<T>
): Promise<boolean> {
    Model.validateMethod('Stream', 'fromForeground', arguments);
    return handleRequest('background', callback as RequestHandler);
}

/**
 * Register a callback function that handles requests from the web hook.
 *
 * @param handler - The request handler function.
 * @return A promise that resolves to a boolean value indicating the success of the operation.
 */
export function onWebHook(handler: RequestHandler): Promise<boolean> {
    Model.validateMethod('Stream', 'onWebHook', arguments);
    return openStream.onRequest(handler, false);
}

/**
 * Removed the callback function that handles requests from the web hook.
 *
 * @param handler - The handler for the request.
 * @return A Promise that resolves to true if the request was cancelled successfully, and false otherwise.
 */
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

/**
 * Removes the callback function that handles requests from the background.
 *
 * @return A Promise that resolves to true if the request was successfully cancelled, and false otherwise.
 */
export function cancelFromBackground(): Promise<boolean> {
    return cancelFrom('background');
}

/**
 * Removes the callback function that handles requests from the foreground.
 *
 * @return A promise that resolves to true if the request was cancelled successfully, and false otherwise.
 */
export function cancelFromForeground(): Promise<boolean> {
    return cancelFrom('foreground');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleIsBackgroundStarted(_message: unknown): undefined {
    if (request_handlers['foreground']) {
        openStream.sendEvent('backgroundIsStarted', '');
    }
    return;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleBackgroundIsStarted(_message: unknown): undefined {
    backgroundIsStarted = true;
    return;
}

/**
 * Waits for the background to start within a given timeout period.
 *
 * @param timeout The maximum time to wait for the background to start, in seconds.
 * @return A promise that resolves to true if the background has started within the timeout period, and false otherwise.
 */
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

function handlePermissionUpdate(data: StreamData) {
    const d = data as Notification;
    if (
        permissionUpdateCallback &&
        d.base?.code &&
        (d.base.code === 1100003 || d.base.code === 1100004)
    ) {
        permissionUpdateCallback();
    }
    return undefined;
}

/**
 * Sets a callback function to be called when a permission update occurs.
 *
 * @param callback - The callback function to be called when a permission update occurs.
 */
export function onPermissionUpdate(callback: () => void) {
    if (!permissionUpdateCallback) {
        openStream.subscribeService('/notification', handlePermissionUpdate);
    }
    permissionUpdateCallback = callback;
}

/**
 * Cancels the permission update callback.
 */
export function cancelPermissionUpdate() {
    if (permissionUpdateCallback !== undefined) {
        openStream.subscribeService('/notification', handlePermissionUpdate);
    }
    permissionUpdateCallback = undefined;
}

if (!isBrowser()) {
    startBackgroundTimer = setTimeout(() => {
        openStream.subscribeInternal(
            'isBackgroundStarted',
            handleIsBackgroundStarted
        );
        startBackgroundTimer = undefined;
    }, 1);
    // Make sure that the setTimeout is not removed with Tree-Shaking
    (startBackgroundTimer as any).debug = true;
}

export { openStream, startBackgroundTimer };
