import type { AgentEvent, Bus, Paradero, Viaje } from '../types';

const BAQ_CENTER = { lat: 10.9685, lng: -74.7813 };

export const paraderosMock: Paradero[] = [
  {
    id: 'p1',
    nombre: 'Buenavista',
    direccion: 'Cra. 53 con Cl. 100',
    lat: 11.0046,
    lng: -74.8083,
    rutas: [
      { id: 'r1', nombre: 'C12', destino: 'Centro Histórico', etaMinutos: 3, estado: 'operando' },
      { id: 'r2', nombre: 'A8', destino: 'Universidad del Norte', etaMinutos: 9, estado: 'operando' },
      { id: 'r3', nombre: '46', destino: 'Soledad', etaMinutos: 22, estado: 'frecuencia_baja' },
    ],
  },
  {
    id: 'p2',
    nombre: 'Plaza de la Paz',
    direccion: 'Cra. 46 con Cl. 53',
    lat: 10.9842,
    lng: -74.7903,
    rutas: [
      { id: 'r4', nombre: 'B1', destino: 'Norte', etaMinutos: 5, estado: 'operando' },
      { id: 'r5', nombre: 'C12', destino: 'Centro Histórico', etaMinutos: 11, estado: 'operando' },
    ],
  },
  {
    id: 'p3',
    nombre: 'Paseo Bolívar',
    direccion: 'Cra. 41 con Cl. 35',
    lat: 10.9627,
    lng: -74.7896,
    rutas: [
      { id: 'r6', nombre: 'T1', destino: 'Soledad', etaMinutos: 1, estado: 'operando' },
      { id: 'r7', nombre: 'F2', destino: 'Malambo', etaMinutos: 17, estado: 'frecuencia_baja' },
      { id: 'r8', nombre: 'L9', destino: 'Aeropuerto', etaMinutos: 28, estado: 'ultimo_bus' },
    ],
  },
  {
    id: 'p4',
    nombre: 'Estación Joe Arroyo',
    direccion: 'Av. Murillo con Cra. 43',
    lat: 10.9596,
    lng: -74.7787,
    rutas: [
      { id: 'r9', nombre: 'T1', destino: 'Norte', etaMinutos: 4, estado: 'operando' },
      { id: 'r10', nombre: 'R3', destino: 'Sur', etaMinutos: 13, estado: 'operando' },
    ],
  },
  {
    id: 'p5',
    nombre: 'Parque Sagrado Corazón',
    direccion: 'Cra. 47 con Cl. 70',
    lat: 10.9881,
    lng: -74.7964,
    rutas: [
      { id: 'r11', nombre: 'A8', destino: 'Universidad del Norte', etaMinutos: 7, estado: 'operando' },
      { id: 'r12', nombre: 'B1', destino: 'Norte', etaMinutos: 19, estado: 'frecuencia_baja' },
    ],
  },
];

export const busesMock: Bus[] = [
  { id: 'b1', rutaNombre: 'C12', lat: 10.972, lng: -74.795, heading: 45, operatorId: 'bus_azul_pto' },
  { id: 'b2', rutaNombre: 'A8', lat: 10.991, lng: -74.802, heading: 180, operatorId: 'bus_azul_pto' },
  { id: 'b3', rutaNombre: 'T1', lat: 10.963, lng: -74.781, heading: 270, operatorId: 'bus_amarillo_pto' },
  { id: 'b4', rutaNombre: 'B1', lat: 10.978, lng: -74.788, heading: 90, operatorId: 'bus_amarillo_pto' },
  { id: 'b5', rutaNombre: '46', lat: 10.955, lng: -74.776, heading: 0, operatorId: 'bus_azul_pto' },
];

export const viajeMock: Viaje = {
  id: 'v1',
  rutaNombre: 'C12',
  origen: 'Buenavista',
  destino: 'Centro Histórico',
  proximoParadero: paraderosMock[1],
  paradasRestantes: [paraderosMock[1], paraderosMock[2]],
  tiempoRestanteMin: 14,
  busLat: 10.985,
  busLng: -74.793,
};

const agentNames = [
  'María', 'Juan', 'Andrea', 'Carlos', 'Sofía',
  'Diego', 'Valentina', 'Felipe', 'Laura', 'Sebastián',
];

export function randomAgentEvent(): AgentEvent {
  const actions: AgentEvent['action'][] = [
    'asked_ai', 'started_trip', 'completed_trip', 'reported_incident',
  ];
  const action = actions[Math.floor(Math.random() * actions.length)];
  const name = agentNames[Math.floor(Math.random() * agentNames.length)];
  return {
    type: 'user_action',
    userId: `u_${Math.floor(Math.random() * 500)}`,
    userName: name,
    action,
    payload: {},
    location: {
      lat: BAQ_CENTER.lat + (Math.random() - 0.5) * 0.08,
      lng: BAQ_CENTER.lng + (Math.random() - 0.5) * 0.08,
    },
    timestamp: new Date().toISOString(),
  };
}

export const BARRANQUILLA_CENTER = BAQ_CENTER;
