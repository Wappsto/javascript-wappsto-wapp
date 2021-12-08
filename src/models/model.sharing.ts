import wappsto from '../util/http_wrapper';
import { Model } from './model';
import { printHttpError } from '../util/http_wrapper';

interface IRestriction {
    retrieve: boolean;
    update: boolean;
    delete: boolean;
    create: boolean;
}

export class SharingModel extends Model {
    __shareWith = async (
        user: string,
        restriction: IRestriction = {
            retrieve: true,
            update: true,
            delete: false,
            create: false,
        }
    ) => {
        try {
            let response = await wappsto.patch(
                `/acl/${this.meta.id}`,
                {
                    permission: [
                        {
                            meta: { id: user },
                            restriction: [
                                {
                                    method: {
                                        retrieve: restriction.retrieve,
                                        update: restriction.update,
                                        delete: restriction.delete,
                                        create: restriction.create,
                                    },
                                },
                            ],
                        },
                    ],
                },
                Model.generateOptions({})
            );
            return response.data;
        } catch (e) {
            printHttpError(e);
        }
    };
}
