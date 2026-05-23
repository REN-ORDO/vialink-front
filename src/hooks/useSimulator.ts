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

export type Agent = {
  id: string;
  userName: string;
  lat: number;
  lng: number;
  lastAction: AgentAction;
  active: boolean;
};

type SimulatorState = {
  agents: Agent[];
  feed: AgentEvent[];
  metrics: {
    activeUsers: number;
    activeTrips: number;
    aiPerMinute: number;
  };
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
const AI_WINDOW_MS = 60_000;

export function useSimulator(): SimulatorState {
  const agentsRef = useRef<Agent[]>([]);
  const aiTimestampsRef = useRef<number[]>([]);
  const tripsRef = useRef<Set<string>>(new Set());

  if (agentsRef.current.length === 0) {
    agentsRef.current = makeAgents(AGENT_COUNT);
  }

  const [agents, setAgents] = useState<Agent[]>(agentsRef.current);
  const [feed, setFeed] = useState<AgentEvent[]>([]);
  const [metrics, setMetrics] = useState({
    activeUsers: 0,
    activeTrips: 0,
    aiPerMinute: 0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      const list = agentsRef.current;
      const now = Date.now();

      const eventsThisTick: AgentEvent[] = [];
      const burst = 2 + Math.floor(Math.random() * 4);

      for (let i = 0; i < burst; i++) {
        const idx = Math.floor(Math.random() * list.length);
        const agent = list[idx];
        const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];

        agent.lat += (Math.random() - 0.5) * 0.0008;
        agent.lng += (Math.random() - 0.5) * 0.0008;
        agent.lastAction = action;
        agent.active = true;

        if (action === 'started_trip') tripsRef.current.add(agent.id);
        if (action === 'completed_trip') tripsRef.current.delete(agent.id);
        if (action === 'asked_ai') aiTimestampsRef.current.push(now);

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

      setAgents([...list]);
      setFeed((prev) => [...eventsThisTick, ...prev].slice(0, FEED_MAX));
      setMetrics({
        activeUsers: list.filter((a) => a.active).length,
        activeTrips: tripsRef.current.size,
        aiPerMinute: aiTimestampsRef.current.length,
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return { agents, feed, metrics };
}
