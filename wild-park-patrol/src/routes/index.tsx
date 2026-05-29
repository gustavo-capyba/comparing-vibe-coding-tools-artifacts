import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MapPin, Bell, AlertTriangle, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WildlifeTrack — Spot wildlife in your park" },
      { name: "description", content: "Report animal sightings, get notified about wildlife near you, and trigger emergency alerts in your nature park." },
      { property: "og:title", content: "WildlifeTrack" },
      { property: "og:description", content: "Real-time wildlife tracking for nature parks." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/40 to-background">
      <header className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="text-primary" />
          <span className="font-semibold">WildlifeTrack</span>
        </div>
        <nav className="flex gap-2">
          <Link to="/login"><Button variant="ghost">Log in</Button></Link>
          <Link to="/signup"><Button>Sign up</Button></Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Track wildlife in your nature park, in real time.
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            Spot animals on the map, subscribe to your favorite species, and trigger
            emergency alerts when it matters.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/signup"><Button size="lg">Get started</Button></Link>
            <Link to="/app"><Button size="lg" variant="secondary">Open map</Button></Link>
          </div>
        </section>

        <section className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: MapPin, t: "GPS sightings", d: "Pin animal sightings using real geolocation, mapped on OpenStreetMap." },
            { icon: Bell, t: "Smart notifications", d: "Subscribe to species and get alerts when sightings happen near you." },
            { icon: Users, t: "Crowd control", d: "Notifications are suppressed automatically when an area is too crowded." },
            { icon: AlertTriangle, t: "Emergency alerts", d: "One tap notifies park staff with your live location.", full: true },
          ].map((f) => (
            <div key={f.t} className={`rounded-xl border bg-card p-5 ${f.full ? "md:col-span-3" : ""}`}>
              <f.icon className="text-primary mb-2" />
              <h3 className="font-semibold">{f.t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
