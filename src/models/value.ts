import isEqual from 'lodash.isequal';
import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { StreamModel } from './model.stream';
import { Model } from './model';
import { State } from './state';
import { EventLog } from './eventlog';
import { EnergyData, EnergySummary, EnergyPieChart } from './analytic';
import { _config } from '../util/config';
import wappsto from '../util/http_wrapper';
import { printHttpError } from '../util/http_wrapper';
import {
    checkList,
    getSecondsToNextPeriod,
    randomIntFromInterval,
    isPositiveInteger,
    compareDates,
    generateFilterRequest,
    convertFilterToJson,
    convertFilterToString,
    sortByTimestamp,
} from '../util/helpers';
import { runAnalyticModel } from '../util/analytics_helpers';
import { printDebug, printWarning } from '../util/debug';
import {
    Filter,
    Timestamp,
    IModel,
    IValueBase,
    IValueNumberBase,
    IValueStringBlobBase,
    IValueXmlBase,
    ValuePermission,
    EventLogLevel,
    IState,
    StateType,
    ILogRequest,
    ILogResponse,
    RefreshStreamCallback,
    ValueStreamCallback,
    LogValues,
    ReportValueInput,
} from '../util/interfaces';
import { addModel } from '../util/modelStore';

export class Value extends StreamModel implements IValueBase {
    static endpoint = '/2.1/value';
    static attributes = [
        'name',
        'permission',
        'type',
        'period',
        'delta',
        'number',
        'string',
        'blob',
        'xml',
        'status',
    ];
    name: string;
    description?: string;
    permission: ValuePermission = 'r';
    tmp_permission: ValuePermission = 'r';
    type = '';
    period?: number | string;
    last_period = 0;
    delta?: string;

    number?: IValueNumberBase;
    string?: IValueStringBlobBase;
    blob?: IValueStringBlobBase;
    xml?: IValueXmlBase;

    status?: string;
    @Type(() => State)
    state: State[] = [];
    @Type(() => EventLog)
    eventlog: EventLog[] = [];
    stateCallbacks: Record<string, ValueStreamCallback[]> = {
        Control: [],
        Report: [],
    };
    reportIsForced = false;
    sendReportWithJitter = false;
    periodTimer?: any;
    refreshCallbacks: RefreshStreamCallback[] = [];
    jitterTimer?: any;

    constructor(name?: string) {
        super('value', 1);
        Model.validateMethod('Value', 'constructor', arguments);
        this.name = name || '';
    }

    get states() {
        return this.state;
    }

    getAttributes(): string[] {
        return Value.attributes;
    }

    public static getFilter(filter?: Filter, omit_filter?: Filter): string[] {
        Value.validate('getFilter', [filter, omit_filter]);
        return convertFilterToJson(
            'value',
            Value.attributes,
            filter?.value,
            omit_filter?.value
        ).concat(State.getFilter());
    }

    public static getFilterResult(
        filter?: Filter,
        omit_filter?: Filter
    ): string {
        Value.validate('getFilterResult', [filter, omit_filter]);
        const fields = [Model.getFilterResult()]
            .concat(Value.attributes)
            .join(' ');

        const strFilter = convertFilterToString(
            Value.attributes,
            filter?.value,
            omit_filter?.value
        );

        return `value ${strFilter} { ${fields} ${State.getFilterResult()}}`;
    }

    public getValueType(): string {
        if (this.number) {
            return 'number';
        }
        if (this.string) {
            return 'string';
        }
        if (this.blob) {
            return 'blob';
        }
        if (this.xml) {
            return 'xml';
        }
        return '';
    }

    public removeValueType(oldType: string): void {
        switch (oldType) {
            case 'number':
                this.number = undefined;
                break;
            case 'string':
                this.string = undefined;
                break;
            case 'blob':
                this.blob = undefined;
                break;
            case 'xml':
                this.xml = undefined;
                break;
        }
    }

    public async created(): Promise<void> {
        await this.onChange((val) => {
            this.handlePeriodUpdate();
        });

        if (this.handlePeriodUpdate()) {
            printDebug(`Starting period for ${this.name}`);
        }
    }

    public preserve(): void {
        this.tmp_permission = this.permission;
    }

