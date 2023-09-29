import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
console.log = jest.fn();
console.error = jest.fn();
import { startLogging, stopLogging } from '../src/index';

describe('console', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('has startLogging as a warning', () => {
        console.warn = jest.fn();
        startLogging();
        expect(console.warn).toHaveBeenCalledWith(
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
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({});
        startLogging();
        console.log('test start');
        console.info('test start');
        console.error('test start');
        console.warn('test start');

        await new Promise((r) => setTimeout(r, 1));
        expect(mockedAxios.post).toHaveBeenCalledTimes(4);
    });

    it('will not stop sending messages to wappsto when there is an unknown error', async () => {
        mockedAxios.post
            .mockRejectedValueOnce({
                response: { data: { code: 1234 } },
            })
            .mockRejectedValueOnce({});
        console.log('test 1');

        await new Promise((r) => setTimeout(r, 1));

        console.log('test 2');

        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('will stop sending messages to wappsto when there is an session error', async () => {
        mockedAxios.post.mockRejectedValueOnce({
            response: { data: { code: 117000000 } },
        });
        console.log('test 1');

        await new Promise((r) => setTimeout(r, 1));

        console.log('test 2');

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
});
