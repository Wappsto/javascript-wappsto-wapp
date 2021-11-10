import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
/* eslint-disable import/first */
import settings from '../src/util/settings';
import { State } from '../src/models/state';

describe('state', () => {
    let response = {
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
        mockedAxios.post.mockResolvedValue({ data: response });
        mockedAxios.get.mockResolvedValue({ data: [response] });
    });

    it('can create a new state class', () => {
        let state = new State('Report');
        expect(state.type).toEqual('Report');
        expect(state.url()).toEqual('/2.0/state');
    });

    it('can create a state on wappsto', async () => {
        let state = new State('Report');
        await state.create();

        expect(mockedAxios.post).toHaveBeenCalledWith('/2.0/state', {
            meta: {},
            type: 'Report',
        });
        expect(state.type).toEqual('Report');
        expect(state.meta.id).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can update a state on wappsto', async () => {
        let state = new State('Report');
        await state.create();

        let oldType = response.type;
        response.type = 'Control';
        mockedAxios.put.mockResolvedValue({ data: response });

        state.type = 'Control';
        await state.update();

        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.0/state/' + state.meta.id,
            response
        );

        response.type = oldType;
    });

    it('can create a new state from wappsto', async () => {
        let states = await State.fetch();

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/state?expand=1');
        expect(states[0]?.type).toEqual('Report');
    });

    it('can create a new state from wappsto with verbose', async () => {
        settings.verbose = true;
        let states = await State.fetch();

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/state?expand=1&verbose=true'
        );
        expect(states[0]?.type).toEqual('Report');
    });
});
