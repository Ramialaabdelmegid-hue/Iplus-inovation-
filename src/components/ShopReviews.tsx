import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`flex items-center gap-0.5 ${className}`} aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= value ? "fill-accent text-accent" : "text-muted-foreground"}`}
        />
      ))}
    </span>
  );
}

export function ShopReviews({ shopId }: { shopId: string }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const reviewsQuery = useQuery({
    queryKey: ["shop-reviews", shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_reviews")
        .select("id, customer_name, rating, comment, created_at")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  const reviews = reviewsQuery.data ?? [];
  const average =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  async function submit() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Indique ton prénom (2 caractères minimum).");
      return;
    }
    if (comment.trim().length > 500) {
      toast.error("Ton avis est trop long (500 caractères maximum).");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("shop_reviews").insert({
        shop_id: shopId,
        customer_name: trimmed.slice(0, 60),
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
      toast.success("Merci pour ton avis !");
      setName("");
      setComment("");
      setRating(5);
      reviewsQuery.refetch();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer ton avis pour le moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-bold text-foreground">Avis des clients</h2>
        {average !== null && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Stars value={Math.round(average)} />
            {average}/5 · {reviews.length} avis
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">Laisse ton avis</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tu as commandé dans cette boutique ? Dis aux autres clients comment ça s'est passé.
          </p>
          <div className="mt-4 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`Note ${n} sur 5`}
                className="p-0.5"
              >
                <Star
                  className={`h-6 w-6 ${
                    n <= rating ? "fill-accent text-accent" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ton prénom"
            maxLength={60}
            className="mt-4 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ton commentaire (optionnel)"
            className="mt-3 w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={submit}
            disabled={sending}
            className="mt-3 h-11 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {sending ? "Envoi..." : "Publier mon avis"}
          </button>
        </div>

        <div>
          {reviewsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des avis...</p>
          ) : reviews.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              Aucun avis pour le moment. Sois le premier à en laisser un.
            </p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{review.customer_name}</p>
                    <Stars value={review.rating} />
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
