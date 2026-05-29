import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCreateEmergency } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

export function EmergencyButton() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const createEmergency = useCreateEmergency();
  const { toast } = useToast();

  const handleTrigger = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        createEmergency.mutate(
          { data: { lat: pos.coords.latitude, lng: pos.coords.longitude, description } },
          {
            onSuccess: () => {
              toast({ title: "Emergency Alert Sent", description: "Rangers have been notified of your location.", variant: "destructive" });
              setOpen(false);
              setDescription("");
            },
            onError: () => {
              toast({ title: "Failed to send alert", variant: "destructive" });
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
          variant="destructive" 
          className="rounded-full shadow-lg h-14 px-6 text-base font-bold animate-pulse hover:animate-none absolute bottom-24 right-6 z-10"
          data-testid="button-emergency-trigger"
        >
          <AlertTriangle className="mr-2 h-6 w-6" />
          EMERGENCY
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle /> Trigger Emergency Alert
          </DialogTitle>
          <DialogDescription>
            This will immediately notify park rangers with your current GPS location. Use this ONLY for real emergencies (injuries, dangerous animal encounters, lost persons).
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea 
            placeholder="Optional: Briefly describe the emergency..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            rows={3}
            data-testid="textarea-emergency-desc"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleTrigger} disabled={createEmergency.isPending} data-testid="button-confirm-emergency">
            {createEmergency.isPending ? "Sending..." : "SEND ALERT NOW"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
