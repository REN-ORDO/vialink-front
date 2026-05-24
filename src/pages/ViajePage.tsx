import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, X } from 'lucide-react';
import { useMap } from '@vis.gl/react-google-maps';
import MapView from '../components/map/MapView';
import MapPolyline from '../components/map/MapPolyline';
import ParaderoMarker from '../components/map/ParaderoMarker';
import BusActiveMarker from '../components/map/BusActiveMarker';
import { useViajeMock } from '../hooks/useViajeMock';
import type { LatLng } from '../types';

function FitBounds({ coords }: { coords: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || coords.length < 2) return;
    const bounds = new google.maps.LatLngBounds();
    for (const c of coords) bounds.extend(c);
    map.fitBounds(bounds, 80);
  }, [coords, map]);
  return null;
}

function FollowBus({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat, lng });
  }, [lat, lng, map]);
  return null;
}

export default function ViajePage() {
  const navigate = useNavigate();
  const { viaje, routeCoords, tiempoRestanteMin, paradasRestantes, proximoParadero } =
    useViajeMock();

  return (
    <div className="relative flex-1 overflow-hidden bg-surface-raised">
      <MapView
        center={{ lat: viaje.busLat, lng: viaje.busLng }}
        zoom={14}
      >
        <FitBounds coords={routeCoords} />
        <FollowBus lat={viaje.busLat} lng={viaje.busLng} />
        <MapPolyline
          positions={routeCoords}
          color="#0A0A0A"
          weight={9}
          opacity={0.15}
        />
        <MapPolyline
          positions={routeCoords}
          color="#1E5EFF"
          weight={6}
          opacity={1}
        />
        {paradasRestantes.map((p) => (
          <ParaderoMarker key={p.id} paradero={p} />
        ))}
        <BusActiveMarker
          lat={viaje.busLat}
          lng={viaje.busLng}
          rutaNombre={viaje.rutaNombre}
        />
      </MapView>

      <header className="absolute top-0 left-0 right-0 z-30 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2 flex items-center gap-2.5">
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="cursor-pointer w-11 h-11 rounded-full bg-white vl-elev-3 border border-black/[0.04] flex items-center justify-center active:bg-surface-raised transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-text-primary" strokeWidth={2.4} />
        </button>
        <div className="flex-1 inline-flex items-center gap-2.5 bg-white rounded-full pl-2 pr-3.5 h-11 vl-elev-3 border border-black/[0.04]">
          <span className="inline-flex items-center justify-center min-w-[44px] h-7 px-2.5 rounded-full bg-text-primary text-white text-[12.5px] font-bold tabular tracking-wide">
            {viaje.rutaNombre}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-bold text-text-primary truncate vl-headline">
              {viaje.origen} → {viaje.destino}
            </div>
          </div>
          <span className="vl-status-dot text-success" />
        </div>
      </header>

      <section className="absolute left-0 right-0 bottom-0 z-30 bg-white rounded-t-[28px] shadow-[0_-12px_36px_rgba(10,10,10,0.10)] pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-black/15" />
        </div>

        <div className="px-5 pt-3">
          <div className="vl-eyebrow text-text-secondary">Llegas en</div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-[64px] leading-[0.95] font-bold text-text-primary tracking-[-0.05em] tabular vl-display">
              {tiempoRestanteMin}
            </div>
            <div className="text-[20px] font-semibold text-text-secondary tracking-tight">
              min
            </div>
            <div className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-success vl-eyebrow">
              <span className="vl-status-dot text-success" />
              <span className="pl-1.5">En ruta</span>
            </div>
          </div>

          <div className="mt-5 rounded-[16px] bg-surface-raised border border-black/[0.04] px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-black/[0.06] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-brand" strokeWidth={2.3} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="vl-eyebrow text-text-secondary">
                Próxima parada
              </div>
              <div className="text-[15px] font-bold text-text-primary truncate vl-headline mt-0.5">
                {proximoParadero.nombre}
              </div>
              <div className="text-[12px] text-text-secondary truncate">
                {proximoParadero.direccion}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pt-5 pb-2">
          <div className="vl-eyebrow text-text-secondary mb-2.5">
            Paradas restantes · {paradasRestantes.length}
          </div>
          <ol className="relative">
            <span className="absolute left-[7px] top-1 bottom-1 w-px bg-brand/30" />
            {paradasRestantes.map((p, idx) => (
              <li
                key={p.id}
                className="relative pl-6 py-1.5 flex items-center gap-2 last:pb-0"
              >
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 ${
                    idx === 0
                      ? 'bg-brand border-brand'
                      : 'bg-white border-brand/60'
                  }`}
                />
                <span className="text-[13.5px] text-text-primary font-semibold truncate flex-1 vl-headline">
                  {p.nombre}
                </span>
                {idx === 0 && (
                  <span className="vl-eyebrow text-brand">
                    Próxima
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="px-5 pt-4">
          <button
            onClick={() => navigate('/', { replace: true })}
            className="cursor-pointer w-full h-12 rounded-full border border-black/[0.08] text-text-primary text-[14.5px] font-semibold flex items-center justify-center gap-2 active:bg-surface-raised transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.4} />
            Terminar viaje
          </button>
        </div>
      </section>
    </div>
  );
}
