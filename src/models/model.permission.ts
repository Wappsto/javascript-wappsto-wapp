import omit from 'lodash.omit';
import { openStream } from '../stream_helpers';
import { printDebug, printError } from '../util/debug';
import { toSafeString } from '../util/helpers';
import { getErrorResponse, printHttpError } from '../util/http_wrapper';
import { JSONObject, StreamData } from '../util/types';
import { Model } from './model';
import { OntologyModel } from './model.ontology';
import { Notification } from './notification';

export class PermissionModel extends OntologyModel {
    static #getPermissionHash(
        type: string,
        quantity: number | 'all',
        message: string
    ): string {
        return `${type}-${quantity}-${message}`;
    }

    async #handleNotification(
        data: StreamData,
        options?: JSONObject
    ): Promise<boolean | undefined> {
        const notifications = Notification.fromArray([data]);

        /* istanbul ignore next */
        if (!notifications || !notifications[0]) {
            return undefined;
        }

        const notification = notifications[0] as Notification;
        switch (notification.base?.code) {
            case 1100013:
                printDebug(
                    `Got permission to create ${this.getType()} under users account`
                );
                try {
                    await this._create({
                        identifier: `request access to save ${this.getType()} under users account`,
                    });
                    return true;
                } catch (e) {
                    /* istanbul ignore next */
                    printError(
                        `Failed to get permission to save ${this.getType()} under users account`
                    );
                    /* istanbul ignore next */
                    printDebug(toSafeString(e));
                }
                break;
            case 1100004:
                if (!notification.base?.ids.includes(this.id())) {
                    printDebug(
                        `Got permission for wrong uuid ${notification.base?.ids[0]}`
                    );
                    return undefined;
                }
                printDebug(
                    `Got permission to retrieve ${this.getType()}/${this.id()} from user`
                );
                try {
                    await this._reload(
                        !!options?.reloadAll,
                        options?.defaultExpand as number
                    );
                    return true;
                } catch (e) {
                    /* istanbul ignore next */
                    printError(
                        `Failed to get permission to retrieve ${this.getType()}/${this.id()} from user`
                    );
                    /* istanbul ignore next */
                    printDebug(toSafeString(e));
                }
                break;
        }

        /* istanbul ignore next */
        return undefined;
    }

    create(): Promise<void> {
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
                        async (data: StreamData) => {
                            const res = await this.#handleNotification(data);
                            if (res) {
                                resolve();
                            }
                            return res;
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

    static #convertFromFetch(endpoint: string, data: Record<string, any>[]) {
        if (data.length === 1 && data[0]?.meta?.type === 'fetch') {
            const arr = endpoint.split('/');
            if (arr.length) {
                const service = arr[arr.length - 1];
                data = data[0].data[service];
            }
        }
        return data;
    }

    static request(options: {
        endpoint: string;
        quantity: number | 'all';
        message: string;
        params?: JSONObject;
        body?: JSONObject;
        readOnly?: boolean;
        create?: boolean;
    }): Promise<JSONObject[]> {
        const { endpoint, quantity, message, params, body, readOnly, create } =
            options;
        Model.validateMethod('PermissionModel', 'request', [
            endpoint,
            quantity,
            message,
            params,
            body,
            readOnly,
            create,
        ]);
        return new Promise<JSONObject[]>(async (resolve) => {
            const newParams = params || {};
            const id = PermissionModel.#getPermissionHash(
                endpoint.split('/')[2],
                quantity,
                message
            );

            Object.assign(newParams, {
                quantity: quantity,
                message: message,
                identifier: id,
                manufacturer: false,
                method:
                    readOnly === true
                        ? ['retrieve']
                        : create === true
                        ? ['create', 'retrieve', 'update']
                        : ['retrieve', 'update'],
            });
            const result = await Model.fetch({
                endpoint,
                params: newParams,
                body: body,
            });

            const data = PermissionModel.#convertFromFetch(endpoint, result);
            if (data.length === 0) {
                printDebug(`Requesting new access to users data: ${message}`);
            } else {
                if (quantity === 'all' || data.length >= quantity) {
                    printDebug(
                        `Found permission notification - returning old result: ${toSafeString(
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

            openStream.subscribeService(
                '/notification',
                async (data: StreamData) => {
                    const notifications = Notification.fromArray([data]);
                    /* istanbul ignore next */
                    if (!notifications || !notifications[0]) {
                        return;
                    }

                    const notification = notifications[0] as Notification;
                    const ids = notification.getIds();
                    if (
                        (notification.base?.code === 1100004 ||
                            notification.base?.code === 1100013) &&
                        //notification[0].base?.identifier === id &&
                        ids.length > 0 &&
                        (quantity === 'all' || ids.length >= quantity)
                    ) {
                        const fetchParams = omit(newParams, [
                            'quantity',
                            'message',
                            'identifier',
                        ]);

                        Object.assign(fetchParams, {
                            id: ids,
                        });

                        printDebug(
                            `Got permission to ${toSafeString(newParams.id)}`
                        );
                        const result = await Model.fetch({
                            endpoint,
                            params: fetchParams,
                            body: body,
                        });
                        const data = PermissionModel.#convertFromFetch(
                            endpoint,
                            result
                        );

                        if (quantity === 'all') {
                            resolve(data);
                        } else {
                            resolve(data.slice(0, quantity));
                        }

                        return true;
                    }

                    return undefined;
                }
            );
        });
    }

    reload(
        reloadAll?: boolean | undefined,
        defaultExpand?: number
    ): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            let res = false;
            try {
                res = await this._reload(reloadAll, defaultExpand);
                resolve(res);
            } catch (error) {
                const data = getErrorResponse(error);

                /* istanbul ignore next */
                if (!data) {
                    printHttpError(
                        'PermissionModel.reload - Missing error data',
                        error
                    );
                    this.meta.id = undefined;
                    resolve(res);
                    return;
                }

                if (data.code === 400006) {
                    printDebug(
                        `Requesting permission to get ${this.getType()}/${this.id()} from the user`
                    );
                    openStream.subscribeService(
                        '/notification',
                        async (data: StreamData) => {
                            const res = await this.#handleNotification(data, {
                                reloadAll,
                                defaultExpand,
                            });
                            if (res) {
                                resolve(true);
                            }
                            return res;
                        }
                    );
                } else {
                    /* istanbul ignore next */
                    printHttpError('Permission.reload - Unhandled code', error);
                    /* istanbul ignore next */
                    this.meta.id = undefined;
                    resolve(res);
                }
            }
        });
    }
}
