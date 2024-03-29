import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { createNetwork, Network, Device, Value, config } from '../src/index';
import { before, after, newWServer, sendRpcResponse } from './util/stream';
import {
    simpleNetworkResponse,
    fullNetworkResponse,
    fullNetworkResponseUpdated,
    responses,
} from './util/response';
import { makeErrorResponse, makeResponse } from './util/helpers';

const responseOffline = {
    meta: {
        type: 'network',
        version: '2.1',
        id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
        connection: {},
    },
    name: 'test',
};

const response2Networks = [
    {
        meta: {
            type: 'network',
            version: '2.1',
            id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
        },
        name: 'test',
    },
    {
        meta: {
            type: 'network',
            version: '2.1',
            id: 'aa9da00a-b5e2-4651-a111-92cb0899ee7c',
        },
        name: 'test',
    },
];
const responseHalf = {
    meta: {
        type: 'network',
        version: '2.1',
        id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
    },
    name: 'Network Name',
    device: [
        {
            meta: {
                id: 'e65ec3eb-04f1-4253-bd1b-b989b1204b81',
                version: '2.1',
                type: 'device',
            },
            name: 'Device Name',
            product: 'Device Product',
            value: [
                {
                    meta: {
                        id: 'c5a73d64-b398-434e-a236-df15342339d5',
                        version: '2.1',
                        type: 'value',
                    },
                    name: 'Value Name',
                    state: [
                        {
                            meta: {
                                id: 'd58e1d50-0182-4a39-bd03-129f5d316c20',
                                version: '2.1',
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
        'b8b4864c-1da5-41db-8fd3-22191176b266',
        {
            meta: {
                id: 'e65ec3eb-04f1-4253-bd1b-b989b1204b81',
                version: '2.1',
                type: 'device',
            },
            name: 'Device Name',
            product: 'Device Product',
        },
    ],
};

describe('network', () => {
    let server: WS;

    beforeAll(() => {
        before();
    });

    beforeEach(() => {
        server = newWServer(true);
    });

    afterEach(() => {
        after(mockedAxios);
    });

    it('can create a new network class', () => {
        const name = 'Test Network';
        const network = new Network(name);
        expect(network.name).toEqual(name);
    });

    it('can create a network on wappsto', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(simpleNetworkResponse)
        );

        const network = new Network('test');
        await network.create();

        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/network',
            {
                meta: {
                    type: 'network',
                    version: '2.1',
                },
                name: 'test',
            },
            {}
        );
        expect(network.name).toEqual('test');
        expect(network.devices).toEqual([]);
        expect(network.meta.id).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can create a new networks from wappsto', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse(response2Networks));

        const networks = await Network.fetch();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/network', {
            params: { go_internal: true, expand: 3, method: ['retrieve'] },
        });
        expect(networks[0]?.name).toEqual('test');
    });

    it('can update a network on wappsto', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(simpleNetworkResponse)
        );
        mockedAxios.put.mockResolvedValueOnce(
            makeResponse(simpleNetworkResponse)
        );

        const network = new Network('test');
        await network.create();

        network.name = 'new name';
        await network.update();

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledWith(
            `/2.1/network/${network.meta.id}`,
            {
                meta: {
                    id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
                    type: 'network',
                    version: '2.1',
                },
                name: 'new name',
            },
            {}
        );
    });

    it('can request access to create new network', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post
            .mockRejectedValueOnce(makeErrorResponse({ code: 400013 }))
            .mockResolvedValueOnce(makeResponse([]));

        const p = createNetwork({ name: 'Network Name' });
        await server.connected;

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/2.1/notification/',
            data: {
                base: {
                    code: 1100013,
                    ids: ['b62e285a-5188-4304-85a0-3982dcb575bc'],
                },
            },
        });

        const network = await p;

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(network?.name).toEqual('Network Name');
        expect(network?.toJSON).toBeDefined();
    });

    it('can create a new network from wappsto', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([fullNetworkResponse])
        );
        mockedAxios.post.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.put.mockResolvedValueOnce(makeResponse([]));

        const network = await createNetwork({ name: 'Wapp Network' });
        const device = await network.createDevice({ name: 'Device Name' });
        const value = await device.createNumberValue({
            name: 'Value Name',
            permission: 'rw',
            type: 'temperature',
            min: 0,
            max: 100,
            step: 1,
            unit: 'c',
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/network', {
            params: {
                expand: 3,
                go_internal: true,
                'this_name=': 'Wapp Network',
                method: ['retrieve'],
            },
        });
        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.1/value/c5a73d64-b398-434e-a236-df15342339d5',
            {
                delta: '0',
                meta: {
                    id: 'c5a73d64-b398-434e-a236-df15342339d5',
                    type: 'value',
                    version: '2.1',
                },
                name: 'Value Name',
                number: { max: 100, min: 0, step: 1, unit: 'c' },
                period: '0',
                permission: 'rw',
                type: 'temperature',
            },
            {}
        );
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/value/c5a73d64-b398-434e-a236-df15342339d5/state',
            expect.objectContaining({
                data: 'NA',
                meta: { type: 'state', version: '2.1' },
                type: 'Report',
            }),
            {}
        );

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

        expect(value?.eventlog[0]?.message).toEqual('test');
        expect(value?.eventlog[0]?.toJSON).toBeDefined();
    });

    it('can create a new network from wappsto with verbose', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse(simpleNetworkResponse)
        );

        config({ verbose: true });
        const networks = await Network.fetchByName();
        config({ verbose: false });

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/network', {
            params: {
                expand: 3,
                go_internal: true,
                verbose: true,
                method: ['retrieve'],
            },
        });
        expect(networks[0]?.name).toEqual('test');
    });

    it('can find a network by name', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse(simpleNetworkResponse));

        const r = Network.findByName('test');
        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/notification',
                },
            })
        );
        sendRpcResponse(server);

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                custom: {
                    data: {
                        selected: [
                            {
                                meta: {
                                    id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
                                },
                            },
                        ],
                    },
                },
                base: {
                    code: 1100004,
                    identifier: 'network-1-Find 1 network with name test',
                    ids: [],
                },
            },
        });
        const network = await r;

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/network', {
            params: {
                expand: 3,
                quantity: 1,
                go_internal: true,
                manufacturer: false,
                message: 'Find 1 network with name test',
                identifier: 'network-1-Find 1 network with name test',
                this_name: '=test',
                method: ['retrieve', 'update'],
            },
        });
        expect(network[0].meta.id).toEqual(
            'b62e285a-5188-4304-85a0-3982dcb575bc'
        );
    });

    it('can find device by name', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([fullNetworkResponse])
        );

        const networks = await Network.fetchByName();
        const device = networks[0].findDeviceByName('Device Name');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(device[0].name).toEqual('Device Name');
        expect(device[0].toJSON).toBeDefined();
    });

    it('can find device by product', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([fullNetworkResponse])
        );

        const networks = await Network.fetchByName();
        const device = networks[0].findDeviceByProduct('Device Product');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(device[0].name).toEqual('Device Name');
        expect(device[0].toJSON).toBeDefined();
    });

    it('can find value by name', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([fullNetworkResponse])
        );

        const networks = await Network.fetchByName();
        const value = networks[0]?.findValueByName('Value Name');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(value[0].name).toEqual('Value Name');
        expect(value[0].toJSON).toBeDefined();
    });

    it('can find value by type', async () => {
        const network = new Network();
        network.device.push(new Device());
        network.device[0].value.push(new Value());
        network.device[0].value[0].type = 'test';
        const value = network.findValueByType('test');

        expect(value[0].type).toEqual('test');
    });

    it('can reload and get new devices', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: '0a4de380-1c16-4b5c-a081-912b931ff891',
                        version: '2.1',
                    },
                    name: 'network',
                    device: [
                        {
                            meta: {
                                id: '048d2bb4-f0dc-48da-9bb8-f83f48f8bcc4',
                                version: '2.1',
                            },
                            name: 'device 1',
                        },
                        'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        {
                            meta: {
                                id: 'b3fb2261-e6d9-48c4-97a2-71bf299736b8',
                                version: '2.1',
                            },
                            name: 'device 3',
                        },
                        {
                            meta: {
                                id: '0af35945-f38b-4528-a7c7-3a7d42a2a132',
                                version: '2.1',
                            },
                            name: 'device 4',
                        },
                    ],
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        version: '2.1',
                    },
                    name: 'device 2',
                })
            );

        const device = new Device();
        device.meta.id = '0af35945-f38b-4528-a7c7-3a7d42a2a132';
        device.name = 'device';

        const network = new Network();
        network.meta.id = '0a4de380-1c16-4b5c-a081-912b931ff891';
        network.device.push(device);

        await network.reload();

        //expect(mockedAxios.get).toHaveBeenCalledWith('');
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);

        expect(network.name).toEqual('network');
        expect(network.device.length).toEqual(4);
        expect(network.device[0].name).toEqual('device 1');
        expect(network.device[1].name).toEqual('device 2');
        expect(network.device[2].name).toEqual('device 3');
        expect(network.device[3].name).toEqual('device 4');
    });

    it('can create a new device as a child', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse([
                {
                    meta: {
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        version: '2.1',
                    },
                },
            ])
        );

        const network = new Network();
        network.meta.id = '0a4de380-1c16-4b5c-a081-912b931ff891';
        const device = await network.createDevice({
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
            '/2.1/network/0a4de380-1c16-4b5c-a081-912b931ff891/device',
            {
                communication: 'communication',
                description: 'description',
                manufacturer: 'manufacturer',
                meta: {
                    type: 'device',
                    version: '2.1',
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
        mockedAxios.get.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse([
                {
                    meta: {
                        type: 'network',
                        version: '2.1',
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    },
                    name: 'Network Name',
                    description: 'Description',
                },
            ])
        );

        const network = await createNetwork({
            name: 'Network Name',
            description: 'Description',
            method: ['retrieve'],
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/network', {
            params: {
                expand: 3,
                go_internal: true,
                'this_name=': 'Network Name',
                method: ['retrieve'],
            },
        });
        expect(network.name).toEqual('Network Name');
        expect(network.description).toEqual('Description');
        expect(network.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can return device as a child', async () => {
        mockedAxios.put.mockResolvedValueOnce(
            makeResponse([
                {
                    communication: 'communication',
                    description: 'description',
                    manufacturer: 'manufacturer',
                    meta: {
                        type: 'device',
                        version: '2.1',
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    },
                    name: 'Device Name',
                    product: 'product',
                    protocol: 'protocol',
                    serial: 'serial',
                    version: 'version',
                },
            ])
        );

        const oldDevice = new Device('Device Name');
        oldDevice.meta.id = 'f589b816-1f2b-412b-ac36-1ca5a6db0273';
        const network = new Network();
        network.meta.id = '0a4de380-1c16-4b5c-a081-912b931ff891';
        network.device.push(oldDevice);
        const device = await network.createDevice({
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
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);

        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.1/device/f589b816-1f2b-412b-ac36-1ca5a6db0273',
            {
                communication: 'communication',
                description: 'description',
                manufacturer: 'manufacturer',
                meta: {
                    type: 'device',
                    version: '2.1',
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
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse(response2Networks));
        const r = Network.findAllByName('test');
        await server.connected;

        await new Promise((r) => setTimeout(r, 1));

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

        const network = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/network', {
            params: {
                expand: 3,
                quantity: 'all',
                go_internal: true,
                manufacturer: false,
                message: 'Find all network with name test',
                identifier: 'network-all-Find all network with name test',
                this_name: '=test',
                method: ['retrieve', 'update'],
            },
        });
        expect(network[0].meta.id).toEqual(
            'b62e285a-5188-4304-85a0-3982dcb575bc'
        );
        expect(network[1].meta.id).toEqual(
            'aa9da00a-b5e2-4651-a111-92cb0899ee7c'
        );
    });

    it('can use custom find', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse(response2Networks));
        const r = Network.find({ name: 'test' });
        await server.connected;

        await new Promise((r) => setTimeout(r, 100));

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {},
        });

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                custom: {
                    data: {},
                },
            },
        });

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

        const network = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/network', {
            params: {
                expand: 3,
                quantity: 1,
                go_internal: true,
                manufacturer: false,
                message: 'Find 1 network',
                identifier: 'network-1-Find 1 network',
                this_name: '=test',
                method: ['retrieve', 'update'],
            },
        });
        expect(network[0].meta.id).toEqual(
            'b62e285a-5188-4304-85a0-3982dcb575bc'
        );
    });

    it('can delete a network', async () => {
        mockedAxios.delete.mockResolvedValueOnce(makeResponse([]));

        const network = new Network('network');
        network.meta.id = 'f36caf6f-eb2d-4e00-91ac-6b3a6ba04b02';
        await network.delete();
        const res = await network.update();

        expect(res).toBe(false);
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledWith(
            '/2.1/network/f36caf6f-eb2d-4e00-91ac-6b3a6ba04b02',
            {}
        );
    });

    it('can load all missing object using lazy loading', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([responseHalf]))
            .mockResolvedValueOnce(makeResponse({ type: 'Control' }))
            .mockResolvedValueOnce(makeResponse([{ name: 'Value Name 2' }]))
            .mockResolvedValueOnce(
                makeResponse([
                    { name: 'Device Name 2' },
                    { name: 'Device Name 3' },
                    {
                        meta: {
                            id: 'e65ec3eb-04f1-4253-bd1b-b989b1204b81',
                            version: '2.1',
                            type: 'device',
                        },
                        name: 'Device Name 4',
                        product: 'Device Product',
                        value: [
                            {
                                meta: {
                                    id: 'c5a73d64-b398-434e-a236-df15342339d5',
                                    version: '2.1',
                                    type: 'value',
                                },
                                name: 'Value Name',
                                state: [
                                    {
                                        meta: {
                                            id: 'd58e1d50-0182-4a39-bd03-129f5d316c20',
                                            version: '2.1',
                                            type: 'state',
                                        },
                                        type: 'Control',
                                    },
                                ],
                            },
                        ],
                    },
                ])
            );

        const networks = await Network.fetchByName();

        const device1 = networks[0].device[0];
        const device2 = networks[0].device[1];
        const device3 = networks[0].device[2];
        const device4 = networks[0].device[3];
        const value1 = device1.value[0];
        const value2 = device1.value[1];
        const state1 = value1.state[0];
        const state2 = value1.state[1];

        expect(mockedAxios.get).toHaveBeenCalledTimes(4);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/network', {
            params: { expand: 3, go_internal: true, method: ['retrieve'] },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            3,
            '/2.1/device/e65ec3eb-04f1-4253-bd1b-b989b1204b81/value',
            {
                params: {
                    expand: 1,
                    go_internal: true,
                    offset: 1,
                    method: ['retrieve'],
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            4,
            '/2.1/network/b62e285a-5188-4304-85a0-3982dcb575bc/device',
            {
                params: {
                    expand: 2,
                    go_internal: true,
                    offset: 1,
                    method: ['retrieve'],
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/9ee509d7-07ce-4e71-9016-340d53867af4',
            { params: { expand: 0 } }
        );

        expect(device1.name).toEqual('Device Name');
        expect(device2.name).toEqual('Device Name 2');
        expect(device3.name).toEqual('Device Name 3');
        expect(device4.name).toEqual('Device Name 4');

        expect(value1.name).toEqual('Value Name');
        expect(value2.name).toEqual('Value Name 2');

        expect(state1.type).toEqual('Report');
        expect(state2.type).toEqual('Control');

        expect(device4.value[0].state[0].toJSON).toBeDefined();
    });

    it('can delete a device and make sure that it is not valid', async () => {
        mockedAxios.delete.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post
            .mockResolvedValueOnce(makeResponse(simpleNetworkResponse))
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'device',
                            version: '2.1',
                            id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
                        },
                        name: 'Device Test',
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'device',
                            version: '2.1',
                            id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
                        },
                        name: 'Device Test',
                    },
                ])
            );

        const network = new Network();
        await network.create();
        const dev1 = await network.createDevice({
            name: 'Device Test',
        });
        await dev1.delete();

        const dev2 = await network.createDevice({
            name: 'Device Test',
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);

        expect(dev1.name).toEqual('Device Test');
        expect(dev2.name).toEqual('Device Test');

        expect(dev1.meta.id).toEqual(undefined);
        expect(dev2.meta.id).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can handle a device create', async () => {
        const f = jest.fn();
        const n = new Network();
        n.meta.id = 'db6ba9ca-ea15-42d3-9c5e-1e1f50110f38';

        const createPromise = n.onCreate(f);

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/network/db6ba9ca-ea15-42d3-9c5e-1e1f50110f38',
                },
            })
        );
        sendRpcResponse(server);

        await createPromise;

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'create',
            path: '/2.1/network/db6ba9ca-ea15-42d3-9c5e-1e1f50110f38/device',
            data: {
                meta: {
                    id: '60323236-54bf-499e-a438-608a24619c94',
                    type: 'device',
                },
                name: 'Device Name',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(f).toHaveBeenCalledTimes(1);
        expect(n.device.length).toBe(1);
        expect(n.device[0].name).toEqual('Device Name');
        expect(n.device[0].toJSON).toBeDefined();
    });

    it('reload all the data from the server', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([fullNetworkResponse]))
            .mockResolvedValueOnce(makeResponse(simpleNetworkResponse));

        const network = await createNetwork({ name: 'Network Name' });

        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/network', {
            params: {
                expand: 3,
                go_internal: true,
                'this_name=': 'Network Name',
                method: ['retrieve'],
            },
        });

        expect(network.id()).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
        expect(network.device.length).toEqual(1);

        await network.reload(true);

        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            '/2.1/network/b62e285a-5188-4304-85a0-3982dcb575bc',
            {
                params: {
                    expand: 3,
                },
            }
        );

        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('can check if network is online', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([fullNetworkResponse]))
            .mockResolvedValueOnce(makeResponse(simpleNetworkResponse))
            .mockResolvedValueOnce(makeResponse([responseOffline]));

        const network = await createNetwork({ name: 'test name' });
        const res = network.isOnline();
        const network2 = await createNetwork({ name: 'test name2' });
        const res2 = network2.isOnline();
        const network3 = await createNetwork({ name: 'test name3' });
        const res3 = network3.isOnline();

        expect(res).toBe(true);
        expect(res2).toBe(false);
        expect(res3).toBe(false);
        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('can find network by id', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([fullNetworkResponse]));

        const r = Network.findById('b62e285a-5188-4304-85a0-3982dcb575bc');
        await server.connected;
        await new Promise((r) => setTimeout(r, 1));

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                custom: {
                    data: {
                        selected: [
                            {
                                meta: {
                                    id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
                                },
                            },
                        ],
                    },
                },
                base: {
                    code: 1100004,
                    identifier:
                        'network-1-Find network with id b62e285a-5188-4304-85a0-3982dcb575bc',
                    ids: [],
                },
            },
        });

        const network = await r;

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/network', {
            params: {
                expand: 3,
                quantity: 1,
                go_internal: true,
                manufacturer: false,
                message:
                    'Find network with id b62e285a-5188-4304-85a0-3982dcb575bc',
                identifier:
                    'network-1-Find network with id b62e285a-5188-4304-85a0-3982dcb575bc',
                'this_meta.id': '=b62e285a-5188-4304-85a0-3982dcb575bc',
                method: ['retrieve', 'update'],
            },
        });
        expect(network.toJSON).toBeDefined();
        expect(network.meta.id).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('will clear the id, when failing to talk to backend', async () => {
        mockedAxios.get.mockRejectedValueOnce(makeErrorResponse({}));
        const network = new Network();
        network.meta.id = '744be12b-85a5-4ef0-8ca1-00856a748049';
        await network.reload();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(network.meta.id).toBe(undefined);
    });

    it('will remove old device when reloading', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([fullNetworkResponse]))
            .mockResolvedValueOnce(makeResponse([fullNetworkResponseUpdated]));

        const network = await createNetwork({ name: 'Wapp Network' });

        expect(network.device.length).toBe(1);
        expect(network.device[0].id()).toEqual(
            'e65ec3eb-04f1-4253-bd1b-b989b1204b81'
        );

        await network.reload(true);

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/network/b62e285a-5188-4304-85a0-3982dcb575bc',
            { params: { expand: 3 } }
        );

        expect(network.device.length).toBe(2);
        expect(network.device[0].id()).toEqual(
            '0922117e-0c06-4318-ae9b-004f389d468b'
        );
        expect(network.device[1].id()).toEqual(
            'b30f8960-a8bf-46c8-b0c8-d0a7659fd1c1'
        );
    });

    it('can find using filter', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(responses['fetch_network'])
        );

        const networks = await Network.findByFilter({
            value: { type: 'energy', number: { max: [1, 2] } },
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/network',
            {
                filter: {
                    attribute: [
                        'value_type==energy',
                        'value_number.max==[1,2]',
                    ],
                },
                return: '{network  { meta{id type version connection name_by_user} name description device  { meta{id type version connection name_by_user} name product serial description protocol communication version manufacturer value (attribute: ["this_type==energy","this_number.max==[1,2]"]) { meta{id type version connection name_by_user} name permission description type period delta number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}}}',
            },
            {
                params: {
                    expand: 3,
                    fetch: true,
                    go_internal: true,
                    manufacturer: false,
                    identifier: 'network-1-Find 1 network using filter',
                    message: 'Find 1 network using filter',
                    method: ['retrieve', 'update'],
                    quantity: 1,
                },
            }
        );

        expect(networks.length).toEqual(1);
    });

    it('can find all using filter', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(responses['fetch_network'])
        );

        const networks = await Network.findAllByFilter({
            value: { type: 'energy' },
        });

        expect(networks.length).toEqual(11);
        expect(networks[0].reload).toBeDefined();

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/network',
            {
                filter: { attribute: ['value_type==energy'] },
                return: '{network  { meta{id type version connection name_by_user} name description device  { meta{id type version connection name_by_user} name product serial description protocol communication version manufacturer value (attribute: ["this_type==energy"]) { meta{id type version connection name_by_user} name permission description type period delta number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}}}',
            },
            {
                params: {
                    expand: 3,
                    fetch: true,
                    go_internal: true,
                    manufacturer: false,
                    identifier: 'network-all-Find all network using filter',
                    message: 'Find all network using filter',
                    method: ['retrieve', 'update'],
                    quantity: 'all',
                },
            }
        );
    });

    it('can find all using omit filter', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(responses['fetch_network'])
        );

        const networks = await Network.findAllByFilter(
            { device: { name: 'test' } },
            {
                value: { type: 'energy' },
            }
        );

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/network',
            {
                filter: {
                    attribute: ['device_name==test', 'value_type!=energy'],
                },
                return: '{network  { meta{id type version connection name_by_user} name description device (attribute: ["this_name==test"]) { meta{id type version connection name_by_user} name product serial description protocol communication version manufacturer value (attribute: ["this_type!=energy"]) { meta{id type version connection name_by_user} name permission description type period delta number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}}}',
            },
            {
                params: {
                    expand: 3,
                    fetch: true,
                    go_internal: true,
                    manufacturer: false,
                    identifier: 'network-all-Find all network using filter',
                    message: 'Find all network using filter',
                    method: ['retrieve', 'update'],
                    quantity: 'all',
                },
            }
        );

        expect(networks.length).toEqual(11);
    });

    it('can load all items after using a filter', async () => {
        mockedAxios.post.mockResolvedValue(
            makeResponse(responses['network_filter'])
        );
        mockedAxios.get.mockResolvedValue(
            makeResponse(responses['network_reload'])
        );

        const networks = await Network.findAllByFilter({
            device: { manufacturer: 'Seluxit' },
            value: { type: 'temperature', number: { max: 85 } },
        });

        expect(networks[0].device.length).toBe(1);
        expect(networks[0].device[0].value.length).toBe(1);

        const res = await networks[0].reload(true);

        expect(res).toBe(true);
        expect(networks[0].device.length).toBe(1);
        expect(networks[0].device[0].value.length).toBe(4);

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);

        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/network',
            {
                filter: {
                    attribute: [
                        'device_manufacturer==Seluxit',
                        'value_type==temperature',
                        'value_number.max==85',
                    ],
                },
                return: '{network  { meta{id type version connection name_by_user} name description device (attribute: ["this_manufacturer==Seluxit"]) { meta{id type version connection name_by_user} name product serial description protocol communication version manufacturer value (attribute: ["this_type==temperature","this_number.max==85"]) { meta{id type version connection name_by_user} name permission description type period delta number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}}}',
            },
            {
                params: {
                    expand: 3,
                    quantity: 'all',
                    message: 'Find all network using filter',
                    identifier: 'network-all-Find all network using filter',
                    method: ['retrieve', 'update'],
                    go_internal: true,
                    fetch: true,
                    manufacturer: false,
                },
            }
        );

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/network/11c73ade-ddf0-4bd1-8ad5-c3d05dd1dd1f',
            { params: { expand: 3 } }
        );
    });
});
