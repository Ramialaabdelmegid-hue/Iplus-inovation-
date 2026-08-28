import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, MapPin, Store, MessageCircle, ShoppingCart, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { fcfa } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Iplus — Boutiques en ligne au Niger" },
      {
        name: "description",
        content:
          "Découvrez les boutiques de Iplus, commandez vos produits en FCFA et payez à la livraison. Commande envoyée directement sur WhatsApp.",
      },
      { property: "og:title", content: "Iplus — Boutiques en ligne au Niger" },
      {
        property: "og:description",
        content:
          "Boutiques locales, produits en FCFA, commande sur WhatsApp et paiement à la livraison.",
      },
    ],
  }),
  component: Home,
});

type Shop = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  city: string | null;
  quartier: string | null;
};

type Product = {
  id: string;
  name: string;
  price: number;
  category: string | null;
  images: string[];
  shop_id: string;
  shops: { name: string; slug: string } | null;
};

function Home() {
  const [term, setTerm] = useState("");

  const shopsQuery = useQuery({
    queryKey: ["home-shops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, slug, logo_url, description, city, quartier")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return (data ?? []) as Shop[];
    },
  });

  const productsQuery = useQuery({
    queryKey: ["home-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, category, images, shop_id, shops(name, slug)")
        .eq("is_available", true)
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });

  const search = term.trim().toLowerCase();

  const shops = useMemo(() => {
    const list = shopsQuery.data ?? [];
    if (!search) return list;
    return list.filter((s) =>
      [s.name, s.city, s.quartier, s.description].some((v) =>
        (v ?? "").toLowerCase().includes(search),
      ),
    );
  }, [shopsQuery.data, search]);

  const products = useMemo(() => {
    const list = productsQuery.data ?? [];
    if (!search) return list;
    return list.filter((p) =>
      [p.name, p.category, p.shops?.name].some((v) => (v ?? "").toLowerCase().includes(search)),
    );
  }, [productsQuery.data, search]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of productsQuery.data ?? []) if (p.category) set.add(p.category);
    return Array.from(set).slice(0, 12);
  }, [productsQuery.data]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="border-b border-border/70 bg-secondary/50">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
            <p className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              Made in Niger
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              Toutes les boutiques du quartier, dans ton téléphone.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Trouve une boutique, choisis tes produits, commande en quelques secondes. Sans créer
              de compte, et tu paies à la livraison.
            </p>

            <div className="mt-8 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
              <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Rechercher une boutique, un produit, une catégorie..."
                className="h-11 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Rechercher"
              />
            </div>

            {categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setTerm(category)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold text-foreground">Boutiques</h2>
            <span className="text-sm text-muted-foreground">{shops.length} boutique(s)</span>
          </div>

          {shopsQuery.isLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Chargement des boutiques...</p>
          ) : shops.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
              <Store className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium text-foreground">Aucune boutique pour le moment</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tu es commerçant ? Crée ta boutique en quelques minutes.
              </p>
              <Link
                to="/tableau-de-bord"
                className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Ouvrir ma boutique
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => (
                <Link
                  key={shop.id}
                  to="/boutique/$slug"
                  params={{ slug: shop.slug }}
                  className="group rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    {shop.logo_url ? (
                      <img
                        src={shop.logo_url}
                        alt={`Logo de ${shop.name}`}
                        className="h-12 w-12 rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary font-display text-lg font-bold text-primary">
                        {shop.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{shop.name}</p>
                      {(shop.city || shop.quartier) && (
                        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {[shop.quartier, shop.city].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  {shop.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {shop.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12">
          <h2 className="font-display text-2xl font-bold text-foreground">Produits populaires</h2>
          {productsQuery.isLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Chargement des produits...</p>
          ) : products.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Aucun produit disponible.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to="/boutique/$slug"
                  params={{ slug: product.shops?.slug ?? "" }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-square overflow-hidden bg-secondary">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Store className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="mt-1 font-display text-base font-bold text-primary">
                      {fcfa(product.price)}
                    </p>
                    {product.shops?.name && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {product.shops.name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="border-y border-border/70 bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="font-display text-2xl font-bold text-foreground">Comment commander ?</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Store,
                  title: "1. Choisis une boutique",
                  text: "Cherche la boutique ou le produit qui t'intéresse.",
                },
                {
                  icon: ShoppingCart,
                  title: "2. Remplis ton panier",
                  text: "Ajoute les produits et ajuste les quantités.",
                },
                {
                  icon: MessageCircle,
                  title: "3. Envoie sur WhatsApp",
                  text: "Le commerçant reçoit ta commande et te livre.",
                },
              ].map((step) => (
                <div key={step.title} className="rounded-2xl border border-border bg-card p-5">
                  <step.icon className="h-6 w-6 text-primary" />
                  <p className="mt-3 font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4 text-accent" />
              Paiement à la livraison — aucun paiement en ligne nécessaire.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
