import wappsto from '../util/http_wrapper';

const url = 'https://tracer.iot.seluxit.com/trace';

export function trace(parent: string, status: string): string {
    let id = '';
    if (typeof process !== 'object') {
        id += 'FG_';
    } else {
        id += 'BG_';
    }
    id += `WAPP_${Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')}`;

    let response = wappsto.get(url, {
        params: {
            parent: parent,
            id: id,
            status: status,
        },
    });
    console.log(response);
    return id;
}
