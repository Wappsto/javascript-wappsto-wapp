import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
/* eslint-disable import/first */
import { start, stop } from '../src/console';

describe('console', () => {

    beforeEach(() => {
        mockedAxios.post.mockResolvedValue({});
    });

    it('can stop sending to wappsto', () => {
        start();
        stop();
        console.log("test 2");
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('can send a log message to wappsto', () => {
        start();
        console.log("test");
        expect(mockedAxios.post).toHaveBeenCalled();
    });
});
