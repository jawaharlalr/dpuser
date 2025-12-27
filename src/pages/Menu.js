import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, orderBy, query, doc, getDoc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertCircle, ChevronUp } from "lucide-react"; 
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar"; // LINKED SEARCHBAR

// --- FALLING ANIMATION COMPONENT ---
const FallingEmojis = ({ emoji }) => {
  const particles = Array.from({ length: 20 });
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
            x: ["0%", Math.random() > 0.5 ? "15%" : "-15%"],
          }}
          transition={{ duration: Math.random() * 5 + 7, repeat: Infinity, ease: "linear", delay: Math.random() * 10 }}
          style={{ position: "absolute", fontSize: Math.random() * 20 + 10 + "px", left: Math.random() * 100 + "%" }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
};

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const currentCategory = searchParams.get("category") || "All";
  const currentSearch = searchParams.get("search") || "";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentCategory, currentSearch]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const festivalEmoji = useMemo(() => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    if (month === 12 && (date === 24 || date === 25)) return "❄️";
    if (month === 1 && date === 1) return "✨";
    if (month === 1 && date >= 14 && date <= 16) return "🍯";
    return null;
  }, []);

  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, "categories"), async (catSnap) => {
      const fetchedCats = catSnap.docs.map(doc => doc.data().name);
      const settingsSnap = await getDoc(doc(db, "app_settings", "home_screen"));
      const categoryOrder = settingsSnap.exists() ? settingsSnap.data().categoryOrder || [] : [];

      const sortedCats = ["All", ...fetchedCats.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      })];
      setDbCategories(sortedCats);
    });

    const qProducts = query(collection(db, "products"), orderBy("name", "asc"));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        const activeVariants = data.variants?.filter(v => v.active) || [];
        const hasStock = activeVariants.some(v => Number(v.stock) > 0);
        const isActuallyAvailable = (data.isAvailable !== false) && hasStock;

        return { 
          id: doc.id, 
          ...data, 
          isActuallyAvailable,
          activeVariants 
        };
      });
      setProducts(items);
      setLoading(false);
    });

    return () => {
      unsubCats();
      unsubProducts();
    };
  }, []);

  const handleCategoryChange = (cat) => {
    if (cat === "All") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", cat);
    }
    setSearchParams(searchParams);
  };

  const handleSearchChange = (val) => {
    if (!val) {
      searchParams.delete("search");
    } else {
      searchParams.set("search", val);
    }
    setSearchParams(searchParams);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const isVisible = p.isAvailable !== false;
      const matchesCategory = currentCategory === "All" || p.category === currentCategory;
      const matchesSearch = (p.name || "").toLowerCase().includes(currentSearch.toLowerCase()) ||
                            (p.category || "").toLowerCase().includes(currentSearch.toLowerCase());
      
      return isVisible && matchesCategory && matchesSearch;
    });
  }, [products, currentCategory, currentSearch]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen pb-24 overflow-x-hidden bg-brand-dark">
      {festivalEmoji && <FallingEmojis emoji={festivalEmoji} />}

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed z-50 p-3 text-white transition-colors rounded-full shadow-2xl bottom-24 right-6 bg-brand-orange shadow-brand-orange/40 hover:bg-brand-red active:scale-90"
          >
            <ChevronUp size={24} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="px-4 pt-6 mx-auto space-y-8 max-w-7xl lg:px-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl italic font-black tracking-tighter text-white uppercase">
              Our <span className="text-brand-orange">Menu</span>
            </h2>
            <Sparkles size={24} className="text-brand-yellow" fill="currentColor" />
          </div>

          {/* LINKED SEARCHBAR COMPONENT */}
          <SearchBar 
            value={currentSearch} 
            onChange={handleSearchChange} 
            placeholder="Search sweets & snacks..." 
          />
        </div>

        {/* CATEGORY TABS */}
        <div className="flex gap-3 pb-2 overflow-x-auto border-b scrollbar-hide border-white/5">
          {dbCategories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                currentCategory === cat 
                ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/20 scale-105' 
                : 'bg-brand-surface text-gray-400 border-white/5 hover:border-brand-orange/30 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* PRODUCT GRID */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 mt-4 lg:grid-cols-4 md:gap-8">
             {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
               <div key={n} className="aspect-[4/5] border rounded-3xl bg-brand-surface animate-pulse border-white/5" />
             ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-32 text-center">
                <div className="mb-4 text-6xl opacity-20">🍽️</div>
                <p className="text-xl font-bold tracking-tight text-gray-500 uppercase">No products found</p>
              </motion.div>
            ) : (
              <motion.div layout className="grid grid-cols-2 gap-4 lg:grid-cols-4 md:gap-8">
                {filteredProducts.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.id}
                    className="relative"
                  >
                    {!item.isActuallyAvailable && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 rounded-[2.5rem] backdrop-blur-[2px]">
                        <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-tighter mb-2">
                           Sold Out
                        </div>
                        <AlertCircle className="text-white/40" size={20} />
                      </div>
                    )}

                    <div className={!item.isActuallyAvailable ? "opacity-40 grayscale pointer-events-none" : ""}>
                      <ProductCard product={item} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Menu;