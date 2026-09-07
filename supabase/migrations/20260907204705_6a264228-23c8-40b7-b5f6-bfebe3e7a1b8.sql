ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS opening_hours text;

CREATE TABLE public.shop_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX shop_reviews_shop_id_idx ON public.shop_reviews (shop_id);

GRANT SELECT, INSERT ON public.shop_reviews TO anon;
GRANT SELECT, INSERT, DELETE ON public.shop_reviews TO authenticated;
GRANT ALL ON public.shop_reviews TO service_role;

ALTER TABLE public.shop_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can view reviews of active shops"
  ON public.shop_reviews FOR SELECT
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_reviews.shop_id AND s.is_active = true));

CREATE POLICY "anyone can leave a review"
  ON public.shop_reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_reviews.shop_id AND s.is_active = true)
    AND rating BETWEEN 1 AND 5
    AND char_length(customer_name) BETWEEN 2 AND 60
    AND (comment IS NULL OR char_length(comment) <= 500)
  );

CREATE POLICY "shop owner can delete reviews of own shop"
  ON public.shop_reviews FOR DELETE
  TO authenticated
  USING (public.owns_shop(shop_id));

CREATE TRIGGER shop_reviews_updated_at
  BEFORE UPDATE ON public.shop_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.decrement_stock_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'confirmee' AND OLD.status <> 'confirmee' THEN
    UPDATE public.products p
    SET stock = GREATEST(p.stock - oi.quantity, 0)
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_decrement_stock
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_confirm();
