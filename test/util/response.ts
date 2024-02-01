import * as fs from 'fs';
import * as path from 'path';

const directoryPath = path.join(__dirname, 'json');
const data: Record<string, any> = {};

fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    files.forEach(function (file) {
        const jsonString = fs.readFileSync(
            path.join(directoryPath, file),
            'utf8'
        );
        try {
            data[file.split('.')[0]] = JSON.parse(jsonString);
        } catch (e) {
            console.log('Loading test json', e);
        }
    });
});

export { data as responses };

const simpleNetworkResponse = {
    meta: {
        type: 'network',
        version: '2.1',
        id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
    },
    name: 'test',
};

const fullNetworkResponse = {
    meta: {
        type: 'network',
        version: '2.1',
        id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
        connection: {
            online: true,
            timestamp: '',
        },
    },
    name: 'Network Name',
    device: [
        {
            meta: {
                id: 'e65ec3eb-04f1-4253-bd1b-b989b1204b81',
                version: '2.1',
                type: 'device',
            },
            name: 'Device Name',
            product: 'Device Product',
            value: [
                {
                    meta: {
                        id: 'c5a73d64-b398-434e-a236-df15342339d5',
                        version: '2.1',
                        type: 'value',
                    },
                    name: 'Value Name',
                    permission: 'w',
                    type: 'temperature',
                    number: { min: 0, max: 100, step: 1, unit: 'c' },
                    eventlog: [
                        {
                            meta: {
                                type: 'eventlog',
                                version: '2.1',
                                id: '8e24c08f-2a99-4cae-9992-2da76326de8c',
                            },
                            message: 'test',
                            level: 'error',
                        },
                    ],
                    state: [
                        {
                            meta: {
                                id: 'd58e1d50-0182-4a39-bd03-129f5d316c20',
                                version: '2.1',
                                type: 'state',
                            },
                            type: 'Control',
                            timestamp: '',
                            data: '1',
                        },
                    ],
                },
            ],
        },
    ],
};

const fullNetworkResponseUpdated = {
    meta: {
        type: 'network',
        version: '2.1',
        id: 'b62e285a-5188-4304-85a0-3982dcb575bc',
        connection: {
            online: true,
            timestamp: '',
        },
    },
    name: 'Network Name',
    device: [
        {
            meta: {
                id: '0922117e-0c06-4318-ae9b-004f389d468b',
                version: '2.1',
                type: 'device',
            },
            name: 'Device Name 1',
            product: 'Device Product',
            value: [
                {
                    meta: {
                        id: '5ba24807-c1b2-4ce8-93ca-a7cee06bd8bc',
                        version: '2.1',
                        type: 'value',
                    },
                    name: 'Value Name',
                    permission: 'w',
                    type: 'temperature',
                    number: { min: 0, max: 100, step: 1, unit: 'c' },
                    eventlog: [
                        {
                            meta: {
                                type: 'eventlog',
                                version: '2.1',
                                id: 'f7b1063e-ef9a-418b-bda0-85074c37e86a',
                            },
                            message: 'test',
                            level: 'error',
                        },
                    ],
                    state: [
                        {
                            meta: {
                                id: '3a94a26b-a3ea-4ed9-b00d-d9ba87f26d43',
                                version: '2.1',
                                type: 'state',
                            },
                            type: 'Control',
                            timestamp: '',
                            data: '1',
                        },
                    ],
                },
                {
                    meta: {
                        id: '18ad6c7c-df91-4e3d-8fbb-5841163a5739',
                        version: '2.1',
                        type: 'value',
                    },
                    name: 'Value Name 2',
                    permission: 'w',
                    type: 'temperature',
                    number: { min: 0, max: 100, step: 1, unit: 'c' },
                    state: [
                        {
                            meta: {
                                id: 'f11a485e-22ca-48f6-9797-3de7c6192355',
                                version: '2.1',
                                type: 'state',
                            },
                            type: 'Control',
                            timestamp: '',
                            data: '1',
                        },
                    ],
                },
                {
                    meta: {
                        id: 'fb9a354c-605e-40fb-b5bd-4047d9298790',
                        version: '2.1',
                        type: 'value',
                    },
                    name: 'Value Name 2',
                    permission: 'w',
                    type: 'temperature',
                    number: { min: 0, max: 100, step: 1, unit: 'c' },
                    state: [
                        {
                            meta: {
                                id: 'd8c394ee-379a-4532-97e7-ae56036e7214',
                                version: '2.1',
                                type: 'state',
                            },
                            type: 'Control',
                            timestamp: '',
                            data: '1',
                        },
                    ],
                },
            ],
        },
        {
            meta: {
                id: 'b30f8960-a8bf-46c8-b0c8-d0a7659fd1c1',
                version: '2.1',
                type: 'device',
            },
            name: 'Device Name 2',
            product: 'Device Product',
            value: [
                {
                    meta: {
                        id: 'ac5fda4c-3129-4b8d-9f24-b2359dec67bd',
                        version: '2.1',
                        type: 'value',
                    },
                    name: 'Value Name',
                    permission: 'w',
                    type: 'temperature',
                    number: { min: 0, max: 100, step: 1, unit: 'c' },
                    eventlog: [
                        {
                            meta: {
                                type: 'eventlog',
                                version: '2.1',
                                id: '887f1389-fbcb-40dc-962e-902727775d88',
                            },
                            message: 'test',
                            level: 'error',
                        },
                    ],
                    state: [
                        {
                            meta: {
                                id: '5d88403f-ed86-49da-88ed-83fd04e1c874',
                                version: '2.1',
                                type: 'state',
                            },
                            type: 'Control',
                            timestamp: '',
                            data: '1',
                        },
                    ],
                },
            ],
        },
    ],
};

