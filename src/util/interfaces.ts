/* eslint-disable @typescript-eslint/no-misused-new */

export type ValidationType = 'none' | 'normal';
export interface IConfig {
    verbose?: boolean;
    debug?: boolean;
    validation?: ValidationType;
    reconnectCount?: number;
    jitterMin?: number;
    jitterMax?: number;
}

export interface IConfigFunc {
    config(param: IConfig): IConfig;
}

export interface IModel {
    id(): string;
    getUrl(): string;
    removeChild(child: IModel): void;
    setParent(parent?: IModel): void;
}

export interface IModelFunc {
    create(parameters: Record<string, any>): Promise<void>;
    fetch(
        endpoint: string,
        options?: Record<string, any>,
        throwError?: boolean
    ): Promise<Record<string, any>[]>;
    setParent(parent?: IModel): void;
    parse(json: Record<string, any>): boolean;
    parseChildren(json: Record<string, any>): boolean;
    onChange(callback: StreamCallback): void;
    onDelete(callback: StreamCallback): void;
    onCreate(callback: StreamCallback): void;
}

export interface IConnection {
    timestamp: string;
    online: boolean;
}

export interface IMeta {
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
    usage_daily?: Record<string, any>;
    product?: string;
    deprecated?: boolean;
    icon?: string;
    trace?: string;
}

export interface INetwork {
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
        options: Record<string, any>,
        quantity: number | 'all',
        usage: string
    ): Promise<INetwork[]>;
    findByName(
        name: string,
        quantity: number | 'all',
        usage: string
    ): INetwork[];
    findAllByName(name: string, usage: string): IDevice[];
    findById(id: string): INetwork;
    fetch(name: string, options: Record<string, any>): IDevice;
}

export interface IDevice {
    name: string;
    product?: string;
    serial?: string;
    description?: string;
    protocol?: string;
    communication?: string;
    version?: string;
    manufacturer?: string;
}

export interface IDeviceFunc {
    constructor(name?: string): void;
    findValueByName(name: string): ValueType[];
    findValueByType(type: string): ValueType[];
    createValue(
        name: string,
        permission: ValuePermission,
        valueTemplate: ValueType,
        period?: string,
        delta?: number | 'inf'
    ): Promise<ValueType>;
    createNumberValue(parameters: IValueNumber): Promise<IValueNumber>;
    createStringValue(parameters: IValueString): Promise<IValueString>;
    createBlobValue(parameters: IValueBlob): Promise<IValueBlob>;
    createXmlValue(parameters: IValueXml): Promise<IValueXml>;
    find(
        options: Record<string, any>,
        quantity: number | 'all',
        usage: string
    ): IDevice[];
    findByName(
        name: string,
        quantity: number | 'all',
        usage: string
    ): IDevice[];
    findAllByName(name: string, usage: string): IDevice[];
    findByProduct(
        product: string,
        quantity: number | 'all',
        usage: string
    ): IDevice[];
    findAllByProduct(product: string, usage: string): IDevice[];
    findById(id: string): IDevice;
}

export interface IPermissionModelFunc {
    request(
        endpoint: string,
        quantity: number | 'all',
        message: string,
        options?: Record<string, any>
    ): Promise<Record<string, any>[]>;
}

export type ValuePermission = 'r' | 'w' | 'rw' | 'wr';

export type ValueType =
    | (IValueBase & { number: IValueNumberBase })
    | (IValueBase & { string: IValueStringBlobBase })
    | (IValueBase & { blob: IValueStringBlobBase })
    | (IValueBase & { xml: IValueXmlBase });

export interface IValueBase {
    name: string;
    permission: ValuePermission;
    type: string;
    description?: string;
    period?: string;
    delta?: string;
}

