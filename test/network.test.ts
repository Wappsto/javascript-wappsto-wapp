import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import WS from 'jest-websocket-mock';
import { Device, Network, Value, config, createNetwork } from '../src/index';
import { delay, makeErrorResponse, makeResponse } from './util/helpers';
import {
    fullNetworkResponse,
    makeDeviceResponse,
    makeNetworkResponse,
    makeStateResponse,
    makeValueResponse,
    responses,
} from './util/response';
import { after, before, newWServer, sendRpcResponse } from './util/stream';

const responseOffline = {
    meta: {
        type: 'network',
        version: '2.1',
        id: '69296271-58f2-48e2-8bb3-84ea0a0e09ab',
        connection: {},
    },
    name: 'test',
};

const response2Networks = [
    {
        meta: {
            type: 'network',
            version: '2.1',
            id: 'f3852c94-25ed-4452-becd-61cd8314b498',
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
        const response = makeNetworkResponse({ name: 'test' });
        mockedAxios.post.mockResolvedValueOnce(makeResponse(response));

        const network = new Network('test');
        await network.create();

        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
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
        expect(network.meta.id).toEqual(response.meta.id);
    });

    it('can create a new networks from wappsto', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(
                makeResponse([
                    makeNetworkResponse({ name: 'test 1' }),
                    'd16ac42f-dedf-496f-a935-87ae9f29fb61',
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeNetworkResponse({
                        name: 'test 2',
                        id: 'd16ac42f-dedf-496f-a935-87ae9f29fb61',
                    }),
                ])
            );

        const networks = await Network.fetch();

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/network', {
            params: { go_internal: true, expand: 3, method: ['retrieve'] },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            '/2.1/network/d16ac42f-dedf-496f-a935-87ae9f29fb61',
            { params: { expand: 3, go_internal: true, method: ['retrieve'] } }
        );
        expect(networks[0]?.name).toEqual('test 1');
        expect(networks[1]?.name).toEqual('test 2');
    });

    it('can update a network on wappsto', async () => {
        const response = makeNetworkResponse({ name: 'test' });
        mockedAxios.post.mockResolvedValueOnce(makeResponse(response));
        mockedAxios.put.mockResolvedValueOnce(makeResponse(response));

        const network = new Network('test');
        await network.create();

        network.name = 'new name';
        await network.update();

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
            `/2.1/network/${response.meta.id}`,
            {
                meta: {
                    id: response.meta.id,
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
                    ids: ['e6ca9416-e226-46dd-a97b-29dfbdbec2b9'],
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
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/network', {
            params: {
                expand: 3,
                go_internal: true,
                'this_name=': 'Wapp Network',
                method: ['retrieve'],
            },
        });
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
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
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
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
            makeResponse(makeNetworkResponse({ name: 'test' }))
        );

        config({ verbose: true });
        const networks = await Network.fetchByName();
        config({ verbose: false });

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/network', {
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
        const response = makeNetworkResponse({ name: 'test' });
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse(response));

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
                                    id: response.meta.id,
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
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/network', {
            params: {
                expand: 3,
                quantity: 1,
                go_internal: true,
                manufacturer: false,
                message: 'Find 1 network with name test',
                identifier: 'network-1-Find 1 network with name test',
                this_name: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(2, '/2.1/network', {
            params: {
                expand: 3,
                go_internal: true,
                manufacturer: false,
                this_name: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
                id: [response.meta.id],
            },
        });
        expect(network[0].meta.id).toEqual(response.meta.id);
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
        const networkID = '4b4c4fd2-0710-481a-8379-f81838e48aa4';
        const deviceID1 = '05808780-8cc5-44e6-9b69-8bd102cc5b65';
        const deviceID2 = '4bf79be7-6a0e-4c6d-ac5d-1ee9ddaa4da0';
        const deviceID3 = 'd67d9d57-97f3-433e-b8cb-a925a2938d4a';
        const deviceID4 = '89d7f19d-b8b7-4f58-b19b-73869a92aeef';
        mockedAxios.get
            .mockResolvedValueOnce(
                makeResponse(
                    makeNetworkResponse({
                        name: 'network',
                        id: networkID,
                        devices: [
                            makeDeviceResponse({
                                name: 'device 1',
                                id: deviceID1,
                            }),
                            deviceID2,
                            makeDeviceResponse({
                                name: 'device 3',
                                id: deviceID3,
                            }),
                            makeDeviceResponse({
                                name: 'device 4',
                                id: deviceID4,
                            }),
                        ],
                    })
                )
            )
            .mockResolvedValueOnce(
                makeResponse(
                    makeDeviceResponse({ name: 'device 3', id: deviceID3 })
                )
            )
            .mockResolvedValueOnce(
                makeResponse(
                    makeDeviceResponse({ name: 'device 4', id: deviceID4 })
                )
            )
            .mockResolvedValue(
                makeResponse([
                    makeDeviceResponse({ name: 'device 2', id: deviceID2 }),
                ])
            );

        const device = new Device();
        device.meta.id = deviceID1;
        device.name = 'device';

        const network = new Network();
        network.meta.id = networkID;
        network.device.push(device);

        await network.reload();

        expect(mockedAxios.get).toHaveBeenCalledTimes(4);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            `/2.1/network/${networkID}`,
            {
                params: {
                    expand: 0,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            `/2.1/device/${deviceID3}`,
            {
                params: {
                    expand: 2,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            3,
            `/2.1/device/${deviceID4}`,
            {
                params: {
                    expand: 2,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            4,
            `/2.1/network/${networkID}/device`,
            {
                params: {
                    expand: 2,
                    go_internal: true,
                    method: ['retrieve'],
                    offset: 1,
                },
            }
        );

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
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
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
        });

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/network', {
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

        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
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
        const networkID1 = '59afce73-f161-4fb8-bae2-789be920be88';
        const networkID2 = 'df59953d-1b3c-44f5-9597-7714dd83a5f3';

        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(
                makeResponse([
                    makeNetworkResponse({ name: 'test 1', id: networkID1 }),
                    networkID2,
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeNetworkResponse({ name: 'test 2', id: networkID2 }),
                ])
            );

        const r = Network.findAllByName('test');
        await server.connected;

        await delay();

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                base: {
                    code: 1100004,
                    identifier: 'network-all-Find all network with name test',
                    ids: [networkID1, networkID2],
                },
            },
        });

        const network = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/network', {
            params: {
                expand: 3,
                quantity: 'all',
                go_internal: true,
                manufacturer: false,
                message: 'Find all network with name test',
                identifier: 'network-all-Find all network with name test',
                this_name: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(2, '/2.1/network', {
            params: {
                expand: 3,
                go_internal: true,
                manufacturer: false,
                this_name: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
                id: [networkID1, networkID2],
            },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            3,
            `/2.1/network/${networkID2}`,
            {
                params: {
                    expand: 3,
                    go_internal: true,
                    method: ['retrieve'],
                },
            }
        );
        expect(network[0].meta.id).toEqual(networkID1);
        expect(network[1].meta.id).toEqual(networkID2);
    });

    it('can use custom find', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse(response2Networks));
        const r = Network.find({ name: 'test' });
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        await server.connected;

        await delay(100);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
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
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                base: {
                    code: 1100004,
                    identifier: 'network-1-Find 1 network',
                    ids: [response2Networks[0].meta.id],
                },
            },
        });

        const network = await r;

        //expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/network', {
            params: {
                expand: 3,
                quantity: 1,
                go_internal: true,
                manufacturer: false,
                message: 'Find 1 network',
                identifier: 'network-1-Find 1 network',
                this_name: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(2, '/2.1/network', {
            params: {
                expand: 3,
                go_internal: true,
                manufacturer: false,
                this_name: '=test',
                method: ['retrieve', 'update'],
                id: [response2Networks[0].meta.id],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(network[0].meta.id).toEqual(response2Networks[0].meta.id);
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
        expect(mockedAxios.delete).toHaveBeenNthCalledWith(
            1,
            '/2.1/network/f36caf6f-eb2d-4e00-91ac-6b3a6ba04b02',
            {}
        );
    });

    it('can load all missing object using lazy loading', async () => {
        const response = makeNetworkResponse({ name: 'test' });
        const deviceID1 = '25dd9495-42c0-4ba8-b6f4-66d7894e1b06';
        const valueID2 = '01c35aa4-eaf4-44e6-b725-ac1f50c4e47c';
        const stateID2 = 'd69f2e6b-2fad-4e70-a720-e6232d01339c';
        response.device.push(
            makeDeviceResponse({
                name: 'Device Name 1',
                id: deviceID1,
                values: [
                    makeValueResponse({
                        name: 'Value Name 1',
                        states: [
                            makeStateResponse({ type: 'Report' }),
                            stateID2,
                        ],
                    }),
                    valueID2,
                ],
            })
        );
        response.device.push('8c0a4831-d118-4e48-8f9a-196f51e92b35');
        response.device.push('4bb75eec-cdb2-4be5-b9d0-f28c79db503f');
        response.device.push(makeDeviceResponse({ name: 'Device Name 4' }));

        mockedAxios.get
            .mockResolvedValueOnce(
                makeResponse([response, '242a83ad-ca9e-490a-85ef-c3aaea0e80c3'])
            )
            .mockResolvedValueOnce(
                makeResponse([makeStateResponse({ type: 'Control' })])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeValueResponse({
                        name: 'Value Name 2',
                        id: valueID2,
                    }),
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeDeviceResponse({
                        name: 'Device Name 2',
                        id: response.device[1] as string,
                    }),
                    makeDeviceResponse({
                        name: 'Device Name 3',
                        id: response.device[2] as string,
                    }),
                    makeDeviceResponse({
                        name: 'Device Name 4',
                        id: (response.device[3] as Device)?.meta.id,
                        values: [
                            makeValueResponse({
                                name: 'Value Name 3',
                                states: [makeStateResponse({ type: 'Report' })],
                            }),
                        ],
                    }),
                ])
            )
            .mockResolvedValue(makeResponse({}));

        const networks = await Network.fetchByName();

        const device1 = networks[0].device[0];
        const device2 = networks[0].device[1];
        const device3 = networks[0].device[2];
        const device4 = networks[0].device[3];
        const value1 = device1.value[0];
        const value2 = device1.value[1];
        const state1 = value1.state[0];
        const state2 = value1.state[1];

        expect(device1.name).toEqual('Device Name 1');
        expect(device2.name).toEqual('Device Name 2');
        expect(device3.name).toEqual('Device Name 3');
        expect(device4.name).toEqual('Device Name 4');

        expect(value1.name).toEqual('Value Name 1');
        expect(value2.name).toEqual('Value Name 2');

        expect(state1.type).toEqual('Report');
        expect(state2.type).toEqual('Control');

        expect(device4.value[0].state[0].toJSON).toBeDefined();

        expect(mockedAxios.get).toHaveBeenCalledTimes(5);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/network', {
            params: { expand: 3, go_internal: true, method: ['retrieve'] },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            `/2.1/state/${stateID2}`,
            {
                params: {
                    expand: 0,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            3,
            `/2.1/device/${deviceID1}/value`,
            {
                params: {
                    expand: 1,
                    go_internal: true,
                    method: ['retrieve'],
                    offset: 1,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            4,
            `/2.1/network/${response.meta.id}/device`,
            {
                params: {
                    expand: 2,
                    go_internal: true,
                    method: ['retrieve'],
                    offset: 1,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            5,
            '/2.1/network/242a83ad-ca9e-490a-85ef-c3aaea0e80c3',
            { params: { expand: 3, go_internal: true, method: ['retrieve'] } }
        );
    });

    it('can delete a device and make sure that it is not valid', async () => {
        mockedAxios.delete.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post
            .mockResolvedValueOnce(makeResponse(makeNetworkResponse()))
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'device',
                            version: '2.1',
                            id: '57259bd0-916e-4813-8b9a-16d49a48181f',
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
                            id: '700a43fb-f520-46de-b628-92c95a8d0e08',
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
        expect(dev2.meta.id).toEqual('700a43fb-f520-46de-b628-92c95a8d0e08');
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

        await delay();

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
            .mockResolvedValueOnce(makeResponse(makeNetworkResponse()));

        const network = await createNetwork({ name: 'Network Name' });

        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/network', {
            params: {
                expand: 3,
                go_internal: true,
                'this_name=': 'Network Name',
                method: ['retrieve'],
            },
        });

        expect(network.id()).toEqual(fullNetworkResponse.meta.id);
        expect(network.device.length).toEqual(1);

        await network.reload(true);

        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            `/2.1/network/${fullNetworkResponse.meta.id}`,
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
        const response = makeNetworkResponse({ connection: true });
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse(response))
            .mockResolvedValueOnce(makeResponse(makeNetworkResponse()))
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

        const r = Network.findById(fullNetworkResponse.meta.id);
        await server.connected;
        await delay();

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
                                    id: fullNetworkResponse.meta.id,
                                },
                            },
                        ],
                    },
                },
                base: {
                    code: 1100004,
                    identifier: `network-1-Find network with id ${fullNetworkResponse.meta.id}`,
                    ids: [],
                },
            },
        });

        const network = await r;

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/network', {
            params: {
                expand: 3,
                quantity: 1,
                go_internal: true,
                manufacturer: false,
                message: `Find network with id ${fullNetworkResponse.meta.id}`,
                identifier: `network-1-Find network with id ${fullNetworkResponse.meta.id}`,
                'this_meta.id': `=${fullNetworkResponse.meta.id}`,
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(2, '/2.1/network', {
            params: {
                expand: 3,
                go_internal: true,
                manufacturer: false,
                id: [fullNetworkResponse.meta.id],
                'this_meta.id': `=${fullNetworkResponse.meta.id}`,
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(network.toJSON).toBeDefined();
        expect(network.id()).toEqual(fullNetworkResponse.meta.id);
    });

    it('will clear the id, when failing to talk to backend', async () => {
        mockedAxios.get.mockRejectedValueOnce(
            makeErrorResponse(
                {},
                'Reject the reload',
                'will clear the id, when failing to talk to backend'
            )
        );
        const network = new Network();
        network.meta.id = '744be12b-85a5-4ef0-8ca1-00856a748049';

        const orgError = console.error;
        console.error = jest.fn();
        await network.reload();
        expect(console.error).toHaveBeenNthCalledWith(
            1,
            'WAPPSTO ERROR: Permission.reload - Unhandled code: Reject the reload for will clear the id, when failing to talk to backend'
        );
        console.error = orgError;

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(network.meta.id).toBe(undefined);
    });

    it('will remove old device when reloading', async () => {
        const deviceID1 = '566a88fb-a185-42be-962c-568209797bb5';
        const deviceID2 = '417c34e2-23dd-42fe-9486-2aefdf0dbe0b';
        const response = makeNetworkResponse({
            name: 'Wapp Name',
            devices: [makeDeviceResponse({ id: deviceID1 })],
        });
        const responseUpdated = makeNetworkResponse({
            name: 'Wapp Name',
            devices: [
                makeDeviceResponse({ id: deviceID1 }),
                makeDeviceResponse({ id: deviceID2 }),
            ],
        });
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([response]))
            .mockResolvedValueOnce(makeResponse([responseUpdated]))
            .mockResolvedValueOnce(makeResponse({}));

        const network = await createNetwork({ name: response.name });

        expect(network.device.length).toBe(1);
        expect(network.device[0].id()).toEqual(deviceID1);

        await network.reload(true);

        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, `/2.1/network`, {
            params: {
                expand: 3,
                go_internal: true,
                method: ['retrieve'],
                'this_name=': 'Wapp Name',
            },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            `/2.1/network/${response.meta.id}`,
            { params: { expand: 3 } }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            3,
            `/2.1/device/${deviceID2}`,
            { params: { expand: 2 } }
        );

        expect(network.device.length).toBe(2);
        expect(network.device[0].id()).toEqual(deviceID1);
        expect(network.device[1].id()).toEqual(deviceID2);
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

        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/network',
            {
                filter: {
                    attribute: ['value_type=energy', 'value_number.max=[1,2]'],
                },
                return: '{network  { meta{id type version connection name_by_user} name description device  { meta{id type version connection name_by_user} name product serial description protocol communication version manufacturer value (attribute: ["this_type=energy","this_number.max=[1,2]"]) { meta{id type version connection name_by_user} name permission description type period delta number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}}}',
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
                    acl_attributes: ['parent_name_by_user'],
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

        const networks = await Network.findAllByFilter(
            { network: { name: { operator: '!=', value: '' } } },
            {},
            true,
            `test`
        );

        expect(networks.length).toEqual(11);
        expect(networks[0].reload).toBeDefined();

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);

        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/network',
            {
                filter: { attribute: ['network_name!=[]'] },
                return: '{network (attribute: ["this_name!=[]"]) { meta{id type version connection name_by_user} name description device  { meta{id type version connection name_by_user} name product serial description protocol communication version manufacturer value  { meta{id type version connection name_by_user} name permission description type period delta number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}}}',
            },
            {
                params: {
                    expand: 3,
                    fetch: true,
                    go_internal: true,
                    manufacturer: false,
                    identifier: 'network-all-test',
                    message: 'test',
                    method: ['retrieve'],
                    acl_attributes: ['parent_name_by_user'],
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
            { device: { name: ['', 'test'] } },
            {
                value: { type: 'energy' },
            }
        );

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);

        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/network',
            {
                filter: {
                    attribute: ['device_name=[,test]', 'value_type!=energy'],
                },
                return: '{network  { meta{id type version connection name_by_user} name description device (attribute: ["this_name=[,test]"]) { meta{id type version connection name_by_user} name product serial description protocol communication version manufacturer value (attribute: ["this_type!=energy"]) { meta{id type version connection name_by_user} name permission description type period delta number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}}}',
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
                    acl_attributes: ['parent_name_by_user'],
                    quantity: 'all',
                },
            }
        );

        expect(networks.length).toEqual(11);
    });

    it('can load all items after using a filter', async () => {
        const networkID = '11c73ade-ddf0-4bd1-8ad5-c3d05dd1dd1f';
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(responses['network_filter'])
        );
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse(responses['network_reload']))
            .mockResolvedValueOnce(
                makeResponse(
                    makeValueResponse({
                        id: 'fcd2db59-3a61-482c-b322-a49b35c4c8fe',
                    })
                )
            )
            .mockResolvedValueOnce(
                makeResponse(
                    makeValueResponse({
                        id: '83b28292-c4d6-4126-9b83-8430a000febf',
                    })
                )
            )
            .mockResolvedValueOnce(
                makeResponse(
                    makeValueResponse({
                        id: '3e608a81-02f7-4acc-b02c-74aae728c945',
                    })
                )
            )
            .mockResolvedValue(makeResponse({ test: 'test' }));

        const networks = await Network.findAllByFilter({
            device: { manufacturer: 'Seluxit' },
            value: {
                type: 'temperature',
                number: { max: 85, min: { operator: '!~', value: 5 } },
            },
        });
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);

        expect(networks[0].device.length).toBe(1);
        expect(networks[0].device[0].value.length).toBe(1);

        const res = await networks[0].reload(true);

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(4);

        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            `/2.1/network/${networkID}`,
            { params: { expand: 3 } }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            `/2.1/value/fcd2db59-3a61-482c-b322-a49b35c4c8fe`,
            { params: { expand: 1 } }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            3,
            `/2.1/value/83b28292-c4d6-4126-9b83-8430a000febf`,
            { params: { expand: 1 } }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            4,
            `/2.1/value/3e608a81-02f7-4acc-b02c-74aae728c945`,
            { params: { expand: 1 } }
        );
        //expect(mockedAxios.get).toHaveBeenNthCalledWith(2, '/2.1/network');

        expect(res).toBe(true);
        expect(networks[0].device.length).toBe(1);
        expect(networks[0].device[0].value.length).toBe(4);

        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/network',
            {
                filter: {
                    attribute: [
                        'device_manufacturer=Seluxit',
                        'value_type=temperature',
                        'value_number.max=85',
                        'value_number.min!~5',
                    ],
                },
                return: '{network  { meta{id type version connection name_by_user} name description device (attribute: ["this_manufacturer=Seluxit"]) { meta{id type version connection name_by_user} name product serial description protocol communication version manufacturer value (attribute: ["this_type=temperature","this_number.max=85","this_number.min!~5"]) { meta{id type version connection name_by_user} name permission description type period delta number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}}}',
            },
            {
                params: {
                    expand: 3,
                    quantity: 'all',
                    message: 'Find all network using filter',
                    identifier: 'network-all-Find all network using filter',
                    method: ['retrieve', 'update'],
                    acl_attributes: ['parent_name_by_user'],
                    go_internal: true,
                    fetch: true,
                    manufacturer: false,
                },
            }
        );

        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/network/11c73ade-ddf0-4bd1-8ad5-c3d05dd1dd1f',
            { params: { expand: 3 } }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            '/2.1/value/fcd2db59-3a61-482c-b322-a49b35c4c8fe',
            { params: { expand: 1 } }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            3,
            '/2.1/value/83b28292-c4d6-4126-9b83-8430a000febf',
            { params: { expand: 1 } }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            4,
            '/2.1/value/3e608a81-02f7-4acc-b02c-74aae728c945',
            { params: { expand: 1 } }
        );
    });

    it('can fetch by ID', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(
                makeResponse(
                    makeNetworkResponse({
                        name: 'test 1',
                        id: '62648265-4328-4afb-a33a-9561b8715628',
                    })
                )
            )
            .mockResolvedValueOnce(makeResponse([]));
        const network1 = await Network.fetchById(
            '62648265-4328-4afb-a33a-9561b8715628'
        );
        const network2 = await Network.fetchById(
            '62648265-4328-4afb-a33a-9561b8715628'
        );

        expect(network1?.meta.id).toEqual(
            '62648265-4328-4afb-a33a-9561b8715628'
        );
        expect(network2).toBeUndefined();
    });
});