const signalRequest = (type: string) => {
    return {
        meta: {
            id: '92ddd1d3-9885-4d98-8574-6f2eefa8fc32',
            type: 'eventstream',
            version: '2.1',
        },
        event: 'extsync',
        meta_object: {
            type: 'extsync',
            version: '2.1',
            id: '92ddd1d3-9885-4d98-8574-6f2eefa8fc32',
            owner: '5ee72329-3ca4-4670-a927-c14c3488d0f7',
        },
        data: {
            meta: {
                type: 'extsync',
                version: '2.1',
                id: '92ddd1d3-9885-4d98-8574-6f2eefa8fc32',
                owner: '5ee72329-3ca4-4670-a927-c14c3488d0f7',
            },
            request: false,
            method: 'POST',
            uri: 'extsync/',
            headers: {
                CONTENT_LENGTH: '40',
                CONTENT_TYPE: 'application/json',
                HTTP_VERSION: 'HTTP/1.1',
                HTTP_HOST: 'wappsto.com',
                HTTP_X_REQUEST_ID: '26e954bb60db323b4b1bcbc7e6fd405a',
                HTTP_X_REAL_IP: '217.198.212.74',
                HTTP_X_FORWARDED_FOR: '217.198.212.74',
                HTTP_X_FORWARDED_HOST: 'wappsto.com',
                HTTP_X_FORWARDED_PORT: '443',
                HTTP_X_FORWARDED_PROTO: 'https',
                HTTP_X_FORWARDED_SCHEME: 'https',
                HTTP_X_ORIGINAL_URI: '/services/2.1/extsync',
                HTTP_X_SCHEME: 'https',
                HTTP_COOKIE:
                    'sessionID=209054f5-8a26-46e5-86ea-386ae9feabd0; sessionID=8e5e0e07-c708-4574-a507-ea2ba2f14064; sessionID=82b99db5-c086-44e3-9fde-cbe3373b15a5; CookieConsent=true; i18next=en; LEGACYSESSID=32a2hto085jqfq929imuak20a9; PHPSESSID=1719g25am6t8ib4gpr63q190rc; XSRF-TOKEN=1EBQYUoLU_sSuTTgTgD3stCwlMFYhl-ZFuKpzhuzNrs; sessionID=8e5e0e07-c708-4574-a507-ea2ba2f14064; io=C8ySNEZnFVjSAF2fAAD2',
                HTTP_ACCEPT_LANGUAGE: 'en-US,en;q=0.9,da;q=0.8,nb;q=0.7',
                HTTP_ACCEPT_ENCODING: 'gzip, deflate, br',
                HTTP_REFERER: 'http://localhost:3000/?name=Developers+t',
                HTTP_SEC_FETCH_DEST: 'empty',
                HTTP_SEC_FETCH_MODE: 'cors',
                HTTP_SEC_FETCH_SITE: 'same-origin',
                HTTP_ORIGIN: 'http://localhost:3000',
                HTTP_SEC_CH_UA_PLATFORM: '"Linux"',
                HTTP_ACCEPT: 'application/json, text/plain, */*',
                HTTP_USER_AGENT:
                    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
                HTTP_SEC_CH_UA_MOBILE: '?0',
                HTTP_X_XSRF_TOKEN:
                    '1EBQYUoLU_sSuTTgTgD3stCwlMFYhl-ZFuKpzhuzNrs',
                HTTP_DNT: '1',
                HTTP_SEC_CH_UA:
                    '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
                HTTP_CACHE_CONTROL: 'no-cache',
                HTTP_PRAGMA: 'no-cache',
            },
            body: `{"type":"${type}","message":{"signal":"${type}"}}`,
        },
        path: '/extsync/direct',
        timestamp: '2022-11-16T08:53:15.156826Z',
    };
};

