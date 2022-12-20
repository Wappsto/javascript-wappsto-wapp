import { AnalyticsModel } from './model.analytics';

export class EnergyPieChart extends AnalyticsModel {
    public getUrl(): string {
        return '/2.1/analytics/1.0/energy_pie_chart';
    }

    public getResult() {
        return this.result;
    }
}
