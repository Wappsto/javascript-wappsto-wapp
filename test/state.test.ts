import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { State, config, stopLogging } from '../src/index';
import { makeResponse } from './util/helpers';
import { after } from './util/stream';
import { makeStateResponse } from './util/response';

const stateID = '6be66588-5f65-4257-8026-7f1152824f81';
const response = {
    meta: {
        type: 'state',
        version: '2.1',
        id: stateID,
    },
    type: 'Report',
    timestamp: '2021-10-10T10:10:10Z',
    data: '0',
};

describe('state', () => {
    beforeAll(() => {
        stopLogging();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        after();
    });

    it('can create a new state class', () => {
        const state = new State('Report');

        expect(state.type).toEqual('Report');
        expect(state.url()).toEqual('/2.1/state');
    });

    it('can create a state on wappsto', async () => {
        mockedAxios.post.mockResolvedValue(makeResponse(response));

        const state = new State('Report');
        await state.create();

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                },
                type: 'Report',
                data: 'NA',
            }),
            {}
        );
        expect(state.type).toEqual('Report');
        expect(state.meta.id).toEqual(stateID);
    });

    it('can update a state on wappsto', async () => {
        mockedAxios.patch.mockResolvedValue(makeResponse(response));

        const state = new State('Report');
        await state.create();
        const oldType = response.type;
        response.type = 'Control';
        state.type = 'Control';
        await state.update();

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            `/2.1/state/${state.meta.id}`,
            response,
            {}
        );

        response.type = oldType;
    });

    it('can create a new state from wappsto', async () => {
        mockedAxios.get.mockResolvedValue(makeResponse([response]));

        const states = await State.fetch();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/state', {
            params: { go_internal: true, method: ['retrieve'] },
        });
        expect(states[0]?.type).toEqual('Report');
    });

    it('can create a new state from wappsto with verbose', async () => {
        mockedAxios.get.mockResolvedValue(makeResponse([response]));

        config({ verbose: true });
        const states = await State.fetch();
        config({ verbose: false });

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/state', {
            params: { verbose: true, go_internal: true, method: ['retrieve'] },
        });
        expect(states[0]?.type).toEqual('Report');
    });

    it('only sends a small meta when updating', async () => {
        mockedAxios.get.mockResolvedValue(
            makeResponse([
                {
                    meta: {
                        type: 'state',
                        version: '2.1',
                        id: stateID,
                        iot: true,
                        size: 100,
                    },
                    type: 'Report',
                    timestamp: '2021-10-10T10:10:10Z',
                    data: '0',
                },
            ])
        );
        mockedAxios.patch.mockResolvedValue(makeResponse([response]));

        const states = await State.fetch();
        await states[0].update();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            `/2.1/state/${stateID}`,
            {
                data: '0',
                meta: {
                    id: stateID,
                    type: 'state',
                    version: '2.1',
                },
                timestamp: '2021-10-10T10:10:10Z',
                type: 'Report',
            },
            {}
        );
    });

    it('will fail if state does not exist', async () => {
        mockedAxios.get.mockResolvedValue({});
        const state = await State.fetchById(
            'c14c4de6-b26a-4ec4-8547-1bd8f60a4238'
        );

        expect(state).toBeUndefined();
    });

    it('can get a state by id', async () => {
        mockedAxios.get.mockResolvedValue(
            makeResponse(
                makeStateResponse({
                    id: '01d376af-1760-4cc6-abb2-6e2d3cd0e196',
                })
            )
        );

        const state = await State.fetchById(
            '01d376af-1760-4cc6-abb2-6e2d3cd0e196'
        );
        const state2 = await State.fetchById(
            '01d376af-1760-4cc6-abb2-6e2d3cd0e196'
        );

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/01d376af-1760-4cc6-abb2-6e2d3cd0e196',
            {
                params: { go_internal: true, method: ['retrieve'] },
            }
        );

        expect(state?.type).toEqual('Report');
        expect(state).toEqual(state2);
    });
});
