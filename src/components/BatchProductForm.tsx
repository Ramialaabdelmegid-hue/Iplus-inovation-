import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/upload";

const inputClass =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary";

export function BatchProductForm({ shopId, onDone }: { shopId: string; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState<number | null>(null);

  async function createAll() {
    const priceNum = Number(price);
    if (!name.trim()) { toast.error("Nom de base obligatoire"); return; }
    if (!priceNum || priceNum <= 0) { toast.error("Indique ton prix en FCFA"); return; }
    if (files.length === 0) { toast.error("Choisis au moins une photo"); return; }
    setProgress(0);
    try {
      const rows = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i]!, "produits");
        rows.push({
          shop_id: shopId,
          name: files.length > 1 ? `${name.trim()} #${i + 1}` : name.trim(),
          price: priceNum,
          stock: Number(stock) || 0,
          category: category.trim() || null,
          description: description.trim() || null,
          images: [url],
          is_available: true,
        });
        setProgress(i + 1);
      }
      const { error } = await supabase.from("products").insert(rows);
      if (error) throw error;
      toast.success(`${rows.length} produits créés`);
      setFiles([]);
      setName("");
      setDescription("");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Création impossible");
    } finally {
      setProgress(null);
    }
  }

  const busy = progress !== null;

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input className={inputClass} placeholder="Nom de base * (ex: Robe Wax)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input className={inputClass} type="number" min={0} placeholder="Ton prix FCFA *" value={price} onChange={(e) => setPrice(e.target.value)} />
        <input className={inputClass} type="number" min={0} placeholder="Stock par article" value={stock} onChange={(e) => setStock(e.target.value)} />
      </div>
      <textarea
        rows={2}
        className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary"
        placeholder="Description commune (optionnelle)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => (
          <div key={i} className="relative">
            <img src={URL.createObjectURL(f)} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
            <button
              type="button"
              aria-label="Retirer"
              onClick={() => setFiles(files.filter((_, j) => j !== i))}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-md bg-destructive text-destructive-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold"
        >
          <ImagePlus className="h-4 w-4" /> Choisir des photos
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Chaque photo devient un produit avec ton prix et tes infos.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          setFiles([...files, ...Array.from(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={createAll}
        className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? `Envoi ${progress}/${files.length}...` : `Créer tous les produits (${files.length})`}
      </button>
    </div>
  );
}
