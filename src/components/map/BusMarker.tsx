import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Bus } from '../../types';

function makeIcon(rutaNombre: string) {
  return L.divIcon({
    className: 'vl-bus-marker',
    html: `<span class="vl-bus-pill">${rutaNombre}</span>`,
    iconSize: [42, 22],
    iconAnchor: [21, 11],
  });
}

type Props = { bus: Bus };

export default function BusMarker({ bus }: Props) {
  return (
    <Marker position={[bus.lat, bus.lng]} icon={makeIcon(bus.rutaNombre)} />
  );
}
