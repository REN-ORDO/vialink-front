import { useEffect, useMemo, useRef, useState } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Bus } from '../../../types';
import { getOperator } from '../../../config/operators';
import { zoomToLOD, type LOD } from '../../../lib/lod/zoomToLOD';

/**
 * Construye el icon SIN heading rotation y SIN selección visible.
 *
 *  - heading: se aplica como mutación al <img> en un useEffect
 *  - selección (halo): siempre incluida en el HTML pero hidden por CSS;
 *    la clase `.is-selected` se toggle via classList sobre el wrapper
 *    Leaflet (sin rebuild del icon)
 *
 * Por qué importa: react-leaflet llama marker.setIcon(newIcon) cuando
 * detecta nueva instancia de icon. setIcon DESTRUYE+RECREA el DOM del
 * marker. Si el DOM se recrea, el browser pierde el `transform` previo
 * y la CSS transition NO interpola → el marker hace snap.
 *
 * Antes: isSelected estaba en useMemo deps → click → icon rebuild →
 * snap del bus clickeado (el famoso "se quedan quietos al hacer click").
 * Ahora: icon depende SOLO de (operatorId, lod). Cambios de selección
 * solo togglean una clase CSS, el DOM sobrevive y la transition
 * continúa fluido.
 */
function buildIcon(
  operatorId: Bus['operatorId'],
  lod: LOD,
  initialHeading: number,
): L.DivIcon {
  const op = getOperator(operatorId);

  if (lod === 'dot') {
    return L.divIcon({
      className: 'vl-bus3d-dot-marker',
      html: `
        <span class="vl-bus3d-halo"></span>
        <span class="vl-bus3d-dot" style="background:${op.bodyColor};border-color:${op.dotBorder};"></span>
      `,
      // -25% vs 14/7. Dot LOD usa el ícono completo más chico
      // proporcionalmente al 3D LOD.
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
  }

  // -25% vs 56. Buses menos prominentes en el mapa, dejan ver mejor
  // los polylines de rutas + el destino + los paraderos.
  const size = 42;
  // El halo siempre está en el HTML, pero CSS lo oculta por default.
  // .vl-bus3d-marker.is-selected .vl-bus3d-halo-lg → display: block
  return L.divIcon({
    className: 'vl-bus3d-marker',
    html: `
      <div class="vl-bus3d-wrap" style="width:${size}px;height:${size}px;">
        <span class="vl-bus3d-halo vl-bus3d-halo-lg"></span>
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

  // Icon SUPER estable: rebuild SOLO cuando cambia operator/lod.
  // isSelected NO está en deps → click NO destruye el DOM del marker.
  const icon = useMemo(
    () => buildIcon(bus.operatorId, lod, bus.heading ?? 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bus.operatorId, lod],
  );

  const markerRef = useRef<L.Marker | null>(null);

  // Aplica heading vía DOM cada vez que cambia. CSS transition de
  // .vl-bus3d-img maneja el smoothness sin tocar el icon.
  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (!el) return;
    const img = el.querySelector<HTMLImageElement>('.vl-bus3d-img');
    if (img) {
      img.style.transform = `rotate(${bus.heading ?? 0}deg)`;
    }
  }, [bus.heading, lod]);

  // Toggle de la clase `.is-selected` sobre el wrapper Leaflet.
  // El halo siempre está en el HTML; CSS lo muestra/oculta basado en
  // la clase. Esto evita rebuild del icon en click.
  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (!el) return;
    if (isSelected) {
      el.classList.add('is-selected');
    } else {
      el.classList.remove('is-selected');
    }
  }, [isSelected, lod]); // lod en deps porque cambia el DOM al cambiar LOD

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
