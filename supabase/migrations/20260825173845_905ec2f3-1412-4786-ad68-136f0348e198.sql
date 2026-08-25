REVOKE ALL ON FUNCTION public.owns_shop(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_shop(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.owns_shop(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM authenticated;