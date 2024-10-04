import { printError } from '../util/debug';
import { JSONObject } from '../util/types';
import { Model } from './model';

export class User extends Model {
    static endpoint = '/2.1/user';
    static attributes = ['other_email', 'other_sms'];

    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    name?: string;
    role?: string;
    organization?: string;
    address?: string;
    nickname?: string;
    language?: string;
    friend?: boolean;
    blocked?: boolean;
    provider?: { name?: string; picture?: string; type?: string }[];
    public?: string[];
    verified_email?: boolean;
    verified_sms?: boolean;
    installation?: string;
    other_email?: {
        contact: string;
        status:
            | 'pending'
            | 'refused'
            | 'accepted'
            | 'send'
            | 'not_sent'
            | 'archive';
        contact_message: string;
        language: string;
        last_update?: string;
    }[];
    other_sms?: {
        contact: string;
        status:
            | 'pending'
            | 'refused'
            | 'accepted'
            | 'send'
            | 'not_sent'
            | 'archive';
        contact_message: string;
        language: string;
        last_update?: string;
    }[];
    admin?: boolean;
    founder?: boolean;
    subuser?: boolean;
    subuser_owner?: string;
    last_online?: string;
    ban?: {
        type: 'soft' | 'strong';
        start_ban?: string;
        end_ban: string;
        motivation: string;
    };
    token?: string;
    special_token?: string;

    constructor() {
        super('user');
    }

    getAttributes(): string[] {
        return User.attributes;
    }

    static me = async (): Promise<User | undefined> => {
        const users = await User.fetch();
        return users[0];
    };

    static fetch = async (): Promise<User[]> => {
        const data: JSONObject[] = await Model.fetch({
            endpoint: `${User.endpoint}/me`,
            params: {
                expand: 1,
            },
        });
        return User.fromArray(data) as User[];
    };

    /* eslint-disable @typescript-eslint/require-await */
    async create(): Promise<void> {
        printError("User can't be created");
    }

    protected usePutForUpdate(): boolean {
        return false;
    }

    async addOtherMail(
        contact: string,
        message: string,
        language = 'en'
    ): Promise<void> {
        if (!this.other_email) {
            this.other_email = [];
        }

        const old = this.other_email.find((e) => e.contact === contact);
        if (
            old?.status === 'accepted' ||
            old?.status === 'send' ||
            old?.status === 'pending' ||
            old?.status === 'refused'
        ) {
            return;
        }

        if (old) {
            old.status = 'send';
            old.contact_message = message;
            old.language = language;
        } else {
            this.other_email.push({
                contact,
                status: 'send',
                contact_message: message,
                language: language,
            });
        }

        await this.update();
    }
}
