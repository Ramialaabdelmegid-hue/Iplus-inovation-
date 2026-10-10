import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Share2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductGallery } from "@/components/ProductGallery";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { fcfa } from "@/lib/format";
import { storeQueryOptions, STORE_NAME } from "@/lib/store";

export const Route = createFileRoute("/produit/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(storeQueryOptions);
    const product = data.products.find((p) => p.id === params.id);
    if (!product) throw notFound();
    return { name: product.name, description: product.description, price: product.price };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Article introuvable — Arha Market" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.name} — Arha Market`;
    const desc = loaderData.description?.slice(0, 150) || `${loaderData.name} à ${fcfa(loaderData.price)}. Commande WhatsApp, paiement à la livraison.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="font-semibold">Cet article n'existe plus.</p>
        <Button asChild className="mt-6"><Link to="/">Voir le catalogue</Link></Button>
      </main>
    </div>
  );
}

function Choice({ label, options, value, onChange }: { label: string; options: string[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <div className="mt-6">
      <p className="text-sm font-semibold">{label}{value ? ` : ${value}` : ""}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => onChange(o)}
            className={`min-w-12 rounded-md border px-4 py-2 text-sm font-semibold ${value === o ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(storeQueryOptions);
  const { shop, products } = data;
  const p = products.find((x) => x.id === id);
  const { addItem } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  if (!p) return <ProductNotFound />;
  const sizes = p.sizes ?? [];
  const colors = p.colors ?? [];
  const out = !p.is_available || p.stock <= 0;

  function add() {
    if (!shop || !p) return;
    if (sizes.length && !size) return toast.error("Choisis une taille");
    if (colors.length && !color) return toast.error("Choisis une couleur");
    addItem({ id: shop.id, slug: shop.slug, name: STORE_NAME }, {
      productId: p.id, name: p.name, price: p.price, image: p.images[0] ?? null,
      size: sizes.length ? size : null, color: colors.length ? color : null,
    });
    toast.success("Ajouté au panier");
  }

  async function share() {
    const url = window.location.href;
    const text = `${p!.name} — ${fcfa(p!.price)} sur Arha Market`;
    if (navigator.share) {
      try { await navigator.share({ title: p!.name, text, url }); } catch { /* annulé */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 pb-24">
        <Link to="/" hash="catalogue" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Catalogue</Link>
        <div className="mt-4 grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-border"><ProductGallery images={p.images} name={p.name} /></div>
            {p.video_url && <video src={p.video_url} controls playsInline className="w-full rounded-lg border border-border" />}
          </div>
          <div>
            {p.category && <p className="text-xs font-semibold uppercase text-primary">{p.category}</p>}
            <h1 className="mt-2 font-display text-3xl font-extrabold">{p.name}</h1>
            <p className="mt-3 text-2xl font-bold text-primary">{fcfa(p.price)}</p>
            {out ? <p className="mt-2 text-sm font-semibold text-destructive">Épuisé</p>
              : p.stock <= 2 && <p className="mt-2 text-sm text-muted-foreground">Plus que {p.stock} en stock</p>}
            {sizes.length > 0 && <Choice label="Taille" options={sizes} value={size} onChange={setSize} />}
            {colors.length > 0 && <Choice label="Couleur" options={colors} value={color} onChange={setColor} />}
            <div className="mt-8 flex gap-2">
              <Button className="h-12 flex-1" disabled={out || !shop} onClick={add}><ShoppingBag />{out ? "Épuisé" : "Ajouter au panier"}</Button>
              <Button variant="outline" className="h-12" onClick={share} aria-label="Partager"><Share2 /></Button>
            </div>
            {p.description && <p className="mt-8 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{p.description}</p>}
            <p className="mt-6 text-xs text-muted-foreground">Commande sur WhatsApp · Paiement à la livraison</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
