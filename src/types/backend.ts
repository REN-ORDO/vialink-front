/**
 * Tipos EXACTOS de lo que el backend Vialink retorna.
 * NO importar estos tipos desde componentes. Solo desde mappers.ts y dataSource.ts.
 */

import type { LatLng } from './index';

// ===== Common =====
export type BackendLatLng = LatLng;

// ===== Landmarks =====
export type BackendLandmarkType =
  | 'UNIVERSITY' | 'MALL' | 'HOSPITAL' | 'SQUARE'
  | 'TRANSPORT_HUB' | 'NEIGHBORHOOD' | 'LANDMARK';

export interface BackendLandmark {
  id: string;
  name: string;
  type: BackendLandmarkType;
  address: string | null;
  location: LatLng;
}

export interface BackendLandmarkNearbyItem extends BackendLandmark {
  distance_m: number;
  routes_passing_count: number;
}

export interface BackendLandmarkNearbyResponse {
  landmarks: BackendLandmarkNearbyItem[];
}

export interface BackendLandmarkDetail extends BackendLandmark {
  routes: Array<{
    id: string;
    code: string;
    name: string;
    color: string;
    mode: BackendRouteMode;
    distance_to_corridor_m: number;
    status: 'OPERATING' | 'LOW_FREQUENCY' | 'OFFLINE';
  }>;
}

export interface BackendLandmarkSearchResponse {
  results: Array<{
    id: string;
    name: string;
    type: BackendLandmarkType;
    location: LatLng;
  }>;
}

// ===== Routes =====
export type BackendRouteMode = 'TRADITIONAL' | 'BRT' | 'METRO';

export interface BackendRoute {
  id: string;
  code: string;
  name: string;
  color: string;
  mode: BackendRouteMode;
  operator: string | null;
}

export interface BackendRouteListItem extends BackendRoute {
  landmarks_count: number;
  length_km: number | null;
}

export interface BackendRouteListResponse {
  routes: BackendRouteListItem[];
}

export interface BackendRouteDetail extends BackendRoute {
  length_km: number | null;
  landmarks: Array<{
    id: string;
    name: string;
    type: string;
    fraction_of_corridor: number;
    distance_to_corridor_m: number;
  }>;
  active_buses_count: number;
}

export interface BackendNearbyRouteItem {
  id: string;
  code: string;
  name: string;
  color: string;
  mode: BackendRouteMode;
  distance_m: number;
}

export interface BackendNearbyRoutesResponse {
  routes: BackendNearbyRouteItem[];
}

export interface BackendCorridorGeoJSON {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  properties: {
    route_id: string;
    code: string;
    color: string;
  };
}

// ===== Buses =====
export interface BackendBus {
  id: string;
  plate: string;
  location: LatLng;
  heading: number | null;
  speed_kmh: number;
  fraction_of_corridor: number;
  last_seen_at: string;
}

export interface BackendRouteBusesResponse {
  buses: BackendBus[];
}

/** Item del endpoint GET /buses — snapshot inicial de TODOS los buses. */
export interface BackendBusListItem {
  id: string;
  plate: string;
  route_id: string;
  route_code: string;
  location: LatLng;
  heading: number | null;
  speed_kmh: number;
  fraction_of_corridor: number;
  status: 'IN_SERVICE' | 'OUT_OF_SERVICE' | 'BREAK';
  last_seen_at: string;
}

export interface BackendBusListResponse {
  city: string;
  count: number;
  buses: BackendBusListItem[];
}

// ===== Buses at point (endpoint estrella) =====
export interface BackendNextBus {
  bus_id: string;
  plate: string;
  eta_seconds: number | null;
  distance_m: number;
  current_location: LatLng;
}

export interface BackendBusesAtPointRoute {
  route: BackendRoute;
  distance_to_corridor_m: number;
  next_buses: BackendNextBus[];
  status: 'OPERATING' | 'LOW_FREQUENCY' | 'OFFLINE';
}

export interface BackendBusesAtPointResponse {
  location: LatLng;
  routes: BackendBusesAtPointRoute[];
}

