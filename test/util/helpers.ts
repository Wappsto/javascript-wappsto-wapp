export function makeResponse(data: any) {
    return { data: data };
}

export function makeErrorResponse(data: any, status?: string, uri?: string) {
    const statusText = status || 'HTTP JEST ERROR';
    const url = uri || 'JEST URL';
    return {
        isAxiosError: true,
        response: { data: data, statusText },
        config: {
            url,
        },
    };
}
