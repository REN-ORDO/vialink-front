import { useEffect, useRef, useState } from 'react';
import {
  X,
  Footprints,
  Clock3,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Gauge,
  MapPin,
} from 'lucide-react';
import { useRouteRecommendation } from '../../hooks/useRouteRecommendation';
import { useBusDetails } from '../../hooks/useBusDetails';
import { useRealtime } from '../../hooks/useRealtime';
import SmartSuggestionsBanner from './SmartSuggestionsBanner';
import type { LatLng, TripRouteRecommendation } from '../../types';

type Props = {
  destination: LatLng | null;
  destinationLabel?: string;
  userLocation?: LatLng;
  /** Rec actualmente committeada (visualizada en mapa). El sheet la
   *  muestra como primaria y carga su info en vivo del bus. */
  committedRec?: TripRouteRecommendation | null;
  onClose: () => void;
  /** El parent decide qué hacer cuando el user selecciona una rec
   *  (ej: resaltar bus, dibujar polyline, navegar a viaje). */
  onSelectRecommendation?: (rec: TripRouteRecommendation) => void;
};

export default function RouteRecommendationSheet({
  destination,
  destinationLabel,
  userLocation,
  committedRec,
  onClose,
  onSelectRecommendation,
}: Props) {
  const { data, isFetching, error } = useRouteRecommendation(
    userLocation,
    destination,
  );
  const [expandedRank, setExpandedRank] = useState<number | null>(null);

  // Auto-commit del top recomendado apenas llega el primer resultado.
  // Así el mapa pinta la ruta sin que el user tenga que tocar nada.
  const autoCommittedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!data || data.recommendations.length === 0) return;
    if (!onSelectRecommendation) return;
    const top = data.recommendations[0];
    const key = `${destination?.lat},${destination?.lng}`;
    if (autoCommittedKeyRef.current === key) return;
    autoCommittedKeyRef.current = key;
    onSelectRecommendation(top);
  }, [data, destination, onSelectRecommendation]);

  if (!destination) return null;

  const recs = data?.recommendations ?? [];
  // El "displayed" es el committed (si hay) o el top por default.
  // Esto separa visualmente el "activo en mapa" de los "alternativas".
  const displayed = committedRec ?? recs[0];
  const alternatives = recs.filter(
    (r) => !displayed || r.bus.id !== displayed.bus.id,
  );

  return (
    <div
      data-testid="route-recommendation-sheet"
      className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl vl-elev-3 border-t border-black/[0.05] pb-[max(20px,env(safe-area-inset-bottom))] max-h-[80vh] overflow-y-auto"
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

      {/* Primary card: routing + live bus data, todo en uno.
          Carousel arriba para saltar entre primary y alternativas con
          flechas laterales — el dot del color de la ruta marca cuál
          está activa. Refleja en mapa al instante (re-commit). */}
      {displayed && (
        <div className="px-5">
          <RouteCarouselNav
            recs={recs}
            displayed={displayed}
            onSelect={onSelectRecommendation}
          />
          <PrimaryCard rec={displayed} userLocation={userLocation} />
        </div>
      )}

      {/* Sugerencias smart del motor IA (heurísticas + LLM wording).
          Aparecen ENTRE el primary y las alternativas — son
          contextuales: "si esperás 3 min más...", "Transmetro también
          te lleva...". Tap → commitea la alternativa relacionada. */}
      {data?.smartSuggestions && data.smartSuggestions.length > 0 && (
        <SmartSuggestionsBanner
          suggestions={data.smartSuggestions}
          recommendations={recs}
          onPickAlternative={onSelectRecommendation}
        />
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
// RouteCarouselNav — flechas laterales para saltar entre recs
// ============================================================

/**
 * Navegador estilo carousel arriba del PrimaryCard:
 *
 *   [ < ]    ● ○ ○ ○   Opción 1 de 4    [ > ]
 *
 * - Dot activo = pill del color de la ruta committeada.
 * - Dots inactivos = gris claro.
 * - Flechas saltan al anterior/siguiente rec del array y re-commitean
 *   (esto re-pinta el mapa al instante).
 * - No se muestra si solo hay 1 rec.
 */
function RouteCarouselNav({
  recs,
  displayed,
  onSelect,
}: {
  recs: TripRouteRecommendation[];
  displayed: TripRouteRecommendation;
  onSelect?: (rec: TripRouteRecommendation) => void;
}) {
  if (recs.length <= 1) return null;
  const currentIdx = recs.findIndex((r) => r.bus.id === displayed.bus.id);
  if (currentIdx === -1) return null;

  const prev = currentIdx > 0 ? recs[currentIdx - 1] : null;
  const next = currentIdx < recs.length - 1 ? recs[currentIdx + 1] : null;

  return (
    <div className="flex items-center justify-between gap-3 mb-3 pt-1">
      <button
        onClick={prev ? () => onSelect?.(prev) : undefined}
        disabled={!prev}
        aria-label="Ruta anterior"
        className="cursor-pointer w-10 h-10 rounded-full bg-white border border-black/[0.08] vl-elev-1 flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft
          className="w-[18px] h-[18px] text-text-primary"
          strokeWidth={2.6}
        />
      </button>

      <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {recs.map((rec, idx) => (
            <span
              key={rec.bus.id}
              className={`rounded-full transition-all duration-200 ${
                idx === currentIdx ? 'w-6 h-2' : 'w-2 h-2'
              }`}
              style={{
                backgroundColor:
                  idx === currentIdx ? rec.bus.routeColor : '#D1D5DB',
              }}
            />
          ))}
        </div>
        <div className="text-[10.5px] uppercase tracking-wider font-bold text-text-secondary">
          Opción {currentIdx + 1} de {recs.length}
        </div>
      </div>

      <button
        onClick={next ? () => onSelect?.(next) : undefined}
        disabled={!next}
        aria-label="Siguiente ruta"
        className="cursor-pointer w-10 h-10 rounded-full bg-white border border-black/[0.08] vl-elev-1 flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight
          className="w-[18px] h-[18px] text-text-primary"
          strokeWidth={2.6}
        />
      </button>
    </div>
  );
}

// ============================================================
// PrimaryCard — la rec activa con todo: header + timeline + bus live
// ============================================================

function PrimaryCard({
  rec,
  userLocation,
}: {
  rec: TripRouteRecommendation;
  userLocation?: LatLng;
}) {
  // Suscribimos al room del bus para refresh frecuente de su data
  useRealtime({
    rooms: [`bus:${rec.bus.id}`],
    enabled: true,
  });
  const { data: busDetails } = useBusDetails(rec.bus.id, userLocation);

  return (
    <div
      className="rounded-2xl border border-black/[0.06] bg-brand/[0.04] overflow-hidden"
      data-testid="rec-card-top"
    >
      {/* Header con ruta + total + ETA principal */}
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
            <div className="vl-eyebrow text-text-secondary">Bus llega en</div>
            <div className="text-[15px] font-bold text-success tabular">
              {busDetails?.etaToUser?.etaSeconds != null
                ? formatEtaShort(busDetails.etaToUser.etaSeconds)
                : `${rec.bus.waitMinutes} min`}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline 3 pasos */}
      <Timeline rec={rec} />

      {/* Bus en vivo — info del bus específico, refresh en tiempo real */}
      <LiveBusInfo rec={rec} busDetails={busDetails} />
    </div>
  );
}

// ============================================================
// LiveBusInfo — métricas en vivo del bus dentro del mismo sheet
// ============================================================

function LiveBusInfo({
  rec,
  busDetails,
}: {
  rec: TripRouteRecommendation;
  busDetails: ReturnType<typeof useBusDetails>['data'];
}) {
  return (
    <section className="border-t border-black/[0.06] px-4 py-3 bg-white/60">
      <div className="vl-eyebrow text-text-secondary mb-2">
        🚌 Bus en vivo · {rec.bus.plate}
      </div>

      {!busDetails ? (
        <div className="text-[12px] text-text-secondary py-2">
          Cargando datos del bus…
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Velocidad + próximo paradero */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Gauge
                className="w-3.5 h-3.5 text-text-secondary shrink-0"
                strokeWidth={2.2}
              />
              <div className="min-w-0">
                <div className="vl-eyebrow text-text-secondary">Velocidad</div>
                <div className="text-[13px] font-bold tabular text-text-primary">
                  {busDetails.speedKmh.toFixed(0)} km/h
                </div>
              </div>
            </div>
            {busDetails.nextLandmark && (
              <div className="flex items-center gap-2 min-w-0">
                <MapPin
                  className="w-3.5 h-3.5 text-text-secondary shrink-0"
                  strokeWidth={2.2}
                />
                <div className="min-w-0">
                  <div className="vl-eyebrow text-text-secondary">
                    Próximo paradero
                  </div>
                  <div className="text-[13px] font-semibold text-text-primary truncate">
                    {busDetails.nextLandmark.name}
                  </div>
                  {busDetails.nextLandmark.etaSeconds != null && (
                    <div className="text-[11px] text-text-secondary">
                      {formatEtaShort(busDetails.nextLandmark.etaSeconds)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Progreso del recorrido */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-text-secondary tracking-wide">
                RECORRIDO DEL BUS
              </span>
              <span className="text-[11px] text-text-secondary tabular">
                {Math.round(busDetails.stats.completedPct * 100)}% ·{' '}
                {busDetails.stats.remainingKm.toFixed(1)} km restantes
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${busDetails.stats.completedPct * 100}%`,
                  backgroundColor: rec.bus.routeColor,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================
// AlternativeCard (compact, expandible)
// ============================================================

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
              className="cursor-pointer w-full h-10 rounded-full bg-text-primary text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              Cambiar a este bus
              <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Timeline — 3 pasos: caminata → bus → caminata
// ============================================================

function Timeline({ rec }: { rec: TripRouteRecommendation }) {
  return (
    <ol className="relative px-4 py-3 border-t border-black/[0.05]">
      <span className="absolute left-[24px] top-5 bottom-5 w-px bg-brand/30" />

      <li className="relative pl-9 pb-2.5 flex items-start gap-3">
        <span className="absolute left-3 top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-brand" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-text-primary flex items-center gap-1.5">
            <Footprints className="w-3.5 h-3.5 text-text-secondary" />
            Camina {rec.walkingToBoard.blocks}
            {rec.walkingToBoard.blocks === 1 ? ' cuadra' : ' cuadras'}
            <span className="text-text-secondary font-normal">
              ({rec.walkingToBoard.distanceM}m, ~
              {rec.walkingToBoard.durationMinutes} min)
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
              {' '}
              · espera ~{rec.bus.waitMinutes} min
            </span>
          </div>
          <div className="text-[12px] text-text-secondary mt-0.5">
            Viaja {rec.bus.rideMinutes} min en bus
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

// ============================================================
// Helpers
// ============================================================

function formatEtaShort(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} s`;
  const min = Math.round(seconds / 60);
  return `${min} min`;
}
