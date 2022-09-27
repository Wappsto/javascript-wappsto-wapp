import { PermissionModel } from './model.permission';
import { Model } from '../models/model';
import { EventLogLevel } from '../util/interfaces';

export async function notify(
    message: string,
    level?: EventLogLevel,
    data?: any
): Promise<void> {
    Model.validateMethod('notification', 'notify', arguments);
    const noti = new SendNotification(message, level, data);
    await noti.create();
}

export class SendNotification extends PermissionModel {
    static endpoint = '/2.1/notification';
    custom: any = { message: '', level: '', data: undefined };

    constructor(message: string, level?: EventLogLevel, data?: any) {
        super('notification', '2.1');
        this.custom.message = message;
        this.custom.level = level || 'info';
        this.custom.data = data;
    }

    attributes(): string[] {
        return ['custom'];
    }
}
