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

    constructor() {
        super('user', '2.1');
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
        let data: any[] = await Model.fetch(User.endpoint, { expand: 1 });
        return User.fromArray(data);
    };

    public create = async (): Promise<void> => {};
    public update = async (): Promise<void> => {};
}
