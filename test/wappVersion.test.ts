import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { getWappVersion } from '../src/index';
import { makeErrorResponse, makeResponse } from './util/helpers';
import { after } from './util/stream';

describe('wappVersion', () => {
    afterEach(() => {
        after();
    });

    it('can get default version', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse({}));

        const version = await getWappVersion();

        expect(version).toEqual('1.0.0');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/user/me', {
            params: { expand: 1, go_internal: true, method: ['retrieve'] },
        });
    });

    it('can get default version when user is messing', async () => {
        mockedAxios.get.mockRejectedValueOnce(
            makeErrorResponse({}, 'error', 'url')
        );
        console.error = jest.fn();

        const version = await getWappVersion();

        expect(version).toEqual('1.0.0');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/user/me', {
            params: { expand: 1, go_internal: true, method: ['retrieve'] },
        });
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenNthCalledWith(
            1,
            'WAPPSTO ERROR: Model.fetch: error for url'
        );
    });

    it('can get default version when installation is missing', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse({
                installation: '8c0ac555-054e-4f19-b1db-3c42cd00a729',
            })
        );
        mockedAxios.get.mockResolvedValueOnce(makeResponse({}));

        const version = await getWappVersion();

        expect(version).toEqual('1.0.0');
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/user/me', {
            params: { expand: 1, go_internal: true, method: ['retrieve'] },
        });
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            '/2.1/installation/8c0ac555-054e-4f19-b1db-3c42cd00a729',
            undefined
        );
    });

    it('can get version from installation', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse({
                installation: 'efb7117e-fd4a-4aa8-bafd-950c7ce77e83',
            })
        );
        mockedAxios.get.mockResolvedValueOnce({
            data: { version_app: '2.2.2' },
        });

        const version = await getWappVersion();

        expect(version).toEqual('2.2.2');
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
});
