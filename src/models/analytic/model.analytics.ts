import pick from 'lodash.pick';
import { StreamData, Timestamp } from '../../util/interfaces';
import { PermissionModel } from '../model.permission';

export class AnalyticsModel extends PermissionModel {
    static endpoint = '/2.1/analytics';
    static attributes = [
        'access',
        'parameter',
        'status',
        'operation',
        'version',
        'result',
    ];
    result: any = {};
    access: { state_id: string[] } = { state_id: [] };
    parameter: { start: string; end: string; provider?: string } = {
        start: '',
        end: '',
    };
    status = '';

    constructor(
        state_ids: string[],
        start: Timestamp,
        end: Timestamp,
        parameters: any
    ) {
        super('analytics');
        this.access.state_id = state_ids;
        this.parameter.start = start.toString();
        this.parameter.end = end.toString();
        Object.assign(this.parameter, parameters);
    }

    getAttributes(): string[] {
        return AnalyticsModel.attributes;
    }

    public toJSON(): Record<string, any> {
        return pick(this, ['access', 'parameter']);
    }

    /* istanbul ignore next */
    public getResult() {
        return this.result;
    }

    public handleStreamData(
        data: StreamData,
        resolve: (data: any) => void
    ): boolean {
        const d = data as AnalyticsModel;
        if (this.id() === d.meta?.id && d.status !== 'pending') {
            this.parse(d);
            resolve(this.getResult());
            return true;
        }
        return false;
    }
}
