import { createFileRoute } from "@tanstack/react-router";
import { fetchActiveShopSlugs } from "@/lib/shop-seo";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const shops = await fetchActiveShopSlugs();
        const staticPaths = ["/", "/auth", "/panier"];
        const urls = [
          ...staticPaths.map((p) => `  <url><loc>${origin}${p}</loc></url>`),
          ...shops.map(
            (s) =>
              `  <url><loc>${origin}/boutique/${encodeURIComponent(s.slug)}</loc>${
                s.updated_at ? `<lastmod>${new Date(s.updated_at).toISOString()}</lastmod>` : ""
              }</url>`,
          ),
        ].join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
