import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/lib/useGeolocation";
import { MapView, type MapMarker } from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { shouldNotify } from "@/lib/crowd";
import { AlertTriangle, LogOut, Plus, Bell, MapPin } from "lucide-react";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AppPage,
});

interface Sighting {
  id: string;
  user_id: string;
  animal_type: string;
  lat: number;
  lng: number;
  notes: string | null;
  created_at: string;
}
interface Alert {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  message: string | null;
  created_at: string;
}

function AppPage() {
  const nav = useNavigate();
  const { pos, granted, error } = useGeolocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [subs, setSubs] = useState<string[]>([]);
  const [animal, setAnimal] = useState("");
  const [notes, setNotes] = useState("");
  const [newSub, setNewSub] = useState("");

  // load session + initial data
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [s, a, sub] = await Promise.all([
        supabase.from("sightings").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("subscriptions").select("animal_type").eq("user_id", userId),
      ]);
      if (s.data) setSightings(s.data as Sighting[]);
      if (a.data) setAlerts(a.data as Alert[]);
      if (sub.data) setSubs(sub.data.map((r) => r.animal_type));
    })();
  }, [userId]);

  // realtime sightings
  useEffect(() => {
    const ch = supabase
      .channel("rt-sightings")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sightings" }, (p) => {
        const s = p.new as Sighting;
        setSightings((prev) => [s, ...prev]);
        // notification logic
        const notify = shouldNotify({
          sighting: { animalType: s.animal_type, location: { lat: s.lat, lng: s.lng } },
          user: { id: userId ?? "", subscriptions: subs, location: pos },
          nearbyUsers: sightings.slice(0, 20).map((x) => ({ lat: x.lat, lng: x.lng })),
          rule: { radiusMeters: 300, threshold: 5 },
          proximityMeters: 5000,
        });
        if (notify) {
          toast(`${s.animal_type} spotted nearby!`, { description: s.notes ?? "" });
          // simulated email
          // eslint-disable-next-line no-console
          console.log(`[email] To user ${userId}: ${s.animal_type} sighting alert`);
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (p) => {
        const a = p.new as Alert;
        setAlerts((prev) => [a, ...prev]);
        toast.error("Emergency alert reported", { description: a.message ?? "Park staff notified" });
        // eslint-disable-next-line no-console
        console.log(`[staff alert] Emergency at (${a.lat}, ${a.lng}): ${a.message}`);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, subs, pos, sightings]);

  const markers = useMemo<MapMarker[]>(() => {
    const ms: MapMarker[] = sightings.map((s) => ({
      id: `s-${s.id}`,
      lat: s.lat,
      lng: s.lng,
      title: `${s.animal_type}${s.notes ? " — " + s.notes : ""}`,
      kind: "sighting",
    }));
    for (const a of alerts) {
      ms.push({
        id: `a-${a.id}`,
        lat: a.lat,
        lng: a.lng,
        title: `Emergency: ${a.message ?? ""}`,
        kind: "alert",
      });
    }
    if (granted) {
      ms.push({ id: "me", lat: pos.lat, lng: pos.lng, title: "You are here", kind: "user" });
    }
    return ms;
  }, [sightings, alerts, pos, granted]);

  async function reportSighting(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    if (!animal.trim()) return toast.error("Animal type required");
    const { error } = await supabase.from("sightings").insert({
      user_id: userId,
      animal_type: animal.trim(),
      lat: pos.lat,
      lng: pos.lng,
      notes: notes || null,
    });
    if (error) return toast.error(error.message);
    setAnimal("");
    setNotes("");
    toast.success("Sighting reported");
  }

  async function triggerEmergency() {
    if (!userId) return;
    const msg = window.prompt("Describe the emergency (optional):") ?? "";
    const { error } = await supabase.from("alerts").insert({
      user_id: userId,
      lat: pos.lat,
      lng: pos.lng,
      message: msg || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Park staff notified");
  }

  async function addSub(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !newSub.trim()) return;
    const a = newSub.trim();
    const { error } = await supabase.from("subscriptions").insert({ user_id: userId, animal_type: a });
    if (error) return toast.error(error.message);
    setSubs((p) => [...p, a]);
    setNewSub("");
  }

  async function removeSub(a: string) {
    if (!userId) return;
    await supabase.from("subscriptions").delete().eq("user_id", userId).eq("animal_type", a);
    setSubs((p) => p.filter((x) => x !== a));
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="text-primary" />
            <h1 className="font-semibold">WildlifeTrack</h1>
            <Badge variant="secondary" className="ml-2">
              {granted ? "GPS on" : "Default: Recife"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={triggerEmergency}>
              <AlertTriangle className="size-4 mr-1" /> Emergency
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => {
              await supabase.auth.signOut();
              nav({ to: "/login" });
            }}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="h-[60vh] lg:h-[calc(100vh-120px)]">
          <MapView center={pos} markers={markers} />
          {error && <p className="mt-2 text-xs text-muted-foreground">{error}</p>}
        </div>

        <aside className="space-y-4">
          <Card className="p-4">
            <h2 className="font-medium mb-3 flex items-center gap-2"><Plus className="size-4"/> Report a sighting</h2>
            <form onSubmit={reportSighting} className="space-y-2">
              <div>
                <Label>Animal type</Label>
                <Input value={animal} onChange={(e) => setAnimal(e.target.value)} placeholder="Capybara" />
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
              </div>
              <p className="text-xs text-muted-foreground">
                Location: {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
              </p>
              <Button type="submit" className="w-full">Submit</Button>
            </form>
          </Card>

          <Card className="p-4">
            <h2 className="font-medium mb-3 flex items-center gap-2"><Bell className="size-4"/> Subscriptions</h2>
            <form onSubmit={addSub} className="flex gap-2 mb-3">
              <Input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Add animal type" />
              <Button type="submit">Add</Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {subs.length === 0 && <p className="text-sm text-muted-foreground">No subscriptions yet.</p>}
              {subs.map((s) => (
                <Badge key={s} className="cursor-pointer" onClick={() => removeSub(s)}>
                  {s} ✕
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-medium mb-2">Recent sightings</h2>
            <ul className="space-y-2 max-h-64 overflow-auto text-sm">
              {sightings.slice(0, 10).map((s) => (
                <li key={s.id} className="border-b pb-1">
                  <span className="font-medium">{s.animal_type}</span>
                  <span className="text-muted-foreground"> — {new Date(s.created_at).toLocaleTimeString()}</span>
                  {s.notes && <p className="text-xs">{s.notes}</p>}
                </li>
              ))}
              {sightings.length === 0 && <p className="text-muted-foreground">No sightings yet.</p>}
            </ul>
          </Card>
        </aside>
      </main>
    </div>
  );
}
