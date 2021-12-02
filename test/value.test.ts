import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
/* eslint-disable import/first */
import 'reflect-metadata';
import { Value, verbose } from '../src/index';
import { openStream } from '../src/models/stream';

describe('value', () => {
    let response = {
        meta: {
            type: 'value',
            version: '2.0',
            id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
        },
        name: 'test',
        state: [],
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
        mockedAxios.post.mockResolvedValue({ data: response });
        let value = new Value('test');
        await value.create();

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/value',
            {
                meta: {
                    type: 'value',
                    version: '2.0',
                },
                name: 'test',
                state: [],
            },
            {}
        );
        expect(value.name).toEqual('test');
        expect(value.states).toEqual([]);
        expect(value.meta.id).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can update a value on wappsto', async () => {
        let value = new Value('test');
        await value.create();

        let oldName = response.name;
        response.name = 'new name';
        mockedAxios.put.mockResolvedValue({ data: response });

        value.name = 'new name';
        await value.update();

        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.0/value/' + value.meta.id,
            response,
            {}
        );

        response.name = oldName;
    });

    it('can create a new value from wappsto', async () => {
        mockedAxios.get.mockResolvedValue({ data: [response] });
        let values = await Value.fetch();

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
            params: { expand: 2 },
        });
        expect(values[0]?.name).toEqual('test');
    });

    it('can create a new value from wappsto with verbose', async () => {
        mockedAxios.get.mockResolvedValue({ data: [response] });
        verbose(true);
        let values = await Value.fetch();
        verbose(false);

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/value', {
            params: { expand: 2, verbose: true },
        });
        expect(values[0]?.name).toEqual('test');
    });

    it('can find a value by name', async () => {
        mockedAxios.get.mockResolvedValue([]);

        let r = Value.findByName('test');
        await server.connected;

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/notification', {
            params: {
                expand: 1,
                'this_base.identifier': 'value-1-Find 1 value with name test',
            },
        });
        mockedAxios.get.mockResolvedValue({ data: [response] });
        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                base: {
                    identifier: 'value-1-Find 1 value with name test',
                    ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                },
            },
        });

        let value = await r;

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
});
