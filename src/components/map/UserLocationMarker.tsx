import { Marker, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useMemo } from 'react';
import L from 'leaflet';

const PERSON_SVG = `
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill="#FFFFFF"/>
  <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6v1H4v-1z" fill="#FFFFFF"/>
</svg>
`;

function makeIcon(heading: number | null): L.DivIcon {
  const rotation =
    heading !== null && Number.isFinite(heading) ? heading : null;
  const arrowHtml =
    rotation !== null
      ? `<span class="vl-user-heading" style="transform: rotate(${rotation}deg);"></span>`
      : '';
  return L.divIcon({
    className: 'vl-user-marker-wrap',
    html: `
      <div class="vl-user-marker">
        <span class="vl-user-halo"></span>
        <span class="vl-user-halo vl-user-halo--2"></span>
        ${arrowHtml}
        <span class="vl-user-pin">${PERSON_SVG}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

type Props = { lat: number; lng: number; heading?: number | null };

export default function UserLocationMarker({ lat, lng, heading }: Props) {
  const icon = useMemo(() => makeIcon(heading ?? null), [heading]);
  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      interactive={false}
      keyboard={false}
      zIndexOffset={1000}
    />
  );
}

type FollowProps = { lat: number; lng: number; enabled: boolean };

export function FollowUser({ lat, lng, enabled }: FollowProps) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    map.panTo([lat, lng], { animate: true, duration: 1.2 });
  }, [lat, lng, enabled, map]);
  return null;
}

type DragOffProps = { onUserDrag: () => void };

export function DisableFollowOnDrag({ onUserDrag }: DragOffProps) {
  useMapEvents({
    dragstart: () => onUserDrag(),
    zoomstart: () => onUserDrag(),
  });
  return null;
}
