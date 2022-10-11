import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { request, stopLogging } from '../src/index';

describe('http_wrapper', () => {
    beforeAll(() => {
        stopLogging();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('can call GET', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: 'test',
        });

        const res = await request.get('/network');

        expect(res.data).toEqual('test');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/network', undefined);
    });

    it('can call POST', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: 'test',
        });

        const res = await request.post('/network', 'data');

        expect(res.data).toEqual('test');
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith('/network', 'data');
    });

    it('can call PATCH', async () => {
        mockedAxios.put.mockResolvedValueOnce({
            data: 'test',
        });

        const res = await request.put('/network', 'data');

        expect(res.data).toEqual('test');
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledWith('/network', 'data');
    });

    it('can call PUT', async () => {
        mockedAxios.put.mockResolvedValueOnce({
            data: 'test',
        });

        const res = await request.put('/network', 'data');

        expect(res.data).toEqual('test');
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledWith('/network', 'data');
    });

    it('can call DELETE', async () => {
        mockedAxios.delete.mockResolvedValueOnce({
            data: 'test',
        });

        const res = await request.delete('/network');

        expect(res.data).toEqual('test');
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledWith('/network', undefined);
    });

    it('can report an error', async () => {
        mockedAxios.get.mockRejectedValueOnce({
            data: 'test',
        });

        let err;
        try {
            await request.get('/network');
        } catch (e) {
            err = e;
        }

        expect(err).toEqual({ data: 'test' });
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/network', undefined);
    });
});