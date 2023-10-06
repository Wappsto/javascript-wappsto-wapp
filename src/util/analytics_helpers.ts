import { PowerPriceList } from '../models/analytic';
import { openStream } from '../stream_helpers';
import { printDebug, printWarning } from './debug';
import { Timestamp } from './interfaces';

export function runAnalyticModel(
    model: any,
    state_ids: string[],
    start: Timestamp,
    end: Timestamp,
    parameters: any
): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        const analytic = new model(state_ids, start, end, parameters);

        await openStream.subscribeService(
            '/analytics',
            (event: Record<string, any>): boolean => {
                return analytic.handleStreamEvent(event, resolve);
            }
        );

        try {
            await analytic.create();
        } catch (e: any) {
            if (e?.data?.response) {
                if (e.data.response?.message) {
                    printWarning(e.data.response.message);
                }
                reject(e.data.response);
            } else {
                printDebug(
                    `Unhandled response from analytic: ${JSON.stringify(e)}`
                );
                reject(e);
            }
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
