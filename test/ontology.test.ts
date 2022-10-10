import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import {
    Network,
    State,
    stopLogging,
    createNode,
    getAllNodes,
} from '../src/index';
import { addModel } from '../src/util/modelStore';

describe('Ontology', () => {
    beforeAll(() => {
        stopLogging();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('can create a new edge', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: [],
        });
        mockedAxios.post
            .mockResolvedValueOnce({
                data: {
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
                },
            })
            .mockResolvedValueOnce({
                data: {
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
                },
            });

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

        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/network/99138103-743f-48a4-b120-322ec9e9d62c/ontology',
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
            '/2.0/network/99138103-743f-48a4-b120-322ec9e9d62c/ontology',
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
        mockedAxios.get.mockResolvedValueOnce({
            data: [],
        });
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                meta: {
                    id: 'dd4e6da3-f70f-403b-8ba0-79b1c14028d8',
                    type: 'data',
                    version: '2.0',
                },
            },
        });
        const node = await createNode('onto name');

        expect(node.data_meta.type).toEqual('ontology_node');
        expect(node.getClass()).toEqual('ontology_node');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/data',
            {
                data: {},
                data_meta: {
                    id: 'ontology_node_onto name',
                    type: 'ontology_node',
                    version: 1,
                },
                meta: { type: 'data', version: '2.0' },
            },
            {}
        );
    });

    it('can get all edges on a network', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({
                data: [
                    {
                        meta: {
                            id: 'd98e784e-0bb3-4693-899c-1071483b857e',
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
                ],
            })
            .mockResolvedValueOnce({
                data: {
                    meta: {
                        type: 'state',
                        version: '2.0',
                        id: '311b2c2d-54de-4e00-a850-f6712c4622bd',
                    },
                    type: 'Report',
                    timestamp: '2021-10-10T10:10:10Z',
                    data: '0',
                },
            })
            .mockResolvedValueOnce({
                data: {
                    meta: {
                        type: 'network',
                        version: '2.0',
                        id: 'f11fa9d7-3b2b-474e-95e4-f086c5606154',
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    meta: {
                        type: 'device',
                        version: '2.0',
                        id: '8a3f67a6-751c-483b-a2ef-ba890948e6e4',
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    meta: {
                        type: 'value',
                        version: '2.0',
                        id: '75d7d198-7f91-45e2-9b79-754073d7e758',
                    },
                },
            })

            .mockResolvedValueOnce({
                data: {
                    meta: {
                        type: 'data',
                        version: '2.0',
                        id: '97e0dd7c-8e22-4263-82f9-d26102643465',
                    },
                },
            });

        const network = new Network('Ontology Network');
        network.meta.id = '99138103-743f-48a4-b120-322ec9e9d62c';

        const edges = await network.getAllEdges();

        await new Promise((r) => setTimeout(r, 1));

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(6);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/network/99138103-743f-48a4-b120-322ec9e9d62c/ontology',
            {}
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/network/f11fa9d7-3b2b-474e-95e4-f086c5606154',
            {}
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/device/8a3f67a6-751c-483b-a2ef-ba890948e6e4',
            {}
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/value/75d7d198-7f91-45e2-9b79-754073d7e758',
            {
                params: {
                    expand: 1,
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/state/311b2c2d-54de-4e00-a850-f6712c4622bd',
            {}
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/data/97e0dd7c-8e22-4263-82f9-d26102643465',
            {}
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

        expect(edges[2].models.length).toBe(1);
        expect(edges[2].models[0].id()).toEqual(
            '8a3f67a6-751c-483b-a2ef-ba890948e6e4'
        );

        expect(edges[3].models.length).toBe(1);
        expect(edges[3].models[0].id()).toEqual(
            '75d7d198-7f91-45e2-9b79-754073d7e758'
        );

        expect(edges[4].models.length).toBe(1);
        expect(edges[4].models[0].id()).toEqual(
            '97e0dd7c-8e22-4263-82f9-d26102643465'
        );

        expect(edges[5].models.length).toBe(0);
    });

    it('can get all nodes', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: [
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
            ],
        });
        const nodes = await getAllNodes();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);

        expect(nodes.length).toBe(2);
        expect(nodes[0].data_meta.id).toEqual('ontology_node_1');
        expect(nodes[1].data_meta.id).toEqual('ontology_node_2');
    });

    it('can remove an edge', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: [],
        });
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                meta: {
                    id: '75f43647-bf73-44df-a04e-4d04e47cd0fc',
                    type: 'ontology',
                    version: '2.1',
                },
                relationship: 'child',
                to: {
                    state: ['f0a9683f-da8b-4fe6-9925-2e6768ddedeb'],
                },
            },
        });
        mockedAxios.delete.mockResolvedValueOnce({
            data: {},
        });

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

        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
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

    it('can delete all edges', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: [
                {
                    meta: {
                        id: 'd98e784e-0bb3-4693-899c-1071483b857e',
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
            ],
        });
        mockedAxios.delete
            .mockResolvedValueOnce({
                data: {},
            })
            .mockResolvedValueOnce({
                data: {},
            });

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
            .mockResolvedValueOnce({
                data: {
                    meta: {
                        id: 'f275ac72-a2fe-42fe-b4ea-e87eabfe14bf',
                        type: 'ontology',
                        version: '2.1',
                    },
                    relationship: 'child',
                    to: {
                        state: ['f0a9683f-da8b-4fe6-9925-2e6768ddedeb'],
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    meta: {
                        id: 'd7224517-328f-4ccd-874c-06e3257dc090',
                        type: 'ontology',
                        version: '2.1',
                    },
                    relationship: 'look',
                    to: {
                        state: ['d2d27eab-bfaa-4253-b9cb-6402dc04e16b'],
                    },
                },
            });
        mockedAxios.get
            .mockResolvedValueOnce({
                data: [],
            })
            .mockResolvedValueOnce({
                data: [],
            })
            .mockResolvedValueOnce({
                data: [],
            });
        mockedAxios.delete
            .mockResolvedValueOnce({
                data: {},
            })
            .mockResolvedValueOnce({
                data: {},
            });

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
            '/2.0/network/99138103-743f-48a4-b120-322ec9e9d62c/ontology',
            {}
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/state/f0a9683f-da8b-4fe6-9925-2e6768ddedeb/ontology',
            {}
        );

        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
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
            .mockResolvedValueOnce({
                data: [],
            })
            .mockResolvedValueOnce({
                data: [
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
                ],
            })
            .mockResolvedValueOnce({
                data: [],
            })
            .mockResolvedValueOnce({
                data: [],
            });
        mockedAxios.post
            .mockResolvedValueOnce({
                data: {
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
            })
            .mockResolvedValueOnce({
                data: {
                    meta: {
                        id: 'b0553348-deac-4ed8-a546-f72346a60bb0',
                        type: 'ontology',
                        version: '2.1',
                    },
                    relationship: 'look',
                    to: {},
                },
            });
        mockedAxios.delete
            .mockResolvedValueOnce({
                data: {},
            })
            .mockResolvedValueOnce({
                data: {},
            });

        const node1 = await createNode('node 1');
        const node2 = await createNode('node 2');
        const edge1 = await node1.createEdge({
            relationship: 'link',
            to: node2,
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);

        await edge1.deleteBranch();

        expect(node1.ontology.length).toBe(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(4);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(2);

        expect(mockedAxios.delete).toHaveBeenCalledWith(
            '/2.0/data/45332794-e710-4702-90d6-632fe461d3e5',
            {}
        );
        expect(mockedAxios.delete).toHaveBeenCalledWith(
            '/2.1/ontology/b0553348-deac-4ed8-a546-f72346a60bb0',
            {}
        );
    });
});
