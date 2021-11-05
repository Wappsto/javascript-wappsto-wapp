//import { isUUID } from './util/uuid';

/**
 * @param {cookie name}
 */
function readCookie(name: string) {
    const nameEQ = name + '=';
    const ca = window.document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
}

/**
 * @param {the key to }
 */
function get(key: string) {
    let result = null;
    if (typeof window !== 'undefined') {
        window.sessionStorage.getItem(key);
        if (!result) {
            result = readCookie(key);
        }
    }

    if (!result) {
        result = process.env[key] || null;
    }
    return result;
}

//    tmpBaseUrl = process.env.baseUrl && process.env.baseUrl.slice(0, -1);

export const baseUrl: string = get('baseUrl') || '/services';
export const session: string = get('sessionID') || '';
export const token: string = get('tokenID') || '';
/*
if (!isUUID(session)) {
    console.error("Wappsto: Invalid SESSION - You need to define 'sessionID'");
}
if (!isUUID(token)) {
    console.error("Wappsto: Invalid TOKEN - You need to define 'tokenID'");
}*/
