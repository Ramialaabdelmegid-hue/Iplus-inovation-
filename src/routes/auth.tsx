import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Espace commerçant — Sahel Star" },
      {
        name: "description",
        content:
          "Connectez-vous pour créer votre boutique Sahel Star, gérer vos produits et suivre vos commandes.",
      },
      { property: "og:title", content: "Espace commerçant — Sahel Star" },
      {
        property: "og:description",
        content: "Créez votre boutique en ligne et recevez vos commandes sur WhatsApp.",
      },
    ],
  }),
  component: AuthPage,
});

function frMessage(message: string) {
  const m = message.toLowerCase();
  if (m.includes("weak") || m.includes("pwned"))
    return "Ce mot de passe est trop courant. Choisis-en un plus solide (12+ caractères, chiffres et symboles).";
  if (m.includes("at least") || m.includes("6 characters"))
    return "Mot de passe trop court : 6 caractères minimum.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cet email. Connecte-toi.";
  if (m.includes("invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Email pas encore confirmé. Clique sur le lien reçu par mail.";
  if (m.includes("invalid email") || m.includes("email address"))
    return "Adresse email invalide.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Trop de tentatives. Réessaie dans quelques minutes.";
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

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
    if (mode === "signup" && password.length < 8) {
      toast.error("Choisis un mot de passe de 8 caractères minimum.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/tableau-de-bord`,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setPendingEmail(email.trim());
          toast.success("Compte créé ! Confirme ton email pour continuer.");
          return;
        }
        navigate({ to: "/tableau-de-bord" });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ to: "/tableau-de-bord" });
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? frMessage(error.message) : "Connexion impossible",
      );
    } finally {
      setLoading(false);
    }
  }

  if (pendingEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Vérifie ta boîte mail
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Nous avons envoyé un lien de confirmation à{" "}
            <span className="font-semibold text-foreground">{pendingEmail}</span>. Clique
            dessus pour activer ton compte commerçant, puis reviens te connecter.
          </p>
          <button
            onClick={() => {
              setPendingEmail(null);
              setMode("signin");
            }}
            className="mt-6 h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold text-foreground">
            Sahel <span className="text-primary">Star</span>
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
