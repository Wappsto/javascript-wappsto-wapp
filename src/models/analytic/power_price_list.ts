import { Timestamp } from '../../util/interfaces';
import { AnalyticsModel } from './model.analytics';

export class PowerPriceList extends AnalyticsModel {
    constructor(
        state_ids: string[],
        start: Timestamp,
        end: Timestamp,
        parameters?: any
    ) {
        super(state_ids, start, end, parameters);
        this.parameter.provider = 'energidataservice';
    }

    public getUrl(): string {
        return '/2.1/analytics/1.0/power_price_list';
    }

    public getResult() {
        return this.result.prices;
    }
}
