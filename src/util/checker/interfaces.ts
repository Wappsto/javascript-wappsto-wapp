/* eslint-disable @typescript-eslint/no-misused-new */

import {
    EventLogLevel,
    EventType,
    FilterValueOperatorType,
    FilterValueType,
    InitialState,
    JSONObject,
    JSONValue,
    LogOperation,
    LogValues,
    Mail,
    StateStatus,
    StateType,
    Timestamp,
    ValidationType,
    ValuePermission,
} from './types';

export interface IConfig {
    verbose?: boolean;
    requests?: boolean;
    debug?: boolean;
    stream?: boolean;
    validation?: ValidationType;
    reconnectCount?: number;
    ackTimeout?: number;
    watchdogTimeout?: number;
    jitterMin?: number;
    jitterMax?: number;
}

export interface IConfigFunc {
    config(param: IConfig): IConfig;
}

export interface IConnection {
    timestamp: string;
    online: boolean;
}

export type Meta = {
    id?: string;
    type?: string;
    version?: string;
    redirect?: string;

    manufacturer?: string;
    iot?: boolean;
    upgradable?: boolean;
    connection?: IConnection;
    created?: string;
    updated?: string;
    revision?: number;
    changed?: string;
    owner?: string;
    size?: number;
    path?: string;
    parent?: string;
    parent_name?: {
        network?: string;
        device?: string;
        value?: string;
    };
    parent_name_by_user?: {
        network?: string;
        device?: string;
        value?: string;
    };
    usage_daily?: Record<string, string | number>;
    product?: string;
    deprecated?: boolean;
    icon?: string;
    historical?: boolean;
    name_by_user?: string;
    tag?: string[];
    tag_by_user?: string[];
};

export interface FetchRequest {
    endpoint: string;
    params?: JSONObject;
    body?: JSONObject;
    throw_error?: boolean;
    go_internal?: boolean;
}

export interface IModel {
    meta: Meta;
    id(): string;
    getType(): string;
    getUrl(): string;
    getClass(): string;
    reload(reloadAll?: boolean): Promise<boolean>;
    removeChild(child: IModel): void;
    addChildrenToStore(): void;
    setParent(parent?: IModel): void;
    parse(json: Record<string, unknown>): boolean;
    toJSON(customKeys?: string[]): JSONObject;
}

export interface IModelFunc {
    create(parameters: Record<string, unknown>): Promise<void>;
    fetch(parameters: FetchRequest): Promise<Record<string, unknown>[]>;
    reload(reloadAll?: boolean): Promise<boolean>;
    setParent(parent?: IModel): void;
    parse(json: Record<string, unknown>): boolean;
    parseChildren(json: Record<string, unknown>): boolean;
    onEvent(callback: StreamCallback): void;
    onChange(callback: StreamCallback): void;
    onDelete(callback: StreamCallback): void;
    onCreate(callback: StreamCallback): void;
    getFilterResult(filter?: Filter, omit_filter?: Filter): string;
}

export interface IData {
    [key: string]: any;
    meta?: Meta;
}

export interface IDataFunc {
    fetchById(id: string): IModel;
}

export interface INetwork {
    [key: string]: any; //string | undefined;
    meta?: Meta;
    name: string;
    description?: string;
}

export interface INetworkFunc {
    constructor(name?: string): void;
    createNetwork(parameters: INetwork): Promise<INetwork>;
    findDeviceByName(name: string): IDevice[];
    findDeviceByProduct(product: string): IDevice[];
    findValueByName(name: string): ValueType[];
    findValueByType(type: string): ValueType[];
    createDevice(parameters: IDevice): Promise<IDevice>;
    find(
        options: JSONObject,
        quantity: number | 'all',
        readOnly: boolean,
        usage: string,
        filterRequest?: JSONObject
    ): Promise<INetwork[]>;
    findByName(
        name: string,
        quantity: number | 'all',
        readOnly: boolean,
        usage: string
    ): Promise<INetwork[]>;
    findAllByName(
        name: string,
        readOnly: boolean,
        usage: string
    ): Promise<INetwork[]>;
    findById(id: string, readOnly: boolean): Promise<INetwork>;
    findByFilter(
        filter: Filter,
        omit_filter: Filter,
        quantity: number | 'all',
        readOnly: boolean,
        usage: string
    ): Promise<INetwork[]>;
    findAllByFilter(
        filter: Filter,
        omit_filter: Filter,
        readOnly: boolean,
        usage: string
    ): Promise<INetwork[]>;
    fetchById(id: string): Promise<INetwork>;
    fetchByName(name: string): Promise<IDevice>;
    getFilter(filter?: Filter, omit_filter?: Filter): string[];
    getFilterResult(filter?: Filter, omit_filter?: Filter): string;
}

