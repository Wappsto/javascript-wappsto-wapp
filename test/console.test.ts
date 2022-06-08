import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
console.log = jest.fn();
import { startLogging, stopLogging } from '../src/index';

describe('console', () => {
    beforeEach(() => {
        mockedAxios.post.mockResolvedValue({});
    });

    it('has startLogging as a warning', () => {
        console.warn = jest.fn();
        startLogging();
        expect(console.warn).toHaveBeenCalledWith(
            'WAPPSTO WARN: DEPLICATED - The "startLogging" is not needed to be called anymore'
        );
    });

    it('can stop sending to wappsto', () => {
        stopLogging();
        console.log('test start and stop');
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('can send log messages to wappsto', () => {
        startLogging();
        console.log('test start');
        console.info('test start');
        console.error('test start');
        console.warn('test start');
        expect(mockedAxios.post).toHaveBeenCalledTimes(4);
    });
});
