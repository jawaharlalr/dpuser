import React, { useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Minus, 
  Plus, 
  ArrowRight, 
  ShoppingBag,
  Flame,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Cart = () => {
  const { cart, removeFromCart, updateQty, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_settings", "delivery_config"), (snap) => {
      // Delivery config logic
    });
    return () => unsub();
  }, []);

  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
  };

  // Helper for the standard Rupee symbol style
  const Rupee = () => <span style={{ fontFamily: 'sans-serif', marginRight: '1px' }}>₹</span>;

  const handleClearCart = () => {
    if(window.confirm("Clear your entire cart?")) {
      clearCart();
      toast.error("Cart cleared");
    }
  };

  const handleProceedToCheckout = () => {
    if (!user) {
        toast.error("Please login to proceed");
        navigate("/login");
        return;
    }
    if (cart.length === 0) return;
    navigate("/checkout");
  };

  const handleRemove = (id) => {
    removeFromCart(id);
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-brand-dark">
        <div className="flex flex-col items-center w-full max-w-md p-10 text-center border bg-brand-surface rounded-2xl border-white/5">
           <div className="flex items-center justify-center w-20 h-20 mb-6 border rounded-full bg-brand-dark border-white/10">
              <ShoppingBag className="w-8 h-8 text-brand-orange" />
           </div>
           <h2 className="mb-2 text-xl font-semibold tracking-tight text-white uppercase">Your Cart is Empty</h2>
           <p className="mb-8 text-xs font-medium tracking-widest text-gray-400 uppercase">Time to add some delicious snacks!</p>
           <button onClick={() => navigate('/menu')} className="px-8 py-3 text-xs font-semibold tracking-widest text-white uppercase transition-transform rounded-full shadow-lg bg-brand-orange active:scale-95">Browse Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 pt-20 pb-32 font-sans bg-brand-dark md:pb-12 md:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* HEADER */}
        <div className="flex flex-col gap-4 mb-8 text-left md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center text-2xl italic font-bold tracking-tight text-white uppercase">
              <Flame className="mr-2 text-brand-orange" size={24} /> 
              My Cart
            </h1>
            <div className="flex items-center gap-3 mt-1 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              <span>{cart.length} Items</span>
              <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
              <span>{totalQty} Units</span>
            </div>
          </div>
          <button onClick={handleClearCart} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold text-red-400 uppercase transition-all border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white">
            <XCircle size={14} /> Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          <div className="space-y-4 lg:col-span-2">
            {/* CART ITEMS */}
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col p-4 border bg-brand-surface rounded-2xl border-white/5">
                  <div className="flex gap-4">
                    <div className="relative flex-shrink-0 w-20 h-20 overflow-hidden border rounded-xl bg-brand-dark border-white/10">
                      <img src={item.imageUrl || "https://placehold.co/100x100?text=Snack"} alt={item.name} className="object-cover w-full h-full" />
                      <div className="absolute top-1.5 right-1.5">
                        <VegIndicator type={item.type} />
                      </div>
                    </div>

                    <div className="flex flex-col flex-1">
                      <div className="flex items-start justify-between">
                        <div className="text-left">
                            <h3 className="text-sm font-semibold leading-tight tracking-tight text-white uppercase">{item.name}</h3>
                            <span className="inline-block px-2 py-0.5 mt-1.5 text-[9px] font-medium text-brand-orange bg-brand-orange/5 border border-brand-orange/10 rounded uppercase">
                                {item.selectedWeight}
                            </span>
                        </div>
                        <button onClick={() => handleRemove(item.id)} className="p-1 text-gray-500 transition-colors hover:text-red-500"><Trash2 size={16} /></button>
                      </div>

                      <div className="flex items-end justify-between mt-auto">
                          <div className="flex flex-col text-left">
                             <span className="text-[9px] font-medium text-gray-500 uppercase"><Rupee />{formatCurrency(item.price)} / unit</span>
                             <span className="text-lg font-bold text-brand-yellow"><Rupee />{formatCurrency(item.price * item.qty)}</span>
                          </div>
                          <div className="flex items-center h-8 overflow-hidden border rounded-lg bg-brand-dark border-white/10">
                              <button onClick={() => updateQty(item.id, -1)} className="px-3 text-gray-400 transition-colors hover:text-white"><Minus size={12} /></button>
                              <span className="px-1 text-xs font-semibold text-white min-w-[28px] text-center">{item.qty}</span>
                              <button onClick={() => updateQty(item.id, 1)} className="px-3 text-gray-400 transition-colors hover:text-white"><Plus size={12} /></button>
                          </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* BILL DETAILS */}
          <div className="text-left lg:col-span-1">
              <div className="sticky p-6 border shadow-xl bg-brand-surface rounded-[2rem] border-white/5 top-24">
                  <h3 className="flex items-center justify-between pb-3 mb-5 text-base italic font-bold tracking-tight text-white uppercase border-b border-white/5">
                    Summary
                    <ShoppingBag size={16} className="text-brand-orange" />
                  </h3>
                  
                  <div className="mb-6 space-y-3 text-[10px] font-medium tracking-widest uppercase">
                    <div className="flex justify-between text-gray-400">
                      <span>Item Total</span>
                      <span className="text-white"><Rupee />{formatCurrency(total)}</span>
                    </div>

                    <div className="flex justify-between text-gray-400">
                      <span>Delivery Fee</span>
                      <span className="text-green-500 font-semibold px-1.5 py-0.5 rounded tracking-tighter bg-green-500/5 border border-green-500/10">FREE</span>
                    </div>
                  </div>

                  {/* FINAL PAYABLE BOX */}
                  <div className="p-4 mb-6 border bg-black/40 rounded-2xl border-white/5">
                    <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest block mb-1">To Pay</span>
                    <div className="flex items-center text-3xl italic font-bold tracking-tighter uppercase text-brand-yellow">
                        <span className="mr-2 text-lg not-italic font-medium"><Rupee /></span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleProceedToCheckout}
                    className="flex items-center justify-center w-full gap-2 py-4 text-[11px] font-bold text-white uppercase tracking-widest transition-all shadow-lg bg-gradient-to-r from-brand-red to-brand-orange rounded-xl hover:brightness-110 active:scale-95"
                  >
                    Proceed to Checkout <ArrowRight size={14} />
                  </button>
                  
                  <p className="mt-4 text-[8px] text-center text-gray-500 uppercase tracking-widest opacity-60">
                    Trusted & Encrypted Checkout
                  </p>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const VegIndicator = ({ type }) => {
  const isVeg = type?.toLowerCase() === 'veg';
  const color = isVeg ? '#16a34a' : '#dc2626'; 
  return (
    <div className="flex items-center justify-center w-3.5 h-3.5 bg-white rounded shadow-sm p-[1px]">
       <div className="flex items-center justify-center w-full h-full border border-current" style={{ color }}>
        <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
      </div>
    </div>
  );
};

export default Cart;