    public restore(): void {
        this.permission = this.tmp_permission;
    }

    public addChildrenToStore(): void {
        super.addChildrenToStore();
        this.state.forEach((sta: IModel) => {
            if (sta?.addChildrenToStore) {
                sta.addChildrenToStore();
            }
        });
    }

    public setParent(parent?: IModel): void {
        super.setParent(parent);
        this.state.forEach((state) => {
            if (typeof state !== 'string') {
                state.parent = this;
            }
        });
    }

    public static fetchById = async (id: string) => {
        Value.validate('fetchById', [id]);
        const data = await Model.fetch({
            endpoint: `${Value.endpoint}/${id}`,
            params: {
                expand: 1,
            },
        });
        const values = Value.fromArray(data);
        const poms: any[] = [];
        values.forEach((val) => {
            poms.push(val.loadAllChildren(null));
        });
        await Promise.all(poms);
        return values[0];
    };

    public static fetch = async () => {
        const params = { expand: 1 };
        const url = Value.endpoint;

        const data = await Model.fetch({ endpoint: url, params });
        const values = Value.fromArray(data);
        const poms: any[] = [];
        values.forEach((val) => {
            poms.push(val.loadAllChildren(null));
        });
        await Promise.all(poms);
        return values;
    };

    public async reload(reloadAll = false): Promise<boolean> {
        return super.reload(false, 1);
    }

    public async loadAllChildren(
        json: Record<string, any> | null,
        reloadAll = false
    ): Promise<void> {
        if (json?.state) {
            for (let i = 0; i < json.state.length; i++) {
                let id: string;
                let data: Record<string, any> | undefined = undefined;
                let newState: State | undefined = undefined;

                if (typeof json.state[i] === 'string') {
                    id = json.state[i] as string;
                } else {
                    id = json.state[i].meta.id;
                    data = json.state[i];
                }

                const st = this.state.find((st) => st.meta.id === id);
                if (st) {
                    if (data) {
                        st.parse(data);
                    }
                } else {
                    if (data) {
                        newState = new State();
                    } else {
                        newState = await State.fetchById(id);
                    }
                }

                if (newState) {
                    if (data) {
                        newState.parse(data);
                        addModel(newState);
                    }
                    newState.parent = this;
                    this.state.push(newState);
                }
            }
        } else {
            for (let i = 0; i < this.state.length; i++) {
                if (typeof this.state[i] === 'string') {
                    const id: string = this.state[i] as unknown as string;
                    this.state[i] = new State();
                    this.state[i].meta.id = id;
                    this.state[i].parent = this;
                    await this.state[i].reload();
                } else if (reloadAll) {
                    await this.state[i].reload();
                }
                addModel(this.state[i]);
            }
        }
    }

    private findState(type: StateType): State | undefined {
        let res: State | undefined = undefined;
        this.state.forEach((state) => {
            if (state.type === type) {
                res = state;
            }
        });
        return res;
    }

    private getTime(): string {
        return new Date().toISOString();
    }

    private timestampToString(timestamp: Timestamp): string {
        if (!timestamp) {
            return this.getTime();
        } else if (typeof timestamp === 'string') {
            return timestamp;
        } else {
            try {
                return new Date(timestamp).toISOString();
            } catch (e) {
                printWarning(`Failed to convert timestamp ($timestamp}) to string`);
                return '';
            }
        }
    }

    private async findStateAndUpdate(
        type: StateType,
        data: ReportValueInput,
        timestamp: Timestamp
    ): Promise<boolean> {
        const state = this.findState(type);
        if (!state) {
            return false;
        }

        state.data = this.convertValueInput(data);
        state.timestamp = this.timestampToString(timestamp);

        if (type !== 'Report' || !this.sendReportWithJitter) {
            return await state.update();
        }

        this.sendReportWithJitter = false;
        const eventTimestamp = state.timestamp;

        const timeout = randomIntFromInterval(
            _config.jitterMin,
            _config.jitterMax
        );
        await new Promise((r) => {
            this.jitterTimer = setTimeout(r, timeout * 1000);
        });

        const oldData = state.data;
        const oldTimestamp = state.timestamp;

        state.data = data.toString();
        state.timestamp = eventTimestamp;

        const p = state.update();

        state.data = oldData;
        state.timestamp = oldTimestamp;

        return await p;
    }

