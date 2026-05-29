import { useGetMe } from "@workspace/api-client-react";
import { User, Phone, Car, FileText, Globe } from "lucide-react";

export default function Profile() {
  const { data: user, isLoading } = useGetMe();

  if (isLoading) {
    return <div className="p-6 text-muted-foreground text-sm">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-6 text-muted-foreground text-sm">Could not load profile.</div>;
  }

  const fields = [
    { icon: User, label: "Full Name", value: user.name },
    { icon: Globe, label: "Email", value: user.email },
    { icon: Globe, label: "Nationality", value: user.nationality === "BR" ? "Brazil" : "United States" },
    { icon: Phone, label: "Phone", value: user.phone },
    { icon: Car, label: "Vehicle Plate", value: user.vehiclePlate },
    { icon: FileText, label: `${user.documentType}`, value: user.documentValue },
  ];

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Your ranger account details</p>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="bg-primary/10 p-6 flex items-center gap-4 border-b">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
            <User className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground" data-testid="text-profile-name">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="divide-y">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center gap-4 p-4">
              <f.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">{f.label}</div>
                <div className="text-sm font-medium text-foreground" data-testid={`text-profile-${f.label.toLowerCase().replace(/ /g, "-")}`}>
                  {f.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
