ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colors text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS color text;

CREATE OR REPLACE FUNCTION public.enforce_order_item_variant()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE p public.products;
BEGIN
  SELECT * INTO p FROM public.products WHERE id = NEW.product_id;
  IF p.id IS NULL THEN RETURN NEW; END IF;
  IF cardinality(p.sizes) > 0 AND (NEW.size IS NULL OR NOT (NEW.size = ANY(p.sizes))) THEN
    RAISE EXCEPTION 'Choisis une taille pour « % »', p.name;
  END IF;
  IF cardinality(p.sizes) = 0 THEN NEW.size := NULL; END IF;
  IF cardinality(p.colors) > 0 AND (NEW.color IS NULL OR NOT (NEW.color = ANY(p.colors))) THEN
    RAISE EXCEPTION 'Choisis une couleur pour « % »', p.name;
  END IF;
  IF cardinality(p.colors) = 0 THEN NEW.color := NULL; END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS order_items_variant ON public.order_items;
CREATE TRIGGER order_items_variant BEFORE INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_item_variant();