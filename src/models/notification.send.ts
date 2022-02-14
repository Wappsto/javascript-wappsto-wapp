import { PermissionModel } from './model.permission';
import { Model } from '../models/model';

export async function notify(message: string): Promise<void> {
    Model.validateMethod('notification', 'notify', arguments);
    const noti = new SendNotification(message);
    await noti.create();
}

export class SendNotification extends PermissionModel {
    static endpoint = '/2.1/notification';
    custom: any = { message: '' };

    constructor(message: string) {
        super('notification', '2.1');
        this.custom.message = message;
    }

    attributes(): string[] {
        return ['custom'];
    }
}
