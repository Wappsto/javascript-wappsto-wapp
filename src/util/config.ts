import { createCheckers } from 'ts-interface-checker';
import interfaceTI from '../util/interfaces-ti';
import { IConfig, ValidationType } from './interfaces';

class Config implements IConfig {
    debug = false;
    requests = false;
    verbose = false;
    stream = false;
    validation: ValidationType = 'normal';
    reconnectCount = 10;
    ackTimeout = 5;
    watchdogTimeout = 5;
    jitterMin = 0;
    jitterMax = 10;
}

const _checker = createCheckers(interfaceTI);
const _config = new Config();

export { _config };

export function config(param: IConfig): Config {
    const m = _checker.IConfigFunc.methodArgs('config');
    if (_config.validation === 'normal') {
        m.check(Array.from(arguments));
    }

    if (param.debug !== undefined) {
        _config.debug = param.debug;
    }
    if (param.requests !== undefined) {
        _config.requests = param.requests;
    }
    if (param.stream !== undefined) {
        _config.stream = param.stream;
    }
    if (param.verbose !== undefined) {
        _config.verbose = param.verbose;
    }
    if (param.validation !== undefined) {
        _config.validation = param.validation;
    }
    if (param.reconnectCount !== undefined) {
        _config.reconnectCount = param.reconnectCount;
    }
    if (param.ackTimeout !== undefined) {
        _config.ackTimeout = param.ackTimeout;
    }
    if (param.watchdogTimeout !== undefined) {
        _config.watchdogTimeout = param.watchdogTimeout;
    }
    if (param.jitterMin !== undefined) {
        _config.jitterMin = param.jitterMin;
    }
    if (param.jitterMax !== undefined) {
        _config.jitterMax = param.jitterMax;
    }

    return _config;
}
