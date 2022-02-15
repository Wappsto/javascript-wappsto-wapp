import { Model } from './models/model';
import { Stream } from './models/stream';
import { printDebug } from './util/debug';
import { RequestHandler } from './util/interfaces';

const openStream: Stream = new Stream();

export { openStream };

async function sendRequest(type: string, msg: any): Promise<any> {
    const data = {
        type: type,
        message: msg,
    };
    return await openStream.sendRequest(data);
}

export async function sendToForeground(msg: any): Promise<any> {
    return sendRequest('background', msg);
}

export async function sendToBackground(msg: any): Promise<any> {
    return sendRequest('foreground', msg);
}

const request_handlers: Record<string, RequestHandler> = {};

async function _handleRequest(event: any) {
    try {
        const data = JSON.parse(event);
        if (request_handlers[data.type]) {
            return request_handlers[data.type](data.message);
        }
    } catch (e) {
        /* istanbul ignore next */
        printDebug('Failed to parse event - Foreground/Background handler');
    }
    /* istanbul ignore next */
    return undefined;
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
