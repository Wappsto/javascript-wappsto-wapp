import { NotificationBase, NotificationCustom } from '../util/types';
import { Model } from './model';

export class Notification extends Model {
    static endpoint = '/2.1/notification';
    read?: string;
    base?: NotificationBase;
    custom?: NotificationCustom;
    times?: number;
    timestamp?: string;
    identifier?: string;

    constructor() {
        super('notification');
    }

    getIds(): string[] {
        let ids: string[] = [];
        if (this.base?.ids) {
            ids = this.base.ids;
        }
        if (ids.length === 0) {
            if (this.custom?.data?.selected) {
                ids = this.custom.data.selected.map(
                    (m) => m.meta?.id
                ) as string[];
            }
        }
        return ids;
    }
}
