import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { EventLog } from '../src/index';
import { after, before } from './util/stream';
import { makeErrorResponse } from './util/helpers';

describe('EventLog', () => {
    beforeAll(() => {
        before();
    });

    afterEach(() => {
        after();
    });

    it('can create a new instance', () => {
        const event = new EventLog();
        expect(event).toBeInstanceOf(EventLog);
    });

    it('will not reload when there is not uuid', async () => {
        const event = new EventLog();
        const res = await event.reload();
        expect(res).toBeFalsy();
    });

    it('clear id when reload fails', async () => {
        mockedAxios.get.mockRejectedValueOnce(makeErrorResponse({}));

        const event = new EventLog();
        event.meta.id = 'b738edb3-4ebd-4545-a020-5d39cf511fa6';

        const orgError = console.error;
        const errorFun = jest.fn();
        console.error = errorFun;
        const res = await event.reload();
        console.error = orgError;

        expect(res).toBeFalsy();
        expect(event.meta.id).toBeUndefined();
        expect(errorFun).toHaveBeenNthCalledWith(
            1,
            'WAPPSTO ERROR: Model.reload: HTTP JEST ERROR for JEST URL'
        );
    });

    it('can handle error when deleting', async () => {
        mockedAxios.delete.mockRejectedValueOnce(makeErrorResponse({}));

        const event = new EventLog();
        event.meta.id = 'b738edb3-4ebd-4545-a020-5d39cf511fa6';

        const orgError = console.error;
        const errorFun = jest.fn();
        console.error = errorFun;
        const res = await event.delete();
        console.error = orgError;

        expect(res).toBeFalsy();
        expect(event.meta.id).toBeUndefined();
        expect(errorFun).toHaveBeenNthCalledWith(
            1,
            'WAPPSTO ERROR: Model.delete: HTTP JEST ERROR for JEST URL'
        );
    });
});
