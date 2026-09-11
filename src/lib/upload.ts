import { supabase } from "@/integrations/supabase/client";

const BUCKET = "boutique-medias";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export const MAX_VIDEO_MB = 30;
export const MAX_VIDEO_SECONDS = 60;

async function uploadFile(file: File, folder: string) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Session expirée, reconnecte-toi.");

  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("Envoi impossible. Réessaie.");

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, TEN_YEARS);
  if (signError || !data?.signedUrl) {
    throw new Error("Fichier envoyé mais lien introuvable. Réessaie.");
  }
  return data.signedUrl;
}

/** Envoie une image dans le stockage et renvoie une URL affichable. */
export async function uploadImage(file: File, folder: "logos" | "produits") {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choisis une image (JPG, PNG...).");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image trop lourde : 10 Mo maximum.");
  }
  return uploadFile(file, folder);
}

/** Lit la durée d'une vidéo choisie, en secondes. */
function readVideoDuration(file: File) {
  return new Promise<number | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onloadedmetadata = () =>
      done(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => done(null);
    video.src = url;
  });
}

/** Envoie une courte vidéo de démonstration et renvoie une URL lisible. */
export async function uploadVideo(file: File) {
  if (!file.type.startsWith("video/")) {
    throw new Error("Choisis une vidéo (MP4, MOV...).");
  }
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
    throw new Error(`Vidéo trop lourde : ${MAX_VIDEO_MB} Mo maximum.`);
  }
  const duration = await readVideoDuration(file);
  if (duration !== null && duration > MAX_VIDEO_SECONDS + 1) {
    throw new Error(
      `Vidéo trop longue : ${MAX_VIDEO_SECONDS} secondes maximum (la tienne fait ${Math.round(duration)} s).`,
    );
  }
  return uploadFile(file, "videos");
}
