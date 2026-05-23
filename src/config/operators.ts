import type { OperatorId, VehicleType } from '../types';

export type OperatorConfig = {
  id: OperatorId;
  displayName: string;
  vehicleType: VehicleType;
  bodyColor: string;
  accentColor: string;
  windowColor: string;
  dotBorder: string;
};

export const OPERATORS: Record<OperatorId, OperatorConfig> = {
  transmetro: {
    id: 'transmetro',
    displayName: 'Transmetro',
    vehicleType: 'articulado',
    bodyColor: '#FFFFFF',
    accentColor: '#DA1E28',
    windowColor: '#1E5EFF',
    dotBorder: '#DA1E28',
  },
  bus_azul_pto: {
    id: 'bus_azul_pto',
    displayName: 'Bus Azul Puerto',
    vehicleType: 'padron',
    bodyColor: '#1E5EFF',
    accentColor: '#FFFFFF',
    windowColor: '#0A2A6B',
    dotBorder: '#FFFFFF',
  },
  bus_amarillo_pto: {
    id: 'bus_amarillo_pto',
    displayName: 'Bus Amarillo Puerto',
    vehicleType: 'padron',
    bodyColor: '#FACC15',
    accentColor: '#0A0A0A',
    windowColor: '#3D2E00',
    dotBorder: '#0A0A0A',
  },
};

export function getOperator(id: OperatorId): OperatorConfig {
  return OPERATORS[id] ?? OPERATORS.transmetro;
}
