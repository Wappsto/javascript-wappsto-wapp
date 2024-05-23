import { createCheckers } from 'ts-interface-checker';
import interfaceTI from './interfaces-ti';
import typesTI from './types-ti';

export function getTypeChecker() {
    return createCheckers({ ...interfaceTI, ...typesTI });
}
