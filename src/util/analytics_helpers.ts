import { PowerPriceList } from '../models/analytic';
import {
    AnalyticsModel,
    AnalyticsParameters,
    Newable,
} from '../models/analytic/model.analytics';
import { openStream } from '../stream_helpers';
import { printWarning } from './debug';
import { AnalyticsResponse, StreamData, Timestamp } from './interfaces';

export function runAnalyticModel(
    model: Newable<AnalyticsModel>,
    state_ids: string[],
    start: Timestamp,
    end: Timestamp,
    parameters: AnalyticsParameters
): Promise<AnalyticsResponse> {
    return new Promise<AnalyticsResponse>(async (resolve, reject) => {
        const analytic = new model(state_ids, start, end, parameters);

        await openStream.subscribeService(
            '/analytics',
            (data: StreamData): boolean => {
                return analytic.handleStreamData(data, resolve);
            }
        );

        try {
            await analytic.create();
        } catch (e: any) {
            const response = e?.data?.response ?? e?.response ?? e;

            if (response?.message) {
                printWarning(response.message);
            }
            reject(response);
        }
    });
}

export function getPowerPriceList(
    start: Timestamp,
    end: Timestamp,
    region: string
) {
    return runAnalyticModel(PowerPriceList, [], start, end, { region });
}
