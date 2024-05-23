export type JSONValue =
    | string
    | number
    | boolean
    | undefined
    | { [x: string]: JSONValue }
    | Array<JSONValue>;
export type JSONObject = Record<string, JSONValue>;

export type RPCMessage = {
    jsonrpc: '2.0';
    method: string;
    params: JSONObject;
    id: number;
};
export type RPCResult = {
    jsonrpc: '2.0';
    result: { value: boolean };
    id: number;
    error: JSONObject | JSONValue;
};

export type ValidationType = 'none' | 'normal';
export type ValidateParams = any | any[];
export type Timestamp = string | number | Date;

export type LogValue = {
    timestamp: Timestamp;
    data: string | number;
};

export type InitialState = string | number | LogValue;
export type LogValues = LogValue[];
export type ValuePermission = 'r' | 'w' | 'rw' | 'wr';
export type StateType = 'Report' | 'Control';
export type StateStatus = 'Send' | 'Pending' | 'Failed';
export type EventLogLevel =
    | 'important'
    | 'error'
    | 'success'
    | 'warning'
    | 'info'
    | 'debug';
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
export type EventType = 'create' | 'update' | 'delete' | 'direct';
export type Mail = {
    body: string;
    subject: string;
    from: string;
};
export type FilterOperatorType =
    | '='
    | '!='
    | '=='
    | '<'
    | '<='
    | '>'
    | '>='
    | '~'
    | '!~';
export type FilterValueOperatorType = {
    operator: FilterOperatorType;
    value: string | string[] | number | number[];
};
export type FilterValueType =
    | string
    | string[]
    | number
    | number[]
    | FilterValueOperatorType
    | undefined;

export type Connection = {
    timestamp: string;
    online: boolean;
};

export type ParentName = {
    network?: string;
    device?: string;
    value?: string;
};

export type Meta = {
    id?: string;
    type?: string;
    version?: string;
    redirect?: string;
    manufacturer?: string;
    iot?: boolean;
    upgradable?: boolean;
    connection?: Connection;
    stable_connection?: Connection;
    created?: string;
    updated?: string;
    revision?: number;
    changed?: string;
    owner?: string;
    size?: number;
    path?: string;
    parent?: string;
    parent_name?: ParentName;
    parent_name_by_user?: ParentName;
    usage_daily?: Record<string, string | number>;
    product?: string;
    deprecated?: boolean;
    icon?: string;
    historical?: boolean;
    name_by_user?: string;
    tag?: string[];
    tag_by_user?: string[];
};

export type FetchRequest = {
    endpoint: string;
    params?: JSONObject;
    body?: JSONObject;
    throw_error?: boolean;
    go_internal?: boolean;
};

export type AnalyticsResponse = any;

export type NotificationCustomData = {
    all: boolean;
    future: boolean;
    selected: {
        meta: {
            id: string;
        };
    }[];
};

export type NotificationCustom = {
    type: string;
    quantity: number;
    limitation: JSONObject[];
    method: JSONObject[];
    option: JSONObject;
    message: string;
    name_installation: string;
    title_installation: string | null;
    data?: NotificationCustomData;
};

export type NotificationBase = {
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
};

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

export type LogRequest = {
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
};

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
