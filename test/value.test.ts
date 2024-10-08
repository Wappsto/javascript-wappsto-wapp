import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import 'reflect-metadata';
import { Device, Value, State, config, ValueTemplate } from '../src/index';
import { before, after, newWServer, sendRpcResponse } from './util/stream';
import {
    responses,
    generateStreamEvent,
    makeValueResponse,
    makeStateResponse,
} from './util/response';
import { makeErrorResponse, makeResponse, delay } from './util/helpers';

const response2Values = [
    {
        meta: {
            type: 'value',
            version: '2.1',
            id: '9b8c339a-e740-4799-8984-2c34e9f8fed9',
        },
        name: 'test',
        permission: '',
        type: '',
        period: '0',
        delta: '0',
    },
    'bd1f46f9-f41a-4f59-bdbd-6529d58b91c5',
];

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
        const response = makeValueResponse();
        mockedAxios.post.mockResolvedValueOnce(makeResponse(response));

        const value = new Value('test');
        await value.create();

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
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
        expect(value.meta.id).toEqual(response.meta.id);
    });

    it('can update a value on wappsto', async () => {
        const response = makeValueResponse();
        mockedAxios.post.mockResolvedValueOnce(makeResponse(response));
        mockedAxios.put.mockResolvedValueOnce(makeResponse(response));

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
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
            `/2.1/value/${response.meta.id}`,
            {
                ...response,
                state: undefined,
            },
            {}
        );

        response.name = oldName;
        response.permission = '';
    });

    it('can create a new value from wappsto', async () => {
        const response = makeValueResponse();
        mockedAxios.get.mockResolvedValueOnce(makeResponse([response]));

        const values = await Value.fetch();

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/value', {
            params: { go_internal: true, expand: 1, method: ['retrieve'] },
        });
        expect(values[0]?.name).toEqual('test');
    });

    it('can create a new value from wappsto with verbose', async () => {
        const response = makeValueResponse();
        mockedAxios.get.mockResolvedValueOnce(makeResponse([response]));

        config({ verbose: true });
        const values = await Value.fetch();
        config({ verbose: false });

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/value', {
            params: {
                expand: 1,
                go_internal: true,
                verbose: true,
                method: ['retrieve'],
            },
        });
        expect(values[0]?.name).toEqual('test');
    });

    it('can return an old state when creating', async () => {
        mockedAxios.patch.mockResolvedValueOnce(makeResponse([]));

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
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(state.meta.id).toBe('6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7');
    });

    it('can trigger an refresh event to the device', async () => {
        mockedAxios.patch.mockResolvedValueOnce(makeResponse([]));

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';

        await value.refresh();

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
            {
                status: 'update',
            },
            {}
        );
    });

    it('can find a value by name', async () => {
        const response = makeValueResponse();
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([response]));

        const r = Value.findByName('test');
        await server.connected;
        server.send(
            generateStreamEvent('notification', '', {
                base: {
                    code: 1100004,
                    identifier: 'value-1-Find 1 value with name test',
                    ids: [response.meta.id],
                },
            })
        );
        const value = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/value', {
            params: {
                expand: 1,
                quantity: 1,
                go_internal: true,
                manufacturer: false,
                message: 'Find 1 value with name test',
                identifier: 'value-1-Find 1 value with name test',
                this_name: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(2, '/2.1/value', {
            params: {
                expand: 1,
                go_internal: true,
                manufacturer: false,
                this_name: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
                id: [response.meta.id],
            },
        });
        expect(value[0].meta.id).toEqual(response.meta.id);
    });

    it('can find a value by name and extra parameters', async () => {
        const response = makeValueResponse();
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([response, response])
        );

        const value = await Value.findByName('test', 2, true, 'msg');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/value', {
            params: {
                expand: 1,
                quantity: 2,
                go_internal: true,
                manufacturer: false,
                message: 'msg',
                identifier: 'value-2-msg',
                this_name: '=test',
                method: ['retrieve'],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(value[0].meta.id).toEqual(response.meta.id);
    });

    it('can find a value by type', async () => {
        const response = makeValueResponse();
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([response]));

        const r = Value.findByType('test');
        await server.connected;
        await delay(100);

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                base: {
                    code: 1100004,
                    identifier: 'value-1-Find 1 value with type test',
                    ids: [response.meta.id],
                },
            },
        });
        const value = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/value', {
            params: {
                expand: 1,
                quantity: 1,
                go_internal: true,
                manufacturer: false,
                message: 'Find 1 value with type test',
                identifier: 'value-1-Find 1 value with type test',
                this_type: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(2, '/2.1/value', {
            params: {
                expand: 1,
                go_internal: true,
                manufacturer: false,
                this_type: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
                id: [response.meta.id],
            },
        });
        expect(value[0].meta.id).toEqual(response.meta.id);
    });

    it('can send a report', async () => {
        mockedAxios.patch
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        await value.report(10);
        const orgWarn = console.warn;
        console.warn = jest.fn();
        await value.report(undefined as unknown as string, new Date('wrong'));
        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenNthCalledWith(
            1,
            'WAPPSTO WARN: Failed to convert timestamp (Invalid Date) to string'
        );
        console.warn = orgWarn;
        await value.report({ test: 'test' });
        value.number = {
            min: 0,
            max: 1,
            step: 1,
            unit: 'test',
        };
        await value.report(true);
        await value.report([]);
        await value.report('test', 'timestamp');
        const res = await value.control(10);

        expect(res).toBe(false);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(6);
        expect(value.getReportData()).toBe('test');
        expect(value.getControlData()).toBe(undefined);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Report',
                data: '10',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Report',
                data: 'NA',
                timestamp: '',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            3,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Report',
                data: '{"test":"test"}',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            4,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Report',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            5,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Report',
                data: '[]',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            6,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
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
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        const res1 = await value.control(10);
        const res2 = await value.control(true);
        const res3 = await value.control('test', 'timestamp');
        await value.report(10);
        value.delta = '1';
        await value.report(20);

        expect(res1).toBe(true);
        expect(res2).toBe(true);
        expect(res3).toBe(true);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(3);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Control',
                data: '10',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Control',
                data: 'true',
            }),
            {}
        );
        expect(value.getControlData()).toBe('test');
        expect(value.getReportData()).toBe(undefined);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            3,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
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
        mockedAxios.patch
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));

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

        await delay();

        const controlPromise2 = value.controlWithAck(20);

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
                data: '20',
            },
        });

        await delay();

        const res2 = await controlPromise2;

        expect(res1).toBe('1');
        expect(res2).toBe('20');
        expect(fun).toHaveBeenCalledTimes(3);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Control',
                data: '10',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Control',
                data: '20',
            }),
            {}
        );
    });

    it('can send a controlWithAck that fails', async () => {
        const fun = jest.fn();
        mockedAxios.patch
            .mockRejectedValueOnce(
                makeErrorResponse(
                    [],
                    'reject first attempt',
                    'can send a controlWithAck that fails'
                )
            )
            .mockResolvedValueOnce(makeResponse([]));

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        let state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        state = new State('Report');
        state.meta.id = 'f1ada7da-7192-487d-93d5-221a00bdc23c';
        value.state.push(state);

        await value.onReport(fun);

        const orgError = console.error;
        console.error = jest.fn();
        const controlPromise = value.controlWithAck(10);

        await delay();

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

        expect(console.error).toHaveBeenLastCalledWith(
            'WAPPSTO ERROR: Model.update: reject first attempt for can send a controlWithAck that fails'
        );
        console.error = orgError;

        const controlPromise2 = value.controlWithAck(20);

        await delay();

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

        const res2 = await controlPromise2;

        expect(res1).toBe(undefined);
        expect(res2).toBe('2');
        expect(fun).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Control',
                data: '10',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Control',
                data: '20',
            }),
            {}
        );
    });

    it('can send a controlWithAck that timeout', async () => {
        config({ ackTimeout: 1 });
        mockedAxios.patch
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        let state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        state = new State('Report');
        state.meta.id = 'f1ada7da-7192-487d-93d5-221a00bdc23c';
        value.state.push(state);

        const controlPromise = value.controlWithAck(10);
        const res1 = await controlPromise;

        const controlPromise2 = value.controlWithAck(20);
        await delay(100);

        server.send({
            meta_object: {
                type: 'state',
            },
            event: 'update',
            path: '/state/f1ada7da-7192-487d-93d5-221a00bdc23c',
            data: makeStateResponse({
                id: 'f1ada7da-7192-487d-93d5-221a00bdc23c',
                type: 'Report',
                data: '2',
            }),
        });

        const res2 = await controlPromise2;

        expect(res1).toBe(null);
        expect(res2).toBe('2');
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Control',
                data: '10',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Control',
                data: '20',
            }),
            {}
        );
    });

    it('can use custom find', async () => {
        const response = makeValueResponse();
        mockedAxios.get.mockResolvedValueOnce(makeResponse(response));

        const value = await Value.find({ name: 'test' });

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/value', {
            params: {
                expand: 1,
                quantity: 1,
                go_internal: true,
                manufacturer: false,
                message: 'Find 1 value',
                identifier: 'value-1-Find 1 value',
                this_name: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });

        expect(value[0].toJSON).toBeDefined();
        expect(value[0].meta.id).toEqual(response.meta.id);
    });

    it('can find all values by name', async () => {
        const response = makeValueResponse();
        mockedAxios.get.mockResolvedValueOnce(makeResponse([response]));

        const value = await Value.findAllByName('test');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/value', {
            params: {
                expand: 1,
                quantity: 'all',
                go_internal: true,
                manufacturer: false,
                message: 'Find all value with name test',
                identifier: 'value-all-Find all value with name test',
                this_name: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(value[0].meta.id).toEqual(response.meta.id);
    });

    it('can find all values by type', async () => {
        const response = makeValueResponse();
        mockedAxios.get.mockResolvedValueOnce(makeResponse([response]));

        const value = await Value.findAllByType('test');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/value', {
            params: {
                expand: 1,
                quantity: 'all',
                go_internal: true,
                manufacturer: false,
                message: 'Find all value with type test',
                identifier: 'value-all-Find all value with type test',
                this_type: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(value[0].meta.id).toEqual(response.meta.id);
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

    it('can add an event', async () => {
        mockedAxios.post.mockResolvedValueOnce(makeResponse({}));
        const value = new Value('test');
        value.meta.id = '23dba0b8-79df-425b-b443-3aaa385d8636';

        const event = await value.addEvent('error', 'test', { info: 'test' });

        expect(event.message).toEqual('test');
        expect(event.level).toEqual('error');
        expect(event.info).toEqual({ info: 'test' });

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
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
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'state',
                            version: '2.1',
                            id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'state',
                            version: '2.1',
                            id: 'c50bf7a7-a409-41f7-b017-9b256949538f',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'state',
                            version: '2.1',
                            id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                        },
                    },
                ])
            );
        mockedAxios.put
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                    },
                ])
            );

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
            permission: 'rw',
            template: ValueTemplate.NUMBER,
        });
        expect(value_number2.number?.max).toBe(128);

        expect(value_number).toBe(value_string);
        expect(value_blob).toBe(value_string);
        expect(value_xml).toBe(value_string);

        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
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
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                data: 'NA',
                meta: {
                    type: 'state',
                    version: '2.1',
                },
                type: 'Report',
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            3,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                data: 'NA',
                meta: {
                    type: 'state',
                    version: '2.1',
                },
                type: 'Control',
            }),
            {}
        );
        expect(mockedAxios.put).toHaveBeenCalledTimes(4);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            2,
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
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273',
            {
                delta: '0',
                meta: {
                    id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    type: 'value',
                    version: '2.1',
                },
                name: 'test',
                period: '0',
                permission: 'rw',
                string: { encoding: '', max: 64 },
                type: 'string',
            },
            {}
        );
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            3,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273',
            {
                delta: '0',
                meta: {
                    id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    type: 'value',
                    version: '2.1',
                },
                name: 'test',
                period: '0',
                permission: 'rw',
                type: 'xml',
                xml: { namespace: '', xsd: '' },
            },
            {}
        );
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            4,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273',
            {
                delta: '0',
                meta: {
                    id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    type: 'value',
                    version: '2.1',
                },
                name: 'test',
                number: { max: 128, min: -128, step: 0.1, unit: '' },
                period: '0',
                permission: 'rw',
                type: 'number',
            },
            {}
        );
    });

    it('can reload the value', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse({ name: 'test 1' }));

        const value = new Value();
        value.name = 'start';
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        await value.reload();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
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
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse({
                state: [
                    {
                        meta: {
                            id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                        },
                        data: '1',
                    },
                ],
            })
        );

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        await value.reload(true);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
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
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse({
                state: [
                    {
                        meta: {
                            id: '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
                        },
                        data: '2',
                    },
                ],
            })
        );
        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        await value.loadAllChildren(null, true);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
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
            .mockResolvedValueOnce(
                makeResponse({
                    state: [
                        {
                            meta: {
                                id: '44b3541b-ebe3-4d30-bbe6-8baa77a36e6d',
                            },
                            data: '2',
                        },
                        '0d362fb9-3c52-4c4c-89aa-19f33cbe2f4f',
                    ],
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: '0d362fb9-3c52-4c4c-89aa-19f33cbe2f4f',
                    },
                    data: '3',
                })
            );
        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        await value.reload(true);

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
            {
                params: {
                    expand: 1,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/0d362fb9-3c52-4c4c-89aa-19f33cbe2f4f',
            {
                params: {
                    go_internal: true,
                    method: ['retrieve'],
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
        expect(fun).toHaveBeenNthCalledWith(1, value, 'data', 'timestamp');
        expect(fun).toHaveBeenNthCalledWith(2, value, 'data', 'timestamp');
    });

    it('can not override data by sending fast', async () => {
        mockedAxios.patch
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        value.control('1');
        value.control('2');
        value.control('3');
        value.control('4');

        await delay();

        expect(mockedAxios.patch).toHaveBeenCalledTimes(4);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Control',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Control',
                data: '2',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            3,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Control',
                data: '3',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            4,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Control',
                data: '4',
            }),
            {}
        );
    });

    it('can find value by id', async () => {
        const response = makeValueResponse();
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([response]));

        const r = Value.findById(response.meta.id);

        await delay();

        await server.connected;
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
                    ids: [response.meta.id],
                },
            },
        });
        const value = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/value', {
            params: {
                expand: 1,
                quantity: 1,
                go_internal: true,
                manufacturer: false,
                message: `Find value with id ${response.meta.id}`,
                identifier: `value-1-Find value with id ${response.meta.id}`,
                'this_meta.id': `=${response.meta.id}`,
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(2, '/2.1/value', {
            params: {
                expand: 1,
                go_internal: true,
                manufacturer: false,
                'this_meta.id': `=${response.meta.id}`,
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
                id: [response.meta.id],
            },
        });
        expect(value.toJSON).toBeDefined();
        expect(value.meta.id).toEqual(response.meta.id);
    });

    it('can find using filter', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(responses['fetch_value'])
        );

        const values = await Value.findByFilter({
            value: { type: 'energy' },
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);

        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/value',
            {
                filter: { attribute: ['value_type=energy'] },
                return: '{value (attribute: ["this_type=energy"]) { meta{id type version connection name_by_user} name permission description type measure_type period delta thresholds number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}',
            },
            {
                params: {
                    expand: 1,
                    fetch: true,
                    go_internal: true,
                    manufacturer: false,
                    identifier: 'value-1-Find 1 value using filter',
                    message: 'Find 1 value using filter',
                    method: ['retrieve', 'update'],
                    acl_attributes: ['parent_name_by_user'],
                    quantity: 1,
                },
            }
        );

        expect(values.length).toEqual(1);
    });

    it('can find all using filter', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(responses['fetch_value'])
        );

        const values = await Value.findAllByFilter(
            {
                value: { type: 'energy' },
            },
            {
                device: { name: 'device name' },
            }
        );

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);

        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/value',
            {
                filter: {
                    attribute: [
                        'device_name!=device name',
                        'value_type=energy',
                    ],
                },
                return: '{value (attribute: ["this_type=energy"]) { meta{id type version connection name_by_user} name permission description type measure_type period delta thresholds number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}',
            },
            {
                params: {
                    expand: 1,
                    fetch: true,
                    go_internal: true,
                    manufacturer: false,
                    identifier: 'value-all-Find all value using filter',
                    message: 'Find all value using filter',
                    method: ['retrieve', 'update'],
                    acl_attributes: ['parent_name_by_user'],
                    quantity: 'all',
                },
            }
        );

        expect(values.length).toEqual(32);
    });

    it('can fetch a value by ID', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([
                {
                    meta: {
                        id: 'a57b5e03-150e-4ca4-a249-7a311f7a28bc',
                    },
                    name: 'Value 1',
                },
            ])
        );
        const found = await Value.fetchById(
            'a57b5e03-150e-4ca4-a249-7a311f7a28bc'
        );
        const found2 = await Value.fetchById(
            'a57b5e03-150e-4ca4-a249-7a311f7a28bc'
        );

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/value/a57b5e03-150e-4ca4-a249-7a311f7a28bc',
            {
                params: {
                    expand: 1,
                    go_internal: true,
                    method: ['retrieve'],
                },
            }
        );

        expect(found?.meta.id).toEqual('a57b5e03-150e-4ca4-a249-7a311f7a28bc');
        expect(found?.name).toEqual('Value 1');
        expect(found).toEqual(found2);
    });

    it('can create 2 new values from wappsto', async () => {
        const response = makeValueResponse();
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse(response2Values))
            .mockResolvedValueOnce(makeResponse(response));

        const values = await Value.fetch();

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/value', {
            params: { expand: 1, go_internal: true, method: ['retrieve'] },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            '/2.1/value/bd1f46f9-f41a-4f59-bdbd-6529d58b91c5',
            {
                params: { expand: 1, go_internal: true, method: ['retrieve'] },
            }
        );
        expect(values.length).toEqual(2);
        expect(values[0]?.name).toEqual('test');
        expect(values[1]?.name).toEqual('test');
    });
});
