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
        expect(device.values).toEqual([]);
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
                base: {
                    identifier: 'device-1-Find 1 device with name test',
                    ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                },
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

    it('can create a new number value as a child', async () => {
        mockedAxios.get.mockResolvedValue({ data: [] });
        mockedAxios.post.mockResolvedValue({
            data: [{ meta: { id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273' } }],
        });

        let device = new Device();
        device.meta.id = 'device_id';
        let value = await device.createNumberValue(
            'Value Name',
            'rw',
            'type',
            'period',
            'delta',
            'status',
            0,
            1,
            1,
            'unit',
            'si_unit'
        );

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            {
                params: {
                    expand: 2,
                    this_name: 'Value Name',
                },
            }
        );

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            {
                body: {
                    permission: 'rw',
                    type: 'type',
                    period: 'period',
                    meta: {
                        type: 'value',
                        version: '2.0',
                    },
                    name: 'Value Name',
                    delta: 'delta',
                    status: 'status',
                    number: {
                        min: 0,
                        max: 1,
                        step: 1,
                        unit: 'unit',
                        si_unit: 'si_unit',
                    },
                    state: [],
                },
            }
        );

        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('period');
        expect(value.delta).toEqual('delta');
        expect(value.status).toEqual('status');
        expect(value.number?.min).toEqual(0);
        expect(value.number?.max).toEqual(1);
        expect(value.number?.step).toEqual(1);
        expect(value.number?.unit).toEqual('unit');
        expect(value.number?.si_unit).toEqual('si_unit');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can return value as a child', async () => {
        mockedAxios.get.mockResolvedValue({
            data: [
                {
                    permission: 'rw',
                    type: 'type',
                    period: 'period',
                    meta: {
                        type: 'value',
                        version: '2.0',
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    },
                    name: 'Value Name',
                    delta: 'delta',
                    status: 'status',
                    number: {
                        min: 0,
                        max: 1,
                        step: 1,
                        unit: 'unit',
                        si_unit: 'si_unit',
                    },
                },
            ],
        });

        let device = new Device();
        device.meta.id = 'device_id';
        let value = await device.createNumberValue(
            'Value Name',
            'rw',
            'type',
            'period',
            'delta',
            'status',
            0,
            1,
            1,
            'unit',
            'si_unit'
        );

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            {
                params: {
                    expand: 2,
                    this_name: 'Value Name',
                },
            }
        );

        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('period');
        expect(value.delta).toEqual('delta');
        expect(value.status).toEqual('status');
        expect(value.number?.min).toEqual(0);
        expect(value.number?.max).toEqual(1);
        expect(value.number?.step).toEqual(1);
        expect(value.number?.unit).toEqual('unit');
        expect(value.number?.si_unit).toEqual('si_unit');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });
});
