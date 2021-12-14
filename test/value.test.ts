import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
/* eslint-disable import/first */
import 'reflect-metadata';
import { Value, State, verbose } from '../src/index';
import { openStream } from '../src/models/stream';

describe('value', () => {
    let response = {
        meta: {
            type: 'value',
            version: '2.0',
            id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
        },
        name: 'test',
        permission: '',
    };

    const server = new WS('ws://localhost:12345', { jsonProtocol: true });

    beforeAll(() => {
        openStream.websocketUrl = 'ws://localhost:12345';
    });

    beforeEach(() => {});

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('can create a new value class', () => {
        const name = 'Test Value';
        let value = new Value(name);

        expect(value.name).toEqual(name);
    });

    it('can create a value on wappsto', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: response });

        let value = new Value('test');
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
                permission: '',
            },
            {}
        );
        expect(value.name).toEqual('test');
        expect(value.states).toEqual([]);
        expect(value.meta.id).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can update a value on wappsto', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: response });
        mockedAxios.patch.mockResolvedValueOnce({ data: response });

        let value = new Value('test');
        await value.create();
        let oldName = response.name;
        response.name = 'new name';
        value.name = 'new name';
        await value.update();

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/value/' + value.meta.id,
            response,
            {}
        );

        response.name = oldName;
    });

    it('can create a new value from wappsto', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        let values = await Value.fetch();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
            params: { expand: 2 },
        });
        expect(values[0]?.name).toEqual('test');
    });

    it('can create a new value from wappsto with verbose', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        verbose(true);
        let values = await Value.fetch();
        verbose(false);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
            params: { expand: 2, verbose: true },
        });
        expect(values[0]?.name).toEqual('test');
    });

    it('will throw an error when the state type is wrong', async () => {
        let value = new Value();
        try {
            await value.createState({ type: 'wrong' });
            expect(true).toBe(false);
        } catch (e: any) {
            expect(e.message).toBe('Invalid value for state type');
        }
    });

    it('can return an old state when creating', async () => {
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });

        let value = new Value();
        value.meta.id = 'value_id';
        let oldState = new State('Report');
        oldState.meta.id = 'state_id';
        value.state.push(oldState);

        let state = await value.createState({
            type: 'Report',
            data: 'new',
            timestamp: 'timestamp',
        });

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/state_id',
            {
                meta: {
                    type: 'state',
                    version: '2.0',
                    id: 'state_id',
                },
                type: 'Report',
                data: 'new',
                timestamp: 'timestamp',
            },
            {}
        );
        expect(state.meta.id).toBe('state_id');
    });

    it('can find a value by name', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [response] });

        let r = Value.findByName('test');
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
        let value = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
            params: {
                expand: 2,
                quantity: 1,
                message: 'Find 1 value with name test',
                identifier: 'value-1-Find 1 value with name test',
                this_name: 'test',
            },
        });
        expect(value[0].meta.id === 'b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can find a value by type', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [response] });

        let r = Value.findByType('test');
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
        let value = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
            params: {
                expand: 2,
                quantity: 1,
                message: 'Find 1 value with type test',
                identifier: 'value-1-Find 1 value with type test',
                this_type: 'test',
            },
        });
        expect(value[0].meta.id === 'b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can send a report', () => {
        mockedAxios.patch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });

        let value = new Value();
        value.meta.id = 'value_id';
        let state = new State('Report');
        state.meta.id = 'state_id';
        value.state.push(state);
        value.report(10);
        value.report('test', 'timestamp');

        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(value.getReportData()).toBe('test');
        expect(value.getControlData()).toBe(undefined);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/state_id',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                    id: 'state_id',
                },
                type: 'Report',
                data: '10',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/state_id',
            {
                meta: {
                    type: 'state',
                    version: '2.0',
                    id: 'state_id',
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

    it('can send a control', () => {
        mockedAxios.patch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });

        let value = new Value();
        value.meta.id = 'value_id';
        let state = new State('Control');
        state.meta.id = 'state_id';
        value.state.push(state);
        value.control(10);
        value.control('test', 'timestamp');

        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/state_id',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                    id: 'state_id',
                },
                type: 'Control',
                data: '10',
            }),
            {}
        );
        expect(value.getControlData()).toBe('test');
        expect(value.getReportData()).toBe(undefined);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/state/state_id',
            {
                meta: {
                    type: 'state',
                    version: '2.0',
                    id: 'state_id',
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
});
