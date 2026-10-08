export type UserLocationStatus = "idle" | "loading" | "located" | "error";
export type UserCoordinate = [longitude: number, latitude: number];
export const isLocationButtonDisabled = (status: UserLocationStatus) => status === "loading";
export const INSECURE_LOCATION_MESSAGE = "Localização indisponível neste acesso. Ela estará disponível na versão segura do site (HTTPS).";

interface GeolocationLike {
  getCurrentPosition(success: (position: { coords: { latitude: number; longitude: number } }) => void, error: (error: { code: number }) => void, options?: PositionOptions): void;
}

export const geolocationErrorMessage = (code: number) => code === 1
  ? "Permita o acesso à localização no navegador para usar este recurso."
  : code === 2
    ? "Não conseguimos identificar sua localização agora."
    : code === 3
      ? "A localização demorou para responder. Tente novamente."
      : "Não conseguimos identificar sua localização agora.";

export interface LocationRequestOptions {
  cached: UserCoordinate | null;
  secureContext?: boolean;
  geolocation?: GeolocationLike;
  setStatus: (status: UserLocationStatus) => void;
  setMessage: (message: string | null) => void;
  recenter: (coordinate: UserCoordinate) => void;
  showMarker: (coordinate: UserCoordinate) => void;
  onError?: (errorType: "insecure_context" | "not_supported" | "permission_denied" | "position_unavailable" | "timeout") => void;
}

export function requestUserLocation(options: LocationRequestOptions): Promise<UserCoordinate | null> {
  if (options.secureContext === false) {
    options.onError?.("insecure_context");
    options.setStatus("error");
    options.setMessage(INSECURE_LOCATION_MESSAGE);
    return Promise.resolve(null);
  }
  if (options.cached) {
    options.recenter(options.cached);
    options.setStatus("located");
    options.setMessage(null);
    return Promise.resolve(options.cached);
  }
  if (!options.geolocation) {
    options.onError?.("not_supported");
    options.setStatus("error");
    options.setMessage("Seu navegador não oferece suporte à localização.");
    return Promise.resolve(null);
  }
  options.setStatus("loading");
  options.setMessage(null);
  return new Promise((resolve) => options.geolocation!.getCurrentPosition(
    (position) => {
      const coordinate: UserCoordinate = [position.coords.longitude, position.coords.latitude];
      options.showMarker(coordinate);
      options.recenter(coordinate);
      options.setStatus("located");
      resolve(coordinate);
    },
    (error) => {
      options.onError?.(error.code === 1 ? "permission_denied" : error.code === 3 ? "timeout" : "position_unavailable");
      options.setStatus("error");
      options.setMessage(geolocationErrorMessage(error.code));
      resolve(null);
    },
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
  ));
}
