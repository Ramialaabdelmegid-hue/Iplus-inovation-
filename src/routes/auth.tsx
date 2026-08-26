import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Espace commerçant — PAZ SHOP" },
      {
        name: "description",
        content:
          "Connectez-vous pour créer votre boutique PAZ SHOP, gérer vos produits et suivre vos commandes.",
      },
      { property: "og:title", content: "Espace commerçant — PAZ SHOP" },
      {
        property: "og:description",
        content: "Créez votre boutique en ligne et recevez vos commandes sur WhatsApp.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/tableau-de-bord" });
    });
  }, [navigate]);

  async function submit() {
    if (!email.trim() || !password) {
      toast.error("Email et mot de passe obligatoires");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/tableau-de-bord`,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifie ta boîte mail si demandé.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ to: "/tableau-de-bord" });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch (error) {
      console.error(error);
      toast.error("Connexion Google indisponible");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold text-foreground">
            PAZ <span className="text-primary">SHOP</span>
          </span>
        </Link>

        <h1 className="mt-6 font-display text-2xl font-bold text-foreground">
          {mode === "signin" ? "Connexion commerçant" : "Créer mon compte commerçant"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gère ta boutique, tes produits et tes commandes.
        </p>

        <div className="mt-6 space-y-3">
          {mode === "signup" && (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nom complet"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Mot de passe"
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={submit}
            disabled={loading}
            className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Patiente..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
          <button
            onClick={google}
            className="h-12 w-full rounded-xl border border-border bg-background text-sm font-semibold text-foreground"
          >
            Continuer avec Google
          </button>
        </div>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {mode === "signin" ? "Pas encore de compte ? Créer un compte" : "J'ai déjà un compte"}
        </button>
      </div>
    </div>
  );
}
