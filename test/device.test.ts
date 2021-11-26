import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
/* eslint-disable import/first */
import 'reflect-metadata';
import { Device, verbose } from '../src/index';
import StreamHandler from '../src/stream_handler';

describe('device', () => {
    let response = {
        meta: {
            type: 'device',
            version: '2.0',
            id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
        },
        name: 'test',
        value: [],
    };

    const server = new WS('ws://localhost:12345', { jsonProtocol: true });

    beforeAll(() => {
        StreamHandler.url = 'ws://localhost:12345';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('can create a new device class', () => {
        const name = 'Test Device';
        let device = new Device(name);
        expect(device.name).toEqual(name);
    });

    it('can create a device on wappsto', async () => {
        mockedAxios.post.mockResolvedValue({ data: response });
        let device = new Device('test');
        await device.create();

        expect(mockedAxios.post).toHaveBeenCalledWith('/2.0/device', {
            body: {
                meta: {
                    type: 'device',
                    version: '2.0',
                },
                name: 'test',
                value: [],
            },
        });
        expect(device.name).toEqual('test');
        expect(device.value).toEqual([]);
        expect(device.meta.id).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can update a device on wappsto', async () => {
        let device = new Device('test');
        await device.create();

        let oldName = response.name;
        response.name = 'new name';
        mockedAxios.put.mockResolvedValue({ data: response });

        device.name = 'new name';
        await device.update();

        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.0/device/' + device.meta.id,
            { body: response }
        );

        response.name = oldName;
    });

    it('can create a new device from wappsto', async () => {
        mockedAxios.get.mockResolvedValue({ data: [response] });
        let devices = await Device.fetch();

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/device', {
            params: { expand: 3 },
        });
        expect(devices[0]?.name).toEqual('test');
    });

    it('can create a new device from wappsto with verbose', async () => {
        mockedAxios.get.mockResolvedValue({ data: [response] });
        verbose(true);
        let devices = await Device.fetch();
        verbose(false);

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/device', {
            params: { expand: 3, verbose: true },
        });
        expect(devices[0]?.name).toEqual('test');
    });

    it('can find a device by name', async () => {
        mockedAxios.get.mockResolvedValue([]);

        let r = Device.findByName('test');
        await server.connected;

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/notification', {
            params: {
                expand: 1,
                'this_base.identifier': 'device-1-Find 1 device with name test',
            },
        });

        mockedAxios.get.mockResolvedValue({ data: [response] });
        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                base: { ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'] },
            },
        });

        let device = await r;
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/device', {
            params: {
                expand: 3,
                quantity: 1,
                message: 'Find 1 device with name test',
                identifier: 'device-1-Find 1 device with name test',
                this_name: 'test',
            },
        });
        expect(device[0].meta.id === 'b62e285a-5188-4304-85a0-3982dcb575bc');
    });
});
