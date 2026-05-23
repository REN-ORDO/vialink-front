import { useMemo, useState } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Bus } from '../../../types';
import { getOperator } from '../../../config/operators';
import { zoomToLOD, type LOD } from '../../../lib/lod/zoomToLOD';
import { busIsoSVG } from './BusIsoSVG';

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

  const svg = busIsoSVG(op);
  const heading = bus.heading ?? 0;

  return L.divIcon({
    className: 'vl-bus3d-marker',
    html: `
      <div class="vl-bus3d">
        <div class="vl-bus3d-shadow"></div>
        <div class="vl-bus3d-body" style="transform: perspective(220px) rotateX(58deg) rotateZ(${heading}deg);">
          ${svg}
        </div>
      </div>
    `,
    iconSize: [60, 72],
    iconAnchor: [30, 36],
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
