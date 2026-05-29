import { useGetMe, getGetMeQueryKey, useListSubscriptions, getListSubscriptionsQueryKey, useListSightings, getListSightingsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { User, Globe, Phone, Car, FileText, Bell, Eye } from "lucide-react";
import { useLocation } from "wouter";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: me, isLoading: isMeLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey(), enabled: !!user } });
  const { data: subscriptions = [] } = useListSubscriptions({ query: { queryKey: getListSubscriptionsQueryKey(), enabled: !!user } });
  const { data: sightings = [] } = useListSightings(undefined, { query: { queryKey: getListSightingsQueryKey(), enabled: !!user } });

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
        <User className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Not logged in</h2>
        <p className="text-muted-foreground">Please log in to view your profile.</p>
        <Button onClick={() => setLocation("/login")}>Login</Button>
      </div>
    );
  }

  if (isMeLoading) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const docLabel =
    me?.documentType === "cpf" ? "CPF" :
    me?.documentType === "rg" ? "RG" :
    "Driver's License";

  const mySightings = sightings.filter((s) => s.userId === me?.id);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{me?.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{me?.email}</p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0 mt-1">
          {me?.nationality}
        </Badge>
      </div>

      <Card data-testid="card-profile-info">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Ranger Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded bg-muted/50">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Nationality</p>
                <p className="font-medium text-sm">{me?.nationality === "BR" ? "Brazil" : me?.nationality === "US" ? "United States" : me?.nationality}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded bg-muted/50">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium text-sm">{me?.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded bg-muted/50">
              <Car className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Vehicle Plate</p>
                <p className="font-medium text-sm font-mono">{me?.vehiclePlate || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded bg-muted/50">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{docLabel}</p>
                <p className="font-medium text-sm font-mono">{me?.documentNumber}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Member since {me ? new Date(me.createdAt).toLocaleDateString() : "—"}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Eye className="h-8 w-8 text-primary opacity-70" />
            <div>
              <p className="text-2xl font-bold">{mySightings.length}</p>
              <p className="text-xs text-muted-foreground">Sightings reported</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary opacity-70" />
            <div>
              <p className="text-2xl font-bold">{subscriptions.length}</p>
              <p className="text-xs text-muted-foreground">Active subscriptions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button variant="outline" className="w-full" onClick={() => { logout(); setLocation("/"); }} data-testid="button-logout">
        Logout
      </Button>
    </div>
  );
}
