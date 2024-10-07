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

    it('can update a subuser', async () => {
        mockedAxios.patch.mockResolvedValue(makeResponse({}));

        const user = new SubUser();
        user.meta.id = '7fe7e97d-7516-4c0f-9c71-eba1db2fc422';
        user.first_name = 'first';
        user.last_name = 'last';
        await user.update();

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/subuser/7fe7e97d-7516-4c0f-9c71-eba1db2fc422',
            {
                meta: {
                    id: '7fe7e97d-7516-4c0f-9c71-eba1db2fc422',
                    type: 'subuser',
                    version: '2.1',
                },
                first_name: 'first',
                last_name: 'last',
            },
            {}
        );
    });

    it('can delete a subuser', async () => {
        mockedAxios.delete.mockResolvedValue(makeResponse({}));

        const user = new SubUser();
        user.meta.id = '0abfd294-917a-4023-bbc6-ddd6f44c7b6f';
        await user.delete();

        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenNthCalledWith(
            1,
            '/2.1/subuser/0abfd294-917a-4023-bbc6-ddd6f44c7b6f',
            {}
        );
    });

    it('can make a subuser independent', async () => {
        mockedAxios.patch.mockResolvedValue(makeResponse({}));
        const user = new SubUser();
        user.meta.id = '7394c226-f39c-408b-93c6-18e53826c1f7';
        await user.makeIndependent('new@mail.com');

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/register',
            {
                subuser: {
                    id: '7394c226-f39c-408b-93c6-18e53826c1f7',
                    new_username: 'new@mail.com',
                },
            },
            { params: { request: 'convert_subuser_to_user' } }
        );
    });

    it('can fetch a subuser by id', async () => {
        mockedAxios.get.mockResolvedValue(
            makeResponse({
                meta: {
                    type: 'subuser',
                    version: '2.1',
                    id: 'a733c8b5-baa2-42c9-a64a-30604a8e9b63',
                },
                first_name: 'first',
                last_name: 'last',
            })
        );
        const user = await SubUser.fetchById(
            'a733c8b5-baa2-42c9-a64a-30604a8e9b63'
        );

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/subuser/a733c8b5-baa2-42c9-a64a-30604a8e9b63',
            {
                params: {
                    go_internal: true,
                    method: ['retrieve'],
                },
            }
        );
        expect(user?.first_name).toEqual('first');
        expect(user?.last_name).toEqual('last');
    });
});
