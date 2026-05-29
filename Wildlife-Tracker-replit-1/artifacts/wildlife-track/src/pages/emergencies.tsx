import { useState, useEffect } from "react";
import { useListEmergencies, useCreateEmergency, useResolveEmergency, getListEmergenciesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShieldAlert, MapPin, Clock, CheckCircle, Loader2, TriangleAlert } from "lucide-react";
import { useLocation } from "wouter";

export default function Emergencies() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [location, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: emergencies = [], isLoading } = useListEmergencies();
  const createEmergency = useCreateEmergency();
  const resolveEmergency = useResolveEmergency();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: -8.063169, lng: -34.871139 })
    );
  }, []);

  const handleTriggerEmergency = () => {
    if (!location) {
      toast({ title: "Location unavailable", description: "Enable GPS or wait for location detection.", variant: "destructive" });
      return;
    }
    createEmergency.mutate(
      {
        data: {
          description,
          latitude: location.lat,
          longitude: location.lng,
        },
      },
      {
        onSuccess: () => {
          setEmergencyDialogOpen(false);
          setDescription("");
          queryClient.invalidateQueries({ queryKey: getListEmergenciesQueryKey() });
          toast({ title: "Emergency alert triggered", description: "Park staff and all users have been notified." });
        },
        onError: (err) => {
          toast({ title: "Failed to trigger emergency", description: err.data?.error || "Try again", variant: "destructive" });
        },
      }
    );
  };

  const handleResolve = (id: number) => {
    resolveEmergency.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEmergenciesQueryKey() });
          toast({ title: "Emergency marked as resolved" });
        },
      }
    );
  };

  const active = emergencies.filter((e) => !e.resolved);
  const resolved = emergencies.filter((e) => e.resolved);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emergency Alerts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {active.length > 0 ? (
              <span className="text-destructive font-medium">{active.length} active emergency{active.length !== 1 ? "s" : ""}</span>
            ) : (
              "No active emergencies"
            )}
          </p>
        </div>

        {user ? (
          <Button
            variant="destructive"
            className="gap-2 font-bold shadow-lg"
            onClick={() => setEmergencyDialogOpen(true)}
            data-testid="button-trigger-emergency"
          >
            <TriangleAlert className="h-4 w-4" />
            Trigger Emergency
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setLocation("/login")}>
            Login to Report
          </Button>
        )}
      </div>

      {active.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm font-medium flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {active.length} active emergency alert{active.length !== 1 ? "s" : ""}. Stay alert and follow park staff instructions.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : emergencies.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No emergencies on record</p>
          <p className="text-sm mt-1">Use the button above if you need to alert park staff</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-destructive">Active</h2>
              {active.map((em) => (
                <Card key={em.id} className="border-destructive/40 bg-destructive/5" data-testid={`card-emergency-${em.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold">{em.description}</span>
                          <Badge variant="destructive" className="text-[10px]">Active</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{em.userName}</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {em.latitude.toFixed(4)}, {em.longitude.toFixed(4)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(em.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {user && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="mt-3 gap-2" data-testid={`button-resolve-${em.id}`}>
                                <CheckCircle className="h-3.5 w-3.5" />
                                Mark Resolved
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mark emergency as resolved?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will dismiss the emergency alert. Only do this if the situation has been handled.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleResolve(em.id)}
                                  disabled={resolveEmergency.isPending}
                                >
                                  {resolveEmergency.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resolve"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-muted-foreground">Resolved</h2>
              {resolved.map((em) => (
                <Card key={em.id} className="opacity-60" data-testid={`card-emergency-resolved-${em.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{em.description}</span>
                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span>{em.userName}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(em.createdAt).toLocaleString()}
                          </span>
                          {em.resolvedAt && (
                            <span>Resolved: {new Date(em.resolvedAt).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Emergency trigger dialog */}
      <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <TriangleAlert className="h-5 w-5" />
              Trigger Emergency Alert
            </DialogTitle>
            <DialogDescription>
              This will immediately notify all park users and staff of an emergency at your current location.
              {location && (
                <span className="block mt-1 font-mono text-xs">
                  Location: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="emergency-description">Describe the emergency</Label>
              <Textarea
                id="emergency-description"
                placeholder="What is happening? (e.g., Injured visitor, dangerous animal encounter, fire...)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
                rows={3}
                data-testid="input-emergency-description"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEmergencyDialogOpen(false)}>
                Cancel
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex-1 font-bold gap-2"
                    disabled={!description.trim() || createEmergency.isPending}
                    data-testid="button-confirm-emergency"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Send Alert
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Emergency Alert</AlertDialogTitle>
                    <AlertDialogDescription>
                      You are about to trigger an emergency alert. This will notify all park users and staff immediately. Only proceed if there is a real emergency.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      onClick={handleTriggerEmergency}
                      disabled={createEmergency.isPending}
                    >
                      {createEmergency.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Emergency"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
