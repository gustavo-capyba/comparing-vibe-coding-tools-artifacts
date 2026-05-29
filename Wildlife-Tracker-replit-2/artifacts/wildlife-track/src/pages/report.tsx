import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateSighting, getListSightingsQueryKey, getGetRecentSightingsQueryKey, getGetStatsSummaryQueryKey, getGetAnimalCountsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Loader2 } from "lucide-react";

const ANIMAL_TYPES = [
  "Capybara", "Jaguar", "Toucan", "Anaconda", "Tapir",
  "Caiman", "Sloth", "Macaw", "Giant Otter", "Puma",
  "Harpy Eagle", "Armadillo", "Deer", "Wild Boar", "Other"
];

const reportSchema = z.object({
  animalType: z.string().min(1, "Animal type is required"),
  notes: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

export default function Report() {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createSighting = useCreateSighting();

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      animalType: "",
      notes: "",
      latitude: 0,
      longitude: 0,
    },
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not available in this browser.");
      form.setValue("latitude", -8.063169);
      form.setValue("longitude", -34.871139);
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("latitude", pos.coords.latitude);
        form.setValue("longitude", pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocationError("Could not get GPS location. Using default coordinates.");
        form.setValue("latitude", -8.063169);
        form.setValue("longitude", -34.871139);
        setLocating(false);
      }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  const lat = form.watch("latitude");
  const lng = form.watch("longitude");

  const onSubmit = (values: z.infer<typeof reportSchema>) => {
    createSighting.mutate(
      { data: { ...values, timestamp: new Date().toISOString() } },
      {
        onSuccess: () => {
          toast({ title: "Sighting reported!", description: "Thank you for contributing to wildlife tracking." });
          form.reset({ animalType: "", notes: "", latitude: lat, longitude: lng });
          queryClient.invalidateQueries({ queryKey: getListSightingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentSightingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAnimalCountsQueryKey() });
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-foreground">Report Sighting</h1>
        <p className="text-muted-foreground text-sm mt-1">Log a new animal sighting at your current location.</p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        {/* Location display */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">GPS Location</div>
            {locating ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Acquiring GPS...
              </div>
            ) : (
              <div className="text-sm text-muted-foreground mt-1">
                {lat !== 0 || lng !== 0 ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "Not set"}
              </div>
            )}
            {locationError && <div className="text-xs text-destructive mt-1">{locationError}</div>}
            <button
              type="button"
              onClick={getLocation}
              className="text-xs text-primary underline mt-1"
              data-testid="button-refresh-location"
            >
              Refresh location
            </button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="animalType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Animal Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-animal-type">
                        <SelectValue placeholder="Select animal..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ANIMAL_TYPES.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you observed..."
                      rows={3}
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={createSighting.isPending || locating}
              data-testid="button-submit-sighting"
            >
              {createSighting.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reporting...</>
              ) : (
                "Submit Sighting"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
