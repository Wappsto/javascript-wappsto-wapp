import { IValueTemplate } from './interfaces';

export class ValueTemplate {
    static version = '0.0.2';

    static BOOLEAN_TRUEFALSE: IValueTemplate = {
        value_type: 'number',
        type: 'boolean',
        number: {
            mapping: { '0': 'false', '1': 'true' },
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1,
            step: 1,
            si_conversion: undefined,
            unit: '',
        },
    };
    static BOOLEAN_ONOFF: IValueTemplate = {
        value_type: 'number',
        type: 'boolean',
        number: {
            mapping: { '0': 'off', '1': 'on' },
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1,
            step: 1,
            si_conversion: undefined,
            unit: '',
        },
    };
    static CONNECTION_STATUS: IValueTemplate = {
        value_type: 'number',
        type: 'connection',
        number: {
            mapping: { '0': 'offline', '1': 'online' },
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1,
            step: 1,
            si_conversion: undefined,
            unit: '',
        },
    };
    static VOLTAGE_V: IValueTemplate = {
        value_type: 'number',
        type: 'voltage',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 250,
            step: 0.1,
            si_conversion: undefined,
            unit: 'V',
        },
    };
    static POWER_WATT: IValueTemplate = {
        value_type: 'number',
        type: 'power',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 2500,
            step: 0.1,
            si_conversion: undefined,
            unit: 'W',
        },
    };
    static POWER_KW: IValueTemplate = {
        value_type: 'number',
        type: 'power',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1000000,
            step: 0.1,
            si_conversion: '[W] = 1000 * [kW]',
            unit: 'kW',
        },
    };
    static ENERGY_WH: IValueTemplate = {
        value_type: 'number',
        type: 'energy',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 100000,
            step: 0.1,
            si_conversion: undefined,
            unit: 'Wh',
        },
    };
    static ENERGY_KWH: IValueTemplate = {
        value_type: 'number',
        type: 'energy',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000 * [kWh]  ',
            unit: 'kWh',
        },
    };
    static TEMPERATURE_CELSIUS: IValueTemplate = {
        value_type: 'number',
        type: 'temperature',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: false,
            min: -30,
            max: 50,
            step: 1,
            si_conversion: '[K] = [°C] + 273.15',
            unit: '°C',
        },
    };
    static TEMPERATURE_FAHRENHEIT: IValueTemplate = {
        value_type: 'number',
        type: 'temperature',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: false,
            min: -20,
            max: 120,
            step: 1,
            si_conversion: '[K] = ([°F] + 459.67) × 5/9 ',
            unit: '°F',
        },
    };
    static TEMPERATURE_KELVIN: IValueTemplate = {
        value_type: 'number',
        type: 'temperature',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 240,
            max: 320,
            step: 1,
            si_conversion: undefined,
            unit: 'K',
        },
    };
    static ANGLE: IValueTemplate = {
        value_type: 'number',
        type: 'angle',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 360,
            step: 0,
            si_conversion: '[rad] = (180/pi) * [°]',
            unit: '°',
        },
    };
    static PERCENTAGE: IValueTemplate = {
        value_type: 'number',
        type: 'percentage',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 100,
            step: 1,
            si_conversion: '[1] = 100 * [%]',
            unit: '%',
        },
    };
    static SPEED_MS: IValueTemplate = {
        value_type: 'number',
        type: 'speed',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 100,
            step: 1,
            si_conversion: undefined,
            unit: 'm/s',
        },
    };
    static PRECIPITATION_MM: IValueTemplate = {
        value_type: 'number',
        type: 'precipitation',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 100,
            step: 1,
            si_conversion: undefined,
            unit: 'mm',
        },
    };
    static HUMIDITY: IValueTemplate = {
        value_type: 'number',
        type: 'relative_humidity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 100,
            step: 1,
            si_conversion: '[1] = 100 * [%]',
            unit: '%',
        },
    };
    static CO2_PPM: IValueTemplate = {
        value_type: 'number',
        type: 'co2',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 3000,
            step: 1,
            si_conversion: '1000000 * [ppm]',
            unit: 'ppm',
        },
    };
    static CONCENTRATION_PPM: IValueTemplate = {
        value_type: 'number',
        type: 'concentration',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 3000,
            step: 1,
            si_conversion: '1000000 * [ppm]',
            unit: 'ppm',
        },
    };
    static PRESSURE_HPA: IValueTemplate = {
        value_type: 'number',
        type: 'pressure',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 300,
            max: 1100,
            step: 1,
            si_conversion: '[Pa] = [hPa]/100',
            unit: 'hPa',
        },
    };
    static TIMESTAMP: IValueTemplate = {
        value_type: 'string',
        type: 'timestamp',
        string: {
            max: 27,
            encoding: 'ISO 8601',
        },
    };
    static DISTANCE_M: IValueTemplate = {
        value_type: 'number',
        type: 'distance',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1000,
            step: 1,
            si_conversion: undefined,
            unit: 'm',
        },
    };
    static LUMINOUSITY_LX: IValueTemplate = {
        value_type: 'number',
        type: 'luminousity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 25000,
            step: 1,
            si_conversion: undefined,
            unit: 'lx',
        },
    };
    static COLOR_HEX: IValueTemplate = {
        value_type: 'blob',
        type: 'color',
        blob: {
            max: 6,
            encoding: 'hex',
        },
    };
    static COLOR_INT: IValueTemplate = {
        value_type: 'blob',
        type: 'color',
        blob: {
            max: 8,
            encoding: 'integer',
        },
    };
    static COLOR_TEMPERATURE: IValueTemplate = {
        value_type: 'number',
        type: 'color_temperature',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 1000,
            max: 12000,
            step: 1,
            si_conversion: undefined,
            unit: 'K',
        },
    };
    static IMAGE_JPG: IValueTemplate = {
        value_type: 'blob',
        type: 'image',
        blob: {
            max: 255,
            encoding: 'base64',
        },
    };
    static LATITUDE: IValueTemplate = {
        value_type: 'number',
        type: 'latitude',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -90,
            max: 90,
            step: 0.000001,
            si_conversion: undefined,
            unit: '°N',
        },
    };
    static LONGITUDE: IValueTemplate = {
        value_type: 'number',
        type: 'longitude',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -180,
            max: 180,
            step: 0.000001,
            si_conversion: undefined,
            unit: '°E',
        },
    };
    static ALTITUDE_M: IValueTemplate = {
        value_type: 'number',
        type: 'altitude',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -10000,
            max: 10000,
            step: 0.01,
            si_conversion: undefined,
            unit: 'm',
        },
    };
    static STREET: IValueTemplate = {
        value_type: 'string',
        type: 'street',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static CITY: IValueTemplate = {
        value_type: 'string',
        type: 'city',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static POSTCODE: IValueTemplate = {
        value_type: 'string',
        type: 'postcode',
        string: {
            max: 10,
            encoding: '',
        },
    };
    static COUNTRY: IValueTemplate = {
        value_type: 'string',
        type: 'country',
        string: {
            max: 56,
            encoding: '',
        },
    };
    static COUNTRY_CODE: IValueTemplate = {
        value_type: 'string',
        type: 'country_code',
        string: {
            max: 2,
            encoding: 'ISO 3166-1 Alpha-2',
        },
    };
    static ADDRESS_NAME: IValueTemplate = {
        value_type: 'string',
        type: 'address_name',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static ORGANISATION: IValueTemplate = {
        value_type: 'string',
        type: 'organisation',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static IDENTIFIER: IValueTemplate = {
        value_type: 'string',
        type: 'identifier',
        string: {
            max: 50,
            encoding: '',
        },
    };
    static NUMBER: IValueTemplate = {
        value_type: 'number',
        type: 'number',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -128,
            max: 128,
            step: 0.1,
            si_conversion: undefined,
            unit: '',
        },
    };
    static STRING: IValueTemplate = {
        value_type: 'string',
        type: 'string',
        string: {
            max: 64,
            encoding: '',
        },
    };
    static BLOB: IValueTemplate = {
        value_type: 'blob',
        type: 'blob',
        blob: {
            max: 280,
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
