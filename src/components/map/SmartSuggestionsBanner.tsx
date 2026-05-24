import { Sparkles } from 'lucide-react';
import type { SmartSuggestion, TripRouteRecommendation } from '../../types';

type Props = {
  suggestions: SmartSuggestion[];
  /** Lista completa de recs para que el click pueda re-commitear */
  recommendations: TripRouteRecommendation[];
  onPickAlternative?: (rec: TripRouteRecommendation) => void;
};

/**
 * Banner de sugerencias smart del motor IA del backend.
 * Aparece entre el primary card y "Otras opciones" en el sheet.
 *
 * Cada sugerencia tiene texto natural (LLM) + click sobre ella
 * commitea la alternativa relacionada en el mapa.
 */
export default function SmartSuggestionsBanner({
  suggestions,
  recommendations,
  onPickAlternative,
}: Props) {
  if (suggestions.length === 0) return null;

  return (
    <div className="px-5 pt-4">
      <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-50 to-amber-100/40 overflow-hidden">
        <div className="px-4 pt-3 pb-2 flex items-center gap-2">
          <Sparkles
            className="w-4 h-4 text-amber-600"
            strokeWidth={2.4}
          />
          <span className="vl-eyebrow text-amber-700 font-semibold">
            Sugerencias smart
          </span>
        </div>
        <div className="px-4 pb-3 space-y-2">
          {suggestions.map((s, i) => {
            const altRec = recommendations[s.alternativeRank - 1];
            return (
              <button
                key={i}
                type="button"
                onClick={() => altRec && onPickAlternative?.(altRec)}
                disabled={!altRec}
                className="cursor-pointer w-full text-left bg-white/70 hover:bg-white active:bg-white border border-amber-200/60 rounded-xl px-3.5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-default"
                data-testid={`smart-suggestion-${s.type}`}
              >
                <div className="text-[13.5px] text-text-primary leading-snug">
                  {s.text}
                </div>
                {altRec && (
                  <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1.5">
                    <span>Tomar este bus en lugar →</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
