class Settings {
    debug: boolean = false;
    verbose: boolean = false;
}

let settings = new Settings();

export default settings;

export function verbose(mode: boolean): void {
    settings.verbose = mode;
}

export function debug(mode: boolean): void {
    settings.debug = mode;
}
