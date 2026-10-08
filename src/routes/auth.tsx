import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LockKeyhole, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Administration privée — Arha Market" },
    { name: "description", content: "Accès privé à la gestion des produits et commandes Arha Market." },
    { property: "og:title", content: "Administration privée — Arha Market" },
    { property: "og:description", content: "Espace réservé au propriétaire d’Arha Market." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }), component: AuthPage,
});
function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError || !data.user) throw new Error("Email ou mot de passe incorrect.");
      const { data: roles, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "owner");
      if (roleError || !roles?.length) { await supabase.auth.signOut(); throw new Error("Cet accès est réservé au propriétaire d’Arha Market."); }
      await navigate({ to: "/tableau-de-bord" });
    } catch (e) { setError(e instanceof Error ? e.message : "Connexion impossible. Réessaie."); }
    finally { setLoading(false); }
  }
  return <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
    <div className="w-full max-w-sm"><Link to="/"><BrandLogo large /></Link><div className="mt-10 flex items-center gap-2 text-primary"><LockKeyhole className="h-5 w-5" /><span className="text-xs font-semibold uppercase">Espace privé</span></div><h1 className="mt-3 font-display text-2xl font-bold">Administration</h1>
      <form onSubmit={signIn} className="mt-8 space-y-5">
        <label className="block text-sm font-semibold">Email<input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-input bg-card px-3 font-normal" /></label>
        <label className="block text-sm font-semibold">Mot de passe<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-input bg-card px-3 font-normal" /></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="h-12 w-full">{loading ? "Connexion…" : "Se connecter"}</Button>
      </form><Button asChild variant="link" className="mt-6 px-0"><Link to="/"><ArrowLeft />Retour au catalogue</Link></Button>
    </div>
  </main>;
}
