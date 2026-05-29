import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGetSightings, useGetEmergencies, useUpdateMyLocation } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT_CENTER: [number, number] = [-8.063169, -34.871139];

function LocationUpdater() {
  const map = useMap();
  const updateLocation = useUpdateMyLocation();
  const locationUpdated = useRef(false);

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      if (!locationUpdated.current) {
        map.flyTo(e.latlng, map.getZoom());
        locationUpdated.current = true;
      }
      updateLocation.mutate({ data: { lat: e.latlng.lat, lng: e.latlng.lng } });
    });

    const interval = setInterval(() => {
      map.locate();
    }, 30000);

    return () => clearInterval(interval);
  }, [map, updateLocation]);

  return null;
}

const emergencyIcon = new L.DivIcon({
  className: "bg-transparent",
  html: `<div class="w-4 h-4 bg-destructive rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const getAnimalIcon = (type: string) => {
  return new L.DivIcon({
    className: "bg-transparent",
    html: `<div class="w-6 h-6 bg-primary text-primary-foreground rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs font-bold">${type.charAt(0).toUpperCase()}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export function MapView() {
  const { data: sightings } = useGetSightings();
  const { data: emergencies } = useGetEmergencies();

  return (
    <MapContainer 
      center={DEFAULT_CENTER} 
      zoom={13} 
      minZoom={11} 
      maxZoom={18} 
      className="w-full h-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationUpdater />
      
      {sightings?.map(sighting => (
        <Marker 
          key={`sighting-${sighting.id}`} 
          position={[sighting.lat, sighting.lng]}
          icon={getAnimalIcon(sighting.animalType)}
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-bold text-sm">{sighting.animalType}</h3>
              <p className="text-xs text-muted-foreground mt-1">{sighting.description || "No description"}</p>
              <div className="text-[10px] text-muted-foreground mt-2 flex justify-between">
                <span>By: {sighting.userName}</span>
                <span>{format(new Date(sighting.timestamp), "HH:mm")}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {emergencies?.filter(e => !e.resolved).map(emergency => (
        <Marker
          key={`emergency-${emergency.id}`}
          position={[emergency.lat, emergency.lng]}
          icon={emergencyIcon}
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-bold text-destructive text-sm">EMERGENCY</h3>
              <p className="text-xs text-muted-foreground mt-1">{emergency.description}</p>
              <div className="text-[10px] text-muted-foreground mt-2">
                Reported by {emergency.userName} at {format(new Date(emergency.createdAt), "HH:mm")}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
