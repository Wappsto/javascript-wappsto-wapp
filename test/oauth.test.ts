import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { OAuth, stopLogging } from '../src/index';
import { openStream } from '../src/stream_helpers';
import { after } from './util/stream';
import { makeErrorResponse, makeResponse } from './util/helpers';

describe('oauth', () => {
    const response = {
        meta: {
            type: 'oauth_connect',
            version: '2.1',
            id: 'aa4704c1-caa7-4a95-bb74-9bfb33fc970a',
        },
        name: 'test',
        token: 'oauth test token',
        params: {
            oauth_token: 'oauth test token',
            oauth_token_secret: 'secret',
        },
    };
    const server = new WS('ws://localhost:12345', { jsonProtocol: true });

    beforeAll(() => {
        stopLogging();
        openStream.websocketUrl = 'ws://localhost:12345';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        after();
    });

    it('can call request handler', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse([
                {
                    data: {
                        request: 'https://wappsto.com/oauth',
                    },
                },
            ])
        );

        let requestUrl: string | undefined = '';
        OAuth.getToken('test', (url) => {
            requestUrl = url;
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/oauth_connect/test',
            { params: { go_internal: true, method: ['retrieve'] } }
        );
        expect(requestUrl).toBe('https://wappsto.com/oauth');
    });

    it('can return a token coming from stream', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse([]));

        const r = OAuth.getToken('test');
        await server.connected;

        server.send({
            meta: {
                type: 'eventstream',
            },
            path: '/installation/94a9cf64-434e-4cfd-9429-ff6cd245026b/oauth_connect/aa4704c1-caa7-4a95-bb74-9bfb33fc970a',
            event: 'create',
            meta_object: {
                type: 'oauth_connect',
            },
        });

        server.send({
            meta: {
                type: 'eventstream',
            },
            path: '/installation/94a9cf64-434e-4cfd-9429-ff6cd245026b/oauth_connect/aa4704c1-caa7-4a95-bb74-9bfb33fc970a',
            event: 'create',
            meta_object: {
                type: 'oauth_connect',
            },
            data: { ...response, name: 'wrong' },
        });

        server.send({
            meta: {
                type: 'eventstream',
            },
            path: '/installation/94a9cf64-434e-4cfd-9429-ff6cd245026b/oauth_connect/aa4704c1-caa7-4a95-bb74-9bfb33fc970a',
            event: 'create',
            meta_object: {
                type: 'oauth_connect',
            },
            data: response,
        });

        const token = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/oauth_connect/test',
            { params: { go_internal: true, method: ['retrieve'] } }
        );
        expect(token.oauth_token).toBe('oauth test token');
    });

    it('can return an old token', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse(response));

        const token = await OAuth.getToken('test');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/oauth_connect/test',
            { params: { go_internal: true, method: ['retrieve'] } }
        );
        expect(token.oauth_token).toBe('oauth test token');
    });

    it('will fail when there is no oauth', async () => {
        const jestError = jest.fn();
        const tmp = console.error;
        console.error = jestError;

        mockedAxios.get.mockRejectedValueOnce(
            makeErrorResponse({
                message:
                    'This installation does not have any oauth external with this name',
                data: {
                    wrong_value: 'name',
                    wrong_attribute: 'test',
                },
                code: 436000001,
                service: 'installation',
                internal_code: 'oauth_connect_no_oauth_found',
            })
        );

        let error = '';
        try {
            await OAuth.getToken('test');
        } catch (e: any) {
            error = e.toString();
        }
        console.error = tmp;

        expect(jestError).toHaveBeenCalledTimes(1);
        expect(error).toBe(
            'This installation does not have any oauth external with this name ({"wrong_value":"name","wrong_attribute":"test"})'
        );
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/oauth_connect/test',
            { params: { go_internal: true, method: ['retrieve'] } }
        );
    });

    it('can call request handler without data', async () => {
        mockedAxios.get.mockResolvedValueOnce(makeResponse([]));

        let requestUrl: string | undefined = '';
        OAuth.getToken('test', (url) => {
            requestUrl = url;
        });

        await server.connected;

        server.send({
            meta: {
                type: 'eventstream',
            },
            path: '/installation/94a9cf64-434e-4cfd-9429-ff6cd245026b/oauth_connect/aa4704c1-caa7-4a95-bb74-9bfb33fc970a',
            event: 'create',
            meta_object: {
                type: 'oauth_connect',
            },
            data: {},
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.1/oauth_connect/test',
            { params: { go_internal: true, method: ['retrieve'] } }
        );
        expect(requestUrl).toBe(undefined);
    });

    it('can handle a failed create', async () => {
        mockedAxios.post.mockRejectedValueOnce(
            makeErrorResponse({}, 'Reject create', 'can handle a failed create')
        );
        const oauth = new OAuth('test');
        let error;
        const orgError = console.error;
        console.error = jest.fn();
        try {
            await oauth.create();
        } catch (e) {
            error = e;
        }
        expect(console.error).toHaveBeenCalledWith(
            'WAPPSTO ERROR: Model.create: Reject create for can handle a failed create'
        );
        console.error = orgError;

        expect(error).toEqual(
            expect.objectContaining({
                response: expect.objectContaining({
                    status: 500,
                    statusText: 'Reject create',
                }),
            })
        );
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
});