    private async findStateAndCallback(
        type: StateType,
        callback: ValueStreamCallback,
        callOnInit?: boolean
    ): Promise<boolean> {
        let res = false;
        const state = this.findState(type);
        if (state) {
            if (callOnInit === true) {
                callback(this, state.data, state.timestamp);
            }

            if (!checkList(this.stateCallbacks[type], callback)) {
                this.stateCallbacks[type].push(callback);
                res = await state.onChange(async () => {
                    const callbacks = this.stateCallbacks[state.type];
                    for (let i = 0; i < callbacks.length; i++) {
                        const cb = callbacks[i];
                        await cb(this, state.data, state.timestamp);
                    }
                });
            }
        }
        return res;
    }

    private async findStateAndClearCallback(type: StateType): Promise<boolean> {
        this.stateCallbacks[type] = [];
        const state = this.findState(type);
        if (state) {
            return state.clearAllCallbacks();
        }
        return false;
    }

    public async addEvent(
        level: EventLogLevel,
        message: string,
        info?: Record<string, any>
    ): Promise<EventLog> {
        this.validate('addEvent', arguments);
        const event = new EventLog();
        event.level = level;
        event.message = message;
        event.info = info;
        event.parent = this;
        await event.create();
        this.eventlog.push(event);
        return event;
    }

    public async createState(params: IState) {
        this.validate('createState', arguments);

        if (params.data === undefined) {
            delete params.data;
        }
        if (params.timestamp === undefined) {
            delete params.timestamp;
        }

        let create = false;
        let state = this.findState(params.type);
        if (!state) {
            state = new State(params.type);
            create = true;
        } else {
            printDebug(`Using existing state with id ${state.id()}`);
            delete params.data;
            delete params.timestamp;
        }

        const oldJson = state.toJSON();
        state.parse(params);
        const newJson = state.toJSON();

        state.parent = this;
        if (create || !isEqual(oldJson, newJson)) {
            if (create) {
                await state.create();
                this.state.push(state);
            } else {
                await state.update();
            }
        }

        return state;
    }

    public removeChild(child: IModel): void {
        this.state = this.state.filter((state: State) => {
            return child !== state;
        });
    }

    public async deleteState(type: StateType): Promise<void> {
        this.validate('deleteState', [type]);

        const state = this.findState(type);
        if (!state) {
            return;
        }

        return state.delete();
    }

    public toJSON(): Record<string, any> {
        const json = super.toJSON();
        if (json['period'] !== undefined) {
            json['period'] = json['period'].toString();
        }
        return json;
    }

    public parseChildren(json: Record<string, any>): boolean {
        let res = false;
        const states = State.fromArray([json]);
        if (states.length) {
            this.state.push(states[0]);
            res = true;
        }
        return res;
    }

    private findStateAndData(type: StateType): string | undefined {
        const state = this.findState(type);
        if (state) {
            return state.data;
        }
        return undefined;
    }

    private findStateAndTimestamp(type: StateType): string | undefined {
        const state = this.findState(type);
        if (state) {
            return state.timestamp;
        }
        return undefined;
    }

    public getReportData(): string | undefined {
        return this.findStateAndData('Report');
    }

    public getControlData(): string | undefined {
        return this.findStateAndData('Control');
    }

    public getControlTimestamp(): string | undefined {
        return this.findStateAndTimestamp('Control');
    }

    public getReportTimestamp(): string | undefined {
        return this.findStateAndTimestamp('Report');
    }

    private convertValueInput(data: ReportValueInput): string {
        switch (typeof data) {
            case 'boolean':
                if (this.number) {
                    return data ? '1' : '0';
                }
                return data ? 'true' : 'false';
            case 'object':
                return JSON.stringify(data);
            case 'number':
            case 'string':
            default:
                return data.toString();
        }
    }

    public report(
        data: ReportValueInput | LogValues,
        timestamp: Timestamp = undefined
    ): Promise<boolean> {
        this.validate('report', arguments);

        if (
            Array.isArray(data) &&
            data[0].data !== undefined &&
            data[0].timestamp !== undefined
        ) {
            return this._sendLogReport(data);
        }

        return this.sendReport(data, timestamp, false);
    }

