export type LatLng = { lat: number; lng: number };

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

export type LandmarkRouteRef = {
  id: string;
  code: string;
  name?: string;
  distanceMeters?: number;
};

export type Landmark = {
  id: string;
  name: string;
  address?: string;
  category?: string;
  lat: number;
  lng: number;
  routesNearby: LandmarkRouteRef[];
};

export type OperatorId = 'bus_azul_pto' | 'bus_amarillo_pto';

export type VehicleType = 'padron';

export type Bus = {
  id: string;
  rutaNombre: string;
  lat: number;
  lng: number;
  heading: number;
  operatorId: OperatorId;
};

export type BusPosition = {
  type: 'bus_position';
  busId: string;
  routeId: string;
  routeCode: string;
  operatorId?: OperatorId;
  location: LatLng;
  heading: number;
  speedKmh: number;
  fractionOfCorridor?: number;
  timestamp: string;
};

export type TripStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type Trip = {
  id: string;
  routeId: string;
  routeCode: string;
  boardingLocation: LatLng;
  dropoffLocation: LatLng;
  status: TripStatus;
  startedAt: string;
  completedAt?: string;
  remainingSeconds: number;
  currentLocation?: LatLng;
};

export type TripUpdateEvent = {
  type: 'trip_update';
  tripId: string;
  status: TripStatus;
  remainingSeconds: number;
  currentLocation: LatLng;
};

export type SuggestedAction =
  | { type: 'START_TRIP'; routeId: string; routeCode: string; destination?: string }
  | { type: 'SHOW_ROUTE'; routeId: string; routeCode: string }
  | { type: 'SHOW_LANDMARK'; landmarkId: string; landmarkName?: string }
  | { type: 'OPEN_WAIT_PIN'; location: LatLng; routeId?: string };

export type AssistantAskResponse = {
  answer: string;
  suggested_action: SuggestedAction | null;
  messageId?: string;
};

export type AlternativeRoute = {
  rank: number;
  label: string;
  rutaNombre: string;
  origen: string;
  destino: string;
  duracionMinutos: number;
  paraderoOrigenId?: string;
  insight?: string;
  badge?: 'recomendada' | 'mas_rapida' | 'mas_segura' | 'ultimo_bus';
  action: SuggestedAction;
};

export type IncidentType =
  | 'TRAFFIC'
  | 'FULL_BUS'
  | 'NO_BUS_PASSING'
  | 'ACCIDENT';

export type Incident = {
  id: string;
  type: IncidentType;
  routeId: string | null;
  location: LatLng;
  reportedAt: string;
  reportedBy?: string;
};

export type IncidentReportedEvent = {
  type: 'incident_reported';
  incidentId: string;
  incidentType: IncidentType;
  routeId: string | null;
  location: LatLng;
};

export type WaitSession = {
  id: string;
  location: LatLng;
  routeId?: string;
  alertBeforeSeconds: number;
  createdAt: string;
};

export type WaitSessionAlertEvent = {
  type: 'wait_session_alert';
  waitSessionId: string;
  busId: string;
  routeCode: string;
  etaSeconds: number;
  distanceM: number;
};

export type AdminMetrics = {
  activeUsers: number;
  activeTrips: number;
  aiQuestionsPerMinute: number;
  incidentsLastHour: number;
  busesInService: number;
};

export type MetricsUpdateEvent = {
  type: 'metrics_update';
  metrics: AdminMetrics;
};

export type AgentAction =
  | 'asked_ai'
  | 'started_trip'
  | 'completed_trip'
  | 'reported_incident'
  | 'boarded';

export type AgentEvent = {
  type: 'user_action' | 'agent_action';
  userId: string;
  userName: string;
  agentProfile?: string;
  action: AgentAction;
  payload: Record<string, unknown>;
  location: LatLng;
  timestamp: string;
};

export type RealtimeEvent =
  | BusPosition
  | TripUpdateEvent
  | IncidentReportedEvent
  | WaitSessionAlertEvent
  | MetricsUpdateEvent
  | AgentEvent;

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  suggestedAction?: SuggestedAction | null;
  alternatives?: AlternativeRoute[];
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

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

export type User = {
  id: string;
  email: string;
  name?: string;
  city?: string;
  tripsCount?: number;
  favoritesCount?: number;
};

export type BusServiceStatus = 'IN_SERVICE' | 'OUT_OF_SERVICE' | 'COMPLETED';

export type BusDetails = {
  id: string;
  plate: string;
  location: LatLng;
  heading: number;
  speedKmh: number;
  fractionOfCorridor: number;
  status: BusServiceStatus;
  lastSeenAt: string;
  route: {
    id: string;
    code: string;
    name: string;
    color: string;
    mode: 'TRADITIONAL' | 'BRT' | 'METRO';
    operator: string | null;
    lengthKm: number | null;
  };
  polyline: LatLng[];
  nextLandmark: {
    id: string;
    name: string;
    location: LatLng;
    etaSeconds: number;
    distanceM: number;
  } | null;
  etaToUser: {
    etaSeconds: number;
    distanceM: number;
    nearestCorridorPoint: LatLng;
  } | null;
  stats: {
    completedKm: number;
    completedPct: number;
    remainingKm: number;
  };
};

export type GeocodeSuggestion = {
  id: string;
  label: string;
  fullAddress: string;
  location: LatLng;
  category: string | null;
};

/**
 * Predicción de autocomplete (Google Places NEW o Mapbox).
 *
 * - Google Places NEW: trae solo placeId + texto, sin lat/lng. Hay que
 *   llamar Place Details para resolver location al hacer click.
 * - Mapbox / backend /geocode: trae location inline (no requiere segunda
 *   llamada). En ese caso `location` está presente y `placeId` no.
 *
 * El consumidor (AddressSearchBar) usa `location` para decidir si necesita
 * resolver: si está presente, usa esos datos; si no, llama a Place Details.
 */
export type PlacePrediction = {
  id: string;
  label: string;
  fullAddress: string;
  category: string | null;
  /** Solo Google: necesario para Place Details. */
  placeId?: string;
  /** Solo Mapbox / fallback: location ya resuelta. */
  location?: LatLng;
};

/**
 * Recomendación de ruta puerta-a-puerta del endpoint /routing/recommend.
 * Una opción de "para ir de aquí a allá, toma este bus".
 *
 * (Distinto de `RouteRecommendation` legacy del asistente, que es mucho
 * más simple — TripRouteRecommendation es la versión "completa" con
 * caminata + bus + polyline.)
 */
export type TripRouteRecommendation = {
  rank: number;
  totalMinutes: number;
  walkingToBoard: {
    paradero: { id: string; name: string; lat: number; lng: number };
    distanceM: number;
    blocks: number;
    durationMinutes: number;
  };
  bus: {
    id: string;
    plate: string;
    routeId: string;
    routeCode: string;
    routeName: string;
    routeColor: string;
    waitMinutes: number;
    rideMinutes: number;
  };
  walkingFromAlight: {
    paradero: { id: string; name: string; lat: number; lng: number };
    distanceM: number;
    blocks: number;
    durationMinutes: number;
  };
  polylineBus: LatLng[];
};

export type TripRouteRecommendResponse = {
  userLocation: LatLng;
  destination: LatLng;
  recommendations: TripRouteRecommendation[];
  generatedAt: string;
};

export type ApiErrorShape = {
  statusCode: number;
  message: string;
  error: string;
  path?: string;
  timestamp?: string;
};
