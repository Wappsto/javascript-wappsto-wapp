import { Value } from '../models';
import { LogRequest, LogValues } from '../util/types';

export async function generateHistory(
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

    logRequest.all = true;
    delete logRequest.offset;
    delete logRequest.number;
    delete logRequest.order;
    delete logRequest.order_by;

    const res = await input.getReportLog(logRequest);
    const reportData: LogValues = [];
    res.data.forEach((val) => {
        const data = convertValue ? convertValue(val.data) : val.data;
        reportData.push({
            data: data,
            timestamp: val.timestamp,
        });
    });
    await output.report(reportData);
}
