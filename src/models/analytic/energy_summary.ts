import { AnalyticsModel } from './model.analytics';

export class EnergySummary extends AnalyticsModel {
    getUrl(): string {
        return '/2.1/analytics/1.0/energy_summary';
    }

    getResult() {
        return this.result[0];
    }
}