    public forceReport(
        data: ReportValueInput,
        timestamp: Timestamp = undefined
    ): Promise<boolean> {
        this.validate('forceReport', arguments);

        return this.sendReport(data, timestamp, true);
    }

    private async sendReport(
        data: ReportValueInput,
        timestamp: Timestamp = undefined,
        force: boolean
    ): Promise<boolean> {
        const sendData = this.convertValueInput(data);
        const oldState = this.findState('Report');
        if (!oldState) {
            return false;
        }

        if (
            this.delta &&
            this.delta !== '0' &&
            !this.reportIsForced &&
            !force &&
            compareDates(timestamp || new Date(), oldState.timestamp)
        ) {
            if (this.delta.toLowerCase() === 'inf') {
                printDebug(
                    `Dropping value update for "${this.name}" because delta is Inf`
                );
                return false;
            }

            const oldData = parseFloat(oldState.data);
            let newData = 0;
            if (typeof data === 'number') {
                newData = data;
            } else if (typeof data === 'string') {
                newData = parseFloat(data);
            }

            const delta = Math.abs(parseFloat(this.delta));
            const diff = Math.abs(oldData - newData);
            if (diff < delta) {
                printDebug(
                    `Dropping value update for "${this.name}" because the change is less then ${delta}`
                );
                return false;
            }
        }

        this.reportIsForced = false;
        return this.findStateAndUpdate('Report', sendData, timestamp);
    }

    public async sendLogReports(data: LogValues) {
        const state = this.findState('Report');
        if (!state) {
            return false;
        }

        if (data.length === 0) {
            return true;
        }

        const id = state.meta.id;
        let offset = 0;
        do {
            const tmpData = data.slice(offset, offset + 50000);
            const csvStr = tmpData.reduce((p, c) => {
                return `${p}${id},${c.data},${this.timestampToString(
                    c.timestamp
                )}\n`;
            }, 'state_id,data,timestamp\n');

            await wappsto.post('/log_zip', csvStr, {
                headers: { 'Content-type': 'text/csv' },
            });
            offset += 50000;
        } while (offset < data.length);

        return true;
    }

    private async _sendLogReport(data: LogValues) {
        const state = this.findState('Report');
        if (!state) {
            return false;
        }

        const logData = data.slice(0);
        logData.sort(sortByTimestamp);
        const lastData = logData.pop();
        if (lastData) {
            await this.report(lastData.data, lastData.timestamp);
        }

        return this.sendLogReports(logData);
    }

    public control(
        data: ReportValueInput,
        timestamp: Timestamp = undefined
    ): Promise<boolean> {
        this.validate('control', arguments);
        return this.findStateAndUpdate('Control', data, timestamp);
    }

    public controlWithAck(
        data: ReportValueInput,
        timestamp: Timestamp = undefined
    ): Promise<boolean> {
        this.validate('controlWithAck', arguments);

        const promise = new Promise<boolean>((resolve) => {
            this.findStateAndUpdate('Control', data, timestamp).then((res) => {
                if (!res) {
                    resolve(false);
                }
            });
            this.onReport(() => {
                resolve(true);
                return true;
            });

            setTimeout(() => {
                resolve(false);
            }, _config.ackTimeout * 1000);
        });

        return promise;
    }

    public onControl(callback: ValueStreamCallback): Promise<boolean> {
        this.validate('onControl', arguments);
        return this.findStateAndCallback('Control', callback);
    }

    public onReport(
        callback: ValueStreamCallback,
        callOnInit?: boolean
    ): Promise<boolean> {
        this.validate('onReport', arguments);
        return this.findStateAndCallback('Report', callback, callOnInit);
    }

    public async onRefresh(callback: RefreshStreamCallback): Promise<boolean> {
        this.validate('onRefresh', arguments);
        this.status = undefined;
        if (!checkList(this.refreshCallbacks, callback)) {
            this.refreshCallbacks.push(callback);
            if (this.refreshCallbacks.length === 1) {
                return this.onChange(async () => {
                    if (this.status === 'update') {
                        this.reportIsForced = true;
                        this.status = undefined;
                        for (let i = 0; i < this.refreshCallbacks.length; i++) {
                            await this.refreshCallbacks[i](this, 'user');
                        }
                    }
                });
            }
        }
        return true;
    }

