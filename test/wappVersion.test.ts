import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { getWappVersion } from '../src/index';

describe('wappVersion', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('can get default version', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: {} });

        const version = await getWappVersion();

        expect(version).toEqual('1.0.0');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('can get default version when user is messing', async () => {
        mockedAxios.get.mockRejectedValueOnce({ data: {} });

        const version = await getWappVersion();

        expect(version).toEqual('1.0.0');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('can get default version when installation is missing', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { installation: '8c0ac555-054e-4f19-b1db-3c42cd00a729' },
        });
        mockedAxios.get.mockResolvedValueOnce({ data: {} });

        const version = await getWappVersion();

        expect(version).toEqual('1.0.0');
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('can get version from installation', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { installation: '8c0ac555-054e-4f19-b1db-3c42cd00a729' },
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: { version_app: '2.2.2' },
        });

        const version = await getWappVersion();

        expect(version).toEqual('2.2.2');
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
});
