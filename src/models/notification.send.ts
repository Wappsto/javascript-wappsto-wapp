import wappsto from '../util/http_wrapper';
import { PermissionModel } from './model.permission';
import { Model } from '../models/model';
import { EventLogLevel, IMail } from '../util/interfaces';
import { printHttpError } from '../util/http_wrapper';

export async function sendMail(params: IMail): Promise<boolean> {
    Model.validateMethod('notification', 'sendMail', arguments);

    const query = {
        html: params.body,
        subject: params.subject,
        from: params.from,
    };

    try {
        await wappsto.post('/2.1/email_send', query);
        return true;
    } catch (e) {
        printHttpError('sendMail', e);
    }
    return false;
}

export async function sendSMS(message: string): Promise<boolean> {
    Model.validateMethod('notification', 'sendSMS', arguments);

    try {
        await wappsto.post('/2.1/sms_send', { content: message });
        return true;
    } catch (e) {
        printHttpError('sendSMS', e);
    }
    return false;
}

export function notify(
    message: string,
    level?: EventLogLevel,
    data?: any
): Promise<void> {
    Model.validateMethod('notification', 'notify', arguments);
    const noti = new SendNotification(message, level, data);
    return noti.create();
}

export class SendNotification extends PermissionModel {
    static endpoint = '/2.1/notification';
    static attributes = ['custom'];
    custom: any = { message: '', level: '', data: undefined };

    constructor(message: string, level?: EventLogLevel, data?: any) {
        super('notification');
        this.custom.message = message;
        this.custom.level = level || 'info';
        this.custom.data = data;
    }

    getAttributes(): string[] {
        return SendNotification.attributes;
    }
}
