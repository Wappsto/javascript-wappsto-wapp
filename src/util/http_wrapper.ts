import axios, { AxiosError } from 'axios';
import { session, baseUrl } from '../session';
import { printError, printDebug, printRequest } from './debug';
import { toString, isBrowser } from './helpers';
import { _config } from '../util/config';
import { VERSION } from './version';

type Methods = 'head' | 'options' | 'put' | 'post' | 'patch' | 'delete' | 'get';

let HEADERS: any = {
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
    data?: Record<string, any> | string,
    config?: Record<string, any>
) {
    try {
        let response;
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
                    process.stderr.write(
                        `WAPPSTO FATAL ERROR: ${error.message}\n`
                    );
                    process.exit(11);
                }
            }
        }
        throw error;
    }
}

const wrapper = {
    get: async (
        url: string,
        config?: Record<string, any>
    ): Promise<Record<string, any>> => {
        return wrap('get', url, config);
    },
    post: async (
        url: string,
        data?: Record<string, any> | string,
        config?: Record<string, any>
    ): Promise<Record<string, any>> => {
        return wrap('post', url, data, config);
    },
    patch: async (
        url: string,
        data?: Record<string, any> | string,
        config?: Record<string, any>
    ): Promise<Record<string, any>> => {
        return wrap('patch', url, data, config);
    },
    put: async (
        url: string,
        data?: Record<string, any> | string,
        config?: Record<string, any>
    ): Promise<Record<string, any>> => {
        return wrap('put', url, data, config);
    },
    delete: async (
        url: string,
        config?: Record<string, any>
    ): Promise<Record<string, any>> => {
        return wrap('delete', url, config);
    },
};

export default wrapper;

export function getErrorResponse(error: any): any {
    /* istanbul ignore next */
    if (axios.isAxiosError(error)) {
        return error?.response?.data;
    } else {
        return error;
    }
}

export function getErrorMessage(error: any | Error | AxiosError): string {
    /* istanbul ignore next */
    if (error.errno && error.errno === -111) {
        return `Failed to connect to ${error.address}`;
    }

    if (error instanceof TypeError) {
        return error.toString();
    }

    if (axios.isAxiosError(error) || (error.response && error.response.data)) {
        const data = error.response.data as {
            code: number;
            data?: Record<string, any>;
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
                            } ${toString(error.config?.data)} => ${toString(
                                data
                            )}`
                        );
                    }
                    return `${data.message} (${toString(data.data)})`;
            }
        }

        return `${error.response.statusText} for ${error.config?.url}`;
    }

    printDebug(toString(error));
    return `Unknown error: ${toString(error)}`;
}

export function printHttpError(message: string, error: any): string {
    const msg = getErrorMessage(error);
    printError(`${message}: ${msg}`);
    return msg;
}
