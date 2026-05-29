import { AppLayout } from "@/components/layout/app-layout";
import { useGetEmergencies, useResolveEmergency } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, MapPin, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function Emergencies() {
  const queryClient = useQueryClient();
  const { data: emergencies, isLoading } = useGetEmergencies();
  const resolveEmergency = useResolveEmergency();

  const handleResolve = (id: number) => {
    resolveEmergency.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/emergencies"] })
    });
  };

  const activeEmergencies = emergencies?.filter(e => !e.resolved) || [];
  const resolvedEmergencies = emergencies?.filter(e => e.resolved) || [];

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-destructive flex items-center gap-2">
            <AlertTriangle /> Emergency Log
          </h1>
          <p className="text-muted-foreground">Active incidents and resolution history.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground border-b pb-2">
              <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
              Active Incidents ({activeEmergencies.length})
            </h2>
            
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : activeEmergencies.length === 0 ? (
              <Card className="border-dashed bg-transparent">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No active emergencies. The park is safe.
                </CardContent>
              </Card>
            ) : (
              activeEmergencies.map(emergency => (
                <Card key={emergency.id} className="border-destructive shadow-sm bg-destructive/5 overflow-hidden">
                  <div className="h-1 bg-destructive w-full" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Emergency #{emergency.id}</CardTitle>
                        <CardDescription className="text-foreground/70 font-medium">
                          Reported by {emergency.userName}
                        </CardDescription>
                      </div>
                      <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">
                        {formatDistanceToNow(new Date(emergency.createdAt))} ago
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {emergency.description && (
                      <p className="text-sm bg-background/50 p-3 rounded border border-destructive/20 text-foreground">
                        "{emergency.description}"
                      </p>
                    )}
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-mono">{emergency.lat.toFixed(6)}, {emergency.lng.toFixed(6)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(emergency.createdAt), "PPP p")}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-2" 
                      onClick={() => handleResolve(emergency.id)}
                      disabled={resolveEmergency.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Mark as Resolved
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-muted-foreground border-b pb-2">
              <CheckCircle className="h-5 w-5" />
              Recent Resolutions
            </h2>
            
            <div className="space-y-3">
              {resolvedEmergencies.slice(0, 10).map(emergency => (
                <div key={emergency.id} className="p-4 rounded-lg border bg-card text-sm flex flex-col gap-2">
                  <div className="flex justify-between items-center font-medium">
                    <span>Incident #{emergency.id}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(emergency.resolvedAt!), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <p className="text-muted-foreground truncate">{emergency.description || "No details provided"}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-1.5 py-0.5 bg-secondary rounded font-mono">
                      {emergency.lat.toFixed(4)}, {emergency.lng.toFixed(4)}
                    </span>
                    <span>•</span>
                    <span>By {emergency.userName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
