import { Link } from "@tanstack/react-router";
import { MessageCircle, Mail, LockKeyhole, ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
export const SUPPORT_WHATSAPP = "22770930651";
export const SUPPORT_EMAIL = "rami_alaabdelmegid@icloud.com";
export function SiteFooter() {
  return <footer id="contact" className="border-t border-border bg-secondary/50">
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
      <div><BrandLogo /><p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">Qualité, style, au meilleur prix.<br />Plus qu’un marché, une communauté.</p></div>
      <div><h2 className="font-semibold">À votre service</h2><div className="mt-4 flex flex-col items-start gap-3 text-sm text-muted-foreground"><Link to="/" hash="catalogue">Notre catalogue</Link><Link to="/" hash="informations">Livraison & retrait</Link><Link to="/panier">Mon panier</Link></div></div>
      <div><h2 className="font-semibold">Parlons de votre commande</h2><div className="mt-4 flex flex-col items-start gap-3"><Button asChild variant="outline"><a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noreferrer"><MessageCircle />WhatsApp<ArrowUpRight /></a></Button><a href={`mailto:${SUPPORT_EMAIL}`} className="flex max-w-full items-center gap-2 break-all text-xs text-muted-foreground"><Mail className="h-4 w-4 shrink-0" />{SUPPORT_EMAIL}</a></div></div>
    </div>
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 border-t border-border px-4 py-5 text-xs text-muted-foreground"><p>Arha Market · Niger</p><Link to="/auth" className="flex items-center gap-1.5"><LockKeyhole className="h-3 w-3" />Administration</Link></div>
  </footer>;
}
