import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { wappStorage, stopLogging } from '../src/index';
import { openStream } from '../src/stream_helpers';

describe('WappStorage', () => {
    const server = new WS('ws://localhost:12345', { jsonProtocol: true });

    beforeAll(() => {
        stopLogging();
        openStream.websocketUrl = 'ws://localhost:12345';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('can create a new instance', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [] });
        mockedAxios.post.mockResolvedValueOnce({ data: [] });

        const ws = await wappStorage('test');
        expect(ws.name).toEqual('test');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/data',
            {
                data_meta: {
                    id: 'wapp_storage_test',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    type: 'data',
                    version: '2.0',
                },
                data: {},
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
                    meta: {
                        id: 'be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                        type: 'data',
                        version: '2.0',
                    },
                    data_meta: {
                        id: 'wapp_storage_default',
                        type: 'wapp_storage',
                        version: 1,
                    },
                    data: {
                        key: 'item',
                    },
                },
            ],
        });
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });

        const fun = jest.fn();
        const c = await wappStorage();
        c.onChange(fun);
        const res = c.get('key');
        await c.set('new_key', 'new_item');
        const newRes = c.get('new_key');

        await server.connected;
        server.send({
            meta: {
                id: '37eba085-b943-4958-aa78-c1bd4c73defc',
                type: 'eventstream',
                version: '2.1',
            },
            event: 'update',
            meta_object: {
                type: 'data',
                version: '2.0',
                id: 'be342e99-5e52-4f8c-bb20-ead46bfe4a16',
            },
            data: {
                data_meta: {
                    type: 'wapp_storage',
                    id: 'wapp_storage_default',
                    version: 1,
                },
                data: {
                    new_key: 'new_item',
                },
                meta: {
                    id: 'be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                    type: 'data',
                    version: '2.0',
                },
                path: '/data/be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                timestamp: '2022-06-08T14:49:35.349971Z',
            },
            path: '/data/be342e99-5e52-4f8c-bb20-ead46bfe4a16',
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(res).toBe('item');
        expect(newRes).toBe('new_item');

        expect(fun).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/data', {
            params: {
                'this_data_meta.id': 'wapp_storage_default',
                expand: 1,
            },
        });

        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/data/be342e99-5e52-4f8c-bb20-ead46bfe4a16',
            {
                data_meta: {
                    id: 'wapp_storage_default',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    type: 'data',
                    id: 'be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                    version: '2.0',
                },
                data: {
                    key: 'item',
                    new_key: 'new_item',
                },
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
                        version: 1,
                    },
                    data: {
                        missing: 'item',
                    },
                },
            ],
        });

        const c = await wappStorage();
        const oldData = c.get('missing');
        await c.reload();
        const newData = c.get('missing');

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

        const c = await wappStorage();
        await c.set('key', 'item');
        const resOld = c.get('key');
        c.reset();
        const resNew = c.get('key');
        expect(resOld).toBe('item');
        expect(resNew).toBe(undefined);

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
    });

    it('can remove a key', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                data_meta: {
                    id: 'wapp_storage_remove',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    type: 'data',
                    id: 'be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                    version: '2.0',
                },
                data: {
                    new: 'data',
                },
            },
        });
        mockedAxios.patch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });

        const c = await wappStorage('remove');
        await c.set('new', 'data');
        const res1 = c.get('new');

        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/data/be342e99-5e52-4f8c-bb20-ead46bfe4a16',
            {
                data_meta: {
                    id: 'wapp_storage_remove',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    type: 'data',
                    id: 'be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                    version: '2.0',
                },
                data: {
                    new: 'data',
                },
            },
            {}
        );

        await c.remove('new');
        const res2 = c.get('new');

        expect(res1).toBe('data');
        expect(res2).toBe(undefined);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);

        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/data/be342e99-5e52-4f8c-bb20-ead46bfe4a16',
            {
                data_meta: {
                    id: 'wapp_storage_remove',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    type: 'data',
                    id: 'be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                    version: '2.0',
                },
                data: {},
            },
            {}
        );
    });

    it('can convert an old data to new format', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                data_meta: {
                    id: 'wapp_storage_remove',
                    type: 'wapp_storage',
                },
                meta: {
                    type: 'data',
                    id: 'be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                    version: '2.0',
                },
                old: 'data',
            },
        });
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });

        const c = await wappStorage('convert');
        const res1 = c.get('old');

        expect(res1).toBe('data');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
    });

    it('can get keys, values and entries', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                data_meta: {
                    id: 'wapp_storage_remove',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    type: 'data',
                    id: 'be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                    version: '2.0',
                },
                data: {
                    key1: 'data1',
                    key2: ['data2'],
                    key3: { key4: 'data4' },
                },
            },
        });
        const c = await wappStorage('keys and values');

        expect(c.keys()).toEqual(['key1', 'key2', 'key3']);
        expect(c.values()).toEqual(['data1', ['data2'], { key4: 'data4' }]);
        expect(c.entries()).toEqual([
            ['key1', 'data1'],
            ['key2', ['data2']],
            ['key3', { key4: 'data4' }],
        ]);
    });
});
