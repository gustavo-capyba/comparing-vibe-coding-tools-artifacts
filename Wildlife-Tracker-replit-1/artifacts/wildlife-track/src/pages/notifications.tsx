import { useListNotifications, getListNotificationsQueryKey, useMarkAllNotificationsRead, useMarkNotificationRead, getGetUnreadNotificationCountQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, ShieldAlert, CheckCheck } from "lucide-react";
import { useLocation } from "wouter";

export default function Notifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useListNotifications({
    query: { queryKey: getListNotificationsQueryKey(), enabled: !!user },
  });

  const markAllRead = useMarkAllNotificationsRead();
  const markOneRead = useMarkNotificationRead();

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
        toast({ title: "All notifications marked as read" });
      },
    });
  };

  const handleMarkOneRead = (id: number) => {
    markOneRead.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
      },
    });
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
        <BellOff className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Login required</h2>
        <p className="text-muted-foreground">Please log in to view your notifications.</p>
        <Button onClick={() => setLocation("/login")}>Login</Button>
      </div>
    );
  }

  const unread = notifications.filter((n) => !n.read);
  const sortedNotifications = [...notifications].reverse();

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unread.length > 0 ? `${unread.length} unread` : "All caught up"}
          </p>
        </div>
        {unread.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            data-testid="button-mark-all-read"
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : sortedNotifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No notifications yet</p>
          <p className="text-sm mt-1">Subscribe to animal types to receive sighting alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedNotifications.map((notif) => {
            const isEmergency = notif.type === "emergency";
            return (
              <Card
                key={notif.id}
                className={`transition-all ${!notif.read ? (isEmergency ? "border-destructive/40 bg-destructive/5" : "border-primary/30 bg-primary/5") : "opacity-70"}`}
                data-testid={`card-notification-${notif.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 shrink-0 ${isEmergency ? "text-destructive" : "text-primary"}`}>
                      {isEmergency ? <ShieldAlert className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm ${!notif.read ? "font-semibold" : ""}`}>{notif.message}</p>
                        {!notif.read && (
                          <Badge variant={isEmergency ? "destructive" : "default"} className="text-[10px] shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                        {!notif.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => handleMarkOneRead(notif.id)}
                            disabled={markOneRead.isPending}
                            data-testid={`button-mark-read-${notif.id}`}
                          >
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
