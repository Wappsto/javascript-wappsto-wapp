import { Model } from './model';
import { printError } from '../util/debug';

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
        super('user');
    }

    public static me = async (): Promise<User> => {
        const users = await User.fetch();
        return users[0];
    };

    public static fetch = async (): Promise<User[]> => {
        const data: any[] = await Model.fetch({
            endpoint: `${User.endpoint}/me`,
            params: {
                expand: 1,
            },
        });
        return User.fromArray(data);
    };

    public async create(): Promise<void> {
        printError("User can't be created");
    }
    public async update(): Promise<boolean> {
        printError("User can't be updated");
        return false;
    }
}
