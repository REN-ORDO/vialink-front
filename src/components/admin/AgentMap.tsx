import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Agent } from '../../hooks/useSimulator';
import type { AgentAction } from '../../types';
import { BARRANQUILLA_CENTER } from '../../lib/mockData';

const ACTION_COLOR: Record<AgentAction, string> = {
  asked_ai: '#1E5EFF',
  started_trip: '#00875A',
  completed_trip: '#0A0A0A',
  reported_incident: '#FF6B35',
};

const canvasRenderer = L.canvas({ padding: 0.5 });

type Props = { agents: Agent[] };

export default function AgentMap({ agents }: Props) {
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
    </MapContainer>
  );
}
