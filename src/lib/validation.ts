import { z } from "zod";

/** Numéro local Niger ou international : 8 à 15 chiffres. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^0-9+]/g, ""))
  .refine((v) => /^\+?[0-9]{8,15}$/.test(v), {
    message: "Numéro invalide. Ex : 90 00 00 00 ou +227 90 00 00 00.",
  });

export const customerOrderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "Indique ton nom complet (3 caractères minimum)." })
    .max(80, { message: "Nom trop long (80 caractères maximum)." })
    .regex(/^[^<>{}$]*$/, { message: "Le nom contient des caractères non autorisés." }),
  phone: phoneSchema,
  quartier: z.string().trim().max(80, { message: "Quartier trop long." }),
  address: z.string().trim().max(300, { message: "Adresse trop longue (300 caractères max)." }),
  method: z.enum(["livraison", "retrait"]),
  honeypot: z.string().max(0, { message: "Commande refusée." }),
});

export const shopSignupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, { message: "Indique ton nom complet." })
    .max(80, { message: "Nom trop long." }),
  email: z.string().trim().email({ message: "Adresse email invalide." }).max(255),
  password: z.string().min(8, { message: "Mot de passe de 8 caractères minimum." }).max(72),
  shopName: z
    .string()
    .trim()
    .min(2, { message: "Nom de boutique trop court." })
    .max(60, { message: "Nom de boutique trop long." }),
  whatsapp: phoneSchema,
  city: z.string().trim().max(60).optional(),
});

/** Anti-spam simple : limite le nombre de commandes par navigateur. */
const RATE_KEY = "sahelstar_order_rate_v1";
const COOLDOWN_MS = 45_000;
const MAX_PER_HOUR = 6;

export function checkOrderRate(): { ok: boolean; message?: string } {
  if (typeof window === "undefined") return { ok: true };
  try {
    const now = Date.now();
    const raw = window.localStorage.getItem(RATE_KEY);
    const stamps: number[] = raw ? (JSON.parse(raw) as number[]) : [];
    const recent = stamps.filter((t) => now - t < 3_600_000);
    const last = recent[recent.length - 1];
    if (last && now - last < COOLDOWN_MS) {
      return {
        ok: false,
        message: "Patiente quelques secondes avant d'envoyer une nouvelle commande.",
      };
    }
    if (recent.length >= MAX_PER_HOUR) {
      return {
        ok: false,
        message: "Trop de commandes envoyées depuis cet appareil. Réessaie dans une heure.",
      };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export function recordOrderSent() {
  if (typeof window === "undefined") return;
  try {
    const now = Date.now();
    const raw = window.localStorage.getItem(RATE_KEY);
    const stamps: number[] = raw ? (JSON.parse(raw) as number[]) : [];
    const recent = stamps.filter((t) => now - t < 3_600_000);
    recent.push(now);
    window.localStorage.setItem(RATE_KEY, JSON.stringify(recent));
  } catch {
    /* ignore */
  }
}
