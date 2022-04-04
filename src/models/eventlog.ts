import { Model } from './model';
import { IEventLog, EventLogLevel } from '../util/interfaces';

export class EventLog extends Model implements IEventLog {
    static endpoint = '/2.0/eventlog';
    message = '';
    level: EventLogLevel = 'info';
    info?: Record<string, any>;
    type?: string;
    timestamp?: Date;

    constructor() {
        super('eventlog');
    }

    attributes(): string[] {
        return ['message', 'level', 'info', 'type'];
    }
}
