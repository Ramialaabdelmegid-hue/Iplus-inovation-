import { useRef, useState } from "react";
import { Loader2, Video, X } from "lucide-react";
import { toast } from "sonner";
import { MAX_VIDEO_MB, MAX_VIDEO_SECONDS, uploadVideo } from "@/lib/upload";

export function VideoUploadField({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadVideo(file);
      onChange(url);
      toast.success("Vidéo ajoutée");
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
        {value ? (
          <div className="relative">
            <video
              src={value}
              controls
              preload="metadata"
              className="h-32 w-56 rounded-lg border border-border bg-secondary object-cover"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Retirer la vidéo"
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-md bg-destructive text-destructive-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex h-32 w-56 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/50 text-muted-foreground">
            <Video className="h-6 w-6" />
          </div>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
          {busy ? "Envoi..." : value ? "Changer la vidéo" : "Choisir une vidéo"}
        </button>
      </div>
      <p className="mt-1.5 text-xs font-normal text-muted-foreground">
        Depuis ton téléphone ou ton ordinateur — {MAX_VIDEO_SECONDS} secondes et {MAX_VIDEO_MB} Mo
        maximum.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
