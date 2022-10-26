import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { config, Value, request } from '../src/index';
import {
    printDebug,
    printWarning,
    printError,
    printRequest,
} from '../src/util/debug';
import { IModel } from '../src/util/interfaces';
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

describe('config', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('can enable debug', () => {
        mockedAxios.post.mockResolvedValueOnce({ data: 'test' });

        printDebug('test 1');
        config({ debug: true });
        printDebug('test 2');

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith('WAPPSTO DEBUG: test 2');
    });

    it('can enable requests', async () => {
        mockedAxios.post.mockResolvedValueOnce({});

        config({ requests: true });
        const data = { key: 'test', data: {} };
        data.data = data;
        await request.post('test', data, { config: 'test' });

        printRequest('post', '/2.1/extsync/wappsto/editor/console', {}, {});
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith(
            'WAPPSTO REQUEST: post test {"config":"test"} {"key":"test","data":"CREF"} => test'
        );
    });

    it('can change validation mode', () => {
        const wrong = { wrong: 'test' } as unknown as IModel;
        let error1 = undefined;
        let error2 = undefined;
        const v = new Value();

        try {
            v.setParent(wrong);
            expect(true).toBe(false);
        } catch (e: any) {
            error1 = e.message;
        }

        config({ validation: 'none' });

        try {
            v.setParent(wrong);
        } catch (e: any) {
            error2 = e.message;
        }

        expect(error1).toEqual(
            `Model.setParent: parent is not a IModel\n    parent.meta is missing\n    parent.id is missing\n    parent.getType is missing`
        );
        expect(error2).toBe(undefined);
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
