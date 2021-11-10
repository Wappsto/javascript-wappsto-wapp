import { Model } from './model';

export class User extends Model {
    static endpoint = '/2.1/user';

    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    name?: string;
    nickname?: string;
    language?: string;
    friend?: boolean;
    blocked?: boolean;
    provider?: any[];
    public?: any[];
    verified_email?: boolean;

    url(): string {
        return User.endpoint;
    }

    attributes(): string[] {
        return [
            'first_name',
            'lat_name',
            'email',
            'phone',
            'name',
            'nickname',
            'language',
        ];
    }

    public static fetch = async () => {
        let data: any = await Model.fetch(User.endpoint + '/me');
        return User.fromJSON(data);
    };

    static fromJSON(json: any): User {
        let user = Object.create(User.prototype);
        return Object.assign(user, json);
    }
}