// ===== Bus details (modal click-on-bus) =====
export type BackendBusServiceStatus =
  | 'IN_SERVICE'
  | 'OUT_OF_SERVICE'
  | 'COMPLETED';

export interface BackendBusDetailsBus {
  id: string;
  plate: string;
  location: LatLng;
  heading: number | null;
  speed_kmh: number;
  fraction_of_corridor: number;
  status: BackendBusServiceStatus;
  last_seen_at: string;
}

export interface BackendBusDetailsRoute {
  id: string;
  code: string;
  name: string;
  color: string;
  mode: BackendRouteMode;
  operator: string | null;
  length_km: number | null;
}

export interface BackendBusDetailsNextLandmark {
  id: string;
  name: string;
  type: BackendLandmarkType;
  location: LatLng;
  eta_seconds: number;
  distance_m: number;
}

export interface BackendBusDetailsEtaToUser {
  eta_seconds: number;
  distance_m: number;
  nearest_corridor_point: LatLng;
}

export interface BackendBusDetailsStats {
  completed_km: number;
  completed_pct: number;
  remaining_km: number;
}

export interface BackendBusDetailsResponse {
  bus: BackendBusDetailsBus;
  route: BackendBusDetailsRoute;
  polyline: BackendCorridorGeoJSON;
  next_landmark: BackendBusDetailsNextLandmark | null;
  eta_to_user: BackendBusDetailsEtaToUser | null;
  stats: BackendBusDetailsStats;
}

// ===== Geocode =====
export type BackendGeocodeCategory =
  | 'address'
  | 'street'
  | 'place'
  | 'poi'
  | 'neighborhood'
  | 'locality';

export interface BackendGeocodeResult {
  formatted_address: string;
  location: { lat: number; lng: number };
  category: BackendGeocodeCategory | null;
  relevance: number;
  source: 'mapbox' | 'cache';
}

export interface BackendGeocodeResponse {
  query: string;
  results: BackendGeocodeResult[];
  cached: boolean;
  latency_ms: number;
}

