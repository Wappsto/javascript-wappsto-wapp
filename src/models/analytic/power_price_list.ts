import { Timestamp } from '../../util/interfaces';
import { AnalyticsModel, AnalyticsParameters } from './model.analytics';

export class PowerPriceList extends AnalyticsModel {
    constructor(
        state_ids: string[],
        start: Timestamp,
        end: Timestamp,
        parameters: AnalyticsParameters
    ) {
        super(state_ids, start, end, parameters);
        this.parameter.provider = 'energidataservice';
    }

    getUrl(): string {
        return '/2.1/analytics/1.0/power_price_list';
    }

    getResult() {
        return this.result.prices;
    }
}
