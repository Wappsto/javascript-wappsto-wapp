import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import 'reflect-metadata';
import { Device, Value, State, config, ValueTemplate } from '../src/index';
import { before, after, newWServer, sendRpcResponse } from './util/stream';
import { responses } from './util/response';

const response = {
    meta: {
        type: 'value',
        version: '2.1',
        id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
    },
    name: 'test',
    permission: '',
    type: '',
    period: '0',
    delta: '0',
};

describe('value', () => {
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

    it('can create a new value class', () => {
        const name = 'Test Value';
        const value = new Value(name);

        expect(value.name).toEqual(name);
    });

    it('can create a value on wappsto', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: response });

        const value = new Value('test');
        await value.create();

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/value',
            {
                meta: {
                    type: 'value',
                    version: '2.1',
                },
                name: 'test',
                type: '',
                permission: 'r',
            },
            {}
        );
        expect(value.name).toEqual('test');
        expect(value.permission).toEqual('r');
        expect(value.states).toEqual([]);
        expect(value.meta.id).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can update a value on wappsto', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: response });
        mockedAxios.put.mockResolvedValueOnce({ data: response });

        const value = new Value('test');
        await value.create();
        const oldName = response.name;
        response.name = 'new name';
        response.permission = 'r';
        value.name = 'new name';
        await value.update();

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledWith(
            `/2.1/value/${value.meta.id}`,
            response,
            {}
        );

        response.name = oldName;
        response.permission = '';
    });

    it('can create a new value from wappsto', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        const values = await Value.fetch();

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/value', {
            params: { go_internal: true, expand: 1 },
        });
        expect(values[0]?.name).toEqual('test');
    });

    it('can create a new value from wappsto with verbose', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        config({ verbose: true });
        const values = await Value.fetch();
        config({ verbose: false });

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/value', {
            params: { expand: 1, go_internal: true, verbose: true },
        });
        expect(values[0]?.name).toEqual('test');
    });

    it('can return an old state when creating', async () => {
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const oldState = new State('Report');
        oldState.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(oldState);

        const state = await value.createState({
            type: 'Report',
            data: 'new',
            timestamp: 'timestamp',
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: 'new',
                timestamp: 'timestamp',
            },
            {}
        );
        expect(state.meta.id).toBe('6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7');
    });

    it('can trigger an refresh event to the device', async () => {
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';

        await value.refresh();

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
            {
                status: 'update',
            },
            {}
        );
    });

    it('can trigger a delta event to the device', async () => {
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';

        await value.setDelta(2.2);

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
            {
                delta: '2.2',
            },
            {}
        );
    });

    it('can trigger a period event to the device', async () => {
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';

        await value.setPeriod(3600); // 1 hour

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
            {
                period: '3600',
            },
            {}
        );
    });

    it('can find a value by name', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [response] });

        const r = Value.findByName('test');
        await server.connected;
        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                base: {
                    code: 1100004,
                    identifier: 'value-1-Find 1 value with name test',
                    ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                },
            },
        });
        const value = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/value', {
            params: {
                expand: 1,
                quantity: 1,
                go_internal: true,
                message: 'Find 1 value with name test',
                identifier: 'value-1-Find 1 value with name test',
                this_name: '=test',
                method: ['retrieve', 'update'],
            },
        });
        expect(value[0].meta.id).toEqual(
            'b62e285a-5188-4304-85a0-3982dcb575bc'
        );
    });

    it('can find a value by name and extra parameters', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response, response] });

        const value = await Value.findByName('test', 2, 'msg');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/value', {
            params: {
                expand: 1,
                quantity: 2,
                go_internal: true,
                message: 'msg',
                identifier: 'value-2-msg',
                this_name: '=test',
                method: ['retrieve', 'update'],
            },
        });
        expect(value[0].meta.id).toEqual(
            'b62e285a-5188-4304-85a0-3982dcb575bc'
        );
    });

    it('can find a value by type', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [response] });

        const r = Value.findByType('test');
        await server.connected;
        await new Promise((r) => setTimeout(r, 100));
        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                base: {
                    code: 1100004,
                    identifier: 'value-1-Find 1 value with type test',
                    ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                },
            },
        });
        const value = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/value', {
            params: {
                expand: 1,
                quantity: 1,
                go_internal: true,
                message: 'Find 1 value with type test',
                identifier: 'value-1-Find 1 value with type test',
                this_type: '=test',
                method: ['retrieve', 'update'],
            },
        });
        expect(value[0].meta.id).toEqual(
            'b62e285a-5188-4304-85a0-3982dcb575bc'
        );
    });

    it('can send a report', async () => {
        mockedAxios.patch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        await value.report(10);
        await value.report('test', 'timestamp');
        const res = await value.control(10);

        expect(res).toBe(false);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(value.getReportData()).toBe('test');
        expect(value.getControlData()).toBe(undefined);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '10',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: 'test',
                timestamp: 'timestamp',
            },
            {}
        );
        expect(value.getReportTimestamp()).toBe('timestamp');
        expect(value.getControlTimestamp()).toBe(undefined);
    });

    it('can send a control', async () => {
        mockedAxios.patch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        const res1 = await value.control(10);
        const res2 = await value.control('test', 'timestamp');
        await value.report(10);
        value.delta = '1';
        await value.report(20);

        expect(res1).toBe(true);
        expect(res2).toBe(true);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Control',
                data: '10',
            }),
            {}
        );
        expect(value.getControlData()).toBe('test');
        expect(value.getReportData()).toBe(undefined);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Control',
                data: 'test',
                timestamp: 'timestamp',
            },
            {}
        );
        expect(value.getControlTimestamp()).toBe('timestamp');
        expect(value.getReportTimestamp()).toBe(undefined);
    });

    it('can send a controlWithAck', async () => {
        const fun = jest.fn();
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        let state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        state = new State('Report');
        state.meta.id = 'f1ada7da-7192-487d-93d5-221a00bdc23c';
        value.state.push(state);

        await value.onReport(fun);
        const controlPromise = value.controlWithAck(10);

        server.send({
            meta_object: {
                type: 'state',
            },
            event: 'update',
            path: '/state/f1ada7da-7192-487d-93d5-221a00bdc23c',
            data: {
                meta: {
                    id: 'f1ada7da-7192-487d-93d5-221a00bdc23c',
                    type: 'state',
                },
                type: 'Report',
                data: '1',
            },
        });

        const res1 = await controlPromise;

        server.send({
            meta_object: {
                type: 'state',
            },
            event: 'update',
            path: '/state/f1ada7da-7192-487d-93d5-221a00bdc23c',
            data: {
                meta: {
                    id: 'f1ada7da-7192-487d-93d5-221a00bdc23c',
                    type: 'state',
                },
                type: 'Report',
                data: '2',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(res1).toBe(true);
        expect(fun).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Control',
                data: '10',
            }),
            {}
        );
    });

    it('can send a controlWithAck that fails', async () => {
        const fun = jest.fn();
        mockedAxios.patch.mockRejectedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        let state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        state = new State('Report');
        state.meta.id = 'f1ada7da-7192-487d-93d5-221a00bdc23c';
        value.state.push(state);

        await value.onReport(fun);
        const controlPromise = value.controlWithAck(10);

        await new Promise((r) => setTimeout(r, 1));

        server.send({
            meta_object: {
                type: 'state',
            },
            event: 'update',
            path: '/state/f1ada7da-7192-487d-93d5-221a00bdc23c',
            data: {
                meta: {
                    id: 'f1ada7da-7192-487d-93d5-221a00bdc23c',
                    type: 'state',
                },
                type: 'Report',
                data: '1',
            },
        });

        const res1 = await controlPromise;

        await new Promise((r) => setTimeout(r, 1));

        expect(res1).toBe(false);
        expect(fun).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Control',
                data: '10',
            }),
            {}
        );
    });

    it('can send a controlWithAck that timeout', async () => {
        config({ ackTimeout: 1 });
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        let state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        state = new State('Report');
        state.meta.id = 'f1ada7da-7192-487d-93d5-221a00bdc23c';
        value.state.push(state);

        const controlPromise = value.controlWithAck(10);

        await new Promise((r) => setTimeout(r, 1));

        const res1 = await controlPromise;

        await new Promise((r) => setTimeout(r, 1));

        expect(res1).toBe(false);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Control',
                data: '10',
            }),
            {}
        );
    });

    it('can get log data', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            id: '',
                            type: 'log',
                            version: '2.1',
                        },
                        data: [],
                        more: false,
                        type: 'state',
                    },
                ],
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            id: '',
                            type: 'log',
                            version: '2.1',
                        },
                        data: [],
                        more: false,
                        type: 'state',
                    },
                ],
            });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const stateR = new State('Report');
        stateR.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(stateR);
        const stateC = new State('Control');
        stateC.meta.id = '1b743fa5-85a1-48e9-935c-b98ba27c0ffe';
        value.state.push(stateC);

        const d = new Date(500000000000);

        const logsR = await value.getReportLog({ limit: 1, end: d });
        const logsC = await value.getControlLog({ start: d });
        await value.getControlLog({ end: '2022-02-02T02:02:02Z' });

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/log/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7/state',
            {
                params: { limit: 1, end: '1985-11-05T00:53:20.000Z' },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            '/2.1/log/1b743fa5-85a1-48e9-935c-b98ba27c0ffe/state',
            {
                params: { start: '1985-11-05T00:53:20.000Z' },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            3,
            '/2.1/log/1b743fa5-85a1-48e9-935c-b98ba27c0ffe/state',
            {
                params: { end: '2022-02-02T02:02:02Z' },
            }
        );

        expect(logsR.meta.type).toBe('log');
        expect(logsR.more).toBe(false);
        expect(logsR.type).toBe('state');
        expect(logsC.meta.type).toBe('log');
        expect(logsC.more).toBe(false);
        expect(logsC.type).toBe('state');
    });

    it('can get empty log data', async () => {
        const value = new Value();
        const logs = await value.getReportLog({});

        expect(logs.data.length).toBe(0);
    });

    it('can use custom find', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: response });

        const value = await Value.find({ name: 'test' });

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/value', {
            params: {
                expand: 1,
                quantity: 1,
                go_internal: true,
                message: 'Find 1 value',
                identifier: 'value-1-Find 1 value',
                this_name: '=test',
                method: ['retrieve', 'update'],
            },
        });

        expect(value[0].toJSON).toBeDefined();
        expect(value[0].meta.id).toEqual(
            'b62e285a-5188-4304-85a0-3982dcb575bc'
        );
    });

    it('can find all values by name', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        const value = await Value.findAllByName('test');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/value', {
            params: {
                expand: 1,
                quantity: 'all',
                go_internal: true,
                message: 'Find all value with name test',
                identifier: 'value-all-Find all value with name test',
                this_name: '=test',
                method: ['retrieve', 'update'],
            },
        });
        expect(value[0].meta.id).toEqual(
            'b62e285a-5188-4304-85a0-3982dcb575bc'
        );
    });

    it('can find all values by type', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        const value = await Value.findAllByType('test');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/value', {
            params: {
                expand: 1,
                quantity: 'all',
                go_internal: true,
                message: 'Find all value with type test',
                identifier: 'value-all-Find all value with type test',
                this_type: '=test',
                method: ['retrieve', 'update'],
            },
        });
        expect(value[0].meta.id).toEqual(
            'b62e285a-5188-4304-85a0-3982dcb575bc'
        );
    });

    it('can handle a state create', async () => {
        const f = jest.fn();
        const v = new Value();
        v.meta.id = 'db6ba9ca-ea15-42d3-9c5e-1e1f50110f38';
        const createP = v.onCreate(f);

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    data: '/2.1/value/db6ba9ca-ea15-42d3-9c5e-1e1f50110f38',
                    url: '/services/2.1/websocket/open/subscription',
                },
            })
        );

        sendRpcResponse(server);

        await createP;

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'create',
            path: '/value/db6ba9ca-ea15-42d3-9c5e-1e1f50110f38/state',
            data: {
                meta: {
                    id: '60323236-54bf-499e-a438-608a24619c94',
                    type: 'state',
                },
                type: 'Report',
            },
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(f).toHaveBeenCalledTimes(1);
        expect(v.state.length).toBe(1);
        expect(v.state[0].type).toEqual('Report');
        expect(v.state[0].toJSON).toBeDefined();
    });

    it('drops message when there is a delta', async () => {
        mockedAxios.patch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        value.delta = '2';
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        await value.report(1);
        await value.report(2);
        await value.report('3');
        await value.report('error');
        await value.report('error');
        value.delta = 'error';
        await value.report(10);
        value.delta = 'Inf';
        await value.report(123123);
        await value.forceReport(444);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(6);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '3',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: 'error',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '10',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '444',
            }),
            {}
        );
    });

    it('can handle delta update from user', async () => {
        const funR = jest.fn();
        mockedAxios.patch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        value.delta = '1';
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        const reportPromise = value.onChange(funR);

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
                },
            })
        );
        sendRpcResponse(server);

        await reportPromise;

        await value.report(1);

        server.send({
            meta_object: {
                type: 'value',
            },
            event: 'update',
            path: '/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
            data: {
                delta: '2',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        await value.report(2);
        await value.report(3);

        expect(value.delta).toEqual('2');
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '3',
            }),
            {}
        );
    });

    it('will trigger period events', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'e094d45e-49cd-465f-8a04-c5a879f796e2',
                        },
                    },
                ],
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'state',
                            version: '2.1',
                            id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                        },
                    },
                ],
            });

        const fun = jest.fn();
        const device = new Device();
        device.meta.id = '1714e470-76ef-4310-8c49-dda18ef8b819';

        const valuePromise = device.createValue(
            'test',
            'r',
            ValueTemplate.TEMPERATURE_CELSIUS
        );

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/value/e094d45e-49cd-465f-8a04-c5a879f796e2',
                },
            })
        );

        sendRpcResponse(server);

        const value = await valuePromise;

        const p1 = value.onRefresh(fun);
        const p2 = value.onRefresh(fun);

        await Promise.all([p1, p2]);

        server.send({
            meta_object: {
                type: 'value',
            },
            event: 'update',
            path: '/value/e094d45e-49cd-465f-8a04-c5a879f796e2',
            data: {
                period: '2',
            },
        });

        let wait = 4000;
        while (wait) {
            await new Promise((r) => setTimeout(r, 1));
            wait -= 1;
            if (fun.mock.calls.length >= 2) {
                break;
            }
        }

        server.send({
            meta_object: {
                type: 'value',
            },
            event: 'update',
            path: '/value/e094d45e-49cd-465f-8a04-c5a879f796e2',
            data: {
                period: '0',
            },
        });
        await new Promise((r) => setTimeout(r, 1));

        value.cancelPeriod();

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(fun).toHaveBeenCalledTimes(2);
        expect(fun).toHaveBeenCalledWith(value, 'period');
    });

    it('can send a report with a high delta when it is triggered by user', async () => {
        mockedAxios.patch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });
        mockedAxios.post
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: '4240a9b6-168e-43a6-b291-afbd960a6cd5',
                        },
                    },
                ],
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'state',
                            version: '2.1',
                            id: '05bcdf20-cf39-4b16-adb2-ac711d5678a6',
                        },
                    },
                ],
            });

        const device = new Device();
        device.meta.id = '416104e7-a94e-47c0-b504-bc4f9b81575a';
        const value = await device.createNumberValue({
            name: 'test',
            type: 'number',
            permission: 'r',
            delta: '50',
            min: 0,
            max: 100,
            step: 1,
            unit: '',
        });

        value.onRefresh((val, type) => {
            value.report(10);
            value.report(100);
        });

        await server.connected;

        await value.report(1);
        await value.report(9);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);

        server.send({
            meta_object: {
                type: 'value',
            },
            event: 'update',
            path: '/value/4240a9b6-168e-43a6-b291-afbd960a6cd5',
            data: {
                status: 'update',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(value.getReportData()).toEqual('100');
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(3);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/05bcdf20-cf39-4b16-adb2-ac711d5678a6',
            expect.objectContaining({
                meta: {
                    id: '05bcdf20-cf39-4b16-adb2-ac711d5678a6',
                    type: 'state',
                    version: '2.1',
                },
                type: 'Report',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/05bcdf20-cf39-4b16-adb2-ac711d5678a6',
            expect.objectContaining({
                meta: {
                    id: '05bcdf20-cf39-4b16-adb2-ac711d5678a6',
                    type: 'state',
                    version: '2.1',
                },
                type: 'Report',
                data: '10',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/05bcdf20-cf39-4b16-adb2-ac711d5678a6',
            expect.objectContaining({
                meta: {
                    id: '05bcdf20-cf39-4b16-adb2-ac711d5678a6',
                    type: 'state',
                    version: '2.1',
                },
                type: 'Report',
                data: '100',
            }),
            {}
        );
    });

    it('can send a report with a high delta when it is triggered by period', async () => {
        config({ jitterMin: 2, jitterMax: 2 });
        mockedAxios.patch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });
        mockedAxios.post
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                    },
                ],
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'state',
                            version: '2.1',
                            id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                        },
                    },
                ],
            });

        const device = new Device();
        device.meta.id = '1714e470-76ef-4310-8c49-dda18ef8b819';
        const value = await device.createNumberValue({
            name: 'test',
            type: 'number',
            permission: 'r',
            min: 0,
            max: 100,
            step: 1,
            unit: '',
            delta: '50',
            period: '2',
        });

        const timestamp_jitter = '2022-02-02T02:02:02.000Z';
        const timestamp = '2022-02-02T03:03:03Z';

        value.onRefresh((val, type) => {
            value.report(10, Date.parse(timestamp_jitter));
            value.report(100, timestamp);
        });

        await server.connected;

        await value.report(1);
        await value.report(9);

        let wait = 2000;
        while (wait !== 0) {
            if (mockedAxios.patch.mock.calls.length >= 2) {
                break;
            }
            await new Promise((r) => setTimeout(r, 1));
            wait -= 1;
        }
        const firstCallCount = mockedAxios.patch.mock.calls.length;

        server.send({
            meta_object: {
                type: 'value',
            },
            event: 'update',
            path: '/value/f589b816-1f2b-412b-ac36-1ca5a6db0273',
            data: {
                period: '0',
            },
        });

        wait = 2500;
        while (wait !== 0) {
            await new Promise((r) => setTimeout(r, 1));
            wait -= 1;
            if (mockedAxios.patch.mock.calls.length >= 3) {
                break;
            }
        }

        await value.report(60);

        value.cancelPeriod();

        expect(firstCallCount).toBe(2);
        expect(value.getReportData()).toEqual('100');
        expect(value.getReportTimestamp()).toEqual(timestamp);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(3);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/8d0468c2-ed7c-4897-ae87-bc17490733f7',
            expect.objectContaining({
                meta: {
                    id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    type: 'state',
                    version: '2.1',
                },
                type: 'Report',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/8d0468c2-ed7c-4897-ae87-bc17490733f7',
            {
                meta: {
                    id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    type: 'state',
                    version: '2.1',
                },
                type: 'Report',
                data: '100',
                timestamp: timestamp,
            },
            {}
        );
        expect(mockedAxios.patch).toHaveBeenLastCalledWith(
            '/2.1/state/8d0468c2-ed7c-4897-ae87-bc17490733f7',
            {
                meta: {
                    id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    type: 'state',
                    version: '2.1',
                },
                type: 'Report',
                data: '10',
                timestamp: timestamp_jitter,
            },
            {}
        );
    });

    it('can add an event', async () => {
        mockedAxios.post.mockResolvedValueOnce({});
        const value = new Value('test');
        value.meta.id = '23dba0b8-79df-425b-b443-3aaa385d8636';

        const event = await value.addEvent('error', 'test', { info: 'test' });

        expect(event.message).toEqual('test');
        expect(event.level).toEqual('error');
        expect(event.info).toEqual({ info: 'test' });

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/value/23dba0b8-79df-425b-b443-3aaa385d8636/eventlog',
            {
                level: 'error',
                message: 'test',
                info: { info: 'test' },
                meta: { type: 'eventlog', version: '2.1' },
            },
            {}
        );
    });

    it('can change the value type after it is created', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                    },
                ],
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'state',
                            version: '2.1',
                            id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                        },
                    },
                ],
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'state',
                            version: '2.1',
                            id: 'c50bf7a7-a409-41f7-b017-9b256949538f',
                        },
                    },
                ],
            });
        mockedAxios.put
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                    },
                ],
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                    },
                ],
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                    },
                ],
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                    },
                ],
            });

        const device = new Device();
        device.meta.id = '1714e470-76ef-4310-8c49-dda18ef8b819';
        const value_number = await device.createValue(
            'test',
            'r',
            ValueTemplate.NUMBER
        );
        expect(value_number.number?.max).toBe(128);

        const value_string = await device.createValue(
            'test',
            'rw',
            ValueTemplate.STRING
        );
        expect(value_string.number).toBe(undefined);
        expect(value_string.string?.max).toBe(64);

        const value_blob = await device.createValue(
            'test',
            'rw',
            ValueTemplate.BLOB
        );
        expect(value_blob.string).toBe(undefined);
        expect(value_blob.blob?.max).toBe(280);

        const value_xml = await device.createValue(
            'test',
            'rw',
            ValueTemplate.XML
        );
        expect(value_xml.blob).toBe(undefined);
        expect(value_xml.xml?.xsd).toBe('');

        const value_number2 = await device.createValue({
            name: 'test',
            permission: 'r',
            template: ValueTemplate.NUMBER,
        });
        expect(value_number2.number?.max).toBe(128);

        expect(value_number).toBe(value_string);
        expect(value_blob).toBe(value_string);
        expect(value_xml).toBe(value_string);

        expect(mockedAxios.put).toHaveBeenCalledTimes(4);
        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/device/1714e470-76ef-4310-8c49-dda18ef8b819/value',
            {
                delta: '0',
                meta: {
                    type: 'value',
                    version: '2.1',
                },
                name: 'test',
                number: {
                    max: 128,
                    min: -128,
                    step: 0.1,
                    unit: '',
                },
                period: '0',
                permission: 'r',
                type: 'number',
            },
            {}
        );
        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273',
            {
                delta: '0',
                meta: {
                    id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    type: 'value',
                    version: '2.1',
                },
                name: 'test',
                blob: {
                    encoding: 'base64',
                    max: 280,
                },
                period: '0',
                permission: 'rw',
                type: 'blob',
            },
            {}
        );
    });

    it('can reload the value', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { name: 'test 1' } });

        const value = new Value();
        value.name = 'start';
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        await value.reload();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
            { params: { expand: 1 } }
        );
        expect(value.name).toEqual('test 1');

        mockedAxios.get.mockResolvedValueOnce({ data: { name: 'test 2' } });
        await value.reload();

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);

        expect(value.name).toEqual('test 2');
    });

    it('can reload the value and the children', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                state: [
                    {
                        meta: {
                            id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                        },
                        data: '1',
                    },
                ],
            },
        });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        await value.reload(true);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
            { params: { expand: 1 } }
        );
        expect(value.getControlData()).toEqual('1');

        mockedAxios.get.mockResolvedValueOnce({
            data: {
                state: [
                    {
                        meta: {
                            id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                        },
                        data: '2',
                    },
                ],
            },
        });
        await value.reload(true);

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(value.getControlData()).toEqual('2');
    });

    it('can load all children', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                state: [
                    {
                        meta: {
                            id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                        },
                        data: '2',
                    },
                ],
            },
        });
        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        await value.loadAllChildren(null, true);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                params: {
                    expand: 0,
                },
            }
        );
    });

    it('can load all children as id', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({
                data: {
                    state: [
                        {
                            meta: {
                                id: '44b3541b-ebe3-4d30-bbe6-8baa77a36e6d',
                            },
                            data: '2',
                        },
                        '0d362fb9-3c52-4c4c-89aa-19f33cbe2f4f',
                    ],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    meta: {
                        id: '0d362fb9-3c52-4c4c-89aa-19f33cbe2f4f',
                    },
                    data: '3',
                },
            });
        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        await value.reload(true);

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
            {
                params: {
                    expand: 1,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/state/0d362fb9-3c52-4c4c-89aa-19f33cbe2f4f',
            {
                params: {
                    go_internal: true,
                },
            }
        );
    });

    it('can call the onReport callback on init', async () => {
        const fun = jest.fn();
        const value = new Value();
        const state = new State('Report');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        state.data = 'data';
        state.timestamp = 'timestamp';
        value.state.push(state);

        const p1 = value.onReport(fun, true);
        const p2 = value.onReport(fun, true);
        const p3 = value.onReport(fun);

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    data: '/2.1/state/cda4d978-39e9-47bf-8497-9813b0f94973',
                    url: '/services/2.1/websocket/open/subscription',
                },
            })
        );
        sendRpcResponse(server);

        await p1;
        await p2;
        await p3;

        expect(fun).toHaveBeenCalledTimes(2);
        expect(fun).toHaveBeenCalledWith(value, 'data', 'timestamp');
    });

    it('can send old data without delta', async () => {
        mockedAxios.patch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        value.delta = '2';
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        const timestamp1 = '2022-02-02T03:03:03Z';
        const timestamp2 = '2022-02-02T02:02:02Z';
        const timestamp3 = '2022-02-02T01:01:01Z';

        await value.report(1, timestamp1);
        await value.report(1, timestamp2);
        await value.report(1, timestamp3);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(3);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '1',
                timestamp: timestamp1,
            },
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '1',
                timestamp: timestamp2,
            },
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '1',
                timestamp: timestamp3,
            },
            {}
        );
    });

    it('can not override data by sending fast', async () => {
        mockedAxios.patch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        value.control('1');
        value.control('2');
        value.control('3');
        value.control('4');

        await new Promise((r) => setTimeout(r, 1));

        expect(mockedAxios.patch).toHaveBeenCalledTimes(4);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Control',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Control',
                data: '2',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Control',
                data: '3',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Control',
                data: '4',
            }),
            {}
        );
    });

    it('can find value by id', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [response] });

        const r = Value.findById('b62e285a-5188-4304-85a0-3982dcb575bc');

        await new Promise((r) => setTimeout(r, 1));

        await server.connected;
        server.send({
            path: '/notification/',
            data: {
                base: {
                    code: 1100013,
                    identifier:
                        'value-1-Find value with id b62e285a-5188-4304-85a0-3982dcb575bc',
                    ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                },
            },
        });
        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                base: {
                    code: 1100013,
                    identifier:
                        'value-1-Find value with id b62e285a-5188-4304-85a0-3982dcb575bc',
                    ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                },
            },
        });
        const value = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/value', {
            params: {
                expand: 1,
                quantity: 1,
                go_internal: true,
                message:
                    'Find value with id b62e285a-5188-4304-85a0-3982dcb575bc',
                identifier:
                    'value-1-Find value with id b62e285a-5188-4304-85a0-3982dcb575bc',
                'this_meta.id': '=b62e285a-5188-4304-85a0-3982dcb575bc',
                method: ['retrieve', 'update'],
            },
        });
        expect(value.toJSON).toBeDefined();
        expect(value.meta.id).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can find using filter', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: responses['fetch_value'],
        });

        const values = await Value.findByFilter({
            value: { type: 'energy' },
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/value',
            {
                filter: { attribute: ['value_type=energy'] },
                return: '{value (attribute: ["this_type=energy"]) { meta{id type version connection name_by_user} name permission type period delta number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}',
            },
            {
                params: {
                    expand: 1,
                    fetch: true,
                    go_internal: true,
                    identifier: 'value-1-Find 1 value using filter',
                    message: 'Find 1 value using filter',
                    method: ['retrieve', 'update'],
                    quantity: 1,
                },
            }
        );

        expect(values.length).toEqual(1);
    });

    it('can find all using filter', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: responses['fetch_value'],
        });

        const values = await Value.findAllByFilter({
            value: { type: 'energy' },
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/value',
            {
                filter: { attribute: ['value_type=energy'] },
                return: '{value (attribute: ["this_type=energy"]) { meta{id type version connection name_by_user} name permission type period delta number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}',
            },
            {
                params: {
                    expand: 1,
                    fetch: true,
                    go_internal: true,
                    identifier: 'value-all-Find all value using filter',
                    message: 'Find all value using filter',
                    method: ['retrieve', 'update'],
                    quantity: 'all',
                },
            }
        );

        expect(values.length).toEqual(32);
    });

    it('can send log values to log_zip', async () => {
        mockedAxios.patch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });
        mockedAxios.post.mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        const data = [
            { timestamp: '2022-02-02T02:02:01Z', data: 1 },
            { timestamp: '2022-02-02T02:02:02Z', data: 2 },
            { timestamp: '2022-02-02T02:02:03Z', data: 3 },
            { timestamp: '2022-02-02T02:02:04Z', data: 4 },
        ];
        await value.report(data);

        expect(data.length).toBe(4);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                data: '4',
                meta: {
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                    type: 'state',
                    version: '2.1',
                },
                timestamp: '2022-02-02T02:02:04Z',
                type: 'Report',
            },
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/log_zip',
            'state_id,data,timestamp#6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7,1,2022-02-02T02:02:01Z#6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7,2,2022-02-02T02:02:02Z#6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7,3,2022-02-02T02:02:03Z#'
                .split('#')
                .join('\n'),
            { headers: { 'Content-type': 'text/csv' } }
        );

        await value.report([{ timestamp: '2022-02-02T02:02:01Z', data: 1 }]);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('can send log values for Control', async () => {
        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        await value.report([
            { timestamp: '2022-02-02T02:02:01Z', data: 1 },
            { timestamp: '2022-02-02T02:02:02Z', data: 2 },
        ]);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    });
});
