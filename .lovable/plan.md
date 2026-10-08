# Boutons Instagram, Snapchat et TikTok sur chaque boutique

## Ce que ça change
- **Tableau de bord, « Ma boutique »** : trois nouveaux champs facultatifs, Instagram, Snapchat et TikTok. Le commerçant tape juste son pseudo (ex. aicha_mode).
- **Page boutique** : à côté du bouton vert WhatsApp, des boutons ronds aux couleurs officielles (Instagram, Snapchat jaune, TikTok noir). Chacun ouvre directement le profil dans l'application.
- Un bouton n'apparaît que si le pseudo est rempli.

## Détails techniques
- Migration : colonnes `instagram`, `snapchat`, `tiktok` (text, nullable) sur `shops`, avec une contrainte de longueur (max 40).
- Nettoyage du pseudo à l'enregistrement : on retire « @ », les espaces et un éventuel lien collé.
- Liens : `instagram.com/{p}`, `snapchat.com/add/{p}`, `tiktok.com/@{p}`.
- Fichiers : `tableau-de-bord.tsx` (formulaire), `boutique.$slug.tsx` (requête et boutons), `validation.ts`.
