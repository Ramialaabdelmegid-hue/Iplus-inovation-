import { Link } from "@tanstack/react-router";
import { ShoppingBag, Store } from "lucide-react";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Sahel <span className="text-primary">Star</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/tableau-de-bord"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Espace commerçant</span>
            <span className="sm:hidden">Boutique</span>
          </Link>
          <Link
            to="/panier"
            className="relative flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Panier
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
