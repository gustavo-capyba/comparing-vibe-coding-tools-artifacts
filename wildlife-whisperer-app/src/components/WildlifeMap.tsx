import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { RECIFE, MUNICIPAL_BOUNDS } from "@/lib/geo";

// Fix default icon paths (Leaflet + bundlers)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const emergencyIcon = L.divIcon({
  className: "emergency-marker",
  html: `<div style="background:hsl(0 84% 60%);color:white;border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;box-shadow:0 0 0 4px hsla(0,84%,60%,0.3)">!</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export interface MapSighting {
  id: string;
  animal_type: string;
  lat: number;
  lng: number;
  created_at: string;
}
export interface MapAlert {
  id: string;
  lat: number;
  lng: number;
  message: string | null;
  created_at: string;
}

function RecenterOnce({ center }: { center: [number, number] | null }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current && center) {
      map.setView(center, 13);
      done.current = true;
    }
  }, [center, map]);
  return null;
}

interface Props {
  sightings: MapSighting[];
  alerts: MapAlert[];
  userLocation: { lat: number; lng: number } | null;
}

export function WildlifeMap({ sightings, alerts, userLocation }: Props) {
  const [initialCenter] = useState<[number, number]>(() =>
    userLocation ? [userLocation.lat, userLocation.lng] : [RECIFE.lat, RECIFE.lng],
  );

  const bounds = useMemo(
    () => L.latLngBounds(MUNICIPAL_BOUNDS[0], MUNICIPAL_BOUNDS[1]),
    [],
  );

  return (
    <MapContainer
      center={initialCenter}
      zoom={13}
      minZoom={11}
      maxZoom={18}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      className="h-full w-full rounded-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        // Performance: only load tiles within bounds + small buffer
        bounds={bounds}
      />
      <RecenterOnce
        center={userLocation ? [userLocation.lat, userLocation.lng] : null}
      />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>You are here</Popup>
        </Marker>
      )}
      {sightings.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]}>
          <Popup>
            <strong>{s.animal_type}</strong>
            <br />
            {new Date(s.created_at).toLocaleString()}
          </Popup>
        </Marker>
      ))}
      {alerts.map((a) => (
        <Marker key={a.id} position={[a.lat, a.lng]} icon={emergencyIcon}>
          <Popup>
            <strong>Emergency</strong>
            <br />
            {a.message || "No details"}
            <br />
            {new Date(a.created_at).toLocaleString()}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
