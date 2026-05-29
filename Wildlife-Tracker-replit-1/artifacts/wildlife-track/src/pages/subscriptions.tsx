import { useListSubscriptions, getListSubscriptionsQueryKey, useCreateSubscription, useDeleteSubscription } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

const ANIMAL_TYPES = [
  "Jaguar", "Capybara", "Anaconda", "Toucan", "Tapir",
  "Caiman", "Peccary", "Armadillo", "Howler Monkey", "Giant Anteater"
];

export default function Subscriptions() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: subscriptions = [], isLoading } = useListSubscriptions({
    query: { queryKey: getListSubscriptionsQueryKey(), enabled: !!user },
  });

  const subscribe = useCreateSubscription();
  const unsubscribe = useDeleteSubscription();

  const subscribedTypes = new Set(subscriptions.map((s) => s.animalType));

  const handleSubscribe = (animalType: string) => {
    subscribe.mutate(
      { data: { animalType } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
          toast({ title: `Subscribed to ${animalType} alerts` });
        },
        onError: (err) => {
          toast({ title: "Failed", description: err.data?.error || "Try again", variant: "destructive" });
        },
      }
    );
  };

  const handleUnsubscribe = (id: number, animalType: string) => {
    unsubscribe.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
          toast({ title: `Unsubscribed from ${animalType}` });
        },
        onError: () => {
          toast({ title: "Failed to unsubscribe", variant: "destructive" });
        },
      }
    );
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
        <BellOff className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Login required</h2>
        <p className="text-muted-foreground">Please log in to manage your alert subscriptions.</p>
        <Button onClick={() => setLocation("/login")}>Login</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alert Subscriptions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Subscribe to receive notifications when specific animals are spotted nearby.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          {subscriptions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Active Subscriptions ({subscriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded border bg-primary/5 border-primary/20"
                      data-testid={`card-subscription-${sub.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <span className="font-medium">{sub.animalType}</span>
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleUnsubscribe(sub.id, sub.animalType)}
                        disabled={unsubscribe.isPending}
                        data-testid={`button-unsubscribe-${sub.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Available Species</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ANIMAL_TYPES.map((animal) => {
                  const isSubscribed = subscribedTypes.has(animal);
                  const sub = subscriptions.find((s) => s.animalType === animal);
                  return (
                    <div
                      key={animal}
                      className={`flex items-center justify-between p-3 rounded border transition-colors ${isSubscribed ? "bg-muted/50 opacity-60" : "hover:bg-accent/50"}`}
                      data-testid={`card-animal-${animal}`}
                    >
                      <span className="font-medium text-sm">{animal}</span>
                      {isSubscribed ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                          onClick={() => sub && handleUnsubscribe(sub.id, animal)}
                          disabled={unsubscribe.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleSubscribe(animal)}
                          disabled={subscribe.isPending}
                          data-testid={`button-subscribe-${animal}`}
                        >
                          <Plus className="h-3 w-3" />
                          Subscribe
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
