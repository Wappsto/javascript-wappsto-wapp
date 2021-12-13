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
                                        printDebug('Got permission to create data under users account');
                                        await this._create({
                                            identifier: 'request access to save data under users account',
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
        params?: any
    ): Promise<any[]> => {
        return new Promise<any[]>(async (resolve) => {
            let id = PermissionModel.getPermissionHash(
                endpoint.split('/')[2],
                quantity,
                message
            );
            let notifications = await Notification.findByIdentifier(id);
            if (notifications.length === 0) {
                Object.assign(params, {
                    quantity: quantity,
                    message: message,
                    identifier: id,
                });
                Model.fetch(endpoint, params);
                printDebug(`Requesting new access to users data: ${message}`);
            } else {
                for (let i = 0; i < notifications.length; i++) {
                    let n = notifications[i];
                    let ids = n?.getIds();
                    if (n?.base?.identifier === id && ids.length >= quantity) {
                        printDebug(
                            `Found permission notification - returning old result: ${JSON.stringify(
                                ids
                            )}`
                        );
                        Object.assign(params, {
                            id: ids.reverse().slice(0, quantity),
                        });
                        let result = await Model.fetch(endpoint, params);
                        resolve(result);
                    }
                }
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
                        notification[0].base?.code === 1100004 &&
                        //notification[0].base?.identifier === id &&
                        ids.length >= quantity
                    ) {
                        Object.assign(params, {
                            id: ids.reverse().slice(0, quantity),
                        });
                        printDebug(`Got permission to ${JSON.stringify(params.id)}`);
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
