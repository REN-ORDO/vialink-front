import { api, ApiError, USE_MOCKS } from './api';
import { paraderosMock } from './mockData';
import { mockAskAssistant } from './llmMock';
import {
  autocompletePlaces,
  getPlaceDetails,
  hasGooglePlacesKey,
} from './googlePlaces';
import {
  landmarkDetailToParadero,
  landmarkNearbyToParadero,
  busesAtPointToBusList,
  backendBusToBus,
  backendBusListItemToBus,
  backendBusDetailsToBusDetails,
  backendTripToTrip,
  backendWaitSessionToWaitSession,
  backendIncidentToIncident,
  backendAssistantAskToFrontend,
  backendMeToUser,
  backendAssistantMessageToChatMessage,
  backendGeocodeResultToSuggestion,
  backendRouteRecommendResponseToTripRouteRec,
  backendRouteRecommendSmartToTripRouteRec,
} from './mappers';
import type {
  AlternativeRoute,
  AssistantAskResponse,
  AuthTokens,
  Bus,
  BusDetails,
  ChatMessage,
  GeocodeSuggestion,
  Incident,
  LatLng,
  Paradero,
  PlacePrediction,
  RouteRecommendation,
  Trip,
  TripRouteRecommendResponse,
  TripRouteRecommendSmartResponse,
  User,
  WaitSession,
} from '../types';
import type {
  BackendActiveTripResponse,
  BackendAdminFeedResponse,
  BackendAdminMetrics,
  BackendAdminMetricsPayload,
  BackendAssistantAskResponse,
  BackendAssistantMessagesResponse,
  BackendAuthSession,
  BackendBusDetailsResponse,
  BackendBusListResponse,
  BackendBusesAtPointResponse,
  BackendRouteRecommendResponse,
  BackendRouteRecommendSmartResponse,
  BackendWalkDirections,
  BackendCorridorGeoJSON,
  BackendFavoritesResponse,
  BackendGeocodeResponse,
  BackendIncidentsNearbyResponse,
  BackendLandmarkDetail,
  BackendLandmarkNearbyResponse,
  BackendLandmarkSearchResponse,
  BackendMe,
  BackendNearbyRoutesResponse,
  BackendRouteBusesResponse,
  BackendRouteDetail,
  BackendRouteListResponse,
  BackendSimulatorStatus,
  BackendTrip,
  BackendWaitSession,
} from '../types/backend';
import { busesMock } from './mockData';

type BusesAtPointResult = {
  routes: BackendBusesAtPointResponse['routes'];
  busesFlat: Bus[];
};