export interface IDevice {
    [key: string]: any; //string | undefined;
    meta?: Meta;
    name: string;
    product?: string;
    serial?: string;
    description?: string;
    protocol?: string;
    communication?: string;
    version?: string;
    manufacturer?: string;
}

export interface ICreateValue {
    name: string;
    permission: ValuePermission;
    template: ValueType;
    period?: number | string;
    delta?: number | 'inf';
    disableLog?: boolean;
    initialState?: InitialState;
    disablePeriodAndDelta?: boolean;
}

export interface IDeviceFunc {
    constructor(name?: string): void;
    findValueByName(name: string): ValueType[];
    findValueByType(type: string): ValueType[];
    createValue(
        name: string | ICreateValue,
        permission?: ValuePermission,
        valueTemplate?: ValueType,
        period?: number | string,
        delta?: number | 'inf',
        disableLog?: boolean
    ): Promise<ValueType>;
    createNumberValue(parameters: IValueNumber): Promise<IValueNumber>;
    createStringValue(parameters: IValueString): Promise<IValueString>;
    createBlobValue(parameters: IValueBlob): Promise<IValueBlob>;
    createXmlValue(parameters: IValueXml): Promise<IValueXml>;
    find(
        options: JSONObject,
        quantity: number | 'all',
        readOnly: boolean,
        usage: string
    ): IDevice[];
    findByName(
        name: string,
        quantity: number | 'all',
        readOnly: boolean,
        usage: string
    ): IDevice[];
    findAllByName(name: string, readOnly: boolean, usage: string): IDevice[];
    findByProduct(
        product: string,
        quantity: number | 'all',
        readOnly: boolean,
        usage: string
    ): IDevice[];
    findAllByProduct(
        product: string,
        readOnly: boolean,
        usage: string
    ): IDevice[];
    findById(id: string, readOnly: boolean): IDevice;
    findByFilter(
        filter: Filter,
        omit_filter: Filter,
        quantity: number | 'all',
        readOnly: boolean,
        usage: string
    ): Promise<IDevice[]>;
    findAllByFilter(
        filter: Filter,
        omit_filter: Filter,
        readOnly: boolean,
        usage: string
    ): Promise<IDevice[]>;
    fetchById(id: string): IDevice;
    setConnectionStatus(state: boolean | number): Promise<boolean>;
    getFilter(filter?: Filter): string[];
    getFilterResult(filter?: Filter): string;
}

export interface IPermissionModelFunc {
    request(
        endpoint: string,
        quantity: number | 'all',
        message: string,
        options?: JSONObject,
        body?: JSONObject,
        readOnly?: boolean,
        create?: boolean
    ): Promise<JSONObject[]>;
}

export type ValueType =
    | (IValueBase & { number: IValueNumberBase })
    | (IValueBase & { string: IValueStringBlobBase })
    | (IValueBase & { blob: IValueStringBlobBase })
    | (IValueBase & { xml: IValueXmlBase });

export type IValueType = IValueNumber | IValueString | IValueBlob | IValueXml;
export interface IValueBase {
    [key: string]: any;
    meta?: Meta;
    name: string;
    permission: ValuePermission;
    type: string;
    description?: string;
    period?: number | string;
    delta?: string;
    disableLog?: boolean;
    initialState?: InitialState;
    disablePeriodAndDelta?: boolean;
}

export interface IValueNumberBase {
    min: number;
    max: number;
    step: number;
    unit: string;
    si_conversion?: string;
    mapping?: JSONObject;
    ordered_mapping?: boolean;
    meaningful_zero?: boolean;
}

export interface IValueStringBlobBase {
    max: number;
    encoding?: string;
}

export interface IValueXmlBase {
    xsd?: string;
    namespace?: string;
}

export interface IValueNumber extends IValueBase, IValueNumberBase {}

export interface IValueString extends IValueBase, IValueStringBlobBase {}

export interface IValueBlob extends IValueBase, IValueStringBlobBase {}

export interface IValueXml extends IValueBase, IValueXmlBase {}

export type ReportValueInput = string | number | boolean | JSONObject;

