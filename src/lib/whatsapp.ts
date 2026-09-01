import { fcfa } from "./format";

export type WhatsAppOrder = {
  orderNumber: string;
  shopName: string;
  customerName: string;
  phone: string;
  quartier: string;
  address: string;
  deliveryMethod: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

export function buildWhatsAppMessage(order: WhatsAppOrder): string {
  const lines: string[] = [];
  lines.push(`*Nouvelle commande Sahel Star*`);
  lines.push(`Boutique : ${order.shopName}`);
  lines.push(`Commande n° ${order.orderNumber}`);
  lines.push("");
  lines.push(`Client : ${order.customerName}`);
  lines.push(`Téléphone : ${order.phone}`);
  if (order.quartier) lines.push(`Quartier : ${order.quartier}`);
  if (order.address) lines.push(`Adresse : ${order.address}`);
  lines.push(`Mode : ${order.deliveryMethod}`);
  lines.push("");
  lines.push("*Produits*");
  for (const item of order.items) {
    lines.push(`- ${item.name} x${item.quantity} = ${fcfa(item.price * item.quantity)}`);
  }
  lines.push("");
  lines.push(`Sous-total : ${fcfa(order.subtotal)}`);
  lines.push(`Livraison : ${fcfa(order.deliveryFee)}`);
  lines.push(`*Total : ${fcfa(order.total)}*`);
  lines.push("");
  lines.push("Paiement à la livraison.");
  return lines.join("\n");
}

export function whatsappLink(phone: string, message: string): string {
  const clean = (phone || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
