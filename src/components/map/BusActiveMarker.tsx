import { Marker } from 'react-leaflet';
import L from 'leaflet';

function makeIcon(rutaNombre: string) {
  return L.divIcon({
    className: 'vl-bus-active-marker',
    html: `
      <span class="vl-bus-active-halo"></span>
      <span class="vl-bus-active-halo vl-bus-active-halo--2"></span>
      <span class="vl-bus-pill vl-bus-pill--active">${rutaNombre}</span>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}

type Props = { lat: number; lng: number; rutaNombre: string };

export default function BusActiveMarker({ lat, lng, rutaNombre }: Props) {
  return <Marker position={[lat, lng]} icon={makeIcon(rutaNombre)} />;
}
