import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { PowerOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const ShopStatusGate = ({ children }) => {
  const [shopOpen, setShopOpen] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Real-time listener for the "onlineOrders" toggle
    const unsubscribe = onSnapshot(doc(db, "app_settings", "shop_controls"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Strictly looking at onlineOrders field
        setShopOpen(data.onlineOrders === true);
      } else {
        setShopOpen(true);
      }
    }, () => {
      setShopOpen(true);
    });

    return () => unsubscribe();
  }, []);

  if (shopOpen === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-dark">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <RefreshCw className="text-brand-orange" size={32} />
        </motion.div>
      </div>
    );
  }

  // Define restricted paths when onlineOrders is false
  const restrictedPaths = ["/", "/menu", "/checkout"];
  const isRestrictedPath = restrictedPaths.includes(location.pathname);

  if (!shopOpen && isRestrictedPath) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 text-center bg-brand-dark">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-8">
            <div className="flex items-center justify-center w-24 h-24 rounded-full bg-red-500/10 animate-pulse">
              <PowerOff size={40} className="text-red-500" />
            </div>
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
              Offline
            </div>
          </div>

          <h1 className="mb-3 text-3xl italic font-black tracking-tighter text-white uppercase">
            Orders <span className="text-brand-orange">Paused</span>
          </h1>
          
          <p className="max-w-sm mb-10 text-sm font-medium leading-relaxed tracking-widest text-gray-400 uppercase">
            Online ordering is currently not Available. 
            Please visit our store or check back later!
          </p>

          <button 
            onClick={() => window.location.reload()} 
            className="w-full max-w-xs py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} /> Refresh Status
          </button>
        </motion.div>
      </div>
    );
  }

  return children;
};

export default ShopStatusGate;