const energyDataResponse = {
    status: 'completed',
    operation: 'energy_data',
    version: '1.0',
    parameter: { start: '2022-01-01T01:01:01Z', end: '2023-01-01T01:01:01Z' },
    access: { state_id: ['ad2a9baf-b578-4977-bf91-debe1f201e16'] },
    result: [
        {
            id: 'ad2a9baf-b578-4977-bf91-debe1f201e16',
            data: [
                { data: 1, timestamp: '2022-01-01T03:00:00.000000Z' },
                { data: 1, timestamp: '2022-01-01T04:00:00.000000Z' },
                { data: 1, timestamp: '2022-01-01T05:00:00.000000Z' },
                { data: 1, timestamp: '2022-01-01T06:00:00.000000Z' },
                { data: 1, timestamp: '2022-01-01T07:00:00.000000Z' },
                { data: 1, timestamp: '2022-01-01T08:00:00.000000Z' },
                { data: 1, timestamp: '2022-01-01T09:00:00.000000Z' },
                { data: 0, timestamp: '2022-12-15T16:00:00.000000Z' },
                { data: 0, timestamp: '2022-12-15T17:00:00.000000Z' },
            ],
        },
    ],
    meta: {
        type: 'analytics',
        version: '2.1',
        id: 'a22c77d2-ef3b-4294-8898-ad05b54c81ce',
    },
};

const emptyEnergyDataResponse = {
    status: 'completed',
    operation: 'energy_data',
    version: '1.0',
    parameter: { start: '2022-01-01T01:01:01Z', end: '2023-01-01T01:01:01Z' },
    access: { state_id: ['ad2a9baf-b578-4977-bf91-debe1f201e16'] },
    result: [],
    meta: {
        type: 'analytics',
        version: '2.1',
        id: 'a22c77d2-ef3b-4294-8898-ad05b54c81ce',
    },
};

const energySummaryResponse = {
    status: 'cached',
    operation: 'energy_summary',
    version: '1.0',
    parameter: { start: '2022-01-01T01:01:01Z', end: '2023-01-01T01:01:02Z' },
    access: { state_id: ['c3c65131-0b02-41cb-b18d-ef78674569aa'] },
    result: [
        {
            id: 'c3c65131-0b02-41cb-b18d-ef78674569aa',
            total_energy: 7,
            min_power: 0,
            max_power: 1,
            mean_power: 0.7778,
            median_power: 1,
            sd_power: 0.441,
        },
    ],
    meta: {
        id: 'a0381ccd-882e-4482-8b5b-38afa84e0478',
        type: 'analytics',
        version: '2.1',
    },
};

const energyPieChartResponse = {
    status: 'completed',
    operation: 'energy_pie_chart',
    version: '1.0',
    parameter: { start: '2022-01-01T01:01:01Z', end: '2023-01-01T01:01:02Z' },
    access: { state_id: ['c3c65131-0b02-41cb-b18d-ef78674569aa'] },
    result: [{ id: 'Other', value: 7 }],
    meta: {
        id: '8fb0246e-98aa-48d6-be43-415b4bc015d9',
        type: 'analytics',
        version: '2.1',
    },
};

const powerPriceListResponse = {
    status: 'completed',
    operation: 'power_price_list',
    version: '1.0',
    parameter: { start: '2022-01-01T01:01:01Z', end: '2023-01-01T01:01:02Z' },
    access: { state_id: ['c3c65131-0b02-41cb-b18d-ef78674569aa'] },
    result: { prices: [{ price: 1, time: '2022-01-01T01:01:01Z' }] },
    meta: {
        id: '8fb0246e-98aa-48d6-be43-415b4bc015d9',
        type: 'analytics',
        version: '2.1',
    },
};

export function generateStreamEvent(type: string, id: string, data: any): any {
    return {
        meta: {
            id: '3c49a1aa-1a0f-4d00-92bf-4fbd414c02e0',
            type: 'eventstream',
            version: '2.1',
        },
        event: 'update',
        meta_object: {
            type,
            version: '2.1',
            id,
        },
        data,
        path: `${type}/${id}`,
        timestamp: '2022-12-19T10:34:03.287837Z',
    };
}

export {
    energyDataResponse,
    emptyEnergyDataResponse,
    energyPieChartResponse,
    energySummaryResponse,
    fullNetworkResponse,
    fullNetworkResponseUpdated,
    powerPriceListResponse,
    signalRequest,
    simpleNetworkResponse,
};
