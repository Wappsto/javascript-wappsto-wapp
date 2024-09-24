import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { SubUser } from '../src/index';
import { after, before } from './util/stream';
import { makeResponse } from './util/helpers';

describe('sub user', () => {
    const response = {
        meta: {
            type: 'subuser',
            version: '2.1',
            id: '6e1698b9-717f-4e85-b3d0-5dff0fcb79da',
        },
        first_name: 'first',
        last_name: 'last',
    };

    beforeAll(() => {
        before();
    });

    afterEach(() => {
        after();
    });

    it('can not create a sub user on wappsto', async () => {
        const user = new SubUser('user', 'pass');
        await user.create();

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/subuser',
            {
                login_username: 'user',
                login_password: 'pass',
                meta: {
                    type: 'subuser',
                    version: '2.1',
                },
            },
            {}
        );
    });

    it('can get all the sub users from wappsto', async () => {
        mockedAxios.get.mockResolvedValue(makeResponse([response]));
        const user = await SubUser.fetch();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/2.1/subuser', {
            params: {
                expand: 0,
                go_internal: true,
                method: ['retrieve'],
            },
        });
        expect(user[0]?.first_name).toEqual('first');
        expect(user[0]?.last_name).toEqual('last');
    });
});
