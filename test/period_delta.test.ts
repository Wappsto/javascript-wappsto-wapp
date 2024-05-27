import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
import 'reflect-metadata';
import { Device, Value, State, config, ValueTemplate } from '../src/index';
import { before, after, newWServer, sendRpcResponse } from './util/stream';
import { makeResponse } from './util/helpers';

const templateHelperStart = () => {
    mockedAxios.post
        .mockResolvedValueOnce({
            data: [
                {
                    meta: {
                        type: 'value',
                        version: '2.1',
                        id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                    },
                },
            ],
        })
        .mockResolvedValueOnce({
            data: [
                {
                    meta: {
                        type: 'state',
                        version: '2.1',
                        id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                    },
                },
            ],
        })
        .mockResolvedValueOnce({
            data: [
                {
                    meta: {
                        type: 'state',
                        version: '2.1',
                        id: 'd5ad7430-7948-47b5-ab85-c9a93d0bff5b',
                    },
                },
            ],
        });
};

const templateHelperDone = () => {
    expect(mockedAxios.get).toHaveBeenCalledTimes(0);
    expect(mockedAxios.put).toHaveBeenCalledTimes(0);
    expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
    expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
        2,
        '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
        expect.objectContaining({
            data: 'NA',
            type: 'Report',
        }),
        {}
    );
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
        3,
        '/2.1/value/f589b816-1f2b-412b-ac36-1ca5a6db0273/state',
        expect.objectContaining({
            data: 'NA',
            type: 'Control',
        }),
        {}
    );
};

