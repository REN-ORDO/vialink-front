/**
 * Reverse geocoding helper — convierte (lat, lng) en una dirección legible.
 *
 * Asume que el Maps JS SDK ya está cargado (libraries: ["places"] o
 * libraries: ["geocoding"] traen el google.maps.Geocoder constructor).
 *
 * Si Google falla o el SDK no está cargado, hace fallback a las
 * coordenadas formateadas — nunca rechaza, siempre devuelve algo
 * que el user puede ver.
 *
 * Uso típico: cuando el user toca el mapa para fijar un destino
 * manualmente (sin buscar por texto), resolvemos esas coords a un
 * label legible ("Carrera 53 #80-15, Barranquilla").
 */
export function reverseGeocode(coords: {
  lat: number;
  lng: number;
}): Promise<string> {
  return new Promise((resolve) => {
    const fallback = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;

    if (typeof google === 'undefined' || !google.maps?.Geocoder) {
      resolve(fallback);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        resolve(fallback);
      }
    });
  });
}
