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

    public static me = async (): Promise<User> => {
        let users = await User.fetch();
        return users[0];
    };

    public static fetch = async (): Promise<User[]> => {
        let data: any[] = await Model.fetch(User.endpoint + '/me', {
            expand: 1,
        });
        return User.fromArray(data);
    };

    public async create(): Promise<void> {}
    public async update(): Promise<void> {}
}
