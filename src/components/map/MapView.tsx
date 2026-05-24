import { APIProvider, Map } from '@vis.gl/react-google-maps';
import type { ReactNode } from 'react';
import { BARRANQUILLA_CENTER } from '../../lib/mockData';

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const GOOGLE_MAPS_API_KEY = env.VITE_GOOGLE_MAPS_API_KEY ?? '';
// "DEMO_MAP_ID" funciona sin configuración previa en Google Cloud Console;
// para un estilo custom, crear un Map ID en Console y pegar acá.
const MAP_ID = env.VITE_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID';

type Props = {
  children?: ReactNode;
  zoom?: number;
  /** Override center; default Barranquilla center. */
  center?: { lat: number; lng: number };
};

export default function MapView({ children, zoom = 14, center }: Props) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div
        data-testid="mapview-missing-key"
        className="absolute inset-0 z-0 flex items-center justify-center bg-surface-raised text-text-secondary text-sm p-6 text-center"
      >
        Falta <code className="font-mono mx-1">VITE_GOOGLE_MAPS_API_KEY</code> en
        <code className="font-mono mx-1">.env.local</code>
      </div>
    );
  }
  const c = center ?? BARRANQUILLA_CENTER;
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker']}>
      <div className="absolute inset-0 z-0">
        <Map
          defaultCenter={{ lat: c.lat, lng: c.lng }}
          defaultZoom={zoom}
          mapId={MAP_ID}
          disableDefaultUI
          gestureHandling="greedy"
          clickableIcons={false}
          style={{ width: '100%', height: '100%' }}
        >
          {children}
        </Map>
      </div>
    </APIProvider>
  );
}
