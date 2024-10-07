import {
    ISubUser,
    OtherContact,
    PointManagement,
    ValidateParams,
} from '../util/types';
import { Model } from './model';
import { OntologyModel } from './model.ontology';
import wappsto from '../util/http_wrapper';
import { findModel } from '../util/modelStore';

export class SubUser extends OntologyModel implements ISubUser {
    static endpoint = '/2.1/subuser';
    static attributes = [
        'login_username',
        'login_password',
        'session_token',
        'first_name',
        'last_name',
        'email',
        'phone',
        'role',
        'organization',
        'address',
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
    role?: string;
    organization?: string;
    address?: string;
    nickname?: string;
    language?: string;
    last_online?: string;
    point_management?: PointManagement;
    verified_email?: boolean;
    verified_sms?: boolean;
    other_email?: OtherContact[];
    other_sms?: OtherContact[];

    constructor(username?: string, password?: string) {
        super('subuser');
        this.login_username = username;
        this.login_password = password;
    }

    getAttributes(): string[] {
        return SubUser.attributes;
    }

    protected usePutForUpdate(): boolean {
        return false;
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

    static fetchById = async (id: string) => {
        SubUser.#validate('fetchById', [id]);
        const model = findModel('subuser', id);
        if (model) {
            return model as SubUser;
        }

        const data = await Model.fetch({
            endpoint: `${SubUser.endpoint}/${id}`,
        });
        const res = SubUser.fromArray(data);
        if (res[0]) {
            return res[0] as SubUser;
        }
        return undefined;
    };

    makeIndependent = async (newUsername: string) => {
        this.validate('makeIndependent', [newUsername]);

        try {
            const response = await wappsto.patch(
                '/2.1/register',
                { subuser: { id: this.id(), new_username: newUsername } },
                { params: { request: 'convert_subuser_to_user' } }
            );

            if (response.status === 200) {
                return true;
            }
        } catch (error) {
            return false;
        }
        return false;
    };
}
