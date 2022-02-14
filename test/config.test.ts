import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { config, Value } from '../src/index';
import { printDebug, printWarning, printError } from '../src/util/debug';
import { IConfig } from '../src/util/interfaces';
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

describe('config', () => {
    beforeEach(() => {
        mockedAxios.post.mockResolvedValue({});
    });

    it('can enable debug', () => {
        printDebug('test 1');
        config({ debug: true });
        printDebug('test 2');

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith('WAPPSTO DEBUG: test 2');
    });

    it('can change validation mode', () => {
        config({ validation: 'strict' });

        const wrong = { wrong: 'test' } as IConfig;
        let error = undefined;
        try {
            config(wrong);
            expect(true).toBe(false);
        } catch (e: any) {
            error = e.message;
        }

        const v = new Value();
        v.onControl((v, t) => {
            console.log('control');
        });

        expect(error).toBe(
            'value.param is not a IConfig; value.param.wrong is extraneous'
        );
    });

    it('can print warnings and error', () => {
        printWarning('warning');
        printError('error');

        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith('WAPPSTO WARN: warning');

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith('WAPPSTO ERROR: error');
    });

    it('can change the stream reconnect count', () => {
        const c = config({ reconnectCount: 5 });
        expect(c.reconnectCount).toEqual(5);
    });
});
