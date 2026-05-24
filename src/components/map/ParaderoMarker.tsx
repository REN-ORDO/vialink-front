import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import type { Paradero } from '../../types';

const icon = L.divIcon({
  className: 'vl-paradero-marker',
  html: `<span class="vl-paradero-dot"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

type Props = { paradero: Paradero };

export default function ParaderoMarker({ paradero }: Props) {
  const navigate = useNavigate();
  return (
    <Marker
      position={[paradero.lat, paradero.lng]}
      icon={icon}
      eventHandlers={{
        click: () => navigate(`/paradero/${paradero.id}`),
      }}
    />
  );
}
