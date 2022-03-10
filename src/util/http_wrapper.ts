import axios from 'axios';
import { session, baseUrl } from '../session';
import { printError, printDebug } from './debug';

export default axios.create({
    baseURL: baseUrl,
    headers: {
        'X-Session': session,
        'Content-Type': 'application/json',
    },
});

export function getErrorResponse(error: any): any {
    /* istanbul ignore next */
    if (axios.isAxiosError(error)) {
        return error?.response?.data;
    } else {
        return error;
    }
}

function getErrorMessage(error: any): string {
    /* istanbul ignore next */
    if (error.errno && error.errno === -111) {
        return `Failed to connect to ${error.address}`;
    }

    if (error.response) {
        if (error.response.data?.code) {
            switch (error.response.data.code) {
                case 507000000:
                    return 'Timeout, waiting for response on extsync request';
                default:
                    printDebug(JSON.stringify(error.response.data));
                    return error.response.data.message;
            }
        } else {
            return `${error.response.statusText} for ${error.config.url}`;
        }
    }

    /* istanbul ignore next */
    if (error instanceof TypeError) {
        return error.toString();
    }

    /* istanbul ignore next */
    printDebug(JSON.stringify(error));
    /* istanbul ignore next */
    return `Unknown HTTP error: ${error.errno} (${error.code})`;
}

export function printHttpError(error: any): string {
    const msg = getErrorMessage(error);
    printError(msg);
    return msg;
}
