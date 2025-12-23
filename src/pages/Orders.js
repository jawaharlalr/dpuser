import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Calendar, 
  ShoppingBag,
  ChevronDown,
  Clock,
  Bike,      
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  MapPin,
  Ticket,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // --- HELPER: FORMAT CURRENCY ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
  };

  // --- 1. REAL-TIME DATA FETCH ---
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- 2. SEARCH FILTERING ---
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOrders(orders);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = orders.filter(order => 
        order.orderId.toLowerCase().includes(lowerTerm) || 
        order.items.some(item => item.name.toLowerCase().includes(lowerTerm))
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const handleCopyId = (e, id) => {
    e.stopPropagation(); 
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Order ID Copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Placed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Processing': return 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20';
      case 'Shipped': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Out for Delivery': return 'bg-brand-orange/10 text-brand-orange border-brand-orange/20';
      case 'Delivered': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-brand-dark">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-t-2 rounded-full border-brand-orange"
      />
    </div>
  );

  return (
    <div className="min-h-screen px-4 pt-20 pb-24 font-sans bg-brand-dark md:pb-12 md:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 mb-1 text-3xl italic font-normal tracking-tighter text-white uppercase">
              My Orders 
              <span className="px-3 py-0.5 text-xs font-normal text-gray-400 border rounded-full bg-brand-surface border-white/5">
                {orders.length}
              </span>
            </h1>
            <p className="text-xs font-normal tracking-widest text-gray-500 uppercase">Track your spicy cravings</p>
          </div>

          <div className="relative w-full md:w-72 group">
            <Search className="absolute w-4 h-4 text-gray-500 left-4 top-3.5 group-focus-within:text-brand-orange transition-colors" />
            <input 
              type="text" 
              placeholder="Search Order ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pr-4 text-sm font-normal text-white placeholder-gray-600 transition-all border bg-brand-surface border-white/5 rounded-2xl pl-11 focus:outline-none focus:border-brand-orange/50"
            />
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-brand-surface border border-white/5 rounded-[32px] p-12 flex flex-col items-center justify-center text-center min-h-[400px] shadow-2xl">
            <div className="flex items-center justify-center w-24 h-24 mb-6 border rounded-full shadow-xl bg-brand-dark border-brand-red/20">
              <ShoppingBag className="w-10 h-10 text-brand-orange" />
            </div>
            <h3 className="mb-2 text-xl font-normal tracking-tight text-white uppercase">No Orders Yet</h3>
            <p className="max-w-xs mb-8 text-sm font-normal text-gray-500">Your order history is empty. Start adding some snacks to your plate!</p>
            <Link to="/menu" className="px-10 py-3.5 font-normal text-xs uppercase tracking-widest text-white shadow-xl bg-brand-orange hover:bg-brand-orange/90 rounded-2xl transition-all active:scale-95">Browse Menu</Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, index) => {
                const totalQty = order.totalItems || 0;
                const isDelivered = order.status === 'Delivered';
                const isPaid = order.paymentStatus === 'Paid' || order.paymentMethod === 'Online';
                const hasDiscount = (order.discountAmount || 0) > 0;

                return (
                  <motion.div 
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="overflow-hidden transition-all border shadow-lg bg-brand-surface border-white/5 rounded-2xl hover:border-brand-orange/20"
                  >
                    {/* --- CARD HEADER --- */}
                    <div 
                      onClick={() => toggleExpand(order.id)}
                      className="relative flex flex-col justify-between gap-4 p-5 transition-colors cursor-pointer hover:bg-white/[0.02] md:p-6 md:flex-row"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          {/* UPDATED: S.No (index + 1) without # */}
                          <div className="flex items-center gap-2 px-3 py-1 border rounded-lg bg-brand-dark border-white/5">
                            <span className="text-[10px] font-normal text-gray-500 uppercase mr-1">S.No</span>
                            <span className="text-sm font-normal text-brand-orange">{index + 1}</span>
                            <div className="w-px h-3 mx-1 bg-white/10"></div>
                            <span className="text-sm font-normal tracking-widest text-white uppercase">{order.orderId}</span>
                            <button 
                              onClick={(e) => handleCopyId(e, order.orderId)}
                              className="p-1 text-gray-600 transition-all hover:text-white"
                            >
                              {copiedId === order.orderId ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                          </div>
                          
                          <span className={`flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full border font-normal uppercase tracking-widest ${
                            isPaid ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {isPaid ? <CheckCircle2 size={10}/> : <AlertCircle size={10}/>}
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </span>

                          <span className={`text-[10px] px-2.5 py-1 rounded-full border font-normal uppercase tracking-widest ${getStatusColor(order.status || 'Placed')}`}>
                            {order.status || 'Placed'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-normal text-gray-500 uppercase tracking-widest">
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1.5 text-brand-orange"/> {new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1.5 text-brand-orange"/> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-8 md:justify-end">
                          <div className="text-left md:text-right">
                             <p className="text-[10px] font-normal text-gray-600 uppercase tracking-widest mb-0.5">{order.paymentMethod}</p>
                             <p className="text-xl font-normal tracking-tighter text-brand-yellow">₹ {formatCurrency(order.totalAmount)}</p>
                          </div>
                          <div className={`p-2 rounded-full transition-transform duration-300 ${expandedOrderId === order.id ? 'bg-brand-orange/10 text-brand-orange rotate-180' : 'bg-white/5 text-gray-500'}`}>
                             <ChevronDown size={18} />
                          </div>
                      </div>
                    </div>

                    {/* --- CARD BODY --- */}
                    <AnimatePresence>
                      {expandedOrderId === order.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/5 bg-black/20"
                        >
                          <div className="p-5 md:p-6">
                            {/* Summary row with savings logic */}
                            <div className="flex items-center gap-4 pb-2 mb-6 overflow-x-auto scrollbar-hide">
                               <div className="flex flex-col p-3 border rounded-2xl bg-brand-dark border-white/5 min-w-[100px]">
                                  <span className="text-[9px] font-normal text-gray-600 uppercase tracking-widest mb-1">Items</span>
                                  <span className="text-sm font-normal text-white">{order.items.length} Type</span>
                               </div>
                               <div className="flex flex-col p-3 border rounded-2xl bg-brand-dark border-white/5 min-w-[100px]">
                                  <span className="text-[9px] font-normal text-gray-600 uppercase tracking-widest mb-1">Quantity</span>
                                  <span className="text-sm font-normal text-white">{totalQty} Units</span>
                               </div>
                               {hasDiscount && (
                                  <div className="flex flex-col p-3 border rounded-2xl bg-green-500/5 border-green-500/20 min-w-[120px]">
                                    <span className="text-[9px] font-normal text-green-600 uppercase tracking-widest mb-1">Savings</span>
                                    <span className="flex items-center gap-1 text-sm font-normal tracking-tighter text-green-400 uppercase">
                                      <Ticket size={14}/> ₹ {formatCurrency(order.discountAmount)}
                                    </span>
                                  </div>
                               )}
                            </div>

                            {/* Rider Section */}
                            {order.riderName && (
                              <div className="flex flex-col justify-between gap-4 p-4 mb-6 border md:flex-row md:items-center border-blue-500/20 bg-blue-500/5 rounded-2xl">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center justify-center w-12 h-12 border shadow-lg rounded-2xl bg-brand-dark border-blue-500/30 text-brand-orange">
                                    <Bike size={24} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-normal uppercase text-blue-400 tracking-widest mb-0.5">Delivery Partner</p>
                                    <p className="text-base italic font-normal tracking-tight text-white uppercase">{order.riderName}</p>
                                    {isDelivered && (
                                      <p className="text-[10px] text-gray-500 font-normal uppercase flex items-center gap-1 mt-1">
                                        <CheckCircle2 size={12} className="text-green-500"/> Delivery Completed
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {order.riderPhone && !isDelivered && (
                                  <a 
                                    href={`tel:${order.riderPhone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-normal uppercase tracking-widest rounded-xl bg-green-500 text-white hover:bg-green-600 transition-all shadow-lg"
                                  >
                                    <PhoneCall size={14} /> Call Partner
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Items List */}
                            <div className="mb-8 space-y-3">
                              <p className="text-[10px] font-normal text-gray-600 uppercase tracking-[0.2em] mb-4">Items Summary</p>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-3 border rounded-[20px] bg-brand-dark border-white/5 group hover:border-brand-orange/30 transition-all">
                                     <div className="relative flex-shrink-0 overflow-hidden border w-14 h-14 rounded-xl bg-brand-surface border-white/5">
                                        <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                                        <div className="absolute top-1 right-1">
                                           <VegIndicator type={item.type} />
                                        </div>
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <p className="text-sm font-normal tracking-tight text-white uppercase truncate">{item.name}</p>
                                        <p className="text-[10px] font-normal text-gray-500 uppercase tracking-widest mt-0.5">
                                          {item.selectedWeight || 'Std'} • ₹{formatCurrency(item.price)} <span className="text-brand-orange">x {item.qty}</span>
                                        </p>
                                     </div>
                                     <div className="text-sm font-normal tracking-tighter text-brand-yellow">₹ {formatCurrency(item.price * item.qty)}</div>
                                </div>
                              ))}
                            </div>

                            {/* Footer Details with Discount breakdown */}
                            <div className="grid grid-cols-1 gap-8 pt-6 border-t md:grid-cols-2 border-white/5">
                                <div className="space-y-3">
                                    <span className="flex items-center gap-2 text-[10px] font-normal text-gray-600 uppercase tracking-widest"><MapPin size={12} className="text-brand-orange"/> Delivery Address</span>
                                    {order.deliveryMethod === 'Store Pickup' ? (
                                      <p className="text-xs font-normal text-brand-orange uppercase italic bg-brand-orange/10 w-fit px-3 py-1.5 rounded-lg border border-brand-orange/20">Self Pickup at Store</p>
                                    ) : (
                                      <div className="text-xs font-normal leading-relaxed text-gray-300 uppercase">
                                        {typeof order.shippingAddress === 'object' ? (
                                            <>
                                              <p className="mb-1 text-sm text-white">{order.shippingAddress.line1}</p>
                                              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}</p>
                                            </>
                                        ) : <p>{order.shippingAddress}</p>}
                                      </div>
                                    )}
                                </div>
                                <div className="space-y-3 md:text-right">
                                    <span className="flex items-center md:justify-end gap-2 text-[10px] font-normal text-gray-500 uppercase tracking-widest">Bill Summary</span>
                                    <div className="space-y-1 text-xs font-normal tracking-widest text-gray-400 uppercase">
                                      <p>Subtotal: <span className="text-white">₹ {formatCurrency(order.subtotal || (order.totalAmount + (order.discountAmount || 0)))}</span></p>
                                      {hasDiscount && (
                                        <p className="text-green-500">Discount ({order.appliedCode}): <span className="">- ₹ {formatCurrency(order.discountAmount)}</span></p>
                                      )}
                                      <p>Method: <span className="text-white">{order.paymentMethod}</span></p>
                                      <p className={`flex items-center md:justify-end gap-2 ${isPaid ? 'text-green-400' : 'text-brand-orange'}`}>
                                          Status: {isPaid ? 'Payment Success' : 'Cash on Delivery'}
                                      </p>
                                    </div>
                                </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

const VegIndicator = ({ type }) => {
  const isVeg = type && type.toLowerCase() === 'veg';
  const color = isVeg ? '#16a34a' : '#dc2626';
  return (
    <div className="flex items-center justify-center w-3 h-3 bg-white rounded-sm shadow-sm p-[1px]">
       <div className="w-full h-full border-[1.5px] border-current flex items-center justify-center" style={{ color: color }}>
        <div className="w-1 h-1 bg-current rounded-full"></div>
      </div>
    </div>
  );
};

export default Orders;