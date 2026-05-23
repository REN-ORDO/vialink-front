import { useNavigate } from 'react-router-dom';
import { Navigation, MapPin, Zap, Shield, Star, Clock } from 'lucide-react';
import type { AlternativeRoute } from '../../types';

type Props = { alternatives: AlternativeRoute[] };

const BADGE_LABEL: Record<NonNullable<AlternativeRoute['badge']>, string> = {
  recomendada: 'Recomendada',
  mas_rapida: 'Más rápida',
  mas_segura: 'Más segura',
  ultimo_bus: 'Último bus',
};

const BADGE_ICON: Record<
  NonNullable<AlternativeRoute['badge']>,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  recomendada: Star,
  mas_rapida: Zap,
  mas_segura: Shield,
  ultimo_bus: Clock,
};

const BADGE_COLOR: Record<NonNullable<AlternativeRoute['badge']>, string> = {
  recomendada: 'text-brand bg-brand/10 border-brand/20',
  mas_rapida: 'text-success bg-success/10 border-success/20',
  mas_segura: 'text-text-primary bg-black/[0.06] border-black/[0.06]',
  ultimo_bus: 'text-accent bg-accent/10 border-accent/20',
};

export default function AlternativesStack({ alternatives }: Props) {
  const navigate = useNavigate();
  if (!alternatives.length) return null;

  return (
    <div className="space-y-2">
      <div className="vl-eyebrow text-text-secondary px-1">
        {alternatives.length} alternativas
      </div>

      {alternatives.map((alt, idx) => {
        const isPrimary = idx === 0;
        const Badge = alt.badge ? BADGE_ICON[alt.badge] : null;
        const badgeLabel = alt.badge ? BADGE_LABEL[alt.badge] : null;
        const badgeColor = alt.badge ? BADGE_COLOR[alt.badge] : '';

        return (
          <div
            key={alt.rank}
            className={`bg-white rounded-[18px] border overflow-hidden ${
              isPrimary
                ? 'border-brand/25 vl-elev-2'
                : 'border-black/[0.05] vl-elev-1'
            }`}
          >
            <div className="px-4 pt-3.5 pb-3 flex items-start gap-3.5">
              <div className="shrink-0 flex flex-col items-center w-12">
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
                  Opción
                </div>
                <div className="text-[26px] font-bold text-text-primary tabular leading-none vl-display mt-0.5">
                  {alt.rank}
                </div>
              </div>

              <div className="w-px self-stretch bg-black/[0.06]" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Badge && badgeLabel && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10.5px] font-bold uppercase tracking-wide ${badgeColor}`}
                    >
                      <Badge className="w-3 h-3" strokeWidth={2.6} />
                      {badgeLabel}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-text-secondary text-[11.5px] font-semibold tabular">
                    <Clock className="w-3 h-3" strokeWidth={2.4} />
                    {alt.duracionMinutos} min
                  </span>
                </div>

                <div className="text-[14.5px] font-bold text-text-primary mt-1.5 vl-headline leading-tight">
                  {alt.label}
                </div>

                <div className="flex items-center gap-1.5 mt-1 text-[12px] text-text-secondary truncate">
                  <span className="inline-flex items-center justify-center min-w-[34px] h-5 px-1.5 rounded-md bg-text-primary text-white text-[10.5px] font-bold tabular tracking-wide">
                    {alt.rutaNombre}
                  </span>
                  <span className="truncate">
                    {alt.origen} → {alt.destino}
                  </span>
                </div>

                {alt.insight && (
                  <div className="mt-2 text-[12.5px] text-text-secondary leading-snug">
                    {alt.insight}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-black/[0.05] grid grid-cols-2 divide-x divide-black/[0.05]">
              <button
                onClick={() =>
                  alt.paraderoOrigenId
                    ? navigate(`/paradero/${alt.paraderoOrigenId}`)
                    : navigate('/')
                }
                className="cursor-pointer h-11 text-text-primary text-[13px] font-semibold flex items-center justify-center gap-1.5 active:bg-surface-raised transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-brand" strokeWidth={2.4} />
                Ver paradero
              </button>
              <button
                onClick={() => navigate('/viaje/v1')}
                className={`cursor-pointer h-11 text-[13px] font-bold flex items-center justify-center gap-1.5 active:bg-brand/5 transition-colors ${
                  isPrimary ? 'text-brand' : 'text-text-primary'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" strokeWidth={2.5} />
                {isPrimary ? 'Iniciar este' : 'Tomar esta'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
