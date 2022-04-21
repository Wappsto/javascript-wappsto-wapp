import { IValue } from './interfaces';

export class ValueTemplate {
    static version = '0.0.3';

    static BOOLEAN_TRUEFALSE: IValue = {
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
    static BOOLEAN_ONOFF: IValue = {
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
    static VOLTAGE_V: IValue = {
        type: 'voltage',
        name: '',
        permission: 'r',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 250,
            step: 1,
            si_conversion: undefined,
            unit: 'V',
        },
    };
    static POWER_WATT: IValue = {
        type: 'power',
        name: '',
        permission: 'r',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 2500,
            step: 1,
            si_conversion: undefined,
            unit: 'W',
        },
    };
    static POWER_KW: IValue = {
        type: 'power',
        name: '',
        permission: 'r',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1000000,
            step: 1,
            si_conversion: '[W] = 1000 * [kW]',
            unit: 'kW',
        },
    };
    static ENERGY_WH: IValue = {
        type: 'energy',
        name: '',
        permission: 'r',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 100000,
            step: 1,
            si_conversion: undefined,
            unit: 'Wh',
        },
    };
    static ENERGY_KWH: IValue = {
        type: 'energy',
        name: '',
        permission: 'r',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1000000,
            step: 1,
            si_conversion: '[J] = 3600000 * [kWh]  ',
            unit: 'kWh',
        },
    };
    static TEMPERATURE_CELSIUS: IValue = {
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
    static TEMPERATURE_FAHRENHEIT: IValue = {
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
    static TEMPERATURE_KELVIN: IValue = {
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
    static ANGLE: IValue = {
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
    static PERCENTAGE: IValue = {
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
    static SPEED_MS: IValue = {
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
    static PRECIPITATION_MM: IValue = {
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
    static HUMIDITY: IValue = {
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
    static CO2_PPM: IValue = {
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
    static CONCENTRATION_PPM: IValue = {
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
    static PRESSURE_HPA: IValue = {
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
    static TIMESTAMP: IValue = {
        type: 'timestamp',
        name: '',
        permission: 'r',
        string: {
            max: 27,
            encoding: 'ISO 8601',
        },
    };
    static DISTANCE_M: IValue = {
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
    static LUMINOUSITY_LX: IValue = {
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
    static COLOR_HEX: IValue = {
        type: 'color',
        name: '',
        permission: 'r',
        blob: {
            max: 6,
            encoding: 'hex',
        },
    };
    static COLOR_INT: IValue = {
        type: 'color',
        name: '',
        permission: 'r',
        blob: {
            max: 8,
            encoding: 'integer',
        },
    };
    static COLOR_TEMPERATURE: IValue = {
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
    static IMAGE_JPG: IValue = {
        type: 'image',
        name: '',
        permission: 'r',
        blob: {
            max: 255,
            encoding: 'base64',
        },
    };
    static LATITUDE: IValue = {
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
    static LONGITUDE: IValue = {
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
    static ALTITUDE_M: IValue = {
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
    static STREET: IValue = {
        type: 'street',
        name: '',
        permission: 'r',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static CITY: IValue = {
        type: 'city',
        name: '',
        permission: 'r',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static POSTCODE: IValue = {
        type: 'postcode',
        name: '',
        permission: 'r',
        string: {
            max: 10,
            encoding: '',
        },
    };
    static COUNTRY: IValue = {
        name: '',
        permission: 'r',
        type: 'country',
        string: {
            max: 56,
            encoding: '',
        },
    };
    static COUNTRY_CODE: IValue = {
        type: 'country_code',
        name: '',
        permission: 'r',
        string: {
            max: 2,
            encoding: 'ISO 3166-1 Alpha-2',
        },
    };
    static ADDRESS_NAME: IValue = {
        type: 'address_name',
        name: '',
        permission: 'r',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static ORGANISATION: IValue = {
        type: 'organisation',
        name: '',
        permission: 'r',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static IDENTIFIER: IValue = {
        type: 'identifier',
        name: '',
        permission: 'r',
        string: {
            max: 50,
            encoding: '',
        },
    };
    static NUMBER: IValue = {
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
    static STRING: IValue = {
        type: 'string',
        name: '',
        permission: 'r',
        string: {
            max: 64,
            encoding: '',
        },
    };
    static BLOB: IValue = {
        type: 'blob',
        name: '',
        permission: 'r',
        blob: {
            max: 280,
            encoding: 'base64',
        },
    };
    static XML: IValue = {
        type: 'xml',
        name: '',
        permission: 'r',
        xml: {
            xsd: '',
            namespace: '',
        },
    };
}
