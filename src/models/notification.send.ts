import { PermissionModel } from './model.permission';
import { INotificationCustom } from '../util/interfaces';

export async function notify(message: any): Promise<void> {
    const noti = new SendNotification();
    noti.custom = message;
    await noti.create();
}

export class SendNotification extends PermissionModel {
    static endpoint = '/2.1/notification';
    custom?: INotificationCustom;

    constructor() {
        super('notification', '2.1');
    }

    attributes(): string[] {
        return ['custom'];
    }
}
