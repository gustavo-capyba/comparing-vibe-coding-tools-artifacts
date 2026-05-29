import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateEmergency, getListEmergenciesQueryKey, getGetStatsSummaryQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, MapPin, Loader2 } from "lucide-react";

const emergencySchema = z.object({
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

export default function Emergency() {
  const [locating, setLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createEmergency = useCreateEmergency();

  const form = useForm<z.infer<typeof emergencySchema>>({
    resolver: zodResolver(emergencySchema),
    defaultValues: { description: "", latitude: 0, longitude: 0 },
  });

  const getLocation = () => {
    setLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      form.setValue("latitude", -8.063169);
      form.setValue("longitude", -34.871139);
      setLocationError("Geolocation unavailable. Using default coordinates.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("latitude", pos.coords.latitude);
        form.setValue("longitude", pos.coords.longitude);
        setLocating(false);
      },
      () => {
        form.setValue("latitude", -8.063169);
        form.setValue("longitude", -34.871139);
        setLocationError("Could not acquire GPS. Using default coordinates.");
        setLocating(false);
      }
    );
  };

  useEffect(() => { getLocation(); }, []);

  const lat = form.watch("latitude");
  const lng = form.watch("longitude");

  const onSubmit = (values: z.infer<typeof emergencySchema>) => {
    createEmergency.mutate(
      { data: values },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast({ title: "Emergency alert sent!", description: "Park staff have been notified." });
          queryClient.invalidateQueries({ queryKey: getListEmergenciesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-serif font-bold text-foreground mb-2">Alert Dispatched</h2>
        <p className="text-muted-foreground text-sm mb-6">Park staff have been notified of your emergency. Stay calm and wait for assistance.</p>
        <Button variant="outline" onClick={() => setSubmitted(false)} data-testid="button-new-alert">
          Send Another Alert
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <h1 className="text-2xl font-serif font-bold text-destructive">Emergency Alert</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Trigger an immediate emergency alert to park staff. Your current location will be included.
        </p>
      </div>

      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6 text-sm text-destructive">
        Use this only for genuine emergencies — animal attacks, medical situations, or immediate safety threats.
      </div>

      <div className="bg-card border rounded-lg p-6">
        {/* Location */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg flex items-start gap-3">
          <MapPin className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium">Your Location</div>
            {locating ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Acquiring GPS...
              </div>
            ) : (
              <div className="text-sm text-muted-foreground mt-1">
                {lat !== 0 || lng !== 0 ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "Not acquired"}
              </div>
            )}
            {locationError && <div className="text-xs text-destructive mt-1">{locationError}</div>}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe the emergency</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Briefly describe the situation..."
                      rows={4}
                      {...field}
                      data-testid="input-emergency-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              variant="destructive"
              className="w-full h-14 text-lg font-bold"
              disabled={createEmergency.isPending || locating}
              data-testid="button-trigger-emergency"
            >
              {createEmergency.isPending ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Sending Alert...</>
              ) : (
                <><AlertTriangle className="h-5 w-5 mr-2" /> Trigger Emergency Alert</>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
