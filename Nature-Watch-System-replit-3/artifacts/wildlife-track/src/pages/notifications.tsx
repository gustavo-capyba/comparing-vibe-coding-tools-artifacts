import { AppLayout } from "@/components/layout/app-layout";
import { useGetNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCheck, AlertTriangle, Eye, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useGetNotifications({}, { query: { refetchInterval: 30000 } });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] })
    });
  };

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] })
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "emergency": return <AlertTriangle className="text-destructive h-5 w-5" />;
      case "sighting": return <Eye className="text-primary h-5 w-5" />;
      default: return <Info className="text-muted-foreground h-5 w-5" />;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
            <p className="text-muted-foreground">Your subscriptions and park broadcasts.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markAllRead.isPending} data-testid="button-mark-all-read">
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
          ) : notifications?.length === 0 ? (
            <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Bell className="h-10 w-10 mb-3 opacity-20" />
                <p>You're all caught up.</p>
              </CardContent>
            </Card>
          ) : (
            notifications?.map((notif) => (
              <Card 
                key={notif.id} 
                className={`transition-colors ${!notif.read ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
              >
                <CardContent className="p-4 flex gap-4 cursor-pointer" data-testid={`notif-card-${notif.id}`}>
                  <div className="mt-1 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`text-sm font-semibold ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(notif.createdAt))} ago
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${!notif.read ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                      {notif.body}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
