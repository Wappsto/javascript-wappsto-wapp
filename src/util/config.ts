import { IConfig } from './interfaces';
import interfaceTI from '../util/interfaces-ti';
import { createCheckers } from 'ts-interface-checker';

class Config {
    debug: boolean = false;
    verbose: boolean = false;
}

let _config = new Config();

export function config(param: IConfig = {}): Config {
    const checker = createCheckers(interfaceTI);
    checker.IConfig.check(param);

    if (param.debug !== undefined) {
        _config.debug = param.debug;
    }
    if (param.verbose !== undefined) {
        _config.verbose = param.verbose;
    }
    return _config;
}
