import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import 'reflect-metadata';
import {
    Device,
    Value,
    State,
    config,
    ValueTemplate,
    stopLogging,
} from '../src/index';
import { openStream } from '../src/stream_helpers';

describe('value', () => {
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

    const server = new WS('ws://localhost:12345', { jsonProtocol: true });

    beforeAll(() => {
        stopLogging();
        openStream.websocketUrl = 'ws://localhost:12345';
    });

    afterEach(() => {
        jest.clearAllMocks();
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
            '/2.1/value/' + value.meta.id,
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
            params: { expand: 2 },
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
            params: { expand: 2, verbose: true },
        });
        expect(values[0]?.name).toEqual('test');
    });

    it('can return an old state when creating', async () => {
        mockedAxios.put.mockResolvedValueOnce({ data: [] });

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
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        mockedAxios.put.mockResolvedValueOnce({ data: [] });

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
        mockedAxios.put.mockResolvedValueOnce({ data: [] });

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
        mockedAxios.put.mockResolvedValueOnce({ data: [] });

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

    it('can find value by id', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        const value = await Value.findById(
            'b62e285a-5188-4304-85a0-3982dcb575bc'
        );

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(value.name).toEqual('test');
        expect(value.toJSON).toBeDefined();

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/value/b62e285a-5188-4304-85a0-3982dcb575bc',
            {
                params: { expand: 2 },
            }
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
                expand: 2,
                quantity: 1,
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
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        const value = await Value.findByName('test', 2, 'msg');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/value', {
            params: {
                expand: 2,
                quantity: 2,
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
                expand: 2,
                quantity: 1,
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
        mockedAxios.put
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
        expect(mockedAxios.put).toHaveBeenCalledTimes(2);
        expect(value.getReportData()).toBe('test');
        expect(value.getControlData()).toBe(undefined);
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        mockedAxios.put
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
        expect(mockedAxios.put).toHaveBeenCalledTimes(2);
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        expect(mockedAxios.put).toHaveBeenCalledWith(
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

        const logsR = await value.getReportLog({ limit: 1 });
        const logsC = await value.getControlLog({ start: d });

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/log/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7/state',
            {
                params: { limit: 1 },
            }
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/log/1b743fa5-85a1-48e9-935c-b98ba27c0ffe/state',
            {
                params: { start: d },
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
                expand: 2,
                quantity: 1,
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
                expand: 2,
                quantity: 'all',
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
                expand: 2,
                quantity: 'all',
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
        v.onCreate(f);

        await server.connected;

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
        mockedAxios.put
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

        expect(mockedAxios.put).toHaveBeenCalledTimes(6);
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        mockedAxios.put
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        value.delta = '2';
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        await value.report(1);

        await server.connected;
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

        await value.report(2);
        await value.report(3);

        expect(mockedAxios.put).toHaveBeenCalledTimes(2);
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        expect(mockedAxios.put).toHaveBeenCalledWith(
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

    it('will not override user delta and period from code', async () => {
        mockedAxios.put.mockResolvedValueOnce({
            data: [
                {
                    meta: {
                        type: 'value',
                        version: '2.1',
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    },
                    permission: '',
                    delta: '2',
                    period: '10',
                },
            ],
        });
        mockedAxios.post.mockResolvedValueOnce({
            data: [
                {
                    meta: {
                        type: 'state',
                        version: '2.1',
                        id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    },
                    type: 'Report',
                },
            ],
        });

        const device = new Device();
        device.meta.id = '35a99d31-b51a-4e20-ad54-a93e8eed21a3';
        const oldValue = new Value('Value Name');
        oldValue.delta = '2';
        oldValue.period = '10';
        oldValue.meta.id = 'f589b816-1f2b-412b-ac36-1ca5a6db0273';
        device.value.push(oldValue);

        const value = await device.createNumberValue({
            name: 'Value Name',
            permission: 'r',
            type: 'type',
            period: '0',
            delta: 'delta',
            min: 0,
            max: 1,
            step: 1,
            unit: 'unit',
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);

        expect(value.delta).toBe('2');
        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273',
            {
                meta: {
                    type: 'value',
                    version: '2.1',
                    id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                },
                name: 'Value Name',
                permission: 'r',
                type: 'type',
                delta: '2',
                period: '10',
                number: {
                    min: 0,
                    max: 1,
                    step: 1,
                    unit: 'unit',
                },
            },
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

        const fun = jest.fn();
        const device = new Device();
        device.meta.id = '1714e470-76ef-4310-8c49-dda18ef8b819';
        const value = await device.createValue(
            'test',
            'r',
            ValueTemplate.TEMPERATURE_CELSIUS
        );

        value.onRefresh(fun);
        value.onRefresh(fun);
        value.onRefresh(fun);

        await server.connected;
        server.send({
            meta_object: {
                type: 'value',
            },
            event: 'update',
            path: '/value/f589b816-1f2b-412b-ac36-1ca5a6db0273',
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
            path: '/value/f589b816-1f2b-412b-ac36-1ca5a6db0273',
            data: {
                period: '0',
            },
        });

        value.cancelPeriod();

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(fun).toHaveBeenCalledTimes(2);
        expect(fun).toHaveBeenCalledWith(value, 'period');
    });

    it('can send a report with a high delta when it is triggered by user', async () => {
        mockedAxios.put
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

        expect(mockedAxios.put).toHaveBeenCalledTimes(1);

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

        expect(value.getReportData()).toEqual('100');
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.put).toHaveBeenCalledTimes(3);
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        mockedAxios.put
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

        value.onRefresh((val, type) => {
            value.report(10, 'timestamp-jitter');
            value.report(100, 'timestamp');
        });

        await server.connected;

        await value.report(1);
        await value.report(9);

        let wait = 2000;
        while (wait !== 0) {
            if (mockedAxios.put.mock.calls.length >= 2) {
                break;
            }
            await new Promise((r) => setTimeout(r, 1));
            wait -= 1;
        }
        const firstCallCount = mockedAxios.put.mock.calls.length;

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
            if (mockedAxios.put.mock.calls.length >= 3) {
                break;
            }
        }

        await value.report(60);

        value.cancelPeriod();

        expect(firstCallCount).toBe(2);
        expect(value.getReportData()).toEqual('100');
        expect(value.getReportTimestamp()).toEqual('timestamp');
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.put).toHaveBeenCalledTimes(3);
        expect(mockedAxios.put).toHaveBeenCalledWith(
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
        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.1/state/8d0468c2-ed7c-4897-ae87-bc17490733f7',
            {
                meta: {
                    id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    type: 'state',
                    version: '2.1',
                },
                type: 'Report',
                data: '100',
                timestamp: 'timestamp',
            },
            {}
        );
        expect(mockedAxios.put).toHaveBeenLastCalledWith(
            '/2.1/state/8d0468c2-ed7c-4897-ae87-bc17490733f7',
            {
                meta: {
                    id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    type: 'state',
                    version: '2.1',
                },
                type: 'Report',
                data: '10',
                timestamp: 'timestamp-jitter',
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

        const value_number2 = await device.createValue(
            'test',
            'r',
            ValueTemplate.NUMBER
        );
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
            { params: { expand: 2 } }
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
            {}
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
                    expand: 2,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/state/0d362fb9-3c52-4c4c-89aa-19f33cbe2f4f',
            {
                params: {
                    expand: 1,
                },
            }
        );
    });

    it('can call teh onReport callback on init', () => {
        const fun = jest.fn();
        const value = new Value();
        const state = new State('Report');
        value.meta.id = '6c06b63e-39ec-44a5-866a-c081aafb6726';
        state.meta.id = 'cda4d978-39e9-47bf-8497-9813b0f94973';
        state.data = 'data';
        state.timestamp = 'timestamp';
        value.state.push(state);
        value.onReport(fun, true);

        expect(fun).toHaveBeenCalledTimes(1);
        expect(fun).toHaveBeenCalledWith(value, 'data', 'timestamp');
    });
});
