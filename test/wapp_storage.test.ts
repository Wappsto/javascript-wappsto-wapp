import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { wappStorage, stopLogging } from '../src/index';
import { openStream } from '../src/stream_helpers';
import { sendRpcResponse } from './util/stream';

describe('WappStorage', () => {
    let server: WS;

    beforeAll(() => {
        stopLogging();
        console.error = jest.fn();
        openStream.websocketUrl = 'ws://localhost:12345';
    });

    beforeEach(() => {
        server = new WS('ws://localhost:12345', { jsonProtocol: true });
    });

    afterEach(() => {
        WS.clean();
        jest.clearAllMocks();
        openStream.close();
        openStream.reset();
        server.close();
    });

    it('can create a new instance', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [] });
        mockedAxios.post.mockResolvedValueOnce({ data: [] });

        const ws = await wappStorage('test');
        expect(ws.name).toEqual('test');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/data',
            {
                data_meta: {
                    id: 'wapp_storage_test',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    type: 'data',
                    version: '2.1',
                },
                data: {},
                _secret_background: {},
            },
            {}
        );
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/data', {
            params: {
                'this_data_meta.id': 'wapp_storage_test',
                expand: 1,
                go_internal: true,
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
                        version: '2.1',
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
        mockedAxios.put.mockResolvedValueOnce({ data: [] });

        const fun = jest.fn();
        const c = await wappStorage();
        const changeP = c.onChange(fun);
        const res = c.get('key');
        await c.set('new_key', 'new_item');
        const newRes = c.get('new_key');

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/data/be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                },
            })
        );
        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/extsync',
                },
            })
        );
        sendRpcResponse(server);

        await changeP;

        server.send({
            meta: {
                id: '37eba085-b943-4958-aa78-c1bd4c73defc',
                type: 'eventstream',
                version: '2.1',
            },
            event: 'update',
            meta_object: {
                type: 'data',
                version: '2.1',
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
                    version: '2.1',
                },
                path: '/2.1/data/be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                timestamp: '2022-06-08T14:49:35.349971Z',
            },
            path: '/2.1/data/be342e99-5e52-4f8c-bb20-ead46bfe4a16',
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(res).toBe('item');
        expect(newRes).toBe('new_item');

        expect(fun).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/data', {
            params: {
                'this_data_meta.id': 'wapp_storage_default',
                expand: 1,
                go_internal: true,
            },
        });

        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.1/data/be342e99-5e52-4f8c-bb20-ead46bfe4a16',
            {
                data_meta: {
                    id: 'wapp_storage_default',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    type: 'data',
                    id: 'be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                    version: '2.1',
                },
                data: {
                    key: 'item',
                    new_key: 'new_item',
                },
                _secret_background: {},
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
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);

        expect(oldData).toBe(undefined);
        expect(newData).toBe('item');
    });

    it('can reset the data', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: [] });
        mockedAxios.put.mockResolvedValueOnce({ data: [] });
        mockedAxios.delete.mockResolvedValueOnce({ data: [] });

        const c = await wappStorage();
        await c.set('key', 'item');
        const resOld = c.get('key');
        await c.reset();
        const resNew = c.get('key');
        expect(resOld).toBe('item');
        expect(resNew).toBe(undefined);

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
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
                    version: '2.1',
                },
                data: {
                    new: 'data',
                },
            },
        });
        mockedAxios.put
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });

        const c = await wappStorage('remove');
        await c.set('new', 'data');
        const res1 = c.get('new');

        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.1/data/be342e99-5e52-4f8c-bb20-ead46bfe4a16',
            {
                data_meta: {
                    id: 'wapp_storage_remove',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    type: 'data',
                    id: 'be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                    version: '2.1',
                },
                data: {
                    new: 'data',
                },
                _secret_background: {},
            },
            {}
        );

        await c.remove('new');
        const res2 = c.get('new');

        expect(res1).toBe('data');
        expect(res2).toBe(undefined);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);

        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.1/data/be342e99-5e52-4f8c-bb20-ead46bfe4a16',
            {
                data_meta: {
                    id: 'wapp_storage_remove',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    type: 'data',
                    id: 'be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                    version: '2.1',
                },
                data: {},
                _secret_background: {},
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
                    version: '2.1',
                },
                old: 'data',
                data: 'test',
            },
        });
        mockedAxios.put.mockResolvedValueOnce({ data: [] });

        const c = await wappStorage('convert');
        const res1 = c.get('old');
        const res2 = c.get('data');
        await c.update();

        expect(res1).toBe('data');
        expect(res2).toBe('test');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);

        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.1/data/be342e99-5e52-4f8c-bb20-ead46bfe4a16',
            {
                old: null,
                data: { old: 'data', data: 'test' },
                _secret_background: {},
                data_meta: {
                    id: 'wapp_storage_remove',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    id: 'be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                    type: 'data',
                    version: '2.1',
                },
            },
            {}
        );
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
                    version: '2.1',
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

    it('can create a new instance with a deep object', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [] });
        mockedAxios.post.mockResolvedValueOnce({
            data: { meta: { id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5' } },
        });
        mockedAxios.put.mockResolvedValueOnce({ data: [] });

        const ws = await wappStorage('test_deep');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        const tmp = {};
        const d1 = { d2: tmp };
        const d2 = { d1: d1 };
        d1.d2 = d2;

        await ws.set('test', d1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);

        mockedAxios.get.mockResolvedValueOnce({ data: [d1] });
        ws.reload();
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('is supports multi key set and get', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [] });
        mockedAxios.post.mockResolvedValueOnce({
            data: { meta: { id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5' } },
        });
        mockedAxios.put.mockResolvedValueOnce({ data: [] });

        const ws = await wappStorage('multi_set');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        await ws.set({key1: 'data1', key2: 'data2'});
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/data/bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
            {
                data: {
                    key1: "data1",
                    key2: "data2",
                },
                _secret_background: {},
                data_meta: {
                    id: "wapp_storage_multi_set",
                    type: "wapp_storage",
                    version: 1,
                },
                meta: {
                    id: "bd5e3c4c-2957-429c-b39a-b5523f1b18e5",
                },
            },
            {},
        );

        let values = ws.get(['key1', 'key2']);
        expect(values).toEqual(['data1', 'data2']);

        mockedAxios.put.mockResolvedValueOnce({ data: [] });
        await ws.remove(['key1', 'key2']);
        expect(mockedAxios.put).toHaveBeenCalledTimes(2);
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/data/bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
            {
                "data": {},
                "_secret_background": {},
                "data_meta": {
                    "id": "wapp_storage_multi_set",
                    "type": "wapp_storage",
                    "version": 1,
                },
                "meta": {
                    "id": "bd5e3c4c-2957-429c-b39a-b5523f1b18e5",
                },
            },
            {},
        );

        values = ws.get(['key1', 'key2']);
        expect(values).toEqual([undefined, undefined]);
    });

    it('supports the secrect background storages', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [] });
        mockedAxios.post.mockResolvedValueOnce({
            data: { meta: { id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5' } },
        });
        mockedAxios.put.mockResolvedValueOnce({ data: [] });

        const ws = await wappStorage('background_secret');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        await ws.setSecret('secret_key', 'secret_value');
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/data/bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
            {
                "data": {},
                "_secret_background": {
                    "secret_key": "secret_value",
                },
                "data_meta": {
                    "id": "wapp_storage_background_secret",
                    "type": "wapp_storage",
                    "version": 1,
                },
                "meta": {
                    "id": "bd5e3c4c-2957-429c-b39a-b5523f1b18e5",
                },
            },
            {},
        );

        await ws.setSecret({'secret_key2': 'secret_value2', 'secret_key3': 'secret_value3'});
        expect(mockedAxios.put).toHaveBeenCalledTimes(2);
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/data/bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
            {
                "data": {},
                "_secret_background": {
                    "secret_key": "secret_value",
                    "secret_key2": "secret_value2",
                    "secret_key3": "secret_value3",
                },
                "data_meta": {
                    "id": "wapp_storage_background_secret",
                    "type": "wapp_storage",
                    "version": 1,
                },
                "meta": {
                    "id": "bd5e3c4c-2957-429c-b39a-b5523f1b18e5",
                },
            },
            {},
        );

        let value = ws.getSecret('secret_key');
        expect(value).toEqual('secret_value');
        let values = ws.getSecret(['secret_key2', 'secret_key3']);
        expect(values).toEqual(['secret_value2', 'secret_value3']);

        await ws.removeSecret('secret_key');
        expect(mockedAxios.put).toHaveBeenCalledTimes(3);
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/data/bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
            {
                "data": {},
                "_secret_background": {
                    "secret_key2": "secret_value2",
                    "secret_key3": "secret_value3",
                },
                "data_meta": {
                    "id": "wapp_storage_background_secret",
                    "type": "wapp_storage",
                    "version": 1,
                },
                "meta": {
                    "id": "bd5e3c4c-2957-429c-b39a-b5523f1b18e5",
                },
            },
            {},
        );

        await ws.removeSecret(['secret_key2', 'secret_key3']);
        expect(mockedAxios.put).toHaveBeenCalledTimes(4);
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/data/bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
            {
                "data": {},
                "_secret_background": {},
                "data_meta": {
                    "id": "wapp_storage_background_secret",
                    "type": "wapp_storage",
                    "version": 1,
                },
                "meta": {
                    "id": "bd5e3c4c-2957-429c-b39a-b5523f1b18e5",
                },
            },
            {},
        );

        value = ws.getSecret('secret_key');
        expect(value).toEqual(undefined);
        values = ws.getSecret(['secret_key2', 'secret_key3']);
        expect(values).toEqual([undefined, undefined]);
    });
});
