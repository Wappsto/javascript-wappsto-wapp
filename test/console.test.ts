import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
/* eslint-disable import/first */
import { startLogging, stopLogging } from '../src/index';

describe('console', () => {
    beforeEach(() => {
        mockedAxios.post.mockResolvedValue({});
    });

    it('can stop sending to wappsto', () => {
        startLogging();
        stopLogging();
        console.log('test start and stop');
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('can send a log message to wappsto', () => {
        startLogging();
        console.log('test start');
        console.info('test start');
        console.error('test start');
        console.warn('test start');
        expect(mockedAxios.post).toHaveBeenCalledTimes(4);
    });
});
