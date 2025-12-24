import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
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

  // --- CALCULATIONS ---
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

  // --- HELPER: FORMAT CURRENCY ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
  };

  const handleClearCart = () => {
    if(window.confirm("Are you sure you want to clear your entire cart?")) {
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
    
    // Navigate without discount state as offers are removed
    navigate("/checkout");
  };

  const handleRemove = (id) => {
    if(window.confirm("Remove this item?")) {
      removeFromCart(id);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-brand-dark">
        <div className="flex flex-col items-center w-full max-w-md p-10 text-center border bg-brand-surface rounded-2xl border-brand-red/10">
           <div className="flex items-center justify-center w-24 h-24 mb-6 border rounded-full bg-brand-dark border-brand-red/20">
              <ShoppingBag className="w-10 h-10 text-brand-orange" />
           </div>
           <h2 className="mb-2 text-2xl font-normal tracking-tight text-white uppercase">Your Plate is Empty</h2>
           <p className="mb-8 text-xs font-normal tracking-widest text-gray-400 uppercase">Add some spicy snacks to get started!</p>
           <button onClick={() => navigate('/menu')} className="px-10 py-3.5 font-normal text-xs uppercase tracking-widest text-white rounded-full bg-brand-orange shadow-lg active:scale-95 transition-transform">Browse Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-20 pb-32 font-sans bg-brand-dark md:pb-12 md:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* HEADER */}
        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center text-2xl italic font-normal tracking-tighter text-white uppercase">
              <Flame className="mr-2 text-brand-orange" fill="currentColor" /> 
              My Cart
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs font-normal tracking-widest text-gray-500 uppercase">
              <span>{cart.length} Variety</span>
              <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
              <span>{totalQty} Total Units</span>
            </div>
          </div>
          <button onClick={handleClearCart} className="flex items-center gap-2 px-4 py-2 text-xs font-normal text-red-500 uppercase transition-all border border-red-500/20 rounded-xl bg-red-500/5 hover:bg-red-600 hover:text-white">
            <XCircle size={16} /> Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          <div className="space-y-4 lg:col-span-2">
            {/* CART ITEMS */}
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col p-4 border bg-brand-surface rounded-2xl border-white/5">
                  <div className="flex gap-5">
                    <div className="relative flex-shrink-0 w-20 h-20 overflow-hidden border rounded-xl bg-brand-dark border-white/5">
                      <img src={item.imageUrl || "https://placehold.co/100x100?text=Snack"} alt={item.name} className="object-cover w-full h-full" />
                      <div className="absolute top-1 right-1">
                        <VegIndicator type={item.type} />
                      </div>
                    </div>

                    <div className="flex flex-col flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-sm font-normal tracking-tight text-white uppercase">{item.name}</h3>
                            <span className="inline-block px-2 py-0.5 mt-1 text-[9px] font-normal text-gray-500 bg-brand-dark rounded border border-white/5 uppercase tracking-widest">
                                {item.selectedWeight || 'Std'}
                            </span>
                        </div>
                        <button onClick={() => handleRemove(item.id)} className="p-1 text-gray-600 transition-colors hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                      <div className="flex items-end justify-between mt-auto">
                          <div className="flex flex-col text-xs font-normal tracking-wide">
                             <span className="text-[10px] text-gray-600 uppercase mb-0.5">₹ {formatCurrency(item.price)}</span>
                             <span className="text-white">₹ {formatCurrency(item.price * item.qty)}</span>
                          </div>
                          <div className="flex items-center h-8 overflow-hidden border rounded-lg bg-brand-dark border-white/5">
                              <button onClick={() => updateQty(item.id, -1)} className="px-3 text-gray-500 transition-colors hover:text-white"><Minus size={12}/></button>
                              <span className="px-2 text-xs font-normal text-white border-x border-white/5 min-w-[32px] text-center">{item.qty}</span>
                              <button onClick={() => updateQty(item.id, 1)} className="px-3 text-gray-500 transition-colors hover:text-white"><Plus size={12}/></button>
                          </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* BILL DETAILS */}
          <div className="lg:col-span-1">
              <div className="sticky p-6 border shadow-2xl bg-brand-surface rounded-[32px] border-white/5 top-24">
                  <h3 className="pb-4 mb-6 text-lg italic font-normal tracking-tighter text-white uppercase border-b border-white/5">Summary</h3>
                  
                  <div className="mb-6 space-y-4 text-xs font-normal tracking-widest uppercase">
                    <div className="flex justify-between text-gray-500">
                      <span>Item Total ({totalQty} units)</span>
                      <span className="text-white">₹ {formatCurrency(total)}</span>
                    </div>

                    <div className="flex justify-between text-gray-500">
                      <span>Taxes & Delivery</span>
                      <span className="text-green-500 font-normal text-[10px] bg-green-500/10 px-2 py-0.5 rounded tracking-tighter">FREE</span>
                    </div>
                  </div>

                  {/* FINAL PAYABLE BOX */}
                  <div className="p-5 mb-8 border bg-black/60 rounded-[24px] border-white/5">
                    <div className="flex items-center justify-between mb-2 tracking-widest uppercase">
                        <span className="text-[10px] font-normal text-gray-600">Subtotal</span>
                    </div>
                    <div className="flex items-center text-3xl italic font-normal tracking-tighter uppercase text-brand-yellow">
                        <span className="mr-3 text-xl not-italic font-normal text-brand-yellow">₹</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleProceedToCheckout}
                    className="flex items-center justify-center w-full py-4 font-normal text-xs text-white uppercase tracking-[0.2em] transition-all shadow-xl bg-gradient-to-r from-brand-red to-brand-orange rounded-2xl hover:brightness-110 active:scale-95"
                  >
                    Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                  
                  <p className="mt-6 text-[9px] text-center text-gray-600 uppercase font-normal tracking-[0.2em] opacity-50">
                    Secure 256-bit SSL Checkout
                  </p>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Helper Component ---
const VegIndicator = ({ type }) => {
  const isVeg = type && type.toLowerCase() === 'veg';
  const color = isVeg ? '#16a34a' : '#dc2626'; 
  return (
    <div className="flex items-center justify-center w-3 h-3 bg-white rounded-sm shadow-sm p-[1px]">
       <div className="w-full h-full border-[1.5px] border-current flex items-center justify-center" style={{ color: color }}>
        <div className="w-1 h-1 bg-current rounded-full"></div>
      </div>
    </div>
  );
};

export default Cart;