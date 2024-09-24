import { ValidateParams } from '../util/types';
import { Model } from './model';
import { OntologyModel } from './model.ontology';

export type UserDailyLimit = {
    point?: number;
    document?: number;
    log_row?: number;
    traffic?: number;
    iot_traffic?: number;
    stream_traffic?: number;
    file?: number;
    request?: number;
    request_time?: number;
};

export type NetworkDailyLimit = {
    point?: number;
    iot_traffic?: number;
    request?: number;
    request_time?: number;
};

export type PointManagement = {
    base_point?: any;
    base_network?: any;
    user_daily_limit?: UserDailyLimit;
    network_daily_limit?: NetworkDailyLimit;
};

export class SubUser extends OntologyModel {
    static endpoint = '/2.1/subuser';
    static attributes = [
        'login_username',
        'login_password',
        'session_token',
        'first_name',
        'last_name',
        'email',
        'phone',
        'name',
        'nickname',
        'language',
        'last_online',
        'point_management',
    ];

    login_username?: string;
    login_password?: string;
    session_token?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    name?: string;
    nickname?: string;
    language?: string;
    last_online?: string;
    point_management?: PointManagement;

    constructor(username?: string, password?: string) {
        super('subuser');
        this.login_username = username;
        this.login_password = password;
    }

    getAttributes(): string[] {
        return SubUser.attributes;
    }

    static #validate(name: string, params: ValidateParams): void {
        Model.validateMethod('SubUser', name, params);
    }

    static fetch = async () => {
        const params = { expand: 0 };
        const url = SubUser.endpoint;

        const data = await Model.fetch({ endpoint: url, params });
        return SubUser.fromArray(data) as SubUser[];
    };
}
