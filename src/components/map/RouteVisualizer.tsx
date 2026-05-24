import { Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useWalkingRoute } from '../../hooks/useWalkingRoute';
import { useBusDetails } from '../../hooks/useBusDetails';
import type { LatLng, TripRouteRecommendation } from '../../types';

/**
 * Renderiza dentro de <MapView> la visualización completa de una
 * recomendación de ruta:
 *
 *   user 🔵 ┄┄ walk (siguiendo calles reales) ┄┄ 🟢 board
 *                                                  ━━━━ bus segment ━━━━
 *                                                                    🔷 alight
 *                                                                       ┄┄ walk ┄┄ 🎯 destino
 *
 * Las caminatas usan Mapbox Directions (walking profile) vía
 * `useWalkingRoute` — si falla, fallback a línea recta. El polyline
 * del bus viene pre-cortado del corridor (PostGIS ST_LineSubstring).
 */

type Props = {
  recommendation: TripRouteRecommendation;
  userLocation: LatLng;
  destination: LatLng;
};

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

  // Recorrido COMPLETO del corridor de la ruta. Lo trae useBusDetails
  // del backend (polyline del corridor completo). Lo mostramos en ámbar
  // discontinuo para que el user vea de dónde viene y a dónde va el bus
  // — distinto del segmento "tu trayecto" (color de ruta, sólido).
  const { data: busDetails } = useBusDetails(recommendation.bus.id);
  const fullCorridorCoords: [number, number][] =
    busDetails?.polyline?.map((p) => [p.lat, p.lng]) ?? [];

  // Caminatas reales (siguen calles). Mapbox bajo el hood en backend.
  // Mientras llegan, mostramos línea recta como placeholder.
  const walkToBoardQ = useWalkingRoute(userLocation, {
    lat: board.lat,
    lng: board.lng,
  });
  const walkFromAlightQ = useWalkingRoute(
    { lat: alight.lat, lng: alight.lng },
    destination,
  );

  const walkToBoardCoords: [number, number][] = (
    walkToBoardQ.data?.polyline ?? [userLocation, { lat: board.lat, lng: board.lng }]
  ).map((p) => [p.lat, p.lng]);

  const walkFromAlightCoords: [number, number][] = (
    walkFromAlightQ.data?.polyline ?? [{ lat: alight.lat, lng: alight.lng }, destination]
  ).map((p) => [p.lat, p.lng]);

  const busSegmentCoords: [number, number][] = busPolyline.map((p) => [
    p.lat,
    p.lng,
  ]);

  return (
    <>
      {/* Recorrido COMPLETO del bus (de dónde viene + a dónde va).
          Va PRIMERO en el render para que queden debajo de las otras
          polylines. Color ámbar discontinuo — distinto del color de
          la ruta (que se usa para "tu segmento") y del gris (caminata). */}
      {fullCorridorCoords.length > 1 && (
        <Polyline
          positions={fullCorridorCoords}
          pathOptions={{
            color: '#F59E0B',
            weight: 3.5,
            opacity: 0.55,
            dashArray: '12 7',
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}

      {/* Walking: user → board (caminata real siguiendo calles) */}
      <Polyline
        positions={walkToBoardCoords}
        pathOptions={{
          color: '#5B6470',
          weight: 4,
          opacity: 0.75,
          dashArray: '2 8',
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {/* Bus segment con outline blanco (look elevado) — TU TRAMO */}
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

      {/* Walking: alight → destination (caminata real) */}
      <Polyline
        positions={walkFromAlightCoords}
        pathOptions={{
          color: '#5B6470',
          weight: 4,
          opacity: 0.75,
          dashArray: '2 8',
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      <Marker position={[board.lat, board.lng]} icon={boardIcon} />
      <Marker position={[alight.lat, alight.lng]} icon={alightIcon} />
      <Marker
        position={[destination.lat, destination.lng]}
        icon={destinationIcon}
      />
    </>
  );
}
