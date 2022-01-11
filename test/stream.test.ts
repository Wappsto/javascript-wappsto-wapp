console.error = jest.fn();
import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { Value, State, onWebHook } from '../src/index';
import {
    openStream,
    sendToForeground,
    sendToBackground,
    fromBackground,
    fromForeground,
} from '../src/models/stream';

describe('stream', () => {
    let server = new WS('ws://localhost:12345', { jsonProtocol: true });

    beforeAll(() => {
        openStream.websocketUrl = 'ws://localhost:12345';
    });

    it('can trigger an onReport handler', async () => {
        let fun = jest.fn();
        let value = new Value();
        let state = new State('Report');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);
        value.onReport(fun);
        await server.connected;

        server.send({
            jsonrpc: '2.0',
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

        expect(fun).toHaveBeenCalledWith(value, 'data', 'timestamp');
    });

    it('can trigger an onControl handler', async () => {
        let fun = jest.fn();
        let value = new Value();
        let state = new State('Control');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);
        value.onControl(fun);
        await server.connected;

        server.send({
            jsonrpc: '2.0',
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

        expect(fun).toHaveBeenCalledWith(value, 'data', 'timestamp');
    });

    it('can trigger an onReport and onControl handler', async () => {
        let funR = jest.fn();
        let funC = jest.fn();
        let value = new Value();
        let stateR = new State('Report');
        let stateC = new State('Control');
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

        expect(funR).toHaveBeenCalledWith(value, 'data', 'timestamp');
        expect(funC).toHaveBeenCalledWith(value, 'data', 'timestamp');
    });

    it('can trigger an onDelete handler', async () => {
        let fun = jest.fn();
        let value = new Value();
        let state = new State('Control');
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
        let fun = jest.fn();
        let value = new Value();
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
                status: 'update',
            },
        });

        expect(fun).toHaveBeenCalledWith(value);
    });

    it('can handle a stream error', async () => {
        let fun = jest.fn();
        let value = new Value();
        let state = new State('Report');
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
        let fun = jest.fn();
        let value = new Value();
        let state = new State('Report');
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
        let fun = jest.fn();
        fun.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );
        onWebHook(fun);
        await server.connected;

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
                request: 'request',
                uri: 'extsync/request',
                body: 'test',
            },
        });

        await new Promise((r) => setTimeout(r, 1));
        expect(fun).toHaveBeenCalledWith('test');
        expect(fun.mock.calls.length).toBe(1);
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

        expect(fun.mock.calls.length).toBe(1);
    });

    it('can send to background and foreground', async () => {
        let msg = { test: 'test message' };
        let res = { result: 'true' };
        let funF = jest.fn();
        funF.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );
        let funB = jest.fn();
        funB.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );

        mockedAxios.post
            .mockResolvedValueOnce({ data: res })
            .mockResolvedValueOnce({ data: res });

        fromBackground(funB);
        sendToForeground(msg).then((result) => {
            expect(result).toBe(res);
        });

        fromForeground(funF);
        sendToBackground(msg).then((result) => {
            expect(result).toBe(res);
        });

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
                body: '{"type": "foreground","message": {"test": "background"}}',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledWith('/2.0/extsync/request', {
            message: {
                test: 'test message',
            },
            type: 'background',
        });
        expect(mockedAxios.post).toHaveBeenCalledWith('/2.0/extsync/request', {
            message: {
                test: 'test message',
            },
            type: 'foreground',
        });
        expect(funB).toHaveBeenCalledWith({ test: 'foreground' });
        expect(funF).toHaveBeenCalledWith({ test: 'background' });
        expect(funF.mock.calls.length).toBe(1);
        expect(funB.mock.calls.length).toBe(1);
    });

    it('can use webhook and sendToForeground ', async () => {
        let msg = { test: 'test message' };
        let res = { result: 'true' };
        let funWeb = jest.fn();
        funWeb.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );
        let funFore = jest.fn();
        funFore.mockReturnValue(
            new Promise<boolean>((resolve) => {
                resolve(true);
            })
        );
        mockedAxios.post
            .mockResolvedValueOnce({ data: res })
            .mockResolvedValueOnce({ data: res })
            .mockResolvedValueOnce({ data: res });

        onWebHook(funWeb);
        fromBackground(funFore);
        sendToForeground(msg).then((result) => {
            expect(result).toBe(res);
        });

        await server.connected;

        server.send({
            meta_object: {
                type: 'extsync',
            },
            extsync: {
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
                request: 'request',
                uri: 'extsync/',
                body: '{"type": "background","message": {"test": "foreground"}}',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(funWeb.mock.calls.length).toBe(1);
        expect(funFore.mock.calls.length).toBe(1);
        expect(funWeb).toHaveBeenCalledWith('test');
        expect(funFore).toHaveBeenCalledWith({ test: 'foreground' });
        expect(mockedAxios.post).toHaveBeenCalledWith('/2.0/extsync/request', {
            message: {
                test: 'test message',
            },
            type: 'foreground',
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });
});
