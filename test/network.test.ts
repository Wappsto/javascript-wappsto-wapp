import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);

import 'reflect-metadata'; // eslint-disable-line
import { createNetwork, Network, Device, Value, verbose } from '../src/index'; // eslint-disable-line
import StreamHandler from '../src/stream_handler'; // eslint-disable-line

describe('network', () => {
    let response = {
        meta: {
            type: 'network',
            version: '2.0',
            id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
        },
        name: 'test',
        device: [],
    };

    const server = new WS('ws://localhost:12345', { jsonProtocol: true });

    beforeAll(() => {
        StreamHandler.url = 'ws://localhost:12345';
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

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/network',
            {
                device: [],
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

        let network = new Network('test');
        await network.create();

        let oldName = response.name;
        response.name = 'new name';
        mockedAxios.put.mockResolvedValueOnce({ data: response });

        network.name = 'new name';
        await network.update();

        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.0/network/' + network.meta.id,
            response,
            {}
        );

        response.name = oldName;
    });

    it('can create a new network from wappsto', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        let networks = await Network.fetch();

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/network', {
            params: { expand: 4 },
        });
        expect(networks[0]?.name).toEqual('test');
    });

    it('can create a new network from wappsto with verbose', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });

        verbose(true);
        let networks = await Network.fetch();
        verbose(false);

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/network', {
            params: { expand: 4, verbose: true },
        });
        expect(networks[0]?.name).toEqual('test');
    });

    it('can find a network by id', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });
        let network = await Network.findById(
            'b62e285a-5188-4304-85a0-3982dcb575bc'
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/network/b62e285a-5188-4304-85a0-3982dcb575bc',
            { params: { expand: 4 } }
        );
        expect(network.meta.id === 'b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can find a network by name', async () => {
        mockedAxios.get.mockResolvedValueOnce({data: []}).mockResolvedValueOnce({data: []});
        //mockedAxios.post.mockResolvedValueOnce('');

        let r = Network.findByName('test');
        await server.connected;

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/notification', {
            params: {
                expand: 1,
                'this_base.identifier':
                    'network-1-Find 1 network with name test',
            },
        });
        mockedAxios.get.mockResolvedValueOnce({ data: [response] });
        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                base: {
                    identifier: 'network-1-Find 1 network with name test',
                    ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                },
            },
        });

        let network = await r;
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/network', {
            params: {
                expand: 4,
                quantity: 1,
                message: 'Find 1 network with name test',
                identifier: 'network-1-Find 1 network with name test',
                this_name: 'test',
            },
        });
        expect(network[0].meta.id === 'b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can find device by name', async () => {
        let network = new Network();
        network.device.push(new Device());
        network.device[0].name = 'test';

        let device = network.findDeviceByName('test');
        expect(device[0].name).toEqual('test');
    });

    it('can find value by name', async () => {
        let network = new Network();
        network.device.push(new Device());
        network.device[0].value.push(new Value());
        network.device[0].value[0].name = 'test';

        let value = network.findValueByName('test');
        expect(value[0].name).toEqual('test');
    });

    it('can find value by type', async () => {
        let network = new Network();
        network.device.push(new Device());
        network.device[0].value.push(new Value());
        network.device[0].value[0].type = 'test';

        let value = network.findValueByType('test');
        expect(value[0].type).toEqual('test');
    });

    it('can create a new device as a child', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [] });
        mockedAxios.post.mockResolvedValueOnce({
            data: [{ meta: { id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273' } }],
        });

        let network = new Network();
        network.meta.id = 'network_id';
        let device = await network.createDevice(
            'Device Name',
            'product',
            'serial',
            'description',
            'protocol',
            'communication',
            'version',
            'manufacturer'
        );

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/network/network_id/device',
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
                value: [],
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

    it('can create a new network', async () => {
        mockedAxios.get.mockResolvedValueOnce({data:[]});
        mockedAxios.post.mockResolvedValueOnce({
            data: [
                {
                    meta: {
                        type: 'network',
                        version: '2.0',
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    },
                    name: 'Network Name',
                    device: [],
                },
            ],
        });

        let network = await createNetwork('Network Name');

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/network',
            {
                params: {
                    expand: 4,
                    'this_name=': 'Network Name',
                },
            }
        );

        expect(network.name).toEqual('Network Name');
        expect(network.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can return device as a child', async () => {
        mockedAxios.post.mockResolvedValueOnce({
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
                    value: [],
                    version: 'version',
                },
            ],
        });
        mockedAxios.put.mockResolvedValueOnce({
            data: [{ meta: { id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273' } }],
        });

        let network = new Network();
        network.meta.id = 'network_id';
        let device = await network.createDevice(
            'Device Name',
            'product',
            'serial',
            'description',
            'protocol',
            'communication',
            'version',
            'manufacturer'
        );

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/network/network_id/device',
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
                value: [],
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
});
