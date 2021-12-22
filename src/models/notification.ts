import { Model } from './model';

interface ICustomData {
    all: boolean;
    future: boolean;
    selected: Record<string, any>[];
}

interface ICustom {
    type: string;
    quantity: number;
    limitation: Record<string, any>[];
    method: Record<string, any>[];
    option: Record<string, any>;
    message: string;
    name_installation: string;
    title_installation: string | null;
    data?: ICustomData;
}

interface IBase {
    action: string;
    code: number;
    type: string;
    from: string;
    to: string;
    from_type: string;
    from_name: string;
    to_type: string;
    type_ids: string;
    priority: number;
    ids: string[];
    info: Record<string, any>[];
    identifier: string;
}

export class Notification extends Model {
    static endpoint = '/2.1/notification';
    read?: string;
    custom?: ICustom;
    base?: IBase;
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
