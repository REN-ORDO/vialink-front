import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataSource } from '../lib/dataSource';
import type { LatLng } from '../types';

/**
 * Caminata máxima razonable por tramo (board o alight) cuando estamos
 * en modo fallback. 1500m ≈ 15 cuadras ≈ 18 min caminando. Más que eso
 * el bus deja de ser útil: el user mejor camina/taxi todo el viaje.
 */
const MAX_LEG_WALK_FALLBACK_M = 1500;

/**
 * Pide al backend qué bus tomar para ir de userLocation a destination.
 *
 * Devuelve top N recomendaciones rankeadas por tiempo total puerta-a-puerta.
 * Solo dispara cuando ambos puntos están definidos.
 *
 * Refresca cada 15s para mantener ETAs vivos (los buses se mueven).
 *
 * --- Fallback de búsqueda ampliada ---
 *
 * Si la query primaria (radio 700m, backend extiende progresivamente
 * hasta 1800m) devuelve recomendaciones vacías, automáticamente
 * dispara una segunda query con radio 5000m (≈60 cuadras). Eso garantiza
 * que el user SIEMPRE vea opciones — aunque tenga que caminar más para
 * abordar — en lugar de un mensaje "no hay buses" que lo deja atascado.
 *
 * El return incluye `isExpandedSearch: boolean` para que el sheet pueda
 * mostrar un banner contextual ("tu destino está alejado, estas son las
 * opciones más cercanas — vas a caminar más").
 */
export function useRouteRecommendation(
  userLocation: LatLng | undefined,
  destination: LatLng | null,
) {
  const enabled =
    userLocation != null &&
    destination != null &&
    Number.isFinite(userLocation.lat) &&
    Number.isFinite(destination.lat);

  // QUERY PRIMARIA — radio normal (700m → backend expande a 1800m).
  // Si tiene éxito, esta es la respuesta que devolvemos.
  const normalQuery = useQuery({
    queryKey: [
      'route-recommend-smart',
      'normal',
      userLocation?.lat,
      userLocation?.lng,
      destination?.lat,
      destination?.lng,
    ],
    queryFn: () =>
      dataSource.recommendRouteSmart({
        userLocation: userLocation!,
        destination: destination!,
        maxWalkingM: 700,
        maxAlternatives: 5,
      }),
    enabled,
    staleTime: 10_000,
    refetchInterval: 15_000, // ETAs se mueven, actualizamos
    refetchOnWindowFocus: false,
  });

  // ¿Necesitamos disparar el fallback? Solo si la primaria terminó
  // (no isLoading/isFetching de la primera vez) y devolvió 0 recs.
  const primaryReturnedEmpty =
    normalQuery.isSuccess &&
    (normalQuery.data?.recommendations.length ?? 0) === 0;

  // QUERY FALLBACK — radio moderado (2000m ≈ 25 cuadras, máximo
  // razonable para caminar). Más allá de eso ni el user más
  // dispuesto camina. Pedimos solo 3 alts porque a esa distancia
  // más es spam visual.
  const fallbackQuery = useQuery({
    queryKey: [
      'route-recommend-smart',
      'fallback',
      userLocation?.lat,
      userLocation?.lng,
      destination?.lat,
      destination?.lng,
    ],
    queryFn: () =>
      dataSource.recommendRouteSmart({
        userLocation: userLocation!,
        destination: destination!,
        maxWalkingM: 2_000,
        maxAlternatives: 3,
      }),
    enabled: enabled && primaryReturnedEmpty,
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: false,
  });

  // Estado de loading: la primaria está cargando, o terminó vacía
  // y la fallback está cargando.
  const isFetching =
    normalQuery.isFetching ||
    (primaryReturnedEmpty && fallbackQuery.isFetching);

  // Filtramos las recs del fallback para sacar las "absurdas" — recs
  // donde el user tendría que caminar >1500m en cualquier tramo (board
  // o alight). Si el bus te deja a 24 cuadras del destino, no es una
  // ruta útil, es spam visual + UX engañoso ("vas a caminar más" no
  // captura "vas a caminar 2.4 km").
  const filteredFallbackData = useMemo(() => {
    if (!fallbackQuery.data) return undefined;
    const filtered = fallbackQuery.data.recommendations.filter(
      (r) =>
        r.walkingToBoard.distanceM <= MAX_LEG_WALK_FALLBACK_M &&
        r.walkingFromAlight.distanceM <= MAX_LEG_WALK_FALLBACK_M,
    );
    return { ...fallbackQuery.data, recommendations: filtered };
  }, [fallbackQuery.data]);

  // Decisión final de qué data exponer:
  //   - Si primaria tiene recs → primaria (NO es expanded)
  //   - Si primaria vacía + fallback filtrado tiene recs → fallback
  //     (SÍ es expanded — vas a caminar más, pero razonable)
  //   - Resto (ambas vacías o todo filtrado fuera, error, loading) → primaria
  const primaryHasRecs =
    (normalQuery.data?.recommendations.length ?? 0) > 0;
  const fallbackHasRecs =
    (filteredFallbackData?.recommendations.length ?? 0) > 0;

  if (primaryHasRecs) {
    return {
      data: normalQuery.data,
      isFetching: normalQuery.isFetching,
      error: normalQuery.error,
      isExpandedSearch: false as const,
    };
  }

  if (primaryReturnedEmpty && fallbackHasRecs) {
    return {
      data: filteredFallbackData,
      isFetching: fallbackQuery.isFetching,
      error: fallbackQuery.error,
      isExpandedSearch: true as const,
    };
  }

  // Loading inicial, ambas vacías, o fallback filtró todo a 0:
  // devolvemos primaria con su isFetching ya combinado.
  return {
    data: normalQuery.data,
    isFetching,
    error: normalQuery.error ?? fallbackQuery.error,
    isExpandedSearch: false as const,
  };
}
