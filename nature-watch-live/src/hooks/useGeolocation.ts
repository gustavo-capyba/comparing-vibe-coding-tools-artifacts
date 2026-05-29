import { useEffect, useState } from "react";

export const DEFAULT_CENTER: [number, number] = [-8.063169, -34.871139]; // Recife

export function useGeolocation() {
  const [coords, setCoords] = useState<[number, number]>(DEFAULT_CENTER);
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGranted(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.latitude, pos.coords.longitude]);
        setGranted(true);
      },
      () => setGranted(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  return { coords, granted };
}