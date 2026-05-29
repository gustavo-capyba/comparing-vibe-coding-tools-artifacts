import { useEffect, useRef, useState } from "react";
import { useListSightings, useCreateSighting, getListSightingsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, Crosshair, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type L from "leaflet";

const DEFAULT_LAT = -8.063169;
const DEFAULT_LNG = -34.871139;
const DEFAULT_ZOOM = 13;

const ANIMAL_TYPES = [
  "Jaguar", "Capybara", "Anaconda", "Toucan", "Tapir",
  "Caiman", "Peccary", "Armadillo", "Howler Monkey", "Giant Anteater"
];

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filterAnimal, setFilterAnimal] = useState<string>("all");
  const [clickedLatLng, setClickedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [animalType, setAnimalType] = useState(ANIMAL_TYPES[0]);
  const [description, setDescription] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: sightings = [], isLoading } = useListSightings(
    filterAnimal !== "all" ? { animalType: filterAnimal } : {}
  );

  const createSighting = useCreateSighting();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    async function initMap() {
      const L = (await import("leaflet")).default;

      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [DEFAULT_LAT, DEFAULT_LNG],
        zoom: DEFAULT_ZOOM,
        maxBoundsViscosity: 0.9,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
        minZoom: 10,
      }).addTo(map);

      const markerGroup = L.layerGroup().addTo(map);
      markersRef.current = markerGroup;
      leafletMapRef.current = map;

      // Try geolocation
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          map.setView([latitude, longitude], DEFAULT_ZOOM);

          const userIcon = L.divIcon({
            html: `<div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            className: "",
          });
          L.marker([latitude, longitude], { icon: userIcon })
            .bindPopup("<strong>Your location</strong>")
            .addTo(map);
        },
        () => {
          // Use default coordinates if geolocation denied/unavailable
        }
      );

      // Click to report sighting
      map.on("click", (e: L.LeafletMouseEvent) => {
        setClickedLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
        setDialogOpen(true);
      });
    }

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = null;
      }
    };
  }, []);

  // Update markers when sightings change
  useEffect(() => {
    if (!markersRef.current || !leafletMapRef.current) return;

    async function updateMarkers() {
      const L = (await import("leaflet")).default;
      markersRef.current!.clearLayers();

      for (const s of sightings) {
        const isCrowded = s.crowdCount >= 5;
        const color = isCrowded ? "#ef4444" : "#16a34a";

        const icon = L.divIcon({
          html: `<div style="width:20px;height:20px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:bold"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          className: "",
        });

        const popup = `
          <div style="min-width:160px">
            <strong style="font-size:14px">${s.animalType}</strong>
            ${isCrowded ? '<span style="color:#ef4444;font-size:11px;display:block">High crowd — alerts suppressed</span>' : ""}
            <div style="font-size:12px;margin-top:4px;color:#666">${s.description || "No description"}</div>
            <div style="font-size:11px;margin-top:6px;color:#888">
              Spotted by ${s.userName}<br/>
              ${new Date(s.createdAt).toLocaleString()}<br/>
              Crowd: ${s.crowdCount} person${s.crowdCount !== 1 ? "s" : ""}
            </div>
          </div>
        `;

        L.marker([s.latitude, s.longitude], { icon })
          .bindPopup(popup)
          .addTo(markersRef.current!);
      }
    }

    updateMarkers();
  }, [sightings]);

  const handleReportSighting = () => {
    if (!clickedLatLng || !user) return;

    createSighting.mutate(
      {
        data: {
          animalType,
          description: description || undefined,
          latitude: clickedLatLng.lat,
          longitude: clickedLatLng.lng,
        },
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setDescription("");
          queryClient.invalidateQueries({ queryKey: getListSightingsQueryKey() });
          toast({ title: "Sighting reported", description: `${animalType} added to the map.` });
        },
        onError: (err) => {
          toast({ title: "Failed to report", description: err.data?.error || "Try again", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ height: "calc(100vh - 65px)" }}>
      <div className="flex items-center justify-between p-3 border-b bg-card gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">
            {userLocation ? "Using your GPS location" : "Default: Recife, Brazil"}
          </span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterAnimal} onValueChange={setFilterAnimal}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="Filter species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All species</SelectItem>
              {ANIMAL_TYPES.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!user && (
            <span className="text-xs text-muted-foreground">Login to report sightings</span>
          )}
        </div>
      </div>

      <div ref={mapRef} className="flex-1 w-full z-0" />

      {user && (
        <div className="p-2 bg-card border-t text-center text-xs text-muted-foreground">
          Click anywhere on the map to report a wildlife sighting
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Sighting</DialogTitle>
            <DialogDescription>
              {clickedLatLng && `Location: ${clickedLatLng.lat.toFixed(5)}, ${clickedLatLng.lng.toFixed(5)}`}
            </DialogDescription>
          </DialogHeader>
          {!user ? (
            <p className="text-center text-muted-foreground py-4">You must be logged in to report sightings.</p>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Animal Type</Label>
                <Select value={animalType} onValueChange={setAnimalType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANIMAL_TYPES.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  placeholder="Brief description of the sighting..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-sighting-description"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleReportSighting}
                disabled={createSighting.isPending}
                data-testid="button-report-sighting"
              >
                {createSighting.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Reporting...</> : "Report Sighting"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
