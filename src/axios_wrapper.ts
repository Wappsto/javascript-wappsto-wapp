import axios from 'axios';
import { session, baseUrl } from './session';

export default axios.create({
    baseURL: baseUrl,
    headers: {
        'X-Session': session,
        'Content-Type': 'application/json',
    },
});

export function printError(error: any): void {
    if (error.errno && error.errno === -111) {
        console.error(`Wappsto: Failed to connect to ${error.address}`);
        return;
    }

    if (error.response) {
        console.error(
            `Wappsto: ${error.response.statusText} for ${error.config.url}`
        );
        return;
    }

    console.error(
        `Wappsto: Unknown Axios error: ${error.errno} (${error.code})`
    );
    console.error(error);
}
