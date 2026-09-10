import { Link } from "@tanstack/react-router";
import { MessageCircle, Mail } from "lucide-react";

export const SUPPORT_WHATSAPP = "22790000000";
export const SUPPORT_EMAIL = "support@sahelstar.ne";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-display text-base font-extrabold text-foreground">
            Sahel <span className="text-primary">Star</span>
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/" className="hover:text-foreground">
              Accueil
            </Link>
            <Link to="/panier" className="hover:text-foreground">
              Panier
            </Link>
            <Link to="/devenir-commercant" className="hover:text-foreground">
              Devenir commerçant
            </Link>
            <Link to="/tableau-de-bord" className="hover:text-foreground">
              Créer une boutique
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-card p-5">
          <p className="font-semibold text-foreground">Besoin d'aide ?</p>
          <p className="mt-1 text-xs">
            Une question, un blocage pour créer ta boutique ? Écris-nous, on répond vite.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              Support WhatsApp
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <Mail className="h-4 w-4" />
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        <p className="mt-6">
          Boutiques en ligne pour les commerçants du Niger. Paiement à la livraison, commande
          envoyée directement sur WhatsApp.
        </p>
      </div>
    </footer>
  );
}
