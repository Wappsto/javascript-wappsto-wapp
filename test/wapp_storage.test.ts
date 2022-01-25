import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { wappStorage } from '../src/index';

describe('WappStorage', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('can create a new instance', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [] });
        mockedAxios.post.mockResolvedValueOnce({ data: [] });

        let ws = await wappStorage('test');
        expect(ws.name).toEqual('test');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/data',
            {
                data_meta: {
                    id: 'wapp_storage_test',
                    type: 'wapp_storage',
                },
                meta: {
                    type: 'data',
                    version: '2.0',
                },
            },
            {}
        );
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/data', {
            params: {
                'this_data_meta.id': 'wapp_storage_test',
                expand: 1,
            },
        });
    });

    it('can add a new item', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: [
                {
                    data_meta: {
                        id: 'wapp_storage_default',
                        type: 'wapp_storage',
                    },
                    key: 'item',
                },
            ],
        });
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });

        let c = await wappStorage();
        let res = c.get('key');
        expect(res).toBe('item');
        c.set('key', 'item');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/data', {
            params: {
                'this_data_meta.id': 'wapp_storage_default',
                expand: 1,
            },
        });

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/data',
            {
                data_meta: {
                    id: 'wapp_storage_default',
                    type: 'wapp_storage',
                },
                meta: {
                    type: 'data',
                    version: '2.0',
                },
                key: 'item',
            },
            {}
        );
    });

    it('can load new data from the server', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: [
                {
                    data_meta: {
                        id: 'wapp_storage_default',
                        type: 'wapp_storage',
                    },
                    missing: 'item',
                },
            ],
        });

        let c = await wappStorage();
        let oldData = c.get('missing');
        await c.refresh();
        let newData = c.get('missing');

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);

        expect(oldData).toBe(undefined);
        expect(newData).toBe('item');
    });

    it('can reset the data', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: [] });
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });
        mockedAxios.delete.mockResolvedValueOnce({ data: [] });

        let c = await wappStorage();
        c.set('key', 'item');
        let resOld = c.get('key');
        c.reset();
        let resNew = c.get('key');
        expect(resOld).toBe('item');
        expect(resNew).toBe(undefined);

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
    });
});
