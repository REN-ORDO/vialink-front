/**
 * Vialink — feature flags.
 *
 * Toggles para mostrar/ocultar UI sin borrar código. Útil para iterar
 * el diseño del demo sin perder componentes que podrían volverse a usar.
 *
 * Cada flag puede ser overrideada en runtime vía env var (Vite las
 * inyecta como `import.meta.env.VITE_FF_<NAME>` en build time).
 *
 * Para flippar uno en local, agregar al `.env.local`:
 *   VITE_FF_SHOW_PARADEROS=true
 */

const env = (import.meta as ImportMeta & {
  env: Record<string, string | undefined>;
}).env;

function bool(name: string, defaultValue: boolean): boolean {
  const v = env[`VITE_FF_${name}`];
  if (v === undefined || v === '') return defaultValue;
  return v.toLowerCase() === 'true' || v === '1';
}

export const FEATURE_FLAGS = {
  /**
   * Mostrar los markers de paraderos (puntos azules) sobre el mapa
   * Y el bottom sheet "X paraderos cerca de ti" con la lista filtrable.
   *
   * Default OFF: para el demo del routing engine, los paraderos
   * generales saturan visualmente el mapa y compiten con los markers
   * importantes (board/alight resaltados de una recomendación).
   *
   * Los markers especiales del RouteVisualizer (verde/azul de abordaje/
   * descenso cuando se commitea una ruta) NO están afectados por este
   * flag — siempre se muestran.
   */
  showParaderos: bool('SHOW_PARADEROS', false),
} as const;
