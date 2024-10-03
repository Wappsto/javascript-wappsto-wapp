import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { config, wappStorage } from '../src/index';
import { before, after, newWServer, sendRpcResponse } from './util/stream';
import { delay, makeResponse } from './util/helpers';

describe('WappStorage', () => {
    let server: WS;

    beforeAll(() => {
        before();
    });

    beforeEach(() => {
        server = newWServer();
    });

    afterEach(() => {
        after();
    });

    it('can create a new instance', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post.mockResolvedValueOnce(makeResponse([]));

        const wsPromise = wappStorage('test');
        const ws = await wappStorage('test');
        expect(ws.name).toEqual('test');

        const ws2 = await wsPromise;
        expect(ws2.name).toEqual('test');
        expect(ws).toEqual(ws2);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);

        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
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
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/data', {
            params: {
                'this_data_meta.id': 'wapp_storage_test',
                expand: 1,
                go_internal: true,
                method: ['retrieve'],
            },
        });
    });

    it('can add a new item', async () => {
        const streamEvent = {
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
        };
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([
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
            ])
        );
        mockedAxios.put.mockResolvedValueOnce(makeResponse([]));

        const fun = jest.fn();
        const c = await wappStorage<Record<string, string>>();
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
        sendRpcResponse(server);

        await changeP;

        server.send(streamEvent);

        await delay();

        expect(res).toBe('item');
        expect(newRes).toBe('new_item');

        expect(fun).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);

        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/data', {
            params: {
                'this_data_meta.id': 'wapp_storage_default',
                expand: 1,
                go_internal: true,
                method: ['retrieve'],
            },
        });

        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
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

        const removedPromise = c.cancelOnChange();

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'DELETE',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/data/be342e99-5e52-4f8c-bb20-ead46bfe4a16',
                },
            })
        );
        sendRpcResponse(server);

        let removed = await removedPromise;
        expect(removed).toBeTruthy();

        removed = await c.cancelOnChange();
        expect(removed).toBeFalsy();

        server.send(streamEvent);

        await delay();

        expect(fun).toHaveBeenCalledTimes(1);
    });

    it('will remove when setting with missing item', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post.mockResolvedValueOnce(makeResponse([]));
        const c = await wappStorage<Record<string, string>>('test removing');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);

        let res = await c.set('missing', 'will be removed');
        await delay(100);

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/data',
            {
                _secret_background: {},
                data: {
                    missing: 'will be removed',
                },
                data_meta: {
                    id: 'wapp_storage_test removing',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    type: 'data',
                    version: '2.1',
                },
            },
            {}
        );

        res = await c.set('missing');
        await delay(100);

        expect(res).toBeFalsy();
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/data',
            {
                _secret_background: {},
                data: {},
                data_meta: {
                    id: 'wapp_storage_test removing',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    type: 'data',
                    version: '2.1',
                },
            },
            {}
        );
    });

    it('can load new data from the server', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([
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
            ])
        );

        const c = await wappStorage<Record<string, string>>();
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
        mockedAxios.post.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.put.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.delete.mockResolvedValueOnce(makeResponse([]));

        const c = await wappStorage<Record<string, string>>();
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
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse({
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
            })
        );
        mockedAxios.put
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));

        const c = await wappStorage<Record<string, string>>('remove');
        await c.set('new', 'data');
        const res1 = c.get('new');

        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
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

        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            2,
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
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse({
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
            })
        );
        mockedAxios.put.mockResolvedValueOnce(makeResponse([]));

        const c = await wappStorage<Record<string, string>>('convert');
        const res1 = c.get('old');
        const res2 = c.get('data');
        await c.update();

        expect(res1).toBe('data');
        expect(res2).toBe('test');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);

        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
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
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse({
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
            })
        );
        const c = await wappStorage<Record<string, string | object>>(
            'keys and values'
        );

        expect(c.keys()).toEqual(['key1', 'key2', 'key3']);
        expect(c.values()).toEqual(['data1', ['data2'], { key4: 'data4' }]);
        expect(c.entries()).toEqual([
            ['key1', 'data1'],
            ['key2', ['data2']],
            ['key3', { key4: 'data4' }],
        ]);
    });

    it('can create a new instance with a deep object', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse({
                meta: { id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5' },
            })
        );
        mockedAxios.put.mockResolvedValueOnce(makeResponse([]));

        const ws = await wappStorage<Record<string, object>>('test_deep');

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
        mockedAxios.get.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse({
                meta: { id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5' },
            })
        );
        mockedAxios.put.mockResolvedValueOnce(makeResponse([]));

        const ws = await wappStorage<Record<string, string>>('multi_set');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        await ws.set({ key1: 'data1', key2: 'data2' });
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/data/bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
            {
                data: {
                    key1: 'data1',
                    key2: 'data2',
                },
                _secret_background: {},
                data_meta: {
                    id: 'wapp_storage_multi_set',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
                },
            },
            {}
        );

        let values = ws.get(['key1', 'key2']);
        expect(values).toEqual(['data1', 'data2']);

        mockedAxios.put.mockResolvedValueOnce(makeResponse([]));
        await ws.remove(['key1', 'key2']);
        expect(mockedAxios.put).toHaveBeenCalledTimes(2);
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/data/bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
            {
                data: {},
                _secret_background: {},
                data_meta: {
                    id: 'wapp_storage_multi_set',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
                },
            },
            {}
        );

        values = ws.get(['key1', 'key2']);
        expect(values).toEqual([undefined, undefined]);
    });

    it('supports the secret background storages', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([
                {
                    meta: { id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5' },
                    _secret_background: {
                        old_secret_key: 'old_secret_value',
                    },
                    data_meta: {
                        id: 'wapp_storage_background_secret',
                        type: 'wapp_storage',
                        version: 1,
                    },
                },
            ])
        );

        mockedAxios.put.mockResolvedValueOnce(makeResponse([]));

        const ws = await wappStorage<Record<string, string>>(
            'background_secret'
        );
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);

        const oldValue = ws.getSecret('old_secret_key');
        expect(oldValue).toEqual('old_secret_value');

        await ws.setSecret('secret_key', 'secret_value');
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/data/bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
            {
                data: {},
                _secret_background: {
                    old_secret_key: 'old_secret_value',
                    secret_key: 'secret_value',
                },
                data_meta: {
                    id: 'wapp_storage_background_secret',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
                },
            },
            {}
        );

        await ws.setSecret({
            secret_key2: 'secret_value2',
            secret_key3: 'secret_value3',
        });
        expect(mockedAxios.put).toHaveBeenCalledTimes(2);
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/data/bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
            {
                data: {},
                _secret_background: {
                    old_secret_key: 'old_secret_value',
                    secret_key: 'secret_value',
                    secret_key2: 'secret_value2',
                    secret_key3: 'secret_value3',
                },
                data_meta: {
                    id: 'wapp_storage_background_secret',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
                },
            },
            {}
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
                data: {},
                _secret_background: {
                    old_secret_key: 'old_secret_value',
                    secret_key2: 'secret_value2',
                    secret_key3: 'secret_value3',
                },
                data_meta: {
                    id: 'wapp_storage_background_secret',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
                },
            },
            {}
        );

        await ws.removeSecret(['old_secret_key', 'secret_key2', 'secret_key3']);
        expect(mockedAxios.put).toHaveBeenCalledTimes(4);
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/data/bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
            {
                data: {},
                _secret_background: {},
                data_meta: {
                    id: 'wapp_storage_background_secret',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5',
                },
            },
            {}
        );

        value = ws.getSecret('secret_key');
        expect(value).toEqual(undefined);
        values = ws.getSecret(['secret_key2', 'secret_key3']);
        expect(values).toEqual([undefined, undefined]);
    });

    it('works with the correct types', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([
                {
                    meta: { id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5' },
                    _secret_background: {
                        old_secret_key: 'old_secret_value',
                    },
                    data_meta: {
                        id: 'wapp_storage_background_secret',
                        type: 'wapp_storage',
                        version: 1,
                    },
                    data: {
                        key1: 'item',
                        key2: 1,
                        key3: true,
                    },
                },
            ])
        );
        type MyData = {
            key1: string;
            key2: number;
            key3: boolean;
            key4?: string;
            key5: number | undefined;
        };
        const w = await wappStorage<MyData>('with types');

        const k1 = w.get('key1');
        const k2 = w.get('key2');
        const k3 = w.get('key3');
        const k4 = w.get('key4');
        const k5 = w.get('key5');

        w.set('key1', 'new');
        w.set('key2', 2);
        w.set('key3', true);
        w.set('key4', 'new2');
        w.set('key5', 3);

        w.set({
            key1: 'new',
            key2: 2,
            key3: true,
            key5: undefined,
        });

        expect(k1).toEqual('item');
        expect(k2).toEqual(1);
        expect(k3).toEqual(true);
        expect(k4).toBeUndefined();
        expect(k5).toBeUndefined();

        expect(typeof k1).toEqual('string');
        expect(typeof k2).toEqual('number');
        expect(typeof k3).toEqual('boolean');
    });

    it('works with read only object', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse({
                meta: { id: '32127128-8152-4320-a788-71cdebbf6c8a' },
            })
        );
        mockedAxios.put.mockResolvedValueOnce(makeResponse([]));

        const w = await wappStorage<Record<string, Record<string, any>>>(
            'with-read-only'
        );

        function deepFreeze(object: any) {
            // Retrieve the property names defined on object
            const propNames = Reflect.ownKeys(object);

            // Freeze properties before freezing self
            for (const name of propNames) {
                const value = object[name];

                if (
                    (value && typeof value === 'object') ||
                    typeof value === 'function'
                ) {
                    deepFreeze(value);
                }
            }

            return Object.freeze(object);
        }

        const data = deepFreeze({
            key: 'value',
            test: undefined,
            deep: {
                empty: undefined,
            },
            deepA: [
                {
                    other: 'test',
                },
                {
                    empty: undefined,
                },
            ],
        });

        await w.set('main', data);
        await w.setSecret('main', data);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(2);
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/data/32127128-8152-4320-a788-71cdebbf6c8a',
            {
                data: {
                    main: {
                        key: 'value',
                        deep: {},
                        deepA: [
                            {
                                other: 'test',
                            },
                            {},
                        ],
                    },
                },
                _secret_background: {
                    main: {
                        key: 'value',
                        deep: {},
                        deepA: [
                            {
                                other: 'test',
                            },
                            {},
                        ],
                    },
                },
                data_meta: {
                    version: 1,
                },
                meta: {
                    id: '32127128-8152-4320-a788-71cdebbf6c8a',
                },
            },
            {}
        );

        expect(data).toHaveProperty('test');
        expect(data.deep).toHaveProperty('empty');
        expect(data.deepA).toHaveLength(2);
        expect(data.deepA[1]).toHaveProperty('empty');
    });

    it('can disable secret storage', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([
                {
                    meta: { id: '4b9fe9f4-8345-47fd-abec-b682e18f8e89' },
                    data_meta: {
                        id: 'wapp_storage_background_disable_secret',
                        type: 'wapp_storage',
                        version: 1,
                    },
                    data: {},
                },
            ])
        );
        mockedAxios.put.mockResolvedValueOnce(makeResponse([]));

        config({ wappStorageSecret: false });
        const w = await wappStorage('disable_secret');
        await w.setSecret('key', 'value');
        config({ wappStorageSecret: true });

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/data/4b9fe9f4-8345-47fd-abec-b682e18f8e89',
            {
                data: {},
                data_meta: {
                    id: 'wapp_storage_background_disable_secret',
                    type: 'wapp_storage',
                    version: 1,
                },
                meta: {
                    id: '4b9fe9f4-8345-47fd-abec-b682e18f8e89',
                },
            },
            {}
        );
    });
});
