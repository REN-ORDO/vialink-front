import { useEffect } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { LatLng } from '../../types';

type Props = {
  positions: LatLng[];
  color?: string;
  weight?: number;
  opacity?: number;
  zIndex?: number;
};

/**
 * Polyline imperativa para Google Maps. Drop-in replacement del
 * <Polyline> de react-leaflet usado anteriormente.
 */
export default function MapPolyline({
  positions,
  color = '#1E5EFF',
  weight = 5,
  opacity = 0.85,
  zIndex,
}: Props) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib || positions.length < 2) return;
    const polyline = new mapsLib.Polyline({
      path: positions.map((p) => ({ lat: p.lat, lng: p.lng })),
      strokeColor: color,
      strokeWeight: weight,
      strokeOpacity: opacity,
      zIndex,
      map,
    });
    return () => {
      polyline.setMap(null);
    };
  }, [map, mapsLib, positions, color, weight, opacity, zIndex]);

  return null;
}
