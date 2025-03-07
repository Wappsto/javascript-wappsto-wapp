import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { Device, Value, ValueTemplate, State, config } from '../src/index';
import { before, after, newWServer, sendRpcResponse } from './util/stream';
import {
    responses,
    makeDeviceResponse,
    makeValueResponse,
    makeStateResponse,
    makeNumberValueResponse,
} from './util/response';
import { delay, makeResponse } from './util/helpers';

const templateHelperStart = () => {
    mockedAxios.post
        .mockResolvedValueOnce(
            makeResponse([
                {
                    meta: {
                        type: 'value',
                        version: '2.1',
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    },
                },
            ])
        )
        .mockResolvedValueOnce(
            makeResponse([
                {
                    meta: {
                        type: 'state',
                        version: '2.1',
                        id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    },
                },
            ])
        )
        .mockResolvedValueOnce(
            makeResponse([
                {
                    meta: {
                        type: 'state',
                        version: '2.1',
                        id: 'd5ad7430-7948-47b5-ab85-c9a93d0bff5b',
                    },
                },
            ])
        );
};

const templateHelperDone = () => {
    expect(mockedAxios.get).toHaveBeenCalledTimes(0);
    expect(mockedAxios.put).toHaveBeenCalledTimes(0);
    expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
    expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
        2,
        '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
        expect.objectContaining({
            meta: {
                type: 'state',
                version: '2.1',
            },
            data: 'NA',
            type: 'Report',
        }),
        {}
    );
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
        3,
        '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
        expect.objectContaining({
            meta: {
                type: 'state',
                version: '2.1',
            },
            data: 'NA',
            type: 'Control',
        }),
        {}
    );
};

