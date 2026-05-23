import { api, ApiError, USE_MOCKS } from './api';
import { paraderosMock } from './mockData';
import { mockAskAssistant } from './llmMock';
import type {
  AssistantAskResponse,
  Incident,
  LatLng,
  Paradero,
  RouteRecommendation,
  Trip,
} from '../types';

type AskAssistantInput = {
  question: string;
  location?: LatLng;
};

type AskAssistantOutput = AssistantAskResponse & {
  recommendation?: RouteRecommendation;
};

export const dataSource = {
  useMocks: USE_MOCKS,

  async getLandmarksNearby(location?: LatLng): Promise<Paradero[]> {
    if (USE_MOCKS) return paraderosMock;
    const q = location ? `?lat=${location.lat}&lng=${location.lng}` : '';
    try {
      return await api.get<Paradero[]>(`/landmarks/nearby${q}`);
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
    return api.get<Paradero>(`/landmarks/${id}`);
  },

  async askAssistant(input: AskAssistantInput): Promise<AskAssistantOutput> {
    if (USE_MOCKS) return mockAskAssistant(input.question);
    return api.post<AssistantAskResponse>('/assistant/ask', {
      question: input.question,
      location: input.location,
    });
  },

  async getActiveTrip(): Promise<Trip | null> {
    if (USE_MOCKS) return null;
    return api.get<Trip | null>('/trips/active', { auth: true });
  },

  async startTrip(input: {
    boarding_location: LatLng;
    dropoff_location: LatLng;
    route_id: string;
  }): Promise<Trip> {
    if (USE_MOCKS) {
      throw new Error('Inicio de viaje no disponible en modo mock');
    }
    return api.post<Trip>('/trips', input, { auth: true });
  },

  async completeTrip(tripId: string): Promise<Trip> {
    if (USE_MOCKS) {
      throw new Error('Completar viaje no disponible en modo mock');
    }
    return api.patch<Trip>(`/trips/${tripId}`, { status: 'COMPLETED' }, { auth: true });
  },

  async cancelTrip(tripId: string): Promise<Trip> {
    if (USE_MOCKS) {
      throw new Error('Cancelar viaje no disponible en modo mock');
    }
    return api.patch<Trip>(`/trips/${tripId}`, { status: 'CANCELLED' }, { auth: true });
  },

  async listIncidentsNearby(location: LatLng, radiusM = 1500): Promise<Incident[]> {
    if (USE_MOCKS) return [];
    return api.get<Incident[]>(
      `/incidents/nearby?lat=${location.lat}&lng=${location.lng}&radius=${radiusM}`,
    );
  },
};

export type DataSource = typeof dataSource;
