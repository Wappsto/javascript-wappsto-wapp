import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import {
    onWebHook,
    sendToForeground,
    sendToBackground,
    fromBackground,
    fromForeground,
    cancelOnWebHook,
    cancelFromForeground,
    cancelFromBackground,
    signalBackground,
    signalForeground,
    waitForBackground,
    JSONObject,
} from '../src/index';
import { before, after, newWServer, sendRpcResponse } from './util/stream';
import { signalRequest } from './util/response';
import { makeErrorResponse, makeResponse } from './util/helpers';

const rpcExtSyncRequest = expect.objectContaining({
    jsonrpc: '2.0',
    method: 'POST',
    params: {
        url: '/services/2.1/websocket/open/subscription',
        data: '/2.1/extsync/request',
    },
});
const rpcExtSync = expect.objectContaining({
    jsonrpc: '2.0',
    method: 'POST',
    params: {
        url: '/services/2.1/websocket/open/subscription',
        data: '/2.1/extsync',
    },
});
const rpcExtSyncDelete = expect.objectContaining({
    jsonrpc: '2.0',
    method: 'DELETE',
    params: {
        url: '/services/2.1/websocket/open/subscription',
        data: '/2.1/extsync/request',
    },
});

describe('ExtSync stream', () => {
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

    it('can signal that the background is ready', async () => {
        mockedAxios.post.mockResolvedValueOnce(makeResponse({}));
        await server.connected;

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

        server.send({
            meta: {
                id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
                type: 'eventstream',
                version: '2.1',
            },
            event: 'extsync',
            meta_object: {
                type: 'extsync',
                version: '2.1',
                id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
            },
            data: {
                meta: {
                    type: 'extsync',
                    version: '2.1',
                    id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
                },
                request: false,
                method: 'POST',
                uri: 'extsync/',
                body: '{"type":"isBackgroundStarted","message":""}',
            },
            path: '/extsync/direct',
        });

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        fromForeground(() => {});

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    data: '/2.1/extsync/request',
                    url: '/services/2.1/websocket/open/subscription',
                },
            })
        );

        sendRpcResponse(server, 1);

        server.send({
            meta: {
                id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
                type: 'eventstream',
                version: '2.1',
            },
            event: 'extsync',
            meta_object: {
                type: 'extsync',
                version: '2.1',
                id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
            },
            data: {
                meta: {
                    type: 'extsync',
                    version: '2.1',
                    id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
                },
                request: false,
                method: 'POST',
                uri: 'extsync/',
                body: '{"type":"isBackgroundStarted","message":""}',
            },
            path: '/extsync/direct',
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(1, '/2.1/extsync', {
            message: '',
            type: 'backgroundIsStarted',
        });
    });

    it('can handle extsync requests', async () => {
        const fun = jest.fn();
        fun.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );
        mockedAxios.put.mockResolvedValueOnce(makeResponse([]));

        const webPromise = onWebHook(fun);
        await server.connected;

        await expect(server).toReceiveMessage(rpcExtSyncRequest);
        sendRpcResponse(server);

        await webPromise;

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: '1ae385e6-849c-44ac-9731-b360c1e774d4',
                },
                request: 'request',
                uri: 'extsync/request?id=test',
                body: 'test',
                method: 'post',
                headers: {
                    accept: 'none',
                },
            },
        });

        await new Promise((r) => setTimeout(r, 1));
        expect(fun).toHaveBeenCalledTimes(1);
        expect(fun).toHaveBeenNthCalledWith(
            1,
            'test',
            'post',
            '/',
            { id: 'test' },
            {
                accept: 'none',
            }
        );

        await new Promise((r) => setTimeout(r, 1));

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                response: 'response',
                uri: 'extsync/request',
                body: 'test',
            },
        });

        const cancelPromise = cancelOnWebHook(fun);

        await expect(server).toReceiveMessage(rpcExtSyncDelete);
        sendRpcResponse(server, 1);

        await cancelPromise;

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: '990e5086-db9e-4ed0-b1b3-5a4faede05b3',
                },
                request: 'request',
                uri: 'extsync/request',
                body: 'test',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(fun).toHaveBeenCalledTimes(1);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/extsync/response/1ae385e6-849c-44ac-9731-b360c1e774d4',
            {
                body: true,
                code: 200,
            }
        );

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    });

    it('can send to background and foreground', async () => {
        let responseForeground: JSONObject | undefined = undefined;
        let responseBackground: JSONObject | undefined = undefined;
        const msg = { test: 'test message' };
        const res = { result: 'true' };
        const funF = jest.fn();
        funF.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );
        const funB = jest.fn();
        funB.mockReturnValue(true);

        mockedAxios.post
            .mockResolvedValueOnce(makeResponse(res))
            .mockResolvedValueOnce(makeResponse(res));

        const backgroundPromise = fromBackground(funB);
        sendToForeground<JSONObject, JSONObject>(msg).then((result) => {
            responseForeground = result;
        });

        const foregroundPromise = fromForeground(funF);
        sendToBackground<JSONObject, JSONObject>(msg).then((result) => {
            responseBackground = result;
        });

        await server.connected;

        await expect(server).toReceiveMessage(rpcExtSyncRequest);
        await expect(server).toReceiveMessage(rpcExtSync);
        sendRpcResponse(server);

        await Promise.all([backgroundPromise, foregroundPromise]);

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: '6718413a-4d78-4110-af0d-9291ab76196e',
                },
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "background","message": {"test": "foreground"}}',
            },
        });
        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: '632bfbc6-64f6-4bff-9121-5b656c6e5ea1',
                },
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "foreground","message": {"test": "background"}}',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        cancelFromBackground();
        cancelFromForeground();

        await expect(server).toReceiveMessage(rpcExtSyncDelete);
        sendRpcResponse(server, 1);

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: '6718413a-4d78-4110-af0d-9291ab76196e',
                },
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "background","message": {"test": "foreground"}}',
            },
        });
        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: '632bfbc6-64f6-4bff-9121-5b656c6e5ea1',
                },
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "foreground","message": {"test": "background"}}',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(responseForeground).toBe(res);
        expect(responseBackground).toBe(res);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/extsync/request',
            {
                message: {
                    test: 'test message',
                },
                type: 'background',
            }
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            '/2.1/extsync/request',
            {
                message: {
                    test: 'test message',
                },
                type: 'foreground',
            }
        );
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/extsync/response/6718413a-4d78-4110-af0d-9291ab76196e',
            {
                body: true,
                code: 200,
            }
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/extsync/response/632bfbc6-64f6-4bff-9121-5b656c6e5ea1',
            {
                body: true,
                code: 200,
            }
        );

        expect(funF).toHaveBeenCalledTimes(1);
        expect(funB).toHaveBeenCalledTimes(1);
        expect(funB).toHaveBeenNthCalledWith(1, { test: 'foreground' });
        expect(funF).toHaveBeenNthCalledWith(1, { test: 'background' });
    });

    it('can use webhook and sendToForeground', async () => {
        let responseForeground: JSONObject | undefined = undefined;
        const msg = { test: 'test message' };
        const res = { result: 'true' };
        const funWeb = jest.fn();
        funWeb.mockReturnValue(true);
        const funFore = jest.fn();
        funFore.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );
        mockedAxios.post.mockResolvedValueOnce(makeResponse(res));
        mockedAxios.put
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));

        const webPromise = onWebHook(funWeb);
        const backgroundPromise = fromBackground(funFore);
        sendToForeground<JSONObject, JSONObject>(msg).then((result) => {
            responseForeground = result;
        });

        await server.connected;

        await expect(server).toReceiveMessage(rpcExtSyncRequest);
        sendRpcResponse(server);

        await Promise.all([webPromise, backgroundPromise]);

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: '9d9dc628-8542-4953-8d89-791978681b98',
                },
                request: 'request',
                uri: 'extsync/request/test',
                body: 'test',
                method: 'get',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        });
        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: '754526f7-7d6d-4cba-9ad9-9109a555edd4',
                },
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "background","message": {"test": "foreground"}}',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(responseForeground).toBe(res);
        expect(funWeb).toHaveBeenCalledTimes(1);
        expect(funFore).toHaveBeenCalledTimes(1);
        expect(funWeb).toHaveBeenNthCalledWith(
            1,
            'test',
            'get',
            '/test',
            {},
            {
                'Content-Type': 'application/json',
            }
        );
        expect(funFore).toHaveBeenNthCalledWith(1, { test: 'foreground' });
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/extsync/request',
            {
                message: {
                    test: 'test message',
                },
                type: 'background',
            }
        );
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/extsync/response/9d9dc628-8542-4953-8d89-791978681b98',
            {
                body: true,
                code: 200,
            }
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/extsync/response/754526f7-7d6d-4cba-9ad9-9109a555edd4',
            {
                body: true,
                code: 200,
            }
        );
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
    });

    it('can filter out foreground messages send from the foreground', async () => {
        const fun = jest.fn();
        const backgroundPromise = fromBackground(fun);

        await server.connected;

        await expect(server).toReceiveMessage(rpcExtSyncRequest);
        sendRpcResponse(server);

        await backgroundPromise;

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "foreground","message": {"test": "foreground"}}',
            },
        });
        await new Promise((r) => setTimeout(r, 1));

        expect(fun).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
    });

    it('can register, deregister and register handlers', async () => {
        const funF = jest.fn();
        const funB = jest.fn();

        let foregroundPromise = fromForeground(funF);
        let backgroundPromise = fromBackground(funB);

        await server.connected;

        await expect(server).toReceiveMessage(rpcExtSyncRequest);
        await expect(server).toReceiveMessage(rpcExtSync);
        sendRpcResponse(server);

        await Promise.all([backgroundPromise, foregroundPromise]);

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "background","message": {"test": "foreground"}}',
            },
        });

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "foreground","message": {"test": "foreground"}}',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        cancelFromBackground();
        cancelFromForeground();

        await expect(server).toReceiveMessage(rpcExtSyncDelete);
        sendRpcResponse(server, 1);

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "background","message": {"test": "foreground"}}',
            },
        });
        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "foreground","message": {"test": "foreground"}}',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        foregroundPromise = fromForeground(funF);
        backgroundPromise = fromBackground(funB);

        await expect(server).toReceiveMessage(rpcExtSyncRequest);
        sendRpcResponse(server, 2);

        await Promise.all([backgroundPromise, foregroundPromise]);

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "background","message": {"test": "foreground"}}',
            },
        });
        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "foreground","message": {"test": "foreground"}}',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(funF).toHaveBeenCalledTimes(2);
        expect(funB).toHaveBeenCalledTimes(2);
    });

    it('can handle an error from the background/foreground', async () => {
        const backgroundPromise = fromBackground<any>(async (msg) => {
            msg.ferror();
        });
        const foregroundPromise = fromForeground<any>((msg) => {
            msg.berror();
        });

        await server.connected;
        await expect(server).toReceiveMessage(rpcExtSyncRequest);
        sendRpcResponse(server);

        await Promise.all([backgroundPromise, foregroundPromise]);

        const orgError = console.error;
        console.error = jest.fn();
        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: 'foreground',
                },
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "foreground","message": {"test": "foreground"}}',
            },
        });
        await new Promise((r) => setTimeout(r, 1));
        expect(console.error).toHaveBeenLastCalledWith(
            expect.stringContaining(
                'WAPPSTO ERROR: TypeError: msg.berror is not a function'
            )
        );

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/extsync/response/foreground',
            {
                body: {
                    error: 'msg.berror is not a function',
                },
                code: 400,
            }
        );

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: 'background',
                },
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "background","message": {"test": "background"}}',
            },
        });
        await new Promise((r) => setTimeout(r, 1));

        expect(console.error).toHaveBeenLastCalledWith(
            expect.stringContaining(
                'WAPPSTO ERROR: TypeError: msg.ferror is not a function'
            )
        );
        console.error = orgError;

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/extsync/response/foreground',
            {
                body: {
                    error: 'msg.berror is not a function',
                },
                code: 400,
            }
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/extsync/response/background',
            {
                body: {
                    error: 'msg.ferror is not a function',
                },
                code: 400,
            }
        );
    });

    it('can handle timeout when sending a request', async () => {
        mockedAxios.post.mockRejectedValueOnce(
            makeErrorResponse({ code: 507000000 })
        );

        const orgError = console.error;
        console.error = jest.fn();
        const res = await sendToForeground('test');

        expect(console.error).toHaveBeenLastCalledWith(
            'WAPPSTO ERROR: Failed to send request ({"type":"background","message":"test"}) because: Timeout, waiting for response on extsync request'
        );
        console.error = orgError;

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/extsync/request',
            {
                message: 'test',
                type: 'background',
            }
        );

        expect(res).toEqual({});
    });

    it('can signal background and foreground', async () => {
        const msg = { test: 'test signal' };
        const res = { result: 'true' };
        const funF = jest.fn();
        funF.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );
        const funB = jest.fn();
        funB.mockReturnValue(true);

        mockedAxios.post
            .mockResolvedValueOnce(makeResponse(res))
            .mockResolvedValueOnce(makeResponse(res));

        signalForeground(msg);
        signalBackground(msg);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(1, '/2.1/extsync', {
            message: {
                test: 'test signal',
            },
            type: 'background',
        });
        expect(mockedAxios.post).toHaveBeenNthCalledWith(2, '/2.1/extsync', {
            message: {
                test: 'test signal',
            },
            type: 'foreground',
        });

        const backgroundPromise = fromBackground(funB);
        const foregroundPromise = fromForeground(funF);

        await server.connected;

        await expect(server).toReceiveMessage(rpcExtSyncRequest);
        await expect(server).toReceiveMessage(rpcExtSync);
        sendRpcResponse(server);

        await Promise.all([backgroundPromise, foregroundPromise]);

        server.send(signalRequest('foreground'));
        server.send(signalRequest('background'));

        await new Promise((r) => setTimeout(r, 1));

        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);

        expect(funB).toHaveBeenCalledTimes(1);
        expect(funB).toHaveBeenNthCalledWith(1, { signal: 'background' });
        expect(funF).toHaveBeenCalledTimes(1);
        expect(funF).toHaveBeenNthCalledWith(1, { signal: 'foreground' });
    });

    it('can timeout waiting for background', async () => {
        const orgError = console.error;
        console.error = jest.fn();
        const p = await waitForBackground(1);
        expect(console.error).toHaveBeenLastCalledWith(
            "WAPPSTO ERROR: Failed to send isBackgroundStarted event () because: TypeError: Cannot read properties of undefined (reading 'data')"
        );
        console.error = orgError;
        expect(p).toBe(false);
    });

    it('can wait for background', async () => {
        const p = waitForBackground();

        await server.connected;

        await new Promise((r) => setTimeout(r, 1));

        server.send({
            meta: {
                id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
                type: 'eventstream',
                version: '2.1',
            },
            event: 'extsync',
            meta_object: {
                type: 'extsync',
                version: '2.1',
                id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
            },
            data: {
                meta: {
                    type: 'extsync',
                    version: '2.1',
                    id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
                },
                request: false,
                method: 'POST',
                uri: 'extsync/',
                body: '{"type":"isBackgroundStarted","message":""}',
            },
            path: '/extsync/direct',
        });
        server.send({
            meta: {
                id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
                type: 'eventstream',
                version: '2.1',
            },
            event: 'extsync',
            meta_object: {
                type: 'extsync',
                version: '2.1',
                id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
            },
            data: {
                meta: {
                    type: 'extsync',
                    version: '2.1',
                    id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
                },
                request: false,
                method: 'POST',
                uri: 'extsync/',
                body: '{"type":"backgroundIsStarted","message":""}',
            },
            path: '/extsync/direct',
        });

        const orgError = console.error;
        console.error = jest.fn();
        const res = await p;

        expect(console.error).toHaveBeenLastCalledWith(
            "WAPPSTO ERROR: Failed to send isBackgroundStarted event () because: TypeError: Cannot read properties of undefined (reading 'data')"
        );
        console.error = orgError;

        expect(res).toBe(true);
        const p2 = waitForBackground();

        server.send({
            meta: {
                id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
                type: 'eventstream',
                version: '2.1',
            },
            event: 'extsync',
            meta_object: {
                type: 'extsync',
                version: '2.1',
                id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
            },
            data: {
                meta: {
                    type: 'extsync',
                    version: '2.1',
                    id: 'bdc241a1-d6f9-4095-ad80-7f0ed7f40f85',
                },
                request: false,
                method: 'POST',
                uri: 'extsync/',
                body: '{"type":"backgroundIsStarted","message":""}',
            },
            path: '/extsync/direct',
        });

        const res2 = await p2;

        expect(res2).toBe(true);
    });

    it('makes sure that onRequest is awaited', async () => {
        mockedAxios.post
            .mockResolvedValueOnce(makeResponse(false))
            .mockResolvedValueOnce(makeResponse(false));

        const result: Array<number> = [];

        fromForeground<JSONObject>(async (event) => {
            let res;
            if (event.test === 'correct') {
                await new Promise((r) => setTimeout(r, 10));
                res = { status: 'ok' };
            }
            result.push(event.test as number);
            return res;
        });

        await new Promise((r) => setTimeout(r, 1));

        await server.connected;

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: 'bbe306a7-7216-4d7d-8be1-08d94cd2142d',
                },
                request: { type: 'request' },
                uri: 'extsync/',
                body: '{"type": "foreground","message": {"test": "correct"}}',
            },
        });
        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: '67756021-3b92-431d-8a70-692c295ca521',
                },
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "foreground","message": {"test": "order"}}',
            },
        });

        await new Promise((r) => setTimeout(r, 100));

        expect(result).toEqual(['correct', 'order']);

        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/extsync/response/bbe306a7-7216-4d7d-8be1-08d94cd2142d',
            {
                body: { status: 'ok' },
                code: 200,
            }
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/extsync/response/67756021-3b92-431d-8a70-692c295ca521',
            {
                body: undefined,
                code: 200,
            }
        );
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    });

    it('supports headers in the response', async () => {
        mockedAxios.post.mockResolvedValueOnce(makeResponse(false));
        mockedAxios.patch.mockResolvedValueOnce(makeResponse(false));

        fromForeground(async () => {
            return {
                code: 300,
                body: '<html>Test</html>',
                headers: {
                    'Content-Type': 'text/html',
                },
            };
        });

        await new Promise((r) => setTimeout(r, 1));

        await server.connected;

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: 'bbe306a7-7216-4d7d-8be1-08d94cd2142d',
                },
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "foreground","message": {}}',
            },
        });

        await new Promise((r) => setTimeout(r, 500));

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/extsync/response/bbe306a7-7216-4d7d-8be1-08d94cd2142d',
            {
                body: '<html>Test</html>',
                code: 300,
                headers: {
                    'Content-Type': 'text/html',
                },
            }
        );

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    });
});
