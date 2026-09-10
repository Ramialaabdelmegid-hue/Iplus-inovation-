-- 1. Champ vidéo produit
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url text;

-- 2. Nouveau préfixe de commande
ALTER TABLE public.orders
  ALTER COLUMN order_number SET DEFAULT ('SS-' || upper(substr(replace((gen_random_uuid())::text, '-', ''), 1, 6)));

-- 3. Frais de livraison et montants initiaux fixés par le serveur
CREATE OR REPLACE FUNCTION public.enforce_order_amounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.shops;
BEGIN
  SELECT * INTO s FROM public.shops WHERE id = NEW.shop_id AND is_active = true;
  IF s.id IS NULL THEN
    RAISE EXCEPTION 'Boutique indisponible';
  END IF;

  IF NEW.delivery_method NOT IN ('livraison', 'retrait') THEN
    RAISE EXCEPTION 'Mode de livraison invalide';
  END IF;

  NEW.delivery_fee := CASE WHEN NEW.delivery_method = 'livraison' THEN s.delivery_fee ELSE 0 END;
  NEW.subtotal := 0;
  NEW.total := NEW.delivery_fee;
  NEW.status := 'nouvelle';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_enforce_amounts ON public.orders;
CREATE TRIGGER orders_enforce_amounts
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_amounts();

-- 4. Vérification du prix, du produit et du stock à l'insertion d'une ligne
CREATE OR REPLACE FUNCTION public.enforce_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- prix et nom authoritatifs
  IF NEW.unit_price IS NOT NULL AND NEW.unit_price <> p.price THEN
    RAISE EXCEPTION 'Le prix de « % » a changé, actualise la page', p.name;
  END IF;
  NEW.unit_price := p.price;
  NEW.product_name := p.name;

  -- stock disponible (réservations déjà en cours sur commandes non annulées)
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
$$;

DROP TRIGGER IF EXISTS order_items_enforce ON public.order_items;
CREATE TRIGGER order_items_enforce
  BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_item();

-- 5. Recalcul du sous-total et du total après ajout d'une ligne
CREATE OR REPLACE FUNCTION public.recompute_order_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub integer;
BEGIN
  SELECT COALESCE(SUM(unit_price * quantity), 0) INTO sub
  FROM public.order_items WHERE order_id = NEW.order_id;

  UPDATE public.orders
  SET subtotal = sub,
      total = sub + delivery_fee
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_items_recompute ON public.order_items;
CREATE TRIGGER order_items_recompute
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.recompute_order_totals();

REVOKE ALL ON FUNCTION public.enforce_order_amounts() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_order_item() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_order_totals() FROM public, anon, authenticated;