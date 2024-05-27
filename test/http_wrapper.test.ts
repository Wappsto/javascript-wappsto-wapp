import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { request, stopLogging } from '../src/index';
import { after } from './util/stream';
import { makeErrorResponse, makeResponse } from './util/helpers';

describe('http_wrapper', () => {
    beforeAll(() => {
        stopLogging();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        after();
    });

    it('can call GET', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse('test'));

        const res = await request.get('/network');

        expect(res.data).toEqual('test');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/network',
            undefined
        );
    });

    it('can call POST', async () => {
        mockedAxios.post.mockResolvedValueOnce(makeResponse('test'));

        const res = await request.post('/network', 'data');

        expect(res.data).toEqual('test');
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(1, '/network', 'data');
    });

    it('can call PATCH', async () => {
        mockedAxios.put.mockResolvedValueOnce(makeResponse('test'));

        const res = await request.put('/network', 'data');

        expect(res.data).toEqual('test');
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(1, '/network', 'data');
    });

    it('can call PUT', async () => {
        mockedAxios.put.mockResolvedValueOnce(makeResponse('test'));

        const res = await request.put('/network', 'data');

        expect(res.data).toEqual('test');
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(1, '/network', 'data');
    });

    it('can call DELETE', async () => {
        mockedAxios.delete.mockResolvedValueOnce(makeResponse('test'));

        const res = await request.delete('/network');

        expect(res.data).toEqual('test');
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenNthCalledWith(
            1,
            '/network',
            undefined
        );
    });

    it('can report an error', async () => {
        mockedAxios.get.mockRejectedValueOnce(makeErrorResponse('test'));

        let err;
        try {
            await request.get('/network');
        } catch (e) {
            err = e;
        }

        expect(err).toEqual({
            config: {
                url: 'JEST URL',
            },
            isAxiosError: true,
            response: {
                data: 'test',
                statusText: 'HTTP JEST ERROR',
                config: {},
                headers: {},
                request: {},
                status: 500,
            },
        });
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/network',
            undefined
        );
    });
});
