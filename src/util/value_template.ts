import { ValueType } from './types';

export class ValueTemplate {
    [key: string]: ValueType;
    static version = '0.0.5';

    static TRIGGER: ValueType = {
        name: '',
        permission: 'r',
        type: 'trigger',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 0,
            step: 0,
            si_conversion: undefined,
            unit: '',
        },
    };
    static BOOLEAN_TRUEFALSE: ValueType = {
        name: '',
        permission: 'r',
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
    static BOOLEAN_ONOFF: ValueType = {
        name: '',
        permission: 'r',
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
    static CONNECTION_STATUS: ValueType = {
        name: '',
        permission: 'r',
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
    static INTEGER: ValueType = {
        name: '',
        permission: 'r',
        type: 'integer',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -255,
            max: 255,
            step: 1,
            si_conversion: undefined,
            unit: '',
        },
    };
    static COUNT: ValueType = {
        name: '',
        permission: 'r',
        type: 'count',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 255,
            step: 1,
            si_conversion: undefined,
            unit: '',
        },
    };
    static IMPULSE_KWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'impulse_resolution',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 1,
            max: 50000,
            step: 1,
            si_conversion: undefined,
            unit: 'imp/kWh',
        },
    };
    static VOLTAGE_V: ValueType = {
        name: '',
        permission: 'r',
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
    static POWER_WATT: ValueType = {
        name: '',
        permission: 'r',
        type: 'power',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 2500,
            step: 0.1,
            si_conversion: undefined,
            unit: 'W',
        },
    };
    static POWER_KW: ValueType = {
        name: '',
        permission: 'r',
        type: 'power',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 1000000,
            step: 0.1,
            si_conversion: '[W] = 1000 * [kW]',
            unit: 'kW',
        },
    };
    static ENERGY_WH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 100000,
            step: 0.1,
            si_conversion: '[J] = 3600 * [Wh]',
            unit: 'Wh',
        },
    };
    static ENERGY_KWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000 * [kWh]',
            unit: 'kWh',
        },
    };
    static ENERGY_MWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000000 * [MWh]',
            unit: 'MWh',
        },
    };
    static TOTAL_ENERGY_WH: ValueType = {
        name: '',
        permission: 'r',
        type: 'total_energy',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600 * [Wh]',
            unit: 'Wh',
        },
    };
    static TOTAL_ENERGY_KWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'total_energy',
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
    static TOTAL_ENERGY_MWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'total_energy',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000000 * [MWh]',
            unit: 'MWh',
        },
    };
    static LOAD_CURVE_ENERGY_WH: ValueType = {
        name: '',
        permission: 'r',
        type: 'load_curve_energy',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600 * [Wh]',
            unit: 'Wh',
        },
    };
    static LOAD_CURVE_ENERGY_KWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'load_curve_energy',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000 * [kWh]  ',
            unit: 'kWh',
        },
    };
    static LOAD_CURVE_ENERGY_MWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'load_curve_energy',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000000 * [MWh]',
            unit: 'MWh',
        },
    };
    static CURRENT_A: ValueType = {
        name: '',
        permission: 'r',
        type: 'electric_current',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -5000,
            max: 5000,
            step: 0.001,
            si_conversion: undefined,
            unit: 'A',
        },
    };
    static APPARENT_POWER_VA: ValueType = {
        name: '',
        permission: 'r',
        type: 'apparent_power',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -5000,
            max: 5000,
            step: 0.001,
            si_conversion: undefined,
            unit: 'VA',
        },
    };
    static REACTIVE_ENERGY_KVARH: ValueType = {
        name: '',
        permission: 'r',
        type: 'reactive_energy',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -5000,
            max: 5000,
            step: 0.001,
            si_conversion: undefined,
            unit: 'kvarh',
        },
    };
    static REACTIVE_POWER_KVAR: ValueType = {
        name: '',
        permission: 'r',
        type: 'reactive_power',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -5000,
            max: 5000,
            step: 0.001,
            si_conversion: undefined,
            unit: 'kvar',
        },
    };
    static ENERGY_PRICE_EUR_KWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy_price',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: false,
            min: -10000,
            max: 10000,
            step: 0.01,
            si_conversion: undefined,
            unit: 'EUR/kWh',
        },
    };
    static ENERGY_PRICE_EUR_MWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy_price',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: false,
            min: -10000,
            max: 10000,
            step: 0.001,
            si_conversion: undefined,
            unit: 'EUR/MWh',
        },
    };
    static ENERGY_PRICE_DKK_KWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy_price',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: false,
            min: -10000,
            max: 10000,
            step: 0.01,
            si_conversion: undefined,
            unit: 'DKK/kWh',
        },
    };
    static ENERGY_PRICE_DKK_MWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy_price',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: false,
            min: -10000,
            max: 10000,
            step: 0.001,
            si_conversion: undefined,
            unit: 'DKK/MWh',
        },
    };
    static FREQUENCY_HZ: ValueType = {
        name: '',
        permission: 'r',
        type: 'frequency',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 30000,
            step: 0.01,
            si_conversion: undefined,
            unit: 'Hz',
        },
    };
    static TEMPERATURE_CELSIUS: ValueType = {
        name: '',
        permission: 'r',
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
    static TEMPERATURE_FAHRENHEIT: ValueType = {
        name: '',
        permission: 'r',
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
    static TEMPERATURE_KELVIN: ValueType = {
        name: '',
        permission: 'r',
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
    static ANGLE: ValueType = {
        name: '',
        permission: 'r',
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
    static PERCENTAGE: ValueType = {
        name: '',
        permission: 'r',
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
    static SPEED_MS: ValueType = {
        name: '',
        permission: 'r',
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
    static SPEED_KMH: ValueType = {
        name: '',
        permission: 'r',
        type: 'speed',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 400,
            step: 0.1,
            si_conversion: '[ms] = [kmh]*1000/3600',
            unit: 'km/h',
        },
    };
    static PRECIPITATION_MM: ValueType = {
        name: '',
        permission: 'r',
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
    static HUMIDITY: ValueType = {
        name: '',
        permission: 'r',
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
    static CO2_PPM: ValueType = {
        name: '',
        permission: 'r',
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
    static CONCENTRATION_PPM: ValueType = {
        name: '',
        permission: 'r',
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
    static VOLUME_M3: ValueType = {
        name: '',
        permission: 'r',
        type: 'volume',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 1000000000,
            step: 0.001,
            si_conversion: '[m³] = [m³]',
            unit: 'm³',
        },
    };
    static UNIT_TIME: ValueType = {
        name: '',
        permission: 'r',
        type: 'timestamp',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 2147483647,
            step: 1,
            si_conversion: '[s] = [s]',
            unit: 's',
        },
    };
    static TIMESTAMP: ValueType = {
        name: '',
        permission: 'r',
        type: 'timestamp',
        string: {
            max: 27,
            encoding: 'ISO 8601',
        },
    };
    static DURATION_MIN: ValueType = {
        name: '',
        permission: 'r',
        type: 'duration',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1440,
            step: 0.1,
            si_conversion: '[s] = [min] / 60',
            unit: 'min',
        },
    };
    static DURATION_SEC: ValueType = {
        name: '',
        permission: 'r',
        type: 'duration',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 3600,
            step: 0.001,
            si_conversion: '[s] = [s]',
            unit: 's',
        },
    };
    static DURATION_MSEC: ValueType = {
        name: '',
        permission: 'r',
        type: 'duration',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 5000,
            step: 0.001,
            si_conversion: '[s] = [ms]/1000',
            unit: 'ms',
        },
    };
    static TIME_OF_DAY: ValueType = {
        name: '',
        permission: 'r',
        type: 'time',
        string: {
            max: 100,
            encoding: '',
        },
    };
    static DISTANCE_M: ValueType = {
        name: '',
        permission: 'r',
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
    static LUMINOSITY_LX: ValueType = {
        name: '',
        permission: 'r',
        type: 'luminosity',
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
        name: '',
        permission: 'r',
        type: 'color',
        blob: {
            max: 6,
            encoding: 'hex',
        },
    };
    static COLOR_INT: ValueType = {
        name: '',
        permission: 'r',
        type: 'color',
        blob: {
            max: 8,
            encoding: 'integer',
        },
    };
    static COLOR_TEMPERATURE: ValueType = {
        name: '',
        permission: 'r',
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
    static IMAGE_JPG: ValueType = {
        name: '',
        permission: 'r',
        type: 'image',
        blob: {
            max: 10485100,
            encoding: 'base64;jpg',
        },
    };
    static IMAGE_PNG: ValueType = {
        name: '',
        permission: 'r',
        type: 'image',
        blob: {
            max: 10485100,
            encoding: 'base64;png',
        },
    };
    static LATITUDE: ValueType = {
        name: '',
        permission: 'r',
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
    static LONGITUDE: ValueType = {
        name: '',
        permission: 'r',
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
    static ALTITUDE_M: ValueType = {
        name: '',
        permission: 'r',
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
    static STREET: ValueType = {
        name: '',
        permission: 'r',
        type: 'street',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static CITY: ValueType = {
        name: '',
        permission: 'r',
        type: 'city',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static POSTCODE: ValueType = {
        name: '',
        permission: 'r',
        type: 'postcode',
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
        name: '',
        permission: 'r',
        type: 'country_code',
        string: {
            max: 2,
            encoding: 'ISO 3166-1 Alpha-2',
        },
    };
    static ADDRESS_NAME: ValueType = {
        name: '',
        permission: 'r',
        type: 'address_name',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static ORGANIZATION: ValueType = {
        name: '',
        permission: 'r',
        type: 'organization',
        string: {
            max: 85,
            encoding: '',
        },
    };
    static EMAIL: ValueType = {
        name: '',
        permission: 'r',
        type: 'email',
        string: {
            max: 128,
            encoding: '',
        },
    };
    static PHONE: ValueType = {
        name: '',
        permission: 'r',
        type: 'phone',
        string: {
            max: 32,
            encoding: '',
        },
    };
    static IDENTIFIER: ValueType = {
        name: '',
        permission: 'r',
        type: 'identifier',
        string: {
            max: 50,
            encoding: '',
        },
    };
    static JSON: ValueType = {
        name: '',
        permission: 'r',
        type: 'json',
        blob: {
            max: 20000,
            encoding: 'json',
        },
    };
    static NUMBER: ValueType = {
        name: '',
        permission: 'r',
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
    static STRING: ValueType = {
        name: '',
        permission: 'r',
        type: 'string',
        string: {
            max: 64,
            encoding: '',
        },
    };
    static BLOB: ValueType = {
        name: '',
        permission: 'r',
        type: 'blob',
        blob: {
            max: 280,
            encoding: 'base64',
        },
    };
    static XML: ValueType = {
        name: '',
        permission: 'r',
        type: 'xml',
        xml: {
            xsd: '',
            namespace: '',
        },
    };
}
