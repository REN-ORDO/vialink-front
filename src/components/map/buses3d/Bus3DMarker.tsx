import { useEffect, useMemo, useState } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import type { Bus } from '../../../types';
import { getOperator } from '../../../config/operators';
import { zoomToLOD, type LOD } from '../../../lib/lod/zoomToLOD';

type Props = {
  bus: Bus;
  onClick?: (busId: string) => void;
  isSelected?: boolean;
};

const SIZE_FULL = 56;

export default function Bus3DMarker({
  bus,
  onClick,
  isSelected = false,
}: Props) {
  const map = useMap();
  const [zoom, setZoom] = useState<number>(() => map?.getZoom() ?? 14);

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('zoom_changed', () => {
      setZoom(map.getZoom() ?? zoom);
    });
    return () => listener.remove();
  }, [map, zoom]);

  const lod: LOD = zoomToLOD(zoom);
  const op = getOperator(bus.operatorId);

  const content = useMemo(() => {
    if (lod === 'dot') {
      return (
        <div
          className={`vl-bus3d-dot-marker${isSelected ? ' is-selected' : ''}`}
        >
          {isSelected && <span className="vl-bus3d-halo" />}
          <span
            className="vl-bus3d-dot"
            style={{ background: op.bodyColor, borderColor: op.dotBorder }}
          />
        </div>
      );
    }
    const heading = bus.heading ?? 0;
    return (
      <div className={`vl-bus3d-marker${isSelected ? ' is-selected' : ''}`}>
        <div
          className="vl-bus3d-wrap"
          style={{ width: SIZE_FULL, height: SIZE_FULL }}
        >
          {isSelected && <span className="vl-bus3d-halo vl-bus3d-halo-lg" />}
          <img
            src={op.iconSrc}
            alt=""
            className="vl-bus3d-img"
            style={{ transform: `rotate(${heading}deg)` }}
          />
        </div>
      </div>
    );
  }, [lod, isSelected, op, bus.heading]);

  return (
    <AdvancedMarker
      position={{ lat: bus.lat, lng: bus.lng }}
      onClick={onClick ? () => onClick(bus.id) : undefined}
    >
      {content}
    </AdvancedMarker>
  );
}
