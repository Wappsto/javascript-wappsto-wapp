import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
/* eslint-disable import/first */
import 'reflect-metadata';
import { Device, Value, verbose } from '../src/index';
import { openStream } from '../src/models/stream';

describe('device', () => {
    let response = {
        meta: {
            type: 'device',
            version: '2.0',
            id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
        },
        name: 'test',
    };

    const server = new WS('ws://localhost:12345', { jsonProtocol: true });

    beforeAll(() => {
        openStream.websocketUrl = 'ws://localhost:12345';
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
        mockedAxios.post.mockResolvedValueOnce({ data: response });

        let device = new Device('test');
        await device.create();

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/device',
            {
                meta: {
                    type: 'device',
                    version: '2.0',
                },
                name: 'test',
            },
            {}
        );
        expect(device.name).toEqual('test');
        expect(device.values).toEqual([]);
        expect(device.meta.id).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can update a device on wappsto', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: response });
        mockedAxios.patch.mockResolvedValueOnce({ data: response });

        let device = new Device('test');
        await device.create();
        let oldName = response.name;
        response.name = 'new name';
        device.name = 'new name';
        await device.update();

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/device/' + device.meta.id,
            response,
            {}
        );

        response.name = oldName;
    });

    it('can create a new device from wappsto', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        let devices = await Device.fetch();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/device', {
            params: { expand: 3 },
        });
        expect(devices[0]?.name).toEqual('test');
    });

    it('can create a new device from wappsto with verbose', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        verbose(true);
        let devices = await Device.fetch();
        verbose(false);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/device', {
            params: { expand: 3, verbose: true },
        });
        expect(devices[0]?.name).toEqual('test');
    });

    it('can find a device by name', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [response] });

        let r = Device.findByName('test');
        await server.connected;

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                base: {
                    code: 1100004,
                    identifier: 'device-1-Find 1 device with name test',
                    ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                },
            },
        });

        let device = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/device', {
            params: {
                expand: 3,
                quantity: 1,
                message: 'Find 1 device with name test',
                identifier: 'device-1-Find 1 device with name test',
                this_name: 'test',
                method: ['retrieve', 'update'],
            },
        });
        expect(device[0].toJSON).toBeDefined();
        expect(device[0].meta.id === 'b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can find a device by product', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        let devices = await Device.findByProduct('test');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/device', {
            params: {
                expand: 3,
                this_product: 'test',
                identifier: 'device-1-Find 1 device with product test',
                message: 'Find 1 device with product test',
                quantity: 1,
                method: ['retrieve', 'update'],
            },
        });
        expect(devices[0].meta.id === 'b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('will throw an error when the permission is wrong', async () => {
        let device = new Device();
        try {
            await device.createValue({ name: 'name', permission: 'wrong' });
            expect(true).toBe(false);
        } catch (e: any) {
            expect(e.message).toBe('Invalid value for value permission');
        }
    });

    it('will throw an error when the value type is missing', async () => {
        let device = new Device();
        try {
            await device.createValue({ name: 'name', permission: 'rw' });
            expect(true).toBe(false);
        } catch (e: any) {
            expect(e.message).toBe('You must suply a valid type');
        }
    });

    it('can create a new number value as a child', async () => {
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
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'state',
                            version: '2.0',
                            id: 'd5ad7430-7948-47b5-ab85-c9a93d0bff5b',
                        },
                    },
                ],
            });

        let device = new Device();
        device.meta.id = 'device_id';
        let value = await device.createNumberValue({
            name: 'Value Name',
            permission: 'rw',
            type: 'type',
            period: 'period',
            delta: 'delta',
            min: 0,
            max: 1,
            step: 1,
            unit: 'unit',
            si_conversion: 'si_conversion',
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            expect.objectContaining({
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
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                },
                data: '',
                type: 'Report',
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                },
                data: '',
                type: 'Control',
            }),
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
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            type: 'state',
                            version: '2.0',
                            id: 'd5ad7430-7948-47b5-ab85-c9a93d0bff5b',
                        },
                    },
                ],
            });

        let device = new Device();
        device.meta.id = 'device_id';
        let value = await device.createStringValue({
            name: 'Value Name',
            permission: 'wr',
            type: 'type',
            period: 'period',
            delta: 'delta',
            max: 10,
            encoding: 'encoding',
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            expect.objectContaining({
                permission: 'wr',
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
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                },
                data: '',
                type: 'Report',
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                },
                data: '',
                type: 'Control',
            }),
            {}
        );
        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('wr');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('period');
        expect(value.delta).toEqual('delta');
        expect(value.string?.max).toEqual(10);
        expect(value.string?.encoding).toEqual('encoding');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can create a new blob value as a child', async () => {
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

        let device = new Device();
        device.meta.id = 'device_id';
        let value = await device.createBlobValue({
            name: 'Value Name',
            permission: 'r',
            type: 'type',
            period: 'period',
            delta: 'delta',
            max: 10,
            encoding: 'encoding',
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            expect.objectContaining({
                permission: 'r',
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
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                },
                data: '',
                type: 'Report',
            }),
            {}
        );
        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('r');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('period');
        expect(value.delta).toEqual('delta');
        expect(value.blob?.max).toEqual(10);
        expect(value.blob?.encoding).toEqual('encoding');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can create a new xml value as a child', async () => {
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

        let device = new Device();
        device.meta.id = 'device_id';
        let value = await device.createXmlValue({
            name: 'Value Name',
            permission: 'w',
            type: 'type',
            period: 'period',
            delta: 'delta',
            xsd: 'xsd',
            namespace: 'namespace',
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            expect.objectContaining({
                permission: 'w',
                type: 'type',
                period: 'period',
                meta: {
                    type: 'value',
                    version: '2.0',
                },
                name: 'Value Name',
                delta: 'delta',
                xml: {
                    xsd: 'xsd',
                    namespace: 'namespace',
                },
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
                },
                data: '',
                type: 'Control',
            }),
            {}
        );
        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('w');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('period');
        expect(value.delta).toEqual('delta');
        expect(value.xml?.xsd).toEqual('xsd');
        expect(value.xml?.namespace).toEqual('namespace');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can return value as a child', async () => {
        mockedAxios.patch.mockResolvedValueOnce({
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
        mockedAxios.post
            .mockResolvedValueOnce({ data: {} })
            .mockResolvedValueOnce({ data: {} });

        let device = new Device();
        device.meta.id = 'device_id';
        let val = new Value();
        val.name = 'Value Name';
        device.value.push(val);
        let value = await device.createNumberValue({
            name: 'Value Name',
            permission: 'rw',
            type: 'type',
            period: 'period',
            delta: 'delta',
            min: 0,
            max: 1,
            step: 1,
            unit: 'unit',
            si_conversion: 'si_conversion',
        });

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/device/device_id/value',
            expect.objectContaining({
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
            }),
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
});
