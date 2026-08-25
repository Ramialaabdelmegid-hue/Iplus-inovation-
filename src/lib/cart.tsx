import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
};

export type CartState = {
  shopId: string | null;
  shopSlug: string | null;
  shopName: string | null;
  items: CartItem[];
};

const EMPTY: CartState = { shopId: null, shopSlug: null, shopName: null, items: [] };
const STORAGE_KEY = "paz_shop_cart_v1";

type CartContextValue = {
  cart: CartState;
  count: number;
  subtotal: number;
  addItem: (
    shop: { id: string; slug: string; name: string },
    item: Omit<CartItem, "quantity">,
    quantity?: number,
  ) => { replaced: boolean };
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(EMPTY);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setCart({ ...EMPTY, ...(JSON.parse(raw) as CartState) });
    } catch {
      /* ignore corrupted cart */
    }
  }, []);

  const persist = useCallback((next: CartState) => {
    setCart(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const addItem = useCallback<CartContextValue["addItem"]>(
    (shop, item, quantity = 1) => {
      let replaced = false;
      setCart((current) => {
        let base = current;
        if (current.shopId && current.shopId !== shop.id) {
          base = EMPTY;
          replaced = true;
        }
        const existing = base.items.find((i) => i.productId === item.productId);
        const items = existing
          ? base.items.map((i) =>
              i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
            )
          : [...base.items, { ...item, quantity }];
        const next: CartState = {
          shopId: shop.id,
          shopSlug: shop.slug,
          shopName: shop.name,
          items,
        };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* storage unavailable */
        }
        return next;
      });
      return { replaced };
    },
    [],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      setCart((current) => {
        const items = current.items
          .map((i) => (i.productId === productId ? { ...i, quantity } : i))
          .filter((i) => i.quantity > 0);
        const next = items.length ? { ...current, items } : EMPTY;
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* storage unavailable */
        }
        return next;
      });
    },
    [],
  );

  const removeItem = useCallback((productId: string) => setQuantity(productId, 0), [setQuantity]);
  const clear = useCallback(() => persist(EMPTY), [persist]);

  const value = useMemo<CartContextValue>(() => {
    const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { cart, count, subtotal, addItem, setQuantity, removeItem, clear };
  }, [cart, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart doit être utilisé dans CartProvider");
  return context;
}
