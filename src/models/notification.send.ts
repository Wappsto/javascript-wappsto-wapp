import { Model } from '../models/model';
import wappsto, { printHttpError } from '../util/http_wrapper';
import { EventLogLevel, JSONObject, Mail } from '../util/interfaces';
import { PermissionModel } from './model.permission';

/**
 * Sends an email using the provided parameters.
 *
 * @param params - The parameters for sending the email.
 * @return A promise that resolves to true if the email was sent successfully, and false otherwise.
 */
export async function sendMail(params: Mail): Promise<boolean> {
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

/**
 * Sends an SMS message.
 *
 * @param message - The content of the SMS message.
 * @return A promise that resolves to true if the SMS was sent successfully, and false otherwise.
 */
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

/**
 * Notifies the user with a message at a specified log level and optional data.
 *
 * @param message - The message to be displayed to the user.
 * @param level - The log level of the message (optional).
 * @param data - Additional data to be included with the message (optional).
 * @return A promise that resolves when the notification is created.
 */
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
