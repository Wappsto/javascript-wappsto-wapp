import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
console.error = jest.fn();
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { OAuth } from '../src/index';
import { openStream } from '../src/models/stream';

describe('oauth', () => {
    const response = {
        meta: {
            type: 'oauth_connect',
            version: '2.0',
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
        openStream.websocketUrl = 'ws://localhost:12345';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('can return a token comming from stream', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [] });

        let r = OAuth.getToken('test');
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
            data: response,
        });

        let token = await r;

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/oauth_connect/test',
            {}
        );
        expect(token.oauth_token).toBe('oauth test token');
    });

    it('can return an old token', async () => {
        //mockedAxios.get.mockResolvedValueOnce({ data: [{response}] });
        mockedAxios.get.mockResolvedValueOnce({ data: response });

        let token = await OAuth.getToken('test');

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/2.0/oauth_connect/test',
            {}
        );
        expect(token.oauth_token).toBe('oauth test token');
    });

    it('it will fail when there is no oauth', async () => {
        mockedAxios.get.mockRejectedValueOnce({
            response: {
                data: {
                    message:
                        'This installation does not have any oauth external with this name',
                    data: {
                        wrong_value: 'name',
                        wrong_attribute: 'test',
                    },
                    code: 436000001,
                    service: 'installation',
                    internal_code: 'oauth_connect_no_oauth_found',
                },
            },
        });

        let error: string = '';
        try {
            await OAuth.getToken('test');
        } catch (e: any) {
            error = e.toString();
        }

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(error).toBe(
            'This installation does not have any oauth external with this name'
        );
    });
});
