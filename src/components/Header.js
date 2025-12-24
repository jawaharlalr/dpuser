import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckCircle2, AlertTriangle, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [products, setProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // --- Helpers ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
  };

  // --- NEW: Helper to get starting price ---
  const getDisplayPrice = (product) => {
    if (product.price) return { price: product.price, isStarting: false };
    
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants
        .map(v => Number(v.price))
        .filter(p => !isNaN(p));
      return { 
        price: prices.length > 0 ? Math.min(...prices) : 0, 
        isStarting: product.variants.length > 1 
      };
    }
    return { price: 0, isStarting: false };
  };

  // --- 1. Fetch Products once ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const prodData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(prodData);
      } catch (err) {
        console.error("Search fetch error:", err);
      }
    };
    fetchProducts();
  }, []);

  // --- 2. Filter Logic ---
  useEffect(() => {
    if (searchValue.trim().length > 0) {
      const lowerQuery = searchValue.toLowerCase();
      const filtered = products.filter(p => 
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.category?.toLowerCase().includes(lowerQuery)
      ).slice(0, 6);
      setSearchResults(filtered);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchValue, products]);

  // --- 3. Close on outside click ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchValue.trim())}`);
      setIsSearchOpen(false);
      setShowDropdown(false);
      setSearchValue("");
    }
  };

  const handleResultClick = (productName) => {
    navigate(`/menu?search=${encodeURIComponent(productName)}`);
    setIsSearchOpen(false);
    setShowDropdown(false);
    setSearchValue("");
  };

  const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <span key={i} className="font-normal underline text-brand-orange decoration-brand-orange/30">
              {part}
            </span>
          ) : part
        )}
      </span>
    );
  };

  return (
    <div className="fixed top-0 left-0 z-50 w-full border-b shadow-md bg-brand-surface border-brand-red/20 pt-safe">
      <div className="relative flex items-center justify-between h-16 px-4 mx-auto max-w-7xl">
        
        {/* Left: Logo */}
        <div className={`z-10 flex items-center shrink-0 transition-opacity duration-300 ${isSearchOpen ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}>
           <img 
             src="/header.webp" 
             alt="DP Snacks" 
             className="object-contain w-auto h-12 transition-transform origin-left scale-110 cursor-pointer sm:scale-125 sm:h-14"
             onClick={() => navigate('/')}
           />
        </div>

        {/* Middle: Name */}
        <div className={`absolute w-full px-4 text-center transform -translate-x-1/2 pointer-events-none left-1/2 transition-opacity duration-300 ${isSearchOpen ? 'opacity-0 lg:opacity-100' : 'opacity-100'}`}>
           <div className="flex flex-col items-center justify-center font-normal leading-none">
             <span className="text-base italic font-black tracking-tighter text-transparent uppercase sm:text-lg bg-clip-text bg-gradient-to-r from-brand-orange to-brand-yellow whitespace-nowrap">
               DP Evening 
             </span>
             <span className="text-[9px] sm:text-[10px] text-brand-yellow/90 tracking-[0.1em] sm:tracking-[0.2em] uppercase mt-0.5 font-normal">
               Snacks & Sweets
             </span>
           </div>
        </div>

        {/* Right: Search */}
        <div className="z-20 flex items-center justify-end flex-1 md:flex-none" ref={dropdownRef}>
          
          {/* Desktop Search */}
          <div className="relative hidden md:block">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input 
                type="text"
                placeholder="Search snacks..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => searchValue.length > 0 && setShowDropdown(true)}
                className="w-40 py-2 pl-10 pr-4 text-sm font-normal text-white transition-all border rounded-full outline-none bg-brand-dark/50 border-brand-red/20 focus:w-64 focus:border-brand-orange"
              />
              <Search className="absolute text-gray-500 left-3" size={16} />
            </form>
            
            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 overflow-hidden border shadow-2xl w-80 bg-brand-surface rounded-2xl border-white/10 backdrop-blur-xl max-h-[450px] overflow-y-auto"
                >
                  <SearchDropdown 
                    results={searchResults} 
                    onSelect={handleResultClick} 
                    searchValue={searchValue} 
                    highlightHelper={HighlightText} 
                    formatCurrency={formatCurrency}
                    priceHelper={getDisplayPrice}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Search */}
          <div className="flex items-center md:hidden">
            <AnimatePresence>
              {isSearchOpen ? (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="absolute z-30 flex flex-col border shadow-2xl right-4 left-4 top-2 bg-brand-surface rounded-2xl border-white/10"
                >
                  <form onSubmit={handleSearch} className="relative flex items-center w-full p-2">
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Search treats..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-orange text-white text-sm rounded-xl py-2.5 pl-10 pr-10 outline-none font-normal"
                    />
                    <Search className="absolute left-5 text-brand-orange" size={18} />
                    <button type="button" onClick={() => setIsSearchOpen(false)} className="absolute text-gray-500 right-5"><X size={18} /></button>
                  </form>
                  {searchValue.length > 0 && (
                    <div className="max-h-[60vh] overflow-y-auto pb-2">
                       <SearchDropdown 
                        results={searchResults} 
                        onSelect={handleResultClick} 
                        searchValue={searchValue} 
                        highlightHelper={HighlightText} 
                        formatCurrency={formatCurrency}
                        priceHelper={getDisplayPrice}
                       />
                    </div>
                  )}
                </motion.div>
              ) : (
                <button onClick={() => setIsSearchOpen(true)} className="p-2 transition-transform border rounded-full bg-brand-dark/50 border-brand-red/20 text-brand-orange active:scale-90">
                  <Search size={18} />
                </button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const SearchDropdown = ({ results, onSelect, searchValue, highlightHelper: HighlightText, formatCurrency, priceHelper }) => {
  if (results.length === 0) return (
    <div className="p-4 text-xs italic font-normal text-center text-gray-500">No snacks found for "{searchValue}"</div>
  );

  return (
    <div className="p-2 space-y-1">
      <p className="px-3 py-2 text-[10px] font-normal uppercase tracking-widest text-gray-500 border-b border-white/5 mb-1">Matching Results</p>
      {results.map((product) => {
        const { price, isStarting } = priceHelper(product);
        
        return (
          <div 
            key={product.id}
            onClick={() => onSelect(product.name)}
            className="flex items-start gap-3 p-3 transition-colors cursor-pointer hover:bg-white/5 rounded-xl group"
          >
            <div className="relative overflow-hidden border shrink-0 w-14 h-14 rounded-xl bg-brand-dark border-white/10">
              <img src={product.imageUrl} alt="" className="object-cover w-full h-full transition-transform group-hover:scale-110" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-normal tracking-tight text-left text-white uppercase truncate">
                <HighlightText text={product.name} highlight={searchValue} />
              </h4>
              
              <p className="text-[9px] text-gray-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <Tag size={8} className="text-brand-orange/50"/> {product.category}
              </p>

              <div className="flex items-center justify-between mt-2 font-normal">
                  <span className="text-xs text-brand-orange">
                    {isStarting ? 'From ' : ''}₹ {formatCurrency(price)}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {product.inStock !== false ? (
                        <span className="text-[9px] text-green-500 uppercase tracking-tighter flex items-center gap-1">
                            <CheckCircle2 size={10} /> In Stock
                        </span>
                    ) : (
                        <span className="text-[9px] text-red-500 uppercase tracking-tighter flex items-center gap-1">
                            <AlertTriangle size={10} /> Out of Stock
                        </span>
                    )}
                  </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Header;