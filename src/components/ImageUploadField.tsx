import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/upload";

export function ImageUploadField({
  label,
  value,
  folder,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  folder: "logos" | "produits";
  onChange: (url: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
      toast.success("Image ajoutée");
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
      <div className="mt-1 flex items-center gap-3">
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt={label}
              className="h-20 w-20 rounded-xl border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Retirer l'image"
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-md bg-destructive text-destructive-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/50 text-muted-foreground">
            <ImagePlus className="h-6 w-6" />
          </div>
        )}
        <div>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {busy ? "Envoi..." : value ? "Changer la photo" : "Choisir une photo"}
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            Depuis ton téléphone ou ton ordinateur — 10 Mo max.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