// ===== Auth =====
export interface BackendAuthSession {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface BackendMe {
  id: string;
  email: string;
  name: string | null;
  city_code: string;
  city_name: string;
  favorites_count: number;
  trips_count: number;
}

// ===== Favorites =====
export type BackendFavoriteTarget = 'LANDMARK' | 'ROUTE';

export interface BackendFavorite {
  id: string;
  target_type: BackendFavoriteTarget;
  alias: string | null;
  created_at: string;
  landmark: BackendLandmark | null;
  route: {
    id: string;
    code: string;
    name: string;
    color: string;
    mode: BackendRouteMode;
  } | null;
}

export interface BackendFavoritesResponse {
  favorites: BackendFavorite[];
}

// ===== Trips =====
export type BackendTripStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface BackendTrip {
  id: string;
  route: { id: string; code: string; color: string };
  bus: { id: string; plate: string } | null;
  boarding_location: LatLng;
  dropoff_location: LatLng;
  boarding_landmark_id: string | null;
  dropoff_landmark_id: string | null;
  started_at: string;
  ended_at: string | null;
  estimated_arrival_at: string | null;
  status: BackendTripStatus;
}

export interface BackendActiveTripResponse {
  trip: BackendTrip | null;
}

// ===== Wait sessions =====
export interface BackendWaitSession {
  id: string;
  location: LatLng;
  route: { id: string; code: string; color: string } | null;
  notify_seconds_before: number;
  status: 'WAITING' | 'ALERTED' | 'BOARDED' | 'CANCELLED' | 'EXPIRED';
  started_at: string;
}

// ===== Incidents =====
export type BackendIncidentType =
  | 'TRAFFIC' | 'FULL_BUS' | 'NO_BUS_PASSING' | 'ACCIDENT';

export interface BackendIncident {
  id: string;
  type: BackendIncidentType;
  route: { id: string; code: string | null } | null;
  location: LatLng;
  description: string | null;
  reported_at: string;
  reporter_name: string | null;
}

export interface BackendIncidentsNearbyResponse {
  incidents: BackendIncident[];
}

// ===== Assistant =====
export type BackendSuggestedAction =
  | {
      type: 'START_TRIP';
      payload: {
        route_id: string;
        route_code: string;
        boarding_location: LatLng;
        dropoff_landmark_id?: string;
        dropoff_location?: LatLng;
        estimated_duration_seconds: number;
      };
    }
  | { type: 'SHOW_ROUTE'; payload: { route_id: string } }
  | { type: 'SHOW_LANDMARK'; payload: { landmark_id: string } }
  | { type: 'OPEN_WAIT_PIN'; payload: { location: LatLng; route_id?: string } };

export interface BackendAssistantAskResponse {
  answer: string;
  suggested_action: BackendSuggestedAction | null;
  latency_ms: number;
  tool_calls: Array<{
    name: string;
    input: Record<string, unknown>;
    ms: number;
  }>;
}

export interface BackendAssistantMessage {
  id: string;
  question: string;
  answer: string;
  suggested_action: BackendSuggestedAction | null;
  latency_ms: number | null;
  created_at: string;
}

export interface BackendAssistantMessagesResponse {
  messages: BackendAssistantMessage[];
}

// ===== Admin =====
export interface BackendAdminMetricsPayload {
  active_users: number;
  active_trips: number;
  ai_questions_per_minute: number;
  incidents_last_hour: number;
  buses_in_service: number;
  active_wait_sessions: number;
}

export interface BackendAdminMetrics {
  metrics: BackendAdminMetricsPayload;
  source: 'cached_2s' | 'fresh';
}

export type BackendFeedEventType =
  | 'trip_started' | 'trip_completed' | 'trip_cancelled'
  | 'incident_reported' | 'assistant_question'
  | 'rating_given' | 'favorite_saved' | 'agent_action';

export interface BackendFeedEvent {
  id: string;
  type: BackendFeedEventType;
  occurred_at: string;
  actor_name: string | null;
  payload: Record<string, unknown>;
}

export interface BackendAdminFeedResponse {
  events: BackendFeedEvent[];
}

export interface BackendSimulatorStatus {
  status: 'RUNNING' | 'STOPPED';
  agent_count: number;
  agents_by_profile: Record<string, number>;
  actions_last_minute: number;
  llm_calls_last_minute: number;
  ticks_processed: number;
  last_tick_ms: number | null;
  started_at: string | null;
}

// ===== WebSocket events (raw backend) =====
export interface BackendBusPositionEvent {
  type: 'bus_position';
  busId: string;
  routeId: string;
  routeCode: string;
  cityCode: string;
  location: LatLng;
  heading: number | null;
  speedKmh: number;
  fractionOfCorridor: number;
  timestamp: string;
}

export interface BackendTripUpdateEvent {
  type: 'trip_update';
  tripId: string;
  userId: string;
  routeId: string;
  busId?: string;
  status: BackendTripStatus;
  currentLocation?: LatLng;
  remainingSeconds?: number;
  timestamp: string;
}

export interface BackendIncidentReportedEvent {
  type: 'incident_reported';
  incidentId: string;
  incidentType: BackendIncidentType;
  routeId: string | null;
  cityCode: string;
  location: LatLng;
  timestamp: string;
}

export interface BackendWaitSessionAlertEvent {
  type: 'wait_session_alert';
  waitSessionId: string;
  userId: string;
  busId: string;
  routeCode: string;
  etaSeconds: number;
  distanceM: number;
  timestamp: string;
}

export interface BackendAgentActionEvent {
  type: 'agent_action';
  agentId: string;
  agentName: string;
  agentProfile: string;
  action:
    | 'walked' | 'started_waiting' | 'boarded' | 'asked_ai'
    | 'started_trip' | 'completed_trip' | 'rated_trip'
    | 'reported_incident' | 'saved_favorite';
  payload: Record<string, unknown>;
  location: LatLng | null;
  cityCode: string;
  timestamp: string;
}

export interface BackendMetricsUpdateEvent {
  type: 'metrics_update';
  cityCode: string;
  metrics: {
    activeUsers: number;
    activeTrips: number;
    aiQuestionsPerMinute: number;
    incidentsLastHour: number;
    busesInService: number;
  };
  timestamp: string;
}
