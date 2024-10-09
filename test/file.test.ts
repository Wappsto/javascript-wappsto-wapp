import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { File } from '../src/index';
import { delay, makeResponse } from './util/helpers';
import { after, before, newWServer } from './util/stream';
import { makeFileResponse } from './util/response';

describe('file', () => {
    let server: WS;

    beforeAll(() => {
        before();
    });

    beforeEach(() => {
        server = newWServer(true);
    });

    afterEach(() => {
        after();
    });

    it('can create a new File class', () => {
        const file = new File('my file', 'application/pdf');

        expect(file.name).toEqual('my file');
        expect(file.type).toEqual('application/pdf');
        expect(file.size).toBe(0);
        expect(file.published).toBe(false);
        expect(file.url()).toEqual('/2.1/file');
    });

    it('can create a file on wappsto', async () => {
        mockedAxios.post.mockResolvedValue(
            makeResponse(
                makeFileResponse({
                    id: '53aedd8f-b623-4808-b4cc-810471c70d2e',
                    name: 'file name',
                    type: 'file type',
                    size: 100,
                    published: true,
                })
            )
        );

        const file = new File('my file', 'my type');
        await file.create();

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/file',
            expect.objectContaining({
                meta: {
                    type: 'file',
                    version: '2.1',
                },
                name: 'my file',
                type: 'my type',
                size: 0,
                published: false,
            }),
            {}
        );
        expect(file.name).toEqual('file name');
        expect(file.type).toEqual('file type');
        expect(file.meta.id).toEqual('53aedd8f-b623-4808-b4cc-810471c70d2e');
    });

    it('can update a file on wappsto', async () => {
        const response = makeResponse(makeFileResponse());
        mockedAxios.put.mockResolvedValue(response);
        mockedAxios.post.mockResolvedValue(response);

        const file = new File();
        await file.create();
        file.type = 'new test';
        await file.update();

        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
            `/2.1/file/${file.meta.id}/document`,
            expect.objectContaining({
                meta: {
                    type: 'file',
                    version: '2.1',
                    id: file.meta.id,
                },
                type: 'new test',
            }),
            {}
        );
    });

    it('can create a new file from wappsto', async () => {
        mockedAxios.get.mockResolvedValue(
            makeResponse([makeFileResponse({ name: 'new name' })])
        );

        const files = await File.fetch();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/file', {
            params: { go_internal: true, method: ['retrieve'] },
        });
        expect(files[0]?.name).toEqual('new name');
    });

    it('will fail if file does not exist', async () => {
        mockedAxios.get.mockResolvedValue({});
        const file = await File.fetchById(
            'c14c4de6-b26a-4ec4-8547-1bd8f60a4238'
        );

        expect(file).toBeUndefined();
    });

    it('can get a file by id', async () => {
        mockedAxios.get.mockResolvedValue(
            makeResponse(
                makeFileResponse({
                    id: '96b2d794-1475-4b27-80fd-807e0cd76176',
                    name: 'File Name',
                })
            )
        );

        const file = await File.fetchById(
            '96b2d794-1475-4b27-80fd-807e0cd76176'
        );
        const file2 = await File.fetchById(
            '96b2d794-1475-4b27-80fd-807e0cd76176'
        );

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/file/96b2d794-1475-4b27-80fd-807e0cd76176/document',
            {
                params: { go_internal: true, method: ['retrieve'] },
            }
        );

        expect(file?.name).toEqual('File Name');
        expect(file).toEqual(file2);
    });

    it('can receive a create event', async () => {
        const fun1 = jest.fn();
        const cb1 = (event: any) => fun1(event);
        File.onCreate(cb1);
        const fun2 = jest.fn();
        const cb2 = (event: any) => fun2(event);
        File.onCreate(cb2);

        const message = {
            meta: {
                id: '833c1bf9-7d0b-458b-95c7-26a0e6aa9937',
                type: 'eventstream',
                version: '2.1',
            },
            event: 'create',
            meta_object: {
                id: '6b935a97-36cb-4e98-bfd8-3dbf3cbaa8a5',
                type: 'file',
                version: '2.0',
            },
            path: '/file/6b935a97-36cb-4e98-bfd8-3dbf3cbaa8a5',
            timestamp: '2024-09-19T11:25:41.457365Z',
        };

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/file',
                },
            })
        );

        server.send(message);
        await delay();

        expect(fun1).toHaveBeenCalledTimes(1);
        expect(fun1).toHaveBeenCalledWith(message);
        expect(fun2).toHaveBeenCalledTimes(1);
        expect(fun2).toHaveBeenCalledWith(message);

        let res = await File.cancelOnCreate(cb1);
        expect(res).toBe(true);
        res = await File.cancelOnCreate(cb1);
        expect(res).toBe(false);

        server.send(message);
        await delay();

        expect(fun1).toHaveBeenCalledTimes(1);
        expect(fun2).toHaveBeenCalledTimes(2);

        await File.cancelOnCreate(cb2);
        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'DELETE',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/file',
                },
            })
        );

        server.send(message);
        await delay();

        expect(fun1).toHaveBeenCalledTimes(1);
        expect(fun2).toHaveBeenCalledTimes(2);
    });

    it('can receive a delete event', async () => {
        const fun1 = jest.fn();
        const cb1 = (event: any) => fun1(event);
        File.onDelete(cb1);
        const fun2 = jest.fn();
        const cb2 = (event: any) => fun2(event);
        File.onDelete(cb2);

        const message = {
            meta: {
                id: '833c1bf9-7d0b-458b-95c7-26a0e6aa9937',
                type: 'eventstream',
                version: '2.1',
            },
            event: 'delete',
            meta_object: {
                id: '6b935a97-36cb-4e98-bfd8-3dbf3cbaa8a5',
                type: 'file',
                version: '2.0',
            },
            path: '/file/6b935a97-36cb-4e98-bfd8-3dbf3cbaa8a5',
            timestamp: '2024-09-19T11:25:41.457365Z',
        };

        await server.connected;
        server.send(message);
        await delay();

        expect(fun1).toHaveBeenCalledTimes(1);
        expect(fun1).toHaveBeenCalledWith(message);
        expect(fun2).toHaveBeenCalledTimes(1);
        expect(fun2).toHaveBeenCalledWith(message);

        File.cancelOnDelete(cb2);
        server.send(message);
        await delay();

        expect(fun1).toHaveBeenCalledTimes(2);
        expect(fun2).toHaveBeenCalledTimes(1);
    });
});
