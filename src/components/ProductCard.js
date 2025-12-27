import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingBag, ChevronDown, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { cart, addToCart, updateQty, removeFromCart } = useCart();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- 1. PRE-PROCESS VARIANTS ---
  const allVariants = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) {
      return [{ 
        weight: product?.weight || 1, 
        unit: product?.unit || 'pc', 
        price: product?.price || 0,
        stock: Number(product?.stock || 0),
        active: product?.isAvailable ?? true
      }];
    }
    
    return [...product.variants].sort((a, b) => {
      const getNormalizedWeight = (v) => {
        const val = parseFloat(v.weight) || 0;
        const unit = (v.unit || '').toLowerCase();
        if (unit.includes('k') || unit.includes('l')) return val * 1000; 
        return val;
      };
      return getNormalizedWeight(a) - getNormalizedWeight(b);
    });
  }, [product]);

  if (!product || allVariants.length === 0) return null;

  const currentVariant = allVariants[selectedVariantIndex] || allVariants[0];

  const formatUnit = (val, unit) => {
    const u = (unit || '').toLowerCase();
    if (u === 'pc' || u === 'pcs') return `${val}${u}`;
    return `${val} ${u}`;
  };

  const isVariantSoldOut = Number(currentVariant.stock) <= 0 || currentVariant.active === false;
  const isAvailable = product.isAvailable !== false && !isVariantSoldOut;

  const cartUniqueId = `${product.id}-${currentVariant.weight}${currentVariant.unit}`;
  const cartItem = cart.find((item) => item.id === cartUniqueId);
  const qty = cartItem ? cartItem.qty : 0;

  const RupeeSymbol = () => <span style={{ fontFamily: 'sans-serif', marginRight: '1px' }}>₹</span>;

  const handleAdd = () => {
    if (!isAvailable) return;
    addToCart({
      ...product,
      id: cartUniqueId,
      productId: product.id,
      price: currentVariant.price,
      selectedWeight: formatUnit(currentVariant.weight, currentVariant.unit),
      variantIndex: selectedVariantIndex,
      stock: currentVariant.stock 
    });
  };

  const handleIncrement = () => {
    if (qty >= currentVariant.stock) return; 
    updateQty(cartUniqueId, 1);
  };

  const handleDecrement = () => {
    if (qty === 1) {
      removeFromCart(cartUniqueId);
    } else {
      updateQty(cartUniqueId, -1);
    }
  };

  return (
    <div className="relative flex flex-col w-full sm:max-w-[280px] h-[320px] sm:h-[400px] overflow-hidden border shadow-xl bg-brand-surface rounded-[2rem] border-white/5 group mx-auto transition-all">
      
      {/* IMAGE AREA */}
      <div className="relative w-full p-2 overflow-hidden aspect-square sm:aspect-video bg-brand-dark/50">
        <img 
          src={product.imageUrl || "https://placehold.co/400x400?text=No+Image"} 
          alt={product.name} 
          className={`w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105 ${!isAvailable ? 'grayscale opacity-40' : ''}`}
        />
        <div className="absolute top-4 left-4">
           <VegIndicator type={product.type} />
        </div>
        {isVariantSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <span className="bg-red-600 text-white text-[10px] sm:text-xs font-normal px-4 py-1.5 rounded-full uppercase tracking-widest shadow-2xl rotate-[-5deg]">
                    Sold Out
                </span>
            </div>
        )}
      </div>

      {/* DETAILS AREA */}
      <div className="flex flex-col flex-1 p-4 pt-2 sm:p-5 sm:pt-3">
        <h3 className="mb-1 text-sm font-normal tracking-tight text-white uppercase sm:text-lg line-clamp-1 sm:mb-1">
          {product.name}
        </h3>

        {/* VARIANT INFO HINT (Only for products with > 1 variants) */}
        {allVariants.length > 1 && (
          <div className="flex items-center gap-1 mb-2 opacity-80 animate-pulse">
            <Info size={10} className="text-brand-orange" />
            <span className="text-[8px] sm:text-[9px] text-gray-400 uppercase font-normal tracking-tighter">
              Tap below to change variant
            </span>
          </div>
        )}

        {/* MODERN DROPDOWN SELECTOR */}
        <div className="relative mb-3">
          <button 
            onClick={() => allVariants.length > 1 && setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-brand-dark/60 border border-white/10 text-xs sm:text-sm transition-all ${allVariants.length > 1 ? 'hover:border-brand-orange/50 active:scale-95' : 'cursor-default'}`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-normal text-gray-300 truncate">
                {formatUnit(currentVariant.weight, currentVariant.unit)}
              </span>
              {allVariants.length > 1 && (
                <span className="text-brand-orange text-[9px] font-normal shrink-0 bg-brand-orange/10 px-1.5 py-0.5 rounded">
                  {allVariants.length} variants
                </span>
              )}
            </div>
            {allVariants.length > 1 && <ChevronDown size={14} className={`text-brand-orange transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />}
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-[70]" onClick={() => setIsDropdownOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute bottom-full left-0 w-full mb-2 z-[80] bg-brand-surface border border-brand-orange/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                  style={{ overflowY: 'visible' }}
                >
                  {allVariants.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedVariantIndex(idx); setIsDropdownOpen(false); }}
                      className={`w-full px-4 py-1.5 text-left text-[11px] sm:text-[13px] border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors flex justify-between items-center ${selectedVariantIndex === idx ? 'text-brand-orange bg-brand-orange/10' : 'text-gray-400'}`}
                    >
                      <span className="font-normal">{formatUnit(variant.weight, variant.unit)}</span>
                      <span className="font-normal text-white">
                        <RupeeSymbol />{variant.price}
                      </span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Price & Stock Row */}
        <div className="flex items-center justify-between mt-auto mb-3">
            <div className="flex flex-col">
              <span className="text-lg italic font-normal leading-none text-white sm:text-2xl">
                <RupeeSymbol />{currentVariant.price}
              </span>
            </div>
            {isAvailable && currentVariant.stock <= 5 && (
                <span className="text-[10px] font-normal text-red-500 animate-pulse uppercase bg-red-500/10 px-2 py-1 rounded">Low Stock</span>
            )}
        </div>

        {/* Action Button */}
        <div className="h-10 sm:h-12">
          {qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              disabled={!isAvailable}
              className={`w-full h-full rounded-xl font-normal text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                isAvailable 
                  ? 'bg-brand-orange text-white shadow-[0_10px_20px_rgba(255,69,0,0.2)] hover:brightness-110' 
                  : 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
              }`}
            >
              {isAvailable ? <>Add <ShoppingBag size={16} /></> : 'Unavailable'}
            </motion.button>
          ) : (
            <div className="flex items-center justify-between w-full h-full overflow-hidden border-2 rounded-xl bg-brand-dark border-brand-orange/30">
              <button onClick={handleDecrement} className="flex items-center justify-center w-12 h-full transition-colors sm:w-16 text-brand-orange hover:bg-brand-orange/10">
                <Minus size={20} strokeWidth={2} />
              </button>
              <span className="text-base font-normal text-white sm:text-xl">{qty}</span>
              <button 
                onClick={handleIncrement} 
                disabled={qty >= currentVariant.stock}
                className={`flex items-center justify-center w-12 sm:w-16 h-full transition-colors ${qty >= currentVariant.stock ? 'text-gray-700' : 'text-brand-orange hover:bg-brand-orange/10'}`}
              >
                <Plus size={20} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VegIndicator = ({ type }) => {
  const isVeg = type && type.toLowerCase() === 'veg';
  const color = isVeg ? '#22c55e' : '#ef4444';
  return (
    <div 
      className="flex items-center justify-center w-4 h-4 p-0.5 border-2 rounded bg-white/90" 
      style={{ borderColor: color }}
    >
      <div 
        className="w-full h-full rounded-full" 
        style={{ backgroundColor: color }}
      ></div>
    </div>
  );
};

export default ProductCard;