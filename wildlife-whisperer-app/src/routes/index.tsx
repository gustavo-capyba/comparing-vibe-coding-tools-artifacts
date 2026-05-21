import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { RECIFE } from "@/lib/geo";
import { sendEmailNotification, computeNotifyTargets } from "@/lib/notifications";
import { AlertTriangle, MapPin, Plus } from "lucide-react";
import type { MapSighting, MapAlert } from "@/components/WildlifeMap";

const WildlifeMap = lazy(() =>
  import("@/components/WildlifeMap").then((m) => ({ default: m.WildlifeMap })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wildlife Track — Live Sightings Map" },
      { name: "description", content: "Real-time wildlife sighting tracker for nature parks with emergency alerts and notifications." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sightings, setSightings] = useState<MapSighting[]>([]);
  const [alerts, setAlerts] = useState<MapAlert[]>([]);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(RECIFE);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation(RECIFE),
      { timeout: 8000 },
    );
  }, []);

  // Initial fetch + realtime
  useEffect(() => {
    if (!user) return;
    supabase.from("sightings").select("*").order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => data && setSightings(data as MapSighting[]));
    supabase.from("emergency_alerts").select("*").eq("resolved", false).limit(200)
      .then(({ data }) => data && setAlerts(data as MapAlert[]));

    const channel = supabase
      .channel("wildlife")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sightings" }, (p) => {
        const s = p.new as MapSighting;
        setSightings((prev) => [s, ...prev]);
        void notifyNearby(s);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "emergency_alerts" }, (p) => {
        const a = p.new as MapAlert;
        setAlerts((prev) => [a, ...prev]);
        toast.warning("🚨 New emergency alert reported");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function notifyNearby(s: MapSighting) {
    // In-app
    toast.info(`New sighting: ${s.animal_type}`);
    // Simulated email via subscriptions (logs to console)
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("user_id, animal_type, profiles(email)")
      .eq("animal_type", s.animal_type);
    if (!subs) return;
    const targets = computeNotifyTargets(
      { id: s.id, animalType: s.animal_type, lat: s.lat, lng: s.lng },
      subs.map((row: any) => ({
        userId: row.user_id,
        email: row.profiles?.email ?? "unknown@example.com",
        animalTypes: [row.animal_type],
      })),
      [], // location data of users not tracked in MVP
      { nearbyRadius: 50000, crowdRadius: 500, crowdThreshold: 20 },
    );
    targets.forEach((t) =>
      sendEmailNotification(t.email, { id: s.id, animalType: s.animal_type, lat: s.lat, lng: s.lng }),
    );
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-10 text-center text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-3">Welcome to Wildlife Track</h1>
        <p className="text-muted-foreground mb-6">
          Track animal sightings in real time, subscribe to species alerts, and trigger emergencies.
        </p>
        <Link to="/auth"><Button size="lg">Get started</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-[70vh] rounded-md border overflow-hidden">
          <Suspense fallback={<div className="h-full flex items-center justify-center text-muted-foreground">Loading map…</div>}>
            <WildlifeMap sightings={sightings} alerts={alerts} userLocation={location} />
          </Suspense>
        </div>
        <div className="space-y-4">
          <ReportSighting location={location} />
          <EmergencyButton location={location} />
          <ContextCard location={location} sightings={sightings} />
        </div>
      </div>
    </div>
  );
}

function ReportSighting({ location }: { location: { lat: number; lng: number } | null }) {
  const { user } = useAuth();
  const [animalType, setAnimalType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!location) return toast.error("Location not available");
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("sightings").insert({
      user_id: user.id,
      animal_type: animalType.trim(),
      lat: location.lat,
      lng: location.lng,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Sighting reported");
    setAnimalType(""); setNotes("");
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" /> Report a sighting</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Animal type</Label>
            <Input required value={animalType} onChange={(e) => setAnimalType(e.target.value)} placeholder="e.g. Capybara" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !location}>
            {submitting ? "Reporting..." : "Report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function EmergencyButton({ location }: { location: { lat: number; lng: number } | null }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function trigger() {
    if (!location || !user) return toast.error("Location not available");
    setSubmitting(true);
    const { error } = await supabase.from("emergency_alerts").insert({
      user_id: user.id, lat: location.lat, lng: location.lng, message: message.trim() || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    // Simulated staff notification
    // eslint-disable-next-line no-console
    console.log(`[STAFF ALERT] Emergency from user ${user.id} at (${location.lat}, ${location.lng}): ${message}`);
    toast.success("Park staff have been notified");
    setMessage("");
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" /> Emergency
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Describe the situation (optional)" />
        <Button variant="destructive" className="w-full" disabled={submitting || !location} onClick={trigger}>
          Trigger emergency alert
        </Button>
      </CardContent>
    </Card>
  );
}

function ContextCard({
  location,
  sightings,
}: {
  location: { lat: number; lng: number } | null;
  sightings: MapSighting[];
}) {
  const recent = sightings.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Context</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        {location ? (
          <p className="text-muted-foreground">
            Your location: <span className="font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          </p>
        ) : (
          <p className="text-muted-foreground">Locating…</p>
        )}
        <div>
          <p className="font-medium mb-1">Recent sightings</p>
          {recent.length === 0 && <p className="text-muted-foreground">None yet.</p>}
          <ul className="space-y-1">
            {recent.map((s) => (
              <li key={s.id} className="text-xs flex justify-between">
                <span>{s.animal_type}</span>
                <span className="text-muted-foreground">{new Date(s.created_at).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
