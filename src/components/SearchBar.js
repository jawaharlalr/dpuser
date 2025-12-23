import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Search, X, Box, CheckCircle2, AlertTriangle, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SearchBar = ({ isMobile, onClose }) => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // --- HELPER: FORMAT CURRENCY ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
  };

  // 1. Fetch products for instant search
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  // 2. Filter logic (Checks name and category)
  useEffect(() => {
    if (query.trim().length > 1) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6);
      setResults(filtered);
      setShowDropdown(true);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [query, products]);

  // 3. Highlight Matching Text
  const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? 
          <span key={i} className="font-normal underline text-brand-orange decoration-brand-orange/30">{part}</span> : 
          part
        )}
      </span>
    );
  };

  const handleResultClick = (productName) => {
    navigate(`/menu?search=${encodeURIComponent(productName)}`);
    setQuery("");
    setShowDropdown(false);
    if (onClose) onClose();
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative flex items-center">
        <input
          autoFocus={isMobile}
          type="text"
          placeholder="Search snacks, sweets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-full bg-brand-dark/50 border ${isMobile ? 'border-brand-orange py-3' : 'border-brand-red/20 py-2'} text-white text-sm rounded-xl pl-10 pr-10 outline-none transition-all focus:border-brand-orange focus:bg-brand-dark shadow-inner font-normal`}
        />
        <Search className={`absolute left-3 ${query ? 'text-brand-orange' : 'text-gray-500'}`} size={18} />
        {query && (
          <button onClick={() => setQuery("")} className="absolute p-1 text-gray-500 right-3 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-[100] left-0 right-0 mt-2 bg-brand-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[450px] overflow-y-auto backdrop-blur-xl"
          >
            {results.length > 0 ? (
              <div className="p-2 space-y-1">
                <p className="px-3 py-2 text-[10px] font-normal uppercase tracking-[0.2em] text-gray-500 border-b border-white/5 mb-2">Matching Products</p>
                {results.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleResultClick(product.name)}
                    className="w-full flex items-start gap-4 p-3 hover:bg-white/[0.05] rounded-xl transition-all group text-left"
                  >
                    {/* Product Image */}
                    <div className="overflow-hidden border w-14 h-14 rounded-xl shrink-0 border-white/10 bg-brand-dark">
                      <img src={product.imageUrl} alt="" className="object-cover w-full h-full transition-transform group-hover:scale-110" />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-normal tracking-tight text-white uppercase truncate">
                        <HighlightText text={product.name} highlight={query} />
                      </h4>
                      
                      {/* --- NEW: CATEGORY TAG --- */}
                      <p className="text-[9px] text-gray-500 uppercase tracking-[0.15em] flex items-center gap-1 mt-0.5">
                        <Tag size={8} className="text-brand-orange/50" /> {product.category}
                      </p>
                      
                      {/* Footer: Price & Stock */}
                      <div className="flex items-center justify-between mt-2 font-normal">
                        <span className="text-xs text-brand-orange">₹ {formatCurrency(product.price)}</span>
                        
                        <div className="flex items-center gap-1">
                          {product.inStock !== false ? (
                            <span className="flex items-center gap-1 text-[9px] text-green-500 uppercase tracking-tighter">
                              <CheckCircle2 size={10} /> In Stock
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] text-red-500 uppercase tracking-tighter">
                              <AlertTriangle size={10} /> Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center p-10 text-center">
                <Box size={32} className="mb-2 text-gray-700" />
                <p className="text-sm font-normal tracking-widest text-gray-500 uppercase">No matching snacks</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;