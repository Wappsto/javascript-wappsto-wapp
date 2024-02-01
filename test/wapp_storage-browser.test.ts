/**
 * @jest-environment jsdom
 */

import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { wappStorage } from '../src/index';
import { after } from './util/stream';
import { makeResponse } from './util/helpers';

describe('wapp storage', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules(); // Most important - it clears the cache
        process.env = { ...OLD_ENV }; // Make a copy
    });

    afterAll(() => {
        process.env = OLD_ENV; // Restore old environment
        after();
    });

    it('can not use secrets in browser', async () => {
        console.error = jest.fn();
        mockedAxios.get.mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse({
                meta: { id: 'bd5e3c4c-2957-429c-b39a-b5523f1b18e5' },
            })
        );
        mockedAxios.put.mockResolvedValueOnce(makeResponse([]));

        const ws = await wappStorage('background_secret');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        await ws.setSecret('secret_key', 'secret_value');
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);

        const value = ws.getSecret('secret_key');
        expect(value).toEqual(undefined);

        await ws.removeSecret('secret_key');
        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(console.error).toHaveBeenCalledTimes(3);
    });
});
