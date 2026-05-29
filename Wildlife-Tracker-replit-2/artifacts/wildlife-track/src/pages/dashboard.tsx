import { useEffect, useRef, useState } from "react";
import { useListSightings, useListEmergencies, useGetStatsSummary, useGetAnimalCounts } from "@workspace/api-client-react";
import { AlertTriangle, Eye, Users, Activity } from "lucide-react";

const DEFAULT_LAT = -8.063169;
const DEFAULT_LNG = -34.871139;
const DEFAULT_ZOOM = 12;

export default function Dashboard() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<ReturnType<typeof import("leaflet")["map"]> | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { data: sightings } = useListSightings();
  const { data: emergencies } = useListEmergencies();
  const { data: stats } = useGetStatsSummary();
  const { data: animalCounts } = useGetAnimalCounts();

  useEffect(() => {
    let mounted = true;
    import("leaflet").then((L) => {
      if (!mounted || !mapRef.current || leafletMapRef.current) return;

      // Fix default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        center: [DEFAULT_LAT, DEFAULT_LNG],
        zoom: DEFAULT_ZOOM,
        maxZoom: 16,
        minZoom: 10,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;

      // Try to center on user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (leafletMapRef.current) {
              leafletMapRef.current.setView([pos.coords.latitude, pos.coords.longitude], DEFAULT_ZOOM);
            }
          },
          () => {} // keep default center on denial
        );
      }

      setMapReady(true);
    });

    return () => {
      mounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Add/update sighting markers
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !sightings) return;
    import("leaflet").then((L) => {
      const map = leafletMapRef.current!;
      // Remove existing markers layer group if any
      (map as unknown as { _sightingLayer?: ReturnType<typeof L.layerGroup> })._sightingLayer?.clearLayers();

      const layer = L.layerGroup().addTo(map);
      (map as unknown as { _sightingLayer: typeof layer })._sightingLayer = layer;

      const greenIcon = L.divIcon({
        className: "",
        html: `<div style="background:#2d6a4f;width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      for (const s of sightings) {
        L.marker([s.latitude, s.longitude], { icon: greenIcon })
          .bindPopup(
            `<strong>${s.animalType}</strong><br/>${s.userName}<br/><small>${new Date(s.timestamp).toLocaleString()}</small>${s.notes ? `<br/><em>${s.notes}</em>` : ""}`
          )
          .addTo(layer);
      }
    });
  }, [mapReady, sightings]);

  // Add/update emergency markers
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !emergencies) return;
    import("leaflet").then((L) => {
      const map = leafletMapRef.current!;
      (map as unknown as { _emergencyLayer?: ReturnType<typeof L.layerGroup> })._emergencyLayer?.clearLayers();

      const layer = L.layerGroup().addTo(map);
      (map as unknown as { _emergencyLayer: typeof layer })._emergencyLayer = layer;

      const redIcon = L.divIcon({
        className: "",
        html: `<div style="background:#c0392b;width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5);animation:pulse 1s infinite alternate"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      for (const e of emergencies) {
        if (e.status === "active") {
          L.marker([e.latitude, e.longitude], { icon: redIcon })
            .bindPopup(
              `<strong style="color:#c0392b">EMERGENCY</strong><br/>${e.userName}<br/>${e.description ?? ""}<br/><small>${new Date(e.createdAt).toLocaleString()}</small>`
            )
            .addTo(layer);
        }
      }
    });
  }, [mapReady, emergencies]);

  const statCards = [
    { label: "Total Sightings", value: stats?.totalSightings ?? "-", icon: Eye, color: "text-primary" },
    { label: "Today", value: stats?.sightingsToday ?? "-", icon: Activity, color: "text-secondary" },
    { label: "Active Emergencies", value: stats?.activeEmergencies ?? "-", icon: AlertTriangle, color: "text-destructive" },
    { label: "Rangers", value: stats?.totalUsers ?? "-", icon: Users, color: "text-accent" },
  ];

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Stats bar */}
      <div className="bg-card border-b px-6 py-3 flex flex-wrap gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="flex items-center gap-2 min-w-[120px]" data-testid={`stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="font-semibold text-foreground text-lg leading-none">{String(s.value)}</div>
            </div>
          </div>
        ))}
        {animalCounts && animalCounts.length > 0 && (
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {animalCounts.slice(0, 5).map((ac) => (
              <span key={ac.animalType} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                {ac.animalType}: {ac.count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <style>{`
        @keyframes pulse { from { opacity: 1; } to { opacity: 0.5; } }
      `}</style>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="flex-1" style={{ minHeight: "400px" }} data-testid="map-container" />

      {/* Legend */}
      <div className="bg-card border-t px-6 py-2 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-primary border border-white" />
          Animal sighting
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-destructive border border-white" />
          Active emergency
        </div>
        <span className="ml-auto">{sightings?.length ?? 0} sightings on map</span>
      </div>
    </div>
  );
}
