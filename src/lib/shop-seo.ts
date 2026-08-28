const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] as string;
const SUPABASE_KEY = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;

export type ShopSeo = {
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  quartier: string | null;
  logo_url: string | null;
};

async function restGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, accept: "application/json" },
  });
  if (!res.ok) return null;
  return (await res.json()) as unknown;
}

export async function fetchShopSeo(slug: string): Promise<ShopSeo | null> {
  const rows = (await restGet(
    `shops?select=name,slug,description,city,quartier,logo_url&slug=eq.${encodeURIComponent(slug)}&is_active=is.true&limit=1`,
  )) as ShopSeo[] | null;
  return rows?.[0] ?? null;
}

export async function fetchActiveShopSlugs(): Promise<{ slug: string; updated_at?: string }[]> {
  const rows = (await restGet(
    "shops?select=slug,updated_at&is_active=is.true&order=updated_at.desc&limit=5000",
  )) as { slug: string; updated_at?: string }[] | null;
  return rows ?? [];
}
