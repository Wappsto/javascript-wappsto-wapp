import { Model } from './model';

interface ICustomData {
    all: boolean;
    future: boolean;
    selected: any[];
}
interface ICustom {
    type: string;
    quantity: number;
    limitation: any[];
    method: any[];
    option: any;
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
    info: any[];
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

    url(): string {
        return Notification.endpoint;
    }

    attributes(): string[] {
        return ['read'];
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

    public static fetch = async () => {
        let data: any[] = await Model.fetch(Notification.endpoint, {
            expand: 1,
            verbose: 'identifier',
        });
        return Notification.fromArray(data);
    };

    public static findByMessage = async (
        message: string
    ): Promise<Notification[]> => {
        let data: any = await Model.fetch(Notification.endpoint, {
            'this_custom.message': message,
            expand: 1,
        });
        return Notification.fromArray(data);
    };

    public static findByCode = async (
        code: number
    ): Promise<Notification[]> => {
        let data: any = await Model.fetch(Notification.endpoint, {
            'this_base.code': code,
            expand: 1,
        });
        return Notification.fromArray(data);
    };

    public static findByIdentifier = async (
        identifier: string
    ): Promise<Notification[]> => {
        console.log(identifier);
        let data: any = await Model.fetch(Notification.endpoint, {
            'this_base.identifier': identifier,
            //'this_base.code': 1100003,
            expand: 1,
        });
        return Notification.fromArray(data);
    };
}
