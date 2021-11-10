import { Network } from './models/network';
import { User } from './models/user';
import { start, stop } from './console';
import settings from './settings';

export function network() {
    return Network;
}

export function user() {
    return User;
}

export function startLogging(): void {
    start();
}

export function stopLogging(): void {
    stop();
}

export function verbose(mode: boolean): void {
    settings.verbose = mode;
}

export function debug(mode: boolean): void {
    settings.debug = mode;
}
