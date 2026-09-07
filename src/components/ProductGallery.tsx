import { useState } from "react";
import { ChevronLeft, ChevronRight, Store } from "lucide-react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const list = images?.filter(Boolean) ?? [];

  if (list.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-secondary text-muted-foreground">
        <Store className="h-8 w-8" />
      </div>
    );
  }

  const current = list[Math.min(index, list.length - 1)];

  return (
    <div className="relative aspect-square overflow-hidden bg-secondary">
      <img src={current} alt={name} className="h-full w-full object-cover" loading="lazy" />
      {list.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Photo précédente"
            onClick={() => setIndex((i) => (i - 1 + list.length) % list.length)}
            className="absolute left-1 top-1/2 -translate-y-1/2 rounded-md bg-background/85 p-1 text-foreground shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Photo suivante"
            onClick={() => setIndex((i) => (i + 1) % list.length)}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-background/85 p-1 text-foreground shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1.5">
            {list.map((url, i) => (
              <button
                key={url}
                type="button"
                aria-label={`Photo ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === Math.min(index, list.length - 1) ? "bg-primary" : "bg-background/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
