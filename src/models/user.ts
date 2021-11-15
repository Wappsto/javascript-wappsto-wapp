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

    public static me = async (): Promise<User> => {
        let users = await User.fetch();
        return users[0];
    };

    public static fetch = async (): Promise<User[]> => {
        let data: any = await Model.fetch(User.endpoint + '/me');
        return User.fromArray(data);
    };
}
