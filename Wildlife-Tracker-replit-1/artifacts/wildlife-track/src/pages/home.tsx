import { useGetSightingStats, useGetRecentSightings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, AlertTriangle, Eye, Clock, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: stats, isLoading: isStatsLoading } = useGetSightingStats();
  const { data: recent, isLoading: isRecentLoading } = useGetRecentSightings({ limit: 5 });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Field Command Center</h1>
        <p className="text-muted-foreground text-lg">Real-time wildlife monitoring and alert system.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sightings</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isStatsLoading ? "..." : stats?.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Emergencies</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{isStatsLoading ? "..." : stats?.activeEmergencies || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-card md:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Live Map</CardTitle>
            <Map className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full mt-2">
              <Link href="/map">View Live Map</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sightings">View All</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {isRecentLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-muted h-20 rounded-md"></div>
              ))
            ) : recent?.length ? (
              recent.map((sighting) => (
                <Card key={sighting.id} className="overflow-hidden">
                  <div className="p-4 flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-full shrink-0">
                      <BinocularsIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg">{sighting.animalType}</p>
                      <p className="text-sm text-muted-foreground truncate">{sighting.description || "No description provided."}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          {sighting.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(sighting.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    {sighting.crowdCount >= 5 && (
                      <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">
                        <AlertTriangle className="h-3 w-3" />
                        Crowded
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent sightings.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Species Breakdown</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {isStatsLoading ? (
                   <div className="p-8 text-center text-muted-foreground">Loading stats...</div>
                ) : stats?.byAnimalType?.length ? (
                  stats.byAnimalType.map((stat) => (
                    <div key={stat.animalType} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{stat.animalType}</p>
                        <p className="text-xs text-muted-foreground">Last seen: {new Date(stat.lastSeen).toLocaleDateString()}</p>
                      </div>
                      <div className="font-bold font-mono bg-secondary px-3 py-1 rounded-full text-secondary-foreground">
                        {stat.count}
                      </div>
                    </div>
                  ))
                ) : (
                   <div className="p-8 text-center text-muted-foreground">No data available.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BinocularsIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10 10h4"/><path d="M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3"/><path d="M20 21a2 2 0 0 0 2-2v-3.851c0-1.39-2-2.962-2-4.829V8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2z"/><path d="M 22 16 L 2 16"/><path d="M4 21a2 2 0 0 1-2-2v-3.851c0-1.39 2-2.962 2-4.829V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2z"/><path d="M9 7V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3"/></svg>
  );
}

function UserIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  );
}
