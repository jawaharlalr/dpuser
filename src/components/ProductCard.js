import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingBag, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { cart, addToCart, updateQty, removeFromCart } = useCart();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

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

  // --- HELPER: FORMAT WEIGHT/UNIT (Handles pc/pcs specifically) ---
  const formatUnit = (val, unit) => {
    const u = (unit || '').toLowerCase();
    // No space for pc/pcs, space for gms/kg/ml
    if (u === 'pc' || u === 'pcs') return `${val}${u}`;
    return `${val} ${u}`;
  };

  // --- 2. LOGIC UPDATES ---
  const isVariantSoldOut = Number(currentVariant.stock) <= 0 || currentVariant.active === false;
  const isAvailable = product.isAvailable !== false && !isVariantSoldOut;

  const cartUniqueId = `${product.id}-${currentVariant.weight}${currentVariant.unit}`;
  const cartItem = cart.find((item) => item.id === cartUniqueId);
  const qty = cartItem ? cartItem.qty : 0;

  // --- 3. HANDLERS ---
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
    <div className="relative flex flex-col h-full overflow-hidden border shadow-lg bg-brand-surface rounded-[2rem] border-white/5 group">
      
      {/* IMAGE AREA */}
      <div className="relative w-full p-2 overflow-hidden aspect-square bg-brand-dark/50">
        <img 
          src={product.imageUrl || "https://placehold.co/400x400?text=No+Image"} 
          alt={product.name} 
          className={`w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105 ${!isAvailable ? 'grayscale opacity-40' : ''}`}
        />
        <div className="absolute top-3 left-3">
          <span className="px-2 py-0.5 text-[9px] font-medium text-white uppercase tracking-widest bg-black/60 backdrop-blur-sm rounded-full border border-white/10 shadow-sm">
            {product.category}
          </span>
        </div>
        <div className="absolute p-1 rounded-lg shadow-sm top-3 right-3 bg-white/90 backdrop-blur-sm">
           <VegIndicator type={product.type} />
        </div>
        {isVariantSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
                <span className="bg-red-600 text-white text-[9px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-tighter shadow-xl rotate-[-5deg]">
                    Sold Out
                </span>
            </div>
        )}
      </div>

      {/* DETAILS AREA */}
      <div className="flex flex-col flex-1 p-4 pt-2">
        <div className="h-6 mb-1">
          <h3 className="text-sm italic font-semibold tracking-tight text-white uppercase line-clamp-1">
            {product.name}
          </h3>
        </div>

        <div className="h-4 mb-2">
            {allVariants.length > 1 && (
                <p className="flex items-center gap-1 text-[7px] text-brand-orange/80 uppercase font-medium">
                    <Info size={8} /> Choose pc/size to add more
                </p>
            )}
        </div>

        {/* VARIANT SELECTOR SECTION */}
        <div className="min-h-[52px] mb-3">
            {allVariants.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
                {allVariants.map((variant, idx) => {
                   const variantSoldOut = Number(variant.stock) <= 0 || variant.active === false;
                   return (
                    <button
                        key={`${variant.weight}-${variant.unit}`}
                        onClick={() => setSelectedVariantIndex(idx)}
                        className={`relative flex flex-col items-center justify-center min-w-[50px] px-2 py-1 rounded-lg border transition-all ${
                        selectedVariantIndex === idx
                            ? 'bg-brand-orange text-white border-brand-orange shadow-md'
                            : variantSoldOut 
                                ? 'bg-gray-800/40 text-gray-600 border-gray-700' 
                                : 'bg-brand-dark/40 text-gray-400 border-white/5 hover:text-white'
                        }`}
                    >
                        {/* Displays as 5pc or 10pcs */}
                        <span className="text-[9px] font-medium uppercase">
                          {formatUnit(variant.weight, variant.unit)}
                        </span>
                        <span className={`text-[7px] font-bold ${selectedVariantIndex === idx ? 'text-white/80' : variantSoldOut ? 'text-red-500/50' : 'text-brand-orange/60'}`}>
                            {variantSoldOut ? 'Out' : `${variant.stock} left`}
                        </span>
                    </button>
                   );
                })}
            </div>
            ) : (
                <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                       {formatUnit(currentVariant.weight, currentVariant.unit)} Pack
                    </span>
                    <span className="text-[8px] font-bold text-brand-orange/60 uppercase">In Stock: {currentVariant.stock}</span>
                </div>
            )}
        </div>

        {/* Price Section */}
        <div className="flex items-end justify-between mt-auto mb-3">
            <div className="flex flex-col">
                <span className="text-[9px] font-medium text-brand-orange uppercase tracking-widest">
                   {formatUnit(currentVariant.weight, currentVariant.unit)}
                </span>
                <span className="text-lg italic font-semibold text-white">₹{currentVariant.price}</span>
            </div>
            {isAvailable && currentVariant.stock <= 5 && (
                 <span className="text-[8px] font-semibold text-red-500 animate-pulse uppercase">
                    Low Stock
                 </span>
            )}
        </div>

        {/* Action Button */}
        <div className="h-10">
          {qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              disabled={!isAvailable}
              className={`w-full h-full rounded-xl font-semibold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                isAvailable 
                  ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/10' 
                  : 'bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed'
              }`}
            >
              {isAvailable ? <>Add <ShoppingBag size={13} /></> : 'Out of Stock'}
            </motion.button>
          ) : (
            <div className="flex items-center justify-between w-full h-full overflow-hidden border shadow-inner rounded-xl bg-brand-dark border-brand-orange/30">
              <button onClick={handleDecrement} className="flex items-center justify-center w-10 h-full text-brand-orange hover:bg-brand-orange/10">
                <Minus size={16} strokeWidth={2} />
              </button>
              <span className="text-sm italic font-semibold text-white">{qty}</span>
              <button 
                onClick={handleIncrement} 
                disabled={qty >= currentVariant.stock}
                className={`flex items-center justify-center w-10 h-full ${qty >= currentVariant.stock ? 'text-gray-700' : 'text-brand-orange hover:bg-brand-orange/10'}`}
              >
                <Plus size={16} strokeWidth={2} />
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
    <div className="flex items-center justify-center w-3 h-3 border-2 rounded-sm" style={{ borderColor: color }}>
      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }}></div>
    </div>
  );
};

export default ProductCard;