import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Agent, Ripple } from '../../hooks/useSimulator';
import type { AgentAction } from '../../types';
import { BARRANQUILLA_CENTER } from '../../lib/mockData';

const ACTION_COLOR: Record<AgentAction, string> = {
  asked_ai: '#1E5EFF',
  started_trip: '#00875A',
  completed_trip: '#0A0A0A',
  reported_incident: '#FF6B35',
  boarded: '#1E5EFF',
};

const canvasRenderer = L.canvas({ padding: 0.5 });

type Props = { agents: Agent[]; ripples: Ripple[] };

export default function AgentMap({ agents, ripples }: Props) {
  const markers = useMemo(
    () =>
      agents.map((a) => (
        <CircleMarker
          key={a.id}
          center={[a.lat, a.lng]}
          radius={a.active ? 3.5 : 2.2}
          pathOptions={{
            color: ACTION_COLOR[a.lastAction],
            fillColor: ACTION_COLOR[a.lastAction],
            fillOpacity: a.active ? 0.85 : 0.35,
            weight: 0,
          }}
          renderer={canvasRenderer}
        />
      )),
    [agents],
  );

  const rippleMarkers = useMemo(() => {
    const now = Date.now();
    return ripples.map((r) => {
      const age = (now - r.bornAt) / 1500;
      const t = Math.min(1, Math.max(0, age));
      const radius = 4 + t * 22;
      const opacity = 1 - t;
      const color = r.action === 'started_trip' ? '#00875A' : '#FF6B35';
      return (
        <CircleMarker
          key={r.id}
          center={[r.lat, r.lng]}
          radius={radius}
          pathOptions={{
            color,
            fillColor: color,
            fillOpacity: opacity * 0.18,
            opacity: opacity * 0.9,
            weight: 2,
          }}
          renderer={canvasRenderer}
          interactive={false}
        />
      );
    });
  }, [ripples]);

  return (
    <MapContainer
      center={[BARRANQUILLA_CENTER.lat, BARRANQUILLA_CENTER.lng]}
      zoom={13}
      zoomControl={false}
      attributionControl={false}
      preferCanvas
      className="absolute inset-0 z-0"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains={['a', 'b', 'c', 'd']}
        maxZoom={20}
      />
      {markers}
      {rippleMarkers}
    </MapContainer>
  );
}
