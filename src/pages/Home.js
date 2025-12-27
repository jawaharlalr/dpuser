import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  collection, 
  onSnapshot, 
  doc,
  query,
  where,
  getDocs,
  documentId 
} from "firebase/firestore";
import {
  Sparkles,
  MapPin,
  ChevronDown,
  X,
  Check,
  HelpCircle,
  Ghost,
  Wind,
  Star,
  ChevronRight,
  Clock,
  ShoppingBag,
  ArrowRight
} from "lucide-react";
import { getFestivalConfig } from "../utils/festivalLogic";
import { Helmet } from "react-helmet-async";

// Standard Rupee Symbol Component
const Rupee = () => <span style={{ fontFamily: 'sans-serif', marginRight: '1px' }}>₹</span>;

// --- 1. SKELETON LOADER COMPONENT ---
const HomeSkeleton = () => (
  <div className="px-4 pt-6 mx-auto space-y-8 max-w-7xl animate-pulse bg-brand-dark">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="w-40 h-8 rounded-lg bg-white/5" />
        <div className="w-32 h-4 rounded-md bg-white/5" />
      </div>
      <div className="w-10 h-10 rounded-full bg-white/5" />
    </div>
    <div className="h-48 w-full bg-white/5 rounded-[32px]" />
  </div>
);

// --- 2. OPTIMIZED FALLING ANIMATION ---
const FallingEmojis = React.memo(({ emoji }) => {
  const [pageHeight, setPageHeight] = useState(window.innerHeight);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!window.ResizeObserver) return;
    const updateHeight = () => setPageHeight(Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
    const observer = new ResizeObserver(updateHeight);
    observer.observe(document.body);
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
      observer.disconnect();
    };
  }, []);

  const particles = useMemo(() => {
    if (prefersReducedMotion) return [];
    const count = window.innerWidth < 640 ? 12 : 20; 
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * -30, 
      duration: Math.random() * 10 + 15, 
      size: Math.random() * 18 + 12,
      sway: Math.random() * 60 - 30, 
      rotate: Math.random() * 360,
    }));
  }, [prefersReducedMotion]); 

  if (prefersReducedMotion) return null;

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none z-[100] overflow-hidden" style={{ height: pageHeight }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -100, opacity: 0 }}
          animate={{
            y: pageHeight + 100, 
            x: p.sway, 
            rotate: p.rotate + 360,
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay }}
          style={{
            position: "absolute",
            fontSize: `${p.size}px`,
            left: `${p.left}%`,
            willChange: "transform",
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
});

