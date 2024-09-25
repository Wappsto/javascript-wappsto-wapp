import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { Network } from '../src/index';
import { after, before } from './util/stream';
import { makeResponse } from './util/helpers';

describe('sharing', () => {
    beforeAll(() => {
        before();
    });

    afterEach(() => {
        after();
    });

    it('can share a network', async () => {
        mockedAxios.patch.mockResolvedValueOnce(makeResponse({}));

        const network = new Network();
        network.meta.id = '7fe22d3e-61a6-4e12-b9c3-663bfc6229c5';
        await network.shareWith('test@test.com');

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/acl/7fe22d3e-61a6-4e12-b9c3-663bfc6229c5',
            {
                permission: [
                    {
                        meta: { id: 'test@test.com' },
                        restriction: [
                            {
                                method: {
                                    create: false,
                                    delete: false,
                                    retrieve: true,
                                    update: true,
                                },
                            },
                        ],
                    },
                ],
            },
            {
                params: {
                    propagate: true,
                },
            }
        );
    });

    it('can share a network with a restriction', async () => {
        mockedAxios.patch.mockResolvedValueOnce(makeResponse({}));

        const network = new Network();
        network.meta.id = '35cb459e-b403-45ee-9884-4b99847bff7e';
        await network.shareWith('test@test.com', {
            create: true,
            delete: true,
            retrieve: false,
            update: true,
        });

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/acl/35cb459e-b403-45ee-9884-4b99847bff7e',
            {
                permission: [
                    {
                        meta: { id: 'test@test.com' },
                        restriction: [
                            {
                                method: {
                                    create: true,
                                    delete: true,
                                    retrieve: false,
                                    update: true,
                                },
                            },
                        ],
                    },
                ],
            },
            {
                params: {
                    propagate: true,
                },
            }
        );
    });

    it('get list all sharing permissions', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse({
                permission: [
                    {
                        meta: {
                            id: '5a510d7e-0870-4051-9603-11694d6a0d57',
                            type: 'permission',
                            version: '2.1',
                            size: 77,
                            path: '/acl/83821306-ffe5-4ac9-a826-9f90a5c0e8c8/permission/5a510d7e-0870-4051-9603-11694d6a0d57',
                        },
                        restriction: [
                            {
                                method: {
                                    retrieve: true,
                                    update: true,
                                    create: false,
                                    delete: false,
                                },
                            },
                        ],
                        name: 'user',
                    },
                    {
                        meta: {
                            id: '920546f6-238e-4081-bc1c-7c72a8427aaa',
                            type: 'permission',
                            version: '2.1',
                            size: 2,
                            path: '/acl/83821306-ffe5-4ac9-a826-9f90a5c0e8c8/permission/920546f6-238e-4081-bc1c-7c72a8427aaa',
                        },
                        restriction: [
                            {
                                method: {
                                    retrieve: true,
                                    update: false,
                                    create: false,
                                    delete: false,
                                },
                            },
                        ],
                        name: 'EMS Reports',
                    },
                ],
                meta: {
                    type: 'acl',
                    version: '2.1',
                    id: '83821306-ffe5-4ac9-a826-9f90a5c0e8c8',
                },
            })
        );

        const network = new Network();
        network.meta.id = '83821306-ffe5-4ac9-a826-9f90a5c0e8c8';
        const permissions = await network.getSharedWith();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/acl/83821306-ffe5-4ac9-a826-9f90a5c0e8c8',
            {}
        );
        expect(permissions).toEqual([
            {
                meta: {
                    id: '5a510d7e-0870-4051-9603-11694d6a0d57',
                    type: 'permission',
                    version: '2.1',
                    size: 77,
                    path: '/acl/83821306-ffe5-4ac9-a826-9f90a5c0e8c8/permission/5a510d7e-0870-4051-9603-11694d6a0d57',
                },
                restriction: [
                    {
                        method: {
                            retrieve: true,
                            update: true,
                            create: false,
                            delete: false,
                        },
                    },
                ],
                name: 'user',
            },
            {
                meta: {
                    id: '920546f6-238e-4081-bc1c-7c72a8427aaa',
                    type: 'permission',
                    version: '2.1',
                    size: 2,
                    path: '/acl/83821306-ffe5-4ac9-a826-9f90a5c0e8c8/permission/920546f6-238e-4081-bc1c-7c72a8427aaa',
                },
                restriction: [
                    {
                        method: {
                            retrieve: true,
                            update: false,
                            create: false,
                            delete: false,
                        },
                    },
                ],
                name: 'EMS Reports',
            },
        ]);
    });
});
