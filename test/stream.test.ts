import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { Value, State } from '../src/index';
import { before, after, newWServer, sendRpcResponse } from './util/stream';
import {
    cancelPermissionUpdate,
    onPermissionUpdate,
} from '../src/stream_helpers';
import { delay } from './util/helpers';

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
        expect(fun).toHaveBeenNthCalledWith(1, value, 'data', 'timestamp');

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
        await delay();

        expect(fun).toHaveBeenCalledTimes(1);
    });

    it('can trigger an onControl handler', async () => {
        const fun = jest.fn();
        const value = new Value();
        const state = new State('Control');
        const arrData: string[] = [];
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        value.state.push(state);

        const p1 = value.onControl(fun);
        const p2 = value.onControl(fun);
        const p3 = value.onControl((v, s) => {
            arrData.push(s);
        });
        const p4 = value.onControl((v, s) => {
            arrData.push(s);
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

        const orgError = console.error;
        console.error = jest.fn();
        server.send({
            jsonrpc: '2.1',
            error: 'stream error',
        });

        expect(console.error).toHaveBeenLastCalledWith(
            'WAPPSTO ERROR: Stream rpc error: stream error'
        );
        console.error = orgError;

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
        await delay();

        expect(arrData.length).toBe(1);
        expect(fun).toHaveBeenCalledTimes(1);
        expect(fun).toHaveBeenNthCalledWith(1, value, 'data', 'timestamp');
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
            path: '/state/cda4d978-39e9-47bf-8497-9813b0f94973',
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
            path: '/state/2e91c9a5-1ca5-4a93-b4d5-74bd662e6d59',
            data: {
                data: 'data',
                timestamp: 'timestamp',
            },
        });

        await delay();

        expect(funR).toHaveBeenCalledTimes(1);
        expect(funC).toHaveBeenCalledTimes(1);
        expect(funR).toHaveBeenNthCalledWith(1, value, 'data', 'timestamp');
        expect(funC).toHaveBeenNthCalledWith(1, value, 'data', 'timestamp');

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

        await delay();

        expect(funR).toHaveBeenCalledTimes(2);
        expect(funC).toHaveBeenCalledTimes(1);
        expect(funR).toHaveBeenNthCalledWith(2, value, 'data2', 'timestamp2');
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

        await delay();

        expect(fun).toHaveBeenCalledTimes(1);
        expect(fun).toHaveBeenNthCalledWith(1, value);
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

        await delay();

        expect(fun1).toHaveBeenCalledTimes(2);
        expect(fun2).toHaveBeenCalledTimes(2);

        expect(fun1).toHaveBeenNthCalledWith(1, value, 'user');
        expect(fun1).toHaveBeenNthCalledWith(2, value, 'user');
        expect(fun2).toHaveBeenNthCalledWith(1);
        expect(fun2).toHaveBeenNthCalledWith(2);

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

        await delay();

        expect(fun1).toHaveBeenCalledTimes(2);
        expect(fun2).toHaveBeenCalledTimes(2);
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

        const orgError = console.error;
        console.error = jest.fn();
        server.error();
        expect(console.error).toHaveBeenLastCalledWith(
            'WAPPSTO ERROR: Stream error: ws://localhost:12345'
        );
        console.error = orgError;

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

        await delay();

        expect(fun).toHaveBeenCalledTimes(1);
        expect(fun).toHaveBeenNthCalledWith(1, value, 'data', 'timestamp');
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

        await delay();

        expect(fun).toHaveBeenNthCalledWith(1, value, 'data', 'timestamp');
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
                await delay(10);
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

        await delay(100);

        expect(result).toEqual(['1', '2']);
    });

    it('notifies when there is new permissions', async () => {
        let permissionUpdated = 0;
        onPermissionUpdate(() => {
            permissionUpdated += 1;
        });

        await server.connected;
        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/notification',
                },
            })
        );

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
        });

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                custom: {
                    data: {
                        selected: [
                            {
                                meta: {
                                    id: 'bb9defdd-5139-444a-9e32-097936b139dc',
                                },
                            },
                        ],
                    },
                },
                base: {
                    code: 1100004,
                    identifier: 'network-1-Find 1 network with name test',
                    ids: [],
                },
            },
        });

        cancelPermissionUpdate();

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                custom: {
                    data: {
                        selected: [
                            {
                                meta: {
                                    id: '69e8560f-43b3-4fa6-9c12-4ad1c0e8fdb6',
                                },
                            },
                        ],
                    },
                },
                base: {
                    code: 1100004,
                    identifier: 'network-1-Find 1 network with name test',
                    ids: [],
                },
            },
        });

        await delay(100);
        expect(permissionUpdated).toBe(1);
    });
});
