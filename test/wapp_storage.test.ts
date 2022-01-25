import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { wappStorage } from '../src/index';
import { openStream } from '../src/models/stream';

describe('WappStorage', () => {
    let server = new WS('ws://localhost:12345', { jsonProtocol: true });

    beforeAll(() => {
        openStream.websocketUrl = 'ws://localhost:12345';
    });

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
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);

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
        mockedAxios.get
            .mockResolvedValueOnce({
                data: [
                    {
                        data_meta: {
                            id: 'wapp_storage_default',
                            type: 'wapp_storage',
                        },
                        key: 'item',
                    },
                ],
            })
            .mockResolvedValueOnce({
                data: [
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
                        new_key: 'new_item',
                    },
                ],
            });
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });
        mockedAxios.post.mockResolvedValueOnce({ data: [] });

        let fun = jest.fn();
        let c = await wappStorage();
        c.onChange(fun);
        let res = c.get('key');
        await c.set('new_key', 'new_item');
        let newRes = c.get('new_key');

        await server.connected;

        server.send({
            meta: {
                type: 'eventstream',
                version: '2.0',
            },
            event: 'extsync',
            meta_object: {
                type: 'extsync',
                version: '2.0',
            },
            data: {
                meta: {
                    type: 'extsync',
                    version: '2.0',
                },
                request: false,
                method: 'POST',
                uri: 'extsync/',
                body: '{"type":"storage_default_updated","msg":""}',
            },
            path: '/extsync/direct',
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(res).toBe('item');
        expect(newRes).toBe('new_item');

        expect(fun).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/data', {
            params: {
                'this_data_meta.id': 'wapp_storage_default',
                expand: 1,
            },
        });

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
                new_key: 'new_item',
            },
            {}
        );

        expect(mockedAxios.post).toHaveBeenCalledWith('/2.0/extsync', {
            msg: '',
            type: 'storage_default_updated',
        });
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
        mockedAxios.post
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });
        mockedAxios.delete.mockResolvedValueOnce({ data: [] });

        let c = await wappStorage();
        await c.set('key', 'item');
        let resOld = c.get('key');
        c.reset();
        let resNew = c.get('key');
        expect(resOld).toBe('item');
        expect(resNew).toBe(undefined);

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
    });
});
