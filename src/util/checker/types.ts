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
