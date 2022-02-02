import mockedAxios from 'axios';
console.error = jest.fn();
import { User, config } from '../src/index';

describe('user', () => {
    const response = {
        meta: {
            type: 'user',
            version: '2.0',
            id: '6e1698b9-717f-4e85-b3d0-5dff0fcb79da',
        },
        first_name: 'first',
        last_name: 'last',
    };

    beforeEach(() => {
        mockedAxios.get.mockResolvedValue({ data: [response] });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('can not create a user on wappsto', async () => {
        const user = new User();
        await user.create();

        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('can not update a user on wappsto', async () => {
        const user = new User();
        await user.update();

        expect(mockedAxios.patch).not.toHaveBeenCalled();
    });

    it('can create a new user from wappsto', async () => {
        const user = await User.me();

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/user/me', {
            params: {
                expand: 1,
            },
        });
        expect(user?.first_name).toEqual('first');
        expect(user?.last_name).toEqual('last');
    });

    it('can create a new user from wappsto with verbose', async () => {
        config({ verbose: true });
        const users = await User.fetch();
        config({ verbose: false });

        expect(mockedAxios.get).toHaveBeenCalledWith('/2.1/user/me', {
            params: { expand: 1, verbose: true },
        });
        expect(users[0]?.first_name).toEqual('first');
        expect(users[0]?.last_name).toEqual('last');
    });
});
