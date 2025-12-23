import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, User, UtensilsCrossed, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";

const BottomNav = () => {
  const location = useLocation();
  const { cart } = useCart();
  
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: UtensilsCrossed, label: "Menu", path: "/menu" },
    { icon: ClipboardList, label: "Orders", path: "/orders" },
    { icon: ShoppingBag, label: "Cart", path: "/cart", badge: cart.length },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-brand-surface border-brand-red/30 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              to={item.path} 
              key={item.label} 
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              {/* Active Indicator Background */}
              {isActive && (
                <motion.div 
                  layoutId="nav-bg" 
                  className="absolute w-12 h-12 rounded-full bg-brand-red/20 -z-10" 
                />
              )}

              {/* Icon Wrapper: This anchors the badge to the icon */}
              <div className="relative">
                <item.icon 
                  size={24} 
                  className={isActive ? "text-brand-orange" : "text-gray-400"} 
                />
                
                {/* Badge: Positioned relative to the ICON, not the link */}
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-brand-orange text-white text-[9px] font-bold h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full border-2 border-brand-surface animate-bounce">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-1 ${isActive ? "text-brand-orange font-bold" : "text-gray-500"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;