import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useGetMe, useLogout, useListNotifications } from "@workspace/api-client-react";
import { Map, List, AlertTriangle, Bell, User as UserIcon, LogOut, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const { data: user } = useGetMe();
  const { data: notifications } = useListNotifications();
  const logoutMutation = useLogout();

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setToken(null);
        setLocation("/login");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-card border-r flex flex-col shrink-0 md:h-screen sticky top-0 z-50">
        <div className="p-6 border-b">
          <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
            <Map className="text-primary" /> Wildlife Track
          </h2>
          {user && <p className="text-sm text-muted-foreground mt-2">{user.name}</p>}
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/")} data-testid="nav-dashboard">
            <Map className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/sightings")} data-testid="nav-sightings">
            <List className="mr-2 h-4 w-4" /> Sightings
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/report")} data-testid="nav-report">
            <PlusCircle className="mr-2 h-4 w-4" /> Report Sighting
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/notifications")} data-testid="nav-notifications">
            <Bell className="mr-2 h-4 w-4" /> Notifications
            {unreadCount > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setLocation("/emergency")} data-testid="nav-emergency">
            <AlertTriangle className="mr-2 h-4 w-4" /> Emergency
          </Button>
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/profile")} data-testid="nav-profile">
            <UserIcon className="mr-2 h-4 w-4" /> Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout} data-testid="nav-logout">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
