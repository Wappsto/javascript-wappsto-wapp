import { Type } from 'class-transformer';
import isEqual from 'lodash.isequal';
import { runAnalyticModel } from '../util/analytics_helpers';
import { _config } from '../util/config';
import { printDebug, printWarning } from '../util/debug';
import { generateFilterRequest } from '../util/filter';
import {
    checkList,
    compareCallback,
    compareDates,
    convertFilterToJson,
    convertFilterToString,
    getSecondsToNextPeriod,
    isLogValues,
    isPositiveInteger,
    randomIntFromInterval,
    sortByTimestamp,
    toISOString,
    toSafeString,
} from '../util/helpers';
import wappsto, { printHttpError } from '../util/http_wrapper';
import {
    AnalyticsResponse,
    EventLogLevel,
    ExternalLogValues,
    Filter,
    FilterSubType,
    ILogRequest,
    ILogResponse,
    IModel,
    IState,
    IValueBase,
    IValueFunc,
    IValueNumberBase,
    IValueStringBlobBase,
    IValueXmlBase,
    JSONObject,
    LogValue,
    LogValues,
    RefreshStreamCallback,
    ReportValueInput,
    StateType,
    Timestamp,
    ValidateParams,
    ValuePermission,
    ValueStreamCallback,
} from '../util/interfaces';
import { addModel, getModel } from '../util/modelStore';
import { EnergyData, EnergyPieChart, EnergySummary } from './analytic';
import { AnalyticsModel, Newable } from './analytic/model.analytics';
import { EventLog } from './eventlog';
import { Model } from './model';
import { PermissionModel } from './model.permission';
import { StreamModel } from './model.stream';
import { State } from './state';

