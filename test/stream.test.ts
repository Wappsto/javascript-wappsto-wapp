import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import {
    Value,
    State,
    onWebHook,
    sendToForeground,
    sendToBackground,
    fromBackground,
    fromForeground,
    cancelOnWebHook,
    cancelFromForeground,
    cancelFromBackground,
    stopLogging,
    signalBackground,
    signalForeground,
    waitForBackground,
} from '../src/index';
import { openStream } from '../src/stream_helpers';

describe('stream', () => {
    let server = new WS('ws://localhost:12345', { jsonProtocol: true });

    beforeAll(() => {
        stopLogging();
        console.error = jest.fn();
        openStream.websocketUrl = 'ws://localhost:12345';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('can trigger an onReport handler', async () => {
        const fun = jest.fn();
        const value = new Value();
        const state = new State('Report');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);
        value.onReport(fun);
        await server.connected;

        server.send({
            jsonrpc: '2.1',
            result: {
                value: 'hello',
            },
        });

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726/state/cda4d978-39e9-47bf-8497-9813b0f94973',
            data: {
                data: 'data',
                timestamp: 'timestamp',
            },
        });

        expect(fun).toHaveBeenCalledTimes(1);
        expect(fun).toHaveBeenCalledWith(value, 'data', 'timestamp');

        value.cancelOnReport();

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726/state/cda4d978-39e9-47bf-8497-9813b0f94973',
            data: {
                data: 'data2',
                timestamp: 'timestamp2',
            },
        });

        expect(fun).toHaveBeenCalledTimes(1);
    });

    it('can trigger an onControl handler', async () => {
        const fun = jest.fn();
        const value = new Value();
        const state = new State('Control');
        const datas: string[] = [];
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);
        value.onControl(fun);
        value.onControl(fun);
        value.onControl((v, s, t) => {
            datas.push(s);
        });
        value.onControl((v, s, t) => {
            datas.push(s);
        });
        value.onReport(fun);
        await server.connected;

        server.send({
            jsonrpc: '2.1',
            error: 'stream error',
        });

        server.send([
            {
                meta_object: {
                    type: 'event',
                },
                event: 'update',
                path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                data: {
                    data: 'data',
                    timestamp: 'timestamp',
                },
            },
        ]);
        await new Promise((r) => setTimeout(r, 1));

        value.clearAllCallbacks();
        value.clearAllCallbacks();

        server.send([
            {
                meta_object: {
                    type: 'event',
                },
                event: 'update',
                path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                data: {
                    data: 'data',
                    timestamp: 'timestamp',
                },
            },
        ]);
        await new Promise((r) => setTimeout(r, 1));

        expect(datas.length).toBe(1);
        expect(fun).toHaveBeenCalledTimes(1);
        expect(fun).toHaveBeenCalledWith(value, 'data', 'timestamp');
    });

    it('can trigger an onReport and onControl handler', async () => {
        const funR = jest.fn();
        const funC = jest.fn();
        const value = new Value();
        const stateR = new State('Report');
        const stateC = new State('Control');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        stateR.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        stateC.meta.id = '2e91c9a5-1ca5-4a93-b4d5-74bd662e6d59';
        value.state.push(stateR);
        value.state.push(stateC);
        value.onReport(funR);
        value.onControl(funC);
        await server.connected;

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726/state/cda4d978-39e9-47bf-8497-9813b0f94973',
            data: {
                data: 'data',
                timestamp: 'timestamp',
            },
        });

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726/state/2e91c9a5-1ca5-4a93-b4d5-74bd662e6d59',
            data: {
                data: 'data',
                timestamp: 'timestamp',
            },
        });

        expect(funR).toHaveBeenCalledTimes(1);
        expect(funC).toHaveBeenCalledTimes(1);
        expect(funR).toHaveBeenCalledWith(value, 'data', 'timestamp');
        expect(funC).toHaveBeenCalledWith(value, 'data', 'timestamp');

        value.cancelOnControl();

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726/state/cda4d978-39e9-47bf-8497-9813b0f94973',
            data: {
                data: 'data2',
                timestamp: 'timestamp2',
            },
        });

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726/state/2e91c9a5-1ca5-4a93-b4d5-74bd662e6d59',
            data: {
                data: 'data',
                timestamp: 'timestamp',
            },
        });

        expect(funR).toHaveBeenCalledTimes(2);
        expect(funC).toHaveBeenCalledTimes(1);
        expect(funR).toHaveBeenCalledWith(value, 'data2', 'timestamp2');
    });

    it('can trigger an onDelete handler', async () => {
        const fun = jest.fn();
        const value = new Value();
        const state = new State('Control');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);
        value.onDelete(fun);
        await server.connected;

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'delete',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726',
            data: {
                data: 'data',
                timestamp: 'timestamp',
            },
        });

        expect(fun).toHaveBeenCalledWith(value);
    });

    it('can trigger an onRefresh handler', async () => {
        const fun = jest.fn();
        const value = new Value();
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        value.onRefresh(fun);
        await server.connected;

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726',
            data: {
                status: 'send',
            },
        });

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726',
            data: {
                status: 'update',
            },
        });

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726',
            data: {
                status: 'update',
            },
        });

        expect(fun).toBeCalledTimes(2);
        expect(fun).toHaveBeenCalledWith(value, 'user');

        value.cancelOnRefresh();

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726',
            data: {
                status: 'update',
            },
        });

        expect(fun).toBeCalledTimes(2);
    });

    it('can handle a stream error', async () => {
        const fun = jest.fn();
        const value = new Value();
        const state = new State('Report');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);
        value.onReport(fun);
        await server.connected;

        server.error();
        server = new WS('ws://localhost:12345', { jsonProtocol: true });
        await server.connected;

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726/state/cda4d978-39e9-47bf-8497-9813b0f94973',
            data: {
                data: 'data',
                timestamp: 'timestamp',
            },
        });

        expect(fun).toHaveBeenCalledWith(value, 'data', 'timestamp');
    });

    it('can handle a stream close', async () => {
        const fun = jest.fn();
        const value = new Value();
        const state = new State('Report');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);
        value.onReport(fun);
        await server.connected;

        server.close();
        server = new WS('ws://localhost:12345', { jsonProtocol: true });
        await server.connected;

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726/state/cda4d978-39e9-47bf-8497-9813b0f94973',
            data: {
                data: 'data',
                timestamp: 'timestamp',
            },
        });

        expect(fun).toHaveBeenCalledWith(value, 'data', 'timestamp');
    });

    it('can handle extsync requests', async () => {
        const fun = jest.fn();
        fun.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );
        mockedAxios.put.mockResolvedValueOnce({ data: [] });

        onWebHook(fun);
        await server.connected;

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: '1ae385e6-849c-44ac-9731-b360c1e774d4',
                },
                request: 'request',
                uri: 'extsync/request',
                body: 'test',
            },
        });

        await new Promise((r) => setTimeout(r, 1));
        expect(fun).toHaveBeenCalledWith('test');
        expect(fun).toHaveBeenCalledTimes(1);
        await new Promise((r) => setTimeout(r, 1));

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                response: 'reponse',
                uri: 'extsync/request',
                body: 'test',
            },
        });

        cancelOnWebHook(fun);

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

        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/extsync/response/1ae385e6-849c-44ac-9731-b360c1e774d4',
            {
                body: true,
                code: 200,
            }
        );

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    });

    it('can send to background and foreground', async () => {
        let responseForground = undefined;
        let responseBackground = undefined;
        const msg = { test: 'test message' };
        const res = { result: 'true' };
        const funF = jest.fn();
        funF.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );
        const funB = jest.fn();
        funB.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );

        mockedAxios.post
            .mockResolvedValueOnce({ data: res })
            .mockResolvedValueOnce({ data: res });

        fromBackground(funB);
        sendToForeground(msg).then((result: any) => {
            responseForground = result;
        });

        fromForeground(funF);
        sendToBackground(msg).then((result: any) => {
            responseBackground = result;
        });

        await server.connected;

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

        expect(responseForground).toBe(res);
        expect(responseBackground).toBe(res);
        expect(mockedAxios.post).toHaveBeenCalledWith('/2.1/extsync/request', {
            message: {
                test: 'test message',
            },
            type: 'background',
        });
        expect(mockedAxios.post).toHaveBeenCalledWith('/2.1/extsync/request', {
            message: {
                test: 'test message',
            },
            type: 'foreground',
        });
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/extsync/response/6718413a-4d78-4110-af0d-9291ab76196e',
            {
                body: true,
                code: 200,
            }
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/extsync/response/632bfbc6-64f6-4bff-9121-5b656c6e5ea1',
            {
                body: true,
                code: 200,
            }
        );
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(funB).toHaveBeenCalledWith({ test: 'foreground' });
        expect(funF).toHaveBeenCalledWith({ test: 'background' });
        expect(funF).toHaveBeenCalledTimes(1);
        expect(funB).toHaveBeenCalledTimes(1);
    });

    it('can use webhook and sendToForeground', async () => {
        let responseForeground = undefined;
        const msg = { test: 'test message' };
        const res = { result: 'true' };
        const funWeb = jest.fn();
        funWeb.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );
        const funFore = jest.fn();
        funFore.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );
        mockedAxios.post.mockResolvedValueOnce({ data: res });
        mockedAxios.put
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });

        onWebHook(funWeb);
        fromBackground(funFore);
        sendToForeground(msg).then((result: any) => {
            responseForeground = result;
        });

        await server.connected;

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                meta: {
                    id: '9d9dc628-8542-4953-8d89-791978681b98',
                },
                request: 'request',
                uri: 'extsync/request',
                body: 'test',
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
        expect(funWeb).toHaveBeenCalledWith('test');
        expect(funFore).toHaveBeenCalledWith({ test: 'foreground' });
        expect(mockedAxios.post).toHaveBeenCalledWith('/2.1/extsync/request', {
            message: {
                test: 'test message',
            },
            type: 'background',
        });
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/extsync/response/754526f7-7d6d-4cba-9ad9-9109a555edd4',
            {
                body: true,
                code: 200,
            }
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/extsync/response/9d9dc628-8542-4953-8d89-791978681b98',
            {
                body: true,
                code: 200,
            }
        );

        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
    });

    it('can filter out foreground messages send from the foreground', async () => {
        const fun = jest.fn();
        fromBackground(fun);

        await server.connected;

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

    it('can handle an error from the background/foreground', async () => {
        fromBackground(async (msg) => {
            msg.ferror();
        });
        fromForeground((msg) => {
            msg.berror();
        });

        await server.connected;

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

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
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

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/extsync/response/foreground',
            {
                body: {
                    error: 'msg.berror is not a function',
                },
                code: 400,
            }
        );
    });

    it('can stop stream', async () => {
        const funF = jest.fn();
        const funB = jest.fn();

        fromForeground(funF);
        fromBackground(funB);

        await server.connected;

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

        cancelFromBackground();
        cancelFromForeground();

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

        fromForeground(funF);
        fromBackground(funB);

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

        expect(funF).toHaveBeenCalledTimes(2);
        expect(funB).toHaveBeenCalledTimes(2);
    });

    it('can handle timeout when sending a request', async () => {
        mockedAxios.post.mockRejectedValueOnce({
            response: { data: { code: 507000000 } },
        });

        const res = await sendToForeground('test');

        expect(mockedAxios.post).toHaveBeenCalledWith('/2.1/extsync/request', {
            message: 'test',
            type: 'background',
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(res).toEqual({});
    });

    it('can handle trace messages', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [] });
        const value = new Value();
        const state = new State('Control');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);

        value.onControl((v, s, t) => {
            value.control(10);
        });

        await server.connected;

        server.send([
            {
                meta: {
                    trace: '4992e9cf-e280-4986-930e-02720be086be',
                },
                meta_object: {
                    type: 'event',
                },
                event: 'update',
                path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                data: {
                    data: 'data',
                    timestamp: 'timestamp',
                },
            },
        ]);
        await new Promise((r) => setTimeout(r, 1));
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://tracer.iot.seluxit.com/trace',
            {
                params: expect.objectContaining({
                    development: 'true',
                    installation: 'local',
                    name: 'STREAM Background Wapp',
                    parent: '4992e9cf-e280-4986-930e-02720be086be',
                    status: 'pending',
                }),
            }
        );

        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://tracer.iot.seluxit.com/trace',
            {
                params: expect.objectContaining({
                    development: 'true',
                    installation: 'local',
                    name: 'STREAM Background Wapp',
                    parent: '4992e9cf-e280-4986-930e-02720be086be',
                    status: 'ok',
                }),
            }
        );
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
        funB.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );

        mockedAxios.post
            .mockResolvedValueOnce({ data: res })
            .mockResolvedValueOnce({ data: res });

        fromBackground(funB);
        signalForeground(msg);

        fromForeground(funF);
        signalBackground(msg);

        await server.connected;

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
                body: '{"type": "background","message": {"signal": "foreground"}}',
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
                body: '{"type": "foreground","message": {"signal": "background"}}',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(mockedAxios.post).toHaveBeenCalledWith('/2.0/extsync', {
            message: {
                test: 'test signal',
            },
            type: 'background',
        });
        expect(mockedAxios.post).toHaveBeenCalledWith('/2.0/extsync', {
            message: {
                test: 'test signal',
            },
            type: 'foreground',
        });
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(funB).toHaveBeenCalledWith({ signal: 'foreground' });
        expect(funF).toHaveBeenCalledWith({ signal: 'background' });
        expect(funF).toHaveBeenCalledTimes(1);
        expect(funB).toHaveBeenCalledTimes(1);
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
                body: '{"type":"isBackgroudStarted","message":""}',
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
                body: '{"type":"backgroudIsStarted","message":""}',
            },
            path: '/extsync/direct',
        });

        const res = await p;

        expect(res).toBe(true);
    });

    it('can timeout waiting for background', async () => {
        const p = await waitForBackground(1);
        expect(p).toBe(false);
    });
});
