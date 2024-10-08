import wappsto, { printHttpError } from '../util/http_wrapper';
import { JSONObject } from '../util/types';
import { Model } from './model';
import { TagsModel } from './model.tags';

export interface IRestriction {
    retrieve: boolean;
    update: boolean;
    delete: boolean;
    create: boolean;
}

export class SharingModel extends TagsModel {
    shareWith = async (
        user: string,
        restriction: IRestriction = {
            retrieve: true,
            update: true,
            delete: false,
            create: false,
        }
    ) => {
        try {
            const response = await wappsto.patch(
                `/2.1/acl/${this.id()}`,
                {
                    permission: [
                        {
                            meta: { id: user },
                            restriction: [
                                {
                                    method: restriction as unknown as JSONObject,
                                },
                            ],
                        },
                    ],
                },
                Model.generateOptions({ propagate: true })
            );
            return response.data;
        } catch (e) {
            printHttpError('Failed to share model', e);
        }
    };

    unshareWith = async (user: string) => {
        try {
            const response = await wappsto.delete(
                `/2.1/acl/${this.id()}/permission/${user}`,
                Model.generateOptions({})
            );
            return response.data;
        } catch (e) {
            printHttpError('Failed to unshare model', e);
        }
    };

    getSharedWith = async () => {
        try {
            const response = await wappsto.get(
                `/2.1/acl/${this.id()}`,
                Model.generateOptions({})
            );
            return response.data.permission;
        } catch (e) {
            printHttpError('Failed to get model sharing', e);
        }
    };
}
