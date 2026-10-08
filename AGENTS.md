<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep one canonical store ID in `src/lib/store.ts`; preserve existing catalogue and order relations instead of deleting marketplace data.
- Enforce exclusive administration through protected `public.user_roles` and database RLS, not client-side identity constants; public registration is disabled.
- Public catalogue reads use publishable-key REST query options so SSR and client navigation share the same public-only data shape.
- Use the supplied logo through its asset pointer and a resized local favicon; shared branding belongs in BrandLogo.
