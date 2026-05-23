import type { OperatorId, VehicleType } from '../types';

export type OperatorConfig = {
  id: OperatorId;
  displayName: string;
  vehicleType: VehicleType;
  bodyColor: string;
  accentColor: string;
  dotBorder: string;
  iconSrc: string;
};

export const OPERATORS: Record<OperatorId, OperatorConfig> = {
  bus_azul_pto: {
    id: 'bus_azul_pto',
    displayName: 'Buseta Costeña',
    vehicleType: 'padron',
    bodyColor: '#DA1E28',
    accentColor: '#1E5EFF',
    dotBorder: '#FFFFFF',
    iconSrc: '/assets/buses/bus_azul_pto.png',
  },
  bus_amarillo_pto: {
    id: 'bus_amarillo_pto',
    displayName: 'Buseta Amarilla',
    vehicleType: 'padron',
    bodyColor: '#FACC15',
    accentColor: '#0A0A0A',
    dotBorder: '#0A0A0A',
    iconSrc: '/assets/buses/bus_amarillo_pto.png',
  },
};

export function getOperator(id: OperatorId): OperatorConfig {
  return OPERATORS[id] ?? OPERATORS.bus_azul_pto;
}
