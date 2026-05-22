export type RutaEstado = 'operando' | 'frecuencia_baja' | 'ultimo_bus';

export type Ruta = {
  id: string;
  nombre: string;
  destino: string;
  etaMinutos: number;
  estado: RutaEstado;
};

export type Paradero = {
  id: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  rutas: Ruta[];
};

export type Bus = {
  id: string;
  rutaNombre: string;
  lat: number;
  lng: number;
  heading?: number;
};

export type AgentAction =
  | 'asked_ai'
  | 'started_trip'
  | 'completed_trip'
  | 'reported_incident';

export type AgentEvent = {
  type: 'user_action';
  userId: string;
  userName: string;
  action: AgentAction;
  payload: Record<string, unknown>;
  location: { lat: number; lng: number };
  timestamp: string;
};

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  recommendation?: RouteRecommendation;
  createdAt: string;
};

export type RouteRecommendation = {
  rutaNombre: string;
  origen: string;
  destino: string;
  duracionMinutos: number;
  paraderoOrigenId: string;
};

export type Viaje = {
  id: string;
  rutaNombre: string;
  origen: string;
  destino: string;
  paradasRestantes: Paradero[];
  proximoParadero: Paradero;
  tiempoRestanteMin: number;
  busLat: number;
  busLng: number;
};
