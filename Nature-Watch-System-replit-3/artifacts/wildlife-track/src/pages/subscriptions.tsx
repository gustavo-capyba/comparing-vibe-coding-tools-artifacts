import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetSubscriptions, useCreateSubscription, useDeleteSubscription } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Bell, Mail } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const ANIMAL_TYPES = [
  "BIRD", "MAMMAL", "REPTILE", "AMPHIBIAN", "INSECT", "FISH", 
  "DEER", "FOX", "BEAR", "WOLF", "EAGLE", "OWL", "SNAKE", 
  "TURTLE", "FROG", "ALLIGATOR", "MONKEY", "JAGUAR", "OTHER"
];

export default function Subscriptions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: subscriptions, isLoading } = useGetSubscriptions();
  const createSub = useCreateSubscription();
  const deleteSub = useDeleteSubscription();

  const [newAnimal, setNewAnimal] = useState("");
  const [newEmailNotify, setNewEmailNotify] = useState(false);

  const handleAdd = () => {
    if (!newAnimal) return;
    createSub.mutate(
      { data: { animalType: newAnimal, emailNotify: newEmailNotify } },
      {
        onSuccess: () => {
          setNewAnimal("");
          queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
          toast({ title: "Subscribed to " + newAnimal });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteSub.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      }
    });
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
          <p className="text-muted-foreground">Manage which animals you receive alerts for.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Add Subscription</CardTitle>
                <CardDescription>Get notified instantly when someone spots a specific animal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Animal Type</label>
                  <Select value={newAnimal} onValueChange={setNewAnimal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select animal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ANIMAL_TYPES.filter(type => !subscriptions?.some(s => s.animalType === type)).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Email Alerts</span>
                  </div>
                  <Switch checked={newEmailNotify} onCheckedChange={setNewEmailNotify} />
                </div>
                <Button className="w-full" onClick={handleAdd} disabled={!newAnimal || createSub.isPending}>
                  Subscribe
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Active Subscriptions
            </h3>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-muted-foreground p-4">Loading subscriptions...</div>
              ) : subscriptions?.length === 0 ? (
                <Card className="border-dashed bg-transparent">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    You aren't subscribed to any animal alerts yet.
                  </CardContent>
                </Card>
              ) : (
                subscriptions?.map(sub => (
                  <Card key={sub.id} className="overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {sub.animalType.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{sub.animalType}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            {sub.emailNotify ? (
                              <><Mail className="h-3 w-3" /> In-app & Email alerts</>
                            ) : (
                              <><Bell className="h-3 w-3" /> In-app alerts only</>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(sub.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
