//import wappsto from '../util/http_wrapper';
import { Model } from './model';
import { Notification } from './notification';
import { printDebug } from '../util/debug';
import StreamHandler from '../stream_handler';

export class PermissionModel extends Model {
    private static getPermissionHash(
        type: string,
        quantity: number,
        message: string
    ): string {
        return `${type}-${quantity}-${message}`;
    }

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
            console.log('Found notifications');
            console.log(notifications);
            //notifications = await Notification.findByMessage(message);
            //console.log(notifications);
            if (notifications.length === 0) {
                Object.assign(params, {
                    quantity: quantity,
                    message: message,
                    identifier: id,
                    //trace: true,
                });
                let response = await Model.fetch(endpoint, params);
                printDebug(`Requesting new access to users data: ${message}`);
                console.log(response);
            } else {
                for (let i = 0; i < notifications.length; i++) {
                    let n = notifications[i];
                    console.log(n?.custom);
                    console.log(n?.custom?.limitation);
                    console.log(n?.custom?.data);
                    console.log(n?.base);

                    let ids = n?.getIds();
                    console.log('ids');
                    console.log(ids);
                    if (ids.length >= quantity) {
                        printDebug(
                            'Found permission notification - returning old result'
                        );
                        Object.assign(params, {
                            id: ids.slice(0, quantity),
                        });
                        console.log(params);
                        let result = await Model.fetch(endpoint, params);
                        resolve(result);
                        return;
                    }
                }
            }

            printDebug(
                `Waiting for permission to access users data: ${message}`
            );
            StreamHandler.subscribeService('/notification', async (event) => {
                console.log('Permission notification');
                console.log(event);
                if (event.meta_object?.type === 'notification') {
                    let notification = Notification.fromArray([event.data]);
                    console.log(notification);
                    if (!notification || !notification[0]) {
                        return;
                    }
                    let ids = notification[0].getIds();
                    if (ids.length >= quantity) {
                        Object.assign(params, {
                            id: ids.slice(0, quantity),
                        });
                        let result = await Model.fetch(endpoint, params);
                        resolve(result);
                    }
                }
            });
        });
    };
}
