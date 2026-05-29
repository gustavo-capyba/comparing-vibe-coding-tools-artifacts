import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { ClientOnly } from "@/components/ClientOnly";
import { MapView, type MapPoint } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AlertTriangle, LogOut, MapPin, Bell, Plus } from "lucide-react";
import { getRecipients, sendEmailNotification } from "@/lib/notify";
import { shouldSuppressNotifications } from "@/lib/crowd";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WildlifeTrack — Spot animals & stay safe" },
      { name: "description", content: "Track wildlife sightings, get notifications, and trigger emergency alerts in nature parks." },
    ],
  }),
  component: Index,
});

interface Sighting {
  id: string;
  user_id: string;
  animal_type: string;
  notes: string | null;
  lat: number;
  lng: number;
  created_at: string;
}

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { coords, granted } = useGeolocation();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [animal, setAnimal] = useState("");
  const [notes, setNotes] = useState("");
  const [subs, setSubs] = useState<string[]>([]);
  const [newSub, setNewSub] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("sightings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setSightings((data as Sighting[]) ?? []));
    supabase
      .from("subscriptions")
      .select("animal_type")
      .then(({ data }) => setSubs((data ?? []).map((s) => s.animal_type)));

    const channel = supabase
      .channel("sightings-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sightings" },
        (payload) => {
          const s = payload.new as Sighting;
          setSightings((prev) => [s, ...prev]);
          handleIncomingSighting(s);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function handleIncomingSighting(s: Sighting) {
    if (!user) return;
    // Crowd control: suppress if many other reporters near same area in last hour
    const recent = sightings.filter(
      (x) => Date.now() - new Date(x.created_at).getTime() < 60 * 60 * 1000,
    );
    const suppress = shouldSuppressNotifications(
      { lat: s.lat, lng: s.lng },
      recent.map((r) => ({ userId: r.user_id, lat: r.lat, lng: r.lng })),
      { radiusMeters: 300, threshold: 5 },
    );
    if (suppress) return;
    const recipients = getRecipients(
      { animalType: s.animal_type, lat: s.lat, lng: s.lng },
      [
        {
          userId: user.id,
          animalTypes: subs,
          position: { lat: coords[0], lng: coords[1] },
        },
      ],
    );
    if (recipients.includes(user.id) && s.user_id !== user.id) {
      toast(`🐾 ${s.animal_type} spotted nearby`, { description: s.notes ?? "" });
      sendEmailNotification(user.email ?? "", `Sighting: ${s.animal_type}`, "A subscribed animal was spotted near you.");
    }
  }

  async function reportSighting(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !animal.trim()) return;
    const { error } = await supabase.from("sightings").insert({
      user_id: user.id,
      animal_type: animal.trim().toLowerCase(),
      notes: notes.trim() || null,
      lat: coords[0],
      lng: coords[1],
    });
    if (error) return toast.error(error.message);
    toast.success("Sighting reported");
    setAnimal("");
    setNotes("");
  }

  async function addSubscription(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newSub.trim()) return;
    const t = newSub.trim().toLowerCase();
    const { error } = await supabase
      .from("subscriptions")
      .insert({ user_id: user.id, animal_type: t });
    if (error) return toast.error(error.message);
    setSubs((p) => Array.from(new Set([...p, t])));
    setNewSub("");
  }

  async function removeSub(t: string) {
    if (!user) return;
    await supabase.from("subscriptions").delete().eq("user_id", user.id).eq("animal_type", t);
    setSubs((p) => p.filter((x) => x !== t));
  }

  async function triggerEmergency() {
    if (!user) return;
    const { error } = await supabase.from("emergency_alerts").insert({
      user_id: user.id,
      lat: coords[0],
      lng: coords[1],
      message: "User triggered SOS",
    });
    if (error) return toast.error(error.message);
    // Simulated park-staff notification
    // eslint-disable-next-line no-console
    console.log(`[park-staff] EMERGENCY from user ${user.id} at ${coords[0]},${coords[1]}`);
    toast.error("🚨 Emergency alert sent to park staff");
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const points = useMemo<MapPoint[]>(
    () =>
      sightings.map((s) => ({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        label: `${s.animal_type}${s.notes ? ` — ${s.notes}` : ""}`,
        kind: "sighting" as const,
      })),
    [sightings],
  );

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-lg">WildlifeTrack</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {granted ? "📍 GPS" : "📍 Default (Recife)"}
            </Badge>
            <Button size="sm" variant="destructive" onClick={triggerEmergency}>
              <AlertTriangle className="h-4 w-4 mr-1" /> SOS
            </Button>
            <Button size="sm" variant="ghost" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="h-[60vh] min-h-[400px]">
              <ClientOnly fallback={<div className="h-full flex items-center justify-center text-muted-foreground">Loading map…</div>}>
                <MapView center={coords} points={points} />
              </ClientOnly>
            </div>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" /> Report a sighting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={reportSighting} className="space-y-3">
                <div>
                  <Label htmlFor="animal">Animal type</Label>
                  <Input id="animal" value={animal} onChange={(e) => setAnimal(e.target.value)} placeholder="jaguar, capybara…" required />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Behavior, count…" />
                </div>
                <Button type="submit" className="w-full">Report</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" /> Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={addSubscription} className="flex gap-2">
                <Input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Animal type" />
                <Button type="submit" variant="secondary">Add</Button>
              </form>
              <div className="flex flex-wrap gap-2">
                {subs.length === 0 && <p className="text-sm text-muted-foreground">No subscriptions yet.</p>}
                {subs.map((t) => (
                  <Badge key={t} variant="outline" className="cursor-pointer" onClick={() => removeSub(t)}>
                    {t} ✕
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent sightings</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 max-h-64 overflow-auto">
                {sightings.slice(0, 20).map((s) => (
                  <li key={s.id} className="text-sm border-b pb-2 last:border-0">
                    <span className="font-medium capitalize">{s.animal_type}</span>{" "}
                    <span className="text-muted-foreground">— {new Date(s.created_at).toLocaleString()}</span>
                  </li>
                ))}
                {sightings.length === 0 && <p className="text-sm text-muted-foreground">No sightings yet.</p>}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </main>
      <footer className="text-center text-xs text-muted-foreground py-4">
        <Link to="/auth" className="hover:underline">Account</Link>
      </footer>
    </div>
  );
}
