import { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const CartContext = createContext(null);

/** Cart state persisted in localStorage, scoped per store slug. */
export function CartProvider({ children }) {
  const { slug } = useParams();
  const key = `storepilot-cart:${slug}`;
  const [items, setItems] = useState([]);

  // Load cart for this store.
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(key)) || []);
    } catch {
      setItems([]);
    }
  }, [key]);

  // Persist on change.
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(items));
  }, [key, items]);

  const add = (product, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.product === product._id);
      const inCart = found?.quantity || 0;
      const capped = Math.min(inCart + qty, product.stock);
      if (found) {
        return prev.map((i) => (i.product === product._id ? { ...i, quantity: capped } : i));
      }
      return [
        ...prev,
        {
          product: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          quantity: Math.min(qty, product.stock),
        },
      ];
    });
  };

  const setQty = (productId, qty) =>
    setItems((prev) =>
      prev
        .map((i) => (i.product === productId ? { ...i, quantity: Math.max(0, Math.min(qty, i.stock)) } : i))
        .filter((i) => i.quantity > 0)
    );

  const remove = (productId) => setItems((prev) => prev.filter((i) => i.product !== productId));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