const Home = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { cart, total } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [dbCategories, setDbCategories] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  
  const [showAnimations, setShowAnimations] = useState(() => {
    const saved = localStorage.getItem("showAnimations");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [appSettings, setAppSettings] = useState({
    banners: [],
    categoryOrder: [],
    bestSellers: []
  });

  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(() => {
    return Number(localStorage.getItem("selectedAddressIndex")) || 0;
  });

  // --- SMART GREETING ---
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", sub: "Start your day with something sweet!", icon: "☀️" };
    if (hour < 17) return { text: "Good Afternoon", sub: "Perfect time for a crunchy snack!", icon: "🌤️" };
    return { text: "Good Evening", sub: "Fulfill your evening cravings!", icon: "🌙" };
  }, []);

  const userName = user?.displayName || userProfile?.name || "Foodie";
  const addresses = userProfile?.addresses || [];
  const currentAddress = addresses[selectedAddressIndex] || { line1: "Set Location", city: "Select Address" };

  const festivalConfig = useMemo(() => getFestivalConfig(), []);

  // Safe Category Sorting logic restored
  const sortedCategories = useMemo(() => {
    const order = appSettings.categoryOrder || [];
    return [...dbCategories].sort((a, b) => {
      const ia = order.indexOf(a.name);
      const ib = order.indexOf(b.name);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return (a.priority || 999) - (b.priority || 999);
    });
  }, [dbCategories, appSettings.categoryOrder]);

  const navigateWithScroll = useCallback((path) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(path);
  }, [navigate]);

  // Persist Address & Fetch Recent
  useEffect(() => {
    localStorage.setItem("selectedAddressIndex", selectedAddressIndex);
    if (selectedAddressIndex >= addresses.length && addresses.length > 0) setSelectedAddressIndex(0);

    const savedRecent = JSON.parse(localStorage.getItem("recentViews") || "[]");
    if (savedRecent.length > 0) {
      const fetchRecent = async () => {
        const q = query(collection(db, "products"), where(documentId(), "in", savedRecent.slice(0, 5)));
        const snap = await getDocs(q).catch(() => ({ docs: [] }));
        setRecentProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      };
      fetchRecent();
    }
  }, [selectedAddressIndex, addresses.length]);

  // Split Listeners
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "app_settings", "home_screen"), async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setAppSettings(prev => ({ ...prev, ...data }));

      if (data.bestSellers?.length > 0) {
        const pQuery = query(collection(db, "products"), where(documentId(), "in", data.bestSellers.slice(0, 10)));
        const pSnapshot = await getDocs(pQuery).catch(() => ({ docs: [] }));
        setBestsellers(pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });

    const unsubCats = onSnapshot(collection(db, "categories"), (catSnap) => {
      setDbCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsubSettings(); unsubCats(); };
  }, []);

  // Banner Autoplay fixed dependencies
  useEffect(() => {
    if (appSettings.banners.length <= 1) return;
    const duration = (appSettings.banners[activeBanner]?.duration || 5) * 1000;
    const timer = setTimeout(() => {
      setActiveBanner((prev) => (prev + 1) % appSettings.banners.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [activeBanner, appSettings.banners]);

  useEffect(() => {
    if (!festivalConfig?.deadline) return;
    const timer = setInterval(() => {
      const diff = +new Date(festivalConfig.deadline) - +new Date();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / 1000 / 60) % 60),
          secs: Math.floor((diff / 1000) % 60),
        });
      } else clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [festivalConfig]);

  if (user && !userProfile && loading) return <HomeSkeleton />;
  if (loading) return <HomeSkeleton />;

  return (
    <div className="relative min-h-screen pb-32 space-y-8 overflow-x-hidden font-sans text-white bg-brand-dark">
      <Helmet><title>DP Snacks | {greeting.text}</title></Helmet>
      {showAnimations && festivalConfig && <FallingEmojis emoji={festivalConfig.emoji} />}

      <div className="relative z-10 px-4 pt-6 mx-auto space-y-6 text-left max-w-7xl lg:px-8">
        
        {/* --- HEADER --- */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-brand-orange/80">
              {greeting.icon} {greeting.text}
            </p>
            <h2 className="flex items-center gap-2 text-2xl font-normal tracking-tighter sm:text-3xl">
              Hi, {userName} <Sparkles className="text-brand-yellow" size={20} fill="currentColor" />
            </h2>
            <button onClick={() => setShowAddressSheet(true)} className="flex items-center gap-2 transition-opacity opacity-80">
              <MapPin size={16} className="text-brand-orange" />
              <p className="text-sm font-normal text-gray-300 truncate max-w-[200px]">{currentAddress.line1}</p>
              <ChevronDown size={14} className="text-gray-500" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAnimations(!showAnimations)} className={`p-2.5 border transition-all rounded-full ${showAnimations ? 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange' : 'bg-white/5 border-white/10 text-gray-400'}`}>
              {showAnimations ? <Wind size={20} /> : <Ghost size={20} />}
            </button>
            <button onClick={() => navigateWithScroll("/help")} className="p-2.5 bg-white/5 border border-white/10 rounded-full text-brand-orange">
              <HelpCircle size={22} />
            </button>
          </div>
        </div>

        {/* --- CONTINUE ORDERING --- */}
        {recentProducts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Clock size={16} className="text-brand-orange" />
              <h3 className="text-xs font-normal tracking-widest text-gray-400 uppercase">Continue Browsing</h3>
            </div>
            <div className="flex gap-3 pb-2 overflow-x-auto scrollbar-hide">
              {recentProducts.map(p => (
                <div key={p.id} onClick={() => navigateWithScroll(`/menu?search=${p.name}`)} className="flex items-center flex-shrink-0 gap-3 p-2 border cursor-pointer bg-brand-surface border-white/5 rounded-2xl w-44 hover:border-brand-orange/20">
                  <img src={p.imageUrl} className="object-cover w-10 h-10 rounded-lg" alt="" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-normal text-white truncate uppercase">{p.name}</p>
                    <p className="text-[8px] text-brand-orange font-normal uppercase">View Item</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- FESTIVAL CARD --- */}
        {festivalConfig && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigateWithScroll("/menu")} className={`p-5 rounded-[24px] bg-gradient-to-br ${festivalConfig.theme} border border-white/10 shadow-2xl relative overflow-hidden cursor-pointer group`}>
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex-1 space-y-3">
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[8px] font-normal uppercase tracking-[0.2em] backdrop-blur-md border border-white/10 flex items-center w-fit gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Festive Active
                </span>
                <div className="space-y-0.5">
                  <h2 className="text-lg font-normal tracking-tighter uppercase sm:text-2xl">{festivalConfig.msg}</h2>
                  <p className="text-[10px] text-white/80 line-clamp-1">{festivalConfig.sub}</p>
                </div>
                <div className="flex items-center gap-1.5">
                    {[{ val: timeLeft.days, lab: 'D' }, { val: timeLeft.hours, lab: 'H' }, { val: timeLeft.mins, lab: 'M' }, { val: timeLeft.secs, lab: 'S' }].map((unit, idx) => (
                      <React.Fragment key={idx}>
                        <div className="flex flex-col items-center p-1.5 min-w-[36px] bg-black/40 rounded-lg border border-white/10">
                          <span className="text-xs font-normal">{String(unit.val).padStart(2, '0')}</span>
                          <span className="text-[6px] text-white/50 uppercase">{unit.lab}</span>
                        </div>
                        {idx < 3 && <span className="text-xs text-white/30">:</span>}
                      </React.Fragment>
                    ))}
                </div>
              </div>
              <motion.div animate={showAnimations ? { scale: [1, 1.05, 1] } : {}} transition={{ repeat: Infinity, duration: 4 }} className="text-6xl sm:text-7xl drop-shadow-2xl">
                {festivalConfig.emoji}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* --- BANNER --- */}
        {appSettings.banners?.length > 0 && (
          <section className="relative w-full overflow-hidden rounded-[32px] bg-brand-surface shadow-2xl border border-white/5 aspect-[16/9] md:aspect-[21/9]">
            <AnimatePresence mode="wait">
              <motion.div key={activeBanner} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} onClick={() => navigateWithScroll("/menu")} className="absolute inset-0 cursor-pointer">
                <img src={appSettings.banners[activeBanner]?.imageUrl} alt="Offer" className="object-contain w-full h-full" />
              </motion.div>
            </AnimatePresence>
          </section>
        )}

        {/* --- CATEGORIES --- */}
        <section className="space-y-6">
          <h3 className="pl-4 text-lg font-normal tracking-tight uppercase border-l-4 border-brand-orange">Explore Menu</h3>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-8 gap-x-2">
            {sortedCategories.map((cat) => (
              <button key={cat.id} onClick={() => navigateWithScroll(`/menu?category=${cat.name}`)} className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 overflow-hidden transition-all border-2 rounded-full sm:w-20 sm:h-20 border-white/5 bg-brand-surface group-hover:border-brand-orange">
                  <img src={cat.imageUrl} loading="lazy" className="object-cover w-full h-full" alt={cat.name}/>
                </div>
                <span className="text-[9px] font-normal text-center text-gray-400 uppercase line-clamp-2">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* --- BESTSELLERS --- */}
        {bestsellers.length > 0 && (
          <section className="pb-12 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-normal uppercase">
                <Star size={20} fill="currentColor" className="text-brand-yellow"/> Bestsellers
              </h3>
              <button onClick={() => navigateWithScroll("/menu")} className="flex items-center gap-1 text-xs font-normal uppercase text-brand-orange hover:underline">
                View All <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {bestsellers.map((item) => (
                <div key={item.id} onClick={() => navigateWithScroll(`/menu?search=${item.name}`)} className="flex flex-col gap-3 p-3 transition-all border cursor-pointer bg-brand-surface rounded-3xl border-white/5 hover:border-brand-orange/20 group">
                  <div className="relative overflow-hidden aspect-square rounded-2xl bg-brand-dark">
                    <img src={item.imageUrl} loading="lazy" alt={item.name} className="object-cover w-full h-full" />
                  </div>
                  <div className="px-1">
                    <p className="text-[9px] font-normal text-brand-orange uppercase mb-0.5">{item.category}</p>
                    <h4 className="text-xs font-normal text-white uppercase line-clamp-1">{item.name}</h4>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* --- STICKY CART REMINDER --- */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-24 left-4 right-4 z-[90] max-w-lg mx-auto">
            <button onClick={() => navigate("/cart")} className="flex items-center justify-between w-full p-4 transition-all border shadow-2xl bg-brand-orange rounded-2xl border-white/20 active:scale-95">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl"><ShoppingBag size={20} className="text-white" /></div>
                <div className="text-left">
                  <p className="text-[10px] font-normal uppercase tracking-widest text-white/80">{cart.length} Items</p>
                  <p className="text-sm font-normal text-white"><Rupee />{total.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl">
                 <span className="text-[10px] font-normal uppercase tracking-widest">View Cart</span>
                 <ArrowRight size={14} />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ADDRESS MODAL --- */}
      <AnimatePresence>
        {showAddressSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddressSheet(false)} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[201] p-6 pb-12 bg-brand-surface rounded-t-[40px] border-t border-brand-red/20 max-h-[85vh] overflow-y-auto max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-normal tracking-tighter text-white uppercase">Deliver to</h3>
                <button onClick={() => setShowAddressSheet(false)} className="p-3 text-gray-400 rounded-full bg-brand-dark"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                {addresses.length > 0 ? addresses.map((addr, idx) => (
                  <button key={idx} onClick={() => { setSelectedAddressIndex(idx); setShowAddressSheet(false); }} className={`w-full p-5 rounded-2xl border transition-all flex justify-between items-center ${selectedAddressIndex === idx ? "bg-brand-orange/10 border-brand-orange" : "bg-brand-dark border-white/5"}`}>
                    <div className="flex items-center gap-4 text-left">
                      <MapPin size={22} className={selectedAddressIndex === idx ? "text-brand-orange" : "text-gray-500"} />
                      <div className="min-w-0">
                        <p className="text-base font-normal text-white uppercase">{addr.type || "Other"}</p>
                        <p className="text-sm text-gray-400 truncate max-w-[180px] sm:max-w-xs">{addr.line1}</p>
                      </div>
                    </div>
                    {selectedAddressIndex === idx && <Check size={24} className="text-brand-orange shrink-0" />}
                  </button>
                )) : <div className="py-10 text-xs font-normal tracking-widest text-center text-gray-500 uppercase">No saved addresses</div>}
                <button onClick={() => { setShowAddressSheet(false); navigate("/profile", { state: { openAddressModal: true } }); }} className="flex items-center justify-center w-full gap-3 p-5 mt-4 text-base font-normal tracking-tighter uppercase border-2 border-dashed rounded-2xl border-brand-orange/30 bg-brand-orange/5 text-brand-orange">Add New Address</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;