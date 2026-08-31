import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  LogOut,
  Package,
  ClipboardList,
  Store,
  Plus,
  Trash2,
  ShoppingBag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fcfa, slugify, ORDER_STATUS_LABELS, nextStatus } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord commerçant — Iplus" },
      {
        name: "description",
        content:
          "Gérez votre boutique Iplus : informations, produits, stock et suivi des commandes reçues.",
      },
      { property: "og:title", content: "Tableau de bord commerçant — Iplus" },
      {
        property: "og:description",
        content: "Boutique, produits et commandes : tout se gère depuis un seul écran.",
      },
    ],
  }),
  component: DashboardPage,
});

type Tab = "boutique" | "produits" | "commandes";

const inputClass =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary";

function shopErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const m = raw.toLowerCase();
  if (m.includes("duplicate key") || m.includes("unique") || m.includes("23505") || m.includes("slug")) {
    return "Ce nom de boutique est déjà pris, choisis-en un autre.";
  }
  if (m.includes("row-level security") || m.includes("permission")) {
    return "Action non autorisée. Reconnecte-toi et réessaie.";
  }
  if (!raw) return "Enregistrement impossible";
  return raw;
}

function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("boutique");

  const shopQuery = useQuery({
    queryKey: ["my-shop"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const shop = shopQuery.data ?? null;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold text-foreground">
              I<span className="text-primary">plus</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {shop?.slug && (
              <Link
                to="/boutique/$slug"
                params={{ slug: shop.slug }}
                className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium sm:flex"
              >
                <ExternalLink className="h-4 w-4" />
                Voir ma boutique
              </Link>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {shop ? shop.name : "Crée ta boutique pour commencer à vendre."}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              ["boutique", "Ma boutique", Store],
              ["produits", "Produits", Package],
              ["commandes", "Commandes", ClipboardList],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                tab === key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {shopQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : tab === "boutique" ? (
            <ShopForm shop={shop} onSaved={() => shopQuery.refetch()} />
          ) : !shop ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Crée d'abord ta boutique dans l'onglet « Ma boutique ».
            </div>
          ) : tab === "produits" ? (
            <ProductsPanel shopId={shop.id} />
          ) : (
            <OrdersPanel shopId={shop.id} />
          )}
        </div>
      </main>
    </div>
  );
}

type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  quartier: string | null;
  whatsapp: string;
  delivery_info: string | null;
  delivery_fee: number;
  logo_url: string | null;
  is_active: boolean;
};

function ShopForm({ shop, onSaved }: { shop: Shop | null; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    city: "",
    quartier: "",
    whatsapp: "",
    delivery_info: "",
    delivery_fee: 0,
    logo_url: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shop) return;
    setForm({
      name: shop.name,
      slug: shop.slug,
      description: shop.description ?? "",
      city: shop.city ?? "",
      quartier: shop.quartier ?? "",
      whatsapp: shop.whatsapp,
      delivery_info: shop.delivery_info ?? "",
      delivery_fee: shop.delivery_fee,
      logo_url: shop.logo_url ?? "",
      is_active: shop.is_active,
    });
  }, [shop]);

  async function save() {
    if (!form.name.trim() || !form.whatsapp.trim()) {
      toast.error("Nom de la boutique et numéro WhatsApp obligatoires");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        description: form.description.trim() || null,
        city: form.city.trim() || null,
        quartier: form.quartier.trim() || null,
        whatsapp: form.whatsapp.replace(/\s+/g, ""),
        delivery_info: form.delivery_info.trim() || null,
        delivery_fee: Number(form.delivery_fee) || 0,
        logo_url: form.logo_url.trim() || null,
        is_active: form.is_active,
      };

      if (shop) {
        const { error } = await supabase.from("shops").update(payload).eq("id", shop.id);
        if (error) throw error;
        toast.success("Boutique mise à jour");
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) throw new Error("Session expirée, reconnecte-toi.");
        const { error } = await supabase
          .from("shops")
          .insert({ ...payload, owner_id: userId });
        if (error) throw error;
        toast.success("Boutique créée !");
      }
      onSaved();
    } catch (error) {
      console.error(error);
      toast.error(shopErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-medium">Nom de la boutique *</span>
          <input
            className={`${inputClass} mt-1`}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Boutique Rami"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Lien (slug)</span>
          <input
            className={`${inputClass} mt-1`}
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="boutique-rami"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Numéro WhatsApp *</span>
          <input
            className={`${inputClass} mt-1`}
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            placeholder="+227 90 00 00 00"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Frais de livraison (FCFA)</span>
          <input
            type="number"
            min={0}
            className={`${inputClass} mt-1`}
            value={form.delivery_fee}
            onChange={(e) => setForm({ ...form, delivery_fee: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Ville</span>
          <input
            className={`${inputClass} mt-1`}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Niamey"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Quartier</span>
          <input
            className={`${inputClass} mt-1`}
            value={form.quartier}
            onChange={(e) => setForm({ ...form, quartier: e.target.value })}
            placeholder="Plateau"
          />
        </label>
        <ImageUploadField
          label="Logo de la boutique"
          folder="logos"
          value={form.logo_url}
          onChange={(url) => setForm({ ...form, logo_url: url })}
          className="sm:col-span-2"
        />
        <label className="text-sm sm:col-span-2">
          <span className="font-medium">Description</span>
          <textarea
            rows={3}
            className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Ce que tu vends, tes horaires..."
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="font-medium">Infos livraison</span>
          <textarea
            rows={2}
            className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary"
            value={form.delivery_info}
            onChange={(e) => setForm({ ...form, delivery_info: e.target.value })}
            placeholder="Livraison Niamey sous 24h, paiement à la livraison"
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        Boutique visible publiquement
      </label>

      <button
        onClick={save}
        disabled={saving}
        className="mt-6 h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {saving ? "Enregistrement..." : shop ? "Enregistrer" : "Créer ma boutique"}
      </button>
    </div>
  );
}

function ProductsPanel({ shopId }: { shopId: string }) {
  const productsQuery = useQuery({
    queryKey: ["my-products", shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [form, setForm] = useState({
    name: "",
    price: 0,
    stock: 0,
    category: "",
    description: "",
    image: "",
  });
  const [saving, setSaving] = useState(false);

  async function addProduct() {
    if (!form.name.trim()) {
      toast.error("Nom du produit obligatoire");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("products").insert({
        shop_id: shopId,
        name: form.name.trim(),
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        category: form.category.trim() || null,
        description: form.description.trim() || null,
        images: form.image.trim() ? [form.image.trim()] : [],
      });
      if (error) throw error;
      toast.success("Produit ajouté");
      setForm({ name: "", price: 0, stock: 0, category: "", description: "", image: "" });
      productsQuery.refetch();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Ajout impossible");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailable(id: string, value: boolean) {
    const { error } = await supabase
      .from("products")
      .update({ is_available: value })
      .eq("id", id);
    if (error) toast.error(error.message);
    else productsQuery.refetch();
  }

  async function removeProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Produit supprimé");
      productsQuery.refetch();
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold text-foreground">Ajouter un produit</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <input
            className={inputClass}
            placeholder="Nom du produit *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Catégorie (ex: Vêtements)"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <input
            className={inputClass}
            type="number"
            min={0}
            placeholder="Prix FCFA"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
          <input
            className={inputClass}
            type="number"
            min={0}
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
          />
          <input
            className={`${inputClass} sm:col-span-2`}
            placeholder="Image (URL)"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />
          <textarea
            rows={2}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary sm:col-span-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <button
          onClick={addProduct}
          disabled={saving}
          className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {saving ? "Ajout..." : "Ajouter"}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold text-foreground">
          Mes produits ({productsQuery.data?.length ?? 0})
        </h2>
        {productsQuery.isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Chargement...</p>
        ) : !productsQuery.data?.length ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucun produit pour le moment.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {productsQuery.data.map((product) => (
              <li key={product.id} className="flex flex-wrap items-center gap-3 py-3">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-12 w-12 rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </span>
                )}
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-semibold text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fcfa(product.price)} · stock {product.stock}
                    {product.category ? ` · ${product.category}` : ""}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={product.is_available}
                    onChange={(e) => toggleAvailable(product.id, e.target.checked)}
                  />
                  Disponible
                </label>
                <button
                  onClick={() => removeProduct(product.id)}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary"
                  aria-label={`Supprimer ${product.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OrdersPanel({ shopId }: { shopId: string }) {
  const ordersQuery = useQuery({
    queryKey: ["my-orders", shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function advance(id: string, status: string) {
    const next = nextStatus(status);
    if (!next) return;
    const { error } = await supabase
      .from("orders")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Commande → ${ORDER_STATUS_LABELS[next]}`);
      ordersQuery.refetch();
    }
  }

  if (ordersQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }

  if (!ordersQuery.data?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Aucune commande reçue pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ordersQuery.data.map((order) => {
        const next = nextStatus(order.status);
        return (
          <div key={order.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="font-display text-base font-bold text-foreground">
                  {order.order_number}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </span>
              <span className="ml-auto font-display text-base font-bold text-primary">
                {fcfa(order.total)}
              </span>
            </div>

            <div className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
              <p>
                Client : <span className="text-foreground">{order.customer_name}</span>
              </p>
              <p>
                Téléphone :{" "}
                <a className="text-foreground underline" href={`tel:${order.customer_phone}`}>
                  {order.customer_phone}
                </a>
              </p>
              <p>
                Mode :{" "}
                <span className="text-foreground">
                  {order.delivery_method === "retrait" ? "Retrait sur place" : "Livraison"}
                </span>
              </p>
              <p>
                Adresse :{" "}
                <span className="text-foreground">
                  {[order.quartier, order.address].filter(Boolean).join(" — ") || "—"}
                </span>
              </p>
            </div>

            <ul className="mt-3 space-y-1 text-sm">
              {(order.order_items ?? []).map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span className="text-foreground">
                    {item.quantity} × {item.product_name}
                  </span>
                  <span className="text-muted-foreground">
                    {fcfa(item.unit_price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              {next && (
                <button
                  onClick={() => advance(order.id, order.status)}
                  className="h-10 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
                >
                  Passer à « {ORDER_STATUS_LABELS[next]} »
                </button>
              )}
              <a
                href={`https://wa.me/${order.customer_phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                Contacter sur WhatsApp
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
