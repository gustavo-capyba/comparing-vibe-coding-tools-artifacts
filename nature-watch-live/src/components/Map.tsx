import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Fix default marker icons (Leaflet + bundlers)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const emergencyIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='32' height='32'><circle cx='12' cy='12' r='10' fill='%23dc2626'/><text x='12' y='17' font-size='14' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='bold'>!</text></svg>`,
    ),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind?: "sighting" | "emergency" | "user";
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function MapView({
  center,
  points,
  zoom = 13,
}: {
  center: [number, number];
  points: MapPoint[];
  zoom?: number;
}) {
  // Restrict map to municipal-scale
  const bounds: L.LatLngBoundsExpression = [
    [center[0] - 0.3, center[1] - 0.3],
    [center[0] + 0.3, center[1] + 0.3],
  ];
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={11}
      maxZoom={18}
      maxBounds={bounds}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <Recenter center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        updateWhenIdle
        keepBuffer={1}
      />
      {points.map((p) => {
        const markerProps =
          p.kind === "emergency" ? { icon: emergencyIcon } : {};
        return (
          <Marker key={p.id} position={[p.lat, p.lng]} {...markerProps}>
            <Popup>{p.label}</Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}