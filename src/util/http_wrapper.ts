import axios from 'axios';
import { session, baseUrl } from '../session';
import { printError } from './debug';

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

export function printHttpError(error: any): void {
    if (error.errno && error.errno === -111) {
        printError(`Failed to connect to ${error.address}`);
        return;
    }

    if (error.response) {
        if (error?.response?.data?.code) {
            switch (error.response.data.code) {
                case 400017:
                    printError(`You can't share with yourself`);
                    break;
                default:
                    printError(error.response.data.message);
                    console.log(error.response.data);
                    break;
            }
        } else {
            printError(`${error.response.statusText} for ${error.config.url}`);
        }
        return;
    }

    printError(`Unknown HTTP error: ${error.errno} (${error.code})`);
    console.log(error);
}
