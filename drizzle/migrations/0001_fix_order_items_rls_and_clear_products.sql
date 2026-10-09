CREATE OR REPLACE FUNCTION public.order_is_open(_order_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS(SELECT 1 FROM public.orders o JOIN public.shops s ON s.id=o.shop_id
  WHERE o.id=_order_id AND s.is_active AND o.status='nouvelle' AND o.created_at > now() - interval '10 minutes') $$;

DROP POLICY IF EXISTS "anyone can add items to an order" ON public.order_items;
CREATE POLICY "anyone can add items to an order" ON public.order_items
FOR INSERT TO anon, authenticated WITH CHECK (public.order_is_open(order_id));

UPDATE public.order_items SET product_id = NULL WHERE product_id IS NOT NULL;
DELETE FROM public.products WHERE id IS NOT NULL;
DELETE FROM public.orders o WHERE NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = o.id);