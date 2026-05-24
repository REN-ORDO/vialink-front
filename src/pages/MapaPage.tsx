import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Navigation2, LocateFixed, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Polyline } from 'react-leaflet';
import MapView from '../components/map/MapView';
import ParaderoMarker from '../components/map/ParaderoMarker';
import Bus3DMarker from '../components/map/buses3d/Bus3DMarker';
import UserLocationMarker, {
  FollowUser,
  DisableFollowOnDrag,
} from '../components/map/UserLocationMarker';
import BottomSheet from '../components/ui/BottomSheet';
import AddressSearchBar from '../components/ui/AddressSearchBar';
import BusDetailSheet from '../components/map/BusDetailSheet';
import { busesMock, BARRANQUILLA_CENTER } from '../lib/mockData';
import { useParaderos } from '../hooks/useParaderos';
import { useBusesAtPoint } from '../hooks/useBusesAtPoint';
import { useBusDetails } from '../hooks/useBusDetails';
import { useRealtime } from '../hooks/useRealtime';
import { useLocation, distanceKm } from '../hooks/useLocation';
import { useAppStore } from '../store/useAppStore';
import type { Bus, LatLng, Paradero } from '../types';

function tickBuses(buses: Bus[]): Bus[] {
  return buses.map((b) => {
    const turn = (Math.random() - 0.5) * 24;
    const newHeading = (((b.heading ?? 0) + turn) % 360 + 360) % 360;
    const speed = 0.00045;
    const rad = (newHeading * Math.PI) / 180;
    return {
      ...b,
      heading: newHeading,
      lat: b.lat + Math.cos(rad) * speed,
      lng: b.lng + Math.sin(rad) * speed,
    };
  });
}

function nextEta(p: Paradero): number | null {
  if (p.rutas.length === 0) return null;
  const min = p.rutas.reduce(
    (m, r) => Math.min(m, r.etaMinutos),
    Number.POSITIVE_INFINITY,
  );
  return Number.isFinite(min) ? min : null;
}