    public cancelOnReport(): Promise<boolean> {
        return this.findStateAndClearCallback('Report');
    }

    public cancelOnControl(): Promise<boolean> {
        return this.findStateAndClearCallback('Control');
    }

    public cancelOnRefresh(): Promise<boolean> {
        this.refreshCallbacks = [];
        return this.clearAllCallbacks();
    }

    private async changeAttribute(
        key: string,
        value: string | number
    ): Promise<void> {
        try {
            const data: Record<string, string | number> = {};
            data[key] = value;
            await wappsto.patch(this.getUrl(), data, Model.generateOptions());
        } catch (e) {
            printHttpError('Value.changeAttribute', e);
        }
    }

    public refresh(): Promise<void> {
        return this.changeAttribute('status', 'update');
    }

    public setPeriod(period: number): Promise<void> {
        return this.changeAttribute('period', period.toString());
    }

    public setDelta(delta: number): Promise<void> {
        return this.changeAttribute('delta', delta.toString());
    }

    private async findStateAndLog(
        type: StateType,
        request: ILogRequest
    ): Promise<ILogResponse> {
        const state = this.findState(type);
        if (state) {
            const params = request;
            if (typeof params.start === 'object') {
                params.start = params.start.toISOString();
            }
            if (typeof params.end === 'object') {
                params.end = params.end.toISOString();
            }
            const response = await Model.fetch({
                endpoint: `/2.1/log/${state.id()}/state`,
                params: request,
                go_internal: false,
                throw_error: true,
            });
            if (response[0]) {
                return {
                    ...response[0],
                    data: response[0].data.map(
                        (item: Record<string, string>) => ({
                            data: item[params.operation || 'data'],
                            timestamp: item.time || item.timestamp,
                        })
                    ),
                } as ILogResponse;
            }
        }
        return {
            meta: {
                id: '',
                type: 'log',
                version: '2.1',
            },
            data: [],
            more: false,
            type: 'state',
        };
    }

    public getReportLog(request: ILogRequest): Promise<ILogResponse> {
        this.validate('getReportLog', arguments);

        return this.findStateAndLog('Report', request);
    }

    public getControlLog(request: ILogRequest): Promise<ILogResponse> {
        this.validate('getControlLog', arguments);

        return this.findStateAndLog('Control', request);
    }

    private async runAnalytics(
        model: any,
        start: Timestamp,
        end: Timestamp
    ): Promise<any> {
        const report = this.findState('Report');
        if (!report) {
            printWarning('Analytics is only available for report values');
            return null;
        }

        return runAnalyticModel(model, [report.id()], start, end, {});
    }

    public analyzeEnergy(start: Timestamp, end: Timestamp): Promise<any> {
        this.validate('analyzeEnergy', arguments);
        return this.runAnalytics(EnergyData, start, end);
    }

    public summarizeEnergy(start: Timestamp, end: Timestamp): Promise<any> {
        this.validate('summarizeEnergy', arguments);
        return this.runAnalytics(EnergySummary, start, end);
    }

    public energyPieChart(start: Timestamp, end: Timestamp): Promise<any> {
        this.validate('energyPieChart', arguments);
        return this.runAnalytics(EnergyPieChart, start, end);
    }

    static find = async (
        params: Record<string, any>,
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = '',
        filterRequest?: Record<string, any>
    ) => {
        Value.validate('find', [
            params,
            quantity,
            readOnly,
            usage,
            filterRequest,
        ]);
        if (usage === '') {
            usage = `Find ${quantity} value`;
        }

        const query: Record<string, any> = {
            expand: 1,
        };
        if (!filterRequest) {
            for (const key in params) {
                query[`this_${key}`] = `=${params[key]}`;
            }
        }

        const data = await PermissionModel.request(
            Value.endpoint,
            quantity,
            usage,
            query,
            filterRequest,
            readOnly
        );

        const values = Value.fromArray(data);
        const poms: any[] = [];

        values.forEach((val, index) => {
            if (val.loadAllChildren) {
                poms.push(val.loadAllChildren(null));
            } else if (typeof val === 'string') {
                poms.push(
                    new Promise<void>((resolve) => {
                        const id = val as unknown as string;
                        Value.fetchById(id).then((value) => {
                            values[index] = value;
                            resolve();
                        });
                    })
                );
            }
        });
        await Promise.all(poms);

        values.forEach((value) => {
            if (value?.addChildrenToStore) {
                value.addChildrenToStore();
            }
        });
        return values;
    };

