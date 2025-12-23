import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, orderBy, query, doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import ProductCard from "../components/ProductCard";

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

  // --- URL STATE ---
  const currentCategory = searchParams.get("category") || "All";
  const currentSearch = searchParams.get("search") || "";

  // --- FESTIVAL DETECTION ---
  const festivalEmoji = useMemo(() => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    if (month === 12 && (date === 24 || date === 25)) return "❄️";
    if (month === 1 && date === 1) return "✨";
    if (month === 1 && date >= 14 && date <= 16) return "🍯";
    return null;
  }, []);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        const settingsSnap = await getDoc(doc(db, "app_settings", "home_screen"));
        const categoryOrder = settingsSnap.exists() ? settingsSnap.data().categoryOrder || [] : [];

        const catSnapshot = await getDocs(query(collection(db, "categories"), orderBy("name", "asc")));
        const fetchedCats = catSnapshot.docs.map(doc => doc.data().name);
        
        const sortedCats = categoryOrder.length > 0 
          ? ["All", ...fetchedCats.sort((a, b) => {
              const indexA = categoryOrder.indexOf(a);
              const indexB = categoryOrder.indexOf(b);
              return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
            })]
          : ["All", ...fetchedCats];

        setDbCategories(sortedCats);

        const productSnapshot = await getDocs(collection(db, "products"));
        setProducts(productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();
  }, []);

  // --- HANDLERS ---
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

  // --- FILTERING LOGIC ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = currentCategory === "All" || p.category === currentCategory;
      const matchesSearch = (p.name || "").toLowerCase().includes(currentSearch.toLowerCase()) ||
                            (p.category || "").toLowerCase().includes(currentSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, currentCategory, currentSearch]);

  return (
    <div className="relative min-h-screen pb-24 overflow-x-hidden bg-brand-dark">
      {festivalEmoji && <FallingEmojis emoji={festivalEmoji} />}

      {/* CENTERED CONTAINER FOR ALL DEVICES */}
      <div className="px-4 pt-6 mx-auto space-y-8 max-w-7xl lg:px-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl italic font-black tracking-tighter text-white uppercase">
              Our <span className="text-brand-orange">Menu</span>
            </h2>
            <Sparkles size={24} className="text-brand-yellow" fill="currentColor" />
          </div>

          {/* SEARCH BAR - LARGER ON DESKTOP */}
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute w-5 h-5 text-gray-500 left-4 top-3.5 group-focus-within:text-brand-orange transition-colors" />
            <input 
              type="text" 
              placeholder="Search spicy treats..." 
              value={currentSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full py-3.5 pl-12 pr-4 text-sm font-normal text-white placeholder-gray-600 transition-all border shadow-2xl bg-brand-surface border-white/5 rounded-2xl focus:outline-none focus:border-brand-orange/50 focus:bg-brand-dark"
            />
          </div>
        </div>

        {/* CATEGORY TABS - RESPONSIVE SCROLL */}
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

        {/* PRODUCT GRID - 2 COLS MOBILE, 4 COLS DESKTOP */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 mt-4 lg:grid-cols-4 md:gap-8">
             {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
               <div key={n} className="aspect-[4/5] border rounded-3xl bg-brand-surface animate-pulse border-white/5" />
             ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="py-32 text-center"
              >
                <div className="mb-4 text-6xl opacity-20">🍽️</div>
                <p className="text-xl font-bold tracking-tight text-gray-500 uppercase">No spicy snacks found</p>
                <p className="mt-2 text-xs tracking-widest text-gray-600 uppercase">Try adjusting your filters or search keywords</p>
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
                  >
                    <ProductCard product={item} />
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