export class Value extends StreamModel implements IValueBase, IValueFunc {
    static endpoint = '/2.1/value';
    static attributes = [
        'name',
        'permission',
        'description',
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
    periodTimer?: ReturnType<typeof setTimeout>;
    refreshCallbacks: RefreshStreamCallback[] = [];
    jitterTimer?: ReturnType<typeof setTimeout>;
    callbackFunc: Record<string, () => Promise<void>> = {};

    constructor(name?: string) {
        super('value', 1);
        Model.validateMethod('Value', 'constructor', arguments, true);
        this.name = name || '';
    }

    get states() {
        return this.state;
    }

    getAttributes(): string[] {
        return Value.attributes;
    }

    public static getFilter(filter?: Filter, omit_filter?: Filter): string[] {
        Value.#validateStatic('getFilter', [filter, omit_filter]);
        return convertFilterToJson(
            'value',
            Value.attributes,
            filter?.value as FilterSubType,
            omit_filter?.value as FilterSubType
        ).concat(State.getFilter());
    }

    public static getFilterResult(
        filter?: Filter,
        omit_filter?: Filter
    ): string {
        Value.#validateStatic('getFilterResult', [filter, omit_filter]);
        const fields = [Model.getMetaFilterResult()]
            .concat(Value.attributes)
            .join(' ');

        const strFilter = convertFilterToString(
            Value.attributes,
            filter?.value as FilterSubType,
            omit_filter?.value as FilterSubType
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await this.onChange((_val) => {
            this.#handlePeriodUpdate();
        });

        if (this.#handlePeriodUpdate()) {
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
        Value.#validateStatic('fetchById', [id]);
        const data = await Model.fetch({
            endpoint: `${Value.endpoint}/${id}`,
            params: {
                expand: 1,
            },
        });
        const values = Value.fromArray(data);
        const promises: Promise<void>[] = [];
        values.forEach((val) => {
            promises.push(val.loadAllChildren(null));
        });
        await Promise.all(promises);
        return values[0];
    };

    public static fetch = async () => {
        const params = { expand: 1 };
        const url = Value.endpoint;

        const data = await Model.fetch({ endpoint: url, params });
        const values = Value.fromArray(data);
        const promises: Promise<void>[] = [];
        values.forEach((val, index) => {
            if (val.loadAllChildren) {
                promises.push(val.loadAllChildren(null));
            } else if (typeof val === 'string') {
                promises.push(
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
        await Promise.all(promises);

        values.forEach((value) => {
            if (value?.addChildrenToStore) {
                value.addChildrenToStore();
            }
        });
        return values;
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async reload(_reloadAll = false): Promise<boolean> {
        return super.reload(_reloadAll, 1);
    }

    public async loadAllChildren(
        json: JSONObject | null,
        reloadAll = false
    ): Promise<void> {
        if (json?.state && Array.isArray(json.state)) {
            for (let i = 0; i < json.state.length; i++) {
                let id: string;
                let data: JSONObject | undefined = undefined;
                let newState: State | undefined = undefined;

                if (typeof json.state[i] === 'string') {
                    id = json.state[i] as string;
                } else {
                    id = (json.state[i] as State).meta.id || '';
                    data = json.state[i] as State;
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
                        newState = addModel(newState) as State;
                    }
                    newState.parent = this;
                    this.state.push(newState);
                }
            }
        } else {
            for (let i = 0; i < this.state.length; i++) {
                if (typeof this.state[i] === 'string') {
                    const id: string = this.state[i] as unknown as string;
                    this.state[i] = ((await getModel('state', id)) ??
                        new State()) as State;
                    this.state[i].parent = this;
                } else if (reloadAll) {
                    await this.state[i].reload();
                }
                this.state[i] = addModel(this.state[i]) as State;
            }
        }
    }

    #findState(type: StateType): State | undefined {
        let res: State | undefined = undefined;
        this.state.forEach((state) => {
            if (state.type === type) {
                res = state;
            }
        });
        return res;
    }

    #getTime(): string {
        return new Date().toISOString();
    }

    #timestampToString(timestamp: Timestamp): string {
        if (!timestamp) {
            return this.#getTime();
        } else {
            return toISOString(timestamp);
        }
    }

    async #findStateAndUpdate(
        type: StateType,
        data: ReportValueInput,
        timestamp: Timestamp
    ): Promise<boolean> {
        const state = this.#findState(type);
        if (!state) {
            return false;
        }

        state.data = this.#convertValueInput(data);
        state.timestamp = this.#timestampToString(timestamp);

        if (type !== 'Report' || !this.sendReportWithJitter) {
            return await state.update(State.attributes);
        }

        this.sendReportWithJitter = false;
        const eventTimestamp = state.timestamp;

        const timeout = randomIntFromInterval(
            _config.jitterMin * 10,
            _config.jitterMax * 10
        );
        await new Promise((r) => {
            this.jitterTimer = setTimeout(r, timeout * 100);
        });

        const oldData = state.data;
        const oldTimestamp = state.timestamp;

        state.data = data.toString();
        state.timestamp = eventTimestamp;

        const p = state.update(State.attributes);

        state.data = oldData;
        state.timestamp = oldTimestamp;

        return await p;
    }

    async #findStateAndCallback(
        type: StateType,
        callback: ValueStreamCallback,
        callOnInit?: boolean
    ): Promise<boolean> {
        let res = false;
        const state = this.#findState(type);
        if (state) {
            if (callOnInit === true) {
                callback(this, state.data, state.timestamp);
            }

            if (!this.callbackFunc[type]) {
                this.callbackFunc[type] = async () => {
                    const callbacks = this.stateCallbacks?.[state.type] || [];
                    for (let i = 0; i < callbacks.length; i++) {
                        const cb = callbacks[i];
                        await cb(this, state.data, state.timestamp);
                    }
                };
            }

            if (!checkList(this.stateCallbacks[type], callback)) {
                this.stateCallbacks[type].push(callback);
                if (this.stateCallbacks[type].length === 1) {
                    res = await state.onChange(this.callbackFunc[type]);
                }
            } else {
                printDebug(
                    `Skipping duplicate ${type} callback for ${this.id()}`
                );
            }
        }
        return res;
    }

    async #findStateAndClearCallback(
        type: StateType,
        callback?: ValueStreamCallback
    ): Promise<boolean> {
        if (callback) {
            const index = this.stateCallbacks[type].findIndex((c) =>
                compareCallback(c, callback)
            );
            if (index !== -1) {
                this.stateCallbacks[type].splice(index, 1);
            } else {
                printDebug(`Failed to find and remove ${type} callback`);
            }
        } else {
            this.stateCallbacks[type] = [];
        }
        if (this.stateCallbacks[type].length === 0) {
            const state = this.#findState(type);
            if (state && this.callbackFunc[type]) {
                return state.cancelOnChange(this.callbackFunc[type]);
            }
        }
        return false;
    }

    public async addEvent(
        level: EventLogLevel,
        message: string,
        info?: JSONObject
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
        let state = this.#findState(params.type);
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
                await state.update(State.attributes);
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

        const state = this.#findState(type);
        if (!state) {
            return;
        }

        return state.delete();
    }

    public toJSON() {
        const json = super.toJSON();
        if (json['period'] !== undefined) {
            json['period'] = json['period'].toString();
        }
        return json;
    }

    public parseChildren(json: JSONObject): boolean {
        let res = false;
        const states = State.fromArray([json]);
        if (states.length) {
            this.state.push(states[0]);
            res = true;
        }
        return res;
    }

    #findStateAndData(type: StateType): string | undefined {
        const state = this.#findState(type);
        if (state) {
            return state.data;
        }
        return undefined;
    }

