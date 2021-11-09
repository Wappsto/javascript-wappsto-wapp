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
    usage_daily?: any;
    product?: string;
}
