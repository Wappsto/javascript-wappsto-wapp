import 'reflect-metadata';
import { setupModelStore } from './util/modelStore.setup';

Error.stackTraceLimit = Infinity;

setupModelStore();

export { startLogging, stopLogging } from './console';
export * from './models';
export { extSyncToken, session } from './session';
export {
    cancelFromBackground,
    cancelFromForeground,
    cancelOnWebHook,
    fromBackground,
    fromForeground,
    onWebHook,
    sendToBackground,
    sendToForeground,
    signalBackground,
    signalForeground,
    waitForBackground,
    onPermissionUpdate,
    cancelPermissionUpdate,
} from './stream_helpers';
export { getPowerPriceList } from './util/analytics_helpers';
export { config } from './util/config';
export { default as request } from './util/http_wrapper';
export * from './util/types';
export { ValueTemplate } from './util/value_template';
export { VERSION } from './util/version';
export { wappStorage, WappStorage } from './wapp_storage';
export { default as getWappVersion } from './util/wappVersion';
