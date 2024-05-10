import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import 'reflect-metadata';
import { Value, State, LogValues } from '../src/index';
import { before, after } from './util/stream';
import { makeErrorResponse, makeResponse } from './util/helpers';

describe('historical', () => {
    beforeAll(() => {
        before();
    });

    afterEach(() => {
        after();
    });

    it('can get log data', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            id: '',
                            type: 'log',
                            version: '2.1',
                        },
                        data: [
                            {
                                time: '2022-01-01T01:02:03Z',
                                data: '1',
                            },
                        ],
                        more: false,
                        type: 'state',
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            id: '',
                            type: 'log',
                            version: '2.1',
                        },
                        data: [
                            {
                                time: '2022-01-01T01:02:03Z',
                                max: '2',
                            },
                        ],
                        more: false,
                        type: 'state',
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            id: '',
                            type: 'log',
                            version: '2.1',
                        },
                        data: [],
                        more: false,
                        type: 'state',
                    },
                ])
            )
            .mockRejectedValueOnce(
                makeErrorResponse(
                    {},
                    'Reject last control log',
                    'can get log data'
                )
            );

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const stateR = new State('Report');
        stateR.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(stateR);
        const stateC = new State('Control');
        stateC.meta.id = '1b743fa5-85a1-48e9-935c-b98ba27c0ffe';
        value.state.push(stateC);

        const d = new Date(500000000000);

        const logsR = await value.getReportLog({ limit: 1, end: d });
        const logsMax = await value.getReportLog({ operation: 'max' });
        const logsC = await value.getControlLog({ start: d });

        const orgError = console.error;
        console.error = jest.fn();
        let failLog = false;
        try {
            await value.getControlLog({ end: '2022-02-02T02:02:02Z' });
        } catch (e) {
            failLog = true;
        }
        expect(console.error).toHaveBeenLastCalledWith(
            'WAPPSTO ERROR: Model.fetch: Reject last control log for can get log data'
        );
        console.error = orgError;

        expect(failLog).toBe(true);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.get).toHaveBeenCalledTimes(4);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/log/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7/state',
            {
                params: {
                    limit: 1,
                    end: '1985-11-05T00:53:20.000Z',
                    method: ['retrieve'],
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            2,
            '/2.1/log/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7/state',
            {
                params: { operation: 'max', method: ['retrieve'] },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            3,
            '/2.1/log/1b743fa5-85a1-48e9-935c-b98ba27c0ffe/state',
            {
                params: {
                    start: '1985-11-05T00:53:20.000Z',
                    method: ['retrieve'],
                },
            }
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            4,
            '/2.1/log/1b743fa5-85a1-48e9-935c-b98ba27c0ffe/state',
            {
                params: { end: '2022-02-02T02:02:02Z', method: ['retrieve'] },
            }
        );

        expect(logsR.meta.type).toBe('log');
        expect(logsR.more).toBe(false);
        expect(logsR.type).toBe('state');
        expect(logsR.data[0].data).toBe('1');
        expect(logsR.data[0].timestamp).toBe('2022-01-01T01:02:03Z');
        expect(logsMax.data[0].data).toBe('2');
        expect(logsMax.data[0].timestamp).toBe('2022-01-01T01:02:03Z');
        expect(logsC.meta.type).toBe('log');
        expect(logsC.more).toBe(false);
        expect(logsC.type).toBe('state');
    });

    it('can get empty log data', async () => {
        const value = new Value();
        const logs = await value.getReportLog({});

        expect(logs.data.length).toBe(0);
    });

    it('can send log values to log_zip', async () => {
        mockedAxios.patch
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post.mockResolvedValueOnce(makeResponse([]));

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        const data = [
            { timestamp: '2022-02-02T02:02:01Z', data: 1 },
            { timestamp: '2022-02-02T02:02:04Z', data: 4 },
            { timestamp: '2022-02-02T02:02:02Z', data: 2 },
            { timestamp: new Date('2022-02-02T02:02:03Z'), data: 3 },
        ];
        await value.report(data);

        expect(data.length).toBe(4);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                data: '4',
                timestamp: '2022-02-02T02:02:04Z',
                type: 'Report',
            },
            {}
        );
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/log_zip',
            'state_id,data,timestamp#6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7,1,2022-02-02T02:02:01Z#6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7,2,2022-02-02T02:02:02Z#6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7,3,2022-02-02T02:02:03.000Z#'
                .split('#')
                .join('\n'),
            { headers: { 'Content-type': 'text/csv' } }
        );

        await value.report([{ timestamp: '2022-02-02T02:02:01Z', data: 1 }]);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('can not send log values for Control', async () => {
        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        await value.report([
            { timestamp: '2022-02-02T02:02:01Z', data: 1 },
            { timestamp: '2022-02-02T02:02:02Z', data: 2 },
        ]);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    });

    it('can not send invalid log values for Report', async () => {
        mockedAxios.patch.mockResolvedValueOnce(makeResponse([]));

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        const data = [
            { timestamp: '2022-02-02T02:02:01Z' },
            { data: 4 },
            {},
            { timestamp: 1 },
        ];
        await value.report(data as unknown as LogValues);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);

        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                data: JSON.stringify(data),
                type: 'Report',
            }),
            {}
        );
    });
});
