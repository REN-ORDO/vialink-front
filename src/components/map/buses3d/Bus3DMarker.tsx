import { useMemo, useState } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Bus } from '../../../types';
import { getOperator } from '../../../config/operators';
import { zoomToLOD, type LOD } from '../../../lib/lod/zoomToLOD';

function buildIcon(bus: Bus, lod: LOD): L.DivIcon {
  const op = getOperator(bus.operatorId);

  if (lod === 'dot') {
    return L.divIcon({
      className: 'vl-bus3d-dot-marker',
      html: `<span class="vl-bus3d-dot" style="background:${op.bodyColor};border-color:${op.dotBorder};"></span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }

  const heading = bus.heading ?? 0;
  const size = 56;

  return L.divIcon({
    className: 'vl-bus3d-marker',
    html: `
      <div class="vl-bus3d-wrap" style="width:${size}px;height:${size}px;">
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

type Props = { bus: Bus };

export default function Bus3DMarker({ bus }: Props) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  const lod = zoomToLOD(zoom);
  const icon = useMemo(
    () => buildIcon(bus, lod),
    [bus.lat, bus.lng, bus.heading, bus.operatorId, lod],
  );

  return <Marker position={[bus.lat, bus.lng]} icon={icon} />;
}