describe('period and delta on value', () => {
    let server: WS;

    beforeAll(() => {
        before();
    });

    beforeEach(() => {
        server = newWServer(true);
    });

    afterEach(() => {
        after();
    });

    it('can change the period and delta from createValue', async () => {
        templateHelperStart();
        const d = new Device();
        d.meta.id = 'db6ba9ca-ea15-42d3-9c5e-1e1f50110f38';

        let value = await d.createValue({
            name: 'ChangePeriodAndDelta',
            permission: 'rw',
            template: ValueTemplate.NUMBER,
            period: '10',
            delta: 10,
        });
        templateHelperDone();

        value = await d.createValue(
            'ChangePeriodAndDelta',
            'rw',
            ValueTemplate.NUMBER,
            20,
            20
        );

        expect(value.delta).toBe('20');
        expect(value.period).toBe(20);

        value.cancelPeriod();
    });

    it('drops message when there is a delta', async () => {
        mockedAxios.patch
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        value.delta = '2';
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        await value.report(1);
        await value.report(2);
        await value.report('3');
        await value.report('error');
        await value.report('error');
        value.delta = 'error';
        await value.report(10);
        value.delta = 'Inf';
        await value.report(123123);
        await value.forceReport(444);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(6);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Report',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Report',
                data: '3',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            3,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Report',
                data: 'error',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            4,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                data: 'error',
                type: 'Report',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            5,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Report',
                data: '10',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            6,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Report',
                data: '444',
            }),
            {}
        );

        value.cancelPeriod();
    });

    it('can handle delta update from user', async () => {
        const funR = jest.fn();
        mockedAxios.patch
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        value.delta = '1';
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        const reportPromise = value.onChange(funR);

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
                },
            })
        );
        sendRpcResponse(server);

        await reportPromise;

        await value.report(1);

        server.send({
            meta_object: {
                type: 'value',
            },
            event: 'update',
            path: '/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
            data: {
                delta: '2',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        await value.report(2);
        await value.report(3);

        expect(value.delta).toEqual('2');
        expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Report',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            expect.objectContaining({
                type: 'Report',
                data: '3',
            }),
            {}
        );

        value.cancelPeriod();
    });

    it('will trigger period events', async () => {
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'e094d45e-49cd-465f-8a04-c5a879f796e2',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'state',
                            version: '2.1',
                            id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                        },
                    },
                ])
            );

        const fun = jest.fn();
        const device = new Device();
        device.meta.id = '1714e470-76ef-4310-8c49-dda18ef8b819';

        const valuePromise = device.createValue(
            'test',
            'r',
            ValueTemplate.TEMPERATURE_CELSIUS
        );

        await server.connected;

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    url: '/services/2.1/websocket/open/subscription',
                    data: '/2.1/value/e094d45e-49cd-465f-8a04-c5a879f796e2',
                },
            })
        );

        sendRpcResponse(server);

        const value = await valuePromise;

        const p1 = value.onRefresh(fun);
        const p2 = value.onRefresh(fun);

        await Promise.all([p1, p2]);

        server.send({
            meta_object: {
                type: 'value',
            },
            event: 'update',
            path: '/value/e094d45e-49cd-465f-8a04-c5a879f796e2',
            data: {
                period: '2',
            },
        });

        let wait = 4000;
        while (wait) {
            await new Promise((r) => setTimeout(r, 1));
            wait -= 1;
            if (fun.mock.calls.length >= 2) {
                break;
            }
        }

        server.send({
            meta_object: {
                type: 'value',
            },
            event: 'update',
            path: '/value/e094d45e-49cd-465f-8a04-c5a879f796e2',
            data: {
                period: '0',
            },
        });
        await new Promise((r) => setTimeout(r, 1));

        value.cancelPeriod();

        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(fun).toHaveBeenCalledTimes(2);
        expect(fun).toHaveBeenNthCalledWith(1, value, 'period');
        expect(fun).toHaveBeenNthCalledWith(2, value, 'period');

        value.cancelPeriod();
    });

    it('can send a report with a high delta when it is triggered by user', async () => {
        mockedAxios.patch
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: '4240a9b6-168e-43a6-b291-afbd960a6cd5',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'state',
                            version: '2.1',
                            id: '05bcdf20-cf39-4b16-adb2-ac711d5678a6',
                        },
                    },
                ])
            );

        const device = new Device();
        device.meta.id = '416104e7-a94e-47c0-b504-bc4f9b81575a';
        const value = await device.createNumberValue({
            name: 'test',
            type: 'number',
            permission: 'r',
            delta: '50',
            min: 0,
            max: 100,
            step: 1,
            unit: '',
        });

        value.onRefresh((val) => {
            val.report(10);
            val.report(100);
        });

        await server.connected;

        await value.report(1);
        await value.report(9);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);

        server.send({
            meta_object: {
                type: 'value',
            },
            event: 'update',
            path: '/value/4240a9b6-168e-43a6-b291-afbd960a6cd5',
            data: {
                status: 'update',
            },
        });

        await new Promise((r) => setTimeout(r, 1));

        expect(value.getReportData()).toEqual('100');
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(3);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/05bcdf20-cf39-4b16-adb2-ac711d5678a6',
            expect.objectContaining({
                type: 'Report',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/05bcdf20-cf39-4b16-adb2-ac711d5678a6',
            expect.objectContaining({
                type: 'Report',
                data: '10',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            3,
            '/2.1/state/05bcdf20-cf39-4b16-adb2-ac711d5678a6',
            expect.objectContaining({
                type: 'Report',
                data: '100',
            }),
            {}
        );

        value.cancelPeriod();
    });

    it('can send a report with a high delta when it is triggered by period', async () => {
        config({ jitterMin: 2, jitterMax: 2 });
        mockedAxios.patch
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));
        mockedAxios.post
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'value',
                            version: '2.1',
                            id: 'f589b816-1f2b-412b-ac36-1ca5a6db0273',
                        },
                    },
                ])
            )
            .mockResolvedValueOnce(
                makeResponse([
                    {
                        meta: {
                            type: 'state',
                            version: '2.1',
                            id: '8d0468c2-ed7c-4897-ae87-bc17490733f7',
                        },
                    },
                ])
            );

        const device = new Device();
        device.meta.id = '1714e470-76ef-4310-8c49-dda18ef8b819';
        const value = await device.createNumberValue({
            name: 'test',
            type: 'number',
            permission: 'r',
            min: 0,
            max: 100,
            step: 1,
            unit: '',
            delta: '50',
            period: '2',
        });

        const timestamp_jitter = '2022-02-02T02:02:02.000Z';
        const timestamp = '2022-02-02T03:03:03Z';

        value.onRefresh((val) => {
            val.report(10, Date.parse(timestamp_jitter));
            val.report(100, timestamp);
        });

        await server.connected;

        await value.report(1);
        await value.report(9);

        let wait = 2000;
        while (wait !== 0) {
            if (mockedAxios.patch.mock.calls.length >= 2) {
                break;
            }
            await new Promise((r) => setTimeout(r, 1));
            wait -= 1;
        }
        const firstCallCount = mockedAxios.patch.mock.calls.length;

        server.send({
            meta_object: {
                type: 'value',
            },
            event: 'update',
            path: '/value/f589b816-1f2b-412b-ac36-1ca5a6db0273',
            data: {
                period: '0',
            },
        });

        wait = 2500;
        while (wait !== 0) {
            await new Promise((r) => setTimeout(r, 1));
            wait -= 1;
            if (mockedAxios.patch.mock.calls.length >= 3) {
                break;
            }
        }

        await value.report(60);

        value.cancelPeriod();

        expect(firstCallCount).toBe(2);
        expect(value.getReportData()).toEqual('100');
        expect(value.getReportTimestamp()).toEqual(timestamp);
        expect(mockedAxios.get).toHaveBeenCalledTimes(0);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(3);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/8d0468c2-ed7c-4897-ae87-bc17490733f7',
            expect.objectContaining({
                type: 'Report',
                data: '1',
            }),
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/8d0468c2-ed7c-4897-ae87-bc17490733f7',
            {
                type: 'Report',
                data: '100',
                timestamp: timestamp,
            },
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            3,
            '/2.1/state/8d0468c2-ed7c-4897-ae87-bc17490733f7',
            {
                type: 'Report',
                data: '10',
                timestamp: timestamp_jitter,
            },
            {}
        );

        value.cancelPeriod();
    });

    it('can trigger a period event to the device', async () => {
        mockedAxios.patch.mockResolvedValueOnce(makeResponse([]));

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';

        await value.setPeriod(3600); // 1 hour

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
            {
                period: '3600',
            },
            {}
        );

        value.cancelPeriod();
    });

    it('can trigger a delta event to the device', async () => {
        mockedAxios.patch.mockResolvedValueOnce(makeResponse([]));

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';

        await value.setDelta(2.2);

        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/value/1b969edb-da8b-46ba-9ed3-59edadcc24b1',
            {
                delta: '2.2',
            },
            {}
        );

        value.cancelPeriod();
    });

    it('can send old data without delta', async () => {
        mockedAxios.patch
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]))
            .mockResolvedValueOnce(makeResponse([]));

        const value = new Value();
        value.meta.id = '1b969edb-da8b-46ba-9ed3-59edadcc24b1';
        value.delta = '2';
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);

        const timestamp1 = '2022-02-02T03:03:03Z';
        const timestamp2 = '2022-02-02T02:02:02Z';
        const timestamp3 = '2022-02-02T01:01:01Z';

        await value.report(1, timestamp1);
        await value.report(1, timestamp2);
        await value.report(1, timestamp3);

        expect(mockedAxios.patch).toHaveBeenCalledTimes(3);
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            1,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                type: 'Report',
                data: '1',
                timestamp: timestamp1,
            },
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            2,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                type: 'Report',
                data: '1',
                timestamp: timestamp2,
            },
            {}
        );
        expect(mockedAxios.patch).toHaveBeenNthCalledWith(
            3,
            '/2.1/state/6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7',
            {
                type: 'Report',
                data: '1',
                timestamp: timestamp3,
            },
            {}
        );

        value.cancelPeriod();
    });
});
