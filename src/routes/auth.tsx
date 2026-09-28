import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const safe = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/ai-ceo/morning/execution");

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — Founder AI" },
      { name: "description", content: "Sign in to approve, run and verify Founder AI worker tasks." },
      { property: "og:title", content: "Sign in — Founder AI" },
      { property: "og:description", content: "Sign in to approve, run and verify Founder AI worker tasks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    const go = () => nav({ to: safe(redirect), replace: true });
    supabase.auth.getUser().then(({ data }) => { if (data.user) go(); });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) go(); });
    return () => sub.subscription.unsubscribe();
  }, [nav, redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { data, error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin + "/auth" } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "up" && !data.session) toast.success("Check your email to confirm your account, then sign in.");
  };
  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="bento-card w-full max-w-sm space-y-4 p-6">
        <div><h1 className="text-xl font-semibold">{mode === "in" ? "Sign in to Founder AI" : "Create your account"}</h1><p className="mt-1 text-sm text-muted-foreground">Every approval and verification is recorded under your name.</p></div>
        <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1"><Label htmlFor="em">Email</Label><Input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</Button>
        </form>
        <button className="text-xs text-muted-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "No account? Create one" : "Have an account? Sign in"}</button>
      </div>
    </main>
  );
}
