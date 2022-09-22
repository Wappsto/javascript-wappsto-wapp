import axios from 'axios';
import { session, baseUrl } from '../session';
import { printError, printDebug } from './debug';

const axiosInstance = axios.create({
    baseURL: baseUrl,
    headers: {
        'X-Session': session,
        'Content-Type': 'application/json',
    },
});

type AxiosFun = (url: string, data?: any, config?: any) => Promise<any>;
async function wrap(func: AxiosFun, url: string, data?: any, config?: any) {
    try {
        if (config === undefined) {
            return await func(url, data);
        } else {
            return await func(url, data, config);
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            /* istanbul ignore next */
            if (axios.isAxiosError(error)) {
                /* istanbul ignore next */
                if (error.response === undefined) {
                    /* istanbul ignore next */
                    process.stderr.write(
                        `WAPPSTO FATAL ERROR: ${error.message}\n`
                    );
                    /* istanbul ignore next */
                    process.exit(11);
                }
            }
        }
        throw error;
    }
}

const wrapper = {
    get: async (url: string, config?: any): Promise<any> => {
        return await wrap(axiosInstance.get, url, config);
    },
    post: async (url: string, data?: any, config?: any): Promise<any> => {
        return await wrap(axiosInstance.post, url, data, config);
    },
    patch: async (url: string, data?: any, config?: any): Promise<any> => {
        return await wrap(axiosInstance.patch, url, data, config);
    },
    put: async (url: string, data?: any, config?: any): Promise<any> => {
        return await wrap(axiosInstance.put, url, data, config);
    },
    delete: async (url: string, config?: any): Promise<any> => {
        return await wrap(axiosInstance.delete, url, config);
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
