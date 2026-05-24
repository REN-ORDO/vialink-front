import { Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import type { TripRouteRecommendation } from '../../types';

/**
 * Pinta las rutas alternativas (rank ≥ 2) sobre el mapa en colores
 * distintos al primary, para que el user vea visualmente que tiene
 * más opciones aunque el sheet le muestre la primary committed.
 *
 * - Alt 1: ámbar (más cercana al user)
 * - Alt 2: cyan
 * - Alt 3: rosa
 *
 * Cada polyline:
 *   - Sólida, weight 4.5, opacity 0.7. Sigue siendo secundaria al
 *     primary (weight 6 + outline blanco + opacity 1).
 *   - Tap → onPickAlternative(alt) → re-commitea esa ruta como primary
 *   - Pill flotante en el midpoint con nombre + tiempo total
 */

type Props = {
  alternatives: TripRouteRecommendation[];
  onPickAlternative?: (alt: TripRouteRecommendation) => void;
};

// Alts ordenadas en backend por walk_to_board ASC = la primera de estas
// es la más cercana al user, etc. Colores fuertes y distintos para que
// no se confundan entre sí ni con el primary (color de la ruta).
const ALT_STYLES = [
  { color: '#F59E0B', name: 'amber' },  // alt 1 — más cercana al user
  { color: '#06B6D4', name: 'cyan' },   // alt 2
  { color: '#EC4899', name: 'pink' },   // alt 3
] as const;

/** DivIcon de la pill flotante con nombre + tiempo. */
function makeAltLabelIcon(color: string, text: string, minutes: number): L.DivIcon {
  return L.divIcon({
    className: 'vl-alt-route-label',
    html: `
      <div class="vl-alt-route-pill" style="border-color:${color};">
        <span class="vl-alt-route-pill-dot" style="background:${color};"></span>
        <span class="vl-alt-route-pill-text">${escapeHtml(text)}</span>
        <span class="vl-alt-route-pill-min">${minutes}m</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Devuelve el punto medio del polyline (índice central, no centroide). */
function midpoint(coords: { lat: number; lng: number }[]): { lat: number; lng: number } | null {
  if (coords.length === 0) return null;
  return coords[Math.floor(coords.length / 2)];
}

export default function AlternativeRoutesLayer({
  alternatives,
  onPickAlternative,
}: Props) {
  if (alternatives.length === 0) return null;
  return (
    <>
      {alternatives.slice(0, 3).map((alt, idx) => {
        const style = ALT_STYLES[idx];
        const coords: [number, number][] = alt.polylineBus.map((p) => [p.lat, p.lng]);
        if (coords.length < 2) return null;
        const mid = midpoint(alt.polylineBus);
        return (
          <Polyline
            key={alt.bus.id}
            positions={coords}
            pathOptions={{
              color: style.color,
              weight: 4.5,
              opacity: 0.7,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            eventHandlers={
              onPickAlternative
                ? { click: () => onPickAlternative(alt) }
                : undefined
            }
          >
            {/* La pill aparece como un Marker auxiliar en el midpoint */}
            {mid && (
              <></>
            )}
          </Polyline>
        );
      }).filter(Boolean)}

      {/* Pills flotantes con el nombre de cada alternativa.
          Se renderizan como Markers separados porque Polyline no soporta
          children Marker en react-leaflet. */}
      {alternatives.slice(0, 3).map((alt, idx) => {
        const style = ALT_STYLES[idx];
        const mid = midpoint(alt.polylineBus);
        if (!mid) return null;
        return (
          <Marker
            key={`label-${alt.bus.id}`}
            position={[mid.lat, mid.lng]}
            icon={makeAltLabelIcon(
              style.color,
              alt.bus.routeName,
              alt.totalMinutes,
            )}
            eventHandlers={
              onPickAlternative
                ? { click: () => onPickAlternative(alt) }
                : undefined
            }
          />
        );
      })}
    </>
  );
}