export type AnalyticsResponse = any;
export interface IValueFunc {
    createState(parameters: IState): Promise<IState>;
    deleteState(type: StateType): Promise<void>;
    report(
        data: ReportValueInput | LogValues,
        timestamp?: Timestamp
    ): Promise<boolean>;
    forceReport(
        data: ReportValueInput,
        timestamp?: Timestamp
    ): Promise<boolean>;
    control(data: ReportValueInput, timestamp?: Timestamp): Promise<boolean>;
    controlWithAck(
        data: ReportValueInput,
        timestamp?: Timestamp
    ): Promise<string | undefined | null>;
    onControl(callback: ValueStreamCallback): Promise<boolean>;
    onReport(
        callback: ValueStreamCallback,
        callOnInit?: boolean
    ): Promise<boolean>;
    onRefresh(callback: RefreshStreamCallback): Promise<boolean>;
    getReportLog(request: ILogRequest): Promise<ILogResponse>;
    getControlLog(request: ILogRequest): Promise<ILogResponse>;
    addEvent(
        level: EventLogLevel,
        message: string,
        info?: JSONObject
    ): Promise<IEventLog>;
    analyzeEnergy(start: Timestamp, end: Timestamp): Promise<AnalyticsResponse>;
    summarizeEnergy(
        start: Timestamp,
        end: Timestamp
    ): Promise<AnalyticsResponse>;
    energyPieChart(
        start: Timestamp,
        end: Timestamp
    ): Promise<AnalyticsResponse>;
}

export interface IValueStaticFunc {
    constructor(name?: string): IValueBase;
    find(
        options: JSONObject,
        quantity: number | 'all',
        readOnly: boolean,
        usage: string
    ): ValueType[];
    findByName(
        name: string,
        quantity: number | 'all',
        readOnly: boolean,
        usage: string
    ): Promise<ValueType[]>;
    findByType(
        type: string,
        quantity: number | 'all',
        readOnly: boolean,
        usage: string
    ): ValueType[];
    findAllByName(name: string, readOnly: boolean, usage: string): ValueType[];
    findAllByType(type: string, readOnly: boolean, usage: string): ValueType[];
    findById(id: string, readOnly: boolean): ValueType;
    findByFilter(
        filter: Filter,
        omit_filter: Filter,
        quantity: number | 'all',
        readOnly: boolean,
        usage: string
    ): Promise<ValueType[]>;
    findAllByFilter(
        filter: Filter,
        omit_filter: Filter,
        readOnly: boolean,
        usage: string
    ): Promise<ValueType[]>;
    fetchById(id: string): ValueType;
    getFilter(filter?: Filter, omit_filter?: Filter): string[];
    getFilterResult(filter?: Filter, omit_filter?: Filter): string;
}

export interface IState {
    [key: string]: any;
    meta?: Meta;
    type: StateType;
    status?: StateStatus;
    data?: string;
    timestamp?: string;
}

export interface IStateFunc {
    constructor(type?: StateType, data?: string): IState;
    findById(id: string): IState;
    fetchById(id: string): IState;
}

export interface IEventLog {
    message: string;
    level: EventLogLevel;
    info?: JSONObject;
    type?: string;
    timestamp?: Date;
}

export interface IEventLogFunc {
    constructor(level: EventLogLevel, message: string): IEventLog;
}

export interface INotificationCustomData {
    all: boolean;
    future: boolean;
    selected: {
        meta: {
            id: string;
        };
    }[];
}

export interface INotificationCustom {
    type: string;
    quantity: number;
    limitation: JSONObject[];
    method: JSONObject[];
    option: JSONObject;
    message: string;
    name_installation: string;
    title_installation: string | null;
    data?: INotificationCustomData;
}

export interface INotificationBase {
    action: string;
    code: number;
    type: string;
    from: string;
    to: string;
    from_type: string;
    from_name: string;
    to_type: string;
    type_ids: string;
    priority: number;
    ids: string[];
    info: JSONObject[];
    identifier: string;
}

export interface INotificationFunc {
    notify(
        message: string,
        level?: EventLogLevel,
        data?: JSONObject
    ): Promise<void>;
    sendMail(params: Mail): Promise<boolean>;
    sendSMS(msg: string): Promise<boolean>;
}

export type LogGroupBy =
    | 'year'
    | 'quarter'
    | 'month'
    | 'week'
    | 'day'
    | 'hour'
    | 'minute'
    | 'second'
    | 'millisecond'
    | 'microsecond'
    | 'dow'
    | 'doy';

export interface ILogRequest {
    start?: Date | string;
    end?: Date | string;
    limit?: number;
    offset?: number;
    operation?: LogOperation;
    group_by?: LogGroupBy;
    timestamp_format?: string;
    timezone?: string;
    order?: 'ascending' | 'descending';
    order_by?: string;
    number?: boolean;
}

