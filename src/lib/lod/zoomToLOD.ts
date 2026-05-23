export type LOD = 'dot' | 'iso';

export function zoomToLOD(zoom: number): LOD {
  if (zoom < 13) return 'dot';
  return 'iso';
}
