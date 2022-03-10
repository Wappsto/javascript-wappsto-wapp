import { isEqual } from 'lodash';
import { Type } from 'class-transformer';
import { PermissionModel } from './model.permission';
import { StreamModel } from './model.stream';
import { Model } from './model';
import { State } from './state';
import { _config } from '../util/config';
import {
    checkList,
    getSecondsToNextPeriod,
    randomIntFromInterval,
} from '../util/helpers';
import { printDebug } from '../util/debug';
import {
    IModel,
    IValue,
    IValueNumber,
    IValueString,
    IValueBlob,
    IValueXml,
    ValuePermission,
    IState,
    StateType,
    ILogRequest,
    ILogResponse,
    RefreshStreamCallback,
    ValueStreamCallback,
} from '../util/interfaces';

export class Value extends StreamModel implements IValue {
    static endpoint = '/2.0/value';

    name: string;
    description?: string;
    permission: ValuePermission = 'r';
    tmp_permission: ValuePermission = 'r';
    type = '';
    period?: string;
    last_period = '';
    delta?: string;
    number?: IValueNumber;
    string?: IValueString;
    blob?: IValueBlob;
    xml?: IValueXml;
    status?: string;
    @Type(() => State)
    state: State[] = [];
    stateCallbacks: Record<string, ValueStreamCallback[]> = {
        Control: [],
        Report: [],
    };
    reportIsForced = false;
    sendReportWithJitter = false;
    periodTimer?: any;
    refreshCallbacks: RefreshStreamCallback[] = [];

    constructor(name?: string) {
        super('value');
        Model.validateMethod('Value', 'constructor', arguments);
        this.name = name || '';
    }

    get states() {
        return this.state;
    }

