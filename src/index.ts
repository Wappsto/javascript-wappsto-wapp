import 'reflect-metadata';
import { setupModelStore } from './util/modelStore.setup';

Error.stackTraceLimit = Infinity;

setupModelStore();

export { config } from './util/config';
export { ValueTemplate } from './util/value_template';
export { startLogging, stopLogging } from './console';
export * from './models';
export { wappStorage, WappStorageType } from './wapp_storage';
export { default as request } from './util/http_wrapper';
export { extSyncToken, session } from './session';
export {
    sendToForeground,
    sendToBackground,
    fromBackground,
    fromForeground,
    cancelFromForeground,
    cancelFromBackground,
    onWebHook,
    cancelOnWebHook,
    signalForeground,
    signalBackground,
    waitForBackground,
} from './stream_helpers';
export { getPowerPriceList } from './util/analytics_helpers';
export * from './util/interfaces';
export { VERSION } from './util/version';
