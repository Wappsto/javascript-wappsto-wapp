import { AnalyticsModel } from './model.analytics';

export class EnergyData extends AnalyticsModel {
    public getUrl(): string {
        return '/2.1/analytics/1.0/energy_data';
    }

    public getResult() {
        return this.result[0]?.data;
    }
}
