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
    if (axios.isAxiosError(error)) {
        return error?.response?.data;
    } else {
        return error;
    }
}

function getErrorMessage(error: any): string {
    if (error.errno && error.errno === -111) {
        return `Failed to connect to ${error.address}`;
    }

    if (error.response) {
        if (error?.response?.data?.code) {
            switch (error.response.data.code) {
                case 400017:
                    return `You can't share with yourself`;
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

    if (error instanceof TypeError) {
        return error.toString();
    }

    printDebug(JSON.stringify(error));
    return `Unknown HTTP error: ${error.errno} (${error.code})`;
}

export function printHttpError(error: any): string {
    let msg = getErrorMessage(error);
    printError(msg);
    return msg;
}
