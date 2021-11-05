import { IMeta } from './meta';
import { Value } from './value';

export class Device {
    meta: IMeta = {};
    name?: string;
    product?: string;
    serial?: string;
    description?: string;
    protocol?: string;
    communication?: string;
    version?: string;
    manufacturer?: string;
    value: Value[] = [];
}
