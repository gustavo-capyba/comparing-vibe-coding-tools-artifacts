import { useEffect, useRef } from "react";
import L from "leaflet";

// Fix Leaflet default icon paths
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  kind: "sighting" | "alert" | "user";
}

interface Props {
  center: { lat: number; lng: number };
  markers: MapMarker[];
  onClick?: (latlng: { lat: number; lng: number }) => void;
}

export function MapView({ center, markers, onClick }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // init once
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, {
      center: [center.lat, center.lng],
      zoom: 13,
      minZoom: 11,
      maxZoom: 18,
      preferCanvas: true,
      worldCopyJump: false,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 18,
      updateWhenIdle: true,
      keepBuffer: 1,
    }).addTo(map);

    // Restrict to municipal-scale bounds (~25km around center)
    const restrictTo = (lat: number, lng: number) => {
      const d = 0.25;
      map.setMaxBounds([
        [lat - d, lng - d],
        [lat + d, lng + d],
      ]);
    };
    restrictTo(center.lat, center.lng);

    layerRef.current = L.layerGroup().addTo(map);
    if (onClick) {
      map.on("click", (e) => onClick({ lat: e.latlng.lat, lng: e.latlng.lng }));
    }
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // recenter on user location change (only when significantly different)
  useEffect(() => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter();
    if (Math.abs(c.lat - center.lat) > 0.05 || Math.abs(c.lng - center.lng) > 0.05) {
      mapRef.current.setView([center.lat, center.lng], 13);
    }
  }, [center.lat, center.lng]);

  // refresh markers
  useEffect(() => {
    const lg = layerRef.current;
    if (!lg) return;
    lg.clearLayers();
    for (const m of markers) {
      const color =
        m.kind === "alert" ? "#dc2626" : m.kind === "user" ? "#2563eb" : "#15803d";
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: m.kind === "user" ? 7 : 9,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.65,
      }).bindPopup(m.title);
      marker.addTo(lg);
    }
  }, [markers]);

  return <div ref={elRef} className="h-full w-full rounded-xl overflow-hidden border" />;
}
