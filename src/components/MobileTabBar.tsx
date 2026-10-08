import { Link } from "@tanstack/react-router";
import { Home, Search, ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { SUPPORT_WHATSAPP } from "@/components/SiteFooter";
const item = "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[11px] font-semibold text-muted-foreground";
export function MobileTabBar() {
  const { count } = useCart();
  return <><div className="h-20 sm:hidden" aria-hidden /><nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
    <Link to="/" className={item} activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}><Home className="h-5 w-5" />Accueil</Link>
    <Link to="/" hash="catalogue" className={item}><Search className="h-5 w-5" />Catalogue</Link>
    <Link to="/panier" className={item} activeProps={{ className: "text-primary" }}><span className="relative"><ShoppingBag className="h-5 w-5" />{count > 0 && <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{count}</span>}</span>Panier</Link>
    <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noreferrer" className={item}><MessageCircle className="h-5 w-5" />Contact</a>
  </nav></>;
}
