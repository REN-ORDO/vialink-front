import { useState } from 'react';
import { useGeocode } from '../../hooks/useGeocode';
import { dataSource } from '../../lib/dataSource';
import type { GeocodeSuggestion, LatLng, PlacePrediction } from '../../types';

type Props = {
  proximity?: LatLng;
  onSelect: (suggestion: GeocodeSuggestion) => void;
  placeholder?: string;
};

export default function AddressSearchBar({
  proximity,
  onSelect,
  placeholder,
}: Props) {
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const {
    data: predictions,
    isFetching,
    getSessionToken,
    rotateSessionToken,
  } = useGeocode(q, proximity);
  const open = focused && (q.length >= 3 || (predictions?.length ?? 0) > 0);

  async function handlePick(prediction: PlacePrediction) {
    if (resolvingId) return; // bloqueo doble-click
    setResolvingId(prediction.id);
    try {
      const suggestion = await dataSource.resolvePlace(prediction, {
        sessionToken: getSessionToken(),
      });
      onSelect(suggestion);
      setQ(suggestion.label);
      setFocused(false);
      // Cerrar la sesión: el próximo autocomplete usa token nuevo.
      rotateSessionToken();
    } catch (err) {
      console.warn('No se pudo resolver el lugar:', err);
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder ?? '¿A dónde vas?'}
        className="w-full px-4 py-3 rounded-2xl bg-white border border-black/[0.06] text-text-primary text-[15px] placeholder:text-text-secondary/80 outline-none vl-elev-2 vl-headline"
        data-testid="address-search-input"
        autoComplete="off"
      />
      {open && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl vl-elev-3 max-h-64 overflow-y-auto z-50 border border-black/[0.05]">
          {isFetching && (
            <li className="px-4 py-3 text-text-secondary text-sm">
              Buscando…
            </li>
          )}
          {!isFetching &&
            (predictions?.length ?? 0) === 0 &&
            q.length >= 3 && (
              <li
                className="px-4 py-3 text-text-secondary text-sm"
                data-testid="address-empty"
              >
                No encontramos esa dirección
              </li>
            )}
          {predictions?.map((p) => {
            const isResolving = resolvingId === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={!!resolvingId}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePick(p)}
                  className="cursor-pointer w-full text-left px-4 py-3 hover:bg-surface-raised active:bg-surface-raised border-b border-black/[0.05] last:border-b-0 disabled:opacity-60"
                  data-testid="address-suggestion"
                >
                  <div className="font-medium text-text-primary text-[14.5px] vl-headline">
                    {p.label}
                    {isResolving && (
                      <span className="ml-2 text-xs text-text-secondary font-normal">
                        resolviendo…
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary truncate mt-0.5">
                    {p.fullAddress}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
