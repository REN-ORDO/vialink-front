import { useMemo, useState } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Bus } from '../../../types';
import { getOperator } from '../../../config/operators';
import { zoomToLOD, type LOD } from '../../../lib/lod/zoomToLOD';

function buildIcon(bus: Bus, lod: LOD, isSelected: boolean): L.DivIcon {
  const op = getOperator(bus.operatorId);

  if (lod === 'dot') {
    const ring = isSelected
      ? '<span class="vl-bus3d-halo"></span>'
      : '';
    return L.divIcon({
      className: `vl-bus3d-dot-marker${isSelected ? ' is-selected' : ''}`,
      html: `${ring}<span class="vl-bus3d-dot" style="background:${op.bodyColor};border-color:${op.dotBorder};"></span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }

  const heading = bus.heading ?? 0;
  const size = 56;
  const ring = isSelected
    ? '<span class="vl-bus3d-halo vl-bus3d-halo-lg"></span>'
    : '';

  return L.divIcon({
    className: `vl-bus3d-marker${isSelected ? ' is-selected' : ''}`,
    html: `
      <div class="vl-bus3d-wrap" style="width:${size}px;height:${size}px;">
        ${ring}
        <img
          src="${op.iconSrc}"
          alt=""
          class="vl-bus3d-img"
          style="transform: rotate(${heading}deg);"
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
  const icon = useMemo(
    () => buildIcon(bus, lod, isSelected),
    [bus.lat, bus.lng, bus.heading, bus.operatorId, lod, isSelected],
  );

  return (
    <Marker
      position={[bus.lat, bus.lng]}
      icon={icon}
      eventHandlers={
        onClick ? { click: () => onClick(bus.id) } : undefined
      }
    />
  );
}
