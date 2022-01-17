import { IValueTemplate } from './interfaces';

export class ValueTemplate {
    static version = '0.0.1';

    static TEMPERATURE: IValueTemplate = {
        value_type: 'number',
        type: 'temperature',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 255,
            step: 0.01,
            unit: 'K',
        },
    };
    static TEMPERATURE_CELSIUS: IValueTemplate = {
        value_type: 'number',
        type: 'temperature',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: false,
            min: -273.15,
            max: 255,
            step: 0.01,
            unit: '°C',
        },
    };
    static BOOLEAN: IValueTemplate = {
        value_type: 'number',
        type: 'boolean',
        number: {
            mapping: { '0': 'false', '1': 'true' },
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 1,
            step: 1,
            unit: undefined,
        },
    };
    static IMAGE: IValueTemplate = {
        value_type: 'blob',
        type: 'image',
        blob: {
            max: 255,
            encoding: 'base64',
        },
    };
    static NUMBER: IValueTemplate = {
        value_type: 'number',
        type: 'number',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1e38,
            max: 1e38,
            step: 0.01,
            unit: undefined,
        },
    };
    static STRING: IValueTemplate = {
        value_type: 'string',
        type: 'string',
        string: {
            max: 64,
            encoding: 'utf-8',
        },
    };
    static BLOB: IValueTemplate = {
        value_type: 'blob',
        type: 'blob',
        blob: {
            max: 64,
            encoding: 'base64',
        },
    };
    static XML: IValueTemplate = {
        value_type: 'xml',
        type: 'xml',
        xml: {
            xsd: '',
            namespace: '',
        },
    };
}
