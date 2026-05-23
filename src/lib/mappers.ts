import type {
  Paradero,
  Ruta,
  RutaEstado,
  Bus,
  OperatorId,
  Trip,
  AssistantAskResponse,
  SuggestedAction,
  WaitSession,
  Incident,
  User,
  ChatMessage,
} from '../types';
import type {
  BackendLandmarkDetail,
  BackendLandmarkNearbyItem,
  BackendBusesAtPointResponse,
  BackendRoute,
  BackendBus,
  BackendTrip,
  BackendAssistantAskResponse,
  BackendSuggestedAction,
  BackendWaitSession,
  BackendIncident,
  BackendMe,
  BackendAssistantMessage,
} from '../types/backend';

// ============================================================
// Routes / Operators
// ============================================================

export function operatorFromRoute(r: BackendRoute): OperatorId {
  const op = r.operator?.toLowerCase() ?? '';
  if (op.includes('amarill')) return 'bus_amarillo_pto';
  return 'bus_azul_pto';
}

export function statusToFrontend(
  s: 'OPERATING' | 'LOW_FREQUENCY' | 'OFFLINE',
): RutaEstado {
  if (s === 'LOW_FREQUENCY') return 'frecuencia_baja';
  if (s === 'OFFLINE') return 'ultimo_bus';
  return 'operando';
}

// ============================================================
// Paradero ← Landmark (+ opcional buses-at-point)
// ============================================================

export function landmarkDetailToParadero(
  detail: BackendLandmarkDetail,
  busesAtPoint?: BackendBusesAtPointResponse,
): Paradero {
  const etasByRouteId = new Map<
    string,
    { etaMinutos: number; estado: RutaEstado }
  >();
  if (busesAtPoint) {
    for (const r of busesAtPoint.routes) {
      const firstBus = r.next_buses[0];
      etasByRouteId.set(r.route.id, {
        etaMinutos:
          firstBus?.eta_seconds != null
            ? Math.max(1, Math.round(firstBus.eta_seconds / 60))
            : 0,
        estado: statusToFrontend(r.status),
      });
    }
  }

  return {
    id: detail.id,
    nombre: detail.name,
    direccion: detail.address ?? '',
    lat: detail.location.lat,
    lng: detail.location.lng,
    rutas: detail.routes.map<Ruta>((r) => {
      const eta = etasByRouteId.get(r.id);
      return {
        id: r.id,
        nombre: r.code,
        destino: r.name,
        etaMinutos: eta?.etaMinutos ?? 0,
        estado: eta?.estado ?? statusToFrontend(r.status),
      };
    }),
  };
}

export function landmarkNearbyToParadero(
  item: BackendLandmarkNearbyItem,
): Paradero {
  return {
    id: item.id,
    nombre: item.name,
    direccion: item.address ?? '',
    lat: item.location.lat,
    lng: item.location.lng,
    rutas: [],
  };
}

// ============================================================
// Bus
// ============================================================

export function backendBusToBus(
  b: BackendBus,
  routeCode: string,
  route: BackendRoute,
): Bus {
  return {
    id: b.id,
    rutaNombre: routeCode,
    lat: b.location.lat,
    lng: b.location.lng,
    heading: b.heading ?? 0,
    operatorId: operatorFromRoute(route),
  };
}

export function busesAtPointToBusList(resp: BackendBusesAtPointResponse): Bus[] {
  const out: Bus[] = [];
  for (const r of resp.routes) {
    for (const nb of r.next_buses) {
      out.push({
        id: nb.bus_id,
        rutaNombre: r.route.code,
        lat: nb.current_location.lat,
        lng: nb.current_location.lng,
        heading: 0,
        operatorId: operatorFromRoute(r.route),
      });
    }
  }
  return out;
}

// ============================================================
// Trip
// ============================================================

export function backendTripToTrip(t: BackendTrip): Trip {
  const eta = t.estimated_arrival_at
    ? new Date(t.estimated_arrival_at).getTime()
    : null;
  const remaining =
    eta != null ? Math.max(0, Math.round((eta - Date.now()) / 1000)) : 0;

  return {
    id: t.id,
    routeId: t.route.id,
    routeCode: t.route.code,
    boardingLocation: t.boarding_location,
    dropoffLocation: t.dropoff_location,
    status: t.status,
    startedAt: t.started_at,
    completedAt: t.ended_at ?? undefined,
    remainingSeconds: remaining,
    currentLocation: undefined,
  };
}

// ============================================================
// Wait session
// ============================================================

export function backendWaitSessionToWaitSession(
  w: BackendWaitSession,
): WaitSession {
  return {
    id: w.id,
    location: w.location,
    routeId: w.route?.id,
    alertBeforeSeconds: w.notify_seconds_before,
    createdAt: w.started_at,
  };
}

// ============================================================
// Incident
// ============================================================

export function backendIncidentToIncident(i: BackendIncident): Incident {
  return {
    id: i.id,
    type: i.type,
    routeId: i.route?.id ?? null,
    location: i.location,
    reportedAt: i.reported_at,
    reportedBy: i.reporter_name ?? undefined,
  };
}

// ============================================================
// Assistant
// ============================================================

export function backendActionToFrontendAction(
  a: BackendSuggestedAction | null,
): SuggestedAction | null {
  if (!a) return null;
  switch (a.type) {
    case 'START_TRIP':
      return {
        type: 'START_TRIP',
        routeId: a.payload.route_id,
        routeCode: a.payload.route_code,
      };
    case 'SHOW_ROUTE':
      return { type: 'SHOW_ROUTE', routeId: a.payload.route_id, routeCode: '' };
    case 'SHOW_LANDMARK':
      return { type: 'SHOW_LANDMARK', landmarkId: a.payload.landmark_id };
    case 'OPEN_WAIT_PIN':
      return {
        type: 'OPEN_WAIT_PIN',
        location: a.payload.location,
        routeId: a.payload.route_id,
      };
  }
}

export function backendAssistantAskToFrontend(
  r: BackendAssistantAskResponse,
): AssistantAskResponse {
  return {
    answer: r.answer,
    suggested_action: backendActionToFrontendAction(r.suggested_action),
  };
}

export function backendAssistantMessageToChatMessage(
  m: BackendAssistantMessage,
): { user: ChatMessage; assistant: ChatMessage } {
  return {
    user: {
      id: `${m.id}-q`,
      role: 'user',
      content: m.question,
      createdAt: m.created_at,
    },
    assistant: {
      id: `${m.id}-a`,
      role: 'assistant',
      content: m.answer,
      suggestedAction: backendActionToFrontendAction(m.suggested_action),
      createdAt: m.created_at,
    },
  };
}

// ============================================================
// User
// ============================================================

export function backendMeToUser(m: BackendMe): User {
  return {
    id: m.id,
    email: m.email,
    name: m.name ?? undefined,
    city: m.city_code,
    tripsCount: m.trips_count,
    favoritesCount: m.favorites_count,
  };
}
