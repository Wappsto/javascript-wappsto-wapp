import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { State, config, stopLogging } from '../src/index';

const response = {
    meta: {
        type: 'state',
        version: '2.1',
        id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
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

    it('can create a new state class', () => {
        const state = new State('Report');

        expect(state.type).toEqual('Report');
        expect(state.url()).toEqual('/2.1/state');
    });

    it('can create a state on wappsto', async () => {
        mockedAxios.post.mockResolvedValue({ data: response });

        const state = new State('Report');
        await state.create();

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.1',
                },
                type: 'Report',
                data: '',
            }),
            {}
        );
        expect(state.type).toEqual('Report');
        expect(state.meta.id).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can update a state on wappsto', async () => {
        mockedAxios.patch.mockResolvedValue({ data: response });

        const state = new State('Report');
        await state.create();
        const oldType = response.type;
        response.type = 'Control';
        state.type = 'Control';
        await state.update();

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            `/2.1/state/${state.meta.id}`,
            response,
            {}
        );

        response.type = oldType;
    });

    it('can create a new state from wappsto', async () => {
        mockedAxios.get.mockResolvedValue({ data: [response] });

        const states = await State.fetch();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/state', {});
        expect(states[0]?.type).toEqual('Report');
    });

    it('can create a new state from wappsto with verbose', async () => {
        mockedAxios.get.mockResolvedValue({ data: [response] });

        config({ verbose: true });
        const states = await State.fetch();
        config({ verbose: false });

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/state', {
            params: { verbose: true },
        });
        expect(states[0]?.type).toEqual('Report');
    });

    it('only sends a small meta when updating', async () => {
        mockedAxios.get.mockResolvedValue({
            data: [
                {
                    meta: {
                        type: 'state',
                        version: '2.1',
                        id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
                        iot: true,
                        size: 100,
                    },
                    type: 'Report',
                    timestamp: '2021-10-10T10:10:10Z',
                    data: '0',
                },
            ],
        });
        mockedAxios.patch.mockResolvedValue({ data: [response] });

        const states = await State.fetch();
        await states[0].update();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledWith(
            '/2.1/state/b62e285a-5188-4304-85a0-3982dcb575bc',
            {
                data: '0',
                meta: {
                    id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
                    type: 'state',
                    version: '2.1',
                },
                timestamp: '2021-10-10T10:10:10Z',
                type: 'Report',
            },
            {}
        );
    });
});
