import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/format";
import { shopSignupSchema } from "@/lib/validation";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Espace commerçant — Sahel Star" },
      {
        name: "description",
        content:
          "Créez votre compte et votre boutique Sahel Star en une seule étape : produits, commandes et WhatsApp.",
      },
      { property: "og:title", content: "Espace commerçant — Sahel Star" },
      {
        property: "og:description",
        content: "Créez votre boutique en ligne et recevez vos commandes sur WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function frMessage(message: string) {
  const m = message.toLowerCase();
  if (m.includes("duplicate key") || m.includes("shops_slug"))
    return "Ce nom de boutique est déjà pris, choisis-en un autre.";
  if (m.includes("weak") || m.includes("pwned"))
    return "Ce mot de passe est trop courant. Choisis-en un plus solide (12+ caractères, chiffres et symboles).";
  if (m.includes("at least") || m.includes("6 characters"))
    return "Mot de passe trop court : 8 caractères minimum.";
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

const inputClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/tableau-de-bord" });
    });
  }, [navigate]);

  async function createShop(ownerId: string, name: string, phone: string, town: string) {
    const base = slugify(name) || "boutique";
    for (let attempt = 0; attempt < 3; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${Math.floor(Math.random() * 900 + 100)}`;
      const { error } = await supabase.from("shops").insert({
        owner_id: ownerId,
        name,
        slug,
        whatsapp: phone,
        city: town || null,
        is_active: true,
      });
      if (!error) return true;
      const msg = error.message.toLowerCase();
      if (!msg.includes("duplicate") && !msg.includes("unique")) throw error;
    }
    return false;
  }

  async function signUp() {
    const parsed = shopSignupSchema.safeParse({
      fullName,
      email,
      password,
      shopName,
      whatsapp,
      city,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Informations invalides");
      return;
    }
    const v = parsed.data;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: v.email,
        password: v.password,
        options: {
          emailRedirectTo: `${window.location.origin}/tableau-de-bord`,
          data: { full_name: v.fullName },
        },
      });
      if (error) throw error;

      if (!data.session) {
        setPendingEmail(v.email);
        toast.success("Compte créé ! Confirme ton email pour continuer.");
        return;
      }

      const userId = data.session.user.id;
      const created = await createShop(userId, v.shopName, v.whatsapp, v.city ?? "");
      if (created) toast.success("Compte et boutique créés !");
      else
        toast.error(
          "Compte créé, mais ce nom de boutique est déjà pris. Choisis-en un autre dans le tableau de bord.",
        );
      navigate({ to: "/tableau-de-bord" });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? frMessage(error.message) : "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    if (!email.trim() || !password) {
      toast.error("Email et mot de passe obligatoires");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ to: "/tableau-de-bord" });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? frMessage(error.message) : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  if (pendingEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Vérifie ta boîte mail
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Nous avons envoyé un lien de confirmation à{" "}
            <span className="font-semibold text-foreground">{pendingEmail}</span>. Clique dessus
            pour activer ton compte commerçant, puis reviens te connecter.
          </p>
          <button
            onClick={() => {
              setPendingEmail(null);
              setMode("signin");
            }}
            className="mt-6 h-12 w-full rounded-md bg-primary text-sm font-bold text-primary-foreground"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold text-foreground">
            Sahel <span className="text-primary">Star</span>
          </span>
        </Link>

        <h1 className="mt-8 font-display text-2xl font-bold text-foreground">
          {mode === "signin" ? "Connexion commerçant" : "Créer mon compte et ma boutique"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Gère ta boutique, tes produits et tes commandes."
            : "Une seule étape : ton compte et ta boutique sont créés ensemble."}
        </p>

        <div className="mt-8 space-y-4">
          {mode === "signup" && (
            <label className="block text-sm">
              <span className="font-medium">Nom complet *</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={80}
                autoComplete="name"
                placeholder="Aïcha Moussa"
                className={`${inputClass} mt-1.5`}
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="font-medium">Email *</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              maxLength={255}
              autoComplete="email"
              placeholder="nom@email.com"
              className={`${inputClass} mt-1.5`}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Mot de passe *</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder={mode === "signup" ? "8 caractères minimum" : "Mot de passe"}
              className={`${inputClass} mt-1.5`}
            />
          </label>

          {mode === "signup" && (
            <>
              <label className="block text-sm">
                <span className="font-medium">Nom de ma boutique *</span>
                <input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  maxLength={60}
                  placeholder="Boutique Aïcha"
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Mon numéro WhatsApp *</span>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  inputMode="tel"
                  maxLength={20}
                  placeholder="+227 90 00 00 00"
                  className={`${inputClass} mt-1.5`}
                />
                <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
                  C'est ton propre numéro WhatsApp, les clients t'écriront directement dessus
                  pour leurs commandes.
                </span>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Ville</span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={60}
                  placeholder="Niamey"
                  className={`${inputClass} mt-1.5`}
                />
              </label>
            </>
          )}

          <button
            onClick={mode === "signup" ? signUp : signIn}
            disabled={loading}
            className="h-12 w-full rounded-md bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading
              ? "Patiente..."
              : mode === "signin"
                ? "Se connecter"
                : "Créer mon compte et ma boutique"}
          </button>
        </div>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {mode === "signin"
            ? "Pas encore de compte ? Créer ma boutique"
            : "J'ai déjà un compte"}
        </button>
      </div>
    </div>
  );
}
