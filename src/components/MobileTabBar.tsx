import { Link } from "@tanstack/react-router";
import { Home, Search, ShoppingCart, Store } from "lucide-react";
import { useCart } from "@/lib/cart";

const item =
  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold text-muted-foreground";
const active = { className: "text-primary" };

export function MobileTabBar() {
  const { count } = useCart();
  return (
    <>
      <div className="h-16 sm:hidden" aria-hidden />
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <Link to="/" className={item} activeProps={active} activeOptions={{ exact: true, includeHash: false }}>
          <Home className="h-5 w-5" /> Accueil
        </Link>
        <Link to="/" hash="boutiques" className={item}>
          <Search className="h-5 w-5" /> Boutiques
        </Link>
        <Link to="/panier" className={item} activeProps={active}>
          <span className="relative">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {count}
              </span>
            )}
          </span>
          Panier
        </Link>
        <Link to="/tableau-de-bord" className={item} activeProps={active}>
          <Store className="h-5 w-5" /> Ma boutique
        </Link>
      </nav>
    </>
  );
}
