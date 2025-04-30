import { ValueType } from './types';

export class ValueTemplate {
    [key: string]: ValueType;
    static version = '0.0.7';

    static TRIGGER: ValueType = {
        name: '',
        permission: 'r',
        type: 'trigger',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 0,
            step: 0,
            si_conversion: undefined,
            unit: '',
            resolution: undefined,
        },
    };
    static BOOLEAN_TRUEFALSE: ValueType = {
        name: '',
        permission: 'r',
        type: 'boolean',
        measure_type: undefined,
        number: {
            mapping: { '0': 'false', '1': 'true' },
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1,
            step: 1,
            si_conversion: undefined,
            unit: '',
            resolution: undefined,
        },
    };
    static BOOLEAN_ONOFF: ValueType = {
        name: '',
        permission: 'r',
        type: 'boolean',
        measure_type: undefined,
        number: {
            mapping: { '0': 'off', '1': 'on' },
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1,
            step: 1,
            si_conversion: undefined,
            unit: '',
            resolution: undefined,
        },
    };
    static CONNECTION_STATUS: ValueType = {
        name: '',
        permission: 'r',
        type: 'connection',
        measure_type: undefined,
        number: {
            mapping: { '0': 'offline', '1': 'online' },
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1,
            step: 1,
            si_conversion: undefined,
            unit: '',
            resolution: undefined,
        },
    };
    static INTEGER: ValueType = {
        name: '',
        permission: 'r',
        type: 'integer',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -255,
            max: 255,
            step: 1,
            si_conversion: undefined,
            unit: '',
            resolution: undefined,
        },
    };
    static COUNT: ValueType = {
        name: '',
        permission: 'r',
        type: 'count',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 255,
            step: 1,
            si_conversion: undefined,
            unit: '',
            resolution: undefined,
        },
    };
    static IMPULSE_KWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'impulse_resolution',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 1,
            max: 50000,
            step: 1,
            si_conversion: undefined,
            unit: 'imp/kWh',
            resolution: undefined,
        },
    };
    static VOLTAGE_V: ValueType = {
        name: '',
        permission: 'r',
        type: 'voltage',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 250,
            step: 0.1,
            si_conversion: undefined,
            unit: 'V',
            resolution: undefined,
        },
    };
    static FREQUENCY_HZ: ValueType = {
        name: '',
        permission: 'r',
        type: 'frequency',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 30000,
            step: 0.01,
            si_conversion: undefined,
            unit: 'Hz',
            resolution: undefined,
        },
    };
    static POWER_WATT: ValueType = {
        name: '',
        permission: 'r',
        type: 'power',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 2500,
            step: 0.1,
            si_conversion: undefined,
            unit: 'W',
            resolution: undefined,
        },
    };
    static POWER_KW: ValueType = {
        name: '',
        permission: 'r',
        type: 'power',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 1000000,
            step: 0.1,
            si_conversion: '[W] = 1000 * [kW]',
            unit: 'kW',
            resolution: undefined,
        },
    };
    static ENERGY_WH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 100000,
            step: 0.1,
            si_conversion: '[J] = 3600 * [Wh]',
            unit: 'Wh',
            resolution: undefined,
        },
    };
    static ENERGY_KWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000 * [kWh]',
            unit: 'kWh',
            resolution: undefined,
        },
    };
    static ENERGY_MWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000000 * [MWh]',
            unit: 'MWh',
            resolution: undefined,
        },
    };
    static TOTAL_ENERGY_WH: ValueType = {
        name: '',
        permission: 'r',
        type: 'total_energy',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600 * [Wh]',
            unit: 'Wh',
            resolution: undefined,
        },
    };
    static TOTAL_ENERGY_KWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'total_energy',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000 * [kWh]  ',
            unit: 'kWh',
            resolution: undefined,
        },
    };
    static TOTAL_ENERGY_MWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'total_energy',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000000 * [MWh]',
            unit: 'MWh',
            resolution: undefined,
        },
    };
    static LOAD_CURVE_ENERGY_WH: ValueType = {
        name: '',
        permission: 'r',
        type: 'load_curve_energy',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600 * [Wh]',
            unit: 'Wh',
            resolution: undefined,
        },
    };
    static LOAD_CURVE_ENERGY_KWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'load_curve_energy',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000 * [kWh]  ',
            unit: 'kWh',
            resolution: undefined,
        },
    };
    static LOAD_CURVE_ENERGY_MWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'load_curve_energy',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -1000000,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000000 * [MWh]',
            unit: 'MWh',
            resolution: undefined,
        },
    };
    static CURRENT_A: ValueType = {
        name: '',
        permission: 'r',
        type: 'electric_current',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -5000,
            max: 5000,
            step: 0.001,
            si_conversion: undefined,
            unit: 'A',
            resolution: undefined,
        },
    };
    static APPARENT_POWER_VA: ValueType = {
        name: '',
        permission: 'r',
        type: 'apparent_power',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -5000,
            max: 5000,
            step: 0.001,
            si_conversion: undefined,
            unit: 'VA',
            resolution: undefined,
        },
    };
    static REACTIVE_ENERGY_KVARH: ValueType = {
        name: '',
        permission: 'r',
        type: 'reactive_energy',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -5000,
            max: 5000,
            step: 0.001,
            si_conversion: undefined,
            unit: 'kvarh',
            resolution: undefined,
        },
    };
    static REACTIVE_POWER_KVAR: ValueType = {
        name: '',
        permission: 'r',
        type: 'reactive_power',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -5000,
            max: 5000,
            step: 0.001,
            si_conversion: undefined,
            unit: 'kvar',
            resolution: undefined,
        },
    };
    static ENERGY_PRICE_EUR_KWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy_price',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: false,
            min: -10000,
            max: 10000,
            step: 0.01,
            si_conversion: undefined,
            unit: 'EUR/kWh',
            resolution: undefined,
        },
    };
    static ENERGY_PRICE_EUR_MWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy_price',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: false,
            min: -10000,
            max: 10000,
            step: 0.001,
            si_conversion: undefined,
            unit: 'EUR/MWh',
            resolution: undefined,
        },
    };
    static ENERGY_PRICE_DKK_KWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy_price',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: false,
            min: -10000,
            max: 10000,
            step: 0.01,
            si_conversion: undefined,
            unit: 'DKK/kWh',
            resolution: undefined,
        },
    };
    static ENERGY_PRICE_DKK_MWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'energy_price',
        measure_type: 'electricity',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: false,
            min: -10000,
            max: 10000,
            step: 0.001,
            si_conversion: undefined,
            unit: 'DKK/MWh',
            resolution: undefined,
        },
    };
    static HEAT_TOTAL_ENERGY_WH: ValueType = {
        name: '',
        permission: 'r',
        type: 'total_energy',
        measure_type: 'heat',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600 * [Wh]',
            unit: 'Wh',
            resolution: undefined,
        },
    };
    static HEAT_TOTAL_ENERGY_KWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'total_energy',
        measure_type: 'heat',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000 * [kWh]  ',
            unit: 'kWh',
            resolution: undefined,
        },
    };
    static HEAT_TOTAL_ENERGY_MWH: ValueType = {
        name: '',
        permission: 'r',
        type: 'total_energy',
        measure_type: 'heat',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1000000,
            step: 0.1,
            si_conversion: '[J] = 3600000000 * [MWh]',
            unit: 'MWh',
            resolution: undefined,
        },
    };
    static VOLUME_M3: ValueType = {
        name: '',
        permission: 'r',
        type: 'volume',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 1000000000,
            step: 0.001,
            si_conversion: '[m�] = [m�]',
            unit: 'm�',
            resolution: undefined,
        },
    };
    static TOTAL_VOLUME_M3: ValueType = {
        name: '',
        permission: 'r',
        type: 'total_volume',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 1000000000,
            step: 0.001,
            si_conversion: '[m�] = [m�]',
            unit: 'm�',
            resolution: undefined,
        },
    };
    static FLOW_CURVE_VOLUME_M3: ValueType = {
        name: '',
        permission: 'r',
        type: 'flow_curve_volume',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 1000000000,
            step: 0.001,
            si_conversion: '[m�] = [m�]',
            unit: 'm�',
            resolution: undefined,
        },
    };
    static WATER_VOLUME_M3: ValueType = {
        name: '',
        permission: 'r',
        type: 'volume',
        measure_type: 'water',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 1000000000,
            step: 0.001,
            si_conversion: '[m�] = [m�]',
            unit: 'm�',
            resolution: undefined,
        },
    };
    static WATER_TOTAL_VOLUME_M3: ValueType = {
        name: '',
        permission: 'r',
        type: 'total_volume',
        measure_type: 'water',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 1000000000,
            step: 0.001,
            si_conversion: '[m�] = [m�]',
            unit: 'm�',
            resolution: undefined,
        },
    };
    static WATER_FLOW_CURVE_VOLUME_M3: ValueType = {
        name: '',
        permission: 'r',
        type: 'flow_curve_volume',
        measure_type: 'water',
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 1000000000,
            step: 0.001,
            si_conversion: '[m�] = [m�]',
            unit: 'm�',
            resolution: undefined,
        },
    };
    static TEMPERATURE_CELSIUS: ValueType = {
        name: '',
        permission: 'r',
        type: 'temperature',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: false,
            min: -30,
            max: 50,
            step: 1,
            si_conversion: '[K] = [�C] + 273.15',
            unit: '�C',
            resolution: undefined,
        },
    };
    static TEMPERATURE_FAHRENHEIT: ValueType = {
        name: '',
        permission: 'r',
        type: 'temperature',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: false,
            min: -20,
            max: 120,
            step: 1,
            si_conversion: '[K] = ([�F] + 459.67) � 5/9 ',
            unit: '�F',
            resolution: undefined,
        },
    };
    static TEMPERATURE_KELVIN: ValueType = {
        name: '',
        permission: 'r',
        type: 'temperature',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 240,
            max: 320,
            step: 1,
            si_conversion: undefined,
            unit: 'K',
            resolution: undefined,
        },
    };
    static ANGLE: ValueType = {
        name: '',
        permission: 'r',
        type: 'angle',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 360,
            step: 0,
            si_conversion: '[rad] = (180/pi) * [�]',
            unit: '�',
            resolution: undefined,
        },
    };
    static PERCENTAGE: ValueType = {
        name: '',
        permission: 'r',
        type: 'percentage',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 100,
            step: 1,
            si_conversion: '[1] = 100 * [%]',
            unit: '%',
            resolution: undefined,
        },
    };
    static SPEED_MS: ValueType = {
        name: '',
        permission: 'r',
        type: 'speed',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 100,
            step: 1,
            si_conversion: undefined,
            unit: 'm/s',
            resolution: undefined,
        },
    };
    static SPEED_KMH: ValueType = {
        name: '',
        permission: 'r',
        type: 'speed',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 400,
            step: 0.1,
            si_conversion: '[ms] = [kmh]*1000/3600',
            unit: 'km/h',
            resolution: undefined,
        },
    };
    static PRECIPITATION_MM: ValueType = {
        name: '',
        permission: 'r',
        type: 'precipitation',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 100,
            step: 1,
            si_conversion: undefined,
            unit: 'mm',
            resolution: undefined,
        },
    };
    static HUMIDITY: ValueType = {
        name: '',
        permission: 'r',
        type: 'relative_humidity',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 100,
            step: 1,
            si_conversion: '[1] = 100 * [%]',
            unit: '%',
            resolution: undefined,
        },
    };
    static CO2_PPM: ValueType = {
        name: '',
        permission: 'r',
        type: 'co2',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 3000,
            step: 1,
            si_conversion: '1000000 * [ppm]',
            unit: 'ppm',
            resolution: undefined,
        },
    };
    static CONCENTRATION_PPM: ValueType = {
        name: '',
        permission: 'r',
        type: 'concentration',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 3000,
            step: 1,
            si_conversion: '1000000 * [ppm]',
            unit: 'ppm',
            resolution: undefined,
        },
    };
    static PRESSURE_HPA: ValueType = {
        name: '',
        permission: 'r',
        type: 'pressure',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 300,
            max: 1100,
            step: 1,
            si_conversion: '[Pa] = [hPa]/100',
            unit: 'hPa',
            resolution: undefined,
        },
    };
    static UNIT_TIME: ValueType = {
        name: '',
        permission: 'r',
        type: 'timestamp',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: true,
            min: 0,
            max: 2147483647,
            step: 1,
            si_conversion: '[s] = [s]',
            unit: 's',
            resolution: undefined,
        },
    };
    static TIMESTAMP: ValueType = {
        name: '',
        permission: 'r',
        type: 'timestamp',
        measure_type: undefined,
        string: {
            max: 27,
            encoding: 'ISO 8601',
        },
    };
    static DURATION_MIN: ValueType = {
        name: '',
        permission: 'r',
        type: 'duration',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 1440,
            step: 0.1,
            si_conversion: '[s] = [min] / 60',
            unit: 'min',
            resolution: undefined,
        },
    };
    static DURATION_SEC: ValueType = {
        name: '',
        permission: 'r',
        type: 'duration',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 3600,
            step: 0.001,
            si_conversion: '[s] = [s]',
            unit: 's',
            resolution: undefined,
        },
    };
    static DURATION_MSEC: ValueType = {
        name: '',
        permission: 'r',
        type: 'duration',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 5000,
            step: 0.001,
            si_conversion: '[s] = [ms]/1000',
            unit: 'ms',
            resolution: undefined,
        },
    };
    static TIME_OF_DAY: ValueType = {
        name: '',
        permission: 'r',
        type: 'time',
        measure_type: undefined,
        string: {
            max: 100,
            encoding: '',
        },
    };
    static DISTANCE_M: ValueType = {
        name: '',
        permission: 'r',
        type: 'distance',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 100000,
            step: 1,
            si_conversion: undefined,
            unit: 'm',
            resolution: undefined,
        },
    };
    static DISTANCE_KM: ValueType = {
        name: '',
        permission: 'r',
        type: 'distance',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 100000,
            step: 0.1,
            si_conversion: undefined,
            unit: 'km',
            resolution: undefined,
        },
    };
    static LUMINOSITY_LX: ValueType = {
        name: '',
        permission: 'r',
        type: 'luminosity',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 0,
            max: 25000,
            step: 1,
            si_conversion: undefined,
            unit: 'lx',
            resolution: undefined,
        },
    };
    static COLOR_HEX: ValueType = {
        name: '',
        permission: 'r',
        type: 'color',
        measure_type: undefined,
        blob: {
            max: 6,
            encoding: 'hex',
        },
    };
    static COLOR_INT: ValueType = {
        name: '',
        permission: 'r',
        type: 'color',
        measure_type: undefined,
        blob: {
            max: 8,
            encoding: 'integer',
        },
    };
    static COLOR_TEMPERATURE: ValueType = {
        name: '',
        permission: 'r',
        type: 'color_temperature',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: 1000,
            max: 12000,
            step: 1,
            si_conversion: undefined,
            unit: 'K',
            resolution: undefined,
        },
    };
    static IMAGE_JPG: ValueType = {
        name: '',
        permission: 'r',
        type: 'image',
        measure_type: undefined,
        blob: {
            max: 10485100,
            encoding: 'base64;jpg',
        },
    };
    static IMAGE_PNG: ValueType = {
        name: '',
        permission: 'r',
        type: 'image',
        measure_type: undefined,
        blob: {
            max: 10485100,
            encoding: 'base64;png',
        },
    };
    static LATITUDE: ValueType = {
        name: '',
        permission: 'r',
        type: 'latitude',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -90,
            max: 90,
            step: 0.000001,
            si_conversion: undefined,
            unit: '�N',
            resolution: undefined,
        },
    };
    static LONGITUDE: ValueType = {
        name: '',
        permission: 'r',
        type: 'longitude',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -180,
            max: 180,
            step: 0.000001,
            si_conversion: undefined,
            unit: '�E',
            resolution: undefined,
        },
    };
    static ALTITUDE_M: ValueType = {
        name: '',
        permission: 'r',
        type: 'altitude',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -10000,
            max: 10000,
            step: 0.01,
            si_conversion: undefined,
            unit: 'm',
            resolution: undefined,
        },
    };
    static STREET: ValueType = {
        name: '',
        permission: 'r',
        type: 'street',
        measure_type: undefined,
        string: {
            max: 85,
            encoding: '',
        },
    };
    static CITY: ValueType = {
        name: '',
        permission: 'r',
        type: 'city',
        measure_type: undefined,
        string: {
            max: 85,
            encoding: '',
        },
    };
    static POSTCODE: ValueType = {
        name: '',
        permission: 'r',
        type: 'postcode',
        measure_type: undefined,
        string: {
            max: 10,
            encoding: '',
        },
    };
    static COUNTRY: ValueType = {
        name: '',
        permission: 'r',
        type: 'country',
        measure_type: undefined,
        string: {
            max: 56,
            encoding: '',
        },
    };
    static COUNTRY_CODE: ValueType = {
        name: '',
        permission: 'r',
        type: 'country_code',
        measure_type: undefined,
        string: {
            max: 2,
            encoding: 'ISO 3166-1 Alpha-2',
        },
    };
    static ADDRESS_NAME: ValueType = {
        name: '',
        permission: 'r',
        type: 'address_name',
        measure_type: undefined,
        string: {
            max: 85,
            encoding: '',
        },
    };
    static ORGANIZATION: ValueType = {
        name: '',
        permission: 'r',
        type: 'organization',
        measure_type: undefined,
        string: {
            max: 85,
            encoding: '',
        },
    };
    static EMAIL: ValueType = {
        name: '',
        permission: 'r',
        type: 'email',
        measure_type: undefined,
        string: {
            max: 128,
            encoding: '',
        },
    };
    static PHONE: ValueType = {
        name: '',
        permission: 'r',
        type: 'phone',
        measure_type: undefined,
        string: {
            max: 32,
            encoding: '',
        },
    };
    static IDENTIFIER: ValueType = {
        name: '',
        permission: 'r',
        type: 'identifier',
        measure_type: undefined,
        string: {
            max: 50,
            encoding: '',
        },
    };
    static JSON: ValueType = {
        name: '',
        permission: 'r',
        type: 'json',
        measure_type: undefined,
        blob: {
            max: 20000,
            encoding: 'json',
        },
    };
    static NUMBER: ValueType = {
        name: '',
        permission: 'r',
        type: 'number',
        measure_type: undefined,
        number: {
            mapping: undefined,
            ordered_mapping: undefined,
            meaningful_zero: undefined,
            min: -128,
            max: 128,
            step: 0.1,
            si_conversion: undefined,
            unit: '',
            resolution: undefined,
        },
    };
    static STRING: ValueType = {
        name: '',
        permission: 'r',
        type: 'string',
        measure_type: undefined,
        string: {
            max: 64,
            encoding: '',
        },
    };
    static BLOB: ValueType = {
        name: '',
        permission: 'r',
        type: 'blob',
        measure_type: undefined,
        blob: {
            max: 280,
            encoding: 'base64',
        },
    };
    static XML: ValueType = {
        name: '',
        permission: 'r',
        type: 'xml',
        measure_type: undefined,
        xml: {
            xsd: '',
            namespace: '',
        },
    };
}
