import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { config, Value, request, IModel } from '../src/index';
import {
    printDebug,
    printWarning,
    printError,
    printRequest,
    printStream,
} from '../src/util/debug';
import { after } from './util/stream';
import { makeResponse } from './util/helpers';
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

describe('config', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        after();
    });

    it('can enable debug', () => {
        mockedAxios.post.mockResolvedValueOnce(makeResponse('test'));

        printDebug('test 1');
        config({ debug: true });
        printDebug('test 2');

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenNthCalledWith(1, 'WAPPSTO DEBUG: test 2');
    });

    it('can enable requests', async () => {
        mockedAxios.post.mockResolvedValueOnce(makeResponse({}));

        config({ requests: true });
        const data = { key: 'test', data: {} };
        data.data = data;
        await request.post('test', data, { config: 'test' });

        printRequest('post', '/2.1/console', {}, {});
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenNthCalledWith(
            1,
            'WAPPSTO REQUEST: post test {"config":"test"} {"key":"test","data":"Circular REF"} => test'
        );
    });

    it('can enable stream', async () => {
        printStream('test 1', { test: 1 }, 1);

        config({ stream: true });

        printStream('test 2', { test: 2 }, 2);

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenNthCalledWith(
            1,
            'WAPPSTO STREAM: test 2',
            { test: 2 },
            2
        );
    });

    it('can change validation mode', () => {
        const wrong = { wrong: 'test' } as unknown as IModel;
        let error1: string | undefined = undefined;
        let error2: string | undefined = undefined;
        const v = new Value();

        try {
            v.setParent(wrong);
            expect(true).toBe(false);
        } catch (e: unknown) {
            error1 = (e as Error).message;
        }

        config({ validation: 'none' });

        try {
            v.setParent(wrong);
        } catch (e: unknown) {
            error2 = (e as Error).message;
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
        expect(console.warn).toHaveBeenNthCalledWith(
            1,
            'WAPPSTO WARN: warning'
        );

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenNthCalledWith(
            1,
            'WAPPSTO ERROR: error'
        );
    });

    it('can change the stream reconnect count', () => {
        const c = config({ reconnectCount: 5 });
        expect(c.reconnectCount).toEqual(5);
    });

    it('can change the stream watchdog timeout', () => {
        const c = config({ watchdogTimeout: 15 });
        expect(c.watchdogTimeout).toEqual(15);
    });

    it('can change the wapp storage secret feature', () => {
        let c = config({});
        expect(c.wappStorageSecret).toEqual(true);
        c = config({ wappStorageSecret: false });
        expect(c.wappStorageSecret).toEqual(false);
    });
});
