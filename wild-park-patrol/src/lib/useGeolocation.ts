import { useEffect, useState } from "react";

export function useGeolocation(fallback = { lat: -8.063169, lng: -34.871139 }) {
  const [pos, setPos] = useState<{ lat: number; lng: number }>(fallback);
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not available — using Recife default.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGranted(true);
        setError(null);
      },
      (e) => {
        setError(e.message);
        setGranted(false);
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { pos, granted, error };
}
