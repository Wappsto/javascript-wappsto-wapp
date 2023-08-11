/* eslint-disable @typescript-eslint/no-misused-new */

export type Timestamp = string | number | undefined | Date;
export type ValidationType = 'none' | 'normal';
export interface IConfig {
    verbose?: boolean;
    requests?: boolean;
    debug?: boolean;
    stream?: boolean;
    validation?: ValidationType;
    reconnectCount?: number;
    ackTimeout?: number;
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

export interface FetchRequest {
    endpoint: string;
    params?: Record<string, any>;
    body?: Record<string, any>;
    throw_error?: boolean;
    go_internal?: boolean;
}

export interface IModel {
    meta: IMeta;
    id(): string;
    getType(): string;
    getUrl(): string;
    getClass(): string;
    reload(reloadAll?: boolean): Promise<boolean>;
    removeChild(child: IModel): void;
    addChildrenToStore(): void;
    setParent(parent?: IModel): void;
}

export interface IModelFunc {
    create(parameters: Record<string, any>): Promise<void>;
    fetch(parameters: FetchRequest): Promise<Record<string, any>[]>;
    reload(reloadAll?: boolean): Promise<boolean>;
    setParent(parent?: IModel): void;
    parse(json: Record<string, any>): boolean;
    parseChildren(json: Record<string, any>): boolean;
    onEvent(callback: StreamCallback): void;
    onChange(callback: StreamCallback): void;
    onDelete(callback: StreamCallback): void;
    onCreate(callback: StreamCallback): void;
}

export interface INetwork {
    [key: string]: any;
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
        readOnly: boolean,
        usage: string,
        filterRequest?: Record<string, any>
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
    [key: string]: any;
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
    initialState?: IInitialState;
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
        options: Record<string, any>,
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
        options?: Record<string, any>,
        body?: Record<string, any>
    ): Promise<Record<string, any>[]>;
}

export interface LogValue {
    timestamp: Timestamp;
    data: string | number;
}

export type IInitialState = string | number | LogValue;

export type LogValues = LogValue[];
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
    initialState?: IInitialState;
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

export type ReportValueInput = string | number | boolean | Record<string, any>;

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
    ): Promise<boolean>;
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
        info?: Record<string, any>
    ): Promise<IEventLog>;
    analyzeEnergy(start: Timestamp, end: Timestamp): Promise<any>;
    summarizeEnergy(start: Timestamp, end: Timestamp): Promise<any>;
    energyPieChart(start: Timestamp, end: Timestamp): Promise<any>;
}

export interface IValueStaticFunc {
    constructor(name?: string): IValueBase;
    find(
        options: Record<string, any>,
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

export type StateType = 'Report' | 'Control';
export type StateStatus = 'Send' | 'Pending' | 'Failed';

export interface IState {
    [key: string]: any;
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

export interface ILogResponse {
    meta: IMeta;
    data: LogValues;
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
    set(name: string | Record<string, any>, item?: any): Promise<void>;
    setSecret(name: string | Record<string, any>, item?: any): Promise<void>;
    get(name: string | string[]): any;
    getSecret(name: string | string[]): any;
    remove(name: string | string[]): Promise<void>;
    removeSecret(name: string | string[]): Promise<void>;
    onChange(cb: StorageChangeHandler): void;
}

export type StorageChangeHandler = () => void | Promise<void>;
export type ServiceHandler = (
    event: any
) => Promise<boolean | undefined> | boolean | undefined;
export type RequestHandler = (
    event: any,
    method?: string,
    uri?: string,
    headers?: Record<string, string>
) => Promise<any> | any;
export type StreamCallback = (model: IStreamModel) => Promise<void> | void;
export type ValueStreamCallback = (
    value: IValueFunc & IValueBase,
    data: string,
    timestamp: string
) => Promise<void> | boolean | void;
export type RefreshStreamCallback = (
    value: IValueFunc & IValueBase,
    origin: 'user' | 'period'
) => Promise<void> | void;
export type ConnectionCallback = (
    value: IConnectionModel,
    connection: boolean
) => Promise<void> | void;

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
    getAllEdges(force?: boolean): Promise<IOntologyEdge[]>;
    deleteBranch(): Promise<void>;
    deleteEdge(params: IOntology): Promise<void>;
    removeEdge(edge: IModel): void;
}
export interface IOntologyModelFunc {
    createEdge(params: IOntology): Promise<IOntologyEdge>;
    getAllEdges(force?: boolean): Promise<IOntologyEdge[]>;
    deleteBranch(): Promise<void>;
    deleteEdge(params: IOntology): Promise<void>;
    removeEdge(edge: IModel): void;
}
export interface IOntologyEdge extends IModel {
    relationship: Relationship;
    models: IOntologyModel[];
    failedModels: Record<string, string[]>;
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
    fetch(parameters: FetchRequest): Promise<IOntologyEdge[]>;
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

export interface Filter {
    network?: {
        name?: string | string[];
        description?: string | string[];
    };
    device?: {
        name?: string | string[];
        product?: string | string[];
        serial?: string | string[];
        description?: string | string[];
        protocol?: string | string[];
        communication?: string | string[];
        version?: string | string[];
        manufacturer?: string | string[];
    };
    value?: {
        name?: string | string[];
        permission?: string | string[];
        type?: string | string[];
        description?: string | string[];
        period?: string | string[];
        delta?: string | string[];
        number?: {
            min?: number | number[] | string | string[];
            max?: number | number[] | string | string[];
            step?: number | number[] | string | string[];
            unit?: string | string[];
            si_conversion?: string | string[];
        };
        string?: {
            max?: number | number[] | string | string[];
            encoding?: string | string[];
        };
        blob?: {
            max?: number | number[] | string | string[];
            encoding?: string | string[];
        };
        xml?: {
            xsd?: string | string[];
            namespace?: string | string[];
        };
    };
}
