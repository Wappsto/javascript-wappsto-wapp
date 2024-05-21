import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { Data } from '../src/index';
import { makeResponse } from './util/helpers';
import { after, before } from './util/stream';

describe('data', () => {
    beforeAll(() => {
        before();
    });

    afterEach(() => {
        after();
    });

    it('can create a new instance', () => {
        const data = new Data();
        expect(data).toBeInstanceOf(Data);
    });

    it('can fetch it by ID', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse({
                meta: {
                    id: '1d75a50b-5e41-4a8c-9436-b2193e604697',
                    type: 'data',
                    version: '2.1',
                },
                data: {
                    key1: 'value1',
                },
            })
        );

        type MyData = {
            key1: string;
        };
        const data = await Data.fetchById<MyData>(
            '1d75a50b-5e41-4a8c-9436-b2193e604697'
        );

        expect(data.get('key1')).toEqual('value1');
        expect(data.meta.id).toEqual('1d75a50b-5e41-4a8c-9436-b2193e604697');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/data/1d75a50b-5e41-4a8c-9436-b2193e604697',
            {
                params: {
                    go_internal: true,
                    method: ['retrieve'],
                },
            }
        );
    });
});
