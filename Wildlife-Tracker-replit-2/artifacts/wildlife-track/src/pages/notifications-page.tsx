import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead,
  useListSubscriptions, useCreateSubscription, useDeleteSubscription,
  getListNotificationsQueryKey, getListSubscriptionsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCheck, Trash2, Plus } from "lucide-react";

const ANIMAL_TYPES = [
  "Capybara", "Jaguar", "Toucan", "Anaconda", "Tapir",
  "Caiman", "Sloth", "Macaw", "Giant Otter", "Puma",
  "Harpy Eagle", "Armadillo", "Deer", "Wild Boar", "Other"
];

export default function NotificationsPage() {
  const [newAnimal, setNewAnimal] = useState("");
  const [emailNotify, setEmailNotify] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading: nLoading } = useListNotifications();
  const { data: subscriptions, isLoading: sLoading } = useListSubscriptions();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const createSub = useCreateSubscription();
  const deleteSub = useDeleteSubscription();

  const unread = (notifications ?? []).filter((n) => !n.isRead);

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      },
    });
  };

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  const handleSubscribe = () => {
    if (!newAnimal) return;
    createSub.mutate(
      { data: { animalType: newAnimal, emailNotify } },
      {
        onSuccess: () => {
          toast({ title: "Subscribed!", description: `You will be notified about ${newAnimal} sightings.` });
          setNewAnimal("");
          queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleUnsubscribe = (id: number) => {
    deleteSub.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() }),
    });
  };

  return (
    <div className="p-6 flex flex-col gap-8 max-w-3xl">
      {/* Notifications */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-foreground">Notifications</h1>
            {unread.length > 0 && (
              <Badge className="bg-destructive text-destructive-foreground">{unread.length} unread</Badge>
            )}
          </div>
          {unread.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAll} data-testid="button-mark-all-read">
              <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {nLoading ? (
          <div className="text-muted-foreground text-sm">Loading notifications...</div>
        ) : (notifications ?? []).length === 0 ? (
          <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <div>No notifications yet. Subscribe to animal types below.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {[...(notifications ?? [])].reverse().map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                  n.isRead ? "bg-card text-muted-foreground" : "bg-primary/5 border-primary/20"
                }`}
                data-testid={`notification-${n.id}`}
              >
                <Bell className={`h-4 w-4 mt-0.5 shrink-0 ${n.isRead ? "opacity-40" : "text-primary"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="text-xs text-primary underline shrink-0"
                    data-testid={`button-mark-read-${n.id}`}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Subscriptions */}
      <section>
        <h2 className="text-lg font-serif font-semibold text-foreground mb-4">Manage Subscriptions</h2>
        <div className="bg-card border rounded-lg p-4 mb-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium mb-1 block">Animal Type</label>
              <Select value={newAnimal} onValueChange={setNewAnimal}>
                <SelectTrigger data-testid="select-subscription-animal">
                  <SelectValue placeholder="Select animal..." />
                </SelectTrigger>
                <SelectContent>
                  {ANIMAL_TYPES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={emailNotify}
                onChange={(e) => setEmailNotify(e.target.checked)}
                className="rounded"
                data-testid="checkbox-email-notify"
              />
              Email alerts
            </label>
            <Button onClick={handleSubscribe} disabled={!newAnimal || createSub.isPending} data-testid="button-subscribe">
              <Plus className="h-4 w-4 mr-1" /> Subscribe
            </Button>
          </div>
        </div>

        {sLoading ? (
          <div className="text-muted-foreground text-sm">Loading subscriptions...</div>
        ) : (subscriptions ?? []).length === 0 ? (
          <div className="text-muted-foreground text-sm">No active subscriptions.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {(subscriptions ?? []).map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-card border rounded-lg" data-testid={`subscription-${sub.id}`}>
                <div>
                  <span className="font-medium text-sm">{sub.animalType}</span>
                  {sub.emailNotify && <Badge variant="secondary" className="ml-2 text-xs">Email</Badge>}
                </div>
                <button
                  onClick={() => handleUnsubscribe(sub.id)}
                  className="text-destructive hover:text-destructive/80 transition-colors"
                  data-testid={`button-unsubscribe-${sub.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
