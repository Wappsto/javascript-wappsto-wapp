import 'reflect-metadata';
import settings from './util/settings';

export * from './console';
export * from './models';
export { default as request } from './util/http_wrapper';

export function verbose(mode: boolean): void {
    settings.verbose = mode;
}

export function debug(mode: boolean): void {
    settings.debug = mode;
}
