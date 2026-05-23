import { useEffect, useRef, useState } from 'react';
import { BARRANQUILLA_CENTER } from '../lib/mockData';
import type { AgentAction, AgentEvent } from '../types';

const NAMES = [
  'María', 'Juan', 'Andrea', 'Carlos', 'Sofía', 'Diego', 'Valentina',
  'Felipe', 'Laura', 'Sebastián', 'Camila', 'Andrés', 'Daniela', 'Mateo',
  'Isabella', 'Santiago', 'Mariana', 'Nicolás', 'Lucía', 'Tomás',
];

const ACTIONS: AgentAction[] = [
  'asked_ai',
  'started_trip',
  'completed_trip',
  'reported_incident',
];

const ZONES = [
  'Plaza de la Paz',
  'Centro Histórico',
  'Buenavista',
  'Joe Arroyo',
  'Sagrado Corazón',
];

const TOP_ROUTES = ['C12', 'A8', 'T1', 'B1', '46'];

export type Agent = {
  id: string;
  userName: string;
  lat: number;
  lng: number;
  lastAction: AgentAction;
  active: boolean;
};

export type Ripple = {
  id: string;
  lat: number;
  lng: number;
  action: 'started_trip' | 'reported_incident';
  bornAt: number;
};

export type DeltaMetric = {
  value: number;
  delta1m: number;
};

export type AdminInsight = {
  label: string;
  value: string;
};

type SimulatorState = {
  agents: Agent[];
  feed: AgentEvent[];
  ripples: Ripple[];
  metrics: {
    activeUsers: DeltaMetric;
    activeTrips: DeltaMetric;
    aiPerMinute: DeltaMetric;
  };
  insights: AdminInsight[];
};

function makeAgents(n: number): Agent[] {
  const out: Agent[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: `u_${i}`,
      userName: NAMES[i % NAMES.length],
      lat: BARRANQUILLA_CENTER.lat + (Math.random() - 0.5) * 0.10,
      lng: BARRANQUILLA_CENTER.lng + (Math.random() - 0.5) * 0.10,
      lastAction: 'asked_ai',
      active: Math.random() > 0.25,
    });
  }
  return out;
}

const AGENT_COUNT = 500;
const TICK_MS = 250;
const FEED_MAX = 40;
const RIPPLE_MAX = 20;
const RIPPLE_TTL = 1500;
const AI_WINDOW_MS = 60_000;
const ONE_MIN_MS = 60_000;

export function useSimulator(): SimulatorState {
  const agentsRef = useRef<Agent[]>([]);
  const aiTimestampsRef = useRef<number[]>([]);
  const tripsRef = useRef<Set<string>>(new Set());
  const tripStartsRef = useRef<number[]>([]);
  const activeHistoryRef = useRef<{ t: number; v: number }[]>([]);
  const insightRotation = useRef(0);

  if (agentsRef.current.length === 0) {
    agentsRef.current = makeAgents(AGENT_COUNT);
  }

  const [agents, setAgents] = useState<Agent[]>(agentsRef.current);
  const [feed, setFeed] = useState<AgentEvent[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [metrics, setMetrics] = useState<SimulatorState['metrics']>({
    activeUsers: { value: 0, delta1m: 0 },
    activeTrips: { value: 0, delta1m: 0 },
    aiPerMinute: { value: 0, delta1m: 0 },
  });
  const [insights, setInsights] = useState<AdminInsight[]>([
    { label: 'Decisiones de ruta · /min', value: '1.2k' },
    { label: 'Top ruta · ahora', value: 'C12' },
    { label: 'Pico actividad', value: 'Plaza de la Paz' },
    { label: 'Tiempo promedio respuesta IA', value: '0.9s' },
    { label: 'Cobertura zonas', value: '12 / 12' },
  ]);

  useEffect(() => {
    const id = setInterval(() => {
      const list = agentsRef.current;
      const now = Date.now();

      const eventsThisTick: AgentEvent[] = [];
      const ripplesThisTick: Ripple[] = [];
      const burst = 2 + Math.floor(Math.random() * 4);

      for (let i = 0; i < burst; i++) {
        const idx = Math.floor(Math.random() * list.length);
        const agent = list[idx];
        const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];

        agent.lat += (Math.random() - 0.5) * 0.0008;
        agent.lng += (Math.random() - 0.5) * 0.0008;
        agent.lastAction = action;
        agent.active = true;

        if (action === 'started_trip') {
          tripsRef.current.add(agent.id);
          tripStartsRef.current.push(now);
        }
        if (action === 'completed_trip') tripsRef.current.delete(agent.id);
        if (action === 'asked_ai') aiTimestampsRef.current.push(now);

        if (action === 'started_trip' || action === 'reported_incident') {
          ripplesThisTick.push({
            id: `r_${now}_${i}_${idx}`,
            lat: agent.lat,
            lng: agent.lng,
            action,
            bornAt: now,
          });
        }

        eventsThisTick.push({
          type: 'user_action',
          userId: agent.id,
          userName: agent.userName,
          action,
          payload: {},
          location: { lat: agent.lat, lng: agent.lng },
          timestamp: new Date(now).toISOString(),
        });
      }

      aiTimestampsRef.current = aiTimestampsRef.current.filter(
        (t) => now - t < AI_WINDOW_MS,
      );
      tripStartsRef.current = tripStartsRef.current.filter(
        (t) => now - t < ONE_MIN_MS,
      );

      const activeUsersNow = list.filter((a) => a.active).length;
      activeHistoryRef.current.push({ t: now, v: activeUsersNow });
      activeHistoryRef.current = activeHistoryRef.current.filter(
        (h) => now - h.t < ONE_MIN_MS,
      );
      const activeUsers1mAgo =
        activeHistoryRef.current[0]?.v ?? activeUsersNow;

      setAgents([...list]);
      setFeed((prev) => [...eventsThisTick, ...prev].slice(0, FEED_MAX));
      setRipples((prev) => {
        const fresh = [...prev, ...ripplesThisTick]
          .filter((r) => now - r.bornAt < RIPPLE_TTL)
          .slice(-RIPPLE_MAX);
        return fresh;
      });
      setMetrics({
        activeUsers: {
          value: activeUsersNow,
          delta1m: activeUsersNow - activeUsers1mAgo,
        },
        activeTrips: {
          value: tripsRef.current.size,
          delta1m: tripStartsRef.current.length,
        },
        aiPerMinute: {
          value: aiTimestampsRef.current.length,
          delta1m: aiTimestampsRef.current.length,
        },
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      insightRotation.current = (insightRotation.current + 1) % 5;
      setInsights((prev) => {
        const copy = [...prev];
        const idx = insightRotation.current;
        const nextRoute = TOP_ROUTES[Math.floor(Math.random() * TOP_ROUTES.length)];
        const nextZone = ZONES[Math.floor(Math.random() * ZONES.length)];
        const decisionsPerMin = (
          1.0 + Math.random() * 0.6
        ).toFixed(1) + 'k';
        const respMs = (0.7 + Math.random() * 0.6).toFixed(1);
        if (idx === 0) copy[0] = { ...copy[0], value: decisionsPerMin };
        if (idx === 1) copy[1] = { ...copy[1], value: nextRoute };
        if (idx === 2) copy[2] = { ...copy[2], value: nextZone };
        if (idx === 3) copy[3] = { ...copy[3], value: `${respMs}s` };
        return copy;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return { agents, feed, ripples, metrics, insights };
}
