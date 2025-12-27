import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, onSnapshot, serverTimestamp, runTransaction } from "firebase/firestore";
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
  Phone,
  Ticket,
  Loader2,
  Lock,
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
  const [deliveryConfig, setDeliveryConfig] = useState({ minOrderAmount: 0 });
  const [loadingConfig, setLoadingConfig] = useState(true);
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
  
  const isMinOrderMet = total >= (deliveryConfig.minOrderAmount || 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
  };

  // Helper for the standard Rupee symbol style
  const Rupee = () => <span style={{ fontFamily: 'sans-serif', marginRight: '1px' }}>₹</span>;

  useEffect(() => {
    if (!showSuccessModal && cart.length === 0) {
      navigate("/menu");
    }
  }, [cart, navigate, showSuccessModal]);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "app_settings", "delivery_config"), (snap) => {
      if (snap.exists()) {
        setDeliveryConfig(snap.data());
      }
      setLoadingConfig(false);
    });

    const fetchOffers = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, "app_settings", "home_screen"));
        if (settingsSnap.exists()) {
          setDbOffers(settingsSnap.data().offers || []);
        }
      } catch (error) {
        console.error("Error fetching offers:", error);
      }
    };

    fetchOffers();
    return () => unsubConfig();
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
    toast.success(`Coupon applied!`);
  };

  const handlePlaceOrder = async () => {
    if (!user) return toast.error("Please login first");

    if (deliveryType === "home" && !isMinOrderMet) {
      return toast.error(`Minimum ₹${deliveryConfig.minOrderAmount} required for Delivery`);
    }

    let finalShippingAddress = deliveryType === "home" 
      ? (userProfile?.addresses?.[selectedAddressIndex] || null)
      : "Store Pickup";
    
    if (deliveryType === "home" && !finalShippingAddress) {
        return toast.error("Please select a delivery address");
    }

    let orderPhone = deliveryType === "home" 
      ? (finalShippingAddress.phone || userProfile?.phone || "")
      : pickupPhone;

    if (deliveryType === "store" && (!pickupPhone || pickupPhone.length < 10)) {
        return toast.error("Enter valid phone for pickup");
    }

    setLoading(true);

    try {
      const year = new Date().getFullYear(); 
      const orderId = `DP${year}-${orderPhone.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

      await runTransaction(db, async (transaction) => {
        const updates = [];

        for (const item of cart) {
          const productRef = doc(db, "products", item.productId);
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists()) throw new Error(`${item.name} not found.`);
          
          const productData = productSnap.data();
          const variants = productData.variants || [];
          
          const vIndex = variants.findIndex(v => 
            `${v.weight}${v.unit}` === item.selectedWeight.replace(/\s/g, '')
          );

          if (vIndex === -1) throw new Error(`Size for ${item.name} not found.`);

          const currentStock = Number(variants[vIndex].stock || 0);
          if (currentStock < item.qty) {
            throw new Error(`Insufficient stock for ${item.name}.`);
          }

          const updatedVariants = [...variants];
          updatedVariants[vIndex] = {
            ...updatedVariants[vIndex],
            stock: currentStock - item.qty
          };

          updates.push({ ref: productRef, updatedVariants });
        }

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
      setConfirmedOrderDetails({ id: orderId });
      setShowSuccessModal(true);

    } catch (error) {
      toast.error(error.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingConfig) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-100 bg-brand-dark">
        <Loader2 className="mb-4 animate-spin text-brand-orange" size={40} />
        <p className="text-xs tracking-widest uppercase">Connecting...</p>
    </div>
  );

  return (
    <div className="relative min-h-screen px-4 pt-20 pb-32 font-sans text-left text-gray-100 bg-brand-dark md:pb-12 md:px-8">
      
      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 w-full max-w-md p-8 text-center border shadow-2xl rounded-2xl bg-brand-surface border-brand-orange/30">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h2 className="mb-2 text-2xl italic font-semibold tracking-tighter text-white uppercase">Order Confirmed!</h2>
              <div className="p-4 mb-8 font-medium tracking-widest border bg-brand-dark rounded-xl border-brand-red/20 text-brand-yellow">
                {confirmedOrderDetails?.id}
              </div>
              <div className="space-y-3">
                <button onClick={() => navigate("/orders")} className="flex items-center justify-center w-full py-3.5 text-[11px] font-medium uppercase tracking-widest bg-brand-orange text-white rounded-xl">
                  View Orders
                </button>
                <button onClick={() => navigate("/")} className="flex items-center justify-center w-full py-3.5 text-[11px] font-medium uppercase tracking-widest border border-white/10 text-gray-300 rounded-xl">
                  Home
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        <h1 className="flex items-center gap-2 mb-8 text-2xl italic font-medium tracking-tighter text-white uppercase">
            <Wallet className="text-brand-orange" size={24}/> Checkout
        </h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            
            {/* ORDER ITEMS */}
            <div className="overflow-hidden border bg-brand-surface rounded-2xl border-white/5">
              <button onClick={() => setShowItems(!showItems)} className="flex items-center justify-between w-full p-6 text-left">
                <h3 className="flex items-center text-sm font-medium tracking-widest text-gray-100 uppercase">
                  <ShoppingBag className="w-4 h-4 mr-2 text-brand-orange" /> Order Items
                </h3>
                <ChevronDown className={`text-gray-400 transition-transform ${showItems ? 'rotate-180' : ''}`} size={18} />
              </button>
              <AnimatePresence>
                {showItems && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 space-y-4 overflow-hidden">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between pt-4 text-xs border-t border-white/5">
                        <div className="flex items-center gap-4">
                          <img src={item.imageUrl} alt="" className="object-cover w-10 h-10 rounded-lg bg-brand-dark" />
                          <div className="uppercase">
                            <p className="font-medium text-gray-100">{item.name}</p>
                            <p className="text-[10px] text-gray-400">{item.selectedWeight} • {item.qty} units</p>
                          </div>
                        </div>
                        <p className="font-medium text-white"><Rupee />{formatCurrency(item.price * item.qty)}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* DELIVERY METHOD */}
            <div className="p-6 border bg-brand-surface rounded-2xl border-white/5">
              <h3 className="flex items-center mb-6 text-sm font-medium tracking-widest text-gray-100 uppercase">
                <Truck className="w-4 h-4 mr-2 text-brand-orange" /> Choose Method
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setDeliveryType("home")} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${deliveryType === "home" ? "bg-brand-orange/10 border-brand-orange text-white" : "bg-brand-dark border-white/5 text-gray-400"}`}>
                  <Truck size={20} />
                  <span className="text-[10px] tracking-widest uppercase">Home Delivery</span>
                </button>
                <button onClick={() => setDeliveryType("store")} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${deliveryType === "store" ? "bg-brand-orange/10 border-brand-orange text-white" : "bg-brand-dark border-white/5 text-gray-400"}`}>
                  <Store size={20} />
                  <span className="text-[10px] tracking-widest uppercase">Store Pickup</span>
                </button>
              </div>
            </div>

            {/* ADDRESS/PHONE */}
            <div className="p-6 text-left border bg-brand-surface rounded-2xl border-white/5">
              <h3 className="flex items-center mb-6 text-sm font-medium tracking-widest text-gray-100 uppercase">
                <MapPin className="w-4 h-4 mr-2 text-brand-orange" /> {deliveryType === "home" ? "Delivery To" : "Pickup From"}
              </h3>
              {deliveryType === "home" ? (
                <div className="space-y-3">
                  {userProfile?.addresses?.map((addr, index) => (
                    <div key={index} onClick={() => setSelectedAddressIndex(index)} className={`p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${selectedAddressIndex === index ? 'bg-brand-orange/10 border-brand-orange' : 'bg-brand-dark border-white/5'}`}>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedAddressIndex === index ? 'border-brand-orange' : 'border-gray-500'}`}>
                        {selectedAddressIndex === index && <div className="w-2 h-2 rounded-full bg-brand-orange" />}
                      </div>
                      <div className="uppercase">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-orange/10 text-brand-orange border border-brand-orange/20">{addr.type}</span>
                        <p className="mt-2 text-xs text-gray-100">{addr.line1}</p>
                        <p className="text-[10px] text-gray-400">{addr.city}, {addr.zip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 uppercase border bg-brand-dark rounded-xl border-white/5">
                    <Store className="text-brand-yellow" size={24} />
                    <div>
                      <p className="text-xs font-medium text-gray-100">DP Evening Snacks</p>
                      <p className="text-[10px] text-gray-400">Pallikaranai, Chennai</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-brand-orange" size={16} />
                    <input type="tel" placeholder="ENTER PHONE FOR PICKUP" value={pickupPhone} onChange={(e) => setPickupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full py-3.5 pl-10 pr-4 text-xs text-white border outline-none bg-brand-surface border-white/5 rounded-xl focus:border-brand-orange placeholder:text-gray-500" />
                  </div>
                </div>
              )}
            </div>

            {/* COUPONS */}
            <div className="p-6 border bg-brand-surface rounded-2xl border-white/5">
              <h3 className="flex items-center mb-6 text-sm font-medium tracking-widest text-gray-100 uppercase">
                <Ticket className="w-4 h-4 mr-2 text-brand-orange" /> Coupons
              </h3>
              <div className="flex gap-4 pb-2 overflow-x-auto scrollbar-hide">
                {dbOffers.map((offer, idx) => {
                  const minAmt = Number(offer.minAmount) || 0;
                  const isLocked = total < minAmt;
                  const isActive = appliedCode === offer.title;
                  return (
                    <button key={idx} onClick={() => applyOffer(offer)} disabled={isLocked && !isActive} className={`flex-shrink-0 p-5 text-left border rounded-[1.5rem] transition-all w-52 ${isActive ? 'border-brand-orange bg-brand-orange/10' : isLocked ? 'opacity-40 grayscale border-white/5' : 'bg-brand-dark border-white/10'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <Ticket size={16} className={isActive ? 'text-brand-orange' : 'text-gray-500'} />
                        {isActive && <CheckCircle2 size={16} className="text-brand-orange" />}
                        {isLocked && !isActive && <Lock size={14} className="text-gray-500" />}
                      </div>
                      <h4 className="text-[10px] font-medium text-gray-100 uppercase">{offer.title}</h4>
                      <p className="mt-1 text-lg italic font-medium uppercase text-brand-yellow">{offer.discount}%</p>
                      <div className="pt-3 mt-4 border-t border-white/5">
                        <div className="flex justify-between text-[8px] uppercase text-gray-400 mb-1.5">
                          <span>Progress</span>
                          <span><Rupee />{total}/<Rupee />{minAmt}</span>
                        </div>
                        <div className="w-full h-1 overflow-hidden rounded-full bg-white/5">
                           <div className={`h-full transition-all ${isActive ? 'bg-brand-orange' : 'bg-gray-600'}`} style={{ width: `${Math.min((total/minAmt)*100, 100)}%` }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BILLING COLUMN */}
          <div className="text-left lg:col-span-1">
            <div className="sticky p-6 border shadow-2xl bg-brand-surface rounded-[2rem] border-white/5 top-24">
              <h3 className="pb-3 mb-5 text-lg italic font-medium text-white uppercase border-b border-white/5">Receipt</h3>
              
              <div className="mb-6 space-y-3 text-[10px] tracking-widest uppercase font-medium">
                <div className="flex justify-between text-gray-400"><span>Subtotal</span><span className="text-gray-100"><Rupee /> {formatCurrency(total)}</span></div>
                {discountPercent > 0 && <div className="flex justify-between font-medium tracking-tighter text-green-500"><span>Discount</span><span>- <Rupee /> {formatCurrency(discountAmount)}</span></div>}
                <div className="flex justify-between text-gray-400"><span>Delivery</span><span className="text-green-500">FREE</span></div>
                
                {/* DYNAMIC NOTICE BOX */}
                {deliveryType === "home" && !isMinOrderMet && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 p-3 border border-brand-yellow/30 bg-brand-yellow/5 rounded-xl">
                    <AlertCircle size={14} className="text-brand-yellow shrink-0 mt-0.5" />
                    <p className="text-[9px] text-brand-yellow leading-tight uppercase font-medium">Min <Rupee />{deliveryConfig.minOrderAmount} required for Delivery. Change to Pickup or add items.</p>
                  </motion.div>
                )}
              </div>

              <div className="p-5 mb-8 border bg-black/40 rounded-2xl border-white/5">
                <p className="text-[9px] font-medium text-gray-500 uppercase tracking-widest mb-1">Final Total</p>
                <div className="flex items-center text-3xl italic font-medium tracking-tighter text-brand-yellow">
                    <span className="mr-2 text-xl not-italic font-light"><Rupee /></span>
                    <span>{formatCurrency(finalPayable)}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder} 
                disabled={loading || (deliveryType === "home" && !isMinOrderMet)}
                className={`w-full py-4 text-xs font-medium uppercase tracking-[0.2em] shadow-xl rounded-xl transition-all 
                  ${(deliveryType === "home" && !isMinOrderMet) ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-brand-red to-brand-orange text-white active:scale-95"}`}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Confirm Order"}
              </button>
              
              <div className="flex justify-center items-center gap-2 mt-6 text-[9px] uppercase text-gray-500 tracking-widest">
                <ShieldCheck size={14} /> Secured Checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;