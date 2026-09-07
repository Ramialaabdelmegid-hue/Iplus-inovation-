import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareShopButton({
  slug,
  name,
  className = "",
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/boutique/${slug}`
      : `/boutique/${slug}`;
  const message = `Découvre ma boutique ${name} sur Sahel Star : ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible, sélectionne le lien manuellement");
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
      >
        {copied ? <Check className="h-4 w-4 text-accent" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Lien copié" : "Copier le lien"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
      >
        <Share2 className="h-4 w-4" />
        Partager sur WhatsApp
      </a>
    </div>
  );
}
