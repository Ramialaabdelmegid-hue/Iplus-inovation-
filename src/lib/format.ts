export function fcfa(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount || 0)) + " FCFA";
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export const ORDER_STATUSES = [
  "nouvelle",
  "confirmee",
  "en_preparation",
  "en_livraison",
  "livree",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  nouvelle: "Nouvelle",
  confirmee: "Confirmée",
  en_preparation: "En préparation",
  en_livraison: "En livraison",
  livree: "Livrée",
};

export function nextStatus(status: string): OrderStatus | null {
  const index = ORDER_STATUSES.indexOf(status as OrderStatus);
  if (index < 0 || index === ORDER_STATUSES.length - 1) return null;
  return ORDER_STATUSES[index + 1] ?? null;
}
