import { AnalyticsModel } from './model.analytics';

export class EnergyData extends AnalyticsModel {
    getUrl(): string {
        return '/2.1/analytics/1.0/energy_data';
    }

    getResult() {
        return this.result[0]?.data;
    }
}
