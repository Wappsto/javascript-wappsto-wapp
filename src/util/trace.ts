import wappsto from './http_wrapper';
import { isBrowser } from './helpers';
import { printError } from './debug';

const url = 'https://tracer.iot.seluxit.com/trace';
let traceId = '';
let parentId = '';
let name = '';

export function getTraceId(): string {
    return traceId;
}

export function clearTrace(status: string): void {
    if (parentId !== '') {
        _trace(parentId, status);
    }

    traceId = '';
    name = '';
    parentId = '';
}

function _trace(parent: string, status: string): void {
    const params: Record<string, any> = {
        parent: parent,
        name: name,
        id: traceId,
        status: status,
    };

    if (!isBrowser()) {
        /* istanbul ignore next */
        params['user'] = process.env['USER'] || process.env['USERNAME'];
        params['installation'] = process.env['installationID'] || 'local';
        params['development'] = process.env['development'] || 'true';
    }

    wappsto
        .get(url, {
            params: params,
        })
        .catch(() => {
            printError('Failed to send trace');
        });
}

export function trace(parent: string): void {
    parentId = parent;

    traceId = `WAPP_${Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')}`;

    name = 'STREAM ';
    /* istanbul ignore next */
    if (isBrowser()) {
        /* istanbul ignore next */
        name += 'Foreground ';
    } else {
        name += 'Background ';
    }
    name += 'Wapp';

    _trace(parent, 'pending');
}
