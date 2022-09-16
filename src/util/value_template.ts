import { ValueType } from './interfaces';

export class ValueTemplate {
    [key: string]: any;
    static version = '0.0.3';

    static BOOLEAN_TRUEFALSE: ValueType = {
        type: 'boolean',
        name: '',
        permission: 'r',
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
    static BOOLEAN_ONOFF: ValueType = {
        type: 'boolean',
        name: '',
        permission: 'r',
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
    static CONNECTION_STATUS: ValueType = {
        type: 'connection',
        name: '',
        permission: 'r',
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
    static VOLTAGE_V: ValueType = {
        type: 'voltage',
        name: '',
        permission: 'r',
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
    static POWER_WATT: ValueType = {
        type: 'power',
        name: '',
        permission: 'r',
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
    static POWER_KW: ValueType = {
        type: 'power',
        name: '',
        permission: 'r',
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
    static ENERGY_WH: ValueType = {
        type: 'energy',
        name: '',
        permission: 'r',
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
    static ENERGY_KWH: ValueType = {
        type: 'energy',
        name: '',
        permission: 'r',
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
    static TEMPERATURE_CELSIUS: ValueType = {
        type: 'temperature',
        name: '',
        permission: 'r',
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
    static TEMPERATURE_FAHRENHEIT: ValueType = {
        type: 'temperature',
        name: '',
        permission: 'r',
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
    static TEMPERATURE_KELVIN: ValueType = {
        type: 'temperature',
        name: '',
        permission: 'r',
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
    static ANGLE: ValueType = {
        type: 'angle',
        name: '',
        permission: 'r',
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
    static PERCENTAGE: ValueType = {
        type: 'percentage',
        name: '',
        permission: 'r',
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
    static SPEED_MS: ValueType = {
        type: 'speed',
        name: '',
        permission: 'r',
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
    static PRECIPITATION_MM: ValueType = {
        type: 'precipitation',
        name: '',
        permission: 'r',
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
    static HUMIDITY: ValueType = {
        type: 'relative_humidity',
        name: '',
        permission: 'r',
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
    static CO2_PPM: ValueType = {
        type: 'co2',
        name: '',
        permission: 'r',
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
    static CONCENTRATION_PPM: ValueType = {
        type: 'concentration',
        name: '',
        permission: 'r',
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
    static PRESSURE_HPA: ValueType = {
        name: '',
        permission: 'r',
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
    static TIMESTAMP: ValueType = {
        type: 'timestamp',
        name: '',
        permission: 'r',
        string: {
            max: 27,
            encoding: 'ISO 8601',
        },
    };
    static DISTANCE_M: ValueType = {
        type: 'distance',
        name: '',
        permission: 'r',
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
    static LUMINOUSITY_LX: ValueType = {
        type: 'luminousity',
        name: '',
        permission: 'r',
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
    static COLOR_HEX: ValueType = {
        type: 'color',
        name: '',
        permission: 'r',
        blob: {
            max: 6,
            encoding: 'hex',
        },
    };
    static COLOR_INT: ValueType = {
        type: 'color',
        name: '',
        permission: 'r',
        blob: {
            max: 8,
            encoding: 'integer',
        },
    };
    static COLOR_TEMPERATURE: ValueType = {
        type: 'color_temperature',
        name: '',
        permission: 'r',
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
    static IMAGE_JPG: ValueType = {
        type: 'image',
        name: '',
        permission: 'r',
        blob: {
            max: 255,
            encoding: 'base64',
        },
    };
    static LATITUDE: ValueType = {
        type: 'latitude',
        name: '',
        permission: 'r',
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
    static LONGITUDE: ValueType = {
        type: 'longitude',
        name: '',
        permission: 'r',
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
    static ALTITUDE_M: ValueType = {
        type: 'altitude',
        name: '',
        permission: 'r',
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
    static STREET: ValueType = {
        type: 'street',
        name: '',
        permission: 'r',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static CITY: ValueType = {
        type: 'city',
        name: '',
        permission: 'r',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static POSTCODE: ValueType = {
        type: 'postcode',
        name: '',
        permission: 'r',
        string: {
            max: 10,
            encoding: '',
        },
    };
    static COUNTRY: ValueType = {
        name: '',
        permission: 'r',
        type: 'country',
        string: {
            max: 56,
            encoding: '',
        },
    };
    static COUNTRY_CODE: ValueType = {
        type: 'country_code',
        name: '',
        permission: 'r',
        string: {
            max: 2,
            encoding: 'ISO 3166-1 Alpha-2',
        },
    };
    static ADDRESS_NAME: ValueType = {
        type: 'address_name',
        name: '',
        permission: 'r',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static ORGANISATION: ValueType = {
        type: 'organisation',
        name: '',
        permission: 'r',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static IDENTIFIER: ValueType = {
        type: 'identifier',
        name: '',
        permission: 'r',
        string: {
            max: 50,
            encoding: '',
        },
    };
    static NUMBER: ValueType = {
        type: 'number',
        name: '',
        permission: 'r',
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
    static STRING: ValueType = {
        type: 'string',
        name: '',
        permission: 'r',
        string: {
            max: 64,
            encoding: '',
        },
    };
    static BLOB: ValueType = {
        type: 'blob',
        name: '',
        permission: 'r',
        blob: {
            max: 280,
            encoding: 'base64',
        },
    };
    static XML: ValueType = {
        type: 'xml',
        name: '',
        permission: 'r',
        xml: {
            xsd: '',
            namespace: '',
        },
    };
}
