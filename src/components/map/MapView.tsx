import { MapContainer, TileLayer } from 'react-leaflet';
import type { ReactNode } from 'react';
import 'leaflet/dist/leaflet.css';
import { BARRANQUILLA_CENTER } from '../../lib/mockData';

type Props = {
  children?: ReactNode;
  zoom?: number;
};

export default function MapView({ children, zoom = 14 }: Props) {
  return (
    <MapContainer
      center={[BARRANQUILLA_CENTER.lat, BARRANQUILLA_CENTER.lng]}
      zoom={zoom}
      zoomControl={false}
      attributionControl={false}
      className="absolute inset-0 z-0"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains={['a', 'b', 'c', 'd']}
        maxZoom={20}
      />
      {children}
    </MapContainer>
  );
}
