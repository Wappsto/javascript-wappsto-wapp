import axios, { AxiosError, AxiosResponse } from 'axios';
import { baseUrl, session } from '../session';
import { _config } from '../util/config';
import { fatalError, printDebug, printError, printRequest } from './debug';
import { isBrowser, toSafeString } from './helpers';
import { VERSION } from './version';
import { JSONObject, JSONValue } from './interfaces';

type Methods = 'head' | 'options' | 'put' | 'post' | 'patch' | 'delete' | 'get';

const HEADERS: Record<string, string> = {
    'X-Session': session,
    'Content-Type': 'application/json',
};

if (!isBrowser()) {
    HEADERS['User-Agent'] = `Wappsto-wapp/${VERSION} (axios/${axios.VERSION})`;
}

const axiosInstance = axios.create({
    baseURL: baseUrl,
    headers: HEADERS,
    timeout: 5 * 60 * 1000,
});

async function wrap(
    func: Methods,
    url: string,
    data?: JSONValue,
    config?: JSONObject
) {
    try {
        let response: AxiosResponse;
        if (config === undefined) {
            response = await axiosInstance[func](url, data);
        } else {
            response = await axiosInstance[func](url, data, config);
        }

        printRequest(func, url, config, data, response?.data);

        return response;
    } catch (error: unknown) {
        /* istanbul ignore next */
        if (error instanceof Error) {
            if (axios.isAxiosError(error)) {
                if (error.response === undefined) {
                    fatalError(error.message);
                }
            }
        }
        throw error;
    }
}

const wrapper = {
    get: async (url: string, config?: JSONValue) => {
        return wrap('get', url, config);
    },
    post: async (url: string, data?: JSONValue, config?: JSONObject) => {
        return wrap('post', url, data, config);
    },
    patch: async (url: string, data?: JSONValue, config?: JSONObject) => {
        return wrap('patch', url, data, config);
    },
    put: async (url: string, data?: JSONValue, config?: JSONObject) => {
        return wrap('put', url, data, config);
    },
    delete: async (url: string, config?: JSONObject) => {
        return wrap('delete', url, config);
    },
};

export default wrapper;

export function getErrorResponse(error: AxiosError | unknown) {
    if (!error) {
        return;
    }
    /* istanbul ignore next */
    if (axios.isAxiosError(error)) {
        return error?.response?.data;
    } else if (
        typeof error === 'object' &&
        'isAxiosError' in error &&
        error.isAxiosError === true
    ) {
        return (error as AxiosError).response?.data;
    } else {
        return error;
    }
}

export function getErrorMessage(error: any | Error | AxiosError): string {
    /* istanbul ignore next */
    if ('errno' in error && 'address' in error && error.errno === -111) {
        return `Failed to connect to ${error.address}`;
    }

    if (error instanceof TypeError) {
        return error.toString();
    }

    if (
        axios.isAxiosError(error) ||
        ('response' in error && 'data' in error.response)
    ) {
        const data = error.response.data as {
            code: number;
            data?: JSONObject;
            message?: string;
        };
        if (data.code) {
            switch (data.code) {
                case 507000000:
                    return 'Timeout, waiting for response on extsync request';
                default:
                    /* istanbul ignore next */
                    if (_config.debug) {
                        printError(
                            `Failed Request: ${error.request?.method} ${
                                error.request?.path
                            } ${toSafeString(
                                error.config?.data
                            )} => ${toSafeString(data)}`
                        );
                    }
                    return `${data.message} (${toSafeString(data.data)})`;
            }
        }

        return `${error.response.statusText} for ${error.config?.url}`;
    }

    printDebug(toSafeString(error));
    return `Unknown error: ${toSafeString(error)}`;
}

export function printHttpError(
    message: string,
    error: unknown | AxiosError
): string {
    const msg = getErrorMessage(error);
    printError(`${message}: ${msg}`);

    if ((error as AxiosError).status === 503) {
        fatalError('Got a SERVICE UNAVAILABLE response from the backend');
    }

    return msg;
}
