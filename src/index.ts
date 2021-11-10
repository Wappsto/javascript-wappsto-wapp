import { start, stop } from './console';
import settings from './settings';

export * from './models';

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
