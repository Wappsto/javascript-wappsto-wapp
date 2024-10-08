import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { Network, File } from '../src/index';
import { after, before } from './util/stream';
import { makeResponse } from './util/helpers';
import { makeFileResponse } from './util/response';

describe('tags', () => {
    beforeAll(() => {
        before();
    });

    afterEach(() => {
        after();
    });

    it('can add a tag', async () => {
        mockedAxios.patch.mockResolvedValueOnce(makeResponse({}));

        const network = new Network();
        network.meta.id = '3fe70a36-03be-4b0a-9cc6-3cdd37bb5a65';

        expect(network.getTags()).toEqual([]);

        await network.addTag('test');
        await network.addTag('test2');

        expect(network.getTags()).toEqual(['test', 'test2']);

        expect(mockedAxios.put).toHaveBeenCalledTimes(2);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
            '/2.1/network/3fe70a36-03be-4b0a-9cc6-3cdd37bb5a65',
            {
                meta: {
                    id: '3fe70a36-03be-4b0a-9cc6-3cdd37bb5a65',
                    type: 'network',
                    version: '2.1',
                    tag_by_user: ['test'],
                },
                name: '',
            },
            {}
        );
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            2,
            '/2.1/network/3fe70a36-03be-4b0a-9cc6-3cdd37bb5a65',
            {
                meta: {
                    id: '3fe70a36-03be-4b0a-9cc6-3cdd37bb5a65',
                    type: 'network',
                    version: '2.1',
                    tag_by_user: ['test', 'test2'],
                },
                name: '',
            },
            {}
        );
    });

    it('can remove a tag', async () => {
        mockedAxios.patch.mockResolvedValueOnce(makeResponse({}));

        const network = new Network();
        network.meta.id = '3fe70a36-03be-4b0a-9cc6-3cdd37bb5a65';

        await network.removeTag('test');
        expect(network.getTags()).toEqual([]);

        network.meta.tag_by_user = ['test', 'test2'];
        await network.removeTag('test');

        expect(network.getTags()).toEqual(['test2']);

        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
            '/2.1/network/3fe70a36-03be-4b0a-9cc6-3cdd37bb5a65',
            {
                meta: {
                    id: '3fe70a36-03be-4b0a-9cc6-3cdd37bb5a65',
                    type: 'network',
                    version: '2.1',
                    tag_by_user: ['test2'],
                },
                name: '',
            },
            {}
        );
    });

    it('can clear all tags', async () => {
        mockedAxios.patch.mockResolvedValueOnce(makeResponse({}));

        const network = new Network();
        network.meta.id = '3fe70a36-03be-4b0a-9cc6-3cdd37bb5a65';
        network.meta.tag_by_user = ['test', 'test2'];
        await network.clearTags();

        expect(network.getTags()).toEqual([]);

        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
            '/2.1/network/3fe70a36-03be-4b0a-9cc6-3cdd37bb5a65',
            {
                meta: {
                    id: '3fe70a36-03be-4b0a-9cc6-3cdd37bb5a65',
                    type: 'network',
                    version: '2.1',
                    tag_by_user: [],
                },
                name: '',
            },
            {}
        );
    });

    it('can add a tag to a file after it was fetch by id', async () => {
        mockedAxios.get.mockResolvedValue(
            makeResponse([
                makeFileResponse({
                    id: 'd3b86c0e-0498-466c-b7ae-22b79bf6aba9',
                    name: 'new name',
                }),
            ])
        );
        mockedAxios.patch.mockResolvedValueOnce(makeResponse({}));

        const file = await File.fetchById(
            'd3b86c0e-0498-466c-b7ae-22b79bf6aba9'
        );
        await file?.addTag('test');
        expect(file?.getTags()).toEqual(['test']);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);

        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenNthCalledWith(
            1,
            '/2.1/file/d3b86c0e-0498-466c-b7ae-22b79bf6aba9/document',
            {
                meta: {
                    id: 'd3b86c0e-0498-466c-b7ae-22b79bf6aba9',
                    type: 'file',
                    version: '2.1',
                    tag_by_user: ['test'],
                },
                name: 'new name',
                type: 'File Type',
            },
            {}
        );
    });
});
