import { X, Navigation2, Clock3, MapPin } from 'lucide-react';
import { useBusDetails } from '../../hooks/useBusDetails';
import { ApiError } from '../../lib/api';
import type { LatLng } from '../../types';

type Props = {
  busId: string | null;
  userLocation?: LatLng;
  onClose: () => void;
};

function formatEta(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} s`;
  const min = Math.round(seconds / 60);
  return `${min} min`;
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export default function BusDetailSheet({
  busId,
  userLocation,
  onClose,
}: Props) {
  const { data, isFetching, error } = useBusDetails(busId, userLocation);

  if (!busId) return null;

  const apiError = error instanceof ApiError ? error : null;
  const isNotFound = apiError?.status === 404;
  const isCompleted = apiError?.status === 410 || data?.status === 'COMPLETED';

  return (
    <div
      data-testid="bus-detail-sheet"
      className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl vl-elev-3 border-t border-black/[0.05] pb-[max(20px,env(safe-area-inset-bottom))] max-h-[60vh] overflow-y-auto"
    >
      <div className="flex items-start justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          {data && (
            <span
              className="inline-flex items-center justify-center min-w-[42px] h-8 px-2 rounded-md text-white text-[13px] font-bold tabular tracking-wide shrink-0"
              style={{ backgroundColor: data.route.color }}
            >
              {data.route.code}
            </span>
          )}
          <div className="min-w-0">
            <div className="vl-eyebrow text-text-secondary">
              {data?.plate ?? 'Bus'}
            </div>
            <h2 className="text-[16px] font-bold text-text-primary truncate vl-headline leading-tight">
              {data?.route.name ?? (isFetching ? 'Cargando…' : 'Bus')}
            </h2>
          </div>
        </div>
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="cursor-pointer shrink-0 w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center active:scale-95"
        >
          <X className="w-[16px] h-[16px] text-text-primary" strokeWidth={2.4} />
        </button>
      </div>

      <div className="px-5 pt-2">
        {isNotFound && (
          <div className="py-6 text-center text-text-secondary text-sm">
            Bus no disponible. Puede que ya haya completado su recorrido.
          </div>
        )}

        {isCompleted && !isNotFound && (
          <div className="py-6 text-center text-text-secondary text-sm">
            Este bus completó su recorrido.
          </div>
        )}

        {!isNotFound && !isCompleted && data && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Stat label="Velocidad" value={`${Math.round(data.speedKmh)} km/h`} />
              <Stat
                label="Recorrido"
                value={`${Math.round(data.stats.completedPct * 100)}%`}
              />
              <Stat
                label="Restan"
                value={`${data.stats.remainingKm.toFixed(1)} km`}
              />
            </div>

            {data.etaToUser && (
              <Row
                icon={<Navigation2 className="w-4 h-4" strokeWidth={2.4} />}
                label="Llega a ti en"
                primary={formatEta(data.etaToUser.etaSeconds)}
                secondary={formatDistance(data.etaToUser.distanceM)}
                highlight
              />
            )}

            {data.nextLandmark && (
              <Row
                icon={<MapPin className="w-4 h-4" strokeWidth={2.4} />}
                label="Próximo paradero"
                primary={data.nextLandmark.name}
                secondary={`${formatEta(data.nextLandmark.etaSeconds)} · ${formatDistance(data.nextLandmark.distanceM)}`}
              />
            )}

            <Row
              icon={<Clock3 className="w-4 h-4" strokeWidth={2.4} />}
              label="Última señal"
              primary={new Date(data.lastSeenAt).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              secondary={data.route.operator ?? ''}
            />
          </>
        )}

        {isFetching && !data && !apiError && (
          <div className="py-6 text-center text-text-secondary text-sm">
            Cargando información del bus…
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-raised px-3 py-2.5">
      <div className="vl-eyebrow text-text-secondary text-[10px]">{label}</div>
      <div className="text-[15px] font-bold text-text-primary vl-headline tabular mt-0.5">
        {value}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  primary,
  secondary,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
  secondary?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 mb-1.5 rounded-xl border ${
        highlight
          ? 'bg-brand/5 border-brand/20'
          : 'bg-white border-black/[0.05]'
      }`}
    >
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          highlight ? 'bg-brand text-white' : 'bg-surface-raised text-text-primary'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="vl-eyebrow text-text-secondary text-[10px]">
          {label}
        </div>
        <div className="text-[14px] font-semibold text-text-primary truncate">
          {primary}
        </div>
      </div>
      {secondary && (
        <div className="text-[12px] text-text-secondary tabular shrink-0">
          {secondary}
        </div>
      )}
    </div>
  );
}