export const dataSource = {
  useMocks: USE_MOCKS,

  // ============================================================
  // DISCOVERY · Landmarks
  // ============================================================
  async getLandmarksNearby(location?: LatLng, radiusM = 1500): Promise<Paradero[]> {
    if (USE_MOCKS) return paraderosMock;
    const lat = location?.lat ?? 11.0041;
    const lng = location?.lng ?? -74.807;
    try {
      const raw = await api.get<BackendLandmarkNearbyResponse>(
        `/landmarks/nearby?lat=${lat}&lng=${lng}&radius_m=${radiusM}`,
      );
      return raw.landmarks.map(landmarkNearbyToParadero);
    } catch (err) {
      if (err instanceof ApiError) return paraderosMock;
      throw err;
    }
  },

  async getLandmark(id: string): Promise<Paradero> {
    if (USE_MOCKS) {
      const found = paraderosMock.find((p) => p.id === id);
      if (!found) throw new Error(`Paradero ${id} no encontrado`);
      return found;
    }
    const detail = await api.get<BackendLandmarkDetail>(`/landmarks/${id}`);
    try {
      const buses = await api.post<BackendBusesAtPointResponse>(
        '/buses-at-point',
        { location: detail.location, radius_m: 100 },
      );
      return landmarkDetailToParadero(detail, buses);
    } catch {
      return landmarkDetailToParadero(detail);
    }
  },

  async searchLandmarks(query: string, limit = 10) {
    if (USE_MOCKS) {
      const q = query.toLowerCase();
      return paraderosMock
        .filter((p) => p.nombre.toLowerCase().includes(q))
        .slice(0, limit)
        .map((p) => ({
          id: p.id,
          name: p.nombre,
          type: 'LANDMARK' as const,
          location: { lat: p.lat, lng: p.lng },
        }));
    }
    const raw = await api.get<BackendLandmarkSearchResponse>(
      `/landmarks/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return raw.results;
  },

  // ============================================================
  // DISCOVERY · Buses-at-point
  // ============================================================
  async getBusesAtPoint(
    location: LatLng,
    radiusM = 100,
  ): Promise<BusesAtPointResult> {
    if (USE_MOCKS) {
      return { routes: [], busesFlat: [] };
    }
    const raw = await api.post<BackendBusesAtPointResponse>('/buses-at-point', {
      location,
      radius_m: radiusM,
    });
    return {
      routes: raw.routes,
      busesFlat: busesAtPointToBusList(raw),
    };
  },

  // ============================================================
  // DISCOVERY · Routes
  // ============================================================
  async listRoutes(mode?: 'TRADITIONAL' | 'BRT' | 'METRO') {
    if (USE_MOCKS) return [];
    const q = mode ? `?mode=${mode}` : '';
    const raw = await api.get<BackendRouteListResponse>(`/routes${q}`);
    return raw.routes;
  },

  async getRoute(id: string) {
    if (USE_MOCKS) throw new Error('No disponible en mocks');
    return api.get<BackendRouteDetail>(`/routes/${id}`);
  },

  async getRouteCorridor(id: string): Promise<BackendCorridorGeoJSON> {
    if (USE_MOCKS) {
      return {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [] },
        properties: { route_id: id, code: '?', color: '#1E5EFF' },
      };
    }
    return api.get<BackendCorridorGeoJSON>(`/routes/${id}/corridor.geojson`);
  },

  async getRouteBuses(routeId: string): Promise<Bus[]> {
    if (USE_MOCKS) return [];
    const [route, raw] = await Promise.all([
      api.get<BackendRouteDetail>(`/routes/${routeId}`),
      api.get<BackendRouteBusesResponse>(`/routes/${routeId}/buses`),
    ]);
    return raw.buses.map((b) => backendBusToBus(b, route.code, route));
  },

  /**
   * Snapshot inicial de TODOS los buses IN_SERVICE en la ciudad.
   * Pensado para que MapaPage popule el mapa al cargar antes de
   * empezar a recibir bus_position por WebSocket (room city:BAQ).
   *
   * Si el backend falla, devolvemos busesMock como fallback grácil
   * para que el mapa nunca quede vacio en demo.
   */
  async listAllBuses(city = 'BAQ'): Promise<Bus[]> {
    if (USE_MOCKS) return busesMock;
    try {
      const raw = await api.get<BackendBusListResponse>(`/buses?city=${city}`);
      return raw.buses.map(backendBusListItemToBus);
    } catch (err) {
      if (err instanceof ApiError) {
        console.warn('listAllBuses fallback a mock:', err.message);
        return busesMock;
      }
      throw err;
    }
  },

  // ============================================================
  // DISCOVERY · Bus details (modal click-on-bus)
  // ============================================================
  async getBusDetails(
    busId: string,
    userLocation?: LatLng,
  ): Promise<BusDetails> {
    if (USE_MOCKS) {
      const found = busesMock.find((b) => b.id === busId);
      if (!found) throw new ApiError(404, `Bus ${busId} no encontrado`);
      return {
        id: found.id,
        plate: `MOCK-${found.id.toUpperCase()}`,
        location: { lat: found.lat, lng: found.lng },
        heading: found.heading,
        speedKmh: 22,
        fractionOfCorridor: 0.4,
        status: 'IN_SERVICE',
        lastSeenAt: new Date().toISOString(),
        route: {
          id: `mock-route-${found.rutaNombre}`,
          code: found.rutaNombre,
          name: `Ruta ${found.rutaNombre}`,
          color: '#1E5EFF',
          mode: 'TRADITIONAL',
          operator: 'Mock Operator',
          lengthKm: 12.5,
        },
        polyline: [
          { lat: found.lat - 0.01, lng: found.lng - 0.01 },
          { lat: found.lat, lng: found.lng },
          { lat: found.lat + 0.01, lng: found.lng + 0.01 },
        ],
        nextLandmark: {
          id: 'mock-lm',
          name: 'Próximo paradero',
          location: { lat: found.lat + 0.005, lng: found.lng + 0.005 },
          etaSeconds: 180,
          distanceM: 600,
        },
        etaToUser: userLocation
          ? {
              etaSeconds: 240,
              distanceM: 900,
              nearestCorridorPoint: { lat: found.lat, lng: found.lng },
            }
          : null,
        stats: {
          completedKm: 5.0,
          completedPct: 0.4,
          remainingKm: 7.5,
        },
      };
    }
    const params = new URLSearchParams();
    if (userLocation) {
      params.set('lat', userLocation.lat.toString());
      params.set('lng', userLocation.lng.toString());
    }
    const qs = params.toString();
    const path = `/buses/${busId}/details${qs ? `?${qs}` : ''}`;
    const raw = await api.get<BackendBusDetailsResponse>(path);
    return backendBusDetailsToBusDetails(raw);
  },

  async getRoutesNearby(location: LatLng, radiusM = 100) {
    if (USE_MOCKS) return [];
    const raw = await api.get<BackendNearbyRoutesResponse>(
      `/routes/nearby?lat=${location.lat}&lng=${location.lng}&radius_m=${radiusM}`,
    );
    return raw.routes;
  },

  /**
   * Recomendación puerta-a-puerta de cómo llegar de A a B en bus.
   * Devuelve top N opciones rankeadas por tiempo total.
   *
   * Cada recomendación incluye: paradero de abordaje + cuadras camina,
   * bus específico (id, plate, ruta) + espera y tiempo de viaje,
   * paradero de descenso + cuadras al destino, polyline del bus.
   */
  async recommendRoute(input: {
    userLocation: LatLng;
    destination: LatLng;
    maxWalkingM?: number;
    maxAlternatives?: number;
  }): Promise<TripRouteRecommendResponse> {
    if (USE_MOCKS) {
      // Mock: una sola rec degenerada para que la UI no quede vacía en mocks.
      return {
        userLocation: input.userLocation,
        destination: input.destination,
        recommendations: [],
        generatedAt: new Date().toISOString(),
      };
    }
    const raw = await api.post<BackendRouteRecommendResponse>(
      '/routing/recommend',
      {
        user_location: input.userLocation,
        destination: input.destination,
        max_walking_m: input.maxWalkingM ?? 500,
        max_alternatives: input.maxAlternatives ?? 3,
      },
    );
    return backendRouteRecommendResponseToTripRouteRec(raw);
  },

  /**
   * Igual que recommendRoute pero con sugerencias smart (heurísticas + LLM)
   * agregadas en `smartSuggestions`. Usa el endpoint /routing/recommend-smart.
   *
   * Costo extra: 1 call a Claude Haiku (~$0.002) por request.
   */
  async recommendRouteSmart(input: {
    userLocation: LatLng;
    destination: LatLng;
    maxWalkingM?: number;
    maxAlternatives?: number;
  }): Promise<TripRouteRecommendSmartResponse> {
    if (USE_MOCKS) {
      return {
        userLocation: input.userLocation,
        destination: input.destination,
        recommendations: [],
        smartSuggestions: [],
        generatedAt: new Date().toISOString(),
      };
    }
    const raw = await api.post<BackendRouteRecommendSmartResponse>(
      '/routing/recommend-smart',
      {
        user_location: input.userLocation,
        destination: input.destination,
        max_walking_m: input.maxWalkingM ?? 500,
        max_alternatives: input.maxAlternatives ?? 3,
      },
    );
    return backendRouteRecommendSmartToTripRouteRec(raw);
  },

  /**
   * Caminata real entre 2 puntos siguiendo calles (Mapbox walking).
   * Devuelve polyline + distance + duration. Cache 24h en backend.
   * Si backend falla, devuelve line recta como fallback.
   */
  async getWalkingRoute(from: LatLng, to: LatLng): Promise<BackendWalkDirections> {
    if (USE_MOCKS) {
      return {
        polyline: [from, to],
        distance_m: 0,
        duration_seconds: 60,
      };
    }
    try {
      return await api.post<BackendWalkDirections>('/routing/walk', { from, to });
    } catch (err) {
      console.warn('getWalkingRoute fallback línea recta:', err);
      return { polyline: [from, to], distance_m: 0, duration_seconds: 0 };
    }
  },

  // ============================================================
  // DISCOVERY · Geocoding (free-text address search)
  // ============================================================
  async geocode(
    query: string,
    proximity?: LatLng,
    limit = 5,
  ): Promise<GeocodeSuggestion[]> {
    if (USE_MOCKS) {
      const q = query.toLowerCase();
      return paraderosMock
        .filter(
          (p) =>
            p.nombre.toLowerCase().includes(q) ||
            p.direccion.toLowerCase().includes(q),
        )
        .slice(0, limit)
        .map((p) => ({
          id: p.id,
          label: p.nombre,
          fullAddress: p.direccion,
          location: { lat: p.lat, lng: p.lng },
          category: 'place' as const,
        }));
    }
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    if (proximity) {
      params.set('lat', proximity.lat.toString());
      params.set('lng', proximity.lng.toString());
    }
    try {
      const raw = await api.get<BackendGeocodeResponse>(
        `/geocode?${params.toString()}`,
      );
      return raw.results.map(backendGeocodeResultToSuggestion);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 503 || err.status === 502)) {
        console.warn('Geocoding no disponible:', err.message);
        return [];
      }
      throw err;
    }
  },

  /**
   * Búsqueda de lugares (autocomplete) — MERGE de 2 fuentes:
   *
   * 1. Internal landmarks (NUESTRA DB): Buenavista, Plaza de la Paz,
   *    Uninorte, hospitales, etc. Cobertura curada de Barranquilla.
   *    Aparece PRIMERO porque es lo que el usuario más probablemente
   *    busca y Google a veces no tiene o devuelve mal.
   *
   * 2. Google Places API (NEW) / o backend /geocode (Mapbox) si no hay
   *    Google key. Para todo lo demás (direcciones, lugares no curados).
   *
   * Las predicciones internas vienen con `location` ya resuelta —
   * resolvePlace las pasa directo sin llamada extra de red.
   */
  async searchPlaces(
    query: string,
    opts: { proximity?: LatLng; sessionToken: string; limit?: number },
  ): Promise<PlacePrediction[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) return [];

    const limit = opts.limit ?? 5;

    // 1) Internal landmarks en paralelo con la búsqueda externa
    const landmarksPromise = this.searchLandmarks(trimmed, limit)
      .catch((err) => {
        console.warn('searchLandmarks falló:', err);
        return [] as Awaited<ReturnType<typeof this.searchLandmarks>>;
      });

    let externalPromise: Promise<PlacePrediction[]>;
    if (hasGooglePlacesKey() && !USE_MOCKS) {
      externalPromise = autocompletePlaces(trimmed, {
        sessionToken: opts.sessionToken,
        proximity: opts.proximity,
      }).catch((err) => {
        console.warn('Google Places autocomplete falló:', err);
        return [];
      });
    } else {
      externalPromise = this.geocode(trimmed, opts.proximity, limit)
        .then((suggestions) =>
          suggestions.map((s) => ({
            id: s.id,
            label: s.label,
            fullAddress: s.fullAddress,
            category: s.category,
            location: s.location,
          })),
        )
        .catch(() => []);
    }

    const [landmarks, external] = await Promise.all([
      landmarksPromise,
      externalPromise,
    ]);

    // Mapear landmarks → PlacePrediction (con location ya resuelta)
    const fromLandmarks: PlacePrediction[] = landmarks.map((lm) => ({
      id: `lm:${lm.id}`,
      label: lm.name,
      fullAddress: `${lm.name} · ${lm.type.toLowerCase()}`,
      category: lm.type.toLowerCase(),
      location: lm.location,
    }));

    // Dedup por nombre normalizado: si "Buenavista" sale en ambos,
    // mantenemos el interno (más confiable para Colombia).
    const seen = new Set<string>(
      fromLandmarks.map((l) => l.label.trim().toLowerCase()),
    );
    const dedupedExternal = external.filter(
      (p) => !seen.has(p.label.trim().toLowerCase()),
    );

    // Internos primero, luego externos, capped al limit total
    return [...fromLandmarks, ...dedupedExternal].slice(0, Math.max(limit, 8));
  },

  /**
   * Resuelve una `PlacePrediction` a `GeocodeSuggestion` con lat/lng.
   *
   * - Si la predicción ya trae `location` (Mapbox/mocks): identity wrap, sin
   *   llamadas de red.
   * - Si solo trae `placeId` (Google): llama Place Details. Pasar el mismo
   *   `sessionToken` usado en `searchPlaces` para no duplicar el billing.
   */
  async resolvePlace(
    prediction: PlacePrediction,
    opts: { sessionToken?: string } = {},
  ): Promise<GeocodeSuggestion> {
    if (prediction.location) {
      return {
        id: prediction.id,
        label: prediction.label,
        fullAddress: prediction.fullAddress,
        location: prediction.location,
        category: prediction.category,
      };
    }
    if (!prediction.placeId) {
      throw new Error('PlacePrediction sin location ni placeId');
    }
    return getPlaceDetails(prediction.placeId, {
      sessionToken: opts.sessionToken,
    });
  },

  // ============================================================
  // AUTH
  // ============================================================
  async signup(input: { email: string; password: string; name?: string }) {
    if (USE_MOCKS) {
      return {
        tokens: { access_token: 'mock-token', refresh_token: 'mock-refresh' } as AuthTokens,
        user: { id: 'mock-user', email: input.email, name: input.name } as User,
      };
    }
    const raw = await api.post<BackendAuthSession>('/auth/signup', input);
    return {
      tokens: { access_token: raw.access_token, refresh_token: raw.refresh_token } as AuthTokens,
      user: { id: raw.user.id, email: raw.user.email, name: raw.user.name ?? undefined } as User,
    };
  },

  async login(input: { email: string; password: string }) {
    if (USE_MOCKS) {
      return {
        tokens: { access_token: 'mock-token', refresh_token: 'mock-refresh' } as AuthTokens,
        user: { id: 'mock-user', email: input.email } as User,
      };
    }
    const raw = await api.post<BackendAuthSession>('/auth/login', input);
    return {
      tokens: { access_token: raw.access_token, refresh_token: raw.refresh_token } as AuthTokens,
      user: { id: raw.user.id, email: raw.user.email, name: raw.user.name ?? undefined } as User,
    };
  },

  async getMe(): Promise<User> {
    if (USE_MOCKS) return { id: 'mock-user', email: 'mock@vialink.local' };
    const raw = await api.get<BackendMe>('/me', { auth: true });
    return backendMeToUser(raw);
  },

  // ============================================================
  // FAVORITES
  // ============================================================
  async listFavorites() {
    if (USE_MOCKS) return [];
    const raw = await api.get<BackendFavoritesResponse>('/me/favorites', { auth: true });
    return raw.favorites;
  },

  async addFavorite(input: {
    target_type: 'LANDMARK' | 'ROUTE';
    target_id: string;
    alias?: string;
  }) {
    if (USE_MOCKS) return { id: 'mock-fav' };
    return api.post<{ id: string }>('/me/favorites', input, { auth: true });
  },

  async removeFavorite(id: string) {
    if (USE_MOCKS) return { deleted: true as const };
    return api.del<{ deleted: true }>(`/me/favorites/${id}`, { auth: true });
  },

  // ============================================================
  // TRIPS
  // ============================================================
  async getActiveTrip(): Promise<Trip | null> {
    if (USE_MOCKS) return null;
    const raw = await api.get<BackendActiveTripResponse>('/trips/active', { auth: true });
    return raw.trip ? backendTripToTrip(raw.trip) : null;
  },

  async startTrip(input: {
    route_id: string;
    boarding_location: LatLng;
    dropoff_location: LatLng;
    boarding_landmark_id?: string;
    dropoff_landmark_id?: string;
  }): Promise<Trip> {
    if (USE_MOCKS) throw new Error('Inicio de viaje no disponible en mocks');
    const raw = await api.post<BackendTrip>('/trips', input, { auth: true });
    return backendTripToTrip(raw);
  },

  async getTrip(id: string): Promise<Trip> {
    if (USE_MOCKS) throw new Error('Trip detail no disponible en mocks');
    const raw = await api.get<BackendTrip>(`/trips/${id}`, { auth: true });
    return backendTripToTrip(raw);
  },

  async updateTripStatus(
    id: string,
    status: 'COMPLETED' | 'CANCELLED',
  ): Promise<Trip> {
    if (USE_MOCKS) throw new Error('Update trip no disponible en mocks');
    const raw = await api.patch<BackendTrip>(`/trips/${id}`, { status }, { auth: true });
    return backendTripToTrip(raw);
  },

  async rateTrip(id: string, stars: number, comment?: string) {
    if (USE_MOCKS) return { id: 'mock-rating', stars };
    return api.post<{ id: string; stars: number; comment: string | null }>(
      `/trips/${id}/rating`,
      { stars, comment },
      { auth: true },
    );
  },

  // ============================================================
  // WAIT SESSIONS
  // ============================================================
  async createWaitSession(input: {
    location: LatLng;
    route_id?: string;
    notify_seconds_before?: number;
  }): Promise<WaitSession> {
    if (USE_MOCKS) {
      return {
        id: `mock-wait-${Date.now()}`,
        location: input.location,
        routeId: input.route_id,
        alertBeforeSeconds: input.notify_seconds_before ?? 180,
        createdAt: new Date().toISOString(),
      };
    }
    const raw = await api.post<BackendWaitSession>(
      '/wait-sessions',
      input,
      { auth: true },
    );
    return backendWaitSessionToWaitSession(raw);
  },

  async cancelWaitSession(id: string) {
    if (USE_MOCKS) return { cancelled: true as const };
    return api.del<{ cancelled: true }>(`/wait-sessions/${id}`, { auth: true });
  },

  // ============================================================
  // INCIDENTS
  // ============================================================
  async reportIncident(input: {
    type: 'TRAFFIC' | 'FULL_BUS' | 'NO_BUS_PASSING' | 'ACCIDENT';
    location: LatLng;
    route_id?: string;
    description?: string;
  }) {
    if (USE_MOCKS) {
      return { id: `mock-inc-${Date.now()}`, type: input.type, location: input.location };
    }
    return api.post<{ id: string; type: string; location: LatLng }>(
      '/incidents',
      input,
      { auth: true },
    );
  },

  async listIncidentsNearby(
    location: LatLng,
    radiusM = 1500,
    sinceMin = 60,
  ): Promise<Incident[]> {
    if (USE_MOCKS) return [];
    const raw = await api.get<BackendIncidentsNearbyResponse>(
      `/incidents/nearby?lat=${location.lat}&lng=${location.lng}&radius_m=${radiusM}&since_minutes=${sinceMin}`,
    );
    return raw.incidents.map(backendIncidentToIncident);
  },

  // ============================================================
  // ASSISTANT
  // ============================================================
  async askAssistant(input: {
    question: string;
    location?: LatLng;
  }): Promise<
    AssistantAskResponse & {
      recommendation?: RouteRecommendation;
      alternatives?: AlternativeRoute[];
    }
  > {
    if (USE_MOCKS) return mockAskAssistant(input.question);
    const raw = await api.post<BackendAssistantAskResponse>(
      '/assistant/ask',
      input,
      { auth: true },
    );
    return backendAssistantAskToFrontend(raw);
  },

  async listAssistantMessages(limit = 20): Promise<ChatMessage[]> {
    if (USE_MOCKS) return [];
    const raw = await api.get<BackendAssistantMessagesResponse>(
      `/assistant/messages?limit=${limit}`,
      { auth: true },
    );
    const out: ChatMessage[] = [];
    for (const m of raw.messages) {
      const pair = backendAssistantMessageToChatMessage(m);
      out.push(pair.user, pair.assistant);
    }
    return out.reverse();
  },

  // ============================================================
  // ADMIN
  // ============================================================
  async getAdminMetrics(): Promise<BackendAdminMetricsPayload> {
    if (USE_MOCKS) {
      return {
        active_users: 437,
        active_trips: 89,
        ai_questions_per_minute: 23,
        incidents_last_hour: 4,
        buses_in_service: 142,
        active_wait_sessions: 12,
      };
    }
    const raw = await api.get<BackendAdminMetrics>('/admin/metrics');
    return raw.metrics;
  },

  async getAdminFeed(limit = 50, since?: string) {
    if (USE_MOCKS) return [];
    const q = `?limit=${limit}${since ? `&since=${encodeURIComponent(since)}` : ''}`;
    const raw = await api.get<BackendAdminFeedResponse>(`/admin/feed${q}`);
    return raw.events;
  },

  async startSimulator(agentCount = 100) {
    if (USE_MOCKS) {
      return {
        status: 'RUNNING' as const,
        agent_count: agentCount,
        agents_by_profile: {},
        actions_last_minute: 0,
        llm_calls_last_minute: 0,
        ticks_processed: 0,
        last_tick_ms: null,
        started_at: new Date().toISOString(),
      };
    }
    return api.post<BackendSimulatorStatus>(
      '/admin/simulator/start',
      { agent_count: agentCount },
    );
  },

  async stopSimulator() {
    if (USE_MOCKS) {
      return {
        status: 'STOPPED' as const,
        agent_count: 0,
        agents_by_profile: {},
        actions_last_minute: 0,
        llm_calls_last_minute: 0,
        ticks_processed: 0,
        last_tick_ms: null,
        started_at: null,
      };
    }
    return api.post<BackendSimulatorStatus>('/admin/simulator/stop');
  },

  async resetSimulator() {
    if (USE_MOCKS) {
      return {
        status: 'STOPPED' as const,
        agent_count: 0,
        agents_by_profile: {},
        actions_last_minute: 0,
        llm_calls_last_minute: 0,
        ticks_processed: 0,
        last_tick_ms: null,
        started_at: null,
      };
    }
    return api.post<BackendSimulatorStatus>('/admin/simulator/reset');
  },

  async getSimulatorStatus(): Promise<BackendSimulatorStatus> {
    if (USE_MOCKS) {
      return {
        status: 'STOPPED',
        agent_count: 0,
        agents_by_profile: {},
        actions_last_minute: 0,
        llm_calls_last_minute: 0,
        ticks_processed: 0,
        last_tick_ms: null,
        started_at: null,
      };
    }
    return api.get<BackendSimulatorStatus>('/admin/simulator/status');
  },
};

export type DataSource = typeof dataSource;
