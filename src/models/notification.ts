import { Model } from './model';
import { INotificationBase, INotificationCustom } from '../util/interfaces';

export class Notification extends Model {
    static endpoint = '/2.1/notification';
    read?: string;
    custom?: INotificationCustom;
    base?: INotificationBase;
    times?: number;
    timestamp?: string;
    identifier?: string;

    constructor() {
        super('notification', '2.1');
    }

    public getIds(): string[] {
        let ids: string[] = [];
        if (this.base?.ids) {
            ids = this.base.ids;
        }
        if (ids.length === 0) {
            if (this.custom?.data?.selected) {
                ids = this.custom.data.selected.map((m) => m.meta.id);
            }
        }
        return ids;
    }
}
