import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Clock, MapPin, MessageCircle, Search, Star, Store, Truck, Video } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { fcfa } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { fetchShopSeo } from "@/lib/shop-seo";
import { ShareShopButton } from "@/components/ShareShopButton";
import { ShopReviews } from "@/components/ShopReviews";
import { ProductGallery } from "@/components/ProductGallery";



export const Route = createFileRoute("/boutique/$slug")({
  loader: async ({ params }) => ({ seo: await fetchShopSeo(params.slug) }),
  head: ({ params, loaderData }) => {
    const seo = loaderData?.seo;
    const name = seo?.name ?? params.slug;
    const place = [seo?.quartier, seo?.city].filter(Boolean).join(", ");
    const title = `${name} — Boutique en ligne${place ? ` à ${place}` : ""} | Arha Market`;
    const description =
      seo?.description?.slice(0, 155) ||
      `Découvrez les produits de ${name}${place ? ` à ${place}` : ""} : prix en FCFA, commande sur WhatsApp et paiement à la livraison.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(seo?.logo_url
          ? [
              { property: "og:image", content: seo.logo_url },
              { name: "twitter:image", content: seo.logo_url },
            ]
          : []),
      ],
      scripts: seo
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Store",
                name: seo.name,
                description: seo.description ?? undefined,
                image: seo.logo_url ?? undefined,
                address: place
                  ? {
                      "@type": "PostalAddress",
                      addressLocality: seo.city ?? undefined,
                      streetAddress: seo.quartier ?? undefined,
                      addressCountry: "NE",
                    }
                  : undefined,
              }),
            },
          ]
        : [],
    };
  },
  component: ShopPage,
});

type Shop = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  city: string | null;
  quartier: string | null;
  delivery_info: string | null;
  delivery_fee: number;
  opening_hours: string | null;
  whatsapp: string;
};


type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  stock: number;
  is_available: boolean;
  images: string[];
  video_url: string | null;
};

function ShopPage() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [tab, setTab] = useState<"articles" | "avis" | "infos">("articles");

  const shopQuery = useQuery({
    queryKey: ["shop", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select(
          "id, name, slug, logo_url, description, city, quartier, delivery_info, delivery_fee, opening_hours, whatsapp",
        )

        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return (data as Shop | null) ?? null;
    },
  });

  const shop = shopQuery.data;

  const productsQuery = useQuery({
    queryKey: ["shop-products", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, category, stock, is_available, images, video_url")
        .eq("shop_id", shop!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const ratingQuery = useQuery({
    queryKey: ["shop-rating", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_reviews").select("rating").eq("shop_id", shop!.id);
      if (error) throw error;
      const list = data ?? [];
      const avg = list.length ? list.reduce((a, r) => a + r.rating, 0) / list.length : 0;
      return { avg, count: list.length };
    },
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const product of productsQuery.data ?? []) if (product.category) set.add(product.category);
    return Array.from(set);
  }, [productsQuery.data]);

  const products = useMemo(() => {
    const search = term.trim().toLowerCase();
    return (productsQuery.data ?? []).filter((product) => {
      const matchCategory = !category || product.category === category;
      const matchTerm =
        !search ||
        [product.name, product.description, product.category].some((value) =>
          (value ?? "").toLowerCase().includes(search),
        );
      return matchCategory && matchTerm;
    });
  }, [productsQuery.data, term, category]);

  if (shopQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Boutique introuvable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cette boutique n'existe pas ou n'est plus active.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="border-b border-border/70 bg-secondary/50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-10">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt={`Logo de ${shop.name}`}
                className="h-20 w-20 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-card font-display text-2xl font-bold text-primary">
                {shop.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {shop.name}
              </h1>
              {ratingQuery.data && ratingQuery.data.count > 0 && (
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-foreground">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  {ratingQuery.data.avg.toFixed(1)}
                  <span className="font-normal text-muted-foreground">({ratingQuery.data.count} avis)</span>
                </p>
              )}
              {(shop.city || shop.quartier) && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {[shop.quartier, shop.city].filter(Boolean).join(", ")}
                </p>
              )}
              {shop.description && (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{shop.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-md bg-accent/15 px-2.5 py-1 text-accent">
                  Paiement à la livraison
                </span>
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-primary">
                  Commande sur WhatsApp
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-bold text-accent-foreground"
                >
                  <MessageCircle className="h-4 w-4" /> Contacter sur WhatsApp
                </a>
                <ShareShopButton slug={shop.slug} name={shop.name} />
              </div>
            </div>

          </div>
        </section>

        <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl px-4">
            {([
              ["articles", "Articles"],
              ["avis", "Avis clients"],
              ["infos", "Infos & horaires"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 border-b-2 py-3 text-sm font-semibold sm:flex-none sm:px-5 ${
                  tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === "infos" && (
          <section className="mx-auto max-w-6xl space-y-2 px-4 py-8">
              <p className="flex items-center gap-1.5 text-sm font-medium text-accent">
                <Truck className="h-4 w-4" />
                Livraison : {fcfa(shop.delivery_fee)}
                {shop.delivery_info ? ` — ${shop.delivery_info}` : ""}
              </p>
              {shop.opening_hours && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Horaires : {shop.opening_hours}
                </p>
              )}

            {(shop.city || shop.quartier) && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {[shop.quartier, shop.city].filter(Boolean).join(", ")}
              </p>
            )}
            {shop.description && <p className="text-sm text-muted-foreground">{shop.description}</p>}
          </section>
        )}

        {tab === "avis" && <ShopReviews shopId={shop.id} />}

        {tab === "articles" && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
            <Search className="ml-2 h-5 w-5 text-muted-foreground" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Rechercher un produit dans cette boutique"
              className="h-10 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
              aria-label="Rechercher un produit"
            />
          </div>

          {categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setCategory(null)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  category === null
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground"
                }`}
              >
                Tout
              </button>
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    category === item
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {productsQuery.isLoading ? (
            <p className="mt-8 text-sm text-muted-foreground">Chargement des produits...</p>
          ) : products.length === 0 ? (
            <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center">
              <Store className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucun produit ne correspond à ta recherche.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {products.map((product) => {
                const soldOut = !product.is_available || product.stock <= 0;
                return (
                  <article
                    key={product.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                  >
                    <div className="relative">
                      <ProductGallery images={product.images ?? []} name={product.name} />
                      <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1">
                        {product.video_url && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] font-bold text-background">
                            <Video className="h-3 w-3" /> Vidéo
                          </span>
                        )}
                        {!soldOut && product.stock > 0 && product.stock <= 2 && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                            {product.stock === 1 ? "Dernier article" : "Plus que 2"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-3">
                      <p className="text-sm font-semibold text-foreground">{product.name}</p>
                      {product.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {product.description}
                        </p>
                      )}
                      {product.video_url && (
                        <a
                          href={product.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 text-xs font-semibold text-primary underline"
                        >
                          Voir la vidéo du produit
                        </a>
                      )}
                      <p className="mt-2 font-display text-base font-bold text-primary">
                        {fcfa(product.price)}
                      </p>
                      <button
                        disabled={soldOut}
                        onClick={() => {
                          const result = addItem(
                            { id: shop.id, slug: shop.slug, name: shop.name },
                            {
                              productId: product.id,
                              name: product.name,
                              price: product.price,
                              image: product.images?.[0] ?? null,
                            },
                          );
                          toast.success(
                            result.replaced
                              ? "Panier remplacé (une seule boutique à la fois)"
                              : `${product.name} ajouté au panier`,
                          );
                        }}
                        className="mt-3 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                      >
                        {soldOut ? "Indisponible" : "Ajouter au panier"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        )}
      </main>


      <SiteFooter />
    </div>
  );
}
