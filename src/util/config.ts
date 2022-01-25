import { IConfig } from './interfaces';
import interfaceTI from '../util/interfaces-ti';
import { createCheckers } from 'ts-interface-checker';

class Config implements IConfig {
    debug: boolean = false;
    verbose: boolean = false;
    validation: 'none' | 'normal' | 'strict' = 'normal';
    reconnectCount: number = 10;
}

let _checker = createCheckers(interfaceTI);
let _config = new Config();

export { _config };

export function config(param: IConfig): Config {
    let m = _checker.IConfigFunc.methodArgs('config');
    if (_config.validation === 'strict') {
        m.strictCheck(Array.from(arguments));
    } else {
        m.check(Array.from(arguments));
    }

    if (param.debug !== undefined) {
        _config.debug = param.debug;
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
    return _config;
}
