import { useGetMe, useGetStatsOverview, useGetRecentActivity } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { MapView } from "@/components/map/map-view";
import { EmergencyButton } from "@/components/map/emergency-button";
import { ReportSightingDialog } from "@/components/map/report-sighting-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Eye, Users, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe();
  const { data: stats } = useGetStatsOverview();
  const { data: recentActivity } = useGetRecentActivity({ limit: 5 });

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      setLocation("/profile-setup");
    }
  }, [user, isLoading, isError, setLocation]);

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <AppLayout>
      <div className="flex-1 relative flex flex-col md:flex-row w-full h-full overflow-hidden">
        
        {/* Left Side: Map */}
        <div className="relative flex-1 h-[50vh] md:h-full z-0 order-2 md:order-1">
          <MapView />
          <EmergencyButton />
          <ReportSightingDialog />
        </div>

        {/* Right Side: Stats & Activity Panel */}
        <div className="w-full md:w-[380px] bg-card border-l flex flex-col order-1 md:order-2 z-10 shrink-0 md:h-full overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-bold text-xl mb-1">Park Overview</h2>
            <p className="text-sm text-muted-foreground">Real-time status</p>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3">
            <Card className="bg-background shadow-sm border-0">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Eye className="h-5 w-5 text-primary mb-2" />
                <span className="text-2xl font-bold">{stats?.sightingsToday || 0}</span>
                <span className="text-xs text-muted-foreground">Sightings Today</span>
              </CardContent>
            </Card>
            <Card className="bg-background shadow-sm border-0">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Users className="h-5 w-5 text-primary mb-2" />
                <span className="text-2xl font-bold">{stats?.totalUsers || 0}</span>
                <span className="text-xs text-muted-foreground">Active Trackers</span>
              </CardContent>
            </Card>
            <Card className="bg-background shadow-sm border-0 col-span-2">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-5 w-5 ${stats?.activeEmergencies ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">Active Emergencies</span>
                </div>
                <span className={`text-xl font-bold ${stats?.activeEmergencies ? 'text-destructive' : 'text-foreground'}`}>
                  {stats?.activeEmergencies || 0}
                </span>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 p-4 border-t overflow-hidden flex flex-col">
            <h3 className="font-bold text-sm mb-4 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4" /> Recent Activity
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {recentActivity?.map((activity) => (
                <div key={`${activity.kind}-${activity.id}`} className="flex gap-3 items-start">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${activity.kind === 'emergency' ? 'bg-destructive animate-pulse' : 'bg-primary'}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {activity.kind === 'emergency' ? 'Emergency Alert' : `${activity.animalType} spotted`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      by {activity.userName} • {formatDistanceToNow(new Date(activity.timestamp))} ago
                    </p>
                  </div>
                </div>
              ))}
              {!recentActivity?.length && (
                <p className="text-sm text-muted-foreground italic">No recent activity.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
