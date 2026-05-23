import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation } from 'lucide-react';
import type { RouteRecommendation } from '../../types';

type Props = { recommendation: RouteRecommendation };

export default function RouteRecommendationCard({ recommendation }: Props) {
  const navigate = useNavigate();
  const { rutaNombre, origen, destino, duracionMinutos, paraderoOrigenId } =
    recommendation;

  return (
    <div className="bg-white rounded-[18px] vl-elev-2 border border-black/[0.05] overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3.5">
        <div className="flex flex-col items-center w-12 shrink-0">
          <div className="text-[26px] font-bold text-text-primary tabular leading-none vl-display">
            {duracionMinutos}
          </div>
          <div className="text-[10px] font-semibold text-text-secondary mt-0.5 tracking-wide">
            MIN
          </div>
        </div>
        <div className="w-px self-stretch bg-black/[0.06]" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center min-w-[42px] h-7 px-2.5 rounded-full bg-text-primary text-white text-[12.5px] font-bold tabular tracking-wide">
              {rutaNombre}
            </span>
            <span className="vl-eyebrow text-text-secondary">Sugerida</span>
          </div>
          <div className="text-[14.5px] font-semibold text-text-primary mt-1.5 vl-headline leading-tight truncate">
            {origen} → {destino}
          </div>
        </div>
      </div>
      <div className="border-t border-black/[0.05] grid grid-cols-2 divide-x divide-black/[0.05]">
        <button
          onClick={() => navigate(`/paradero/${paraderoOrigenId}`)}
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
