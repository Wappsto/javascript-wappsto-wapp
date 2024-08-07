import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
console.log = jest.fn();
console.error = jest.fn();
import { startLogging, stopLogging } from '../src/index';
import { delay, makeErrorResponse, makeResponse } from './util/helpers';
import { after } from './util/stream';

describe('console', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        after();
    });

    it('has startLogging as a warning', () => {
        console.warn = jest.fn();
        startLogging();
        expect(console.warn).toHaveBeenNthCalledWith(
            1,
            'WAPPSTO WARN: DEPRECATED - The "startLogging" is not needed to be called any more'
        );
    });

    it('can stop sending to wappsto', () => {
        stopLogging();
        console.log('test start and stop');
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('can send log messages to wappsto', async () => {
        mockedAxios.post
            .mockResolvedValueOnce(makeResponse({}))
            .mockResolvedValueOnce(makeResponse({}))
            .mockResolvedValueOnce(makeResponse({}))
            .mockResolvedValueOnce(makeResponse({}));
        startLogging();
        console.log('test start');
        console.info('test start');
        console.error('test start');
        console.warn('test start');

        await delay();
        expect(mockedAxios.post).toHaveBeenCalledTimes(4);
    });

    it('will not stop sending messages to wappsto when there is an unknown error', async () => {
        mockedAxios.post
            .mockRejectedValueOnce(makeErrorResponse({ code: 1234 }))
            .mockRejectedValueOnce({}); // This must be an invalid error response.
        console.log('test 1');

        await delay();

        console.log('test 2');

        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('will stop sending messages to wappsto when there is an session error', async () => {
        mockedAxios.post.mockRejectedValueOnce(
            makeErrorResponse({ code: 117000000 })
        );
        console.log('test 1');

        await delay();

        console.log('test 2');

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
});
