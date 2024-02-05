export function makeResponse(data: any, status?: number, statusText?: string) {
    const numStatus = status || 200;
    const strStatusText = statusText || (numStatus === 200 ? 'OK' : 'ERROR');
    return {
        data: data,
        status: numStatus,
        statusText: strStatusText,
        headers: {},
        config: {},
        request: {},
    };
}

export function makeErrorResponse(data: any, status?: string, uri?: string) {
    const statusText = status || 'HTTP JEST ERROR';
    const url = uri || 'JEST URL';
    return {
        isAxiosError: true,
        response: makeResponse(data, 500, statusText),
        config: {
            url,
        },
    };
}
