import { supabase } from "@/integrations/supabase/client";

const BUCKET = "boutique-medias";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Envoie une image dans le stockage et renvoie une URL affichable. */
export async function uploadImage(file: File, folder: "logos" | "produits") {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choisis une image (JPG, PNG...).");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image trop lourde : 10 Mo maximum.");
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Session expirée, reconnecte-toi.");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("Envoi de l'image impossible. Réessaie.");

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, TEN_YEARS);
  if (signError || !data?.signedUrl) {
    throw new Error("Image envoyée mais lien introuvable. Réessaie.");
  }
  return data.signedUrl;
}
