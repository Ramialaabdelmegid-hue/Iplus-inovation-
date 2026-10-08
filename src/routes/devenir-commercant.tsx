import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/devenir-commercant")({
  beforeLoad: () => { throw redirect({ to: "/", replace: true }); },
  head: () => ({ meta: [{ title: "Catalogue — Arha Market" }, { name: "description", content: "Découvrez le catalogue Arha Market." }, { property: "og:title", content: "Catalogue — Arha Market" }, { property: "og:description", content: "Mode, accessoires et produits du quotidien." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
});
