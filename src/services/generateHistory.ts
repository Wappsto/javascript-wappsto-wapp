import { Value } from '../models';
import { LogRequest, LogValues, ILogResponse } from '../util/types';

export async function generateHistory(
    input: Value | ILogResponse,
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

    let logData: ILogResponse;
    if (input instanceof Value) {
        logData = await input.getReportLog(logRequest);
    } else {
        logData = input;
    }

    const reportData: LogValues = [];
    logData.data.forEach((val) => {
        const data = convertValue ? convertValue(val.data) : val.data;
        reportData.push({
            data: data,
            timestamp: val.timestamp,
        });
    });
    await output.report(reportData);

    return logData;
}