export type ExternalLogValues = {
    meta: Meta;
    more: boolean;
    type: string;
    data: {
        timestamp: string;
        time: string;
        data: string;
        [key: string]: string;
    }[];
};
export interface ILogResponse {
    meta: Meta;
    data: LogValues;
    more: boolean;
    type: string;
}

export type ExtsyncResponse = {
    meta?: Meta;
    headers: Record<string, string>;
    body?: JSONValue;
    code?: number;
    request?: JSONValue | string;
    uri?: string;
    method?: string;
};

export type StreamData = JSONObject;

export type StreamEvent = {
    path: string;
    event: EventType;
    data?: StreamData;
    meta_object?: Meta;
    meta?: Meta;
    extsync?: JSONValue;
};

export interface IStreamModel {
    path(): string;
    handleStream(event: StreamEvent): void;
}

export interface IStreamFunc {
    subscribe(model: IStreamModel, full?: boolean): void;
    subscribeInternal(type: string, handler: ServiceHandler): void;
    subscribeService(
        service: string,
        handler: ServiceHandler,
        full?: boolean
    ): void;
    sendRequest(msg: JSONValue): Promise<JSONValue>;
    sendEvent(type: string, msg: JSONValue): Promise<JSONValue>;
    sendResponse(
        event: ExtsyncResponse,
        code: number,
        msg: JSONValue
    ): Promise<void>;
    onRequest(handler: RequestHandler, internal: boolean): void;
    onWebHook(handler: RequestHandler): void;
    fromForeground(callback: RequestHandler): void;
    waitForBackground(timeout?: number): Promise<boolean>;
}

export interface IConnectionModel {
    isOnline(): boolean;
}

export interface IConnectionModelFunc {
    onConnectionChange(callback: ConnectionCallback): void;
    cancelOnConnectionChange(callback: ConnectionCallback): void;
}

export type OAuthConnect = {
    meta?: Meta;
    name?: string;
    api?: string;
    installation?: string;
    token?: string;
    secret_token?: string;
    params?: Record<string, string>;
    access_token_creation?: Record<string, string>;
    data?: {
        request?: string;
    };
};

export type OAuthRequestHandler = (url: string | undefined) => void;

export interface IOAuthFunc {
    constructor(name?: string): void;
    getToken(handler?: OAuthRequestHandler): void;
    staticGetToken(name: string, handler?: OAuthRequestHandler): void;
}

export interface IWappStorageFunc {
    wappStorage(name?: string): void;
    constructor(name: string): void;
    set(
        name: string | Record<string, unknown>,
        item?: unknown
    ): Promise<boolean>;
    setSecret(
        name: string | Record<string, unknown>,
        item?: unknown
    ): Promise<boolean>;
    get(name: string | string[]): unknown;
    getSecret(name: string | string[]): unknown;
    remove(name: string | string[]): Promise<boolean>;
    removeSecret(name: string | string[]): Promise<boolean>;
    onChange(cb: StorageChangeHandler): void;
    cancelOnChange(): void;
}

export interface IWappStorage<T extends Record<string, unknown>> {
    name: string;
    id: string;
    set<K extends keyof T>(name: K | T, item?: unknown): Promise<boolean>;
    setSecret<K extends keyof T>(name: K | T, item?: unknown): Promise<boolean>;
    get<K extends keyof T>(name: K | K[]): unknown | [unknown] | undefined;
    getSecret<K extends keyof T>(
        name: K | K[]
    ): unknown | [unknown] | undefined;
    keys(): Array<string>;
    values(): Array<unknown>;
    entries(): Array<[key: string, value: unknown]>;
    remove(name: string | string[]): Promise<boolean>;
    removeSecret(name: string | string[]): Promise<boolean>;
    update(): Promise<boolean>;
    onChange(cb: StorageChangeHandler): Promise<boolean>;
    reload(): Promise<boolean>;
    reset(): Promise<void>;
}

export type RequestType = {
    type: 'foreground' | 'background';
    message: JSONValue;
};

export type StorageChangeHandler = () => void | Promise<void>;
export type StreamHandler = (
    event: StreamEvent
) => Promise<boolean | undefined> | boolean | undefined;
export type ServiceHandler = (
    event: StreamData
) => Promise<JSONValue | undefined> | JSONValue | undefined;
export type WappRequestHandler<T = unknown> = (
    event: T
) => Promise<JSONValue | void> | JSONValue | void;
export type RequestHandler = (
    event: JSONValue,
    method?: string,
    path?: string,
    query?: JSONObject,
    headers?: Record<string, string>
) => Promise<JSONValue> | JSONValue;
export type StreamCallback = (model: IStreamModel) => Promise<void> | void;
export type ValueStreamCallback = (
    value: IValueFunc & IValueType,
    data: string,
    timestamp: string
) => Promise<void> | boolean | void;
export type RefreshStreamCallback = (
    value: IValueFunc & IValueType,
    origin: 'user' | 'period'
) => Promise<void> | void;
export type ConnectionCallback = (
    value: IConnectionModel,
    isOnline: boolean
) => Promise<void> | void;

