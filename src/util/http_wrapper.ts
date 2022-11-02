import axios from 'axios';
import { session, baseUrl } from '../session';
import { printError, printDebug, printRequest } from './debug';
import { toString } from './helpers';
import { _config } from '../util/config';

type Methods = 'head' | 'options' | 'put' | 'post' | 'patch' | 'delete' | 'get';

const axiosInstance = axios.create({
    baseURL: baseUrl,
    headers: {
        'X-Session': session,
        'Content-Type': 'application/json',
    },
});

async function wrap(func: Methods, url: string, data?: any, config?: any) {
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
    get: async (url: string, config?: any): Promise<any> => {
        return wrap('get', url, config);
    },
    post: async (url: string, data?: any, config?: any): Promise<any> => {
        return wrap('post', url, data, config);
    },
    patch: async (url: string, data?: any, config?: any): Promise<any> => {
        return wrap('patch', url, data, config);
    },
    put: async (url: string, data?: any, config?: any): Promise<any> => {
        return wrap('put', url, data, config);
    },
    delete: async (url: string, config?: any): Promise<any> => {
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

export function getErrorMessage(error: any): string {
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
                    /* istanbul ignore next */
                    if (_config.debug) {
                        printError(
                            `Failed Request: ${error.request?.method} ${
                                error.request?.path
                            } ${toString(error.config?.data)} => ${toString(
                                error.response.data
                            )}`
                        );
                    }
                    return `${error.response.data.message} (${toString(
                        error.response.data.data
                    )})`;
            }
        } else {
            return `${error.response.statusText} for ${error.config?.url}`;
        }
    }

    if (error instanceof TypeError) {
        return error.toString();
    }

    printDebug(toString(error));
    return `Unknown HTTP error: ${error.errno} (${error.code})`;
}

export function printHttpError(message: string, error: any): string {
    const msg = getErrorMessage(error);
    printError(`${message}: ${msg}`);
    return msg;
}
