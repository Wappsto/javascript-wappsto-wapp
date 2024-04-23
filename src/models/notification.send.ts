import { Model } from '../models/model';
import wappsto, { printHttpError } from '../util/http_wrapper';
import { EventLogLevel, IMail, JSONObject } from '../util/interfaces';
import { PermissionModel } from './model.permission';

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
    data?: JSONObject
): Promise<void> {
    Model.validateMethod('notification', 'notify', arguments);
    const newNotification = new SendNotification(message, level, data);
    return newNotification.create();
}

export class SendNotification extends PermissionModel {
    static endpoint = '/2.1/notification';
    static attributes = ['custom'];
    custom: { message: string; level: string; data?: JSONObject } = {
        message: '',
        level: '',
        data: undefined,
    };

    constructor(message: string, level?: EventLogLevel, data?: JSONObject) {
        super('notification');
        this.custom.message = message;
        this.custom.level = level || 'info';
        this.custom.data = data;
    }

    getAttributes(): string[] {
        return SendNotification.attributes;
    }
}
