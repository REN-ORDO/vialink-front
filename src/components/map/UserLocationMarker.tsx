import { useEffect } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

const PersonSvg = () => (
  <svg
    viewBox="0 0 24 24"
    width={14}
    height={14}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"
      fill="#FFFFFF"
    />
    <path
      d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6v1H4v-1z"
      fill="#FFFFFF"
    />
  </svg>
);

type Props = { lat: number; lng: number; heading?: number | null };

export default function UserLocationMarker({ lat, lng, heading }: Props) {
  const rotation =
    heading != null && Number.isFinite(heading) ? heading : null;
  return (
    <AdvancedMarker
      position={{ lat, lng }}
      zIndex={1000}
      // No onClick → no interactivo (igual que Leaflet interactive={false}).
    >
      <div className="vl-user-marker-wrap">
        <div className="vl-user-marker">
          <span className="vl-user-halo" />
          <span className="vl-user-halo vl-user-halo--2" />
          {rotation !== null && (
            <span
              className="vl-user-heading"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          )}
          <span className="vl-user-pin">
            <PersonSvg />
          </span>
        </div>
      </div>
    </AdvancedMarker>
  );
}

type FollowProps = { lat: number; lng: number; enabled: boolean };

export function FollowUser({ lat, lng, enabled }: FollowProps) {
  const map = useMap();
  useEffect(() => {
    if (!map || !enabled) return;
    map.panTo({ lat, lng });
  }, [map, lat, lng, enabled]);
  return null;
}

type DragOffProps = { onUserDrag: () => void };

export function DisableFollowOnDrag({ onUserDrag }: DragOffProps) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const dragListener = map.addListener('dragstart', () => onUserDrag());
    return () => {
      dragListener.remove();
    };
  }, [map, onUserDrag]);
  return null;
}
