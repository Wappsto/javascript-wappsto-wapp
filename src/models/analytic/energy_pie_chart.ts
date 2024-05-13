import { AnalyticsModel } from './model.analytics';

export class EnergyPieChart extends AnalyticsModel {
    getUrl(): string {
        return '/2.1/analytics/1.0/energy_pie_chart';
    }

    getResult() {
        return this.result;
    }
}
