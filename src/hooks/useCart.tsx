import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";

const CART_STORAGE_KEY = "7s_cart_items_v1";

export interface CartItem {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  image: string;
  quantity: number;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  clearCart: () => void;
  totalItems: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  updateNotes: () => {},
  clearCart: () => {},
  totalItems: 0,
  isOpen: false,
  setIsOpen: () => {},
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Hidrata do localStorage para sobreviver ao redirect do checkout / refresh
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(CART_STORAGE_KEY) : null;
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (i): i is CartItem =>
            i && typeof i.id === "string" && typeof i.name === "string" && typeof i.quantity === "number",
        );
      }
    } catch {
      /* localStorage indisponível ou JSON inválido */
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);

  // Persiste itens em toda alteração (debounce simples via microtask)
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    try {
      if (items.length === 0) localStorage.removeItem(CART_STORAGE_KEY);
      else localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignora quota */
    }
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, notes: notes.slice(0, 280) } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, updateNotes, clearCart, totalItems, isOpen, setIsOpen }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
