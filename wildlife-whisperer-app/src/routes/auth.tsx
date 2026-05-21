import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { validateDocument, type DocumentType, type Nationality } from "@/lib/validators";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Wildlife Track" },
      { name: "description", content: "Sign in or create an account to track wildlife sightings." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="container mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Wildlife Track</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login"><LoginForm /></TabsContent>
            <TabsContent value="signup"><SignupForm /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Welcome back");
      navigate({ to: "/" });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

function SignupForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    nationality: "BR" as Nationality,
    phone: "",
    licensePlate: "",
    documentType: "CPF" as DocumentType,
    documentNumber: "",
  });
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.phone.trim()) return toast.error("Phone is required");
    if (!form.licensePlate.trim()) return toast.error("License plate is required");

    const valid = validateDocument({
      nationality: form.nationality,
      documentType: form.documentType,
      documentNumber: form.documentNumber,
    });
    if (!valid.valid) return toast.error(valid.error || "Invalid document");

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error || !data.user) {
      setLoading(false);
      return toast.error(error?.message || "Sign up failed");
    }

    const { error: pErr } = await supabase.from("profiles").insert({
      id: data.user.id,
      email: form.email,
      nationality: form.nationality,
      phone: form.phone,
      license_plate: form.licensePlate,
      document_type: form.documentType,
      document_number: form.documentNumber,
    });
    setLoading(false);
    if (pErr) return toast.error(pErr.message);

    toast.success("Account created");
    navigate({ to: "/" });
  }

  const docOptions: DocumentType[] = form.nationality === "BR" ? ["CPF", "RG"] : ["US_DL"];

  return (
    <form onSubmit={submit} className="space-y-3 pt-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <Input type="password" required minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Nationality</Label>
          <Select
            value={form.nationality}
            onValueChange={(v) => {
              const nat = v as Nationality;
              set("nationality", nat);
              set("documentType", nat === "BR" ? "CPF" : "US_DL");
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BR">Brazil (BR)</SelectItem>
              <SelectItem value="US">United States (US)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Vehicle license plate</Label>
        <Input required value={form.licensePlate} onChange={(e) => set("licensePlate", e.target.value.toUpperCase())} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Document type</Label>
          <Select value={form.documentType} onValueChange={(v) => set("documentType", v as DocumentType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {docOptions.map((o) => <SelectItem key={o} value={o}>{o.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Document number</Label>
          <Input required value={form.documentNumber} onChange={(e) => set("documentNumber", e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Already have an account? Switch to <Link to="/auth" className="underline">Sign in</Link>.
      </p>
    </form>
  );
}
