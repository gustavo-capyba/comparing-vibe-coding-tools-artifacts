import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  validateDocument,
  isValidPhone,
  isValidPlate,
  type Nationality,
  type DocType,
} from "@/lib/validation";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — WildlifeTrack" },
      { name: "description", content: "Sign in or sign up to track wildlife." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("signin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Toaster richColors position="top-right" />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <CardTitle>WildlifeTrack</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/" });
  }

  return (
    <form onSubmit={submit} className="space-y-3 mt-4">
      <div>
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="si-pw">Password</Label>
        <Input id="si-pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "…" : "Sign in"}</Button>
    </form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [nationality, setNationality] = useState<Nationality>("BR");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [docType, setDocType] = useState<DocType>("CPF");
  const [docValue, setDocValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(phone)) return toast.error("Invalid phone number");
    if (!isValidPlate(plate)) return toast.error("Invalid license plate");
    const r = validateDocument(nationality, docType, docValue);
    if (!r.ok) return toast.error(r.error);

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error || !data.user) {
      setBusy(false);
      return toast.error(error?.message ?? "Signup failed");
    }
    const { error: pErr } = await supabase.from("profiles").insert({
      id: data.user.id,
      email,
      nationality,
      phone,
      license_plate: plate,
      document_type: docType,
      document_value: docValue,
    });
    setBusy(false);
    if (pErr) return toast.error(pErr.message);
    toast.success("Account created");
    navigate({ to: "/" });
  }

  return (
    <form onSubmit={submit} className="space-y-3 mt-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label htmlFor="su-email">Email</Label>
          <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="col-span-2">
          <Label htmlFor="su-pw">Password</Label>
          <Input id="su-pw" type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} required />
        </div>
        <div>
          <Label>Nationality</Label>
          <Select value={nationality} onValueChange={(v) => {
            const n = v as Nationality;
            setNationality(n);
            setDocType(n === "BR" ? "CPF" : "DL");
          }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BR">🇧🇷 Brazil</SelectItem>
              <SelectItem value="US">🇺🇸 United States</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Document type</Label>
          <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {nationality === "BR" ? (
                <>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="RG">RG</SelectItem>
                </>
              ) : (
                <SelectItem value="DL">Driver License</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label htmlFor="doc">Document number</Label>
          <Input id="doc" value={docValue} onChange={(e) => setDocValue(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="plate">License plate</Label>
          <Input id="plate" value={plate} onChange={(e) => setPlate(e.target.value)} required />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "…" : "Create account"}</Button>
    </form>
  );
}