import { queryOptions } from "@tanstack/react-query";

export const STORE_ID = "57fddf6b-ac15-4803-946e-c61b72519a64";
export const STORE_NAME = "Arha Market";

export type Store = {
  id: string; name: string; slug: string; whatsapp: string;
  description: string | null; logo_url: string | null; city: string | null;
  quartier: string | null; opening_hours: string | null;
  delivery_fee: number; delivery_info: string | null;
};
export type StoreProduct = {
  id: string; name: string; price: number; category: string | null;
  description: string | null; images: string[]; stock: number;
  is_available: boolean; video_url: string | null;
  sizes: string[]; colors: string[];
};

async function publicRead<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env['VITE_SUPABASE_URL']}/rest/v1/${path}`, {
    headers: { apikey: import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'], Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Le catalogue est momentanément indisponible.");
  return response.json() as Promise<T>;
}

export const storeQueryOptions = queryOptions({
  queryKey: ["arha-store"],
  queryFn: async () => {
    const [shops, products] = await Promise.all([
      publicRead<Store[]>(`shops?select=id,name,slug,whatsapp,description,logo_url,city,quartier,opening_hours,delivery_fee,delivery_info&id=eq.${STORE_ID}&is_active=is.true&limit=1`),
      publicRead<StoreProduct[]>(`products?select=id,name,price,category,description,images,stock,is_available,video_url,sizes,colors&shop_id=eq.${STORE_ID}&order=created_at.desc`),
    ]);
    return { shop: shops[0] ?? null, products };
  },
  staleTime: 30_000,
});