export type Relationship = string;
export interface IEdge {
    relationship: Relationship;
    to: IOntologyModel;
    name?: string;
    description?: string;
    data?: unknown;
}
export interface IOntologyModel extends IModel {
    createEdge(params: IEdge): Promise<IOntologyEdge>;
    getAllEdges(force?: boolean): Promise<IOntologyEdge[]>;
    deleteBranch(): Promise<void>;
    deleteEdge(params: IEdge): Promise<void>;
    removeEdge(edge: IModel): void;
    deleteModelFromEdge(params: IEdge): Promise<void>;
    addParentEdge(edge: IOntologyEdge, to: IOntologyModel): void;
    removeParentEdge(edge: IOntologyEdge): void;
}
export interface IOntologyModelFunc {
    createEdge(params: IEdge): Promise<IOntologyEdge>;
    getAllEdges(force?: boolean): Promise<IOntologyEdge[]>;
    deleteBranch(): Promise<void>;
    deleteEdge(params: IEdge): Promise<void>;
    removeEdge(edge: IModel): void;
    deleteModelFromEdge(params: IEdge): Promise<void>;
    addParentEdge(edge: IOntologyEdge, to: IOntologyModel): void;
    removeParentEdge(edge: IOntologyEdge): void;
}
export interface IOntologyEdge extends IModel {
    relationship: Relationship;
    models: IOntologyModel[];
    failedModels: Record<string, string[]>;
    to: Record<string, string[]>;
    name?: string;
    description?: string;
    data?: unknown;
}
export interface IOntologyEdgeFunc {
    constructor(): void;
    removeTo(to: IModel): boolean;
    deleteEdges(): Promise<void>;
    getAllEdges(): Promise<IOntologyEdge[]>;
    fetch(parameters: FetchRequest): Promise<IOntologyEdge[]>;
}
export type IOntologyNode = IOntologyModel;
export interface IOntologyNodeFunc extends IOntologyModelFunc {
    constructor(name?: string): void;
    createNode(name: string): Promise<IOntologyNode>;
    findNode(name: string): Promise<IOntologyNode>;
}

export type FilterSubType = Record<
    string,
    FilterValueType | Record<string, Record<string, FilterValueType>>
>;
export interface Filter {
    network?: {
        name?: string | string[] | FilterValueOperatorType;
        description?: string | string[] | FilterValueOperatorType;
    };
    device?: {
        name?: string | string[] | FilterValueOperatorType;
        product?: string | string[] | FilterValueOperatorType;
        serial?: string | string[] | FilterValueOperatorType;
        description?: string | string[] | FilterValueOperatorType;
        protocol?: string | string[] | FilterValueOperatorType;
        communication?: string | string[] | FilterValueOperatorType;
        version?: string | string[] | FilterValueOperatorType;
        manufacturer?: string | string[] | FilterValueOperatorType;
    };
    value?: {
        name?: string | string[] | FilterValueOperatorType;
        permission?: string | string[] | FilterValueOperatorType;
        type?: string | string[] | FilterValueOperatorType;
        description?: string | string[] | FilterValueOperatorType;
        period?: string | string[] | FilterValueOperatorType;
        delta?: string | string[] | FilterValueOperatorType;
        number?: {
            min?:
                | number
                | number[]
                | string
                | string[]
                | FilterValueOperatorType;
            max?:
                | number
                | number[]
                | string
                | string[]
                | FilterValueOperatorType;
            step?:
                | number
                | number[]
                | string
                | string[]
                | FilterValueOperatorType;
            unit?: string | string[] | FilterValueOperatorType;
            si_conversion?: string | string[] | FilterValueOperatorType;
        };
        string?: {
            max?:
                | number
                | number[]
                | string
                | string[]
                | FilterValueOperatorType;
            encoding?: string | string[] | FilterValueOperatorType;
        };
        blob?: {
            max?:
                | number
                | number[]
                | string
                | string[]
                | FilterValueOperatorType;
            encoding?: string | string[] | FilterValueOperatorType;
        };
        xml?: {
            xsd?: string | string[] | FilterValueOperatorType;
            namespace?: string | string[] | FilterValueOperatorType;
        };
    };
}
