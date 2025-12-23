import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { cart, addToCart, updateQty, removeFromCart } = useCart();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // --- 1. PRE-PROCESS & SORT VARIANTS ---
  const sortedVariants = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) {
        return [{ 
            weight: product?.quantity || 1, 
            unit: product?.unit || 'pc', 
            price: product?.price || 0,
            stock: product?.stockCount || 0
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

  if (!product) return null;

  const currentVariant = sortedVariants[selectedVariantIndex] || sortedVariants[0];

  // --- 2. CART LOGIC ---
  const cartUniqueId = `${product.id}-${currentVariant.weight}${currentVariant.unit}`;
  const cartItem = cart.find((item) => item.id === cartUniqueId);
  const qty = cartItem ? cartItem.qty : 0;

  const isAvailable = product.isAvailable && (currentVariant.stock > 0 || currentVariant.stock === undefined);

  // Discount Calculation (Assuming MRP is available in product or variant)
  // You might need to add 'mrp' to your Firestore variants map if you want variant-specific discounts
  const discount = currentVariant.mrp 
    ? Math.round(((currentVariant.mrp - currentVariant.price) / currentVariant.mrp) * 100) 
    : 0;

  // --- 3. HANDLERS ---
  const handleAdd = () => {
    if (!isAvailable) return;
    
    addToCart({
      ...product,
      id: cartUniqueId,
      productId: product.id,
      price: currentVariant.price,
      selectedWeight: `${currentVariant.weight} ${currentVariant.unit}`,
      variantIndex: selectedVariantIndex
    });
  };

  const handleIncrement = () => updateQty(cartUniqueId, 1);

  const handleDecrement = () => {
    if (qty === 1) {
      removeFromCart(cartUniqueId);
    } else {
      updateQty(cartUniqueId, -1);
    }
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden border shadow-lg bg-brand-surface rounded-2xl border-brand-red/10 group">
      
      {/* --- IMAGE AREA --- */}
      <div className="relative w-full aspect-[4/3] bg-brand-dark/50 p-2 overflow-hidden">
        <img 
          src={product.imageUrl || "https://placehold.co/400x300?text=No+Image"} 
          alt={product.name} 
          className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 ${!isAvailable ? 'grayscale opacity-50' : ''}`}
        />

        {/* --- TOP LEFT STACK: Category & Discount --- */}
        <div className="absolute z-10 flex flex-col items-start gap-1 top-2 left-2">
            
            {/* 1. Category Label */}
            {product.category && (
                <span className="px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider bg-black/60 backdrop-blur-sm rounded border border-white/10 shadow-sm">
                    {product.category}
                </span>
            )}

            {/* 2. Discount Badge (Only if applicable) */}
            {discount > 0 && isAvailable && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-green-600 rounded border border-green-500 shadow-sm">
                    {discount}% OFF
                </span>
            )}
        </div>

        {/* Veg/Non-Veg Indicator (Top Right) */}
        <div className="absolute p-1 rounded-md shadow-sm top-2 right-2 bg-white/90 backdrop-blur-sm">
           <VegIndicator type={product.type} />
        </div>
      </div>

      {/* --- DETAILS AREA --- */}
      <div className="flex flex-col flex-1 p-3">
        <h3 className="mb-2 text-sm font-bold leading-tight text-white line-clamp-2">
          {product.name}
        </h3>

        {/* Weight Selector */}
        {sortedVariants.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {sortedVariants.map((variant, idx) => (
              <button
                key={`${variant.weight}-${variant.unit}`}
                onClick={() => setSelectedVariantIndex(idx)}
                className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                  selectedVariantIndex === idx
                    ? 'bg-brand-orange text-white border-brand-orange shadow-sm shadow-brand-orange/20'
                    : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'
                }`}
              >
                {variant.weight} {variant.unit}
              </button>
            ))}
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-end justify-between mt-auto mb-3">
            <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {currentVariant.weight} {currentVariant.unit}
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-brand-yellow">₹{currentVariant.price}</span>
                    {/* Show MRP Strikethrough if available */}
                    {currentVariant.mrp && currentVariant.mrp > currentVariant.price && (
                        <span className="text-xs text-gray-500 line-through decoration-brand-red/50">
                            ₹{currentVariant.mrp}
                        </span>
                    )}
                </div>
            </div>
        </div>

        {/* Action Button */}
        <div>
          {qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              disabled={!isAvailable}
              className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                isAvailable 
                  ? 'bg-brand-surface border border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white shadow-brand-orange/10' 
                  : 'bg-brand-dark border border-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAvailable ? (
                <>Add <ShoppingBag size={16} /></>
              ) : (
                'Out of Stock'
              )}
            </motion.button>
          ) : (
            <div className="flex items-center justify-between w-full h-10 overflow-hidden border rounded-xl bg-brand-dark border-brand-orange/50">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleDecrement}
                className="flex items-center justify-center w-10 h-full text-brand-orange hover:bg-brand-orange/10"
              >
                <Minus size={16} strokeWidth={3} />
              </motion.button>
              
              <span className="text-sm font-bold text-white duration-200 animate-in zoom-in">
                {qty}
              </span>
              
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleIncrement}
                className="flex items-center justify-center w-10 h-full text-brand-orange hover:bg-brand-orange/10"
              >
                <Plus size={16} strokeWidth={3} />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper: Veg Indicator
const VegIndicator = ({ type }) => {
  const isVeg = type && type.toLowerCase() === 'veg';
  const color = isVeg ? '#16a34a' : '#dc2626';

  return (
    <div className="flex items-center justify-center w-3 h-3 border border-current" style={{ color: color }}>
      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
    </div>
  );
};

export default ProductCard;