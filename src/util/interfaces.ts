/* eslint-disable @typescript-eslint/no-misused-new */

export type Timestamp = string | number | undefined;
export type ValidationType = 'none' | 'normal';
export interface IConfig {
    verbose?: boolean;
    requests?: boolean;
    debug?: boolean;
    stream?: boolean;
    validation?: ValidationType;
    reconnectCount?: number;
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

export interface IMeta {
    id?: string;
    type?: string;
    version: string;
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
    historical?: boolean;
}

export interface IModel {
    meta: IMeta;
    id(): string;
    getType(): string;
    getUrl(): string;
    getClass(): string;
    reload(): void;
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
    onEvent(callback: StreamCallback): void;
    onChange(callback: StreamCallback): void;
    onDelete(callback: StreamCallback): void;
    onCreate(callback: StreamCallback): void;
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
        period?: number | string,
        delta?: number | 'inf',
        disableLog?: boolean
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
    setConnectionStatus(state: boolean | number): Promise<boolean>;
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
    [key: string]: any;
    name: string;
    permission: ValuePermission;
    type: string;
    description?: string;
    period?: number | string;
    delta?: string;
    disableLog?: boolean;
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
    report(data: string | number, timestamp: Timestamp): void;
    forceReport(data: string | number, timestamp: Timestamp): void;
    control(data: string | number, timestamp: Timestamp): void;
    onControl(callback: ValueStreamCallback): void;
    onReport(callback: ValueStreamCallback, callOnInit?: boolean): void;
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
    findById(id: string): IState;
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
    notify(message: string, level?: EventLogLevel, data?: any): Promise<void>;
    sendMail(params: IMail): Promise<boolean>;
    sendSMS(msg: string): Promise<boolean>;
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
    subscribe(model: IStreamModel, full?: boolean): void;
    subscribeInternal(type: string, handler: ServiceHandler): void;
    subscribeService(
        service: string,
        handler: ServiceHandler,
        full?: boolean
    ): void;
    sendRequest(msg: any): Promise<any>;
    sendEvent(type: string, msg: any): Promise<any>;
    sendResponse(event: any, code: number, msg: any): Promise<void>;
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
    remove(name: string): Promise<void>;
    onChange(cb: StorageChangeHandler): void;
}

export type StorageChangeHandler = () => void;
export type ServiceHandler = (
    event: any
) => Promise<boolean | undefined> | boolean | undefined;
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
export type ConnectionCallback = (
    value: IConnectionModel,
    connection: boolean
) => void;

export type Relationship = string;
export interface IOntology {
    relationship: Relationship;
    to: IOntologyModel;
    name?: string;
    description?: string;
    data?: any;
}
export interface IOntologyModel extends IModel {
    createEdge(params: IOntology): Promise<IOntologyEdge>;
    getAllEdges(): Promise<IOntologyEdge[]>;
    deleteBranch(): Promise<void>;
    deleteEdge(model: IModel): void;
}
export interface IOntologyModelFunc {
    createEdge(params: IOntology): Promise<IOntologyEdge>;
    deleteBranch(): Promise<void>;
    deleteEdge(model: IModel): void;
}
export interface IOntologyEdge extends IModel {
    relationship: Relationship;
    models: IOntologyModel[];
    to: Record<string, string[]>;
    name?: string;
    description?: string;
    data?: any;
}
export interface IOntologyEdgeFunc {
    constructor(): void;
    removeTo(to: IModel): boolean;
    deleteEdges(): Promise<void>;
    getAllEdges(): Promise<IOntologyEdge[]>;
    fetch(
        endpoint: string,
        options: Record<string, any>
    ): Promise<IOntologyEdge[]>;
}
export type IOntologyNode = IOntologyModel;
export interface IOntologyNodeFunc extends IOntologyModelFunc {
    constructor(name?: string): void;
    createNode(name: string): Promise<IOntologyNode>;
    findNode(name: string): Promise<IOntologyNode>;
}
export interface IMail {
    body: string;
    subject: string;
    from: string;
}