function nextRutaNombre(p: Paradero): string {
  const sorted = [...p.rutas].sort((a, b) => a.etaMinutos - b.etaMinutos);
  return sorted[0]?.nombre ?? '';
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function etaColor(eta: number | null): string {
  if (eta == null) return 'text-text-secondary';
  if (eta <= 5) return 'text-success';
  if (eta <= 15) return 'text-brand';
  if (eta <= 30) return 'text-warning';
  return 'text-text-secondary';
}

export default function MapaPage() {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<Bus[]>(busesMock);
  const [tappedLocation, setTappedLocation] = useState<LatLng | null>(null);
  const [tappedLabel, setTappedLabel] = useState<string>('');
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const { data: paraderos, isLoading } = useParaderos();
  const { data: busesAtPoint, isFetching: isFetchingBusesAtPoint } =
    useBusesAtPoint(tappedLocation);
  const { lat, lng, status: locStatus } = useLocation();
  const userHeading = useAppStore((s) => s.userHeading);
  const followUser = useAppStore((s) => s.followUser);
  const setFollowUser = useAppStore((s) => s.setFollowUser);
  const hasUserLocation =
    lat != null && lng != null && (locStatus === 'granted' || locStatus === 'idle');
  const userLocation: LatLng | undefined =
    lat != null && lng != null ? { lat, lng } : undefined;

  // Bus details + polyline cuando hay un bus seleccionado
  const { data: busDetails } = useBusDetails(selectedBusId, userLocation);

  // Suscribir al room del bus para recibir updates en vivo
  useRealtime({
    rooms: selectedBusId ? [`bus:${selectedBusId}`] : [],
    enabled: !!selectedBusId,
  });

  useEffect(() => {
    const id = setInterval(() => setBuses((prev) => tickBuses(prev)), 1800);
    return () => clearInterval(id);
  }, []);

  const center = useMemo(
    () => ({
      lat: lat ?? BARRANQUILLA_CENTER.lat,
      lng: lng ?? BARRANQUILLA_CENTER.lng,
    }),
    [lat, lng],
  );

  const sorted = useMemo(() => {
    if (!paraderos) return [];
    return [...paraderos].sort(
      (a, b) => distanceKm(center, a) - distanceKm(center, b),
    );
  }, [paraderos, center]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <MapView>
        {(paraderos ?? []).map((p) => (
          <ParaderoMarker key={p.id} paradero={p} />
        ))}
        {busDetails && busDetails.polyline.length > 1 && (
          <Polyline
            positions={busDetails.polyline.map((p) => [p.lat, p.lng])}
            pathOptions={{
              color: busDetails.route.color,
              weight: 5,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}
        {buses.map((b) => (
          <Bus3DMarker
            key={b.id}
            bus={b}
            onClick={(id) => {
              setSelectedBusId(id);
              setTappedLocation(null);
            }}
            isSelected={selectedBusId === b.id}
          />
        ))}
        <DisableFollowOnDrag onUserDrag={() => setFollowUser(false)} />
        {hasUserLocation && lat != null && lng != null && (
          <>
            <UserLocationMarker lat={lat} lng={lng} heading={userHeading} />
            <FollowUser lat={lat} lng={lng} enabled={followUser} />
          </>
        )}
      </MapView>

      <div className="absolute top-0 left-0 right-0 z-30 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="px-4">
          <AddressSearchBar
            proximity={userLocation}
            placeholder="¿A dónde vas?"
            onSelect={(s) => {
              setTappedLocation(s.location);
              setTappedLabel(s.label);
              setSelectedBusId(null);
            }}
          />
        </div>

        <div className="px-4 mt-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <Pill
            active
            label="Cerca de mí"
            icon={<Navigation2 className="w-3 h-3" strokeWidth={2.6} />}
          />
          <Pill label="Frecuentes" />
          <Pill label="Favoritos" />
        </div>
      </div>

      {tappedLocation && (
        <div
          data-testid="buses-at-point-sheet"
          className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl vl-elev-3 border-t border-black/[0.05] pb-[max(20px,env(safe-area-inset-bottom))]"
        >
          <div className="flex items-start justify-between px-5 pt-4 pb-2">
            <div className="min-w-0">
              <div className="vl-eyebrow text-text-secondary">Buses que pasan por</div>
              <h2 className="text-[18px] font-bold text-text-primary truncate vl-headline">
                {tappedLabel || 'esta ubicación'}
              </h2>
            </div>
            <button
              aria-label="Cerrar"
              onClick={() => {
                setTappedLocation(null);
                setTappedLabel('');
              }}
              className="cursor-pointer shrink-0 w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center active:scale-95"
            >
              <X className="w-[16px] h-[16px] text-text-primary" strokeWidth={2.4} />
            </button>
          </div>
          <div className="px-5 pt-2 pb-1">
            {isFetchingBusesAtPoint && (
              <div className="text-text-secondary text-sm py-4">Cargando rutas…</div>
            )}
            {!isFetchingBusesAtPoint &&
              (busesAtPoint?.routes.length ?? 0) === 0 && (
                <div className="text-text-secondary text-sm py-4">
                  No encontramos buses cerca en este momento.
                </div>
              )}
            {!isFetchingBusesAtPoint &&
              (busesAtPoint?.routes ?? []).map((r) => {
                const nextEtaSec = r.next_buses[0]?.eta_seconds ?? null;
                const etaMin =
                  nextEtaSec != null ? Math.max(1, Math.round(nextEtaSec / 60)) : null;
                return (
                  <div
                    key={r.route.id}
                    className="flex items-center gap-3 py-2.5 border-t border-black/[0.05] first:border-t-0"
                  >
                    <span
                      className="inline-flex items-center justify-center min-w-[34px] h-7 px-2 rounded-md text-white text-[12px] font-bold tabular tracking-wide"
                      style={{ backgroundColor: r.route.color }}
                    >
                      {r.route.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-text-primary truncate">
                        {r.route.name}
                      </div>
                      <div className="text-[12px] text-text-secondary">
                        {etaMin != null
                          ? `Próximo en ~${etaMin} min`
                          : 'Sin ETA disponible'}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <BottomSheet initial="half" collapsedHeight={148}>
        <div className="px-5 pb-8">
          <div className="pt-1 pb-3.5 flex items-end justify-between">
            <div>
              <div className="vl-eyebrow text-text-secondary">Cerca de ti</div>
              <h2 className="text-[22px] font-bold text-text-primary vl-display leading-tight mt-0.5">
                {sorted.length} {sorted.length === 1 ? 'paradero' : 'paraderos'}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-success vl-eyebrow">
              <span className="vl-status-dot text-success" />
              <span className="pl-1.5">En vivo</span>
            </div>
          </div>

          <div className="rounded-[18px] bg-white border border-black/[0.05] overflow-hidden vl-elev-1">
            {isLoading && (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}

            {!isLoading && sorted.length === 0 && (
              <div className="text-center text-sm text-text-secondary py-12">
                Sin paraderos cerca
              </div>
            )}

            {!isLoading &&
              sorted.map((p, idx) => {
                const eta = nextEta(p);
                const distance = distanceKm(center, p);
                const ruta = nextRutaNombre(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/paradero/${p.id}`)}
                    className={`cursor-pointer w-full flex items-center gap-4 px-4 py-3.5 text-left active:bg-surface-raised transition-colors ${
                      idx !== 0 ? 'border-t border-black/[0.05]' : ''
                    }`}
                  >
                    <div className="shrink-0 flex flex-col items-center justify-center w-12">
                      <div
                        className={`text-[22px] font-bold tabular leading-none vl-display ${etaColor(eta)}`}
                      >
                        {eta == null ? '—' : eta}
                      </div>
                      <div className="text-[10px] font-semibold text-text-secondary mt-0.5 tracking-wide">
                        MIN
                      </div>
                    </div>

                    <div className="w-px self-stretch bg-black/[0.06]" />

                    <div className="flex-1 min-w-0">
                      <div className="text-[15.5px] font-semibold text-text-primary truncate vl-headline">
                        {p.nombre}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-text-secondary truncate">
                        {ruta && (
                          <span className="inline-flex items-center justify-center min-w-[26px] h-[18px] px-1.5 rounded-md bg-brand/10 text-brand text-[10px] font-bold tabular tracking-wide">
                            {ruta}
                          </span>
                        )}
                        <span className="tabular">{formatDistance(distance)}</span>
                        <span className="text-text-secondary/50">·</span>
                        <span className="truncate">{p.direccion}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </BottomSheet>

      <div className="absolute bottom-6 right-4 z-40 flex flex-col items-end gap-2.5">
        {hasUserLocation && (
          <button
            onClick={() => setFollowUser(true)}
            aria-label={followUser ? 'Siguiendo tu ubicación' : 'Centrar en mi ubicación'}
            className={`cursor-pointer w-12 h-12 rounded-full flex items-center justify-center vl-elev-3 active:scale-[0.95] transition-all border ${
              followUser
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-text-primary border-black/[0.06]'
            }`}
          >
            <LocateFixed
              className={`w-[18px] h-[18px] ${followUser ? 'text-white' : 'text-brand'}`}
              strokeWidth={2.4}
            />
          </button>
        )}
        <button
          onClick={() => navigate('/asistente')}
          aria-label="Abrir asistente"
          className="cursor-pointer group flex items-center gap-2 pl-3.5 pr-4 h-14 rounded-full bg-text-primary text-white vl-elev-3 active:scale-[0.97] transition-transform"
        >
          <Sparkles className="w-[18px] h-[18px] text-white" strokeWidth={2.4} />
          <span className="text-[14px] font-semibold tracking-tight">Preguntar</span>
        </button>
      </div>

      <BusDetailSheet
        busId={selectedBusId}
        userLocation={userLocation}
        onClose={() => setSelectedBusId(null)}
      />
    </div>
  );
}

function Pill({
  label,
  icon,
  active = false,
}: {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={`cursor-pointer shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12.5px] font-semibold transition-colors ${
        active
          ? 'bg-text-primary text-white vl-elev-2'
          : 'bg-white text-text-primary border border-black/[0.06] vl-elev-1 active:bg-surface-raised'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-t border-black/[0.05] first:border-t-0">
      <div className="shrink-0 w-12 space-y-1">
        <div className="h-5 w-8 rounded vl-shimmer" />
        <div className="h-2 w-6 rounded vl-shimmer" />
      </div>
      <div className="w-px self-stretch bg-black/[0.06]" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-3/5 rounded vl-shimmer" />
        <div className="h-2.5 w-2/5 rounded vl-shimmer" />
      </div>
    </div>
  );
}
