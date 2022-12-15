import { Model } from './model';
import { OntologyModel } from './model.ontology';
import { Notification } from './notification';
import { printDebug, printError } from '../util/debug';
import { toString } from '../util/helpers';
import { openStream } from '../stream_helpers';
import { printHttpError, getErrorResponse } from '../util/http_wrapper';

export class PermissionModel extends OntologyModel {
    private static getPermissionHash(
        type: string,
        quantity: number | 'all',
        message: string
    ): string {
        return `${type}-${quantity}-${message}`;
    }

    public create(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this._create();
                resolve();
            } catch (error) {
                const data = getErrorResponse(error);

                /* istanbul ignore next */
                if (!data) {
                    printHttpError(
                        'PermissionModel.create - Missing error data',
                        error
                    );
                    reject(error);
                    return;
                }

                if (data.code === 400008 || data.code === 400013) {
                    printDebug(
                        `Requesting permission to add ${this.getType()} to user`
                    );
                    openStream.subscribeService(
                        '/notification',
                        async (event: any) => {
                            if (event.meta_object?.type === 'notification') {
                                const notification = Notification.fromArray([
                                    event.data,
                                ]);
                                /* istanbul ignore next */
                                if (!notification || !notification[0]) {
                                    return;
                                }
                                if (notification[0].base?.code === 1100013) {
                                    try {
                                        printDebug(
                                            `Got permission to create ${this.getType()} under users account`
                                        );
                                        await this._create({
                                            identifier: `request access to save ${this.getType()} under users account`,
                                        });
                                        resolve();
                                        return true;
                                    } catch (e) {
                                        /* istanbul ignore next */
                                        printError(
                                            `Failed to get permission to save ${this.getType()} under users account`
                                        );
                                        /* istanbul ignore next */
                                        printDebug(toString(e));
                                    }
                                }
                            }
                            /* istanbul ignore next */
                            return undefined;
                        }
                    );
                } else {
                    /* istanbul ignore next */
                    printHttpError('Permission.create - Unhandled code', error);
                    /* istanbul ignore next */
                    reject(data);
                }
            }
        });
    }

    private static convertFromFetch(
        endpoint: string,
        data: Record<string, any>[]
    ) {
        if (data.length === 1 && data[0]?.meta?.type === 'fetch') {
            const arr = endpoint.split('/');
            if (arr.length) {
                const service = arr[arr.length - 1];
                data = data[0].data[service];
            }
        }
        return data;
    }

    public static request(
        endpoint: string,
        quantity: number | 'all',
        message: string,
        params?: Record<string, any>,
        body?: Record<string, any>,
        readOnly?: boolean
    ): Promise<Record<string, any>[]> {
        Model.validateMethod('PermissionModel', 'request', [
            endpoint,
            quantity,
            message,
            params,
            body,
        ]);
        return new Promise<Record<string, any>[]>(async (resolve) => {
            const newParams = params || {};
            const id = PermissionModel.getPermissionHash(
                endpoint.split('/')[2],
                quantity,
                message
            );

            Object.assign(newParams, {
                quantity: quantity,
                message: message,
                identifier: id,
                method:
                    readOnly === true ? ['retrieve'] : ['retrieve', 'update'],
            });
            const result = await Model.fetch({
                endpoint,
                params: newParams,
                body: body,
            });

            const data = PermissionModel.convertFromFetch(endpoint, result);
            if (data.length === 0) {
                printDebug(`Requesting new access to users data: ${message}`);
            } else {
                if (quantity === 'all' || data.length >= quantity) {
                    printDebug(
                        `Found permission notification - returning old result: ${toString(
                            data
                        )}`
                    );
                    if (quantity === 'all') {
                        resolve(data);
                    } else {
                        resolve(data.slice(0, quantity));
                    }
                    return;
                }
            }

            printDebug(
                `Waiting for permission to access users data: ${message}`
            );

            openStream.subscribeService('/notification', async (event: any) => {
                if (event.meta_object?.type === 'notification') {
                    const notification = Notification.fromArray([event.data]);
                    /* istanbul ignore next */
                    if (!notification || !notification[0]) {
                        return;
                    }

                    const ids = notification[0].getIds();
                    if (
                        (notification[0].base?.code === 1100004 ||
                            notification[0].base?.code === 1100013) &&
                        //notification[0].base?.identifier === id &&
                        ids.length > 0 &&
                        (quantity === 'all' || ids.length >= quantity)
                    ) {
                        if (quantity === 'all') {
                            Object.assign(newParams, {
                                id: ids,
                            });
                        } else {
                            Object.assign(newParams, {
                                id: ids.reverse().slice(0, quantity),
                            });
                        }
                        printDebug(
                            `Got permission to ${toString(newParams.id)}`
                        );
                        const result = await Model.fetch({
                            endpoint,
                            params: newParams,
                            body: body,
                        });
                        const data = PermissionModel.convertFromFetch(
                            endpoint,
                            result
                        );
                        resolve(data);
                        return true;
                    }
                }
                return undefined;
            });
        });
    }
}
