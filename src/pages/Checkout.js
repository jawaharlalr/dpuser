import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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
  ArrowRight,
  Phone,
  Ticket 
} from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { cart, total, clearCart } = useCart();
  const { user, userProfile } = useAuth(); 

  // --- LOGIC: CATCH TOTALS FROM CART STATE ---
  const finalPayable = location.state?.finalPayable || total;
  const discountAmount = location.state?.discountAmount || 0;
  const appliedCode = location.state?.appliedCode || "";

  // Local State
  const [deliveryType, setDeliveryType] = useState("home");
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pickupPhone, setPickupPhone] = useState(""); // New state for Pickup Phone

  // --- MODAL STATE ---
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedOrderDetails, setConfirmedOrderDetails] = useState(null);

  // --- HELPER: FORMAT CURRENCY ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
  };

  // Redirect if cart empty
  useEffect(() => {
    if (!showSuccessModal && cart.length === 0) {
      navigate("/menu");
    }
  }, [cart, navigate, showSuccessModal]);

  const handlePlaceOrder = async () => {
    if (!user) return toast.error("Please login first");

    let finalShippingAddress = "Store Pickup";
    let orderPhone = "";

    if (deliveryType === "home") {
        if (!userProfile?.addresses || userProfile.addresses.length === 0) {
            return toast.error("Please add a delivery address in your Profile");
        }
        finalShippingAddress = userProfile.addresses[selectedAddressIndex];
        orderPhone = finalShippingAddress.phone || userProfile?.phone || "";
    } else {
        // Validation for Store Pickup Phone
        if (!pickupPhone || pickupPhone.length < 10) {
            return toast.error("Please enter a valid 10-digit phone number for pickup");
        }
        orderPhone = pickupPhone;
    }

    setLoading(true);

    try {
      const year = new Date().getFullYear(); 
      const phoneSuffix = orderPhone.length >= 4 ? orderPhone.slice(-4) : Math.floor(1000 + Math.random() * 9000); 
      const randomSequence = Math.floor(1000 + Math.random() * 9000); 
      const orderId = `DP${year}-${phoneSuffix}-${randomSequence}`;

      const orderData = {
        orderId: orderId,
        userId: user.uid,
        userName: user.displayName || userProfile?.name || "Snack Lover",
        userEmail: user.email,
        phone: orderPhone, // Stored in phone field
        items: cart,
        subtotal: total,
        discountAmount: discountAmount,
        appliedCode: appliedCode,
        totalAmount: finalPayable, 
        totalItems: cart.reduce((acc, item) => acc + item.qty, 0),
        deliveryMethod: deliveryType === "home" ? "Home Delivery" : "Store Pickup",
        shippingAddress: finalShippingAddress, 
        paymentMethod: deliveryType === "home" ? "COD" : "Pay at Store",
        status: "Placed",
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
      };

      await setDoc(doc(db, "orders", orderId), orderData);
      
      clearCart();
      setConfirmedOrderDetails({ id: orderId, name: orderData.userName });
      setShowSuccessModal(true);

    } catch (error) {
      console.error(error);
      toast.error("Failed to place order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen px-4 pt-20 pb-32 font-sans bg-brand-dark md:pb-12 md:px-8">
      
      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 20 }} className="relative z-10 w-full max-w-md p-8 text-center border shadow-2xl rounded-2xl bg-brand-surface border-brand-orange/30 shadow-brand-orange/20">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 border-2 rounded-full bg-green-500/10 border-green-500/50">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="mb-2 text-3xl italic font-normal tracking-tighter text-white uppercase">Order Placed!</h2>
              <p className="mb-6 text-xs font-normal text-gray-300">Getting spicy, <span className="text-brand-orange">{confirmedOrderDetails?.name}</span>!</p>
              <div className="p-4 mb-8 border bg-brand-dark rounded-xl border-brand-red/20">
                <p className="mb-1 text-[10px] tracking-widest text-gray-500 uppercase font-normal">Order ID</p>
                <p className="text-xl font-normal tracking-wide text-brand-yellow">{confirmedOrderDetails?.id}</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => navigate("/orders")} className="flex items-center justify-center w-full py-3.5 font-normal text-xs uppercase tracking-widest transition-all shadow-lg bg-brand-orange text-white rounded-xl shadow-brand-orange/20"><ClipboardList className="w-4 h-4 mr-2" /> View My Orders</button>
                <button onClick={() => navigate("/")} className="flex items-center justify-center w-full py-3.5 font-normal text-xs uppercase tracking-widest border text-gray-300 bg-brand-dark rounded-xl border-brand-red/20"><Home className="w-4 h-4 mr-2" /> Back to Home</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={`max-w-6xl mx-auto transition-opacity duration-300 ${showSuccessModal ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <h1 className="flex items-center gap-2 mb-8 text-3xl italic font-normal tracking-tighter text-white uppercase">
            <Wallet className="text-brand-orange"/> Checkout
        </h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          <div className="space-y-6 lg:col-span-2">
            {/* DELIVERY METHOD */}
            <div className="p-6 border bg-brand-surface rounded-2xl border-brand-red/20">
              <h3 className="flex items-center mb-4 text-lg font-normal tracking-wider text-white uppercase">
                <Truck className="w-5 h-5 mr-2 text-brand-orange" /> Delivery Method
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button onClick={() => setDeliveryType("home")} className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${deliveryType === "home" ? "bg-brand-orange/10 border-brand-orange text-white" : "bg-brand-dark border-brand-red/10 text-gray-400"}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${deliveryType === "home" ? "border-brand-orange" : "border-gray-500"}`}>
                    {deliveryType === "home" && <div className="w-2.5 h-2.5 bg-brand-orange rounded-full" />}
                  </div>
                  <div className="font-normal tracking-tight text-left uppercase">Home Delivery</div>
                </button>
                <button onClick={() => setDeliveryType("store")} className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${deliveryType === "store" ? "bg-brand-orange/10 border-brand-orange text-white" : "bg-brand-dark border-brand-red/10 text-gray-400"}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${deliveryType === "store" ? "border-brand-orange" : "border-gray-500"}`}>
                    {deliveryType === "store" && <div className="w-2.5 h-2.5 bg-brand-orange rounded-full" />}
                  </div>
                  <div className="font-normal tracking-tight text-left uppercase">Store Pickup</div>
                </button>
              </div>
            </div>

            {/* ADDRESS SELECTOR / PICKUP DETAILS */}
            <div className="p-6 border bg-brand-surface rounded-2xl border-brand-red/20">
              <h3 className="flex items-center mb-4 text-lg font-normal tracking-wider text-white uppercase">
                <MapPin className="w-5 h-5 mr-2 text-brand-orange" />
                {deliveryType === "home" ? "Delivery Address" : "Pickup Details"}
              </h3>
              {deliveryType === "home" ? (
                <div className="space-y-3">
                  {userProfile?.addresses && userProfile.addresses.length > 0 ? (
                    userProfile.addresses.map((addr, index) => (
                      <div key={index} onClick={() => setSelectedAddressIndex(index)} className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${selectedAddressIndex === index ? 'bg-brand-orange/10 border-brand-orange' : 'bg-brand-dark border-brand-red/10'}`}>
                          <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAddressIndex === index ? 'border-brand-orange' : 'border-gray-500'}`}>
                            {selectedAddressIndex === index && <div className="w-2 h-2 rounded-full bg-brand-orange" />}
                          </div>
                          <div className="w-full">
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-normal uppercase px-2 py-0.5 rounded border ${selectedAddressIndex === index ? 'text-brand-orange border-brand-orange' : 'text-gray-400 border-gray-600'}`}>{addr.type}</span>
                                {selectedAddressIndex === index && <CheckCircle size={16} className="text-brand-orange"/>}
                            </div>
                            <p className="mt-2 text-sm font-normal tracking-tight text-white uppercase">{addr.line1}</p>
                            <p className="text-[11px] text-gray-400 uppercase font-normal">{addr.city}, {addr.state} - {addr.zip}</p>
                          </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center border-2 border-dashed border-brand-red/20 rounded-xl bg-brand-dark/50">
                        <p className="mb-2 text-xs font-normal text-gray-400 uppercase">No addresses saved yet</p>
                        <button onClick={() => navigate('/profile', { state: { openAddressModal: true }})} className="text-xs font-normal tracking-widest underline uppercase text-brand-orange">Add Address in Profile</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 uppercase border bg-brand-dark rounded-xl border-brand-red/20">
                    <Store className="mt-1 text-brand-yellow" size={24} />
                    <div>
                      <h4 className="text-lg font-normal tracking-tighter text-white uppercase">DP Evening Snacks</h4>
                      <p className="text-xs font-normal tracking-wide text-gray-500 uppercase">Main Market Road, Chennai</p>
                    </div>
                  </div>
                  
                  {/* MANDATORY PHONE INPUT FOR PICKUP */}
                  <div className="p-4 border bg-brand-dark rounded-xl border-brand-red/20">
                    <label className="block mb-2 text-[10px] font-normal tracking-widest text-gray-400 uppercase">
                      Confirm Pickup Contact (Mandatory)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-brand-orange" size={18} />
                      <input 
                        type="tel" 
                        placeholder="Enter 10 digit phone number" 
                        value={pickupPhone}
                        onChange={(e) => setPickupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full py-3 pl-12 pr-4 text-sm font-normal text-white transition-all border bg-brand-surface border-white/5 rounded-xl focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ORDER ITEMS */}
            <div className="p-6 border bg-brand-surface rounded-2xl border-brand-red/20">
                <h3 className="flex items-center mb-4 text-lg font-normal tracking-wider text-white uppercase">
                    <ShoppingBag className="w-5 h-5 mr-2 text-brand-orange" /> Order Items
                </h3>
                <div className="space-y-3">
                    {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between pb-2 border-b border-brand-red/10 last:border-0">
                            <div className="flex items-center gap-2 uppercase">
                                <span className="px-2 py-0.5 text-xs font-normal rounded bg-brand-dark text-brand-orange">{item.qty}x</span>
                                <span className="text-[11px] font-normal text-gray-200 uppercase">{item.name}</span>
                            </div>
                            <span className="text-xs font-normal text-white">₹ {formatCurrency(item.price * item.qty)}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="lg:col-span-1">
            <div className="sticky p-6 border shadow-2xl bg-brand-surface rounded-2xl border-brand-red/20 top-24">
              <h3 className="pb-2 mb-4 text-lg italic font-normal tracking-tighter text-white uppercase border-b border-brand-red/20">Summary</h3>
              <div className="mb-6 space-y-3 text-[11px] font-normal uppercase tracking-widest">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">₹ {formatCurrency(total)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span className="flex items-center gap-1"><Ticket size={12}/> {appliedCode}</span>
                    <span>- ₹ {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Delivery</span>
                  <span className="text-green-400 text-[10px] bg-green-400/10 px-2 py-0.5 rounded tracking-tighter">FREE</span>
                </div>
              </div>

              {/* FINAL TOTAL BOX */}
              <div className="p-5 mb-8 border bg-black/60 rounded-2xl border-brand-red/20">
                <p className="text-[10px] font-normal tracking-widest text-gray-500 uppercase mb-2">Total Payable</p>
                <div className="flex items-center text-3xl font-normal tracking-tighter text-brand-yellow">
                    <span className="mr-3 text-xl font-normal text-brand-yellow">₹</span>
                    <span>{formatCurrency(finalPayable)}</span>
                </div>
              </div>

              <div className="p-4 mb-6 uppercase border bg-brand-dark rounded-xl border-brand-red/20">
                 <h4 className="flex items-center mb-1 text-[10px] font-normal text-white uppercase tracking-widest">
                    <Wallet className="w-3.5 h-3.5 mr-2 text-brand-orange" /> {deliveryType === "home" ? "Cash on Delivery" : "Pay at Store"}
                 </h4>
                 <p className="text-[9px] text-gray-500 tracking-widest font-normal leading-relaxed">UPI or Cash accepted upon arrival</p>
              </div>

              <button onClick={handlePlaceOrder} disabled={loading} className="flex items-center justify-center w-full py-4 font-normal text-xs uppercase tracking-[0.2em] transition-all shadow-xl bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-50">
                {loading ? <span className="animate-pulse">Processing...</span> : <>Confirm Order <ArrowRight className="w-4 h-4 ml-2"/></>}
              </button>

              <div className="flex items-center justify-center gap-2 mt-6 text-[9px] font-normal uppercase text-gray-600 tracking-widest">
                <ShieldCheck size={14} /> Secure Checkout
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;