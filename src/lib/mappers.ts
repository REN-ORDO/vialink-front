import type {
  Paradero,
  Ruta,
  RutaEstado,
  Bus,
  BusDetails,
  OperatorId,
  Trip,
  AssistantAskResponse,
  SuggestedAction,
  WaitSession,
  Incident,
  User,
  ChatMessage,
  GeocodeSuggestion,
  TripRouteRecommendation,
  TripRouteRecommendResponse,
} from '../types';
import type {
  BackendLandmarkDetail,
  BackendLandmarkNearbyItem,
  BackendBusesAtPointResponse,
  BackendRoute,
  BackendBus,
  BackendBusDetailsResponse,
  BackendTrip,
  BackendAssistantAskResponse,
  BackendSuggestedAction,
  BackendWaitSession,
  BackendIncident,
  BackendMe,
  BackendAssistantMessage,
  BackendGeocodeResult,
  BackendRouteRecommendation,
  BackendRouteRecommendResponse,
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

/**
 * Heuristica para asignar operatorId cuando solo conocemos route_code
 * (snapshot /buses, WS bus_position events). Codigos T* son Transmetro
 * (BRT) → amarillo. El resto → azul.
 */
export function operatorFromRouteCode(routeCode: string): OperatorId {
  if (routeCode.startsWith('T')) return 'bus_amarillo_pto';
  return 'bus_azul_pto';
}

/** Mapea BackendBusListItem (snapshot GET /buses) → Bus. */
export function backendBusListItemToBus(
  b: import('../types/backend').BackendBusListItem,
): Bus {
  return {
    id: b.id,
    rutaNombre: b.route_code,
    lat: b.location.lat,
    lng: b.location.lng,
    heading: b.heading ?? 0,
    operatorId: operatorFromRouteCode(b.route_code),
  };
}

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

// ============================================================
// Bus details (modal click-on-bus)
// ============================================================

export function backendBusDetailsToBusDetails(
  d: BackendBusDetailsResponse,
): BusDetails {
  return {
    id: d.bus.id,
    plate: d.bus.plate,
    location: d.bus.location,
    heading: d.bus.heading ?? 0,
    speedKmh: d.bus.speed_kmh,
    fractionOfCorridor: d.bus.fraction_of_corridor,
    status: d.bus.status,
    lastSeenAt: d.bus.last_seen_at,
    route: {
      id: d.route.id,
      code: d.route.code,
      name: d.route.name,
      color: d.route.color,
      mode: d.route.mode,
      operator: d.route.operator,
      lengthKm: d.route.length_km,
    },
    polyline: d.polyline.geometry.coordinates.map(([lng, lat]) => ({
      lat,
      lng,
    })),
    nextLandmark: d.next_landmark
      ? {
          id: d.next_landmark.id,
          name: d.next_landmark.name,
          location: d.next_landmark.location,
          etaSeconds: d.next_landmark.eta_seconds,
          distanceM: d.next_landmark.distance_m,
        }
      : null,
    etaToUser: d.eta_to_user
      ? {
          etaSeconds: d.eta_to_user.eta_seconds,
          distanceM: d.eta_to_user.distance_m,
          nearestCorridorPoint: d.eta_to_user.nearest_corridor_point,
        }
      : null,
    stats: {
      completedKm: d.stats.completed_km,
      completedPct: d.stats.completed_pct,
      remainingKm: d.stats.remaining_km,
    },
  };
}

// ============================================================
// Geocoding
// ============================================================

export function backendGeocodeResultToSuggestion(
  r: BackendGeocodeResult,
): GeocodeSuggestion {
  return {
    id: btoa(unescape(encodeURIComponent(r.formatted_address))).slice(0, 16),
    label: r.formatted_address.split(',').slice(0, 2).join(',').trim(),
    fullAddress: r.formatted_address,
    location: r.location,
    category: r.category,
  };
}

// ============================================================
// Routing (recomendación puerta-a-puerta)
// ============================================================

export function backendRouteRecToTripRouteRec(
  b: BackendRouteRecommendation,
): TripRouteRecommendation {
  return {
    rank: b.rank,
    totalMinutes: b.total_minutes,
    walkingToBoard: {
      paradero: b.walking_to_board.paradero,
      distanceM: b.walking_to_board.distance_m,
      blocks: b.walking_to_board.blocks,
      durationMinutes: b.walking_to_board.duration_minutes,
    },
    bus: {
      id: b.bus.id,
      plate: b.bus.plate,
      routeId: b.bus.route_id,
      routeCode: b.bus.route_code,
      routeName: b.bus.route_name,
      routeColor: b.bus.route_color,
      waitMinutes: b.bus.wait_minutes,
      rideMinutes: b.bus.ride_minutes,
    },
    walkingFromAlight: {
      paradero: b.walking_from_alight.paradero,
      distanceM: b.walking_from_alight.distance_m,
      blocks: b.walking_from_alight.blocks,
      durationMinutes: b.walking_from_alight.duration_minutes,
    },
    polylineBus: b.polyline_bus,
  };
}

export function backendRouteRecommendResponseToTripRouteRec(
  r: BackendRouteRecommendResponse,
): TripRouteRecommendResponse {
  return {
    userLocation: r.user_location,
    destination: r.destination,
    recommendations: r.recommendations.map(backendRouteRecToTripRouteRec),
    generatedAt: r.generated_at,
  };
}
