import { Network } from '../models/network';
import { Filter } from './types';

export function generateFilterRequest(
    getFilterResult: (filter: Filter, omit_filter: Filter) => string,
    filter: Filter,
    omit_filter: Filter
) {
    const request = Network.getFilter(filter, omit_filter);
    const result = getFilterResult(filter, omit_filter);

    return { filter: { attribute: request }, return: `{${result}}` };
}
