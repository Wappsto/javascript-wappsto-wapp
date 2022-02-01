import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import 'reflect-metadata';
import { createNetwork, Network, Device, Value, config } from '../src/index';
import { openStream } from '../src/models/stream';

describe('network', () => {
    let response = {
        meta: {
            type: 'network',
            version: '2.0',
            id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
        },
        name: 'test',
    };
    let responseFull = {
        meta: {
            type: 'network',
            version: '2.0',
            id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
        },
        name: 'Network Name',
        device: [
            {
                meta: {
                    id: 'e65ec3eb-04f1-4253-bd1b-b989b1204b81',
                    type: 'device',
                },
                name: 'Device Name',
                product: 'Device Product',
                value: [
                    {
                        meta: {
                            id: 'c5a73d64-b398-434e-a236-df15342339d5',
                            type: 'value',
                        },
                        name: 'Value Name',
                        state: [
                            {
                                meta: {
                                    id: 'd58e1d50-0182-4a39-bd03-129f5d316c20',
                                    type: 'state',
                                },
                                type: 'Control',
                            },
                        ],
                    },
                ],
            },
        ],
    };
    let response2Networks = [
        {
            meta: {
                type: 'network',
                version: '2.0',
                id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
            },
            name: 'test',
        },
        {
            meta: {
                type: 'network',
                version: '2.0',
                id: 'aa9da00a-b5e2-4651-a111-92cb0899ee7c',
            },
            name: 'test',
        },
    ];
    let responseHalf = {
        meta: {
            type: 'network',
            version: '2.0',
            id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
        },
        name: 'Network Name',
        device: [
            {
                meta: {
                    id: 'e65ec3eb-04f1-4253-bd1b-b989b1204b81',
                    type: 'device',
                },
                name: 'Device Name',
                product: 'Device Product',
                value: [
                    {
                        meta: {
                            id: 'c5a73d64-b398-434e-a236-df15342339d5',
                            type: 'value',
                        },
                        name: 'Value Name',
                        state: [
                            {
                                meta: {
                                    id: 'd58e1d50-0182-4a39-bd03-129f5d316c20',
                                    type: 'state',
                                },
                                type: 'Report',
                            },
                            '9ee509d7-07ce-4e71-9016-340d53867af4',
                        ],
                    },
                    'ffeed32d-c8f4-47f9-b12b-ce7d9f2342ca',
                ],
            },
            'd9fd72a2-fd2e-4079-b114-d8927f88d9ab',
        ],
    };

    const server = new WS('ws://localhost:12345', { jsonProtocol: true });

    beforeAll(() => {
        openStream.websocketUrl = 'ws://localhost:12345';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('can create a new network class', () => {
        const name = 'Test Network';
        let network = new Network(name);
        expect(network.name).toEqual(name);
    });

    it('can create a network on wappsto', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: response });

        let network = new Network('test');
        await network.create();

        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/network',
            {
                meta: {
                    type: 'network',
                    version: '2.0',
                },
                name: 'test',
            },
            {}
        );
        expect(network.name).toEqual('test');
        expect(network.devices).toEqual([]);
        expect(network.meta.id).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can update a network on wappsto', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: response });
        mockedAxios.patch.mockResolvedValueOnce({ data: response });

        let network = new Network('test');
        await network.create();

        let oldName = response.name;
        response.name = 'new name';

        network.name = 'new name';
        await network.update();

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/network/' + network.meta.id,
            response,
            {}
        );

        response.name = oldName;
    });

    it('can request access to create new network', async () => {
        /*        mockedAxios.get.mockResolvedValueOnce({ data: [] });
        mockedAxios.post.mockRejectedValueOnce({ code: 400013 });
        // .mockResolvedValueOnce({ data: [response] });
        console.log('can request');
        let network = await createNetwork({ name: 'Wapp Network' });
        await server.connected;

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                base: {
                    code: 1100013,
                    ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                },
            },
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(network?.name).toEqual('Network Name');
        expect(network?.toJSON).toBeDefined();*/
    });

    it('can create a new network from wappsto', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [responseFull] });
        mockedAxios.post
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });
        mockedAxios.patch.mockResolvedValueOnce({ data: [] });

        let network = await createNetwork({ name: 'Wapp Network' });
        let device = await network.createDevice({ name: 'Device Name' });
        let value = await device.createNumberValue({
            name: 'Value Name',
            permission: 'rw',
            type: 'temperature',
            min: 0,
            max: 100,
            step: 1,
            unit: 'c',
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/network', {
            params: { expand: 4, 'this_name=': 'Wapp Network' },
        });
        expect(network?.name).toEqual('Network Name');
        expect(network?.device[0]?.name).toEqual('Device Name');
        expect(network?.device[0]?.value[0]?.name).toEqual('Value Name');
        expect(network?.device[0]?.value[0]?.state[0]?.type).toEqual('Control');
        expect(network?.toJSON).toBeDefined();
        expect(network?.device[0]?.toJSON).toBeDefined();
        expect(network?.device[0]?.value[0]?.toJSON).toBeDefined();
        expect(network?.device[0]?.value[0]?.state[0]?.toJSON).toBeDefined();

        expect(device?.name).toEqual('Device Name');
        expect(device?.value[0]?.name).toEqual('Value Name');
        expect(device?.value[0]?.state[0]?.type).toEqual('Control');
        expect(device?.toJSON).toBeDefined();
        expect(device?.value[0]?.toJSON).toBeDefined();
        expect(device?.value[0]?.state[0]?.toJSON).toBeDefined();

        expect(value?.name).toEqual('Value Name');
        expect(value?.state[0]?.type).toEqual('Control');
        expect(value?.toJSON).toBeDefined();
        expect(value?.state[0]?.toJSON).toBeDefined();
    });

    it('can create a new network from wappsto with verbose', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        config({ verbose: true });
        let networks = await Network.fetch();
        config({ verbose: false });

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/network', {
            params: { expand: 4, verbose: true },
        });
        expect(networks[0]?.name).toEqual('test');
    });

    it('can find a network by name', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [response] });

        let r = Network.findByName('test');
        await server.connected;

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                base: {
                    code: 1100004,
                    identifier: 'network-1-Find 1 network with name test',
                    ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                },
            },
        });

        let network = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/network', {
            params: {
                expand: 4,
                quantity: 1,
                message: 'Find 1 network with name test',
                identifier: 'network-1-Find 1 network with name test',
                this_name: 'test',
                method: ['retrieve', 'update'],
            },
        });
        expect(network[0].meta.id === 'b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can find device by name', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [responseFull] });

        let networks = await Network.fetch();
        let device = networks[0].findDeviceByName('Device Name');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(device[0].name).toEqual('Device Name');
        expect(device[0].toJSON).toBeDefined();
    });

    it('can find device by product', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [responseFull] });

        let networks = await Network.fetch();
        let device = networks[0].findDeviceByProduct('Device Product');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(device[0].name).toEqual('Device Name');
        expect(device[0].toJSON).toBeDefined();
    });

    it('can find value by name', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [responseFull] });

        let networks = await Network.fetch();
        let value = networks[0]?.findValueByName('Value Name');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(value[0].name).toEqual('Value Name');
        expect(value[0].toJSON).toBeDefined();
    });

    it('can find value by type', async () => {
        let network = new Network();
        network.device.push(new Device());
        network.device[0].value.push(new Value());
        network.device[0].value[0].type = 'test';
        let value = network.findValueByType('test');

        expect(value[0].type).toEqual('test');
    });

    it('can find network by id', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [responseFull] });

        let network = await Network.findById(
            'b62e285a-5188-4304-85a0-3982dcb575bc'
        );

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(network.name).toEqual('Network Name');
        expect(network.toJSON).toBeDefined();

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/network/b62e285a-5188-4304-85a0-3982dcb575bc',
            {
                params: { expand: 4 },
            }
        );
    });

    it('can create a new device as a child', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: [{ meta: { id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273' } }],
        });

        let network = new Network();
        network.meta.id = '0a4de380-1c16-4b5c-a081-912b931ff891';
        let device = await network.createDevice({
            name: 'Device Name',
            product: 'product',
            serial: 'serial',
            description: 'description',
            protocol: 'protocol',
            communication: 'communication',
            version: 'version',
            manufacturer: 'manufacturer',
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/network/0a4de380-1c16-4b5c-a081-912b931ff891/device',
            {
                communication: 'communication',
                description: 'description',
                manufacturer: 'manufacturer',
                meta: {
                    type: 'device',
                    version: '2.0',
                },
                name: 'Device Name',
                product: 'product',
                protocol: 'protocol',
                serial: 'serial',
                version: 'version',
            },
            {}
        );

        expect(device.name).toEqual('Device Name');
        expect(device.product).toEqual('product');
        expect(device.serial).toEqual('serial');
        expect(device.description).toEqual('description');
        expect(device.protocol).toEqual('protocol');
        expect(device.communication).toEqual('communication');
        expect(device.version).toEqual('version');
        expect(device.manufacturer).toEqual('manufacturer');
        expect(device.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
        expect(device.toJSON).toBeDefined();
    });

    it('can create a new network', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [] });
        mockedAxios.post.mockResolvedValueOnce({
            data: [
                {
                    meta: {
                        type: 'network',
                        version: '2.0',
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    },
                    name: 'Network Name',
                    description: 'Description',
                },
            ],
        });

        let network = await createNetwork({
            name: 'Network Name',
            description: 'Description',
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/network', {
            params: {
                expand: 4,
                'this_name=': 'Network Name',
            },
        });
        expect(network.name).toEqual('Network Name');
        expect(network.description).toEqual('Description');
        expect(network.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can return device as a child', async () => {
        mockedAxios.patch.mockResolvedValueOnce({
            data: [
                {
                    communication: 'communication',
                    description: 'description',
                    manufacturer: 'manufacturer',
                    meta: {
                        type: 'device',
                        version: '2.0',
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    },
                    name: 'Device Name',
                    product: 'product',
                    protocol: 'protocol',
                    serial: 'serial',
                    version: 'version',
                },
            ],
        });

        let oldDevice = new Device('Device Name');
        oldDevice.meta.id = 'f589b816-1f2b-412b-ac36-1ca5a6db0273';
        let network = new Network();
        network.meta.id = '0a4de380-1c16-4b5c-a081-912b931ff891';
        network.device.push(oldDevice);
        let device = await network.createDevice({
            name: 'Device Name',
            product: 'product',
            serial: 'serial',
            description: 'description',
            protocol: 'protocol',
            communication: 'communication',
            version: 'version',
            manufacturer: 'manufacturer',
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);

        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.0/device/f589b816-1f2b-412b-ac36-1ca5a6db0273',
            {
                communication: 'communication',
                description: 'description',
                manufacturer: 'manufacturer',
                meta: {
                    type: 'device',
                    version: '2.0',
                    id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                },
                name: 'Device Name',
                product: 'product',
                protocol: 'protocol',
                serial: 'serial',
                version: 'version',
            },
            {}
        );

        expect(device.name).toEqual('Device Name');
        expect(device.product).toEqual('product');
        expect(device.serial).toEqual('serial');
        expect(device.description).toEqual('description');
        expect(device.protocol).toEqual('protocol');
        expect(device.communication).toEqual('communication');
        expect(device.version).toEqual('version');
        expect(device.manufacturer).toEqual('manufacturer');
        expect(device.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can find all network by name', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: response2Networks });
        let r = Network.findAllByName('test');
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
                    identifier: 'network-all-Find all network with name test',
                    ids: [
                        'b62e285a-5188-4304-85a0-3982dcb575bc',
                        'aa9da00a-b5e2-4651-a111-92cb0899ee7c',
                    ],
                },
            },
        });

        let network = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/network', {
            params: {
                expand: 4,
                quantity: 'all',
                message: 'Find all network with name test',
                identifier: 'network-all-Find all network with name test',
                this_name: 'test',
                method: ['retrieve', 'update'],
            },
        });
        expect(network[0].meta.id === 'b62e285a-5188-4304-85a0-3982dcb575bc');
        expect(network[1].meta.id === 'aa9da00a-b5e2-4651-a111-92cb0899ee7c');
    });

    it('can use custom find', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: response2Networks });
        let r = Network.find({ name: 'test' });
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
                    identifier: 'network-1-Find 1 network',
                    ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                },
            },
        });

        let network = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/network', {
            params: {
                expand: 4,
                quantity: 1,
                message: 'Find 1 network',
                identifier: 'network-1-Find 1 network',
                this_name: 'test',
                method: ['retrieve', 'update'],
            },
        });
        expect(network[0].meta.id === 'b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can delete a network', async () => {
        mockedAxios.delete.mockResolvedValueOnce({ data: [] });

        let network = new Network('network');
        network.meta.id = 'f36caf6f-eb2d-4e00-91ac-6b3a6ba04b02';
        await network.delete();

        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledWith(
            '/2.0/network/f36caf6f-eb2d-4e00-91ac-6b3a6ba04b02',
            {}
        );
    });

    it('can load all missing object using lazy loading', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({ data: [responseHalf] })
            .mockResolvedValueOnce({ data: { type: 'Control' } })
            .mockResolvedValueOnce({ data: { name: 'Value Name 2' } })
            .mockResolvedValueOnce({ data: { name: 'Device Name 2' } });

        let networks = await Network.fetch();
        let device1 = networks[0].device[0];
        let device2 = networks[0].device[1];
        let value1 = device1.value[0];
        let value2 = device1.value[1];
        let state1 = value1.state[0];
        let state2 = value1.state[1];

        expect(device1.name).toEqual('Device Name');
        expect(device2.name).toEqual('Device Name 2');

        expect(value1.name).toEqual('Value Name');
        expect(value2.name).toEqual('Value Name 2');

        expect(state1.type).toEqual('Report');
        expect(state2.type).toEqual('Control');

        expect(mockedAxios.get).toHaveBeenCalledTimes(4);
    });
});
