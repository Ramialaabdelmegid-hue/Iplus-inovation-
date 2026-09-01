import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/70 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-display text-base font-bold text-foreground">
            Sahel <span className="text-primary">Star</span>
          </p>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-foreground">
              Accueil
            </Link>
            <Link to="/panier" className="hover:text-foreground">
              Panier
            </Link>
            <Link to="/tableau-de-bord" className="hover:text-foreground">
              Espace commerçant
            </Link>
          </div>
        </div>
        <p className="mt-4">
          Boutiques en ligne pour les commerçants du Niger. Paiement à la livraison, commande
          envoyée directement sur WhatsApp.
        </p>
      </div>
    </footer>
  );
}
