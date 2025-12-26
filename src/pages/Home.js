import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  Ticket,
  Ghost,
  Wind,
  Star,
  ChevronRight
} from "lucide-react";
import { getFestivalConfig } from "../utils/festivalLogic";

// --- HIGH PERFORMANCE SMOOTH FULL-PAGE FALLING ANIMATION ---
const FallingEmojis = ({ emoji }) => {
  const [pageHeight, setPageHeight] = useState(window.innerHeight);

  useEffect(() => {
    const updateHeight = () => {
      setPageHeight(Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ));
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(document.body);
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
      observer.disconnect();
    };
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * -30, 
      duration: Math.random() * 10 + 15, 
      size: Math.random() * 20 + 15,
      sway: Math.random() * 60 - 30, 
      rotate: Math.random() * 360,
    }));
  }, []); 

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
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
          style={{
            position: "absolute",
            fontSize: `${p.size}px`,
            filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
            left: `${p.left}%`, // FIXED: Distributed across the full width
            willChange: "transform",
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [dbCategories, setDbCategories] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  
  const [showAnimations, setShowAnimations] = useState(() => {
    const saved = localStorage.getItem("showAnimations");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [appSettings, setAppSettings] = useState({
    banners: [],
    importantNotes: [],
    offers: [],
    categoryAlignment: 'grid',
    categoryOrder: [],
    bestSellers: []
  });

  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  const festivalConfig = useMemo(() => getFestivalConfig(), []);
  const userName = user?.displayName || userProfile?.name || "Foodie";
  const addresses = userProfile?.addresses || [];
  const currentAddress = addresses[selectedAddressIndex] || { line1: "Set Location", city: "Select Address" };

  const navigateWithScroll = (path) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(path);
  };

  const toggleAnimations = () => {
    const newState = !showAnimations;
    setShowAnimations(newState);
    localStorage.setItem("showAnimations", JSON.stringify(newState));
  };

  useEffect(() => {
    if (!festivalConfig?.deadline) return;
    const calculateTime = () => {
      const difference = +new Date(festivalConfig.deadline) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          mins: Math.floor((difference / 1000 / 60) % 60),
          secs: Math.floor((difference / 1000) % 60),
        });
      }
    };
    const timer = setInterval(calculateTime, 1000);
    calculateTime();
    return () => clearInterval(timer);
  }, [festivalConfig]);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "app_settings", "home_screen"), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const currentOrder = data.categoryOrder || [];
        const sortedBanners = (data.banners || []).sort((a, b) => (a.order || 0) - (b.order || 0));
        setAppSettings({ ...data, banners: sortedBanners });

        // FETCH BESTSELLERS
        if (data.bestSellers?.length > 0) {
          const pQuery = query(collection(db, "products"), where(documentId(), "in", data.bestSellers.slice(0, 10)));
          const pSnapshot = await getDocs(pQuery);
          setBestsellers(pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        onSnapshot(collection(db, "categories"), (catSnap) => {
          const fetchedCats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          const sorted = fetchedCats.sort((a, b) => {
            const indexA = currentOrder.indexOf(a.name);
            const indexB = currentOrder.indexOf(b.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return (a.priority || 999) - (b.priority || 999);
          });
          setDbCategories(sorted);
          setLoading(false);
        });
      }
    });
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    if (appSettings.banners.length <= 1) return;
    const timer = setTimeout(() => {
      setActiveBanner((prev) => (prev + 1) % appSettings.banners.length);
    }, (appSettings.banners[activeBanner]?.duration || 5) * 1000);
    return () => clearTimeout(timer);
  }, [activeBanner, appSettings.banners]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-dark">
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="text-xl font-black tracking-widest text-center uppercase text-brand-orange">
          DP Evening <br/> Snacks & Sweets...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24 space-y-8 overflow-x-hidden font-sans text-white bg-brand-dark">
      {showAnimations && festivalConfig && <FallingEmojis emoji={festivalConfig.emoji} />}

      <div className="relative z-10 px-4 pt-6 mx-auto space-y-6 text-left max-w-7xl lg:px-8">
        
        {/* --- HEADER --- */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <h2 className="flex items-center gap-2 text-2xl font-black tracking-tighter sm:text-3xl">
              Hi, <span className="relative inline-block text-brand-orange">{userName}
                {festivalConfig?.userBadge && (
                  <motion.span initial={{ y: 10, opacity: 0, rotate: -20 }} animate={{ y: 0, opacity: 1, rotate: 12 }} className="absolute text-2xl -top-6 -right-5">
                    {festivalConfig.userBadge}
                  </motion.span>
                )}
              </span> 
              <Sparkles className="text-brand-yellow" size={24} fill="currentColor" />
            </h2>
            <div onClick={() => setShowAddressSheet(true)} className="flex items-center gap-2 transition-opacity cursor-pointer opacity-80 hover:opacity-100">
              <MapPin size={18} className="text-brand-orange" fill="currentColor" />
              <p className="text-sm font-bold tracking-tight text-gray-300 truncate max-w-[200px]">{currentAddress.line1}</p>
              <ChevronDown size={14} className="text-gray-500" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleAnimations} className={`p-2.5 border transition-all rounded-full ${showAnimations ? 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange' : 'bg-white/5 border-white/10 text-gray-400'}`}>
              {showAnimations ? <Wind size={20} /> : <Ghost size={20} />}
            </button>
            <button onClick={() => navigateWithScroll("/help")} className="p-2.5 bg-white/5 border border-white/10 rounded-full text-brand-orange hover:bg-brand-orange/10">
              <HelpCircle size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* --- FESTIVAL CARD --- */}
        {festivalConfig && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigateWithScroll("/menu")} className={`p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-gradient-to-br ${festivalConfig.theme} border border-white/10 shadow-2xl relative overflow-hidden cursor-pointer group`}>
            <div className="absolute inset-0 opacity-[0.08] flex flex-wrap gap-4 sm:gap-6 p-4 blur-[0.5px] pointer-events-none">
                {Array.from({ length: 10 }).map((_, i) => <span key={i} className="text-2xl sm:text-3xl">{festivalConfig.emoji}</span>)}
            </div>
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2 sm:space-y-4">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/10 text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md border border-white/10 flex items-center gap-1">
                        <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-white animate-pulse" />
                        Festive Active
                    </span>
                </div>
                <div className="space-y-0.5 text-left">
                  <h2 className="text-lg italic font-black leading-tight tracking-tighter uppercase sm:text-3xl">{festivalConfig.msg}</h2>
                  <p className="text-[9px] sm:text-xs font-bold text-white/80 line-clamp-1">{festivalConfig.sub}</p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                    {[{ val: timeLeft.days, lab: 'D' }, { val: timeLeft.hours, lab: 'H' }, { val: timeLeft.mins, lab: 'M' }, { val: timeLeft.secs, lab: 'S' }].map((unit, idx) => (
                      <React.Fragment key={idx}>
                        <div className="flex flex-col items-center p-1 sm:p-2 min-w-[32px] sm:min-w-[48px] bg-black/40 rounded-lg border border-white/10 backdrop-blur-sm">
                          <span className="text-xs font-black tracking-tighter sm:text-lg">{String(unit.val).padStart(2, '0')}</span>
                          <span className="text-[5px] sm:text-[6px] font-bold text-white/50 uppercase">{unit.lab}</span>
                        </div>
                        {idx < 3 && <span className="font-bold text-white/30 text-[10px] sm:text-base">:</span>}
                      </React.Fragment>
                    ))}
                </div>
              </div>
              <div className="relative shrink-0">
                <motion.div animate={showAnimations ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="relative z-10 block text-5xl sm:text-8xl drop-shadow-2xl">
                    {festivalConfig.emoji}
                </motion.div>
                <div className="absolute inset-0 bg-white/30 blur-[20px] sm:blur-[45px] rounded-full scale-125 opacity-40" />
              </div>
            </div>
          </motion.div>
        )}

        {/* --- BANNER --- */}
        {appSettings.banners?.length > 0 && (
          <section className="relative w-full overflow-hidden rounded-[32px] bg-[#050505] shadow-2xl border border-white/5 aspect-[16/9] md:aspect-[21/9]">
            <AnimatePresence mode="wait">
              <motion.div key={activeBanner} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.8 }} onClick={() => navigateWithScroll("/menu")} className="absolute inset-0 cursor-pointer">
                <img src={appSettings.banners[activeBanner]?.imageUrl} alt="" className="absolute inset-0 object-cover w-full h-full scale-110 opacity-40 blur-3xl brightness-50" />
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                    <img src={appSettings.banners[activeBanner]?.imageUrl} alt="" className="object-contain w-full h-full" />
                </div>
              </motion.div>
            </AnimatePresence>
          </section>
        )}

        {/* --- CATEGORIES --- */}
        <section className="space-y-6 text-left">
          <h3 className="pl-4 text-xl italic font-black tracking-tight uppercase border-l-4 border-brand-orange">Explore Menu</h3>
          <div className={appSettings.categoryAlignment === 'scroll' ? "flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1" : "grid grid-cols-4 sm:grid-cols-5 gap-y-8 gap-x-2"}>
            {dbCategories.map((cat) => (
              <div key={cat.id} onClick={() => navigateWithScroll(`/menu?category=${cat.name}`)} className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="flex items-center justify-center w-16 h-16 overflow-hidden transition-all border-2 rounded-full sm:w-20 sm:h-20 border-white/5 bg-brand-surface group-hover:border-brand-orange">
                  {cat.imageUrl ? <img src={cat.imageUrl} className="object-cover w-full h-full" alt=""/> : <span className="text-2xl">🍿</span>}
                </div>
                <span className="text-[10px] sm:text-xs font-black tracking-tighter text-center text-gray-400 uppercase group-hover:text-white line-clamp-2">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* --- OFFERS --- */}
        {appSettings.offers?.length > 0 && (
          <section className="space-y-4 text-left">
            <div className="flex items-center gap-2 px-1">
              <Ticket size={18} className="text-brand-orange" />
              <h3 className="text-sm font-black tracking-widest text-gray-400 uppercase">Limited Offers</h3>
            </div>
            <div className="flex gap-4 px-1 pb-2 overflow-x-auto scrollbar-hide">
              {appSettings.offers.map((offer, idx) => (
                <div key={idx} className="flex-shrink-0 w-64 p-5 border bg-brand-surface rounded-[2rem] border-white/5 relative overflow-hidden group transition-all hover:border-brand-orange/30 shadow-xl">
                  <div className="absolute w-16 h-16 transition-colors rounded-full -right-4 -top-4 bg-brand-orange/10 blur-2xl group-hover:bg-brand-orange/20" />
                  <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1">{offer.title}</p>
                  <h4 className="text-2xl italic font-black tracking-tighter text-white uppercase">{offer.discount} %</h4>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Min Order ₹{offer.minAmount}</span>
                    <button onClick={() => navigateWithScroll("/menu")} className="text-[9px] font-black text-white bg-brand-orange px-3 py-1 rounded-full uppercase shadow-lg">Order</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- BESTSELLERS SECTION --- */}
        {bestsellers.length > 0 && (
          <section className="pb-12 space-y-6 text-left">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl italic font-black uppercase md:text-2xl">
                <Star size={24} fill="currentColor" className="text-brand-yellow"/> Bestsellers
              </h3>
              <button onClick={() => navigateWithScroll("/menu")} className="flex items-center gap-1 text-xs font-black uppercase text-brand-orange hover:underline">
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 md:gap-8">
              {bestsellers.map((item) => (
                <motion.div key={item.id} whileTap={{ scale: 0.98 }} onClick={() => navigateWithScroll(`/menu?search=${item.name}`)} className="flex flex-col gap-3 p-3 transition-all border cursor-pointer bg-brand-surface rounded-3xl border-white/5 hover:border-brand-orange/30 group">
                  <div className="relative overflow-hidden aspect-square rounded-2xl bg-brand-dark">
                    <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="flex flex-col px-1">
                    <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1">{item.category}</p>
                    <h4 className="text-sm italic font-black tracking-tighter text-white uppercase line-clamp-1">{item.name}</h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* --- ADDRESS MODAL --- */}
      <AnimatePresence>
        {showAddressSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddressSheet(false)} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 w-full md:max-w-2xl z-[201] p-6 pb-12 bg-brand-surface rounded-t-[40px] border-t border-brand-red/20 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8 text-left">
                <h3 className="text-2xl font-black tracking-tighter text-white uppercase">Deliver to</h3>
                <button onClick={() => setShowAddressSheet(false)} className="p-3 text-gray-400 rounded-full bg-brand-dark hover:text-white"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                {addresses.length > 0 ? addresses.map((addr, idx) => (
                  <div key={idx} onClick={() => { setSelectedAddressIndex(idx); setShowAddressSheet(false); }} className={`p-5 rounded-2xl border transition-all flex justify-between items-center cursor-pointer ${selectedAddressIndex === idx ? "bg-brand-orange/10 border-brand-orange" : "bg-brand-dark border-white/5 hover:border-white/20"}`}>
                    <div className="flex items-center gap-4 text-left">
                      <MapPin size={22} className={selectedAddressIndex === idx ? "text-brand-orange" : "text-gray-500"} />
                      <div className="min-w-0">
                        <p className="text-base font-bold text-white uppercase">{addr.type || "Other"}</p>
                        <p className="text-sm text-gray-400 truncate w-full max-w-[200px] md:max-w-md">{addr.line1}</p>
                      </div>
                    </div>
                    {selectedAddressIndex === idx && <Check size={24} className="text-brand-orange shrink-0" />}
                  </div>
                )) : <div className="py-10 text-xs font-bold tracking-widest text-center text-gray-500 uppercase">No saved addresses</div>}
                <button onClick={() => { setShowAddressSheet(false); navigate("/profile", { state: { openAddressModal: true } }); }} className="flex items-center justify-center w-full gap-3 p-5 mt-4 text-base font-black tracking-tighter uppercase transition-all border-2 border-dashed rounded-2xl border-brand-orange/30 bg-brand-orange/5 text-brand-orange hover:bg-brand-orange/10">Add New Address</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;