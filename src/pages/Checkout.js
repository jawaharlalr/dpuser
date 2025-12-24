import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  MapPin,
  Truck,
  Store,
  Wallet,
  ShieldCheck,
  ShoppingBag,
  CheckCircle,
  ClipboardList,
  Home,
  Phone,
  Ticket,
  Loader2,
  Lock,
  Plus,
  AlertCircle,
  CheckCircle2,
  ChevronDown
} from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, total, clearCart } = useCart();
  const { user, userProfile } = useAuth(); 

  // --- STATE ---
  const [dbOffers, setDbOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [appliedCode, setAppliedCode] = useState("");
  const [deliveryType, setDeliveryType] = useState("home");
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pickupPhone, setPickupPhone] = useState(""); 
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedOrderDetails, setConfirmedOrderDetails] = useState(null);
  const [showItems, setShowItems] = useState(true);

  // --- CALCULATIONS ---
  const discountAmount = (total * discountPercent) / 100;
  const finalPayable = Math.round(total - discountAmount);
  const isMinOrderMet = total >= 99;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
  };

  useEffect(() => {
    if (!showSuccessModal && cart.length === 0) {
      navigate("/menu");
    }
  }, [cart, navigate, showSuccessModal]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, "app_settings", "home_screen"));
        if (settingsSnap.exists()) {
          setDbOffers(settingsSnap.data().offers || []);
        }
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoadingOffers(false);
      }
    };
    fetchOffers();
  }, []);

  useEffect(() => {
    if (appliedCode) {
        const currentOffer = dbOffers.find(o => o.title === appliedCode);
        if (currentOffer && total < (Number(currentOffer.minAmount) || 0)) {
            setAppliedCode("");
            setDiscountPercent(0);
            toast.error("Coupon removed: Total below requirement");
        }
    }
  }, [total, appliedCode, dbOffers]);

  const applyOffer = (offer) => {
    const minReq = Number(offer.minAmount) || 0;
    if (total < minReq) {
      toast.error(`Add ₹${minReq - total} more to use this coupon!`);
      return;
    }
    setDiscountPercent(parseInt(offer.discount) || 0);
    setAppliedCode(offer.title);
    toast.success(`Coupon "${offer.title}" applied!`);
  };

  const handlePlaceOrder = async () => {
    if (!user) return toast.error("Please login first");

    if (deliveryType === "home" && !isMinOrderMet) {
      return toast.error("Minimum ₹99 required for Home Delivery");
    }

    let finalShippingAddress = deliveryType === "home" 
      ? (userProfile?.addresses?.[selectedAddressIndex] || null)
      : "Store Pickup";
    
    if (deliveryType === "home" && !finalShippingAddress) {
        return toast.error("Please select or add a delivery address");
    }

    let orderPhone = deliveryType === "home" 
      ? (finalShippingAddress.phone || userProfile?.phone || "")
      : pickupPhone;

    if (deliveryType === "store" && (!pickupPhone || pickupPhone.length < 10)) {
        return toast.error("Valid 10-digit phone required for pickup");
    }

    setLoading(true);

    try {
      const year = new Date().getFullYear(); 
      const orderId = `DP${year}-${orderPhone.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

      // --- ATOMIC TRANSACTION FOR STOCK REDUCTION & ORDER CREATION ---
      
      await runTransaction(db, async (transaction) => {
        const updates = [];

        // PHASE 1: READ & VALIDATE STOCK
        for (const item of cart) {
          const productRef = doc(db, "products", item.productId);
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists()) throw new Error(`${item.name} is no longer available.`);
          
          const productData = productSnap.data();
          const variants = productData.variants || [];
          
          // Find the matching variant index
          const vIndex = variants.findIndex(v => 
            `${v.weight}${v.unit}` === item.selectedWeight.replace(/\s/g, '')
          );

          if (vIndex === -1) throw new Error(`Size for ${item.name} not found.`);

          const currentStock = Number(variants[vIndex].stock || 0);
          if (currentStock < item.qty) {
            throw new Error(`Insufficient stock for ${item.name}. Only ${currentStock} left.`);
          }

          // Prepare updated variants array for this specific product
          const updatedVariants = [...variants];
          updatedVariants[vIndex] = {
            ...updatedVariants[vIndex],
            stock: currentStock - item.qty
          };

          updates.push({ ref: productRef, updatedVariants });
        }

        // PHASE 2: WRITE UPDATES
        updates.forEach(upd => {
          transaction.update(upd.ref, { variants: upd.updatedVariants });
        });

        const orderData = {
          orderId,
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "User",
          userEmail: user.email,
          phone: orderPhone,
          items: cart,
          subtotal: total,
          discountAmount,
          appliedCode,
          totalAmount: finalPayable, 
          deliveryMethod: deliveryType === "home" ? "Home Delivery" : "Store Pickup",
          shippingAddress: finalShippingAddress, 
          paymentMethod: deliveryType === "home" ? "COD" : "Pay at Store",
          status: "Placed",
          createdAt: new Date().toISOString(),
          serverTimestamp: serverTimestamp(),
        };

        const newOrderRef = doc(db, "orders", orderId);
        transaction.set(newOrderRef, orderData);
      });

      clearCart();
      setConfirmedOrderDetails({ id: orderId, name: userProfile?.name || user.displayName || "User" });
      setShowSuccessModal(true);

    } catch (error) {
      console.error("Checkout Error:", error);
      toast.error(error.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen px-4 pt-20 pb-32 font-sans text-left bg-brand-dark md:pb-12 md:px-8">
      
      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0, y: 20 }} className="relative z-10 w-full max-w-md p-8 text-center border shadow-2xl rounded-2xl bg-brand-surface border-brand-orange/30">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 border-2 rounded-full bg-green-500/10 border-green-500/50">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="mb-2 text-3xl italic font-normal tracking-tighter text-white uppercase">Order Placed!</h2>
              <div className="p-4 mb-8 border bg-brand-dark rounded-xl border-brand-red/20">
                <p className="text-xl font-normal tracking-wide text-brand-yellow">{confirmedOrderDetails?.id}</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => navigate("/orders")} className="flex items-center justify-center w-full py-3.5 text-xs font-normal uppercase tracking-widest bg-brand-orange text-white rounded-xl">
                  <ClipboardList className="w-4 h-4 mr-2" /> View My Orders
                </button>
                <button onClick={() => navigate("/")} className="flex items-center justify-center w-full py-3.5 text-xs font-normal uppercase tracking-widest border text-gray-300 bg-brand-dark rounded-xl border-brand-red/20">
                  <Home className="w-4 h-4 mr-2" /> Back to Home
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={`max-w-6xl mx-auto transition-all ${showSuccessModal ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
        <h1 className="flex items-center gap-2 mb-8 text-3xl italic font-normal tracking-tighter text-white uppercase">
            <Wallet className="text-brand-orange"/> Checkout
        </h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            
            {/* ORDER ITEMS SUMMARY */}
            <div className="overflow-hidden border bg-brand-surface rounded-2xl border-brand-red/20">
              <button onClick={() => setShowItems(!showItems)} className="flex items-center justify-between w-full p-6 text-left">
                <h3 className="flex items-center text-lg font-normal tracking-wider text-white uppercase">
                  <ShoppingBag className="w-5 h-5 mr-2 text-brand-orange" /> Order Summary
                </h3>
                <ChevronDown className={`text-gray-500 transition-transform ${showItems ? 'rotate-180' : ''}`} size={20} />
              </button>
              <AnimatePresence>
                {showItems && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 space-y-3 overflow-hidden">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-3 border-t border-white/5">
                        <div className="flex items-center gap-4 text-left">
                          <img src={item.imageUrl} alt="" className="object-cover w-10 h-10 rounded-lg bg-brand-dark" />
                          <div className="text-xs uppercase">
                            <p className="font-medium text-white">{item.name}</p>
                            <p className="text-[10px] text-gray-500">{item.selectedWeight} • ₹{item.price} x {item.qty}</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-white">₹{formatCurrency(item.price * item.qty)}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* DELIVERY METHOD */}
            <div className="p-6 border bg-brand-surface rounded-2xl border-brand-red/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center text-lg font-normal tracking-wider text-white uppercase"><Truck className="w-5 h-5 mr-2 text-brand-orange" /> Delivery</h3>
                {!isMinOrderMet && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-brand-yellow uppercase tracking-widest bg-brand-yellow/10 px-2 py-1 rounded">
                    <AlertCircle size={10} /> Home Delivery: Min ₹99
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setDeliveryType("home")} className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${deliveryType === "home" ? "bg-brand-orange/10 border-brand-orange text-white" : "bg-brand-dark border-white/5 text-gray-500"}`}>
                  <Truck size={18} />
                  <span className="w-full text-xs font-bold text-left uppercase">Home Delivery</span>
                </button>
                <button onClick={() => setDeliveryType("store")} className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${deliveryType === "store" ? "bg-brand-orange/10 border-brand-orange text-white" : "bg-brand-dark border-white/5 text-gray-500"}`}>
                  <Store size={18} />
                  <span className="w-full text-xs font-bold text-left uppercase">Store Pickup</span>
                </button>
              </div>
            </div>

            {/* ADDRESS SECTION */}
            <div className="p-6 text-left border bg-brand-surface rounded-2xl border-brand-red/20">
              <h3 className="flex items-center mb-4 text-lg font-normal tracking-wider text-white uppercase"><MapPin className="w-5 h-5 mr-2 text-brand-orange" /> {deliveryType === "home" ? "Delivery Address" : "Pickup Details"}</h3>
              {deliveryType === "home" ? (
                <div className="space-y-3">
                  {userProfile?.addresses?.map((addr, index) => (
                    <div key={index} onClick={() => setSelectedAddressIndex(index)} className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${selectedAddressIndex === index ? 'bg-brand-orange/10 border-brand-orange' : 'bg-brand-dark border-brand-red/10'}`}>
                      <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAddressIndex === index ? 'border-brand-orange' : 'border-gray-500'}`}>{selectedAddressIndex === index && <div className="w-2 h-2 rounded-full bg-brand-orange" />}</div>
                      <div className="w-full text-left uppercase">
                        <span className="text-[10px] px-2 py-0.5 rounded border border-brand-orange text-brand-orange">{addr.type}</span>
                        <p className="mt-2 text-sm text-white">{addr.line1}</p>
                        <p className="text-[11px] text-gray-400">{addr.city}, {addr.zip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 uppercase border bg-brand-dark rounded-xl border-brand-red/20">
                    <Store className="text-brand-yellow" size={24} />
                    <div className="text-left"><h4 className="text-sm font-bold text-white uppercase">DP Evening Snacks</h4><p className="text-[10px] text-gray-500">Pallikaranai, Chennai</p></div>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-brand-orange" size={18} />
                    <input type="tel" placeholder="Enter 10 digit number" value={pickupPhone} onChange={(e) => setPickupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full py-3 pl-12 pr-4 text-xs text-white border outline-none bg-brand-surface border-white/5 rounded-xl focus:border-brand-orange" />
                  </div>
                </div>
              )}
            </div>

            {/* COUPONS */}
            <div className="p-6 border bg-brand-surface rounded-2xl border-brand-red/20">
              <h3 className="flex items-center mb-6 text-lg font-normal tracking-wider text-white uppercase"><Ticket className="w-5 h-5 mr-2 text-brand-orange" /> Coupons</h3>
              <div className="flex gap-4 pb-2 overflow-x-auto scrollbar-hide">
                {loadingOffers ? <Loader2 className="animate-spin text-brand-orange" /> : dbOffers.map((offer, idx) => {
                  const minAmt = Number(offer.minAmount) || 0;
                  const isLocked = total < minAmt;
                  const isActive = appliedCode === offer.title;
                  return (
                    <button key={idx} onClick={() => applyOffer(offer)} disabled={isLocked && appliedCode !== offer.title} className={`flex-shrink-0 p-5 text-left border rounded-[2rem] transition-all w-56 ${isActive ? 'border-brand-orange bg-brand-orange/10 shadow-xl' : isLocked ? 'opacity-60 grayscale border-white/5' : 'bg-brand-dark border-white/10'}`}>
                      <div className="flex justify-between mb-3">
                        <div className={`p-2 rounded-xl ${isActive ? 'bg-brand-orange text-white' : 'bg-white/5 text-gray-500'}`}><Ticket size={18} /></div>
                        {isActive ? <CheckCircle2 className="text-brand-orange" size={20} /> : isLocked && <Lock className="text-gray-600" size={16} />}
                      </div>
                      <h4 className="text-[10px] font-black text-white uppercase mb-1">{offer.title}</h4>
                      <p className="text-xl italic font-black uppercase text-brand-yellow">{offer.discount}</p>
                      
                      {/* Professional Progress Bar */}
                      <div className="pt-4 mt-4 border-t border-white/5">
                        <div className="flex justify-between text-[8px] font-bold uppercase text-white mb-2">
                          <span>{isLocked ? 'Requirement' : 'Unlocked'}</span>
                          <span>₹{total} / ₹{minAmt}</span>
                        </div>
                        <div className="w-full h-1 overflow-hidden rounded-full bg-white/5">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${Math.min((total/minAmt)*100, 100)}%` }} 
                            className={`h-full ${isLocked ? 'bg-gray-600' : 'bg-brand-orange shadow-[0_0_8px_rgba(255,145,0,0.5)]'}`} 
                          />
                        </div>
                        {isLocked && <p className="text-[8px] text-brand-orange font-bold mt-2 uppercase flex items-center gap-1"><Plus size={10} /> Add ₹{minAmt - total} more</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BILL SUMMARY */}
          <div className="text-left lg:col-span-1">
            <div className="sticky p-6 border shadow-2xl bg-brand-surface rounded-2xl border-brand-red/20 top-24">
              <h3 className="pb-2 mb-4 text-lg italic text-white uppercase border-b border-white/5">Summary</h3>
              <div className="mb-6 space-y-3 text-[11px] font-normal uppercase text-gray-400 tracking-widest">
                <div className="flex justify-between"><span>Subtotal</span><span className="text-white">₹ {formatCurrency(total)}</span></div>
                {discountPercent > 0 && <div className="flex justify-between font-bold text-green-500"><span>Coupon Applied</span><span>- ₹ {formatCurrency(discountAmount)}</span></div>}
                <div className="flex justify-between"><span>Delivery</span><span className="font-bold text-green-400">FREE</span></div>
                
                {deliveryType === "home" && !isMinOrderMet && (
                  <div className="flex items-start gap-2 p-3 border border-brand-yellow/30 bg-brand-yellow/5 rounded-xl">
                    <AlertCircle size={14} className="text-brand-yellow shrink-0 mt-0.5" />
                    <p className="text-[9px] text-brand-yellow font-bold leading-tight uppercase">Min ₹99 required for Home Delivery. Switch to Pickup to proceed.</p>
                  </div>
                )}
              </div>

              <div className="p-5 mb-8 border bg-black/60 rounded-2xl border-white/5">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Grand Total</p>
                <div className="flex items-center text-3xl italic font-bold tracking-tighter text-brand-yellow">
                    <span className="mr-3 text-xl font-normal text-brand-yellow">₹</span>
                    <span>{formatCurrency(finalPayable)}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder} 
                disabled={loading || (deliveryType === "home" && !isMinOrderMet)}
                className={`w-full py-4 font-bold text-xs uppercase tracking-[0.2em] shadow-xl rounded-xl transition-all flex items-center justify-center 
                  ${(deliveryType === "home" && !isMinOrderMet) ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-brand-red to-brand-orange text-white active:scale-95 hover:brightness-110"}`}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Confirm Order"}
              </button>
              
              <div className="flex justify-center gap-2 mt-6 text-[9px] uppercase text-gray-600 tracking-widest"><ShieldCheck size={14} /> Secure Checkout</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;