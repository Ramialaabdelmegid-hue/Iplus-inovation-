ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text;

COMMENT ON COLUMN public.products.brand IS 'Marque de l article, affichee en petit au-dessus du nom';

CREATE OR REPLACE FUNCTION public.enforce_order_item()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  p public.products;
  o_shop uuid;
  already integer;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity < 1 OR NEW.quantity > 50 THEN
    RAISE EXCEPTION 'Quantité invalide';
  END IF;

  SELECT shop_id INTO o_shop FROM public.orders WHERE id = NEW.order_id;
  IF o_shop IS NULL THEN
    RAISE EXCEPTION 'Commande introuvable';
  END IF;

  SELECT * INTO p FROM public.products WHERE id = NEW.product_id FOR UPDATE;
  IF p.id IS NULL THEN
    RAISE EXCEPTION 'Produit introuvable';
  END IF;
  IF p.shop_id <> o_shop THEN
    RAISE EXCEPTION 'Produit d''une autre boutique';
  END IF;
  IF p.is_available = false THEN
    RAISE EXCEPTION 'Produit indisponible : %', p.name;
  END IF;

  IF NEW.unit_price IS NOT NULL AND NEW.unit_price <> p.price THEN
    RAISE EXCEPTION 'Le prix de « % » a changé, actualise la page', p.name;
  END IF;
  NEW.unit_price := p.price;
  NEW.product_name := CASE
    WHEN coalesce(trim(p.brand), '') = '' THEN p.name
    ELSE p.name || ' ' || trim(p.brand)
  END;

  SELECT COALESCE(SUM(oi.quantity), 0) INTO already
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.product_id = NEW.product_id
    AND o.status NOT IN ('annulee', 'confirmee', 'livree');

  IF p.stock > 0 AND NEW.quantity + already > p.stock THEN
    RAISE EXCEPTION 'Stock insuffisant pour « % » : % restant(s)', p.name, GREATEST(p.stock - already, 0);
  END IF;

  RETURN NEW;
END;
$function$;