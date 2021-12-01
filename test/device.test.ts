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

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/device',
            {
                meta: {
                    type: 'device',
                    version: '2.0',
                },
                name: 'test',
                value: [],
            },
            {}
        );
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
            response,
            {}
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
        mockedAxios.get.mockResolvedValue({ data: [] });

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

    it('can find a device by product', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({
                data: [
                    {
                        base: {
                            identifier:
                                'device-1-Find 1 device with product test',
                            ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                        },
                    },
                ],
            })
            .mockResolvedValueOnce({ data: [response] });

        let devices = await Device.findByProduct('test');

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/notification', {
            params: {
                expand: 1,
                'this_base.identifier':
                    'device-1-Find 1 device with product test',
            },
        });

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/device', {
            params: {
                expand: 3,
                id: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                this_product: 'test',
            },
        });
        expect(devices[0].meta.id === 'b62e285a-5188-4304-85a0-3982dcb575bc');
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
            0,
            1,
            1,
            'unit',
            'si_conversion'
        );

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            {
                params: {
                    expand: 2,
                    'this_name=': 'Value Name',
                },
            }
        );

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            {
                permission: 'rw',
                type: 'type',
                period: 'period',
                meta: {
                    type: 'value',
                    version: '2.0',
                },
                name: 'Value Name',
                delta: 'delta',
                number: {
                    min: 0,
                    max: 1,
                    step: 1,
                    unit: 'unit',
                    si_conversion: 'si_conversion',
                },
                state: [],
            },
            {}
        );

        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('period');
        expect(value.delta).toEqual('delta');
        expect(value.number?.min).toEqual(0);
        expect(value.number?.max).toEqual(1);
        expect(value.number?.step).toEqual(1);
        expect(value.number?.unit).toEqual('unit');
        expect(value.number?.si_conversion).toEqual('si_conversion');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can create a new string value as a child', async () => {
        mockedAxios.get.mockResolvedValue({ data: [] });
        mockedAxios.post.mockResolvedValue({
            data: [{ meta: { id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273' } }],
        });

        let device = new Device();
        device.meta.id = 'device_id';
        let value = await device.createStringValue(
            'Value Name',
            'rw',
            'type',
            'period',
            'delta',
            10,
            'encoding'
        );

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            {
                params: {
                    expand: 2,
                    'this_name=': 'Value Name',
                },
            }
        );

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            {
                permission: 'rw',
                type: 'type',
                period: 'period',
                meta: {
                    type: 'value',
                    version: '2.0',
                },
                name: 'Value Name',
                delta: 'delta',
                string: {
                    max: 10,
                    encoding: 'encoding',
                },
                state: [],
            },
            {}
        );

        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('period');
        expect(value.delta).toEqual('delta');
        expect(value.string?.max).toEqual(10);
        expect(value.string?.encoding).toEqual('encoding');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can create a new blob value as a child', async () => {
        mockedAxios.get.mockResolvedValue({ data: [] });
        mockedAxios.post.mockResolvedValue({
            data: [{ meta: { id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273' } }],
        });

        let device = new Device();
        device.meta.id = 'device_id';
        let value = await device.createBlobValue(
            'Value Name',
            'rw',
            'type',
            'period',
            'delta',
            10,
            'encoding'
        );

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            {
                params: {
                    expand: 2,
                    'this_name=': 'Value Name',
                },
            }
        );

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            {
                permission: 'rw',
                type: 'type',
                period: 'period',
                meta: {
                    type: 'value',
                    version: '2.0',
                },
                name: 'Value Name',
                delta: 'delta',
                blob: {
                    max: 10,
                    encoding: 'encoding',
                },
                state: [],
            },
            {}
        );

        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('period');
        expect(value.delta).toEqual('delta');
        expect(value.blob?.max).toEqual(10);
        expect(value.blob?.encoding).toEqual('encoding');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can create a new xml value as a child', async () => {
        mockedAxios.get.mockResolvedValue({ data: [] });
        mockedAxios.post.mockResolvedValue({
            data: [{ meta: { id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273' } }],
        });

        let device = new Device();
        device.meta.id = 'device_id';
        let value = await device.createXmlValue(
            'Value Name',
            'rw',
            'type',
            'period',
            'delta',
            10,
            'encoding'
        );

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            {
                params: {
                    expand: 2,
                    'this_name=': 'Value Name',
                },
            }
        );

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            {
                permission: 'rw',
                type: 'type',
                period: 'period',
                meta: {
                    type: 'value',
                    version: '2.0',
                },
                name: 'Value Name',
                delta: 'delta',
                xml: {
                    max: 10,
                    encoding: 'encoding',
                },
                state: [],
            },
            {}
        );

        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('period');
        expect(value.delta).toEqual('delta');
        expect(value.xml?.max).toEqual(10);
        expect(value.xml?.encoding).toEqual('encoding');
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
                    number: {
                        min: 0,
                        max: 1,
                        step: 1,
                        unit: 'unit',
                        si_conversion: 'si_conversion',
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
            0,
            1,
            1,
            'unit',
            'si_conversion'
        );

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            {
                params: {
                    expand: 2,
                    'this_name=': 'Value Name',
                },
            }
        );

        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('period');
        expect(value.delta).toEqual('delta');
        expect(value.number?.min).toEqual(0);
        expect(value.number?.max).toEqual(1);
        expect(value.number?.step).toEqual(1);
        expect(value.number?.unit).toEqual('unit');
        expect(value.number?.si_conversion).toEqual('si_conversion');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });
});
