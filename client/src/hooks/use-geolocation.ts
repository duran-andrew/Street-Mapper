import { useState, useEffect, useRef } from 'react';

interface Coordinates {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
}

export function useGeolocation(options = { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: "Geolocation not supported", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
      return;
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      setCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
      });
    };

    const handleError = (err: GeolocationPositionError) => {
      setError(err);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []); // Intentionally empty dependency array to set up once

  return { coords, error };
}
