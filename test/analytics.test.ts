import WS from 'jest-websocket-mock';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
console.warn = jest.fn();
import { Value, State, getPowerPriceList } from '../src/index';
import { before, after, newWServer } from './util/stream';
import {
    energyDataResponse,
    emptyEnergyDataResponse,
    energySummaryResponse,
    energyPieChartResponse,
    generateStreamEvent,
    powerPriceListResponse,
} from './util/response';
import { makeErrorResponse, makeResponse, delay } from './util/helpers';

describe('analytics', () => {
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

    it('can load energy_data', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(energyDataResponse)
        );

        const value = new Value('test');
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        const dataPromise = value.analyzeEnergy(0, '2022-02-02T02:02:02Z');

        await server.connected;
        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    data: '/2.1/analytics',
                    url: '/services/2.1/websocket/open/subscription',
                },
            })
        );
        await delay();

        server.send(
            generateStreamEvent('analytics', energyDataResponse.meta.id, {})
        );
        server.send(
            generateStreamEvent('analytics', energyDataResponse.meta.id, {
                status: 'pending',
                meta: {
                    type: 'analytics',
                    version: '2.1',
                    id: energyDataResponse.meta.id,
                },
            })
        );
        server.send(
            generateStreamEvent(
                'analytics',
                energyDataResponse.meta.id,
                energyDataResponse
            )
        );

        const data = await dataPromise;

        expect(data.length).toBe(9);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/analytics/1.0/energy_data',
            {
                access: {
                    state_id: ['6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7'],
                },
                parameter: {
                    end: '2022-02-02T02:02:02Z',
                    start: '1970-01-01T00:00:00.000Z',
                },
            },
            {}
        );
    });

    it('can load empty energy_data', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(emptyEnergyDataResponse)
        );

        const value = new Value('test');
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        const dataPromise = value.analyzeEnergy(
            '2022-01-01T01:01:01Z',
            new Date('2022-02-02T02:02:02Z')
        );

        await server.connected;
        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    data: '/2.1/analytics',
                    url: '/services/2.1/websocket/open/subscription',
                },
            })
        );
        await delay();

        server.send(
            generateStreamEvent(
                'analytics',
                emptyEnergyDataResponse.meta.id,
                emptyEnergyDataResponse
            )
        );

        const data = await dataPromise;

        expect(data).toBeUndefined();
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/analytics/1.0/energy_data',
            {
                access: {
                    state_id: ['6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7'],
                },
                parameter: {
                    end: '2022-02-02T02:02:02.000Z',
                    start: '2022-01-01T01:01:01Z',
                },
            },
            {}
        );
    });

    it('can load energy_summary', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(energySummaryResponse)
        );

        const value = new Value('test');
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        const dataPromise = value.summarizeEnergy(
            '2022-01-01T01:01:01Z',
            '2022-02-02T02:02:02Z'
        );

        await server.connected;
        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    data: '/2.1/analytics',
                    url: '/services/2.1/websocket/open/subscription',
                },
            })
        );
        await delay();

        server.send(
            generateStreamEvent(
                'analytics',
                energySummaryResponse.meta.id,
                energySummaryResponse
            )
        );

        const data = await dataPromise;

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(data).toEqual(energySummaryResponse.result[0]);
    });

    it('can load energy_pie_chart', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(energyPieChartResponse)
        );

        const value = new Value('test');
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        const dataPromise = value.energyPieChart(
            '2022-01-01T01:01:01Z',
            '2022-02-02T02:02:02Z'
        );

        await server.connected;
        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    data: '/2.1/analytics',
                    url: '/services/2.1/websocket/open/subscription',
                },
            })
        );
        await delay();

        server.send(
            generateStreamEvent(
                'analytics',
                energyPieChartResponse.meta.id,
                energyPieChartResponse
            )
        );

        const data = await dataPromise;

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(data).toEqual(energyPieChartResponse.result);
    });

    it('can load power price list', async () => {
        mockedAxios.post.mockResolvedValueOnce(
            makeResponse(powerPriceListResponse)
        );

        const dataPromise = getPowerPriceList(
            '2022-01-01T01:01:01Z',
            '2022-02-02T02:02:02Z',
            'DK1'
        );

        await server.connected;
        await expect(server).toReceiveMessage(
            expect.objectContaining({
                jsonrpc: '2.0',
                method: 'POST',
                params: {
                    data: '/2.1/analytics',
                    url: '/services/2.1/websocket/open/subscription',
                },
            })
        );
        await delay();

        server.send(
            generateStreamEvent(
                'analytics',
                powerPriceListResponse.meta.id,
                powerPriceListResponse
            )
        );

        const data = await dataPromise;

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            '/2.1/analytics/1.0/power_price_list',
            {
                access: { state_id: [] },
                parameter: {
                    start: '2022-01-01T01:01:01Z',
                    end: '2022-02-02T02:02:02Z',
                    provider: 'energidataservice',
                    region: 'DK1',
                },
            },
            {}
        );
        expect(data).toEqual(powerPriceListResponse.result.prices);
    });

    it('do not work on control value', async () => {
        const value = new Value('test');
        const state = new State('Control');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        const data = await value.analyzeEnergy(
            '2022-01-01T01:01:01Z',
            '2022-02-02T02:02:02Z'
        );
        expect(mockedAxios.post).toHaveBeenCalledTimes(0);
        expect(data).toBe(null);
    });

    it('can handle error when calling analytics', async () => {
        mockedAxios.post.mockRejectedValueOnce(
            makeErrorResponse(
                { message: 'error' },
                'Reject POST',
                'can handle error when calling analytics'
            )
        );

        const value = new Value('test');
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        const dataPromise = value.analyzeEnergy(
            '2022-01-01T01:01:01Z',
            '2022-02-02T02:02:02Z'
        );

        const orgError = console.error;
        console.error = jest.fn();
        let data;
        let err;
        try {
            data = await dataPromise;
        } catch (e) {
            err = e;
        }

        expect(console.error).toHaveBeenLastCalledWith(
            'WAPPSTO ERROR: Permission.create - Unhandled code: Reject POST for can handle error when calling analytics'
        );
        console.error = orgError;

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(data).toBeUndefined();
        expect(err).toEqual({ message: 'error' });
    });

    it('can handle unknown error when calling analytics', async () => {
        mockedAxios.post.mockRejectedValueOnce(
            makeErrorResponse(
                {},
                'Reject POST',
                'can handle unknown error when calling analytics'
            )
        );

        const value = new Value('test');
        const state = new State('Report');
        state.meta.id = '6481d2e1-1ff3-41ef-a26c-27bc8d0b07e7';
        value.state.push(state);
        const dataPromise = value.analyzeEnergy(
            '2022-01-01T01:01:01Z',
            '2022-02-02T02:02:02Z'
        );

        const orgError = console.error;
        console.error = jest.fn();
        let data;
        let err;
        try {
            data = await dataPromise;
        } catch (e) {
            err = e;
        }

        expect(console.error).toHaveBeenLastCalledWith(
            'WAPPSTO ERROR: Permission.create - Unhandled code: Reject POST for can handle unknown error when calling analytics'
        );
        console.error = orgError;

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(data).toBeUndefined();
        expect(err).toEqual({});
    });
});
