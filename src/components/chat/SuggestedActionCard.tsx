import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Route, Bell, ArrowUpRight } from 'lucide-react';
import type { RouteRecommendation, SuggestedAction } from '../../types';

type Props = {
  action: SuggestedAction;
  recommendation?: RouteRecommendation;
};

export default function SuggestedActionCard({ action, recommendation }: Props) {
  const navigate = useNavigate();

  if (action.type === 'START_TRIP') {
    const rutaCode = action.routeCode ?? recommendation?.rutaNombre ?? '—';
    const destino = action.destination ?? recommendation?.destino ?? 'destino';
    const origen = recommendation?.origen;
    const duracion = recommendation?.duracionMinutos;

    return (
      <div className="bg-white rounded-[18px] vl-elev-2 border border-black/[0.05] overflow-hidden">
        <div className="px-4 pt-4 pb-3 flex items-center gap-3.5">
          {duracion !== undefined && (
            <>
              <div className="flex flex-col items-center w-12 shrink-0">
                <div className="text-[26px] font-bold text-text-primary tabular leading-none vl-display">
                  {duracion}
                </div>
                <div className="text-[10px] font-semibold text-text-secondary mt-0.5 tracking-wide">
                  MIN
                </div>
              </div>
              <div className="w-px self-stretch bg-black/[0.06]" />
            </>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center min-w-[42px] h-7 px-2.5 rounded-full bg-text-primary text-white text-[12.5px] font-bold tabular tracking-wide">
                {rutaCode}
              </span>
              <span className="vl-eyebrow text-text-secondary">Sugerida</span>
            </div>
            <div className="text-[14.5px] font-semibold text-text-primary mt-1.5 vl-headline leading-tight truncate">
              {origen ? `${origen} → ${destino}` : destino}
            </div>
          </div>
        </div>
        <div className="border-t border-black/[0.05] grid grid-cols-2 divide-x divide-black/[0.05]">
          <button
            onClick={() =>
              recommendation?.paraderoOrigenId
                ? navigate(`/paradero/${recommendation.paraderoOrigenId}`)
                : navigate('/')
            }
            className="cursor-pointer h-11 text-text-primary text-[13px] font-semibold flex items-center justify-center gap-1.5 active:bg-surface-raised transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-brand" strokeWidth={2.4} />
            Ver paradero
          </button>
          <button
            onClick={() => navigate('/viaje/v1')}
            className="cursor-pointer h-11 text-brand text-[13px] font-bold flex items-center justify-center gap-1.5 active:bg-brand/5 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" strokeWidth={2.5} />
            Iniciar viaje
          </button>
        </div>
      </div>
    );
  }

  if (action.type === 'SHOW_ROUTE') {
    return (
      <button
        onClick={() => navigate('/')}
        className="cursor-pointer w-full bg-white rounded-[16px] border border-black/[0.05] vl-elev-1 px-4 py-3 flex items-center gap-3 active:bg-surface-raised transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
          <Route className="w-4 h-4 text-brand" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="vl-eyebrow text-text-secondary">Ver ruta</div>
          <div className="text-[14.5px] font-semibold text-text-primary truncate vl-headline mt-0.5">
            {action.routeCode}
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-text-secondary" strokeWidth={2.4} />
      </button>
    );
  }

  if (action.type === 'SHOW_LANDMARK') {
    return (
      <button
        onClick={() => navigate(`/paradero/${action.landmarkId}`)}
        className="cursor-pointer w-full bg-white rounded-[16px] border border-black/[0.05] vl-elev-1 px-4 py-3 flex items-center gap-3 active:bg-surface-raised transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-brand" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="vl-eyebrow text-text-secondary">Abrir lugar</div>
          <div className="text-[14.5px] font-semibold text-text-primary truncate vl-headline mt-0.5">
            {action.landmarkName ?? action.landmarkId}
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-text-secondary" strokeWidth={2.4} />
      </button>
    );
  }

  if (action.type === 'OPEN_WAIT_PIN') {
    return (
      <button
        onClick={() => navigate('/')}
        className="cursor-pointer w-full bg-white rounded-[16px] border border-accent/30 vl-elev-1 px-4 py-3 flex items-center gap-3 active:bg-accent/5 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 text-accent" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="vl-eyebrow text-accent">Avísame</div>
          <div className="text-[14.5px] font-semibold text-text-primary truncate vl-headline mt-0.5">
            Crear pin de espera aquí
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-accent" strokeWidth={2.4} />
      </button>
    );
  }

  return null;
}
