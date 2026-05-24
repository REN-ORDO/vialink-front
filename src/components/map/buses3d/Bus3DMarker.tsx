import { useEffect, useMemo, useRef, useState } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Bus } from '../../../types';
import { getOperator } from '../../../config/operators';
import { zoomToLOD, type LOD } from '../../../lib/lod/zoomToLOD';

/**
 * Construye el icon SIN heading rotation. La rotación se aplica como
 * mutación directa al <img> en un useEffect, para no rebuildear el
 * icon en cada tick.
 *
 * Por qué importa: react-leaflet llama marker.setIcon(newIcon) cuando
 * detecta nueva instancia de icon. setIcon destruye+recrea el DOM del
 * marker. Si el DOM se recrea, el browser pierde el `transform` previo
 * y la CSS transition NO interpola — el marker hace snap. Si esto pasa
 * en cada tick (cuando heading cambia), no hay smoothness nunca.
 *
 * Solución: el icon depende solo de (operatorId, lod, isSelected),
 * cosas que cambian raras veces. Heading se aplica al <img> interno
 * via DOM en cada update — eso sí transiciona suave (CSS transition
 * separado en .vl-bus3d-img).
 */
function buildIcon(
  operatorId: Bus['operatorId'],
  lod: LOD,
  isSelected: boolean,
  initialHeading: number,
): L.DivIcon {
  const op = getOperator(operatorId);

  if (lod === 'dot') {
    const ring = isSelected ? '<span class="vl-bus3d-halo"></span>' : '';
    return L.divIcon({
      className: `vl-bus3d-dot-marker${isSelected ? ' is-selected' : ''}`,
      html: `${ring}<span class="vl-bus3d-dot" style="background:${op.bodyColor};border-color:${op.dotBorder};"></span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }

  const size = 56;
  const ring = isSelected
    ? '<span class="vl-bus3d-halo vl-bus3d-halo-lg"></span>'
    : '';

  // initialHeading se mete inline para que la primera vista no haga
  // flash con rotación 0. Updates posteriores van por el useEffect.
  return L.divIcon({
    className: `vl-bus3d-marker${isSelected ? ' is-selected' : ''}`,
    html: `
      <div class="vl-bus3d-wrap" style="width:${size}px;height:${size}px;">
        ${ring}
        <img
          src="${op.iconSrc}"
          alt=""
          class="vl-bus3d-img"
          style="transform: rotate(${initialHeading}deg);"
        />
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

type Props = {
  bus: Bus;
  onClick?: (busId: string) => void;
  isSelected?: boolean;
};

export default function Bus3DMarker({
  bus,
  onClick,
  isSelected = false,
}: Props) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  const lod = zoomToLOD(zoom);

  // Icon estable: rebuild SOLO cuando cambia operator/lod/selección.
  // Heading y lat/lng intencionalmente OMITIDOS de las deps — eso
  // mantiene el DOM del marker estable y permite que la CSS transition
  // de posición funcione tick a tick.
  //
  // bus.heading se lee dentro de la función PERO no en deps: solo se
  // usa cuando el icon se rebuildea (rare), como valor inicial del
  // <img>. Los updates de heading en cada tick van por el useEffect
  // de abajo (DOM mutation).
  const icon = useMemo(
    () => buildIcon(bus.operatorId, lod, isSelected, bus.heading ?? 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bus.operatorId, lod, isSelected],
  );

  const markerRef = useRef<L.Marker | null>(null);

  // Aplica heading directamente al <img> interno cada vez que cambia.
  // El CSS de .vl-bus3d-img tiene transition:transform 0.4s → la
  // rotación se ve suave sin reconstruir el DOM del marker.
  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (!el) return;
    const img = el.querySelector<HTMLImageElement>('.vl-bus3d-img');
    if (img) {
      img.style.transform = `rotate(${bus.heading ?? 0}deg)`;
    }
  }, [bus.heading, lod, isSelected]); // re-aplicar si rebuildea el icon

  return (
    <Marker
      ref={(m) => {
        markerRef.current = m;
      }}
      position={[bus.lat, bus.lng]}
      icon={icon}
      eventHandlers={
        onClick ? { click: () => onClick(bus.id) } : undefined
      }
    />
  );
}
