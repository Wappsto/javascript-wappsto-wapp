import { Value } from '../models/value';
import { getNextPeriod, getNextTimestamp } from '../util/helpers';
import { LogRequest, LogValues } from '../util/types';

export function unifyData(
    input: Value,
    output: Value,
    logRequest: LogRequest,
    convertValue?: (value: string | number) => string
) {
    if (!logRequest.group_by) {
        logRequest.group_by = 'hour';
    }

    if (!logRequest.operation) {
        logRequest.operation = 'avg';
    }

    logRequest.limit = 100;
    delete logRequest.all;
    delete logRequest.end;
    delete logRequest.offset;
    delete logRequest.number;
    delete logRequest.order;
    delete logRequest.order_by;

    input.onReport(async (_val, _data, timestamp) => {
        /* istanbul ignore next */
        const outputTimestamp = new Date(output.getReportTimestamp() ?? '');
        const inputTimestamp = new Date(timestamp);
        const nextTimestamp = getNextPeriod(
            outputTimestamp,
            /* istanbul ignore next */
            logRequest.group_by ?? 'hour'
        );

        if (inputTimestamp >= nextTimestamp) {
            logRequest.start = getNextTimestamp(outputTimestamp);

            const res = await input.getReportLog(logRequest);
            const reportData: LogValues = [];
            res.data.forEach((val) => {
                const data = convertValue ? convertValue(val.data) : val.data;
                if (typeof data === 'string' || typeof data === 'number') {
                    reportData.push({
                        data: data,
                        timestamp: val.timestamp,
                    });
                }
            });
            output.report(reportData);
        }
    });
}
