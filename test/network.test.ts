import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
/* eslint-disable import/first */
import settings from '../src/util/settings';
import { Network } from '../src/models/network';

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

    beforeAll(() => {
        mockedAxios.post.mockResolvedValue({ data: response });
        mockedAxios.get.mockResolvedValue({ data: [response] });
    });

    it('can create a new network class', () => {
        const name = 'Test Network';
        let network = new Network(name);
        expect(network.name).toEqual(name);
    });

    it('can create a network on wappsto', async () => {
        let network = new Network('test');
        await network.create();

        expect(mockedAxios.post).toHaveBeenCalledWith('/2.0/network', {
            device: [],
            meta: {},
            name: 'test',
        });
        expect(network.name).toEqual('test');
        expect(network.meta.id).toEqual('b62e285a-5188-4304-85a0-3982dcb575bc');
    });

    it('can update a network on wappsto', async () => {
        let network = new Network('test');
        await network.create();

        let oldName = response.name;
        response.name = 'new name';
        mockedAxios.put.mockResolvedValue({ data: response });

        network.name = 'new name';
        await network.update();

        expect(mockedAxios.put).toHaveBeenCalledWith(
            '/2.0/network/' + network.meta.id,
            response
        );

        response.name = oldName;
    });

    it('can create a new network from wappsto', async () => {
        let networks = await Network.fetch();

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.0/network?expand=3');
        expect(networks[0]?.name).toEqual('test');
    });

    it('can create a new network from wappsto with verbose', async () => {
        settings.verbose = true;
        let networks = await Network.fetch();

        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/network?expand=3&verbose=true'
        );
        expect(networks[0]?.name).toEqual('test');
    });
});
