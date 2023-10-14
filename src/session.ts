import { isBrowser } from './util/helpers';

/**
 * Reads a cookie with the giving name.
 *
 * @param name The name of the cookie to read
 *
 * @return The content of the cookie if found, else null
 */
function readCookie(name: string): string {
    const nameEQ = `${name}=`;
    const ca = window.document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        c = c.trim();
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return '';
}

/**
 * Get the key from the sessionStorage ot cookie.
 *
 * @param key The key to find
 *
 * @returns The value of the key or empty string.
 */
function get(key: string) {
    if (isBrowser()) {
        return window.sessionStorage.getItem(key) || readCookie(key) || '';
    } else {
        return process.env[key] || '';
    }
}

export const baseUrl: string = get('baseUrl') || '/services';
export const session: string = get('sessionID');
export const extSyncToken: string = get('tokenID');
