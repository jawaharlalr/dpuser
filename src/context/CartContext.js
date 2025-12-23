import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase'; 
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- NEW STATE FOR DISCOUNTS ---
  const [discount, setDiscount] = useState({ code: '', percent: 0 });

  // --- HELPER: Merge Arrays (Local Guest Cart + Database Cart) ---
  const mergeCarts = (localItems, dbItems) => {
    const merged = [...dbItems];
    localItems.forEach(localItem => {
      const existingIndex = merged.findIndex(dbItem => dbItem.id === localItem.id);
      if (existingIndex > -1) {
        merged[existingIndex].qty += localItem.qty;
      } else {
        merged.push(localItem);
      }
    });
    return merged;
  };

  // --- 1. HANDLE SYNC & AUTH CHANGES ---
  useEffect(() => {
    let unsubscribe;

    const syncCart = async () => {
      if (!user) {
        const savedCart = localStorage.getItem('guestCart');
        setCart(savedCart ? JSON.parse(savedCart) : []);
        setLoading(false);
        return;
      }

      const cartRef = doc(db, 'carts', user.uid);
      const localCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      
      if (localCart.length > 0) {
        try {
          const docSnap = await getDoc(cartRef);
          const dbItems = docSnap.exists() ? docSnap.data().items : [];
          const finalItems = mergeCarts(localCart, dbItems);
          await setDoc(cartRef, { items: finalItems }, { merge: true });
          localStorage.removeItem('guestCart');
          toast.success("Cart synced with your account!");
        } catch (error) {
          console.error("Error merging carts:", error);
        }
      }

      unsubscribe = onSnapshot(cartRef, (doc) => {
        if (doc.exists()) {
          setCart(doc.data().items || []);
        } else {
          setCart([]);
        }
        setLoading(false);
      });
    };

    syncCart();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user]);

  // --- 2. PERSIST TO LOCAL STORAGE (Only for Guests) ---
  useEffect(() => {
    if (!user) {
      localStorage.setItem('guestCart', JSON.stringify(cart));
    }
  }, [cart, user]);


  // --- ACTIONS ---

  const updateFirestore = async (newCart) => {
    if (user) {
        try {
            await setDoc(doc(db, 'carts', user.uid), { items: newCart }, { merge: true });
        } catch (error) {
            console.error("Firestore update failed:", error);
        }
    }
  };

  const addToCart = (product) => {
    const existingIndex = cart.findIndex(item => item.id === product.id);
    let newCart;
    if (existingIndex > -1) {
        newCart = [...cart];
        newCart[existingIndex] = { ...newCart[existingIndex], qty: (newCart[existingIndex].qty || 1) + 1 };
    } else {
        newCart = [...cart, { ...product, qty: 1 }];
    }
    setCart(newCart);
    updateFirestore(newCart);
    toast.success(`Added ${product.name}`);
  };

  const updateQty = (id, delta) => {
    const newCart = cart.map(item => {
        if (item.id === id) {
            return { ...item, qty: Math.max(1, (item.qty || 0) + delta) };
        }
        return item;
    });
    setCart(newCart);
    updateFirestore(newCart);
  };

  const removeFromCart = (id) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    updateFirestore(newCart);
  };

  const clearCart = () => {
      setCart([]);
      setDiscount({ code: '', percent: 0 }); // Reset discount on clear
      updateFirestore([]);
  };

  // --- NEW DISCOUNT ACTION ---
  const applyDiscount = (code, percent) => {
    setDiscount({ code, percent });
  };

  // --- CALCULATIONS ---
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const discountAmount = (subtotal * discount.percent) / 100;
  const total = subtotal - discountAmount;

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQty, 
      clearCart, 
      applyDiscount, // Provide the action
      subtotal,      // Original price
      discount,      // Active discount details { code, percent }
      discountAmount,// Value subtracted
      total,         // Final price
      loading 
    }}>
      {!loading && children}
    </CartContext.Provider>
  );
};