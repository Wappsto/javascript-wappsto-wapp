import pick from 'lodash.pick';
import {
    AnalyticsResponse,
    JSONObject,
    StreamData,
    Timestamp,
} from '../../util/interfaces';
import { PermissionModel } from '../model.permission';
import { toISOString } from '../../util/helpers';

export type Newable<T> = { new (...args: any[]): T };

export type AnalyticsParameters = {
    start?: string;
    end?: string;
    provider?: string;
    region?: string;
};

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
    result: AnalyticsResponse = {};
    access: { state_id: string[] } = { state_id: [] };
    parameter: AnalyticsParameters = {
        start: '',
        end: '',
    };
    status = '';

    constructor(
        state_ids: string[],
        start: Timestamp,
        end: Timestamp,
        parameters: AnalyticsParameters
    ) {
        super('analytics');
        this.access.state_id = state_ids;
        this.parameter.start = toISOString(start);
        this.parameter.end = toISOString(end);
        Object.assign(this.parameter, parameters);
    }

    getAttributes(): string[] {
        return AnalyticsModel.attributes;
    }

    public toJSON(): JSONObject {
        return pick(this, ['access', 'parameter']);
    }

    /* istanbul ignore next */
    public getResult() {
        return this.result;
    }

    public handleStreamData(
        data: StreamData,
        resolve: (data: AnalyticsResponse) => void
    ): boolean {
        const d = data as unknown as AnalyticsModel;
        if (this.id() === d.meta?.id && d.status !== 'pending') {
            this.parse(d);
            resolve(this.getResult());
            return true;
        }
        return false;
    }
}
