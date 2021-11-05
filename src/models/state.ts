import { IMeta } from './meta';
import { Model } from './model';

export class State extends Model {
    meta: IMeta = {};
    data?: string;
    status?: string;
    type?: string;
    timestamp?: string;

    constructor() {
        super('2.0/state');
    }
}
