import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import { State, unifyData, Value } from '../src/index';
import { after, before, newWServer, sendRpcResponse } from './util/stream';
import { delay, makeResponse } from './util/helpers';
import { makeLogResponse, makeStateResponse } from './util/response';

describe('unifyData', () => {
    let server: WS;

    beforeAll(() => {
        before();
    });

    beforeEach(() => {
        server = newWServer();
    });

    afterEach(() => {
        after();
    });

    it('subscribes to extsync on start', async () => {
        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/extsync',
                },
            })
        );
        sendRpcResponse(server);
    });

    it('can unify data', async () => {
        mockedAxios.get
            .mockResolvedValueOnce(
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
            )
            .mockResolvedValueOnce(
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
        mockedAxios.post
            .mockResolvedValueOnce(makeResponse({}))
            .mockResolvedValueOnce(makeResponse({}));
        mockedAxios.patch
            .mockResolvedValueOnce(
                makeResponse(
                    makeStateResponse({
                        id: '5acf81f9-8201-4cee-be33-eb3654d1fca9',
                        data: '2',
                        timestamp: '2022-01-01T01:05:03Z',
                    })
                )
            )
            .mockResolvedValueOnce(
                makeResponse(
                    makeStateResponse({
                        id: '3afd7dfb-186f-4062-9cda-5be9919dbcac',
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

        const output1 = new Value();
        output1.meta.id = '555b3cd5-ec55-4cba-ab42-10804518d0eb';
        const outputState1 = new State('Report');
        outputState1.meta.id = '5acf81f9-8201-4cee-be33-eb3654d1fca9';
        outputState1.timestamp = '2020-01-01T00:00:00.000Z';
        output1.state.push(outputState1);

        const output2 = new Value();
        output2.meta.id = 'f404aed8-92bc-4dc2-a934-c0280a12112c';
        const outputState2 = new State('Report');
        outputState2.meta.id = '3afd7dfb-186f-4062-9cda-5be9919dbcac';
        outputState2.timestamp = '2020-01-01T00:00:00.000Z';
        output2.state.push(outputState2);

        unifyData(input, output1, {});
        unifyData(input, output2, {});

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/3a0c698f-e464-4b41-8efd-95d53c962a22',
                },
            })
        );
        sendRpcResponse(server);

        await delay();

        server.send([
            {
                meta_object: {
                    type: 'event',
                },
                event: 'update',
                path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/e9d70b17-518c-46b4-9751-5cc4d34bdd99/state/3a0c698f-e464-4b41-8efd-95d53c962a22',
                data: {
                    data: '1',
                    timestamp: '2020-01-01T00:30:00.000Z',
                },
            },
        ]);
        sendRpcResponse(server);

        server.send([
            {
                meta_object: {
                    type: 'event',
                },
                event: 'update',
                path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/e9d70b17-518c-46b4-9751-5cc4d34bdd99/state/3a0c698f-e464-4b41-8efd-95d53c962a22',
                data: {
                    data: '2',
                    timestamp: '2020-01-01T01:00:00.000Z',
                },
            },
        ]);
        sendRpcResponse(server);

        server.send([
            {
                meta_object: {
                    type: 'event',
                },
                event: 'update',
                path: '/network/9a51cbd4-afb3-4628-9c8b-df64a0d729e9/device/c5fe846f-d6d8-413a-abb5-620519dd6b75/value/e9d70b17-518c-46b4-9751-5cc4d34bdd99/state/3a0c698f-e464-4b41-8efd-95d53c962a22',
                data: {
                    data: '3',
                    timestamp: '2020-01-01T01:00:00.000Z',
                },
            },
        ]);
        sendRpcResponse(server);

        await delay();

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/log/3a0c698f-e464-4b41-8efd-95d53c962a22/state',
            {
                params: {
                    group_by: 'hour',
                    limit: 100,
                    method: ['retrieve'],
                    operation: 'avg',
                    start: '2020-01-01T00:00:00.001Z',
                },
            }
        );

        expect(mockedAxios.put).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
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

        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
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

        unifyData(
            input,
            output,
            { operation: 'sum', group_by: 'minute' },
            (data) => {
                return `${data}0`;
            }
        );

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/f01d5cbc-08b5-4793-8ee2-5001c7b67154',
                },
            })
        );
        sendRpcResponse(server);

        await delay();

        server.send([
            {
                meta_object: {
                    type: 'event',
                },
                event: 'update',
                path: '/state/f01d5cbc-08b5-4793-8ee2-5001c7b67154',
                data: {
                    data: '2',
                    timestamp: '2020-01-01T01:00:00.000Z',
                },
            },
        ]);
        sendRpcResponse(server);

        await delay();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/log/f01d5cbc-08b5-4793-8ee2-5001c7b67154/state',
            {
                params: {
                    group_by: 'minute',
                    limit: 100,
                    method: ['retrieve'],
                    operation: 'sum',
                    start: '2020-01-01T00:00:00.001Z',
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

    it('can handle non-numeric data', async () => {
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

        const oldError = console.error;
        console.error = jest.fn();

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

        unifyData(
            input,
            output,
            { operation: 'sum', group_by: 'minute' },
            () => {
                return `[]`;
            }
        );

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/f01d5cbc-08b5-4793-8ee2-5001c7b67154',
                },
            })
        );
        sendRpcResponse(server);

        await delay();

        server.send([
            {
                meta_object: {
                    type: 'event',
                },
                event: 'update',
                path: '/state/f01d5cbc-08b5-4793-8ee2-5001c7b67154',
                data: {
                    data: '2',
                    timestamp: '2020-01-01T01:00:00.000Z',
                },
            },
        ]);
        sendRpcResponse(server);

        await delay();

        expect(console.error).toHaveBeenCalledTimes(2);
        expect(console.error).toHaveBeenNthCalledWith(
            1,
            'WAPPSTO ERROR: Failed to convert value 3 to number ([]) for 655eef90-ac63-456f-b514-d325e7f46512'
        );
        expect(console.error).toHaveBeenNthCalledWith(
            2,
            'WAPPSTO ERROR: Received new event (2020-01-01T01:00:00.000Z) for 655eef90-ac63-456f-b514-d325e7f46512 after the next period (2020-01-01T00:01:00.000Z), but no new log data ([{"data":"3","timestamp":"2022-01-01T01:02:03Z"}]) was loaded, starting from 2020-01-01T00:00:00.001Z'
        );
        console.error = oldError;

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
            1,
            '/2.1/log/f01d5cbc-08b5-4793-8ee2-5001c7b67154/state',
            {
                params: {
                    group_by: 'minute',
                    limit: 100,
                    method: ['retrieve'],
                    operation: 'sum',
                    start: '2020-01-01T00:00:00.001Z',
                },
            }
        );

        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
    });

    it('can handle new data after a period', async () => {
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

        const input = new Value();
        input.meta.id = '3d3a4db2-fe2e-4cf2-8f77-6496f85d47a9';
        const inputState = new State('Report');
        inputState.meta.id = '648f6a81-83be-47f1-a3d9-c7aeaa62278a';
        inputState.timestamp = '2020-01-01T00:00:00.000Z';
        input.state.push(inputState);

        const output = new Value();
        output.meta.id = 'fefe8629-fdcb-45da-b27e-4f54107071b5';
        const outputState = new State('Report');
        outputState.meta.id = '3a832de9-e6a0-4df3-ab88-d103fd5c262b';
        outputState.timestamp = '2020-01-01T00:00:00.000Z';
        output.state.push(outputState);

        unifyData(input, output, { operation: 'sum', group_by: 'hour' });

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/state/648f6a81-83be-47f1-a3d9-c7aeaa62278a',
                },
            })
        );
        sendRpcResponse(server);
        await delay();

        server.send([
            {
                meta_object: {
                    type: 'event',
                },
                event: 'update',
                path: '/state/648f6a81-83be-47f1-a3d9-c7aeaa62278a',
                data: {
                    data: '2',
                    timestamp: '2020-01-01T00:00:00.000Z',
                },
            },
        ]);
        sendRpcResponse(server);
        await delay();

        server.send([
            {
                meta_object: {
                    type: 'event',
                },
                event: 'update',
                path: '/state/648f6a81-83be-47f1-a3d9-c7aeaa62278a',
                data: {
                    data: '2',
                    timestamp: '2020-01-01T00:01:01.000Z',
                },
            },
        ]);
        sendRpcResponse(server);
        await delay();

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
    });
});
