class Config {
    debug: boolean = false;
    verbose: boolean = false;
}

let _config = new Config();

export interface IConfig {
    verbose?: boolean;
    debug?: boolean;
}

export function config(param: IConfig = {}): Config {
    if (param.debug !== undefined) {
        _config.debug = param.debug;
    }
    if (param.verbose !== undefined) {
        _config.verbose = param.verbose;
    }
    return _config;
}
