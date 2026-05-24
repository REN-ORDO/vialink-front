import { Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import type { LatLng, TripRouteRecommendation } from '../../types';

/**
 * Renderiza dentro de <MapView> la visualización completa de una
 * recomendación de ruta seleccionada:
 *
 *   user 🔵 - - dashed - - 🟢 board paradero
 *                            ━━━━ bus segment (color de la ruta) ━━━━
 *                                                                 🔷 alight paradero
 *                                                                    - - dashed - - 🔴 destination
 *
 * Las dos caminatas son línea recta (Phase 6 podría usar Mapbox walking).
 * El tramo bus viene del PostGIS `ST_LineSubstring` ya recortado al
 * subset board→alight, así que es preciso sobre la malla vial real.
 */

type Props = {
  recommendation: TripRouteRecommendation;
  userLocation: LatLng;
  destination: LatLng;
};

// ============================================================
// Iconos custom (DivIcon stable, no se rebuildean en cada render)
// ============================================================

const boardIcon = L.divIcon({
  className: 'vl-rec-paradero-marker vl-rec-paradero-board',
  html: `
    <div class="vl-rec-paradero-wrap">
      <span class="vl-rec-paradero-halo"></span>
      <span class="vl-rec-paradero-pin vl-rec-paradero-pin--board">🚌</span>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const alightIcon = L.divIcon({
  className: 'vl-rec-paradero-marker vl-rec-paradero-alight',
  html: `
    <div class="vl-rec-paradero-wrap">
      <span class="vl-rec-paradero-halo vl-rec-paradero-halo--alight"></span>
      <span class="vl-rec-paradero-pin vl-rec-paradero-pin--alight">📍</span>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const destinationIcon = L.divIcon({
  className: 'vl-rec-destination-marker',
  html: `
    <div class="vl-rec-destination-wrap">
      <span class="vl-rec-destination-halo"></span>
      <span class="vl-rec-destination-pin">🎯</span>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

export default function RouteVisualizer({
  recommendation,
  userLocation,
  destination,
}: Props) {
  const board = recommendation.walkingToBoard.paradero;
  const alight = recommendation.walkingFromAlight.paradero;
  const busPolyline = recommendation.polylineBus;

  // Caminata user → board (línea recta dashed)
  const walkToBoardCoords: [number, number][] = [
    [userLocation.lat, userLocation.lng],
    [board.lat, board.lng],
  ];

  // Caminata alight → destination (línea recta dashed)
  const walkFromAlightCoords: [number, number][] = [
    [alight.lat, alight.lng],
    [destination.lat, destination.lng],
  ];

  // Polyline del tramo en bus (PostGIS lo cortó del corridor real)
  const busSegmentCoords: [number, number][] = busPolyline.map((p) => [
    p.lat,
    p.lng,
  ]);

  return (
    <>
      {/* Walking: user → board paradero */}
      <Polyline
        positions={walkToBoardCoords}
        pathOptions={{
          color: '#5B6470',
          weight: 4,
          opacity: 0.7,
          dashArray: '2 8',
          lineCap: 'round',
        }}
      />

      {/* Bus segment con halo blanco debajo (look "outline") */}
      {busSegmentCoords.length > 1 && (
        <>
          <Polyline
            positions={busSegmentCoords}
            pathOptions={{
              color: '#FFFFFF',
              weight: 9,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          <Polyline
            positions={busSegmentCoords}
            pathOptions={{
              color: recommendation.bus.routeColor,
              weight: 6,
              opacity: 1,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </>
      )}

      {/* Walking: alight → destination */}
      <Polyline
        positions={walkFromAlightCoords}
        pathOptions={{
          color: '#5B6470',
          weight: 4,
          opacity: 0.7,
          dashArray: '2 8',
          lineCap: 'round',
        }}
      />

      {/* Markers resaltados */}
      <Marker position={[board.lat, board.lng]} icon={boardIcon} />
      <Marker position={[alight.lat, alight.lng]} icon={alightIcon} />
      <Marker
        position={[destination.lat, destination.lng]}
        icon={destinationIcon}
      />
    </>
  );
}
