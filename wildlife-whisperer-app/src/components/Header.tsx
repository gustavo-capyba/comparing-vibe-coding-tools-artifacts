import { Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MapPin, Bell, LogOut, PawPrint } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <PawPrint className="h-5 w-5 text-primary" />
          <span>Wildlife Track</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" /> Map
          </Link>
          {user && (
            <Link to="/subscriptions" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Bell className="h-4 w-4" /> Subscriptions
            </Link>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
