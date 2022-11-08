import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { Value, State } from '../src/index';
import { before, after, newWServer, sendRpcResponse } from './util/stream';

describe('stream', () => {
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

    it('subscribes to extsync on start', async () => {
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
    });

    it('can trigger an onReport handler', async () => {
        const fun = jest.fn();
        const value = new Value();
        const state = new State('Report');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);
        const reportP = value.onReport(fun);

        await server.connected;

        server.send({
            jsonrpc: '2.1',
            result: {
                value: 'hello',
            },
        });

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                },
            })
        );
        sendRpcResponse(server);

        await reportP;

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

        const cancelControlPromise = value.cancelOnControl();
        const cancelReportPromise = value.cancelOnReport();
        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'DELETE',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                },
            })
        );
        sendRpcResponse(server, 1);

        await Promise.all([cancelControlPromise, cancelReportPromise]);

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
        await new Promise((r) => setTimeout(r, 1));

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

        const p1 = value.onControl(fun);
        const p2 = value.onControl(fun);
        const p3 = value.onControl((v, s, t) => {
            datas.push(s);
        });
        const p4 = value.onControl((v, s, t) => {
            datas.push(s);
        });
        const p5 = value.onReport(fun);

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                },
            })
        );
        sendRpcResponse(server);

        await Promise.all([p1, p2, p3, p4, p5]);

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

        const clearPromise1 = value.clearAllCallbacks();
        const clearPromise2 = value.clearAllCallbacks();

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'DELETE',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                },
            })
        );
        sendRpcResponse(server, 1);

        await Promise.all([clearPromise1, clearPromise2]);

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
        const pR = value.onReport(funR);
        const pC = value.onControl(funC);

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                },
            })
        );

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/2e91c9a5-1ca5-4a93-b4d5-74bd662e6d59',
                },
            })
        );
        sendRpcResponse(server);

        await pR;
        await pC;

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

        await new Promise((r) => setTimeout(r, 1));

        expect(funR).toHaveBeenCalledTimes(1);
        expect(funC).toHaveBeenCalledTimes(1);
        expect(funR).toHaveBeenCalledWith(value, 'data', 'timestamp');
        expect(funC).toHaveBeenCalledWith(value, 'data', 'timestamp');

        const cancelP = value.cancelOnControl();

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'DELETE',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/2e91c9a5-1ca5-4a93-b4d5-74bd662e6d59',
                },
            })
        );
        sendRpcResponse(server, 2);
        await cancelP;

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

        await new Promise((r) => setTimeout(r, 1));

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
        const pD = value.onDelete(fun);

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/value/6c06b63e-39ec-44a5-866a-c081aafb6726',
                },
            })
        );
        sendRpcResponse(server);

        await pD;

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

        await new Promise((r) => setTimeout(r, 1));

        expect(fun).toHaveBeenCalledWith(value);
    });

    it('can trigger an onRefresh handler', async () => {
        const fun1 = jest.fn();
        const fun2 = jest.fn();
        const fun3 = () => {
            fun2();
        };
        const value = new Value();
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';

        const refreshPromise1 = value.onRefresh(fun1);
        const refreshPromise2 = value.onRefresh(fun3);
        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/value/6c06b63e-39ec-44a5-866a-c081aafb6726',
                },
            })
        );
        sendRpcResponse(server);

        await Promise.all([refreshPromise1, refreshPromise2]);

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

        await new Promise((r) => setTimeout(r, 1));

        expect(fun1).toBeCalledTimes(2);
        expect(fun2).toBeCalledTimes(2);

        expect(fun1).toHaveBeenCalledWith(value, 'user');

        const cancelPromise = value.cancelOnRefresh();

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'DELETE',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/value/6c06b63e-39ec-44a5-866a-c081aafb6726',
                },
            })
        );
        sendRpcResponse(server, 1);

        await cancelPromise;

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

        await new Promise((r) => setTimeout(r, 1));

        expect(fun1).toBeCalledTimes(2);
        expect(fun2).toBeCalledTimes(2);
    });

    it('can handle a stream error', async () => {
        const fun = jest.fn();
        const value = new Value();
        const state = new State('Report');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);

        const reportPromise = value.onReport(fun);

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                },
            })
        );
        sendRpcResponse(server);

        await reportPromise;

        server.error();
        server = newWServer();
        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'PATCH',
                params: {
                    data: {
                        subscription: [
                            '/2.1/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                        ],
                    },
                    url: '/services/2.1/websocket/open',
                },
            })
        );
        sendRpcResponse(server);

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

        await new Promise((r) => setTimeout(r, 1));

        expect(fun).toHaveBeenCalledWith(value, 'data', 'timestamp');
    });

    it('can handle a stream close', async () => {
        const fun = jest.fn();
        const value = new Value();
        const state = new State('Report');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);

        const reportPromise = value.onReport(fun);
        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                },
            })
        );

        sendRpcResponse(server);

        await reportPromise;

        server.close();
        server = newWServer();
        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'PATCH',
                params: {
                    data: {
                        subscription: [
                            '/2.1/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                        ],
                    },
                    url: '/services/2.1/websocket/open',
                },
            })
        );
        sendRpcResponse(server);

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

        await new Promise((r) => setTimeout(r, 1));

        expect(fun).toHaveBeenCalledWith(value, 'data', 'timestamp');
    });

    it('can handle trace messages', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [] });
        const value = new Value();
        const state = new State('Control');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);

        const controlPromise = value.onControl((v, s, t) => {
            value.control(10);
        });

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                },
            })
        );
        sendRpcResponse(server);

        await controlPromise;

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

    it('makes sure that onReport is awaited', async () => {
        const value = new Value();
        const state = new State('Report');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);

        const result: Array<string> = [];

        const reportPromise = value.onReport(async (val, data) => {
            if (data === '1') {
                await new Promise((r) => setTimeout(r, 10));
            }
            result.push(data);
        });

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                },
            })
        );
        sendRpcResponse(server);

        await reportPromise;

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726/state/cda4d978-39e9-47bf-8497-9813b0f94973',
            data: {
                data: '1',
                timestamp: 'timestamp',
            },
        });
        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/6c06b63e-39ec-44a5-866a-c081aafb6726/state/cda4d978-39e9-47bf-8497-9813b0f94973',
            data: {
                data: '2',
                timestamp: 'timestamp',
            },
        });

        await new Promise((r) => setTimeout(r, 100));

        expect(result).toEqual(['1', '2']);
    });
});
