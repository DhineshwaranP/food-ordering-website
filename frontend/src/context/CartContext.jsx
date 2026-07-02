import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const STORAGE_KEY = 'canteen_cart';

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    if (!user) { setItems([]); localStorage.removeItem(STORAGE_KEY); }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (menuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem === menuItem._id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem === menuItem._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, image: menuItem.image, quantity: 1 }];
    });
  };

  const removeItem = (menuItemId) => {
    setItems((prev) => prev.filter((i) => i.menuItem !== menuItemId));
  };

  const updateQuantity = (menuItemId, quantity) => {
    if (quantity < 1) { removeItem(menuItemId); return; }
    setItems((prev) =>
      prev.map((i) => (i.menuItem === menuItemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getItemQuantity = (menuItemId) => {
    const item = items.find((i) => i.menuItem === menuItemId);
    return item ? item.quantity : 0;
  };

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalAmount = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, getItemQuantity, totalItems, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
