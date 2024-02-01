import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { notify, stopLogging, sendMail, sendSMS } from '../src/index';
import { after } from './util/stream';
import { makeErrorResponse, makeResponse } from './util/helpers';

describe('notification', () => {
    beforeAll(() => {
        stopLogging();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        after();
    });

    it('can create a new notification', () => {
        mockedAxios.post.mockResolvedValueOnce(makeResponse([]));

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
        mockedAxios.post.mockResolvedValueOnce(makeResponse([]));

        notify('message2', 'error', { test: 'data' });

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
                    data: { test: 'data' },
                },
            },
            {}
        );
    });

    it('can send mail', async () => {
        mockedAxios.post.mockResolvedValueOnce(makeResponse([]));

        const res = await sendMail({
            subject: 'Test Mail',
            body: '<b>Hello</b>',
            from: 'My Wapp',
        });

        expect(res).toBe(true);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith('/2.1/email_send', {
            subject: 'Test Mail',
            html: '<b>Hello</b>',
            from: 'My Wapp',
        });
    });

    it('can failed send mail', async () => {
        const tmp = console.error;
        console.error = jest.fn();

        mockedAxios.post.mockRejectedValueOnce(makeErrorResponse({}));

        const res = await sendMail({
            subject: 'Test Mail',
            body: '<b>Hello</b>',
            from: 'My Wapp',
        });
        console.error = tmp;

        expect(res).toBe(false);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith('/2.1/email_send', {
            subject: 'Test Mail',
            html: '<b>Hello</b>',
            from: 'My Wapp',
        });
    });

    it('can send SMS', async () => {
        mockedAxios.post.mockResolvedValueOnce(makeResponse([]));

        const res = await sendSMS('My sms message');

        expect(res).toBe(true);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith('/2.1/sms_send', {
            content: 'My sms message',
        });
    });

    it('can failed send SMS', async () => {
        const tmp = console.error;
        console.error = jest.fn();

        mockedAxios.post
            .mockRejectedValueOnce(makeErrorResponse({}))
            .mockRejectedValueOnce(makeErrorResponse({}));

        const res = await sendSMS('My sms message');
        const res2 = await sendSMS('My sms message');
        console.error = tmp;

        expect(res).toBe(false);
        expect(res2).toBe(false);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledWith('/2.1/sms_send', {
            content: 'My sms message',
        });
    });
});
