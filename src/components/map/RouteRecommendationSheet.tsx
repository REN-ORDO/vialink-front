import { useState } from 'react';
import {
  X,
  Footprints,
  Clock3,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { useRouteRecommendation } from '../../hooks/useRouteRecommendation';
import type { LatLng, TripRouteRecommendation } from '../../types';

type Props = {
  destination: LatLng | null;
  destinationLabel?: string;
  userLocation?: LatLng;
  onClose: () => void;
  /** El parent decide qué hacer cuando el user selecciona una rec
   *  (ej: resaltar bus, dibujar polyline, navegar a viaje). */
  onSelectRecommendation?: (rec: TripRouteRecommendation) => void;
};

export default function RouteRecommendationSheet({
  destination,
  destinationLabel,
  userLocation,
  onClose,
  onSelectRecommendation,
}: Props) {
  const { data, isFetching, error } = useRouteRecommendation(
    userLocation,
    destination,
  );
  const [expandedRank, setExpandedRank] = useState<number | null>(1);

  if (!destination) return null;

  const recs = data?.recommendations ?? [];
  const top = recs[0];
  const alternatives = recs.slice(1);

  return (
    <div
      data-testid="route-recommendation-sheet"
      className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl vl-elev-3 border-t border-black/[0.05] pb-[max(20px,env(safe-area-inset-bottom))] max-h-[70vh] overflow-y-auto"
    >
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <div className="vl-eyebrow text-text-secondary">Cómo llegar a</div>
          <h2 className="text-[18px] font-bold text-text-primary truncate vl-headline">
            {destinationLabel || 'tu destino'}
          </h2>
        </div>
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="cursor-pointer shrink-0 w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center active:scale-95"
        >
          <X className="w-[16px] h-[16px] text-text-primary" strokeWidth={2.4} />
        </button>
      </div>

      {/* Loading / error / vacío */}
      {!userLocation && (
        <div className="px-5 py-6 text-sm text-text-secondary text-center">
          Necesitamos tu ubicación para calcular la mejor ruta.
        </div>
      )}
      {userLocation && isFetching && !data && (
        <div className="px-5 py-6 text-sm text-text-secondary text-center">
          Calculando la mejor ruta…
        </div>
      )}
      {error && (
        <div className="px-5 py-6 text-sm text-error text-center">
          No pudimos calcular la ruta. Intenta de nuevo.
        </div>
      )}
      {data && recs.length === 0 && (
        <div className="px-5 py-8 text-sm text-text-secondary text-center">
          No encontramos buses convenientes a menos de 5 cuadras
          de tu ubicación o de tu destino.
        </div>
      )}

      {/* Recomendación principal */}
      {top && (
        <div className="px-5">
          <TopRecommendationCard
            rec={top}
            isExpanded={expandedRank === top.rank}
            onToggle={() =>
              setExpandedRank(expandedRank === top.rank ? null : top.rank)
            }
            onSelect={() => onSelectRecommendation?.(top)}
          />
        </div>
      )}

      {/* Alternativas */}
      {alternatives.length > 0 && (
        <div className="px-5 pt-4 pb-2">
          <div className="vl-eyebrow text-text-secondary mb-2">
            Otras opciones
          </div>
          <div className="space-y-2">
            {alternatives.map((rec) => (
              <AlternativeCard
                key={rec.rank}
                rec={rec}
                isExpanded={expandedRank === rec.rank}
                onToggle={() =>
                  setExpandedRank(expandedRank === rec.rank ? null : rec.rank)
                }
                onSelect={() => onSelectRecommendation?.(rec)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function TopRecommendationCard({
  rec,
  isExpanded,
  onToggle,
  onSelect,
}: {
  rec: TripRouteRecommendation;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-black/[0.06] bg-brand/[0.04] overflow-hidden"
      data-testid="rec-card-top"
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center min-w-[48px] h-9 px-2.5 rounded-md text-white text-[14px] font-bold tabular tracking-wide"
            style={{ backgroundColor: rec.bus.routeColor }}
            data-testid="rec-route-code"
          >
            {rec.bus.routeCode}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-text-secondary truncate">
              {rec.bus.routeName}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-bold text-text-primary tabular vl-display">
                {rec.totalMinutes}
              </span>
              <span className="text-[13px] text-text-secondary">
                min total
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="vl-eyebrow text-text-secondary">Llega en</div>
            <div className="text-[15px] font-bold text-success tabular">
              {rec.bus.waitMinutes} min
            </div>
          </div>
        </div>

        <button
          onClick={onSelect}
          className="cursor-pointer mt-3 w-full h-11 rounded-full bg-text-primary text-white text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          data-testid="rec-select-button"
        >
          Tomar este bus
          <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
        </button>
      </div>

      {/* Detalle expandible */}
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="cursor-pointer w-full px-4 py-2.5 flex items-center justify-between text-[12.5px] font-semibold text-text-secondary border-t border-black/[0.05] active:bg-surface-raised"
      >
        <span>{isExpanded ? 'Ocultar detalle' : 'Ver detalle del viaje'}</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isExpanded && <Timeline rec={rec} />}
    </div>
  );
}

function AlternativeCard({
  rec,
  isExpanded,
  onToggle,
  onSelect,
}: {
  rec: TripRouteRecommendation;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-black/[0.05] bg-white overflow-hidden"
      data-testid="rec-card-alt"
    >
      <div className="px-3.5 py-3 flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center min-w-[40px] h-8 px-2 rounded-md text-white text-[12.5px] font-bold tabular"
          style={{ backgroundColor: rec.bus.routeColor }}
        >
          {rec.bus.routeCode}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold text-text-primary truncate">
            {rec.bus.routeName}
          </div>
          <div className="text-[11.5px] text-text-secondary flex items-center gap-1.5 mt-0.5">
            <Clock3 className="w-3 h-3" strokeWidth={2.4} />
            <span className="tabular font-semibold">
              {rec.totalMinutes} min
            </span>
            <span>·</span>
            <span>llega en {rec.bus.waitMinutes} min</span>
          </div>
        </div>
        <button
          onClick={onToggle}
          aria-label={isExpanded ? 'Ocultar' : 'Ver más'}
          className="cursor-pointer w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center active:scale-95"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-text-primary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-primary" />
          )}
        </button>
      </div>
      {isExpanded && (
        <>
          <Timeline rec={rec} />
          <div className="px-3.5 py-3 border-t border-black/[0.05]">
            <button
              onClick={onSelect}
              className="cursor-pointer w-full h-10 rounded-full border border-black/[0.08] text-[13.5px] font-semibold text-text-primary active:bg-surface-raised"
            >
              Tomar este bus
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Timeline({ rec }: { rec: TripRouteRecommendation }) {
  return (
    <ol className="relative px-4 py-3 border-t border-black/[0.05] bg-white/60">
      <span className="absolute left-[24px] top-5 bottom-5 w-px bg-brand/30" />

      <li className="relative pl-9 pb-2.5 flex items-start gap-3">
        <span className="absolute left-3 top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-brand" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-text-primary flex items-center gap-1.5">
            <Footprints className="w-3.5 h-3.5 text-text-secondary" />
            Camina {rec.walkingToBoard.blocks}
            {rec.walkingToBoard.blocks === 1 ? ' cuadra' : ' cuadras'}
            <span className="text-text-secondary font-normal">
              ({rec.walkingToBoard.distanceM}m, ~{rec.walkingToBoard.durationMinutes} min)
            </span>
          </div>
          <div className="text-[12px] text-text-secondary mt-0.5">
            a {rec.walkingToBoard.paradero.name}
          </div>
        </div>
      </li>

      <li className="relative pl-9 pb-2.5 flex items-start gap-3">
        <span
          className="absolute left-3 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow"
          style={{ backgroundColor: rec.bus.routeColor }}
        />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-text-primary">
            Toma {rec.bus.routeCode}
            <span className="text-text-secondary font-normal">
              {' '}· espera ~{rec.bus.waitMinutes} min
            </span>
          </div>
          <div className="text-[12px] text-text-secondary mt-0.5">
            Viaja {rec.bus.rideMinutes} min en bus (plate {rec.bus.plate})
          </div>
        </div>
      </li>

      <li className="relative pl-9 flex items-start gap-3">
        <span className="absolute left-3 top-0.5 w-3.5 h-3.5 rounded-full bg-success border-2 border-white shadow" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-text-primary flex items-center gap-1.5">
            <Footprints className="w-3.5 h-3.5 text-text-secondary" />
            Camina {rec.walkingFromAlight.blocks}
            {rec.walkingFromAlight.blocks === 1 ? ' cuadra' : ' cuadras'}
            <span className="text-text-secondary font-normal">
              ({rec.walkingFromAlight.distanceM}m)
            </span>
          </div>
          <div className="text-[12px] text-text-secondary mt-0.5">
            desde {rec.walkingFromAlight.paradero.name} a tu destino
          </div>
        </div>
      </li>
    </ol>
  );
}
