import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/lib/cart";
import { fcfa } from "@/lib/format";
import { buildWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";
import { customerOrderSchema, checkOrderRate, recordOrderSent } from "@/lib/validation";

export const Route = createFileRoute("/panier")({
  head: () => ({
    meta: [
      { title: "Mon panier — Sahel Star" },
      {
        name: "description",
        content:
          "Vérifiez votre panier, renseignez votre quartier et envoyez votre commande sur WhatsApp. Paiement à la livraison.",
      },
      { property: "og:title", content: "Mon panier — Sahel Star" },
      {
        property: "og:description",
        content: "Commandez en quelques secondes et payez à la livraison avec Sahel Star.",
      },
    ],
  }),
  component: CartPage,
});

function orderNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `IP-${stamp}-${rand}`;
}

function CartPage() {
  const { cart, subtotal, setQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [quartier, setQuartier] = useState("");
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState<"livraison" | "retrait">("livraison");
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);

  const shopQuery = useQuery({
    queryKey: ["cart-shop", cart.shopId],
    enabled: Boolean(cart.shopId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, slug, whatsapp, delivery_fee, delivery_info, quartier, city")
        .eq("id", cart.shopId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const shop = shopQuery.data;
  const deliveryFee = method === "livraison" ? Number(shop?.delivery_fee ?? 0) : 0;
  const total = subtotal + deliveryFee;

  async function submit() {
    if (!shop || !cart.shopId) return;

    const parsed = customerOrderSchema.safeParse({
      name,
      phone,
      quartier,
      address,
      method,
      honeypot,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Informations invalides");
      return;
    }
    const values = parsed.data;
    if (values.method === "livraison" && values.quartier.length < 2) {
      toast.error("Indique ton quartier pour la livraison");
      return;
    }
    if (cart.items.length === 0 || cart.items.length > 40) {
      toast.error("Panier invalide.");
      return;
    }
    if (cart.items.some((i) => i.quantity < 1 || i.quantity > 50)) {
      toast.error("Quantité invalide (50 maximum par produit).");
      return;
    }

    const rate = checkOrderRate();
    if (!rate.ok) {
      toast.error(rate.message ?? "Trop de tentatives.");
      return;
    }

    setSending(true);
    try {
      const number = orderNumber();
      const orderId = crypto.randomUUID();
      const { error } = await supabase.from("orders").insert({
        id: orderId,
        shop_id: cart.shopId,
        order_number: number,
        customer_name: values.name,
        customer_phone: values.phone,
        quartier: values.quartier || null,
        address: values.address || null,
        delivery_method: values.method,
        subtotal,
        delivery_fee: deliveryFee,
        total,
      });
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        cart.items.map((item) => ({
          order_id: orderId,
          product_id: item.productId,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      );
      if (itemsError) throw itemsError;

      recordOrderSent();

      const message = buildWhatsAppMessage({
        orderNumber: number,
        shopName: shop.name,
        customerName: values.name,
        phone: values.phone,
        quartier: values.quartier,
        address: values.address,
        deliveryMethod: values.method === "livraison" ? "Livraison" : "Retrait en boutique",
        items: cart.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        subtotal,
        deliveryFee,
        total,
      });

      window.open(whatsappLink(shop.whatsapp, message), "_blank", "noopener");
      clear();
      toast.success("Commande envoyée sur WhatsApp !");
      navigate({ to: "/boutique/$slug", params: { slug: shop.slug } });
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'envoyer la commande. Réessaie.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Mon panier</h1>

        {cart.items.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center">
            <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium text-foreground">Ton panier est vide</p>
            <Link
              to="/"
              className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Voir les boutiques
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Boutique : <span className="font-semibold text-foreground">{cart.shopName}</span>
              </p>
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{fcfa(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      aria-label="Diminuer"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      aria-label="Augmenter"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="Retirer"
                      onClick={() => removeItem(item.productId)}
                      className="ml-1 flex h-8 w-8 items-center justify-center rounded-md text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <aside className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-display text-lg font-bold text-foreground">Mes informations</h2>
              <div className="mt-4 space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom complet"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Téléphone (ex : 90 00 00 00)"
                  inputMode="tel"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                />
                <div className="grid grid-cols-2 gap-2">
                  {(["livraison", "retrait"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setMethod(option)}
                      className={`h-10 rounded-xl border text-sm font-medium transition-colors ${
                        method === option
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground"
                      }`}
                    >
                      {option === "livraison" ? "Livraison" : "Retrait"}
                    </button>
                  ))}
                </div>
                {method === "livraison" && (
                  <>
                    <input
                      value={quartier}
                      onChange={(e) => setQuartier(e.target.value)}
                      placeholder="Quartier"
                      className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                    />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Repère / adresse (facultatif)"
                      rows={2}
                      className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary"
                    />
                  </>
                )}
              </div>

              <dl className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Sous-total</dt>
                  <dd className="font-medium text-foreground">{fcfa(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Livraison</dt>
                  <dd className="font-medium text-foreground">{fcfa(deliveryFee)}</dd>
                </div>
                <div className="flex justify-between text-base">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd className="font-bold text-primary">{fcfa(total)}</dd>
                </div>
              </dl>

              <button
                onClick={submit}
                disabled={sending || !shop}
                className="mt-4 h-12 w-full rounded-xl bg-accent text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {sending ? "Envoi..." : "Commander sur WhatsApp"}
              </button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Paiement à la livraison. Aucun compte nécessaire.
              </p>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