describe('device', () => {
    let server: WS;

    beforeAll(() => {
        before();
    });

    beforeEach(() => {
        server = newWServer(true);
    });

    afterEach(() => {
        after();
    });

    const response2Devices = [
        makeDeviceResponse({
            id: 'a8175d07-db1b-4a5b-92dd-45ae573ba78a',
            name: 'test',
        }),
        makeDeviceResponse({
            id: '7c1611da-46e2-4f0d-85fa-1b010561b35d',
            name: 'test',
        }),
    ];

    const response3Devices = [
        makeDeviceResponse({
            id: '782c5147-0852-4ed2-ac64-66d56385cfd8',
            name: 'test',
        }),
        makeDeviceResponse({
            id: '7c1611da-46e2-4f0d-85fa-1b010561b35d',
            name: 'test',
        }),
        '47631c40-b687-4eca-9844-94be7328773f',
    ];

    it('can create a new device class', () => {
        const name = 'Test Device';
        const device = new Device(name);

        expect(device.name).toEqual(name);
    });

    it('can create a device on wappsto', async () => {
        const response = makeDeviceResponse();
        mockedAxios.post.mockResolvedValueOnce(makeResponse(response));

        const device = new Device('test');
        await device.create();

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device',
            {
                meta: {
                    type: 'device',
                    version: '2.1',
                },
                name: 'test',
            },
            {}
        );
        expect(device.name).toEqual(response.name);
        expect(device.values).toEqual([]);
        expect(device.meta.id).toEqual(response.meta.id);
    });

    it('can update a device on wappsto', async () => {
        const response = makeDeviceResponse();
        mockedAxios.post.mockResolvedValueOnce(makeResponse(response));
        mockedAxios.put.mockResolvedValueOnce(makeResponse(response));

        const device = new Device('test');
        await device.create();
        const oldName = response.name;
        response.name = 'new name';
        device.name = 'new name';
        await device.update();

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
            `/2.1/device/${device.meta.id}`,
            {
                ...response,
                value: undefined,
            },
            {}
        );

        response.name = oldName;
    });

    it('can create a new device from wappsto', async () => {
        const response = makeDeviceResponse();
        mockedAxios.get.mockResolvedValueOnce(makeResponse([response]));

        const devices = await Device.fetch();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/device', {
            params: { go_internal: true, expand: 2, method: ['retrieve'] },
        });
        expect(devices[0]?.name).toEqual(response.name);
    });

    it('can create a new device from wappsto with verbose', async () => {
        const response = makeDeviceResponse();
        mockedAxios.get.mockResolvedValueOnce(makeResponse([response]));

        config({ verbose: true });
        const devices = await Device.fetch();
        config({ verbose: false });

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/device', {
            params: {
                expand: 2,
                go_internal: true,
                verbose: true,
                method: ['retrieve'],
            },
        });
        expect(devices[0]?.name).toEqual(response.name);
    });

    it('can find a device by name', async () => {
        const response = makeDeviceResponse();
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([response]));

        const r = Device.findByName('test');
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
                    ids: [response.meta.id],
                },
            },
        });

        const device = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/device', {
            params: {
                expand: 2,
                go_internal: true,
                identifier: 'device-1-Find 1 device with name test',
                manufacturer: false,
                message: 'Find 1 device with name test',
                method: ['retrieve', 'update'],
                quantity: 1,
                this_name: '=test',
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(2, '/2.1/device', {
            params: {
                expand: 2,
                go_internal: true,
                id: [response.meta.id],
                manufacturer: false,
                method: ['retrieve', 'update'],
                this_name: '=test',
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(device[0].toJSON).toBeDefined();
        expect(device[0].meta.id).toEqual(response.meta.id);
    });

    it('can find a device by product', async () => {
        const response = makeDeviceResponse();
        mockedAxios.get.mockResolvedValueOnce(makeResponse([response]));

        const devices = await Device.findByProduct('test');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/device', {
            params: {
                expand: 2,
                go_internal: true,
                manufacturer: false,
                this_product: '=test',
                identifier: 'device-1-Find 1 device with product test',
                message: 'Find 1 device with product test',
                quantity: 1,
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(devices[0].meta.id).toEqual(response.meta.id);
    });

    it('can load all missing object using lazy loading', async () => {
        const deviceID = '15bd24b5-a314-41d9-abdb-e2dadaab068c';
        const valueID1 = '3df6bf3d-c690-4290-8f53-233dbdf59cc1';
        const valueID2 = 'c3be1897-2bf7-4a34-b0e6-97516ac964be';
        const valueID3 = '99f758c3-5358-495c-a680-409d18cd25b5';
        const stateID1 = 'bcb9ec9c-89ec-40e1-815e-ad6e8976f862';
        const stateID2 = '9474bb8b-6dca-47ae-acdf-a9005a470210';
        const response = makeDeviceResponse({
            name: 'Device Name 1',
            id: deviceID,
            values: [
                makeValueResponse({
                    name: 'Value Name 1',
                    id: valueID1,
                    states: [
                        makeStateResponse({ id: stateID1, type: 'Report' }),
                        stateID2,
                    ],
                }),
                valueID2,
            ],
        });

        mockedAxios.get
            .mockResolvedValueOnce(makeResponse(response))
            .mockResolvedValueOnce(
                makeResponse([makeStateResponse({ type: 'Control' })])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeValueResponse({
                        name: 'Value Name 2',
                        id: valueID2,
                    }),
                    valueID3,
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeValueResponse({
                        name: 'Value Name 3',
                        id: valueID3,
                    }),
                ])
            );

        const device = await Device.fetchById(deviceID);

        const value1 = device?.value[0];
        const value2 = device?.value[1];
        const value3 = device?.value[2];
        const state1 = value1?.state[0];
        const state2 = value1?.state[1];

        expect(value1?.name).toEqual('Value Name 1');
        expect(value2?.name).toEqual('Value Name 2');
        expect(value3?.name).toEqual('Value Name 3');

        expect(state1?.type).toEqual('Report');
        expect(state2?.type).toEqual('Control');

        expect(device?.value[0].state[0].toJSON).toBeDefined();

        expect(mockedAxios.get).toHaveBeenCalledTimes(4);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            `/2.1/device/${deviceID}`,
            {
                params: { expand: 2, go_internal: true, method: ['retrieve'] },
            }
        );
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
            `/2.1/device/${deviceID}/value`,
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
            `/2.1/device/${deviceID}/value`,
            {
                params: {
                    expand: 1,
                    go_internal: true,
                    method: ['retrieve'],
                    offset: 2,
                },
            }
        );
    });

    it('can reload and get new values', async () => {
        const deviceID = '8fd80c88-f760-4593-96ef-eb1338324a95';
        const valueID1 = '53052a2b-494b-49c8-8b8e-b08cc69b26ea';
        const valueID2 = '2f27d5f0-c289-40f5-9331-3dd946ffcc65';
        const valueID3 = '872dbd66-3530-4797-abd3-53f246a943b3';
        const valueID4 = 'c30d2175-b748-44b0-b8de-0e15e0ad630d';
        mockedAxios.get
            .mockResolvedValueOnce(
                makeResponse(
                    makeDeviceResponse({
                        name: 'device',
                        id: deviceID,
                        values: [
                            makeValueResponse({
                                name: 'value 1',
                                id: valueID1,
                            }),
                            valueID2,
                            makeValueResponse({
                                name: 'value 3',
                                id: valueID3,
                            }),
                            makeValueResponse({
                                name: 'value 4',
                                id: valueID4,
                            }),
                        ],
                    })
                )
            )
            .mockResolvedValueOnce(
                makeResponse(
                    makeValueResponse({ name: 'value 3', id: valueID3 })
                )
            )
            .mockResolvedValueOnce(
                makeResponse(
                    makeValueResponse({ name: 'value 4', id: valueID4 })
                )
            )
            .mockResolvedValue(
                makeResponse([
                    makeValueResponse({ name: 'value 2', id: valueID2 }),
                ])
            );

        const value = new Value();
        value.meta.id = valueID1;
        value.name = 'value';

        const device = new Device();
        device.meta.id = deviceID;
        device.value.push(value);

        await device.reload();

        expect(mockedAxios.get).toHaveBeenCalledTimes(4);

        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            `/2.1/device/${deviceID}`,
            {
                params: {
                    expand: 0,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            `/2.1/value/${valueID3}`,
            {
                params: {
                    expand: 1,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            3,
            `/2.1/value/${valueID4}`,
            {
                params: {
                    expand: 1,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            4,
            `/2.1/device/${deviceID}/value`,
            {
                params: {
                    expand: 1,
                    go_internal: true,
                    method: ['retrieve'],
                    offset: 1,
                },
            }
        );

        expect(device.name).toEqual('device');
        expect(device.value.length).toEqual(4);
        expect(device.value[0].name).toEqual('value 1');
        expect(device.value[1].name).toEqual('value 2');
        expect(device.value[2].name).toEqual('value 3');
        expect(device.value[3].name).toEqual('value 4');
    });

    it('can create a value from a NUMBER template', async () => {
        templateHelperStart();

        const device = new Device();
        device.meta.id = '10483867-3182-4bb7-be89-24c2444cf8b7';
        const value = await device.createValue(
            'name',
            'rw',
            ValueTemplate.NUMBER,
            '0',
            2
        );

        templateHelperDone();

        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/10483867-3182-4bb7-be89-24c2444cf8b7/value',
            {
                meta: {
                    type: 'value',
                    version: '2.1',
                },
                name: 'name',
                permission: 'rw',
                type: 'number',
                period: '0',
                delta: '2',
                number: {
                    min: -128,
                    max: 128,
                    step: 0.1,
                    unit: '',
                },
            },
            {}
        );

        expect(value.name).toEqual('name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('number');
        expect(value.number?.min).toEqual(-128);
        expect(value.number?.max).toEqual(128);
        expect(value.number?.step).toEqual(0.1);
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can reuse a value from a NUMBER template', async () => {
        mockedAxios.put.mockResolvedValueOnce(makeResponse({}));

        const st = new State('Report', '123');
        st.meta.id = 'bde1b7ed-de87-496a-baf3-7c258ec3db05';
        st.timestamp = 'timestamp';

        const val = new Value('name');
        val.meta.id = '1ff269bc-5a90-424b-9442-cc90570ad479';
        val.state = [st];

        const device = new Device();
        device.meta.id = '10483867-3182-4bb7-be89-24c2444cf8b7';

        val.parent = device;
        device.value = [val];
        await device.createValue('name', 'r', ValueTemplate.NUMBER, '0', 2);

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
            '/2.1/value/1ff269bc-5a90-424b-9442-cc90570ad479',
            {
                delta: '2',
                meta: {
                    id: '1ff269bc-5a90-424b-9442-cc90570ad479',
                    type: 'value',
                    version: '2.1',
                },
                name: 'name',
                number: { max: 128, min: -128, step: 0.1, unit: '' },
                period: '0',
                permission: 'r',
                type: 'number',
            },
            {}
        );
    });

    it('can create a value from a STRING template', async () => {
        templateHelperStart();

        const device = new Device();
        device.meta.id = '10483867-3182-4bb7-be89-24c2444cf8b7';
        const value = await device.createValue(
            'name',
            'rw',
            ValueTemplate.STRING
        );

        templateHelperDone();

        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/10483867-3182-4bb7-be89-24c2444cf8b7/value',
            {
                meta: {
                    type: 'value',
                    version: '2.1',
                },
                name: 'name',
                permission: 'rw',
                period: '0',
                delta: '0',
                type: 'string',
                string: {
                    max: 64,
                    encoding: '',
                },
            },
            {}
        );

        expect(value.name).toEqual('name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('string');
        expect(value.string?.max).toEqual(64);
        expect(value.string?.encoding).toEqual('');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can create a value from a XML template', async () => {
        templateHelperStart();

        const device = new Device();
        device.meta.id = '10483867-3182-4bb7-be89-24c2444cf8b7';
        const value = await device.createValue('name', 'rw', ValueTemplate.XML);

        templateHelperDone();

        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/10483867-3182-4bb7-be89-24c2444cf8b7/value',
            {
                meta: {
                    type: 'value',
                    version: '2.1',
                },
                name: 'name',
                permission: 'rw',
                period: '0',
                delta: '0',
                type: 'xml',
                xml: {
                    xsd: '',
                    namespace: '',
                },
            },
            {}
        );

        expect(value.name).toEqual('name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('xml');
        expect(value.xml?.xsd).toEqual('');
        expect(value.xml?.namespace).toEqual('');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can create a value from a BLOB template', async () => {
        templateHelperStart();

        const device = new Device();
        device.meta.id = '10483867-3182-4bb7-be89-24c2444cf8b7';
        const value = await device.createValue(
            'name',
            'rw',
            ValueTemplate.BLOB
        );

        templateHelperDone();

        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/10483867-3182-4bb7-be89-24c2444cf8b7/value',
            {
                meta: {
                    type: 'value',
                    version: '2.1',
                },
                name: 'name',
                permission: 'rw',
                period: '0',
                delta: '0',
                type: 'blob',
                blob: {
                    max: 280,
                    encoding: 'base64',
                },
            },
            {}
        );

        expect(value.name).toEqual('name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('blob');
        expect(value.blob?.max).toEqual(280);
        expect(value.blob?.encoding).toEqual('base64');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can create a value from a VOLTAGE_V template', async () => {
        templateHelperStart();

        const device = new Device();
        device.meta.id = '10483867-3182-4bb7-be89-24c2444cf8b7';
        const value = await device.createValue(
            'name',
            'rw',
            ValueTemplate.VOLTAGE_V,
            '0',
            2
        );

        templateHelperDone();

        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/10483867-3182-4bb7-be89-24c2444cf8b7/value',
            {
                meta: {
                    type: 'value',
                    version: '2.1',
                },
                name: 'name',
                permission: 'rw',
                type: 'voltage',
                period: '0',
                delta: '2',
                measure_type: 'electricity',
                number: {
                    min: 0,
                    max: 250,
                    step: 0.1,
                    unit: 'V',
                },
            },
            {}
        );

        expect(value.name).toEqual('name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('voltage');
        expect(value.number?.min).toEqual(0);
        expect(value.number?.max).toEqual(250);
        expect(value.number?.step).toEqual(0.1);
        expect(value.number?.unit).toEqual('V');
        expect(value.measure_type).toEqual('electricity');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('will remove states when the permission is changed', async () => {
        templateHelperStart();

        mockedAxios.post.mockResolvedValueOnce({
            data: [
                makeStateResponse({
                    id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    type: 'Control',
                }),
            ],
        });

        const device = new Device();
        device.meta.id = '10483867-3182-4bb7-be89-24c2444cf8b7';
        const value = await device.createValue(
            'name',
            'rw',
            ValueTemplate.NUMBER
        );

        templateHelperDone();

        const value2 = await device.createValue(
            'name',
            'r',
            ValueTemplate.NUMBER
        );

        expect(value.permission).toEqual('r');
        expect(value.state.length).toBe(1);
        expect(value.state[0].type).toEqual('Report');

        await device.createValue('name', 'w', ValueTemplate.NUMBER);

        expect(value).toBe(value2);

        expect(mockedAxios.post).toHaveBeenCalledTimes(4);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(2);

        expect(mockedAxios.delete).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/d5ad7430-7948-47b5-ab85-c9a93d0bff5b',
            {}
        );
        expect(mockedAxios.delete).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/8d0468c2-ed7c-4897-ae87-bc17490733f7',
            {}
        );

        expect(value.permission).toEqual('w');
        expect(value.state.length).toBe(1);
        expect(value.state[0].type).toEqual('Control');
    });

    it('fails to create a value when parameters is missing', async () => {
        const device = new Device();
        device.meta.id = '10483867-3182-4bb7-be89-24c2444cf8b7';

        expect.assertions(2);
        const errors: Error[] = [];

        try {
            await device.createValue('name');
        } catch (error) {
            errors.push(error as Error);
        }

        try {
            await device.createValue('name', undefined, ValueTemplate.NUMBER);
        } catch (error) {
            errors.push(error as Error);
        }

        expect(errors[0]).toEqual(
            new Error(
                'Missing parameter "valueTemplate" in createValue function'
            )
        );
        expect(errors[1]).toEqual(
            new Error('Missing parameter "permission" in createValue function')
        );
    });

    it('can create a value with historical disabled', async () => {
        templateHelperStart();

        const device = new Device();
        device.meta.id = '10483867-3182-4bb7-be89-24c2444cf8b7';
        const value = await device.createValue(
            'name',
            'rw',
            ValueTemplate.NUMBER,
            '0',
            2,
            true
        );

        templateHelperDone();

        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/10483867-3182-4bb7-be89-24c2444cf8b7/value',
            {
                meta: {
                    type: 'value',
                    version: '2.1',
                    historical: false,
                },
                name: 'name',
                permission: 'rw',
                type: 'number',
                period: '0',
                delta: '2',
                number: {
                    min: -128,
                    max: 128,
                    step: 0.1,
                    unit: '',
                },
            },
            {}
        );

        expect(value.name).toEqual('name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('number');
        expect(value.number?.min).toEqual(-128);
        expect(value.number?.max).toEqual(128);
        expect(value.number?.step).toEqual(0.1);
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can create a value with period and delta disabled', async () => {
        templateHelperStart();

        const device = new Device();
        device.meta.id = 'f589b816-1f2b-412b-ac36-1ca5a6db0273';
        const value = await device.createValue({
            name: 'name',
            permission: 'rw',
            template: ValueTemplate.NUMBER,
            disablePeriodAndDelta: true,
        });
        templateHelperDone();

        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/f589b816-1f2b-412b-ac36-1ca5a6db0273/value',
            {
                meta: {
                    type: 'value',
                    version: '2.1',
                },
                name: 'name',
                permission: 'rw',
                type: 'number',
                number: {
                    min: -128,
                    max: 128,
                    step: 0.1,
                    unit: '',
                },
            },
            {}
        );

        expect(value.name).toEqual('name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('number');
        expect(value.number?.min).toEqual(-128);
        expect(value.number?.max).toEqual(128);
        expect(value.number?.step).toEqual(0.1);
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can create a new number value with historical disabled', async () => {
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse([
                    makeValueResponse({
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        name: 'Value Name',
                        type: 'type',
                        permission: '',
                        delta: 'delta',
                    }),
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeStateResponse({
                        id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    }),
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeStateResponse({
                        id: 'd5ad7430-7948-47b5-ab85-c9a93d0bff5b',
                    }),
                ])
            );

        const device = new Device();
        device.meta.id = '35a99d31-b51a-4e20-ad54-a93e8eed21a3';
        const value = await device.createNumberValue({
            name: 'Value Name',
            permission: 'rw',
            type: 'type',
            delta: 'delta',
            min: 0,
            max: 1,
            step: 1,
            unit: 'unit',
            si_conversion: 'si_conversion',
            disableLog: true,
            measure_type: 'electricity',
            initialState: {
                data: 0,
                timestamp: '2020-02-02T02:02:02Z',
            },
        });

        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('type');
        expect(value.delta).toEqual('delta');
        expect(value.measure_type).toEqual('electricity');
        expect(value.number?.min).toEqual(0);
        expect(value.number?.max).toEqual(1);
        expect(value.number?.step).toEqual(1);
        expect(value.number?.unit).toEqual('unit');
        expect(value.number?.si_conversion).toEqual('si_conversion');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/35a99d31-b51a-4e20-ad54-a93e8eed21a3/value',
            expect.objectContaining({
                permission: 'rw',
                type: 'type',
                meta: {
                    type: 'value',
                    version: '2.1',
                    historical: false,
                },
                name: 'Value Name',
                delta: 'delta',
                measure_type: 'electricity',
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
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                },
                data: '0',
                timestamp: '2020-02-02T02:02:02Z',
                type: 'Report',
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            3,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                },
                data: '0',
                timestamp: '2020-02-02T02:02:02Z',
                type: 'Control',
            }),
            {}
        );
    });

    it('can update a value with new parameters', async () => {
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse([
                    makeValueResponse({
                        id: '7ce07133-5fa4-4421-bc3e-bf89d9a40117',
                        name: 'Value Name',
                        type: 'type',
                        permission: '',
                        delta: 'delta',
                    }),
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeStateResponse({
                        id: '786b044c-d1c5-4e0d-96aa-2b150e01f827',
                        type: 'Report',
                    }),
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeStateResponse({
                        id: '21c5c04c-3590-4c8f-a2f7-9dce89ccb8f3',
                        type: 'Control',
                    }),
                ])
            )
            .mockResolvedValueOnce(makeResponse([]));
        mockedAxios.put.mockResolvedValueOnce(makeResponse([]));

        const device = new Device();
        device.meta.id = '1a093f1a-6e86-4b5e-9065-a9489f73c83d';
        const value = await device.createNumberValue({
            name: 'Value Name',
            permission: 'rw',
            type: 'type',
            delta: 'delta',
            min: 0,
            max: 1,
            step: 1,
            unit: 'unit',
            initialState: {
                data: 0,
                timestamp: '2020-02-02T02:02:02Z',
            },
        });

        const newValue = await device.createNumberValue({
            name: 'Value Name',
            permission: 'rw',
            type: 'type',
            delta: 'delta',
            min: 0,
            max: 1,
            step: 1,
            unit: 'unit',
            si_conversion: 'si_conversion',
            disableLog: true,
            measure_type: 'electricity',
            initialState: {
                data: 0,
                timestamp: '2020-02-02T02:02:02Z',
            },
        });

        expect(value.meta.id).toEqual(newValue.meta.id);
        expect(newValue.measure_type).toEqual('electricity');

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
            '/2.1/value/7ce07133-5fa4-4421-bc3e-bf89d9a40117',
            {
                delta: 'delta',
                measure_type: 'electricity',
                meta: {
                    historical: false,
                    id: '7ce07133-5fa4-4421-bc3e-bf89d9a40117',
                    type: 'value',
                    version: '2.1',
                },
                name: 'Value Name',
                number: {
                    max: 1,
                    min: 0,
                    si_conversion: 'si_conversion',
                    step: 1,
                    unit: 'unit',
                },
                period: '0',
                permission: 'rw',
                type: 'type',
            },
            {}
        );
        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/1a093f1a-6e86-4b5e-9065-a9489f73c83d/value',
            {
                delta: 'delta',
                meta: { type: 'value', version: '2.1' },
                name: 'Value Name',
                number: { max: 1, min: 0, step: 1, unit: 'unit' },
                period: '0',
                permission: 'rw',
                type: 'type',
            },
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            '/2.1/value/7ce07133-5fa4-4421-bc3e-bf89d9a40117/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                },
                data: '0',
                timestamp: '2020-02-02T02:02:02Z',
                type: 'Report',
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            3,
            '/2.1/value/7ce07133-5fa4-4421-bc3e-bf89d9a40117/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                },
                data: '0',
                timestamp: '2020-02-02T02:02:02Z',
                type: 'Control',
            }),
            {}
        );
    });

    it('can create a new string value as a child', async () => {
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse([
                    makeValueResponse({
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        name: 'Value Name',
                        type: 'type',
                        delta: 'delta',
                    }),
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeStateResponse({
                        id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    }),
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeStateResponse({
                        id: 'd5ad7430-7948-47b5-ab85-c9a93d0bff5b',
                    }),
                ])
            );

        const device = new Device();
        device.meta.id = '35a99d31-b51a-4e20-ad54-a93e8eed21a3';
        const value = await device.createStringValue({
            name: 'Value Name',
            permission: 'wr',
            type: 'type',
            delta: 'delta',
            max: 10,
            encoding: 'encoding',
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/35a99d31-b51a-4e20-ad54-a93e8eed21a3/value',
            expect.objectContaining({
                permission: 'wr',
                type: 'type',
                period: '0',
                meta: {
                    type: 'value',
                    version: '2.1',
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
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                },
                data: 'NA',
                type: 'Report',
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            3,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                },
                data: 'NA',
                type: 'Control',
            }),
            {}
        );
        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('wr');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('0');
        expect(value.delta).toEqual('delta');
        expect(value.string?.max).toEqual(10);
        expect(value.string?.encoding).toEqual('encoding');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can create a new blob value as a child', async () => {
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse([
                    makeValueResponse({
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        name: 'Value Name',
                        type: 'type',
                        delta: 'delta',
                    }),
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeStateResponse({
                        id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    }),
                ])
            );

        const device = new Device();
        device.meta.id = '35a99d31-b51a-4e20-ad54-a93e8eed21a3';
        const value = await device.createBlobValue({
            name: 'Value Name',
            permission: 'r',
            type: 'type',
            delta: 'delta',
            max: 10,
            encoding: 'encoding',
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/35a99d31-b51a-4e20-ad54-a93e8eed21a3/value',
            expect.objectContaining({
                permission: 'r',
                type: 'type',
                period: '0',
                meta: {
                    type: 'value',
                    version: '2.1',
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
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                },
                data: 'NA',
                type: 'Report',
            }),
            {}
        );
        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('r');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('0');
        expect(value.delta).toEqual('delta');
        expect(value.blob?.max).toEqual(10);
        expect(value.blob?.encoding).toEqual('encoding');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can create a new xml value as a child', async () => {
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse([
                    makeValueResponse({
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        name: 'Value Name',
                        type: 'type',
                        delta: 'delta',
                    }),
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeStateResponse({
                        id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    }),
                ])
            );

        const device = new Device();
        device.meta.id = '35a99d31-b51a-4e20-ad54-a93e8eed21a3';
        const value = await device.createXmlValue({
            name: 'Value Name',
            permission: 'w',
            type: 'type',
            period: '0',
            delta: 'delta',
            xsd: 'xsd',
            namespace: 'namespace',
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/35a99d31-b51a-4e20-ad54-a93e8eed21a3/value',
            expect.objectContaining({
                permission: 'w',
                type: 'type',
                period: '0',
                meta: {
                    type: 'value',
                    version: '2.1',
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
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                },
                data: 'NA',
                type: 'Control',
            }),
            {}
        );
        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('w');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('0');
        expect(value.delta).toEqual('delta');
        expect(value.xml?.xsd).toEqual('xsd');
        expect(value.xml?.namespace).toEqual('namespace');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');
    });

    it('can return value as a child', async () => {
        mockedAxios.put.mockResolvedValueOnce(
            makeResponse([
                makeNumberValueResponse({
                    permission: 'rw',
                    type: 'type',
                    period: '0',
                    id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    name: 'Value Name',
                    delta: 'delta',
                    min: 0,
                    max: 1,
                    step: 1,
                    unit: 'unit',
                    si_conversion: 'si_conversion',
                }),
            ])
        );
        mockedAxios.post
            .mockResolvedValueOnce(makeResponse({}))
            .mockResolvedValueOnce(makeResponse({}));

        const device = new Device();
        device.meta.id = '61e94999-c6c4-4051-8b5d-97ba73bbb312';
        const val = new Value();
        val.name = 'Value Name';
        val.meta.id = 'f589b816-1f2b-412b-ac36-1ca5a6db0273';
        device.value.push(val);
        const value = await device.createNumberValue({
            name: 'Value Name',
            permission: 'rw',
            type: 'type',
            period: '0',
            delta: 'delta',
            min: 0,
            max: 1,
            step: 1,
            unit: 'unit',
            si_conversion: 'si_conversion',
        });

        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('0');
        expect(value.delta).toEqual('delta');
        expect(value.number?.min).toEqual(0);
        expect(value.number?.max).toEqual(1);
        expect(value.number?.step).toEqual(1);
        expect(value.number?.unit).toEqual('unit');
        expect(value.number?.si_conversion).toEqual('si_conversion');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                data: 'NA',
                meta: { type: 'state', version: '2.1' },
                type: 'Report',
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                data: 'NA',
                meta: { type: 'state', version: '2.1' },
                type: 'Control',
            }),
            {}
        );
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273',
            expect.objectContaining({
                permission: 'rw',
                type: 'type',
                period: '0',
                meta: {
                    id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    type: 'value',
                    version: '2.1',
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
    });

    it('can update a value when the parameters are changed', async () => {
        mockedAxios.put.mockResolvedValueOnce(
            makeResponse([
                makeNumberValueResponse({
                    permission: 'rw',
                    type: 'type',
                    period: '0',
                    id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    name: 'Value Name',
                    delta: 'delta',
                    min: 0,
                    max: 1,
                    step: 1,
                    unit: 'new unit',
                    si_conversion: 'si_conversion',
                }),
            ])
        );
        mockedAxios.post
            .mockResolvedValueOnce(makeResponse({}))
            .mockResolvedValueOnce(makeResponse({}));

        const device = new Device();
        device.meta.id = '61e94999-c6c4-4051-8b5d-97ba73bbb312';
        const val = new Value();
        val.meta.id = 'f589b816-1f2b-412b-ac36-1ca5a6db0273';
        val.name = 'Value Name';
        val.permission = 'rw';
        val.type = 'type';
        val.period = '0';
        val.delta = 'delta';
        val.number = {
            min: 0,
            max: 1,
            step: 1,
            unit: 'unit',
            si_conversion: 'si_conversion',
        };
        device.value.push(val);
        const value = await device.createNumberValue({
            name: 'Value Name',
            permission: 'rw',
            type: 'type',
            period: '0',
            delta: 'delta',
            min: 0,
            max: 1,
            step: 1,
            unit: 'new unit',
            si_conversion: 'si_conversion',
        });

        expect(value.name).toEqual('Value Name');
        expect(value.permission).toEqual('rw');
        expect(value.type).toEqual('type');
        expect(value.period).toEqual('0');
        expect(value.delta).toEqual('delta');
        expect(value.number?.min).toEqual(0);
        expect(value.number?.max).toEqual(1);
        expect(value.number?.step).toEqual(1);
        expect(value.number?.unit).toEqual('new unit');
        expect(value.number?.si_conversion).toEqual('si_conversion');
        expect(value.meta.id).toEqual('f589b816-1f2b-412b-ac36-1ca5a6db0273');

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                data: 'NA',
                meta: { type: 'state', version: '2.1' },
                type: 'Report',
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                data: 'NA',
                meta: { type: 'state', version: '2.1' },
                type: 'Control',
            }),
            {}
        );
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273',
            expect.objectContaining({
                permission: 'rw',
                type: 'type',
                period: '0',
                meta: {
                    type: 'value',
                    version: '2.1',
                    id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                },
                name: 'Value Name',
                delta: 'delta',
                number: {
                    min: 0,
                    max: 1,
                    step: 1,
                    unit: 'new unit',
                    si_conversion: 'si_conversion',
                },
            }),
            {}
        );
    });

    it('can find all devices by name', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse(response2Devices));

        const r = Device.findAllByName('test');
        const device = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/device', {
            params: {
                expand: 2,
                quantity: 'all',
                go_internal: true,
                manufacturer: false,
                message: 'Find all device with name test',
                identifier: 'device-all-Find all device with name test',
                this_name: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });

        expect(device[0].toJSON).toBeDefined();
        expect(device[0].meta.id).toEqual(response2Devices[0].meta.id);
        expect(device[1].meta.id).toEqual(response2Devices[1].meta.id);
    });

    it('can find all devices by product', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse(response2Devices));

        const r = Device.findAllByProduct('test');
        const device = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/device', {
            params: {
                expand: 2,
                quantity: 'all',
                go_internal: true,
                manufacturer: false,
                message: 'Find all device with product test',
                identifier: 'device-all-Find all device with product test',
                this_product: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });

        expect(device[0].toJSON).toBeDefined();
        expect(device[0].meta.id).toEqual(response2Devices[0].meta.id);
        expect(device[1].meta.id).toEqual(response2Devices[1].meta.id);
    });

    it('can use custom find', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse(response2Devices));

        const r = Device.find({ name: 'test' });
        const device = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/device', {
            params: {
                expand: 2,
                quantity: 1,
                go_internal: true,
                manufacturer: false,
                message: 'Find 1 device',
                identifier: 'device-1-Find 1 device',
                this_name: '=test',
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });

        expect(device[0].toJSON).toBeDefined();
        expect(device[0].meta.id).toEqual(response2Devices[0].meta.id);
    });

    it('can use initialState to send the correct value in post', async () => {
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse([
                    makeValueResponse({
                        id: 'b2c8fe69-eee5-4dc4-a1f0-54b2ab044b2b',
                        name: 'Test Value',
                        permission: '',
                    }),
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeStateResponse({
                        id: '1c067551-799a-4b35-9a75-5eb0b978ee97',
                    }),
                ])
            );

        const device = new Device();
        device.meta.id = 'c91500a4-3bc9-486e-a238-5f0614c3d9e0';

        const val = await device.createValue({
            name: 'Test Value',
            permission: 'r',
            template: ValueTemplate.NUMBER,
            initialState: { data: '20', timestamp: '2022-02-02T02:02:02Z' },
        });

        await val.report('30', '2023-03-03T03:03:03Z');

        await device.createValue({
            name: 'Test Value',
            permission: 'r',
            template: ValueTemplate.NUMBER,
            initialState: { data: '20', timestamp: '2022-02-02T02:02:02Z' },
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/c91500a4-3bc9-486e-a238-5f0614c3d9e0/value',
            {
                meta: { type: 'value', version: '2.1' },
                name: 'Test Value',
                number: { max: 128, min: -128, step: 0.1, unit: '' },
                period: '0',
                permission: 'r',
                type: 'number',
                delta: '0',
            },
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            '/2.1/value/b2c8fe69-eee5-4dc4-a1f0-54b2ab044b2b/state',
            expect.objectContaining({
                data: '20',
                meta: { type: 'state', version: '2.1' },
                type: 'Report',
                timestamp: '2022-02-02T02:02:02Z',
            }),
            {}
        );

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/1c067551-799a-4b35-9a75-5eb0b978ee97',
            expect.objectContaining({
                data: '30',
                type: 'Report',
                timestamp: '2023-03-03T03:03:03Z',
            }),
            {}
        );
    });

    it('can delete a value and make sure that it is not valid', async () => {
        const response = makeDeviceResponse();
        mockedAxios.delete.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post
            .mockResolvedValueOnce(makeResponse([response]))
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: '39054122-6c61-481d-a491-1663c0165ff7',
                        },
                        name: 'Test Value',
                        permission: '',
                    },
                ])
            )
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: '39054122-6c61-481d-a491-1663c0165ff7',
                        },
                        name: 'Test Value',
                        permission: '',
                    },
                ])
            )
            .mockResolvedValueOnce(makeResponse([]));

        const device = new Device();
        await device.create();
        const val1 = await device.createValue({
            name: 'Test Value',
            permission: 'r',
            template: ValueTemplate.NUMBER,
        });
        await val1.delete();

        const val2 = await device.createValue({
            name: 'Test Value',
            permission: 'r',
            template: ValueTemplate.NUMBER,
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(5);
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);

        expect(val1.name).toEqual('Test Value');
        expect(val2.name).toEqual('Test Value');

        expect(val1.meta.id).toEqual(undefined);
        expect(val2.meta.id).toEqual('39054122-6c61-481d-a491-1663c0165ff7');

        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device',
            { meta: { type: 'device', version: '2.1' }, name: '' },
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            `/2.1/device/${response.meta.id}/value`,
            {
                meta: { type: 'value', version: '2.1' },
                name: 'Test Value',
                number: { max: 128, min: -128, step: 0.1, unit: '' },
                period: '0',
                permission: 'r',
                type: 'number',
                delta: '0',
            },
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            3,
            '/2.1/value/39054122-6c61-481d-a491-1663c0165ff7/state',
            expect.objectContaining({
                data: 'NA',
                meta: { type: 'state', version: '2.1' },
                type: 'Report',
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            4,
            `/2.1/device/${response.meta.id}/value`,
            {
                meta: { type: 'value', version: '2.1' },
                name: 'Test Value',
                number: { max: 128, min: -128, step: 0.1, unit: '' },
                period: '0',
                permission: 'r',
                type: 'number',
                delta: '0',
            },
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            5,
            '/2.1/value/39054122-6c61-481d-a491-1663c0165ff7/state',
            expect.objectContaining({
                data: 'NA',
                meta: { type: 'state', version: '2.1' },
                type: 'Report',
            }),
            {}
        );
    });

    it('can handle a value create', async () => {
        const f = jest.fn();
        const d = new Device();
        d.meta.id = 'db6ba9ca-ea15-42d3-9c5e-1e1f50110f38';
        const createPromise = d.onCreate(f);

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/device/db6ba9ca-ea15-42d3-9c5e-1e1f50110f38',
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
            path: '/device/db6ba9ca-ea15-42d3-9c5e-1e1f50110f38/value',
            data: {
                meta: {
                    id: '60323236-54bf-499e-a438-608a24619c94',
                    type: 'value',
                },
                name: 'Value Name',
            },
        });

        await delay();

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(f).toHaveBeenCalledTimes(1);
        expect(d.value.length).toBe(1);
        expect(d.value[0].name).toEqual('Value Name');
        expect(d.value[0].toJSON).toBeDefined();
    });

    it('can listen for connection changes', async () => {
        const f = jest.fn();
        const d = new Device();
        d.meta.id = 'db6ba9ca-ea15-42d3-9c5e-1e1f50110f38';

        const connectionPromise = d.onConnectionChange(f);

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    data: '/2.1/device/db6ba9ca-ea15-42d3-9c5e-1e1f50110f38',
                    url: '/services/2.1/websocket/open/subscription',
                },
            })
        );
        sendRpcResponse(server);

        await connectionPromise;

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/device/db6ba9ca-ea15-42d3-9c5e-1e1f50110f38',
            data: {
                meta: {
                    id: '60323236-54bf-499e-a438-608a24619c94',
                    type: 'value',
                    connection: {
                        online: true,
                    },
                },
                name: 'Value Name',
            },
        });

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/device/db6ba9ca-ea15-42d3-9c5e-1e1f50110f38',
            data: {
                meta: {
                    id: '60323236-54bf-499e-a438-608a24619c94',
                    type: 'value',
                    connection: {
                        online: false,
                    },
                },
                name: 'Value Name',
            },
        });

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/device/db6ba9ca-ea15-42d3-9c5e-1e1f50110f38',
            data: {
                meta: {
                    id: '60323236-54bf-499e-a438-608a24619c94',
                    type: 'value',
                    connection: {
                        online: false,
                    },
                },
                name: 'Value Name',
            },
        });

        await delay();

        expect(f).toHaveBeenCalledTimes(2);
        expect(f).toHaveBeenNthCalledWith(1, d, true);
        expect(f).toHaveBeenNthCalledWith(2, d, false);

        d.cancelOnConnectionChange(f);

        server.send({
            meta_object: {
                type: 'event',
            },
            event: 'update',
            path: '/device/db6ba9ca-ea15-42d3-9c5e-1e1f50110f38',
            data: {
                meta: {
                    id: '60323236-54bf-499e-a438-608a24619c94',
                    type: 'value',
                    connection: {
                        online: true,
                    },
                },
                name: 'Value Name',
            },
        });

        await delay();

        expect(f).toHaveBeenCalledTimes(2);
        expect(f).toHaveBeenNthCalledWith(1, d, true);
        expect(f).toHaveBeenNthCalledWith(2, d, false);
    });

    it('can find device by id', async () => {
        const response = makeDeviceResponse();
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([response]));

        const r = Device.findById(response.meta.id);

        await delay();
        await server.connected;

        server.send({
            meta_object: {
                type: 'notification',
            },
            path: '/notification/',
            data: {
                base: {
                    code: 1100004,
                    identifier: `device-1-Find device with id ${response.meta.id}`,
                    ids: [response.meta.id],
                },
            },
        });

        const device = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/device', {
            params: {
                expand: 2,
                quantity: 1,
                go_internal: true,
                manufacturer: false,
                message: `Find device with id ${response.meta.id}`,
                identifier: `device-1-Find device with id ${response.meta.id}`,
                'this_meta.id': `=${response.meta.id}`,
                method: ['retrieve', 'update'],
                acl_attributes: ['parent_name_by_user'],
            },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(2, '/2.1/device', {
            params: {
                acl_attributes: ['parent_name_by_user'],
                expand: 2,
                go_internal: true,
                id: [response.meta.id],
                manufacturer: false,
                method: ['retrieve', 'update'],
                'this_meta.id': `=${response.meta.id}`,
            },
        });
        expect(device.toJSON).toBeDefined();
        expect(device.meta.id).toEqual(response.meta.id);
    });

    it('can make a device online', async () => {
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    makeStateResponse({
                        id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    }),
                ])
            );

        const d = new Device();
        d.meta.id = 'db6ba9ca-ea15-42d3-9c5e-1e1f50110f38';

        const responseOnline = await d.setConnectionStatus(1);

        const responseOffline = await d.setConnectionStatus(false);

        expect(responseOnline).toEqual(true);
        expect(responseOffline).toEqual(true);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device/db6ba9ca-ea15-42d3-9c5e-1e1f50110f38/value',
            expect.objectContaining({
                meta: {
                    type: 'value',
                    version: '2.1',
                },
                name: 'Connection',
                type: 'connection',
                permission: 'r',
            }),
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                },
                data: '1',
                type: 'Report',
            }),
            {}
        );

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/8d0468c2-ed7c-4897-ae87-bc17490733f7',
            expect.objectContaining({
                data: '0',
                type: 'Report',
            }),
            {}
        );
    });

    it('can find using filter', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(responses['fetch_device'])
        );

        const networks = await Device.findByFilter({
            value: { type: 'energy' },
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device',
            {
                filter: { attribute: ['value_type=energy'] },
                return: '{device  { meta{id type version connection name_by_user} name product serial description protocol communication version manufacturer value (attribute: ["this_type=energy"]) { meta{id type version connection name_by_user} name permission description type measure_type period delta thresholds number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}}',
            },
            {
                params: {
                    expand: 2,
                    fetch: true,
                    go_internal: true,
                    manufacturer: false,
                    identifier: 'device-1-Find 1 device using filter',
                    message: 'Find 1 device using filter',
                    method: ['retrieve', 'update'],
                    quantity: 1,
                    acl_attributes: ['parent_name_by_user'],
                },
            }
        );

        expect(networks.length).toEqual(1);
    });

    it('can find all using filter', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(responses['fetch_device'])
        );

        const networks = await Device.findAllByFilter(
            {
                value: {
                    type: ['energy', 'template'],
                    number: { max: 1, unit: 'C' },
                },
            },
            {
                network: { name: 'network name' },
            }
        );

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/device',
            {
                filter: {
                    attribute: [
                        'network_name!=network name',
                        'value_type=[energy,template]',
                        'value_number.max=1',
                        'value_number.unit=C',
                    ],
                },
                return: '{device  { meta{id type version connection name_by_user} name product serial description protocol communication version manufacturer value (attribute: ["this_type=[energy,template]","this_number.max=1","this_number.unit=C"]) { meta{id type version connection name_by_user} name permission description type measure_type period delta thresholds number string blob xml status state  { meta{id type version connection name_by_user} data type timestamp }}}}',
            },
            {
                params: {
                    expand: 2,
                    fetch: true,
                    go_internal: true,
                    manufacturer: false,
                    identifier: 'device-all-Find all device using filter',
                    message: 'Find all device using filter',
                    method: ['retrieve', 'update'],
                    quantity: 'all',
                    acl_attributes: ['parent_name_by_user'],
                },
            }
        );

        expect(networks.length).toEqual(22);
    });

    it('can create 3 new device from wappsto', async () => {
        const response = makeDeviceResponse();
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse(response3Devices))
            .mockResolvedValueOnce(makeResponse(response));

        const devices = await Device.fetch();

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/device', {
            params: { expand: 2, go_internal: true, method: ['retrieve'] },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            '/2.1/device/47631c40-b687-4eca-9844-94be7328773f',
            {
                params: { expand: 2, go_internal: true, method: ['retrieve'] },
            }
        );
        expect(devices.length).toEqual(3);
        expect(devices[0]?.name).toEqual('test');
        expect(devices[2]?.name).toEqual('test');
    });
});
