import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetUnreadNotificationCount, getGetUnreadNotificationCountQueryKey, useLogout } from "@workspace/api-client-react";
import { Bell, Map, AlertTriangle, Binoculars, User, LogIn, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const { data: unreadCountData } = useGetUnreadNotificationCount({
    query: {
      queryKey: getGetUnreadNotificationCountQueryKey(),
      enabled: !!user,
      refetchInterval: 30000,
    }
  });

  const logoutMutation = useLogout();
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
      }
    });
  };

  const unreadCount = unreadCountData?.count || 0;

  const NavLinks = () => (
    <>
      <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === '/' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
        <LayoutDashboard size={20} />
        <span className="font-medium">Command Center</span>
      </Link>
      <Link href="/map" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === '/map' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
        <Map size={20} />
        <span className="font-medium">Live Map</span>
      </Link>
      <Link href="/sightings" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === '/sightings' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
        <Binoculars size={20} />
        <span className="font-medium">Sightings</span>
      </Link>
      {user && (
        <>
          <Link href="/emergencies" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === '/emergencies' ? 'bg-destructive text-destructive-foreground' : 'hover:bg-accent text-destructive hover:text-destructive'}`}>
            <AlertTriangle size={20} />
            <span className="font-medium">Emergencies</span>
          </Link>
          <Link href="/subscriptions" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === '/subscriptions' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
            <Settings size={20} />
            <span className="font-medium">Alerts Config</span>
          </Link>
          <Link href="/notifications" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === '/notifications' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
            <div className="relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="font-medium">Notifications</span>
          </Link>
          <Link href="/profile" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === '/profile' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
            <User size={20} />
            <span className="font-medium">Profile</span>
          </Link>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar p-4 shrink-0">
        <div className="flex items-center gap-2 mb-8 px-2 text-sidebar-primary">
          <Binoculars size={24} />
          <h1 className="text-xl font-bold tracking-tight">Wildlife Track</h1>
        </div>
        <nav className="flex-1 space-y-1">
          <NavLinks />
        </nav>
        <div className="mt-auto pt-4 border-t border-sidebar-border">
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="px-3 py-2 text-sm text-muted-foreground truncate">
                {user.name}
              </div>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout} disabled={logoutMutation.isPending}>
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors">
              <LogIn size={20} />
              <span className="font-medium">Ranger Login</span>
            </Link>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-sidebar">
          <div className="flex items-center gap-2 text-sidebar-primary">
            <Binoculars size={24} />
            <h1 className="text-lg font-bold tracking-tight">Wildlife Track</h1>
          </div>
          <div className="flex items-center gap-2">
             {user ? (
                <Button variant="ghost" size="icon" onClick={handleLogout} disabled={logoutMutation.isPending}>
                  <LogOut size={20} />
                </Button>
             ) : (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
             )}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-sidebar flex items-center justify-around p-2 z-50">
        <Link href="/" className={`p-2 rounded-md ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
          <LayoutDashboard size={24} />
        </Link>
        <Link href="/map" className={`p-2 rounded-md ${location === '/map' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Map size={24} />
        </Link>
        <Link href="/sightings" className={`p-2 rounded-md ${location === '/sightings' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Binoculars size={24} />
        </Link>
        {user && (
          <>
            <Link href="/emergencies" className={`p-2 rounded-md ${location === '/emergencies' ? 'text-destructive' : 'text-muted-foreground'}`}>
              <AlertTriangle size={24} />
            </Link>
            <Link href="/notifications" className={`p-2 rounded-md relative ${location === '/notifications' ? 'text-primary' : 'text-muted-foreground'}`}>
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[8px] w-3 h-3 rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}

function LogOut({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
  )
}
