import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { notify, stopLogging } from '../src/index';

describe('notification', () => {
    beforeAll(() => {
        stopLogging();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('can create a new notification', () => {
        mockedAxios.post.mockResolvedValueOnce({ data: [] });

        notify('message');

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/notification',
            {
                meta: {
                    type: 'notification',
                    version: '2.1',
                },
                custom: {
                    message: 'message',
                    level: 'info',
                },
            },
            {}
        );
    });

    it('can create a new error notification with data', () => {
        mockedAxios.post.mockResolvedValueOnce({ data: [] });

        notify('message2','error',{test: 'data'});

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/2.1/notification',
            {
                meta: {
                    type: 'notification',
                    version: '2.1',
                },
                custom: {
                    message: 'message2',
                    level: 'error',
                    data: {test: 'data'},
                },
            },
            {}
        );
    });
});
