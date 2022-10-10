import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { State, config, stopLogging } from '../src/index';

describe('state', () => {
    const response = {
        meta: {
            type: 'state',
            version: '2.0',
            id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
        },
        type: 'Report',
        timestamp: '2021-10-10T10:10:10Z',
        data: '0',
    };

    beforeAll(() => {
        stopLogging();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('can create a new state class', () => {
        const state = new State('Report');

        expect(state.type).toEqual('Report');
        expect(state.url()).toEqual('/2.0/state');
    });

    it('can create a state on wappsto', async () => {
        mockedAxios.post.mockResolvedValue({ data: response });

        const state = new State('Report');
        await state.create();

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.0/state',
            expect.objectContaining({
                meta: {
                    type: 'state',
                    version: '2.0',
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
        mockedAxios.put.mockResolvedValue({ data: response });

        const state = new State('Report');
        await state.create();
        const oldType = response.type;
        response.type = 'Control';
        state.type = 'Control';
        await state.update();

        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.0/state/' + state.meta.id,
            response,
            {}
        );

        response.type = oldType;
    });

    it('can create a new state from wappsto', async () => {
        mockedAxios.get.mockResolvedValue({ data: [response] });

        const states = await State.fetch();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/state', {
            params: { expand: 1 },
        });
        expect(states[0]?.type).toEqual('Report');
    });

    it('can create a new state from wappsto with verbose', async () => {
        mockedAxios.get.mockResolvedValue({ data: [response] });

        config({ verbose: true });
        const states = await State.fetch();
        config({ verbose: false });

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/state', {
            params: { expand: 1, verbose: true },
        });
        expect(states[0]?.type).toEqual('Report');
    });
});
