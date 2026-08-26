import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { after, before } from './util/stream';
import { Device, Network, State, Value } from '../src';
import { makeResponse } from './util/helpers';

describe('modelStore', () => {
    beforeAll(() => {
        before();
    });

    afterEach(() => {
        after();
    });

    const deviceResponse = {
        meta: {
            id: 'af38b687-4ec9-4584-8443-acc620c4cadc',
            version: '2.1',
            type: 'device',
        },
        name: 'test',
        product: 'test',
        serial: 'test',
        description: 'test',
    };

    it('will use the same model from the store', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            id: '7fe6eb8d-2720-4a22-a379-99e45b04202c',
                            version: '2.1',
                            type: 'network',
                        },
                        name: 'test',
                        device: [deviceResponse],
                    },
                ])
            )
            .mockResolvedValueOnce(makeResponse([deviceResponse]));

        const networks = await Network.fetch();
        const devices = await Device.fetch();

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(networks[0].device[0].meta.id).toEqual(devices[0].meta.id);
        expect(devices[0].parent).toEqual(networks[0]);
    });

    it('does not overflow the stack on a cyclic model graph', () => {
        const network = new Network('cycle');
        network.meta.id = 'cycle-network';
        const device = new Device('cycle');
        device.meta.id = 'cycle-device';
        const a = new Value('A');
        a.meta.id = 'cycle-a';
        const b = new Value('B');
        b.meta.id = 'cycle-b';

        network.device = [device];
        device.value = [a, b];
        a.state = [a, b] as unknown as State[];
        b.state = [a] as unknown as State[];

        expect(() => network.addChildrenToStore()).not.toThrow();
    });
});
