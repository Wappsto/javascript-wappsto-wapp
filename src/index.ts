import { Network } from './models/network';
import { start, stop } from './console';

export function network() {
    return Network;
}

export function startLogging() {
    start();
}

export function stopLogging() {
    stop();
}
