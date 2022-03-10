import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import 'reflect-metadata';
import { Device, Value, State, config, ValueTemplate } from '../src/index';
import { openStream } from '../src/stream_helpers';

describe('value', () => {
    const response = {
        meta: {
            type: 'value',
            version: '2.0',
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
            '/2.0/value',
            {
                meta: {
                    type: 'value',
                    version: '2.0',
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
        mockedAxios.patch.mockResolvedValueOnce({ data: response });

        const value = new Value('test');
        await value.create();
        const oldName = response.name;
        response.name = 'new name';
        response.permission = 'r';
        value.name = 'new name';
        await value.update();

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/value/' + value.meta.id,
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
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
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
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
            params: { expand: 2, verbose: true },
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
            '/2.0/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                meta: {
                    type: 'state',
                    version: '2.0',
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

    it('can find value by id', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        const value = await Value.findById(
            'b62e285a-5188-4304-85a0-3982dcb575bc'
        );

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(value.name).toEqual('test');
        expect(value.toJSON).toBeDefined();

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/value/b62e285a-5188-4304-85a0-3982dcb575bc',
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
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
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
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
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
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
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
        await value.control(10);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(value.getReportData()).toBe('test');
        expect(value.getControlData()).toBe(undefined);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '10',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                meta: {
                    type: 'state',
                    version: '2.0',
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
        await value.control(10);
        await value.control('test', 'timestamp');
        await value.report(10);
        value.delta = '1';
        await value.report(20);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
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
            '/2.0/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                meta: {
                    type: 'state',
                    version: '2.0',
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
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
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
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
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
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
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
        mockedAxios.get.mockResolvedValueOnce({ data: [] });
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
            '/2.0/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '3',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: 'error',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '10',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '444',
            }),
            {}
        );
    });

    it('can handle delta update from user', async () => {
        mockedAxios.patch
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

        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                    id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                },
                type: 'Report',
                data: '3',
            }),
            {}
        );
    });

    it('will not override user delta and period from code', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                meta: {
                    id: '35a99d31-b51a-4e20-ad54-a93e8eed21a3',
                },
                name: 'device',
                value: [
                    {
                        meta: {
                            type: 'value',
                            version: '2.0',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                        permission: '',
                        delta: '2',
                        period: '10',
                    },
                ],
            },
        });
        mockedAxios.post
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'value',
                            version: '2.0',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                        permission: '',
                        delta: '2',
                        period: '10',
                    },
                ],
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'state',
                            version: '2.0',
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
            period: 'period',
            delta: 'delta',
            min: 0,
            max: 1,
            step: 1,
            unit: 'unit',
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);

        expect(value.delta).toBe('2');
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/value/f589b816-1f2b-412b-ac36-1ca5a6db0273',
            {
                meta: {
                    type: 'value',
                    version: '2.0',
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
                            version: '2.0',
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
                            version: '2.0',
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

        await new Promise((r) => setTimeout(r, 4000));

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

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(fun).toHaveBeenCalledTimes(2);
        expect(fun).toHaveBeenCalledWith(value, 'period');
    });

    it('can send a report with a high delta when it is triggered by period', async () => {
        config({ jitterMin: 1, jitterMax: 1 });
        mockedAxios.patch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });
        mockedAxios.post
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'value',
                            version: '2.0',
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
                            version: '2.0',
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

        await value.report(1);
        await value.report(9);

        value.onRefresh((val, type) => {
            value.report(10);
        });

        await server.connected;

        await new Promise((r) => setTimeout(r, 2000));

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

        await new Promise((r) => setTimeout(r, 2000));

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/8d0468c2-ed7c-4897-ae87-bc17490733f7',
            expect.objectContaining({
                meta: {
                    id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    type: 'state',
                    version: '2.0',
                },
                type: 'Report',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/8d0468c2-ed7c-4897-ae87-bc17490733f7',
            expect.objectContaining({
                meta: {
                    id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    type: 'state',
                    version: '2.0',
                },
                type: 'Report',
                data: '10',
            }),
            {}
        );
    });
});
