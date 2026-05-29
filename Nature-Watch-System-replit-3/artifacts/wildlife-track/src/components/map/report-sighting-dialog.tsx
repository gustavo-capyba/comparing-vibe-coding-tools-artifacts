import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MapPin } from "lucide-react";
import { useCreateSighting, getGetSightingNearbyUsersQueryOptions } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ANIMAL_TYPES = [
  "BIRD", "MAMMAL", "REPTILE", "AMPHIBIAN", "INSECT", "FISH", 
  "DEER", "FOX", "BEAR", "WOLF", "EAGLE", "OWL", "SNAKE", 
  "TURTLE", "FROG", "ALLIGATOR", "MONKEY", "JAGUAR", "OTHER"
];

const formSchema = z.object({
  animalType: z.string().min(1, "Required"),
  description: z.string().optional(),
});

export function ReportSightingDialog() {
  const [open, setOpen] = useState(false);
  const createSighting = useCreateSighting();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { animalType: "", description: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        createSighting.mutate(
          { data: { lat: pos.coords.latitude, lng: pos.coords.longitude, ...values } },
          {
            onSuccess: async (newSighting) => {
              toast({ title: "Sighting reported successfully" });
              setOpen(false);
              form.reset();
              queryClient.invalidateQueries({ queryKey: ["/api/sightings"] });
              
              // Crowd control check
              try {
                const queryOpts = getGetSightingNearbyUsersQueryOptions(newSighting.id);
                const nearbyData = await queryClient.fetchQuery(queryOpts);
                if (nearbyData.suppressed) {
                  toast({ 
                    title: "Area is crowded", 
                    description: "Notifications suppressed for this sighting to prevent stampedes.",
                  });
                }
              } catch(e) {
                // ignore
              }
            },
            onError: () => {
              toast({ title: "Failed to report", variant: "destructive" });
            }
          }
        );
      },
      () => {
        toast({ title: "Could not get location", description: "Please enable location services.", variant: "destructive" });
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="rounded-full shadow-lg h-14 px-6 text-base font-bold absolute bottom-6 right-6 z-10"
          data-testid="button-report-sighting"
        >
          <MapPin className="mr-2 h-5 w-5" />
          Report Sighting
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Wildlife Sighting</DialogTitle>
          <DialogDescription>
            Record what you've seen. Your current GPS coordinates will be attached automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="animalType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Animal Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-animal">
                        <SelectValue placeholder="Select an animal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {ANIMAL_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any specific details? Size, behavior, direction of movement?" {...field} data-testid="textarea-sighting-desc" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={createSighting.isPending} data-testid="button-submit-sighting">
              {createSighting.isPending ? "Submitting..." : "Submit Sighting"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
