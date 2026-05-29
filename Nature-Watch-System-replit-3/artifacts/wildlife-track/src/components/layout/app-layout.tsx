import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { Map, Bell, List, AlertTriangle, Settings, LogOut, Activity } from "lucide-react";
import { useGetNotifications } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  
  // Use interval to poll notifications every 30s
  const { data: notifications } = useGetNotifications({ unreadOnly: true }, {
    query: { refetchInterval: 30000 }
  });

  const unreadCount = notifications?.length || 0;

  const navItems = [
    { href: "/dashboard", label: "Map View", icon: Map },
    { href: "/sightings", label: "Sightings", icon: List },
    { href: "/notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { href: "/emergencies", label: "Emergencies", icon: AlertTriangle },
    { href: "/subscriptions", label: "Subscriptions", icon: Settings },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Sidebar for desktop, bottom nav for mobile */}
      <aside className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r flex flex-col md:h-[100dvh] md:sticky md:top-0 z-40 shadow-sm">
        <div className="p-4 border-b flex flex-row items-center gap-3">
          <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-lg tracking-tight hidden md:block">Wildlife Track</span>
        </div>
        
        <nav className="flex-1 p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer text-sm font-medium ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="hidden md:block flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge variant={isActive ? "secondary" : "destructive"} className="ml-auto hidden md:flex shrink-0 px-1.5 min-w-[20px] justify-center">
                      {item.badge}
                    </Badge>
                  )}
                  {/* Mobile badge indicator */}
                  {item.badge && item.badge > 0 && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full md:hidden" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t hidden md:block">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground" 
            onClick={() => signOut()}
            data-testid="button-signout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-background relative h-[100dvh] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
