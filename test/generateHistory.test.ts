import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { State, generateHistory, Value } from '../src/index';
import { after, before } from './util/stream';
import { makeResponse } from './util/helpers';
import { makeLogResponse, makeStateResponse } from './util/response';

describe('generateHistory', () => {
    beforeAll(() => {
        before();
    });

    afterEach(() => {
        after();
    });

    it('can generate history', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse(
                makeLogResponse({
                    data: [
                        {
                            timestamp: '2022-01-01T01:02:03Z',
                            data: '1',
                        },
                        {
                            timestamp: '2022-01-01T01:05:03Z',
                            data: '2',
                        },
                    ],
                })
            )
        );
        mockedAxios.post.mockResolvedValueOnce(makeResponse({}));
        mockedAxios.patch.mockResolvedValueOnce(
            makeResponse(
                makeStateResponse({
                    id: '5acf81f9-8201-4cee-be33-eb3654d1fca9',
                    data: '2',
                    timestamp: '2022-01-01T01:05:03Z',
                })
            )
        );

        const input = new Value();
        input.meta.id = 'e9d70b17-518c-46b4-9751-5cc4d34bdd99';
        const inputState = new State('Report');
        inputState.meta.id = '3a0c698f-e464-4b41-8efd-95d53c962a22';
        input.state.push(inputState);
        const output = new Value();
        output.meta.id = '555b3cd5-ec55-4cba-ab42-10804518d0eb';
        const outputState = new State('Report');
        outputState.meta.id = '5acf81f9-8201-4cee-be33-eb3654d1fca9';
        outputState.timestamp = '2020-01-01T00:00:00.000Z';
        output.state.push(outputState);

        await generateHistory(input, output, {});

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/log/3a0c698f-e464-4b41-8efd-95d53c962a22/state',
            {
                params: {
                    group_by: 'hour',
                    limit: 100000,
                    method: ['retrieve'],
                    operation: 'avg',
                },
            }
        );

        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/log_zip',
            'state_id,data,timestamp\n5acf81f9-8201-4cee-be33-eb3654d1fca9,1,2022-01-01T01:02:03Z\n',
            {
                headers: {
                    'Content-type': 'text/csv',
                },
            }
        );

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/5acf81f9-8201-4cee-be33-eb3654d1fca9',
            {
                data: '2',
                timestamp: '2022-01-01T01:05:03Z',
                type: 'Report',
            },
            {}
        );
    });

    it('can convert data', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse(
                makeLogResponse({
                    data: [
                        {
                            timestamp: '2022-01-01T01:02:03Z',
                            data: '3',
                        },
                    ],
                })
            )
        );
        mockedAxios.patch.mockResolvedValueOnce(
            makeResponse(
                makeStateResponse({
                    id: 'ae491ff5-4583-419b-9e7c-af1320c3aef0',
                    data: '2',
                    timestamp: '2022-01-01T01:05:03Z',
                })
            )
        );

        const input = new Value();
        input.meta.id = '655eef90-ac63-456f-b514-d325e7f46512';
        const inputState = new State('Report');
        inputState.meta.id = 'f01d5cbc-08b5-4793-8ee2-5001c7b67154';
        input.state.push(inputState);
        const output = new Value();
        output.meta.id = 'e370196a-eb39-4b21-828f-e1378a9b6815';
        const outputState = new State('Report');
        outputState.meta.id = 'ae491ff5-4583-419b-9e7c-af1320c3aef0';
        outputState.timestamp = '2020-01-01T00:00:00.000Z';
        output.state.push(outputState);

        await generateHistory(
            input,
            output,
            { operation: 'sum', group_by: 'minute' },
            (data) => {
                return `${data}0`;
            }
        );

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/log/f01d5cbc-08b5-4793-8ee2-5001c7b67154/state',
            {
                params: {
                    group_by: 'minute',
                    limit: 100000,
                    method: ['retrieve'],
                    operation: 'sum',
                },
            }
        );

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/ae491ff5-4583-419b-9e7c-af1320c3aef0',
            {
                data: '30',
                timestamp: '2022-01-01T01:02:03Z',
                type: 'Report',
            },
            {}
        );
    });

    it('should handle undefined input', async () => {
        const input = new Value();
        const output = new Value();
        await generateHistory(input, output, {});
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
    });

    it('can reuse log data', async () => {
        mockedAxios.get.mockResolvedValueOnce(
            makeResponse(
                makeLogResponse({
                    data: [
                        {
                            timestamp: '2022-01-01T01:02:03Z',
                            data: '3',
                        },
                    ],
                })
            )
        );
        mockedAxios.patch.mockResolvedValueOnce(
            makeResponse(
                makeStateResponse({
                    id: 'b98a35e3-85f7-4271-a0b7-879c3267baa3',
                    data: '2',
                    timestamp: '2022-01-01T01:05:03Z',
                })
            )
        );

        const input = new Value();
        input.meta.id = '331e54a6-fdc0-41a4-9738-71c3ce2ebad3';
        const inputState = new State('Report');
        inputState.meta.id = 'f4549a89-b7aa-46f5-b0ac-eaa11a606f7b';
        input.state.push(inputState);
        const output = new Value();
        output.meta.id = '999b2c32-aae6-48a5-a066-495ba56fe105';
        const outputState = new State('Report');
        outputState.meta.id = 'b98a35e3-85f7-4271-a0b7-879c3267baa3';
        outputState.timestamp = '2020-01-01T00:00:00.000Z';
        output.state.push(outputState);

        const oldData = await generateHistory(input, output, {});

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/log/f4549a89-b7aa-46f5-b0ac-eaa11a606f7b/state',
            {
                params: {
                    group_by: 'hour',
                    limit: 100000,
                    method: ['retrieve'],
                    operation: 'avg',
                },
            }
        );

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/b98a35e3-85f7-4271-a0b7-879c3267baa3',
            {
                data: '3',
                timestamp: '2022-01-01T01:02:03Z',
                type: 'Report',
            },
            {}
        );

        const oldData2 = await generateHistory(oldData, output, {});

        expect(oldData2).toEqual(oldData);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/b98a35e3-85f7-4271-a0b7-879c3267baa3',
            {
                data: '3',
                timestamp: '2022-01-01T01:02:03Z',
                type: 'Report',
            },
            {}
        );
    });
});