    static findByName = (
        name: string,
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = ''
    ) => {
        Value.validate('findByName', [name, quantity, readOnly, usage]);
        if (usage === '') {
            usage = `Find ${quantity} value with name ${name}`;
        }
        return Value.find({ name: name }, quantity, readOnly, usage);
    };

    static findByType = (
        type: string,
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = ''
    ) => {
        Value.validate('findByType', [type, quantity, readOnly, usage]);
        if (usage === '') {
            usage = `Find ${quantity} value with type ${type}`;
        }
        return Value.find({ type: type }, quantity, readOnly, usage);
    };

    static findAllByName = (name: string, readOnly = false, usage = '') => {
        Value.validate('findAllByName', [name, readOnly, usage]);
        return Value.findByName(name, 'all', readOnly, usage);
    };

    static findAllByType = (type: string, readOnly = false, usage = '') => {
        Value.validate('findAllByType', [type, readOnly, usage]);
        return Value.findByType(type, 'all', readOnly, usage);
    };

    static findById = async (id: string, readOnly = false) => {
        Value.validate('findById', [id, readOnly]);
        const values = await Value.find(
            { 'meta.id': id },
            1,
            readOnly,
            `Find value with id ${id}`
        );
        return values[0];
    };

    static findByFilter = async (
        filter: Filter,
        omit_filter: Filter = {},
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = ''
    ) => {
        Value.validate('findByFilter', [
            filter,
            omit_filter,
            quantity,
            readOnly,
            usage,
        ]);
        if (usage === '') {
            usage = `Find ${quantity} value using filter`;
        }
        const filterRequest = generateFilterRequest(
            Value.getFilter(filter, omit_filter),
            Value.getFilterResult(filter, omit_filter)
        );
        return await Value.find({}, quantity, readOnly, usage, filterRequest);
    };

    static findAllByFilter = async (
        filter: Filter,
        omit_filter: Filter = {},
        readOnly = false,
        usage = ''
    ) => {
        Value.validate('findAllByFilter', [
            filter,
            omit_filter,
            readOnly,
            usage,
        ]);
        return Value.findByFilter(filter, omit_filter, 'all', readOnly, usage);
    };

    private static validate(name: string, params: any): void {
        Model.validateMethod('Value', name, params);
    }

    private handlePeriodUpdate(): boolean {
        if (this.period && Number(this.period) !== this.last_period) {
            this.last_period = Number(this.period);
            this.startPeriodHandler();
            return true;
        }
        return false;
    }

    private getPeriodTimeout(): number {
        let timeout = 0;
        timeout = this.last_period;
        if (timeout && isPositiveInteger(this.last_period)) {
            return getSecondsToNextPeriod(timeout) * 1000;
        } else {
            return 0;
        }
    }

    private startPeriodHandler(): void {
        clearTimeout(this.periodTimer);

        if (this.getPeriodTimeout() === 0) {
            return;
        }

        this.periodTimer = setTimeout(() => {
            this.triggerPeriodUpdate();
        }, this.getPeriodTimeout());
    }

    private triggerPeriodUpdate() {
        this.refreshCallbacks.forEach((cb) => {
            this.sendReportWithJitter = true;
            this.reportIsForced = true;
            cb(this, 'period');
        });

        this.periodTimer = setTimeout(() => {
            this.triggerPeriodUpdate();
        }, this.getPeriodTimeout());
    }

    public cancelPeriod(): void {
        clearTimeout(this.periodTimer);
        clearTimeout(this.jitterTimer);
    }

    public async clearAllCallbacks(): Promise<boolean> {
        const res = await super.clearAllCallbacks();
        const poms: any[] = [];
        this.state.forEach((sta) => {
            poms.push(sta.clearAllCallbacks());
        });
        await Promise.all(poms);
        return res;
    }
}
