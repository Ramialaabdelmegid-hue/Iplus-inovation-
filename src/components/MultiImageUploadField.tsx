import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/upload";

const MAX_IMAGES = 5;

export function MultiImageUploadField({
  label,
  values,
  folder,
  onChange,
  className = "",
}: {
  label: string;
  values: string[];
  folder: "logos" | "produits";
  onChange: (urls: string[]) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_IMAGES - values.length;
    if (room <= 0) {
      toast.error(`${MAX_IMAGES} photos maximum par produit`);
      return;
    }
    setBusy(true);
    try {
      const chosen = Array.from(files).slice(0, room);
      const urls: string[] = [];
      for (const file of chosen) urls.push(await uploadImage(file, folder));
      onChange([...values, ...urls]);
      toast.success(urls.length > 1 ? `${urls.length} photos ajoutées` : "Photo ajoutée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={`text-sm ${className}`}>
      <span className="font-medium">{label}</span>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        {values.map((url, index) => (
          <div key={url} className="relative">
            <img
              src={url}
              alt={`${label} ${index + 1}`}
              className="h-20 w-20 rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((v) => v !== url))}
              aria-label="Retirer cette photo"
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-md bg-destructive text-destructive-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {index === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-foreground/70 px-1.5 text-[10px] font-semibold text-background">
                Principale
              </span>
            )}
          </div>
        ))}
        {values.length < MAX_IMAGES && (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-secondary/50 text-xs text-muted-foreground disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                Ajouter
              </>
            )}
          </button>
        )}
      </div>
      <p className="mt-1 text-xs font-normal text-muted-foreground">
        Jusqu'à {MAX_IMAGES} photos — la première est celle affichée dans la liste.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
    </div>
  );
}
