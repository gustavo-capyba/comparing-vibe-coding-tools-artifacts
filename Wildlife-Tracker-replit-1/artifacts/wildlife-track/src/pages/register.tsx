import { useState } from "react";
import { useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const registerMutation = useRegister();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    nationality: "BR",
    phone: "",
    vehiclePlate: "",
    documentType: "cpf",
    documentNumber: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSelectChange = (key: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      if (key === "nationality") {
        next.documentType = value === "BR" ? "cpf" : "driver_license";
        next.documentNumber = "";
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(
      { data: formData },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          toast({ title: "Registration complete", description: "Welcome to Command Center." });
          setLocation("/");
        },
        onError: (err) => {
          toast({ 
            title: "Registration failed", 
            description: err.data?.error || "Check your information and try again",
            variant: "destructive" 
          });
        }
      }
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-xl bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Request Access</CardTitle>
          <CardDescription>
            Register to report sightings and receive alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={formData.phone} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label>Nationality</Label>
                <Select value={formData.nationality} onValueChange={(v) => handleSelectChange("nationality", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BR">Brazil</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehiclePlate">Vehicle Plate (Optional)</Label>
                <Input id="vehiclePlate" value={formData.vehiclePlate} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={formData.documentType} onValueChange={(v) => handleSelectChange("documentType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {formData.nationality === "BR" ? (
                      <>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="rg">RG</SelectItem>
                      </>
                    ) : (
                      <SelectItem value="driver_license">Driver's License</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentNumber">Document Number</Label>
                <Input 
                  id="documentNumber" 
                  value={formData.documentNumber} 
                  onChange={handleChange} 
                  placeholder={formData.documentType === 'cpf' ? '000.000.000-00' : formData.documentType === 'rg' ? '00.000.000-0' : 'License #'}
                  required 
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-4 font-bold" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Registering..." : "Submit Registration"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already registered? <Link href="/login" className="text-primary hover:underline">Login here</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
