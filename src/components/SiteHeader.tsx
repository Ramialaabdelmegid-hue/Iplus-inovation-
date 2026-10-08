import { Link } from "@tanstack/react-router";
import { ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { SUPPORT_WHATSAPP } from "@/components/SiteFooter";

export function SiteHeader() {
  const { count } = useCart();
  return <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
    <div className="mx-auto flex h-20 max-w-6xl items-center gap-3 px-4">
      <Link to="/" aria-label="Arha Market, accueil"><BrandLogo /></Link>
      <nav className="ml-auto flex items-center gap-2 sm:gap-6" aria-label="Navigation principale">
        <Link to="/" hash="catalogue" className="hidden text-sm font-semibold sm:block">Catalogue</Link>
        <Link to="/" hash="informations" className="hidden text-sm font-semibold sm:block">Livraison & contact</Link>
        <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex"><a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noreferrer" aria-label="Contacter Arha Market sur WhatsApp"><MessageCircle /></a></Button>
        <Button asChild variant="outline"><Link to="/panier"><ShoppingBag /><span className="hidden sm:inline">Panier</span>{count > 0 && <span className="font-bold text-primary">{count}</span>}</Link></Button>
      </nav>
    </div>
  </header>;
}
