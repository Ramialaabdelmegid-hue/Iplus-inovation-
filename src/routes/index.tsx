import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, ShoppingBag, Truck, MessageCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter, SUPPORT_WHATSAPP } from "@/components/SiteFooter";
import { ProductGallery } from "@/components/ProductGallery";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { fcfa } from "@/lib/format";
import { storeQueryOptions, STORE_NAME } from "@/lib/store";
import collection from "@/assets/arha-collection.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arha Market — Pour elle, pour lui, pour tous" },
      { name: "description", content: "Vêtements, chaussures, accessoires, beauté et informatique. Commandez sur WhatsApp et payez à la livraison au Niger." },
      { property: "og:title", content: "Arha Market — Pour elle, pour lui, pour tous" },
      { property: "og:description", content: "Le catalogue Arha Market : commande WhatsApp, paiement à la livraison." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(storeQueryOptions),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(storeQueryOptions);
  const { shop, products } = data;
  const { addItem } = useCart();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))] as string[], [products]);
  const list = products.filter((p) => (!cat || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <img src={collection} alt="Collection Arha Market" className="absolute inset-0 h-full w-full object-cover opacity-40" width={1600} height={900} />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
            <p className="text-xs font-semibold uppercase text-primary">Pour elle · Pour lui · Pour tous</p>
            <h1 className="mt-4 max-w-2xl font-display text-4xl font-extrabold sm:text-6xl">Qualité, style, au meilleur prix.</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">Commandez sur WhatsApp, payez à la livraison.</p>
            <Button asChild className="mt-8 h-12"><a href="#catalogue"><ShoppingBag />Voir le catalogue</a></Button>
          </div>
        </section>

        <section id="catalogue" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
          <h2 className="font-display text-2xl font-bold">Notre catalogue</h2>
          <label className="mt-6 flex h-12 items-center gap-2 rounded-md border border-input bg-card px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un article" className="w-full bg-transparent outline-none" />
          </label>
          {categories.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {[null, ...categories].map((c) => (
                <button key={c ?? "all"} onClick={() => setCat(c)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{c ?? "Tout"}</button>
              ))}
            </div>
          )}
          {list.length === 0 ? (
            <p className="mt-10 text-center text-muted-foreground">Aucun article pour le moment.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {list.map((p) => {
                const out = !p.is_available || p.stock <= 0;
                return (
                  <article key={p.id} className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
                    <ProductGallery images={p.images} name={p.name} />
                    <div className="flex flex-1 flex-col p-3">
                      <h3 className="line-clamp-2 text-sm font-semibold">{p.name}</h3>
                      <p className="mt-1 font-bold text-primary">{fcfa(p.price)}</p>
                      {p.stock > 0 && p.stock <= 2 && <p className="text-xs text-muted-foreground">Plus que {p.stock}</p>}
                      <Button size="sm" className="mt-auto pt-0" disabled={out || !shop} onClick={() => {
                        if (!shop) return;
                        addItem({ id: shop.id, slug: shop.slug, name: STORE_NAME }, { productId: p.id, name: p.name, price: p.price, image: p.images[0] ?? null });
                        toast.success("Ajouté au panier");
                      }}>{out ? "Épuisé" : "Ajouter"}</Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section id="informations" className="mx-auto grid max-w-6xl scroll-mt-24 gap-4 px-4 pb-16 sm:grid-cols-3">
          {[
            { icon: Truck, t: "Livraison", d: shop?.delivery_info ?? "Livraison à Niamey, paiement à la réception." },
            { icon: MessageCircle, t: "Commande WhatsApp", d: "Votre panier est envoyé directement sur notre WhatsApp." },
            { icon: ShieldCheck, t: "Paiement à la livraison", d: "Vous payez seulement quand vous recevez l'article." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-lg border border-border bg-card p-5">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
          <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} className="sr-only">WhatsApp</a>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