    attributes(): string[] {
        return [
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
    }

    public created(): void {
        this.onChange((val) => {
            this.handlePeriodUpdate();
        });

        this.handlePeriodUpdate();
    }

    public perserve(): void {
        this.tmp_permission = this.permission;
    }

    public restore(): void {
        this.permission = this.tmp_permission;
    }

    public setParent(parent: IModel): void {
        super.setParent(parent);
        this.state.forEach((state) => {
            if (typeof state !== 'string') {
                state.parent = this;
            }
        });
    }

    public static fetch = async () => {
        const params = { expand: 2 };
        const url = Value.endpoint;

        const data = await Model.fetch(url, params);
        return Value.fromArray(data);
    };

    public async loadAllChildren(): Promise<void> {
        for (let i = 0; i < this.state.length; i++) {
            if (typeof this.state[i] === 'string') {
                const id: string = this.state[i] as unknown as string;
                this.state[i] = new State();
                this.state[i].meta.id = id;
                this.state[i].parent = this;
                await this.state[i].reload();
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

    private async findStateAndUpdate(
        type: StateType,
        data: string | number,
        timestamp: string | undefined
    ): Promise<void> {
        const state = this.findState(type);
        if (state) {
            state.data = data.toString();
            state.timestamp = timestamp || this.getTime();
            if (this.sendReportWithJitter && type === 'Report') {
                this.sendReportWithJitter = false;
                const eventTimestamp = state.timestamp;

                const timeout = randomIntFromInterval(
                    _config.jitterMin,
                    _config.jitterMax
                );
                await new Promise((r) => setTimeout(r, timeout*1000));

                const oldData = state.data;
                const oldTimestamp = state.timestamp;

                state.data = data.toString();
                state.timestamp = eventTimestamp;

                const p = state.update();

                state.data = oldData;
                state.timestamp = oldTimestamp;

                await p;
            } else {
                await state.update();
            }
        }
    }

    private findStateAndCallback(
        type: StateType,
        callback: ValueStreamCallback
    ): void {
        if (!checkList(this.stateCallbacks[type], callback)) {
            this.stateCallbacks[type].push(callback);
            const state = this.findState(type);
            if (state) {
                state.onChange(() => {
                    this.stateCallbacks[state.type].forEach((c) => {
                        c(this, state.data, state.timestamp);
                    });
                });
            }
        }
    }

    public async createState(params: IState) {
        this.validate('createState', arguments);

        let create = false;
        let state = this.findState(params.type);
        if (!state) {
            state = new State(params.type);
            create = true;
        } else {
            printDebug(`Using existing state with id ${state.id()}`);
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

    public async report(
        data: string | number,
        timestamp: string | undefined = undefined
    ): Promise<void> {
        this.validate('report', arguments);

        return this.sendReport(data, timestamp, false);
    }

    public async forceReport(
        data: string | number,
        timestamp: string | undefined = undefined
    ): Promise<void> {
        this.validate('forceReport', arguments);

        return this.sendReport(data, timestamp, true);
    }

    private async sendReport(
        data: string | number,
        timestamp: string | undefined = undefined,
        force: boolean
    ): Promise<void> {
        if (
            this.delta &&
            this.delta !== '' &&
            this.delta !== '0' &&
            !this.reportIsForced &&
            !force
        ) {
            if (this.delta.toLowerCase() === 'inf') {
                printDebug(
                    `Dropping value update for "${this.name}" because delta is Inf`
                );
                return;
            }

            const oldState = this.findState('Report');
            if (!oldState) {
                return;
            }
            const oldData = parseFloat(oldState.data);
            let newData: number;
            if (typeof data === 'string') {
                newData = parseFloat(data);
            } else {
                newData = data;
            }

            const delta = Math.abs(parseFloat(this.delta));
            const diff = Math.abs(oldData - newData);
            if (diff < delta) {
                printDebug(
                    `Dropping value update for "${this.name}" because the change is less then ${delta}`
                );
                return;
            }
        }

        this.reportIsForced = false;
        this.findStateAndUpdate('Report', data, timestamp);
    }

    public async control(
        data: string | number,
        timestamp: string | undefined = undefined
    ): Promise<void> {
        this.validate('control', arguments);
        this.findStateAndUpdate('Control', data, timestamp);
    }

    public onControl(callback: ValueStreamCallback): void {
        this.validate('onControl', arguments);
        this.findStateAndCallback('Control', callback);
    }

    public onReport(callback: ValueStreamCallback): void {
        this.validate('onReport', arguments);
        this.findStateAndCallback('Report', callback);
    }

    public onRefresh(callback: RefreshStreamCallback): void {
        this.validate('onRefresh', arguments);

        this.refreshCallbacks.push(callback);
        this.onChange(() => {
            if (this.status === 'update') {
                callback(this, 'user');
                this.status = '';
            }
        });
    }

    public async refresh(): Promise<void> {
        this.status = 'update';
        await this.update();
    }

    private async findStateAndLog(
        type: StateType,
        request: ILogRequest
    ): Promise<ILogResponse> {
        const state = this.findState(type);
        if (state) {
            const response = await Model.fetch(
                `/2.1/log/${state.id()}/state`,
                request
            );
            return response[0] as ILogResponse;
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

    public async getReportLog(request: ILogRequest): Promise<ILogResponse> {
        this.validate('getReportLog', arguments);

        return this.findStateAndLog('Report', request);
    }

    public async getControlLog(request: ILogRequest): Promise<ILogResponse> {
        this.validate('getControlLog', arguments);

        return this.findStateAndLog('Control', request);
    }

    static find = async (
        params: Record<string, any>,
        quantity: number | 'all' = 1,
        usage = ''
    ) => {
        Value.validate('find', [params, quantity, usage]);
        if (usage === '') {
            usage = `Find ${quantity} value`;
        }

        const query: Record<string, any> = {
            expand: 2,
        };
        for (const key in params) {
            query[`this_${key}`] = `=${params[key]}`;
        }

        const data = await PermissionModel.request(
            Value.endpoint,
            quantity,
            usage,
            query
        );
        return Value.fromArray(data);
    };

    static findByName = async (
        name: string,
        quantity: number | 'all' = 1,
        usage = ''
    ) => {
        Value.validate('findByName', [name, quantity, usage]);
        if (usage === '') {
            usage = `Find ${quantity} value with name ${name}`;
        }
        return Value.find({ name: name }, quantity, usage);
    };

    static findByType = async (
        type: string,
        quantity: number | 'all' = 1,
        usage = ''
    ) => {
        Value.validate('findByType', [type, quantity, usage]);
        if (usage === '') {
            usage = `Find ${quantity} value with type ${type}`;
        }
        return Value.find({ type: type }, quantity, usage);
    };

    static findAllByName = async (name: string, usage = '') => {
        Value.validate('findAllByName', [name, usage]);
        return Value.findByName(name, 'all', usage);
    };

    static findAllByType = async (type: string, usage = '') => {
        Value.validate('findAllByType', [type, usage]);
        return Value.findByType(type, 'all', usage);
    };

    static findById = async (id: string) => {
        Value.validate('findById', [id]);
        const res = await Model.fetch(`${Value.endpoint}/${id}`, { expand: 2 });
        return Value.fromArray(res)[0];
    };

    private static validate(name: string, params: any): void {
        Model.validateMethod('Value', name, params);
    }

    private handlePeriodUpdate(): void {
        if (this.period && this.period !== this.last_period) {
            this.last_period = this.period;
            this.startPeriodHandler();
        }
    }

    private startPeriodHandler(): void {
        if (this.periodTimer) {
            clearTimeout(this.periodTimer);
        }

        const timeout = parseInt(this.last_period);
        if (isNaN(timeout) || timeout < 1) {
            return;
        }

        this.periodTimer = setTimeout(() => {
            this.triggerPeriodUpdate();
        }, getSecondsToNextPeriod(timeout));
    }

    private triggerPeriodUpdate() {
        this.refreshCallbacks.forEach((cb) => {
            this.sendReportWithJitter = true;
            this.reportIsForced = true;
            cb(this, 'period');
        });

        this.periodTimer = setTimeout(() => {
            this.triggerPeriodUpdate();
        }, parseInt(this.last_period) * 1000);
    }
}
