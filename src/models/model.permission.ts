import { Model } from './model';
import { Notification } from './notification';
import { printDebug } from '../util/debug';
import { openStream } from './stream';
import { printHttpError, getErrorResponse } from '../util/http_wrapper';

export class PermissionModel extends Model {
    private static getPermissionHash(
        type: string,
        quantity: number,
        message: string
    ): string {
        return `${type}-${quantity}-${message}`;
    }

    public create = async (): Promise<void> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this._create();
                resolve();
            } catch (error) {
                let data = getErrorResponse(error);

                if (!data) {
                    printHttpError(error);
                    reject(error);
                    return;
                }

                if (data.code === 400008 || data.code === 400013) {
                    printDebug('Requesting permission to add data to user');
                    openStream.subscribeService(
                        '/notification',
                        async (event) => {
                            if (event.meta_object?.type === 'notification') {
                                let notification = Notification.fromArray([
                                    event.data,
                                ]);
                                if (!notification || !notification[0]) {
                                    return;
                                }
                                if (notification[0]?.base?.code === 1100013) {
                                    try {
                                        printDebug(
                                            'Got permission to create data under users account'
                                        );
                                        await this._create({
                                            identifier:
                                                'request access to save data under users account',
                                        });
                                        resolve();
                                        return true;
                                    } catch (e) {
                                        printDebug(
                                            'Failed to get permission to save data under users account'
                                        );
                                    }
                                }
                            }
                            return undefined;
                        }
                    );
                } else {
                    printHttpError(error);
                    reject(data);
                }
            }
        });
    };

    public static request = async (
        endpoint: string,
        quantity: number,
        message: string,
        params?: Record<string, any>
    ): Promise<Record<string, any>[]> => {
        return new Promise<Record<string, any>[]>(async (resolve) => {
            let id = PermissionModel.getPermissionHash(
                endpoint.split('/')[2],
                quantity,
                message
            );

            Object.assign(params, {
                quantity: quantity,
                message: message,
                identifier: id,
                method: ['retrieve', 'update'],
            });
            let result = await Model.fetch(endpoint, params);

            if (result.length === 0) {
                printDebug(`Requesting new access to users data: ${message}`);
            } else {
                printDebug(
                    `Found permission notification - returning old result`
                );
                resolve(result);
            }

            printDebug(
                `Waiting for permission to access users data: ${message}`
            );

            openStream.subscribeService('/notification', async (event) => {
                if (event.meta_object?.type === 'notification') {
                    let notification = Notification.fromArray([event.data]);
                    if (!notification || !notification[0]) {
                        return;
                    }

                    let ids = notification[0].getIds();
                    if (
                        (notification[0].base?.code === 1100004 ||
                            notification[0].base?.code === 1100013) &&
                        //notification[0].base?.identifier === id &&
                        ids.length >= quantity
                    ) {
                        Object.assign(params, {
                            id: ids.reverse().slice(0, quantity),
                        });
                        printDebug(
                            `Got permission to ${JSON.stringify(params?.id)}`
                        );
                        let result = await Model.fetch(endpoint, params);
                        resolve(result);
                        return true;
                    }
                }
                return undefined;
            });
        });
    };
}
