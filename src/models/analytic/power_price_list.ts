import { AnalyticsModel } from './model.analytics';
import { Timestamp } from '../../util/interfaces';

export class PowerPriceList extends AnalyticsModel {
    constructor(start: Timestamp, end: Timestamp) {
        super([], start, end);
    }

    public getUrl(): string {
        return '/2.1/analytics/1.0/power_price_list';
    }

    public getResult() {
        return this.result.prices;
    }
}
