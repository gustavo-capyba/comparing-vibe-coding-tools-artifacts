import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  validateDocument,
  isValidPhone,
  isValidLicensePlate,
  type Nationality,
  type DocumentType,
} from "@/lib/validation";

export const Route = createFileRoute("/signup")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/app" });
  },
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationality, setNationality] = useState<Nationality>("BR");
  const [documentType, setDocumentType] = useState<DocumentType>("CPF");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [busy, setBusy] = useState(false);

  const docOptions: DocumentType[] =
    nationality === "BR" ? ["CPF", "RG"] : ["DRIVER_LICENSE"];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const docRes = validateDocument(nationality, documentType, documentNumber);
    if (!docRes.valid) return toast.error(docRes.error!);
    if (!isValidPhone(phone)) return toast.error("Invalid phone number");
    if (!isValidLicensePlate(plate)) return toast.error("Invalid license plate");

    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          nationality,
          document_type: documentType,
          document_number: documentNumber,
          phone,
          license_plate: plate,
        },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — welcome!");
    nav({ to: "/app" });
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-secondary/40">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold mb-1">Create your account</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Join WildlifeTrack to report and follow sightings.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nationality</Label>
              <Select
                value={nationality}
                onValueChange={(v: Nationality) => {
                  setNationality(v);
                  setDocumentType(v === "BR" ? "CPF" : "DRIVER_LICENSE");
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BR">Brazil (BR)</SelectItem>
                  <SelectItem value="US">United States (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Document type</Label>
              <Select value={documentType} onValueChange={(v: DocumentType) => setDocumentType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {docOptions.map((d) => (
                    <SelectItem key={d} value={d}>{d.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Document number</Label>
            <Input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} required />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 81 99999-1234" required />
          </div>
          <div>
            <Label>Vehicle license plate</Label>
            <Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ABC1D23" required />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Creating..." : "Sign up"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Already a member? <Link to="/login" className="underline">Log in</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