    #findStateAndTimestamp(type: StateType): string | undefined {
        const state = this.#findState(type);
        if (state) {
            return state.timestamp;
        }
        return undefined;
    }

    public getReportData(): string | undefined {
        return this.#findStateAndData('Report');
    }

    public getControlData(): string | undefined {
        return this.#findStateAndData('Control');
    }

    public getControlTimestamp(): string | undefined {
        return this.#findStateAndTimestamp('Control');
    }

    public getReportTimestamp(): string | undefined {
        return this.#findStateAndTimestamp('Report');
    }

    #convertValueInput(data: ReportValueInput): string {
        switch (typeof data) {
            case 'boolean':
                if (this.number) {
                    return data ? '1' : '0';
                }
                return data ? 'true' : 'false';
            case 'function':
            case 'object':
                return toSafeString(data);
            case 'undefined':
                return 'NA';
            case 'symbol':
            case 'bigint':
            case 'number':
            case 'string':
            default:
                return data.toString();
        }
    }

    public report(
        data: ReportValueInput | LogValues,
        timestamp?: Timestamp
    ): Promise<boolean> {
        this.validate('report', arguments);

        if (isLogValues<ReportValueInput>(data)) {
            return this.#sendLogReport(data);
        }

        return this.#sendReport(data, timestamp || 0, false);
    }

    public forceReport(
        data: ReportValueInput,
        timestamp?: Timestamp
    ): Promise<boolean> {
        this.validate('forceReport', arguments);

        return this.#sendReport(data, timestamp || 0, true);
    }

    async #sendReport(
        data: ReportValueInput,
        timestamp: Timestamp,
        force: boolean
    ): Promise<boolean> {
        const sendData = this.#convertValueInput(data);
        const oldState = this.#findState('Report');
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
        return this.#findStateAndUpdate('Report', sendData, timestamp);
    }

    public async sendLogReports(data: LogValues) {
        const state = this.#findState('Report');
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
                return `${p}${id},${c.data},${this.#timestampToString(
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

    async #sendLogReport(data: LogValues) {
        const state = this.#findState('Report');
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
        timestamp?: Timestamp
    ): Promise<boolean> {
        this.validate('control', arguments);
        return this.#findStateAndUpdate('Control', data, timestamp || 0);
    }

    public controlWithAck(
        data: ReportValueInput,
        timestamp?: Timestamp
    ): Promise<string | undefined | null> {
        this.validate('controlWithAck', arguments);

        const promise = new Promise<string | undefined | null>(
            async (resolve) => {
                // eslint-disable-next-line prefer-const
                let timer: ReturnType<typeof setTimeout> | 'skip' | undefined;
                const cb = (
                    _value: IValueFunc & IValueBase,
                    data: string,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    _timestamp: string
                ) => {
                    if (timer) {
                        clearTimeout(timer);
                        timer = undefined;
                    } else {
                        timer = 'skip';
                    }
                    this.cancelOnReport(cb);
                    resolve(data);
                };

                await this.onReport(cb);

                const res = await this.#findStateAndUpdate(
                    'Control',
                    data,
                    timestamp || 0
                );

                if (!res) {
                    this.cancelOnReport(cb);
                    resolve(undefined);
                    return;
                }

                if (timer === undefined) {
                    timer = setTimeout(() => {
                        timer = undefined;
                        this.cancelOnReport(cb);
                        resolve(null);
                    }, _config.ackTimeout * 1000);
                }
            }
        );

        return promise;
    }

    public onControl(callback: ValueStreamCallback): Promise<boolean> {
        this.validate('onControl', arguments);
        return this.#findStateAndCallback('Control', callback);
    }

    public onReport(
        callback: ValueStreamCallback,
        callOnInit?: boolean
    ): Promise<boolean> {
        this.validate('onReport', arguments);
        return this.#findStateAndCallback('Report', callback, callOnInit);
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

    public cancelOnReport(callback?: ValueStreamCallback): Promise<boolean> {
        return this.#findStateAndClearCallback('Report', callback);
    }

    public cancelOnControl(callback?: ValueStreamCallback): Promise<boolean> {
        return this.#findStateAndClearCallback('Control', callback);
    }

    public cancelOnRefresh(): Promise<boolean> {
        this.refreshCallbacks = [];
        return this.clearAllCallbacks();
    }

    async #changeAttribute(key: string, value: string | number): Promise<void> {
        try {
            const data: Record<string, string | number> = {};
            data[key] = value;
            await wappsto.patch(this.getUrl(), data, Model.generateOptions());
        } catch (e) {
            printHttpError('Value.changeAttribute', e);
        }
    }

    public refresh(): Promise<void> {
        return this.#changeAttribute('status', 'update');
    }

    public setPeriod(period: number): Promise<void> {
        return this.#changeAttribute('period', period.toString());
    }

    public setDelta(delta: number): Promise<void> {
        return this.#changeAttribute('delta', delta.toString());
    }

    async #findStateAndLog(
        type: StateType,
        request: ILogRequest
    ): Promise<ILogResponse> {
        const state = this.#findState(type);
        if (state) {
            const params = { ...request };
            if (typeof params.start === 'object') {
                params.start = params.start.toISOString();
            }
            if (typeof params.end === 'object') {
                params.end = params.end.toISOString();
            }
            const response = await Model.fetch({
                endpoint: `/2.1/log/${state.id()}/state`,
                params: params as JSONObject,
                go_internal: false,
                throw_error: true,
            });
            if (
                response[0] &&
                response[0].data &&
                Array.isArray(response[0].data)
            ) {
                const r = response[0] as unknown as ExternalLogValues;
                const data = r?.data?.map(
                    (item) =>
                        ({
                            data: item.data ?? item[params.operation ?? 'data'],
                            timestamp: item.timestamp ?? item.time,
                        } as LogValue)
                ) as LogValues;
                return {
                    ...r,
                    data,
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

        return this.#findStateAndLog('Report', request);
    }

    public getControlLog(request: ILogRequest): Promise<ILogResponse> {
        this.validate('getControlLog', arguments);

        return this.#findStateAndLog('Control', request);
    }

    async #runAnalytics(
        model: Newable<AnalyticsModel>,
        start: Timestamp,
        end: Timestamp
    ): Promise<null | AnalyticsResponse> {
        const report = this.#findState('Report');
        if (!report) {
            printWarning('Analytics is only available for report values');
            return null;
        }

        return runAnalyticModel(model, [report.id()], start, end, {});
    }

    public analyzeEnergy(
        start: Timestamp,
        end: Timestamp
    ): Promise<AnalyticsResponse> {
        this.validate('analyzeEnergy', arguments);
        return this.#runAnalytics(EnergyData, start, end);
    }

    public summarizeEnergy(
        start: Timestamp,
        end: Timestamp
    ): Promise<AnalyticsResponse> {
        this.validate('summarizeEnergy', arguments);
        return this.#runAnalytics(EnergySummary, start, end);
    }

    public energyPieChart(
        start: Timestamp,
        end: Timestamp
    ): Promise<AnalyticsResponse> {
        this.validate('energyPieChart', arguments);
        return this.#runAnalytics(EnergyPieChart, start, end);
    }

    static find = async (
        params: JSONObject,
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = '',
        filterRequest?: JSONObject
    ) => {
        Value.#validateStatic('find', [
            params,
            quantity,
            readOnly,
            usage,
            filterRequest,
        ]);

        usage ||= `Find ${quantity} value`;
        const query: JSONObject = {
            expand: 1,
        };
        if (!filterRequest) {
            for (const key in params) {
                query[`this_${key}`] = `=${params[key]}`;
            }
        }

        const data = await PermissionModel.request({
            endpoint: Value.endpoint,
            quantity,
            message: usage,
            params: query,
            body: filterRequest,
            readOnly,
        });

        const values = Value.fromArray(data);
        const promises: Promise<void>[] = [];

        values.forEach((val, index) => {
            if (val.loadAllChildren) {
                promises.push(val.loadAllChildren(null));
            } else if (typeof val === 'string') {
                promises.push(
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
        await Promise.all(promises);

        values.forEach((value) => {
            if (value?.addChildrenToStore) {
                value.addChildrenToStore();
            }
        });
        return values;
    };

    public async findByName(
        name: string,
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = ''
    ) {
        return Value.findByName(name, quantity, readOnly, usage);
    }

    static findByName = (
        name: string,
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = ''
    ) => {
        Value.#validateStatic('findByName', [name, quantity, readOnly, usage]);

        usage ||= `Find ${quantity} value with name ${name}`;
        return Value.find({ name: name }, quantity, readOnly, usage);
    };

    static findByType = (
        type: string,
        quantity: number | 'all' = 1,
        readOnly = false,
        usage = ''
    ) => {
        Value.#validateStatic('findByType', [type, quantity, readOnly, usage]);

        usage ||= `Find ${quantity} value with type ${type}`;
        return Value.find({ type: type }, quantity, readOnly, usage);
    };

    static findAllByName = (name: string, readOnly = false, usage = '') => {
        Value.#validateStatic('findAllByName', [name, readOnly, usage]);
        return Value.findByName(name, 'all', readOnly, usage);
    };

    static findAllByType = (type: string, readOnly = false, usage = '') => {
        Value.#validateStatic('findAllByType', [type, readOnly, usage]);
        return Value.findByType(type, 'all', readOnly, usage);
    };

    static findById = async (id: string, readOnly = false) => {
        Value.#validateStatic('findById', [id, readOnly]);
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
        Value.#validateStatic('findByFilter', [
            filter,
            omit_filter,
            quantity,
            readOnly,
            usage,
        ]);

        usage ||= `Find ${quantity} value using filter`;
        const filterRequest = generateFilterRequest(
            Value.getFilterResult,
            filter,
            omit_filter
        );
        return await Value.find({}, quantity, readOnly, usage, filterRequest);
    };

    static findAllByFilter = async (
        filter: Filter,
        omit_filter: Filter = {},
        readOnly = false,
        usage = ''
    ) => {
        Value.#validateStatic('findAllByFilter', [
            filter,
            omit_filter,
            readOnly,
            usage,
        ]);
        return Value.findByFilter(filter, omit_filter, 'all', readOnly, usage);
    };

    static #validateStatic(name: string, params: ValidateParams): void {
        Value.#validate(name, params, true);
    }

    static #validate(
        name: string,
        params: ValidateParams,
        isStatic = false
    ): void {
        Model.validateMethod('Value', name, params, isStatic);
    }

    #handlePeriodUpdate(): boolean {
        if (this.period && Number(this.period) !== this.last_period) {
            this.last_period = Number(this.period);
            this.#startPeriodHandler();
            return true;
        }
        return false;
    }

    #getPeriodTimeout(): number {
        let timeout = 0;
        timeout = this.last_period;
        if (timeout && isPositiveInteger(this.last_period)) {
            return getSecondsToNextPeriod(timeout) * 1000;
        } else {
            return 0;
        }
    }

    #startPeriodHandler(): void {
        clearTimeout(this.periodTimer);

        if (this.#getPeriodTimeout() === 0) {
            return;
        }

        this.periodTimer = setTimeout(() => {
            this.#triggerPeriodUpdate();
        }, this.#getPeriodTimeout());
    }

    #triggerPeriodUpdate() {
        this.refreshCallbacks.forEach((cb) => {
            this.sendReportWithJitter = true;
            this.reportIsForced = true;
            cb(this, 'period');
        });

        this.periodTimer = setTimeout(() => {
            this.#triggerPeriodUpdate();
        }, this.#getPeriodTimeout());
    }

    public cancelPeriod(): void {
        clearTimeout(this.periodTimer);
        clearTimeout(this.jitterTimer);
    }

    public async clearAllCallbacks(): Promise<boolean> {
        const res = await super.clearAllCallbacks();
        const promises: Promise<boolean>[] = [];
        this.state.forEach((sta) => {
            promises.push(sta.clearAllCallbacks());
        });
        await Promise.all(promises);
        return res;
    }
}
