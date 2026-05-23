import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Share2, Star, Flag, Navigation } from 'lucide-react';
import { useParadero } from '../hooks/useParaderos';
import type { Ruta } from '../types';

const estadoConfig: Record<
  Ruta['estado'],
  { label: string; dot: string; text: string }
> = {
  operando: { label: 'Operando', dot: 'bg-success', text: 'text-success' },
  frecuencia_baja: {
    label: 'Frecuencia baja',
    dot: 'bg-warning',
    text: 'text-warning',
  },
  ultimo_bus: { label: 'Último bus', dot: 'bg-accent', text: 'text-accent' },
};

function etaColor(eta: number, ultimoBus: boolean): string {
  if (ultimoBus) return 'text-accent';
  if (eta <= 5) return 'text-success';
  if (eta <= 15) return 'text-brand';
  if (eta <= 30) return 'text-warning';
  return 'text-text-secondary';
}

export default function ParaderoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: paradero, isLoading, isError } = useParadero(id);

  const rutas = paradero?.rutas
    ? [...paradero.rutas].sort((a, b) => a.etaMinutos - b.etaMinutos)
    : [];

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      <header className="bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between px-3 pt-[max(10px,env(safe-area-inset-top))] pb-1">
          <button
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="cursor-pointer w-10 h-10 rounded-full flex items-center justify-center active:bg-surface-raised transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-text-primary" strokeWidth={2.4} />
          </button>
          <div className="flex items-center gap-1">
            <IconButton aria-label="Favorito" Icon={Star} />
            <IconButton aria-label="Compartir" Icon={Share2} />
          </div>
        </div>

        <div className="px-5 pb-5 pt-2">
          {isLoading ? (
            <>
              <div className="h-3 w-20 rounded vl-shimmer" />
              <div className="h-10 w-3/4 rounded vl-shimmer mt-2.5" />
              <div className="h-3.5 w-1/2 rounded vl-shimmer mt-2" />
            </>
          ) : paradero ? (
            <>
              <div className="vl-eyebrow text-text-secondary">Paradero</div>
              <h1 className="text-[34px] font-bold text-text-primary vl-display leading-[1.05] mt-1.5">
                {paradero.nombre}
              </h1>
              <div className="flex items-center gap-1.5 mt-2 text-[13.5px] text-text-secondary">
                <MapPin className="w-3.5 h-3.5" strokeWidth={2.4} />
                <span>{paradero.direccion}</span>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button className="cursor-pointer h-9 inline-flex items-center gap-1.5 px-3.5 rounded-full bg-text-primary text-white text-[12.5px] font-semibold active:scale-[0.98] transition-transform">
                  <Navigation className="w-3.5 h-3.5" strokeWidth={2.6} />
                  Llegar
                </button>
                <button className="cursor-pointer h-9 inline-flex items-center gap-1.5 px-3.5 rounded-full bg-surface-raised text-text-primary text-[12.5px] font-semibold border border-black/[0.05] active:bg-black/5 transition-colors">
                  <Flag className="w-3.5 h-3.5 text-accent" strokeWidth={2.4} />
                  Reportar
                </button>
                <div className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-success vl-eyebrow">
                  <span className="vl-status-dot text-success" />
                  <span className="pl-1.5">En vivo</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-surface-raised">
        <div className="px-5 pt-4 pb-4 flex items-baseline justify-between">
          <div className="vl-eyebrow text-text-secondary">
            Próximas llegadas
          </div>
          {rutas.length > 0 && (
            <span className="text-[11px] font-semibold text-text-secondary tabular">
              {rutas.length} {rutas.length === 1 ? 'ruta' : 'rutas'}
            </span>
          )}
        </div>

        <div className="px-4">
          <div className="rounded-[20px] bg-white border border-black/[0.05] vl-elev-1 overflow-hidden">
            {isLoading && (
              <>
                <RouteSkeletonRow />
                <RouteSkeletonRow />
                <RouteSkeletonRow />
              </>
            )}

            {isError && (
              <div className="text-center text-sm text-danger py-12">
                No se pudo cargar el paradero
              </div>
            )}

            {!isLoading &&
              rutas.map((r, idx) => {
                const cfg = estadoConfig[r.estado];
                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-4 px-4 py-4 ${
                      idx !== 0 ? 'border-t border-black/[0.05]' : ''
                    }`}
                  >
                    <div className="shrink-0 flex flex-col items-center w-[58px]">
                      <div
                        className={`text-[30px] font-bold tabular leading-none vl-display ${etaColor(r.etaMinutos, r.estado === 'ultimo_bus')}`}
                      >
                        {r.etaMinutos}
                      </div>
                      <div className="text-[10px] font-semibold text-text-secondary mt-0.5 tracking-wide">
                        MIN
                      </div>
                    </div>

                    <div className="w-px self-stretch bg-black/[0.06]" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center min-w-[42px] h-7 px-2.5 rounded-full bg-text-primary text-white text-[12.5px] font-bold tabular tracking-wide">
                          {r.nombre}
                        </span>
                        <span className="text-[15px] font-semibold text-text-primary truncate vl-headline">
                          {r.destino}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span
                          className={`text-[11.5px] font-semibold ${cfg.text} vl-eyebrow tracking-wide`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="px-5 mt-5 mb-6">
          <div className="rounded-[16px] border border-black/[0.05] bg-white p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-brand" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-text-primary leading-tight">
                Paradero verificado
              </div>
              <div className="text-[11.5px] text-text-secondary mt-0.5">
                Ubicación confirmada en los últimos 7 días
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function IconButton({
  Icon,
  ...rest
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  'aria-label': string;
}) {
  return (
    <button
      {...rest}
      className="cursor-pointer w-10 h-10 rounded-full flex items-center justify-center active:bg-surface-raised transition-colors"
    >
      <Icon className="w-[18px] h-[18px] text-text-primary" strokeWidth={2.2} />
    </button>
  );
}

function RouteSkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-4 border-t border-black/[0.05] first:border-t-0">
      <div className="shrink-0 w-[58px] space-y-1.5">
        <div className="h-7 w-10 rounded vl-shimmer" />
        <div className="h-2 w-6 rounded vl-shimmer" />
      </div>
      <div className="w-px self-stretch bg-black/[0.06]" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/5 rounded vl-shimmer" />
        <div className="h-2.5 w-1/4 rounded vl-shimmer" />
      </div>
    </div>
  );
}
