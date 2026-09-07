import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  MessageCircle,
  Package,
  Share2,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const title = "Devenir commerçant sur Sahel Star — Ouvre ta boutique gratuitement";
const description =
  "Crée ta boutique en ligne au Niger en quelques minutes : ajoute tes produits, reçois les commandes sur WhatsApp et encaisse à la livraison. Gratuit.";

export const Route = createFileRoute("/devenir-commercant")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BecomeMerchantPage,
});

const steps = [
  {
    icon: Store,
    title: "1. Crée ton compte et ta boutique",
    text: "Nom de la boutique, numéro WhatsApp, ville : c'est tout. Une seule étape, gratuit.",
  },
  {
    icon: Package,
    title: "2. Ajoute tes produits",
    text: "Photos depuis ton téléphone, prix en FCFA, stock et catégorie.",
  },
  {
    icon: Share2,
    title: "3. Partage ton lien",
    text: "Un lien unique à envoyer sur WhatsApp, Facebook ou TikTok.",
  },
  {
    icon: MessageCircle,
    title: "4. Reçois les commandes",
    text: "Chaque commande arrive sur ton WhatsApp et dans ton tableau de bord.",
  },
  {
    icon: Truck,
    title: "5. Livre et encaisse",
    text: "Le client paie à la livraison. Aucun paiement en ligne à gérer.",
  },
];

const faq = [
  {
    q: "Combien ça coûte ?",
    a: "Créer ta boutique et ajouter tes produits est gratuit. Tu gardes 100 % de tes ventes.",
  },
  {
    q: "Faut-il un compte bancaire ?",
    a: "Non. Les clients paient à la livraison, directement entre tes mains.",
  },
  {
    q: "Est-ce que je peux gérer depuis mon téléphone ?",
    a: "Oui, tout fonctionne sur téléphone : photos, produits, commandes et statuts.",
  },
  {
    q: "Mes clients doivent-ils créer un compte ?",
    a: "Non. Ils choisissent leurs produits et envoient la commande en quelques secondes.",
  },
];

function BecomeMerchantPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="border-b border-border/70 bg-secondary/50">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
            <p className="inline-flex items-center gap-2 rounded-md bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              Gratuit
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              Ouvre ta boutique en ligne, vends dans tout ton quartier.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Sahel Star te donne une vraie boutique en ligne, un lien à partager et des commandes
              qui arrivent directement sur ton WhatsApp.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Store className="h-4 w-4" />
                Créer ma boutique gratuitement
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Voir des boutiques
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-2xl font-bold text-foreground">Comment ça marche</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title} className="rounded-lg border border-border bg-card p-5">
                <step.icon className="h-6 w-6 text-primary" />
                <p className="mt-3 font-semibold text-foreground">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border/70 bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Pourquoi les commerçants choisissent Sahel Star
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Wallet, title: "0 FCFA pour commencer", text: "Aucun abonnement, aucune commission sur tes ventes." },
                { icon: BadgeCheck, title: "Tu inspires confiance", text: "Photos, horaires, avis clients et paiement à la livraison." },
                { icon: MessageCircle, title: "Tout passe par WhatsApp", text: "L'outil que tes clients utilisent déjà tous les jours." },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-border bg-card p-5">
                  <item.icon className="h-6 w-6 text-accent" />
                  <p className="mt-3 font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-2xl font-bold text-foreground">Questions fréquentes</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {faq.map((item) => (
              <div key={item.q} className="rounded-lg border border-border bg-card p-5">
                <p className="font-semibold text-foreground">{item.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
          <Link
            to="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          >
            <Store className="h-4 w-4" />
            Je crée ma boutique
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