export interface IValueNumberBase {
    min: number;
    max: number;
    step: number;
    unit: string;
    si_conversion?: string;
    mapping?: Record<string, any>;
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

export interface IValueFunc {
    constructor(name?: string): IState;
    createState(parameters: IState): IState;
    report(data: string | number, timestamp: string | undefined): void;
    forceReport(data: string | number, timestamp: string | undefined): void;
    control(data: string | number, timestamp: string | undefined): void;
    onControl(callback: ValueStreamCallback): void;
    onReport(callback: ValueStreamCallback): void;
    onRefresh(callback: RefreshStreamCallback): void;
    getReportLog(request: ILogRequest): Promise<ILogResponse>;
    getControlLog(request: ILogRequest): Promise<ILogResponse>;
    find(
        options: Record<string, any>,
        quantity: number | 'all',
        usage: string
    ): ValueType[];
    findByName(
        name: string,
        quantity: number | 'all',
        usage: string
    ): ValueType[];
    findByType(
        type: string,
        quantity: number | 'all',
        usage: string
    ): ValueType[];
    findAllByName(name: string, usage: string): ValueType[];
    findAllByType(type: string, usage: string): ValueType[];
    findById(id: string): ValueType;
    addEvent(
        level: EventLogLevel,
        message: string,
        info?: Record<string, any>
    ): Promise<IEventLog>;
}

export type StateType = 'Report' | 'Control';
export type StateStatus = 'Send' | 'Pending' | 'Failed';

export interface IState {
    type: StateType;
    status?: StateStatus;
    data?: string;
    timestamp?: string;
}

export interface IStateFunc {
    constructor(type?: StateType): IState;
}

export type EventLogLevel =
    | 'important'
    | 'error'
    | 'success'
    | 'warning'
    | 'info'
    | 'debug';

export interface IEventLog {
    message: string;
    level: EventLogLevel;
    info?: Record<string, any>;
    type?: string;
    timestamp?: Date;
}

export interface IEventLogFunc {
    constructor(level: EventLogLevel, message: string): IEventLog;
}

export interface INotificationCustomData {
    all: boolean;
    future: boolean;
    selected: Record<string, any>[];
}

export interface INotificationCustom {
    type: string;
    quantity: number;
    limitation: Record<string, any>[];
    method: Record<string, any>[];
    option: Record<string, any>;
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
    info: Record<string, any>[];
    identifier: string;
}

export interface INotificationFunc {
    notify(message: string): Promise<void>;
}

export type LogOperation =
    | 'arbitrary'
    | 'array_agg'
    | 'avg'
    | 'mean'
    | 'count'
    | 'geometric_mean'
    | 'max'
    | 'min'
    | 'sqrdiff'
    | 'stddev'
    | 'sum'
    | 'variance'
    | 'harmonic_mean'
    | 'first'
    | 'last'
    | 'count_distinct'
    | 'median'
    | 'percentile'
    | 'lower_quartile'
    | 'upper_quartile'
    | 'mode';

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
    start?: Date;
    end?: Date;
    limit?: number;
    offset?: number;
    operation?: LogOperation;
    group_by?: LogGroupBy;
    timestamp_format?: string;
    timezone?: string;
    order?: 'ascending' | 'descending';
    order_by?: string;
}

export interface ILogResponse {
    meta: IMeta;
    data: Record<string, any>;
    more: boolean;
    type: string;
}

export type EventType = 'create' | 'update' | 'delete' | 'direct';

export interface IStreamEvent {
    path: string;
    event: EventType;
    data?: any;
    meta_object?: IMeta;
    meta?: IMeta;
    extsync?: any;
}

export interface IStreamModel {
    path(): string;
    handleStream(event: IStreamEvent): void;
}

export interface IStreamFunc {
    subscribe(model: IStreamModel): void;
    sendInternal(type: string): Promise<any>;
    subscribeInternal(type: string, handler: ServiceHandler): void;
    subscribeService(service: string, handler: ServiceHandler): void;
    addSignalHandler(type: string, handler: SignalHandler): void;
    sendRequest(msg: any): Promise<any>;
    sendEvent(type: string, msg: string): Promise<any>;
    sendResponse(event: any, code: number, msg: any): Promise<void>;
    onRequest(handler: RequestHandler, internal: boolean): void;
    onWebHook(handler: RequestHandler): void;
    fromForeground(callback: RequestHandler): void;
}

export type OAuthRequestHandler = (url: string) => void;

export interface IOAuthFunc {
    constructor(name?: string): void;
    getToken(handler?: OAuthRequestHandler): void;
    staticGetToken(name: string, handler?: OAuthRequestHandler): void;
}

export interface IWappStorageFunc {
    wappStorage(name?: string): void;
    constructor(name: string): void;
    set(name: string, item: any): Promise<void>;
    get(name: string): any;
    onChange(cb: StorageChangeHandler): void;
}

export type StorageChangeHandler = () => void;
export type SignalHandler = (event: string) => void;
export type ServiceHandler = (
    event: any
) => Promise<true | undefined> | boolean;
export type RequestHandler = (event: any) => Promise<any> | any;
export type StreamCallback = (model: IStreamModel) => void;
export type ValueStreamCallback = (
    value: IValueBase,
    data: string,
    timestamp: string
) => void;
export type RefreshStreamCallback = (
    value: IValueBase,
    origin: 'user' | 'period'
) => void;
