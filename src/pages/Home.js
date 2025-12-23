import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc, 
  where,
  limit,
  documentId 
} from "firebase/firestore";
import {
  Star,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  MapPin,
  ChevronDown,
  X,
  Check,
  Plus,
  Megaphone
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import { getFestivalConfig } from "../utils/festivalLogic";

// --- FALLING ANIMATION COMPONENT ---
const FallingEmojis = ({ emoji }) => {
  const particles = Array.from({ length: 25 });
  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -100, opacity: 0 }}
          animate={{
            y: window.innerHeight + 100,
            opacity: [0, 1, 1, 0],
            rotate: [0, 360],
            x: ["0%", Math.random() > 0.5 ? "20%" : "-20%"],
          }}
          transition={{ duration: Math.random() * 5 + 7, repeat: Infinity, ease: "linear", delay: Math.random() * 15 }}
          style={{ position: "absolute", fontSize: Math.random() * 24 + 12 + "px", left: Math.random() * 100 + "%" }}
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
  const bannerRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [dbCategories, setDbCategories] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
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

  // --- AUTO BANNER SCROLL LOGIC ---
  useEffect(() => {
    if (appSettings.banners.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (activeBanner + 1) % appSettings.banners.length;
      scrollToBanner(nextIndex);
    }, 4000); // Increased to 4s for desktop readability

    return () => clearInterval(interval);
  }, [activeBanner, appSettings.banners]);

  const scrollToBanner = (index) => {
    if (bannerRef.current) {
      const width = bannerRef.current.offsetWidth;
      bannerRef.current.scrollTo({
        left: width * index,
        behavior: "smooth"
      });
      setActiveBanner(index);
    }
  };

  const handleManualNav = (direction) => {
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (activeBanner + 1) % appSettings.banners.length;
    } else {
      nextIndex = (activeBanner - 1 + appSettings.banners.length) % appSettings.banners.length;
    }
    scrollToBanner(nextIndex);
  };

  const handleScrollDetect = () => {
    if (bannerRef.current) {
      const index = Math.round(bannerRef.current.scrollLeft / bannerRef.current.offsetWidth);
      if (index !== activeBanner) setActiveBanner(index);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const settingsSnap = await getDoc(doc(db, "app_settings", "home_screen"));
        let settingsData = {
            banners: [],
            importantNotes: [],
            offers: [],
            categoryAlignment: 'grid',
            categoryOrder: [],
            bestSellers: []
        };

        if (settingsSnap.exists()) {
          const fetchedData = settingsSnap.data();
          settingsData = { ...settingsData, ...fetchedData };
          setAppSettings(settingsData);
        }

        const catSnapshot = await getDocs(collection(db, "categories"));
        const fetchedCats = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const sortedCats = settingsData.categoryOrder?.length > 0
          ? [...fetchedCats].sort((a, b) => {
              const indexA = settingsData.categoryOrder.indexOf(a.name);
              const indexB = settingsData.categoryOrder.indexOf(b.name);
              return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
            })
          : fetchedCats;
        setDbCategories(sortedCats);

        if (settingsData.bestSellers && settingsData.bestSellers.length > 0) {
          const pQuery = query(collection(db, "products"), where(documentId(), "in", settingsData.bestSellers.slice(0, 10)));
          const pSnapshot = await getDocs(pQuery);
          setBestsellers(pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          const fallbackSnap = await getDocs(query(collection(db, "products"), limit(8)));
          setBestsellers(fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (err) { console.error("Fetch Error:", err); } 
      finally { setLoading(false); }
    };
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans bg-brand-dark">
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="text-xl italic font-black tracking-widest uppercase text-brand-orange">
          DP Evening Snacks & Sweets...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 space-y-8 overflow-x-hidden font-sans text-white bg-brand-dark">
      {festivalConfig && <FallingEmojis emoji={festivalConfig.emoji} />}

      {/* --- MAX WIDTH CONTAINER FOR DESKTOP --- */}
      <div className="px-4 pt-4 mx-auto space-y-8 max-w-7xl lg:px-8">
        
        {/* TOP ROW: USER & FESTIVAL */}
        <div className="grid items-start grid-cols-1 gap-6 md:grid-cols-2">
          {/* USER INFO */}
          <div className="flex flex-col gap-1">
            <h2 className="flex items-center gap-2 text-2xl font-black">Hi, <span className="text-brand-orange">{userName}</span> <Sparkles className="text-brand-yellow" size={24} fill="currentColor" /></h2>
            <div onClick={() => setShowAddressSheet(true)} className="flex items-center gap-2 transition-opacity cursor-pointer w-fit opacity-70 hover:opacity-100">
              <MapPin size={18} className="text-brand-orange" fill="currentColor" />
              <p className="text-sm font-bold truncate max-w-[250px]">{currentAddress.line1}</p>
              <ChevronDown size={14} />
            </div>
          </div>

          {/* FESTIVE CARD */}
          {festivalConfig && (
            <div className={`p-5 rounded-[24px] bg-gradient-to-br ${festivalConfig.theme} border border-white/10 shadow-xl relative overflow-hidden hidden md:block`}>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl italic font-black tracking-tighter uppercase">{festivalConfig.msg}</h2>
                  <p className="text-[10px] opacity-80">{festivalConfig.sub}</p>
                </div>
                <span className="text-4xl filter drop-shadow-lg">{festivalConfig.emoji}</span>
              </div>
            </div>
          )}
        </div>

        {/* MOBILE FESTIVE CARD */}
        {festivalConfig && (
            <div className={`p-5 rounded-[24px] bg-gradient-to-br ${festivalConfig.theme} border border-white/10 shadow-xl relative overflow-hidden md:hidden`}>
              <div className="relative z-10 flex items-center justify-between">
                <h2 className="text-xl italic font-black tracking-tighter uppercase">{festivalConfig.msg}</h2>
                <span className="text-3xl">{festivalConfig.emoji}</span>
              </div>
            </div>
        )}

        {/* IMPORTANT NOTES (NOTICE) */}
        {appSettings.importantNotes?.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {appSettings.importantNotes.map((note, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 p-4 border border-white/5 bg-white/5 rounded-2xl">
                <div className="mt-0.5 p-1.5 bg-brand-orange/20 rounded-full text-brand-orange">
                  <Megaphone size={14} fill="currentColor" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] mb-0.5">Notice</p>
                  <p className="text-xs font-medium leading-relaxed text-gray-400">{note.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* BANNERS SECTION - AUTO CHANGE & MANUAL ARROWS */}
        {appSettings.banners && appSettings.banners.length > 0 && (
          <section className="relative max-w-5xl mx-auto group">
            <div ref={bannerRef} onScroll={handleScrollDetect} className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth">
              {appSettings.banners.map((banner, i) => (
                <motion.div key={banner.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate("/menu")} className="relative min-w-full snap-center aspect-[21/9] md:aspect-[25/9] overflow-hidden rounded-[32px] bg-brand-surface border border-white/10 shadow-2xl cursor-pointer">
                  <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 z-0 object-cover w-full h-full brightness-110 contrast-110" />
                  <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 bg-gradient-to-t from-black/90 via-black/20 to-transparent">
                    <h2 className="text-3xl font-black leading-tight tracking-tighter text-white uppercase md:text-5xl drop-shadow-md">{banner.title}</h2>
                    {banner.description && <p className="mt-2 text-sm font-bold tracking-widest uppercase md:text-lg text-brand-orange drop-shadow-sm">{banner.description}</p>}
                    <button className="px-8 py-3 mt-6 text-xs font-black text-white uppercase transition-colors rounded-full shadow-xl w-fit bg-brand-orange hover:bg-brand-orange/90">
                      {banner.buttonText || "Explore"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {appSettings.banners.length > 1 && (
              <>
                <button onClick={() => handleManualNav('prev')} className="absolute z-20 hidden p-3 text-white transition-all transition-colors -translate-y-1/2 border rounded-full left-4 top-1/2 bg-black/40 backdrop-blur-md border-white/10 hover:bg-brand-orange md:flex">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={() => handleManualNav('next')} className="absolute z-20 hidden p-3 text-white transition-all transition-colors -translate-y-1/2 border rounded-full right-4 top-1/2 bg-black/40 backdrop-blur-md border-white/10 hover:bg-brand-orange md:flex">
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <div className="flex justify-center gap-2 mt-6">
              {appSettings.banners.map((_, i) => (
                <div key={i} onClick={() => scrollToBanner(i)} className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${activeBanner === i ? 'w-10 bg-brand-orange' : 'w-2 bg-white/20'}`} />
              ))}
            </div>
          </section>
        )}

        {/* CATEGORIES SECTION */}
        <section className="space-y-6">
          <h3 className="pl-4 text-xl italic font-black tracking-tight uppercase border-l-4 md:text-2xl border-brand-orange">What's on your mind?</h3>
          <div className="flex gap-8 pb-2 overflow-x-auto scrollbar-hide">
            {dbCategories.map((cat) => (
              <div key={cat.id} onClick={() => navigate(`/menu?category=${cat.name}`)} className="flex flex-col items-center gap-3 cursor-pointer shrink-0 group">
                <div className="flex items-center justify-center w-20 h-20 overflow-hidden transition-colors border-2 rounded-full shadow-lg md:w-24 md:h-24 border-brand-red/10 bg-brand-surface group-hover:border-brand-orange">
                  {cat.imageUrl ? <img src={cat.imageUrl} className="object-cover w-full h-full transition-transform group-hover:scale-110" alt=""/> : <span className="text-4xl">🥟</span>}
                </div>
                <span className="text-xs font-black tracking-tighter text-gray-400 uppercase transition-colors group-hover:text-white">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* BESTSELLERS SECTION */}
        <section className="pb-12 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xl italic font-black uppercase md:text-2xl"><Star size={24} fill="currentColor" className="text-brand-yellow"/> Bestsellers</h3>
            <button onClick={() => navigate("/menu")} className="flex items-center gap-1 text-xs font-black uppercase text-brand-orange hover:underline">View All <ChevronRight size={16} /></button>
          </div>
          {/* RESPONSIVE GRID: 2 cols on mobile, 4 cols on desktop */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 md:gap-8">
            {bestsellers.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      </div>

      {/* ADDRESS MODAL */}
      <AnimatePresence>
        {showAddressSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddressSheet(false)} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }} className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101] p-6 pb-12 bg-brand-surface rounded-t-[40px] border-t border-brand-red/20 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black tracking-tighter uppercase">Deliver to</h3>
                <button onClick={() => setShowAddressSheet(false)} className="p-3 text-gray-400 transition-colors rounded-full bg-brand-dark hover:text-white"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                {addresses.map((addr, idx) => (
                  <div key={idx} onClick={() => { setSelectedAddressIndex(idx); setShowAddressSheet(false); }} className={`p-5 rounded-2xl border transition-all flex justify-between items-center cursor-pointer ${selectedAddressIndex === idx ? "bg-brand-orange/10 border-brand-orange" : "bg-brand-dark border-white/5 hover:border-white/20"}`}>
                    <div className="flex items-center gap-4">
                      <MapPin size={22} className={selectedAddressIndex === idx ? "text-brand-orange" : "text-gray-500"} />
                      <div>
                        <p className="text-base font-bold uppercase">{addr.type || "Other"}</p>
                        <p className="max-w-sm text-sm truncate opacity-50">{addr.line1}</p>
                      </div>
                    </div>
                    {selectedAddressIndex === idx && <Check size={24} className="text-brand-orange" />}
                  </div>
                ))}
                <button onClick={() => { setShowAddressSheet(false); navigate("/profile", { state: { openAddressModal: true } }); }} className="flex items-center justify-center w-full gap-3 p-5 mt-4 transition-all border-2 border-dashed rounded-2xl border-brand-orange/30 bg-brand-orange/5 hover:bg-brand-orange/10">
                  <Plus size={20} strokeWidth={3} className="text-brand-orange" />
                  <span className="text-base font-black tracking-tighter uppercase text-brand-orange">Add New Address</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;