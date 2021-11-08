import { Network } from './models/network';
import { start, stop } from './console';
import { settings } from './settings';

export function network() {
    return Network;
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
