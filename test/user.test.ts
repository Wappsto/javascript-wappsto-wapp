import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { User, config, stopLogging } from '../src/index';
import { after } from './util/stream';
import { makeResponse } from './util/helpers';

describe('user', () => {
    const response = {
        meta: {
            type: 'user',
            version: '2.1',
            id: '6e1698b9-717f-4e85-b3d0-5dff0fcb79da',
        },
        first_name: 'first',
        last_name: 'last',
    };

    beforeAll(() => {
        stopLogging();
        console.error = jest.fn();
    });

    beforeEach(() => {
        mockedAxios.get.mockResolvedValue(makeResponse([response]));
    });

    afterEach(() => {
        after();
    });

    it('can not create a user on wappsto', async () => {
        const user = new User();
        await user.create();

        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('can not update a user on wappsto', async () => {
        const user = new User();
        await user.update();

        expect(mockedAxios.put).not.toHaveBeenCalled();
    });

    it('can create a new user from wappsto', async () => {
        const user = await User.me();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/user/me', {
            params: {
                expand: 1,
                go_internal: true,
                method: ['retrieve'],
            },
        });
        expect(user?.first_name).toEqual('first');
        expect(user?.last_name).toEqual('last');
    });

    it('can create a new user from wappsto with verbose', async () => {
        config({ verbose: true });
        const users = await User.fetch();
        config({ verbose: false });

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/user/me', {
            params: {
                expand: 1,
                go_internal: true,
                verbose: true,
                method: ['retrieve'],
            },
        });
        expect(users[0]?.first_name).toEqual('first');
        expect(users[0]?.last_name).toEqual('last');
    });
});
