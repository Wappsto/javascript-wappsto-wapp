import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import {
    createNetwork,
    Network,
    Device,
    Value,
    State,
    createNode,
    getAllNodes,
    ValueTemplate,
    IOntologyEdge,
} from '../src/index';
import { addModel } from '../src/util/modelStore';
import { before, after, newWServer } from './util/stream';
import {
    fullNetworkResponse,
    makeDeviceResponse,
    makeNetworkResponse,
    makeStateResponse,
    makeValueResponse,
    responses,
} from './util/response';
import { makeErrorResponse, makeResponse } from './util/helpers';

describe('Ontology', () => {
    beforeAll(() => {
        before();
    });

    beforeEach(() => {
        newWServer(true);
    });

    afterEach(() => {
        after();
    });

    it('can create a new edge', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: '1e844d39-6b70-4f96-b762-9c28c73c5410',
                        type: 'ontology',
                        version: '2.1',
                    },
                    name: 'Onto name',
                    description: 'Onto description',
                    data: { test: 'data' },
                    relationship: 'child',
                    to: {
                        state: ['f0a9683f-da8b-4fe6-9925-2e6768ddedeb'],
                    },
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: '9764d589-047e-4089-af0c-6034349df23f',
                        type: 'ontology',
                        version: '2.1',
                    },
                    name: 'Onto name2',
                    description: 'Onto description2',
                    data: { test: 'data2' },
                    relationship: 'look',
                    to: {
                        state: ['047f00f9-276b-4f5b-ba28-c1ab05f16e52'],
                    },
                })
            );

        const network = new Network('Ontology Network');
        network.meta.id = '99138103-743f-48a4-b120-322ec9e9d62c';

        const state1 = new State();
        state1.meta.id = 'f0a9683f-da8b-4fe6-9925-2e6768ddedeb';

        const state2 = new State();
        state2.meta.id = '047f00f9-276b-4f5b-ba28-c1ab05f16e52';

        addModel(network);
        addModel(state1);
        addModel(state2);

        const edge1 = await network.createEdge({
            relationship: 'child',
            to: state1,
            name: 'Onto name',
            description: 'Onto description',
            data: { test: 'data' },
        });
        const edge2 = await network.createEdge({
            relationship: 'look',
            to: state2,
            name: 'Onto name2',
            description: 'Onto description2',
            data: { test: 'data2' },
        });
        const edge3 = await network.createEdge({
            relationship: 'look',
            to: state2,
        });

        expect(edge1.relationship).toEqual('child');
        expect(edge1.models[0]).toBe(state1);
        expect(edge1.name).toEqual('Onto name');
        expect(edge1.description).toEqual('Onto description');
        expect(edge1.data).toEqual({ test: 'data' });
        expect(edge1.models[0]).toBe(state1);

        expect(edge2.relationship).toEqual('look');
        expect(edge2.models.length).toBe(1);
        expect(edge2.name).toEqual('Onto name2');
        expect(edge2.description).toEqual('Onto description2');
        expect(edge2.data).toEqual({ test: 'data2' });
        expect(edge2.models[0]).toBe(state2);

        expect(edge2).toBe(edge3);

        expect(network.ontology.length).toBe(2);
        expect(network.ontology[0]).toBe(edge1);
        expect(network.ontology[1]).toBe(edge2);

        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/network/99138103-743f-48a4-b120-322ec9e9d62c/ontology',
            {
                meta: {
                    type: 'ontology',
                    version: '2.1',
                },
                name: 'Onto name',
                description: 'Onto description',
                data: { test: 'data' },
                relationship: 'child',
                to: {
                    state: ['f0a9683f-da8b-4fe6-9925-2e6768ddedeb'],
                },
            },
            {}
        );
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/network/99138103-743f-48a4-b120-322ec9e9d62c/ontology',
            {
                meta: {
                    type: 'ontology',
                    version: '2.1',
                },
                name: 'Onto name2',
                description: 'Onto description2',
                data: { test: 'data2' },
                relationship: 'look',
                to: {
                    state: ['047f00f9-276b-4f5b-ba28-c1ab05f16e52'],
                },
            },
            {}
        );
    });

    it('can create a new node', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse({
                meta: {
                    id: 'dd4e6da3-f70f-403b-8ba0-79b1c14028d8',
                    type: 'data',
                    version: '2.1',
                },
            })
        );
        const node = await createNode('onto name');

        expect(node.data_meta.type).toEqual('ontology_node');
        expect(node.getClass()).toEqual('ontology_node');

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/data',
            {
                data: {},
                _secret_background: {},
                data_meta: {
                    id: 'ontology_node_onto name',
                    type: 'ontology_node',
                    version: 1,
                },
                meta: { type: 'data', version: '2.1' },
            },
            {}
        );
    });

    it('can get all edges on a network', async () => {
        const stateResponse = makeStateResponse({
            id: '311b2c2d-54de-4e00-a850-f6712c4622bd',
            data: '0',
        });
        const valueResponse = makeValueResponse({
            id: '75d7d198-7f91-45e2-9b79-754073d7e758',
            states: [stateResponse],
        });
        const deviceResponse = makeDeviceResponse({
            id: '8a3f67a6-751c-483b-a2ef-ba890948e6e4',
            values: [valueResponse],
        });
        const networkResponse = makeNetworkResponse({
            id: 'f11fa9d7-3b2b-474e-95e4-f086c5606154',
            devices: [deviceResponse],
        });
        mockedAxios.get
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            id: 'ee155377-566d-4c7a-a517-6e6d1eb1ff7e',
                            type: 'ontology',
                            version: '2.1',
                        },
                        name: 'Onto name',
                        description: 'Onto description',
                        data: { test: 'data' },
                        relationship: 'state',
                        to: {
                            state: ['311b2c2d-54de-4e00-a850-f6712c4622bd'],
                        },
                    },
                    {
                        meta: {
                            id: 'e0632888-53be-4613-9cea-db4867015f0c',
                            type: 'ontology',
                            version: '2.1',
                        },
                        relationship: 'child',
                        to: {
                            network: ['f11fa9d7-3b2b-474e-95e4-f086c5606154'],
                        },
                    },
                    {
                        meta: {
                            id: '8f364a18-34e2-480b-ade5-90f7c146d592',
                            type: 'ontology',
                            version: '2.1',
                        },
                        relationship: 'child',
                        to: {
                            device: ['8a3f67a6-751c-483b-a2ef-ba890948e6e4'],
                        },
                    },
                    {
                        meta: {
                            id: '0ee52b4d-0498-4784-b540-de3c3db0baa8',
                            type: 'ontology',
                            version: '2.1',
                        },
                        relationship: 'child',
                        to: {
                            value: ['75d7d198-7f91-45e2-9b79-754073d7e758'],
                        },
                    },
                    {
                        meta: {
                            id: 'ced1993c-798f-4ef1-b41a-c6106fa08d4e',
                            type: 'ontology',
                            version: '2.1',
                        },
                        relationship: 'child',
                        to: {
                            data: ['97e0dd7c-8e22-4263-82f9-d26102643465'],
                        },
                    },
                    {
                        meta: {
                            id: '3832afcd-3302-4045-901c-6dfd027277d7',
                            type: 'ontology',
                            version: '2.1',
                        },
                        relationship: 'child',
                        to: {
                            application: [
                                '76228636-afb4-4b1b-8c58-1d6b4bf956f0',
                            ],
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(makeResponse(stateResponse))
            .mockResolvedValueOnce(makeResponse(networkResponse))
            .mockResolvedValueOnce(makeResponse(deviceResponse))
            .mockResolvedValueOnce(makeResponse(valueResponse))
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        type: 'data',
                        version: '2.1',
                        id: '97e0dd7c-8e22-4263-82f9-d26102643465',
                    },
                })
            )
            .mockResolvedValueOnce(makeResponse(deviceResponse))
            .mockResolvedValueOnce(makeResponse(valueResponse))
            .mockResolvedValueOnce(makeResponse(valueResponse));

        const network = new Network('Ontology Network');
        network.meta.id = '99138103-743f-48a4-b120-322ec9e9d62c';

        const edges = await network.getAllEdges();

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(9);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/network/99138103-743f-48a4-b120-322ec9e9d62c/ontology',
            {
                params: {
                    expand: 1,
                    go_internal: true,
                    method: ['retrieve'],
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/311b2c2d-54de-4e00-a850-f6712c4622bd',
            {
                params: {
                    expand: 0,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            3,
            '/2.1/network/f11fa9d7-3b2b-474e-95e4-f086c5606154',
            {
                params: {
                    expand: 3,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            4,
            '/2.1/device/8a3f67a6-751c-483b-a2ef-ba890948e6e4',
            {
                params: {
                    expand: 2,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            5,
            '/2.1/value/75d7d198-7f91-45e2-9b79-754073d7e758',
            {
                params: {
                    expand: 1,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            6,
            '/2.1/data/97e0dd7c-8e22-4263-82f9-d26102643465',
            {
                params: {
                    expand: 0,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            7,
            '/2.1/device/8a3f67a6-751c-483b-a2ef-ba890948e6e4',
            {
                params: {
                    expand: 2,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            8,
            '/2.1/value/75d7d198-7f91-45e2-9b79-754073d7e758',
            {
                params: {
                    expand: 1,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            9,
            '/2.1/value/75d7d198-7f91-45e2-9b79-754073d7e758',
            {
                params: {
                    expand: 1,
                },
            }
        );

        expect(edges[0].relationship).toEqual('state');
        expect(edges[0].models.length).toBe(1);
        expect(edges[0].models[0].id()).toEqual(
            '311b2c2d-54de-4e00-a850-f6712c4622bd'
        );
        const state = edges[0].models[0] as State;
        expect(state.data).toEqual('0');

        expect(edges[1].relationship).toEqual('child');
        expect(edges[1].models.length).toBe(1);
        expect(edges[1].models[0].id()).toEqual(
            'f11fa9d7-3b2b-474e-95e4-f086c5606154'
        );
        const netChild = edges[1].models[0] as Network;
        expect(netChild.device[0].id()).toEqual(
            '8a3f67a6-751c-483b-a2ef-ba890948e6e4'
        );
        expect(netChild.device[0].value[0].id()).toEqual(
            '75d7d198-7f91-45e2-9b79-754073d7e758'
        );
        expect(netChild.device[0].value[0].state[0].id()).toEqual(
            '311b2c2d-54de-4e00-a850-f6712c4622bd'
        );

        expect(edges[2].models.length).toBe(1);
        expect(edges[2].models[0].id()).toEqual(
            '8a3f67a6-751c-483b-a2ef-ba890948e6e4'
        );
        const devChild = edges[2].models[0] as Device;
        expect(devChild.value[0].id()).toEqual(
            '75d7d198-7f91-45e2-9b79-754073d7e758'
        );
        expect(devChild.value[0].state[0].id()).toEqual(
            '311b2c2d-54de-4e00-a850-f6712c4622bd'
        );

        expect(edges[3].models.length).toBe(1);
        expect(edges[3].models[0].id()).toEqual(
            '75d7d198-7f91-45e2-9b79-754073d7e758'
        );
        const valChild = edges[3].models[0] as Value;
        expect(valChild.state[0].id()).toEqual(
            '311b2c2d-54de-4e00-a850-f6712c4622bd'
        );

        expect(edges[4].models.length).toBe(1);
        expect(edges[4].models[0].id()).toEqual(
            '97e0dd7c-8e22-4263-82f9-d26102643465'
        );

        expect(edges[5].models.length).toBe(0);
    });

    it('can get all nodes', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([
                {
                    meta: {
                        id: '09af28b3-0e84-4230-ab96-88990cfa04b8',
                        type: 'data',
                        version: '2.1',
                    },
                    data_meta: {
                        type: 'ontology_node',
                        version: '1',
                        id: 'ontology_node_1',
                    },
                },
                {
                    meta: {
                        id: '43cc3164-bd43-4bbb-8b62-246618cc28bf',
                        type: 'data',
                        version: '2.1',
                    },
                    data_meta: {
                        type: 'ontology_node',
                        version: '1',
                        id: 'ontology_node_2',
                    },
                },
            ])
        );
        const nodes = await getAllNodes();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);

        expect(nodes.length).toBe(2);
        expect(nodes[0].data_meta.id).toEqual('ontology_node_1');
        expect(nodes[1].data_meta.id).toEqual('ontology_node_2');
    });

    it('can remove an edge', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse({
                meta: {
                    id: '75f43647-bf73-44df-a04e-4d04e47cd0fc',
                    type: 'ontology',
                    version: '2.1',
                },
                relationship: 'child',
                to: {
                    state: ['f0a9683f-da8b-4fe6-9925-2e6768ddedeb'],
                },
            })
        );
        mockedAxios.delete.mockResolvedValueOnce(makeResponse({}));

        const network = new Network('Ontology Network');
        network.meta.id = '99138103-743f-48a4-b120-322ec9e9d62c';

        const state1 = new State();
        state1.meta.id = 'f0a9683f-da8b-4fe6-9925-2e6768ddedeb';

        addModel(state1);

        const edge1 = await network.createEdge({
            relationship: 'child',
            to: state1,
        });

        expect(network.ontology.length).toBe(1);
        expect(network.ontology[0].models.length).toBe(1);

        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        await edge1.delete();
        expect(network.ontology.length).toBe(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledWith(
            '/2.1/ontology/75f43647-bf73-44df-a04e-4d04e47cd0fc',
            {}
        );
    });

    it('can remove an edge using the child', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse({
                meta: {
                    id: '75f43647-bf73-44df-a04e-4d04e47cd0fc',
                    type: 'ontology',
                    version: '2.1',
                },
                relationship: 'child',
                to: {
                    state: ['f0a9683f-da8b-4fe6-9925-2e6768ddedeb'],
                },
            })
        );
        mockedAxios.delete.mockResolvedValueOnce(makeResponse({}));

        const network = new Network('Ontology Network');
        network.meta.id = '99138103-743f-48a4-b120-322ec9e9d62c';

        const state1 = new State();
        state1.meta.id = 'f0a9683f-da8b-4fe6-9925-2e6768ddedeb';

        addModel(state1);

        await network.createEdge({
            relationship: 'child',
            to: state1,
        });

        expect(network.ontology.length).toBe(1);
        expect(network.ontology[0].models.length).toBe(1);

        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        await network.deleteEdge({
            relationship: 'child',
            to: state1,
        });

        expect(network.ontology.length).toBe(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledWith(
            '/2.1/ontology/75f43647-bf73-44df-a04e-4d04e47cd0fc',
            {}
        );
    });

    it('can delete all edges', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([
                {
                    meta: {
                        id: '022fcd88-91ba-46cf-b53f-4268e6ce4196',
                        type: 'ontology',
                        version: '2.1',
                    },
                    name: 'Onto name',
                    description: 'Onto description',
                    data: { test: 'data' },
                    relationship: 'state',
                    to: {
                        state: ['311b2c2d-54de-4e00-a850-f6712c4622bd'],
                    },
                },
                {
                    meta: {
                        id: 'e0632888-53be-4613-9cea-db4867015f0c',
                        type: 'ontology',
                        version: '2.1',
                    },
                    relationship: 'child',
                    to: {
                        network: ['f11fa9d7-3b2b-474e-95e4-f086c5606154'],
                    },
                },
            ])
        );
        mockedAxios.delete
            .mockResolvedValueOnce(makeResponse({}))
            .mockResolvedValueOnce(makeResponse({}));

        const network = new Network('Ontology Network');
        network.meta.id = '99138103-743f-48a4-b120-322ec9e9d62c';

        await network.deleteEdges();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(2);

        expect(network.ontology.length).toBe(0);
    });

    it('can remove an branch', async () => {
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: 'f275ac72-a2fe-42fe-b4ea-e87eabfe14bf',
                        type: 'ontology',
                        version: '2.1',
                    },
                    relationship: 'child',
                    to: {
                        state: ['f0a9683f-da8b-4fe6-9925-2e6768ddedeb'],
                    },
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: 'd7224517-328f-4ccd-874c-06e3257dc090',
                        type: 'ontology',
                        version: '2.1',
                    },
                    relationship: 'look',
                    to: {
                        state: ['d2d27eab-bfaa-4253-b9cb-6402dc04e16b'],
                    },
                })
            );
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));
        mockedAxios.delete
            .mockResolvedValueOnce(makeResponse({}))
            .mockResolvedValueOnce(makeResponse({}));

        const network = new Network('Ontology Network');
        network.meta.id = '99138103-743f-48a4-b120-322ec9e9d62c';

        const state1 = new State();
        state1.meta.id = 'f0a9683f-da8b-4fe6-9925-2e6768ddedeb';

        const state2 = new State();
        state2.meta.id = 'd2d27eab-bfaa-4253-b9cb-6402dc04e16b';

        addModel(state1);
        addModel(state2);

        await network.createEdge({ relationship: 'child', to: state1 });
        await state1.createEdge({ relationship: 'look', to: state2 });

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/network/99138103-743f-48a4-b120-322ec9e9d62c/ontology',
            {
                params: {
                    expand: 1,
                    go_internal: true,
                    method: ['retrieve'],
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/state/f0a9683f-da8b-4fe6-9925-2e6768ddedeb/ontology',
            {
                params: {
                    expand: 1,
                    go_internal: true,
                    method: ['retrieve'],
                },
            }
        );

        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(network.ontology.length).toBe(1);
        expect(state1.ontology.length).toBe(1);

        await network.deleteBranch();
        expect(network.ontology.length).toBe(0);
        expect(state1.ontology.length).toBe(0);

        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(2);
    });

    it('can remove a node', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            id: '45332794-e710-4702-90d6-632fe461d3e5',
                            type: 'data',
                            version: '2.1',
                        },
                        data_meta: {
                            type: 'ontology_node',
                            version: '1',
                            id: 'ontology_node_2',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: '09af28b3-0e84-4230-ab96-88990cfa04b8',
                        type: 'data',
                        version: '2.1',
                    },
                    data_meta: {
                        type: 'ontology_node',
                        version: '1',
                        id: 'ontology_node_1',
                    },
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: 'b0553348-deac-4ed8-a546-f72346a60bb0',
                        type: 'ontology',
                        version: '2.1',
                    },
                    relationship: 'look',
                    to: {},
                })
            );
        mockedAxios.delete
            .mockResolvedValueOnce(makeResponse({}))
            .mockResolvedValueOnce(makeResponse({}));

        const node1 = await createNode('node 1');
        const node2 = await createNode('node 2');
        const edge1 = await node1.createEdge({
            relationship: 'link',
            to: node2,
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(4);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);

        await edge1.deleteBranch();

        expect(node1.ontology.length).toBe(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(4);
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(2);

        expect(mockedAxios.delete).toHaveBeenCalledWith(
            '/2.1/data/45332794-e710-4702-90d6-632fe461d3e5',
            {}
        );
        expect(mockedAxios.delete).toHaveBeenCalledWith(
            '/2.1/ontology/b0553348-deac-4ed8-a546-f72346a60bb0',
            {}
        );
    });

    it('can transverse the graph', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            id: '45332794-e710-4702-90d6-632fe461d3e5',
                            type: 'data',
                            version: '2.1',
                        },
                        data_meta: {
                            type: 'ontology_node',
                            version: '1',
                            id: 'ontology_node_2',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            id: '38248e1b-4b00-4721-b194-4c6147f6dd4d',
                            type: 'ontology',
                            version: '2.1',
                        },
                        relationship: 'look',
                        to: { state: ['f0a9683f-da8b-4fe6-9925-2e6768ddedeb'] },
                    },
                ])
            );
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: '09af28b3-0e84-4230-ab96-88990cfa04b8',
                        type: 'data',
                        version: '2.1',
                    },
                    data_meta: {
                        type: 'ontology_node',
                        version: '1',
                        id: 'ontology_node_1',
                    },
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: 'b0553348-deac-4ed8-a546-f72346a60bb0',
                        type: 'ontology',
                        version: '2.1',
                    },
                    relationship: 'look',
                    to: {},
                })
            );

        const node1 = await createNode('node 1');
        const node2 = await createNode('node 2');
        await node1.createEdge({
            relationship: 'link',
            to: node2,
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(4);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);

        const empty = await node1.transverse('*');

        expect(empty.length).toBe(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(5);
        expect(mockedAxios.get).toHaveBeenLastCalledWith(
            '/2.1/data/09af28b3-0e84-4230-ab96-88990cfa04b8/ontology',
            {
                params: {
                    expand: 1,
                    go_internal: true,
                    path: '*',
                    method: ['retrieve'],
                },
            }
        );

        const leafs = await node1.transverse('*', true);
        expect(leafs.length).toBe(1);
        expect(leafs[0].id()).toBe('f0a9683f-da8b-4fe6-9925-2e6768ddedeb');
        expect(mockedAxios.get).toHaveBeenCalledTimes(6);
        expect(mockedAxios.get).toHaveBeenLastCalledWith(
            '/2.1/data/09af28b3-0e84-4230-ab96-88990cfa04b8/ontology',
            {
                params: {
                    expand: 1,
                    go_internal: true,
                    path: '*',
                    all_edge: true,
                    method: ['retrieve'],
                },
            }
        );
    });

    it('can load all models from the store', async () => {
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'device',
                            version: '2.1',
                            id: '4d3e1192-bde3-4f39-8c84-45d02965ab4e',
                        },
                        name: 'Device Test',
                    },
                ])
            )
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
            );
        mockedAxios.get
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        type: 'network',
                        version: '2.1',
                        id: '59ec0368-cacd-4dd6-a633-03402732d1ef',
                        connection: {
                            online: true,
                            timestamp: '',
                        },
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
                                        id: '9ed44936-96f7-44b4-8880-aa0a197d89f0',
                                        version: '2.1',
                                        type: 'value',
                                    },
                                    name: 'Value Name',
                                    permission: 'w',
                                    type: 'temperature',
                                    number: {
                                        min: 0,
                                        max: 100,
                                        step: 1,
                                        unit: 'c',
                                    },
                                    state: [
                                        {
                                            meta: {
                                                id: 'd58e1d50-0182-4a39-bd03-129f5d316c20',
                                                version: '2.1',
                                                type: 'state',
                                            },
                                            type: 'Control',
                                            timestamp: '',
                                            data: '1',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        type: 'network',
                        version: '2.1',
                        id: 'c7053fdc-ace2-4cb5-8e61-06fc1d5846f0',
                        connection: {
                            online: true,
                            timestamp: '',
                        },
                    },
                    name: 'Network Name',
                    device: [
                        {
                            meta: {
                                id: '3c40baca-a2e9-4e55-b7df-9331045c0a52',
                                version: '2.1',
                                type: 'device',
                            },
                            name: 'Device Name',
                            product: 'Device Product',
                            value: [
                                {
                                    meta: {
                                        id: 'f90fa9aa-05e4-434b-99a8-b5790649d2e7',
                                        version: '2.1',
                                        type: 'value',
                                    },
                                    name: 'Value Name',
                                    permission: 'w',
                                    type: 'temperature',
                                    number: {
                                        min: 0,
                                        max: 100,
                                        step: 1,
                                        unit: 'c',
                                    },
                                    state: [
                                        {
                                            meta: {
                                                id: '3b91ff17-514e-4098-a7de-df1c16b6e95b',
                                                version: '2.1',
                                                type: 'state',
                                            },
                                            type: 'Control',
                                            timestamp: '',
                                            data: '1',
                                        },
                                        '6e6e868f-9cd6-4a7c-a324-b5e3225ac849',
                                    ],
                                },
                                'f2b19d60-87db-4a4f-9226-8dafa91f36be',
                            ],
                        },
                        '008dddc7-24b7-4be6-a9c8-4b197d845a1f',
                    ],
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: '008dddc7-24b7-4be6-a9c8-4b197d845a1f',
                        version: '2.1',
                        type: 'device',
                    },
                    name: 'Device Name',
                    product: 'Device Product',
                    value: [],
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: 'f2b19d60-87db-4a4f-9226-8dafa91f36be',
                        version: '2.1',
                        type: 'value',
                    },
                    name: 'Value Name',
                    permission: 'w',
                    type: 'temperature',
                    number: {
                        min: 0,
                        max: 100,
                        step: 1,
                        unit: 'c',
                    },
                    state: [],
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: '6e6e868f-9cd6-4a7c-a324-b5e3225ac849',
                        version: '2.1',
                        type: 'state',
                    },
                    type: 'Control',
                    timestamp: '',
                    data: '1',
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: 'd1f5623e-522d-4557-b20d-5629e0f232c5',
                        version: '2.1',
                        type: 'device',
                    },
                    name: 'Device Name',
                    product: 'Device Product',
                    value: [
                        {
                            meta: {
                                id: '4f302dae-1d0b-4278-b195-0cb4794f4123',
                                version: '2.1',
                                type: 'value',
                            },
                            name: 'Value Name',
                            permission: 'w',
                            type: 'temperature',
                            number: { min: 0, max: 100, step: 1, unit: 'c' },
                            state: [
                                {
                                    meta: {
                                        id: '8b58846a-6c89-4b19-a183-eeee995f337d',
                                        version: '2.1',
                                        type: 'state',
                                    },
                                    type: 'Control',
                                    timestamp: '',
                                    data: '1',
                                },
                            ],
                        },
                    ],
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: '7199388e-c90b-4780-83da-ce430d190d9c',
                        version: '2.1',
                        type: 'value',
                    },
                    name: 'Value Name',
                    permission: 'w',
                    type: 'temperature',
                    number: { min: 0, max: 100, step: 1, unit: 'c' },
                    state: [
                        {
                            meta: {
                                id: 'f8ee4c57-afb2-4d30-b5c0-9d276aee4992',
                                version: '2.1',
                                type: 'state',
                            },
                            type: 'Control',
                            timestamp: '',
                            data: '1',
                        },
                    ],
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: 'd98e784e-0bb3-4693-899c-1071483b857e',
                        type: 'ontology',
                        version: '2.1',
                    },
                    relationship: 'state',
                    to: {
                        state: [
                            'd58e1d50-0182-4a39-bd03-129f5d316c20',
                            '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                            '3b91ff17-514e-4098-a7de-df1c16b6e95b',
                            'f8ee4c57-afb2-4d30-b5c0-9d276aee4992',
                            '8b58846a-6c89-4b19-a183-eeee995f337d',
                            '6e6e868f-9cd6-4a7c-a324-b5e3225ac849',
                        ],
                        value: [
                            '9ed44936-96f7-44b4-8880-aa0a197d89f0',
                            'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                            'f90fa9aa-05e4-434b-99a8-b5790649d2e7',
                            '4f302dae-1d0b-4278-b195-0cb4794f4123',
                            '7199388e-c90b-4780-83da-ce430d190d9c',
                            'f2b19d60-87db-4a4f-9226-8dafa91f36be',
                        ],
                        device: [
                            'e65ec3eb-04f1-4253-bd1b-b989b1204b81',
                            '4d3e1192-bde3-4f39-8c84-45d02965ab4e',
                            '3c40baca-a2e9-4e55-b7df-9331045c0a52',
                            'd1f5623e-522d-4557-b20d-5629e0f232c5',
                            '008dddc7-24b7-4be6-a9c8-4b197d845a1f',
                        ],
                        network: [
                            '59ec0368-cacd-4dd6-a633-03402732d1ef',
                            'c7053fdc-ace2-4cb5-8e61-06fc1d5846f0',
                        ],
                    },
                })
            );

        const network = await createNetwork({ name: 'Ontology 1' });
        const device = await network.createDevice({ name: 'Ontology 2' });
        await device.createValue('Ontology 3', 'r', ValueTemplate.NUMBER);
        await Network.findAllByName('Ontology 4');
        await Device.findAllByName('Ontology 5');
        await Value.findAllByName('Ontology 6');

        const edges = await network.getAllEdges();

        expect(edges[0].models.length).toBe(19);
        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        expect(mockedAxios.get).toHaveBeenCalledTimes(8);
    });

    it('can link objects from fetchByName to ontology', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse([fullNetworkResponse]))
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            id: 'b62eca33-94a2-476e-b594-0c6c0f6ddb67',
                            type: 'ontology',
                            version: '2.1',
                        },
                        relationship: 'child',
                        to: {
                            device: [fullNetworkResponse.device[0].meta.id],
                        },
                    },
                ])
            );

        const networks = await Network.fetchByName('test');
        const edges = await networks[0].getAllEdges();

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);

        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/network', {
            params: {
                expand: 3,
                go_internal: true,
                'this_name=': 'test',
                method: ['retrieve'],
            },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            `/2.1/network/${fullNetworkResponse.meta.id}/ontology`,
            { params: { expand: 1, go_internal: true, method: ['retrieve'] } }
        );

        const d1 = networks[0].device[0];
        const d2 = edges[0].models[0] as Device;

        expect(d1.id()).toEqual(d2.id());
        expect(d1.toJSON()).toEqual(d2.toJSON());

        d1.name = 'new name';
        expect(d2.name).toEqual(d1.name);

        networks.forEach((net) => {
            net.device.forEach((dev) => {
                dev.name = 'testing';
            });
        });

        const names: string[] = [];
        networks.forEach((net) => {
            net.ontology.forEach((edge) => {
                edge.models.forEach((model) => {
                    if (model.meta.type === 'device') {
                        names.push((model as Device).name);
                    }
                });
            });
        });
        expect(names).toEqual(['testing']);
    });

    it('can link objects from EMS to ontology', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(makeResponse(responses['ems_network']))
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        from: {
                            network: ['99061ade-2aa1-445d-83cf-868559770026'],
                        },
                        to: {
                            device: ['74f15b96-ac61-4550-9970-f957a3281f9a'],
                        },
                        relationship: 'contains',
                        meta: {
                            id: '77cbc4a6-1bba-47b9-b087-155b281bd9af',
                            type: 'ontology',
                            version: '2.1',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        from: {
                            device: ['74f15b96-ac61-4550-9970-f957a3281f9a'],
                        },
                        to: {
                            device: ['f269650d-d4a8-4745-80f8-5791fadf5e73'],
                        },
                        relationship: 'contains',
                        meta: {
                            id: '0cbae50e-2131-4ec3-842f-e930d2d32175',
                            type: 'ontology',
                            version: '2.1',
                        },
                    },
                    {
                        from: {
                            device: ['74f15b96-ac61-4550-9970-f957a3281f9a'],
                        },
                        to: {
                            device: ['2af6d04a-b833-4b37-a921-e82c8448e4bb'],
                        },
                        relationship: 'contains',
                        meta: {
                            id: 'b639721f-7413-4ea8-a398-5abaa5fec583',
                            type: 'ontology',
                            version: '2.1',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        from: {
                            device: ['f269650d-d4a8-4745-80f8-5791fadf5e73'],
                        },
                        to: {
                            device: ['c7fb2303-07a4-4793-b63a-0865ff785633'],
                        },
                        relationship: 'contains',
                        meta: {
                            id: '626b5a95-4812-4395-977a-21c6055e5509',
                            type: 'ontology',
                            version: '2.1',
                        },
                    },
                    {
                        from: {
                            device: ['f269650d-d4a8-4745-80f8-5791fadf5e73'],
                        },
                        to: {
                            device: ['8b388544-76f0-42cb-ba2a-0189ce17ce4e'],
                        },
                        relationship: 'contains',
                        meta: {
                            id: 'b783fedd-caf8-4c18-b17d-b31fad967fb4',
                            type: 'ontology',
                            version: '2.1',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));

        const networks = await Network.fetchByName('EMS Configurator');
        const network = networks[0];

        const promises: Promise<IOntologyEdge[]>[] = [];
        promises.push(network.getAllEdges(true));
        network.device.forEach((dev: Device) => {
            promises.push(dev.getAllEdges(true));
        });
        await Promise.all(promises);

        expect(mockedAxios.get).toHaveBeenCalledTimes(7);

        network.device.forEach((dev) => {
            dev.name = 'testing';
        });

        const names: string[] = [];
        network.device.forEach((dev) => {
            dev.ontology.forEach((edge) => {
                edge.models.forEach((model) => {
                    names.push((model as Device).name);
                });
            });
        });
        expect(names).toEqual(['testing', '', '', '']);
    });

    it('can handle failing when loading models', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            id: 'e3cc57ed-982d-4fad-9abc-8762ff6a92ef',
                            type: 'ontology',
                            version: '2.1',
                        },
                        name: 'Onto name',
                        description: 'Onto description',
                        data: { test: 'data' },
                        relationship: 'state',
                        to: {
                            state: [
                                '0cce27ee-46ad-4296-b61e-7f7765e3edf3',
                                '7acb2d49-6716-4ea5-b4a6-2a98f5b7715b',
                                '7c7171b7-db9c-4418-8e29-2e76c42597b0',
                            ],
                        },
                    },
                    {
                        meta: {
                            id: 'aaa56f4e-cb10-42fb-8878-c67e3a14ddb1',
                            type: 'ontology',
                            version: '2.1',
                        },
                        name: 'Onto name',
                        description: 'Onto description',
                        data: { test: 'data' },
                        relationship: 'state',
                        to: {
                            state: ['1e5eb75f-0912-4858-9ad5-89fb21787768'],
                        },
                    },
                ])
            )
            .mockRejectedValueOnce(
                makeErrorResponse({
                    message: 'Invalid state',
                    code: 123,
                })
            )
            .mockRejectedValueOnce(
                makeErrorResponse({
                    message: 'Invalid state',
                    code: 123,
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: '7c7171b7-db9c-4418-8e29-2e76c42597b0',
                        version: '2.1',
                        type: 'state',
                    },
                    type: 'Control',
                    timestamp: '',
                    data: '1',
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    meta: {
                        id: '1e5eb75f-0912-4858-9ad5-89fb21787768',
                        version: '2.1',
                        type: 'state',
                    },
                    type: 'Control',
                    timestamp: '',
                    data: '1',
                })
            );

        const network = new Network('Ontology Network');
        network.meta.id = '99138103-743f-48a4-b120-322ec9e9d62c';

        const orgError = console.error;
        console.error = jest.fn();
        const orgWarn = console.warn;
        console.warn = jest.fn();
        const edges = await network.getAllEdges();

        expect(console.error).toHaveBeenLastCalledWith(
            'WAPPSTO ERROR: Permission.reload - Unhandled code: Invalid state ()'
        );
        console.error = orgError;
        expect(console.warn).toHaveBeenNthCalledWith(
            1,
            'WAPPSTO WARN: Failed to load state model with id 0cce27ee-46ad-4296-b61e-7f7765e3edf3'
        );
        expect(console.warn).toHaveBeenNthCalledWith(
            2,
            'WAPPSTO WARN: Failed to load state model with id 7acb2d49-6716-4ea5-b4a6-2a98f5b7715b'
        );
        console.warn = orgWarn;

        expect(edges[0].failedModels['state']).toEqual([
            '0cce27ee-46ad-4296-b61e-7f7765e3edf3',
            '7acb2d49-6716-4ea5-b4a6-2a98f5b7715b',
        ]);
        expect(edges[1].failedModels).toEqual({});

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(5);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/network/99138103-743f-48a4-b120-322ec9e9d62c/ontology',
            {
                params: {
                    expand: 1,
                    go_internal: true,
                    method: ['retrieve'],
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/0cce27ee-46ad-4296-b61e-7f7765e3edf3',
            {
                params: {
                    expand: 0,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            3,
            '/2.1/state/7acb2d49-6716-4ea5-b4a6-2a98f5b7715b',
            {
                params: {
                    expand: 0,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            4,
            '/2.1/state/7c7171b7-db9c-4418-8e29-2e76c42597b0',
            {
                params: {
                    expand: 0,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            5,
            '/2.1/state/1e5eb75f-0912-4858-9ad5-89fb21787768',
            {
                params: {
                    expand: 0,
                },
            }
        );
    });
});
