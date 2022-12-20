import { AnalyticsModel } from './model.analytics';

export class EnergySummary extends AnalyticsModel {
    public getUrl(): string {
        return '/2.1/analytics/1.0/energy_summary';
    }

    public getResult() {
        return this.result[0];
    }
}
