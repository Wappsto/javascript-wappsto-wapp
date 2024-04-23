import { printError } from '../util/debug';
import { JSONObject } from '../util/interfaces';
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
    provider?: string[];
    public?: string[];
    verified_email?: boolean;
    installation?: string;

    constructor() {
        super('user');
    }

    public static me = async (): Promise<User | undefined> => {
        const users = await User.fetch();
        return users[0];
    };

    public static fetch = async (): Promise<User[]> => {
        const data: JSONObject[] = await Model.fetch({
            endpoint: `${User.endpoint}/me`,
            params: {
                expand: 1,
            },
        });
        return User.fromArray(data);
    };

    /* eslint-disable @typescript-eslint/require-await */
    public async create(): Promise<void> {
        printError("User can't be created");
    }

    public async update(): Promise<boolean> {
        printError("User can't be updated");
        return false;
    }
}
