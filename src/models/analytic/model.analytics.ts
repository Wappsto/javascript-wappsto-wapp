import pick from 'lodash.pick';
import { Timestamp } from '../../util/interfaces';
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
    access: any = { state_id: [] };
    parameter: any = { start: '', end: '' };
    status = '';

    constructor(
        state_ids: string[],
        start: Timestamp,
        end: Timestamp,
        parameters?: any
    ) {
        super('analytics');
        this.access.state_id = state_ids;
        this.parameter.start = start;
        this.parameter.end = end;
        Object.assign(this.parameter, parameters || {});
    }

    getAttributes(): string[] {
        return AnalyticsModel.attributes;
    }

    public toJSON(): Record<string, any> {
        return pick(this, ['access', 'parameter']);
    }

    /* istanbul ignore next */
    public getResult(): any {
        return this.result;
    }

    public handleStreamEvent(event: any, resolve: any): boolean {
        if (
            this.id() === event.data.meta?.id &&
            event.data.status !== 'pending'
        ) {
            this.parse(event.data);
            resolve(this.getResult());
            return true;
        }
        return false;
    }
}
