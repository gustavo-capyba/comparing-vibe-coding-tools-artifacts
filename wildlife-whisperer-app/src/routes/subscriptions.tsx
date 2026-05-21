import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X } from "lucide-react";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({
    meta: [
      { title: "Subscriptions — Wildlife Track" },
      { name: "description", content: "Manage which animal species you receive notifications about." },
    ],
  }),
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<{ id: string; animal_type: string }[]>([]);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("subscriptions").select("id, animal_type").eq("user_id", user.id)
      .then(({ data }) => data && setItems(data));
  }, [user]);

  if (loading) return <div className="container mx-auto p-10 text-center text-muted-foreground">Loading…</div>;
  if (!user) {
    throw redirect({ to: "/auth" });
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const animal = value.trim();
    if (!animal) return;
    const { data, error } = await supabase.from("subscriptions")
      .insert({ user_id: user!.id, animal_type: animal })
      .select("id, animal_type").single();
    if (error) return toast.error(error.message);
    setItems((p) => [...p, data!]);
    setValue("");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("subscriptions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((i) => i.id !== id));
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader><CardTitle>Notification subscriptions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You'll receive in-app and (simulated) email notifications when these
            animals are spotted in the park.
          </p>
          <form onSubmit={add} className="flex gap-2">
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Animal type (e.g. Jaguar)" />
            <Button type="submit">Subscribe</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {items.length === 0 && <p className="text-sm text-muted-foreground">No subscriptions yet.</p>}
            {items.map((it) => (
              <Badge key={it.id} variant="secondary" className="gap-1">
                {it.animal_type}
                <button onClick={() => remove(it.id)} aria-label="Remove">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
