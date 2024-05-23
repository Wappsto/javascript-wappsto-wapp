import { EventLogLevel, IEventLog, JSONObject } from '../util/types';
import { Model } from './model';

export class EventLog extends Model implements IEventLog {
    static endpoint = '/2.1/eventlog';
    static attributes = ['message', 'level', 'info', 'type'];
    message = '';
    level: EventLogLevel = 'info';
    info?: JSONObject;
    type?: string;
    timestamp?: Date;

    constructor() {
        super('eventlog');
    }

    getAttributes(): string[] {
        return EventLog.attributes;
    }
}
