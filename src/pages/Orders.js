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
  Copy,
  Check,
  MapPin,
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
  };

  // Helper for the standard Rupee symbol style
  const Rupee = () => <span style={{ fontFamily: 'sans-serif', marginRight: '1px' }}>₹</span>;

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
    const s = status?.toLowerCase();
    switch (s) {
      case 'placed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'processing': return 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20';
      case 'shipped': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'out for delivery': return 'bg-brand-orange/10 text-brand-orange border-brand-orange/20';
      case 'delivered': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-brand-dark">
      <div className="w-10 h-10 border-2 rounded-full border-t-brand-orange animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen px-4 pt-20 pb-24 font-sans text-left bg-brand-dark md:pb-12 md:px-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-2xl italic font-medium tracking-tighter text-white uppercase">
              My Orders 
              <span className="text-xs font-normal text-gray-400">({orders.length})</span>
            </h1>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute w-4 h-4 text-gray-500 left-4 top-3" />
            <input 
              type="text" 
              placeholder="SEARCH ORDERS..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 pr-4 text-[10px] font-medium text-white placeholder-gray-600 transition-all border bg-brand-surface border-white/5 rounded-xl pl-11 focus:outline-none focus:border-brand-orange/50 uppercase tracking-widest"
            />
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-brand-surface border border-white/5 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl">
            <ShoppingBag className="w-12 h-12 mb-4 text-brand-orange opacity-20" />
            <h3 className="mb-2 text-lg font-medium text-white uppercase">No Orders Yet</h3>
            <Link to="/menu" className="mt-4 px-8 py-3 text-[10px] font-medium uppercase tracking-widest bg-brand-orange text-white rounded-xl transition-all active:scale-95">Browse Menu</Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, index) => {
                const totalQtyValue = order.items?.reduce((acc, item) => acc + (Number(item.qty) || 0), 0) || 0;
                const statusLower = order.status?.toLowerCase();
                const isFinalState = statusLower === 'delivered' || statusLower === 'cancelled';
                const isPaid = order.paymentStatus === 'Paid' || order.paymentMethod === 'Online';

                return (
                  <motion.div key={order.id} layout className="overflow-hidden border shadow-lg bg-brand-surface border-white/5 rounded-2xl">
                    {/* --- CARD HEADER --- */}
                    <div 
                      onClick={() => toggleExpand(order.id)}
                      className="flex flex-col justify-between gap-4 p-5 cursor-pointer hover:bg-white/[0.02] md:p-6 md:flex-row md:items-center"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-medium text-brand-orange tracking-widest uppercase">{index + 1}</span>
                          <span className="text-[11px] font-medium text-gray-100 tracking-widest uppercase">{order.orderId}</span>
                          <button onClick={(e) => handleCopyId(e, order.orderId)} className="text-gray-600 transition-colors hover:text-white">
                            {copiedId === order.orderId ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          </button>
                          <span className={`text-[9px] px-2 py-0.5 rounded border uppercase tracking-tighter ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-medium text-gray-500 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Calendar size={10} className="text-brand-orange"/> {new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock size={10} className="text-brand-orange"/> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-8 md:justify-end">
                          <div className="text-left uppercase md:text-right">
                             <p className="text-[9px] text-gray-500 mb-0.5">{order.paymentMethod}</p>
                             <p className={`text-lg font-medium tracking-tighter ${isPaid ? 'text-green-400' : 'text-brand-yellow'}`}>
                               <Rupee />{formatCurrency(order.totalAmount)}
                             </p>
                          </div>
                          <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${expandedOrderId === order.id ? 'rotate-180 text-brand-orange' : ''}`} />
                      </div>
                    </div>

                    {/* --- CARD BODY --- */}
                    <AnimatePresence>
                      {expandedOrderId === order.id && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/5 bg-black/20">
                          <div className="p-5 md:p-6">
                            
                            <div className="flex gap-3 pb-2 mb-6 overflow-x-auto scrollbar-hide">
                               <div className="px-4 py-2 border rounded-xl bg-brand-dark border-white/5 min-w-[100px]">
                                  <p className="text-[8px] text-gray-500 uppercase mb-1">Item Types</p>
                                  <p className="text-xs font-medium text-gray-100">{order.items.length}</p>
                               </div>
                               <div className="px-4 py-2 border rounded-xl bg-brand-dark border-white/5 min-w-[100px]">
                                  <p className="text-[8px] text-gray-500 uppercase mb-1">Total Qty</p>
                                  <p className="text-xs font-medium text-gray-100">{totalQtyValue} Units</p>
                               </div>
                               {order.discountAmount > 0 && (
                                 <div className="px-4 py-2 border rounded-xl bg-green-500/5 border-green-500/20 min-w-[100px]">
                                    <p className="text-[8px] text-green-600 uppercase mb-1">Savings</p>
                                    <p className="text-xs font-medium text-green-400"><Rupee /> {formatCurrency(order.discountAmount)}</p>
                                 </div>
                               )}
                            </div>

                            {order.riderName && (
                              <div className="flex items-center justify-between p-4 mb-6 border border-blue-500/10 bg-blue-500/5 rounded-2xl">
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 rounded-xl bg-brand-dark border border-blue-500/20 text-brand-orange"><Bike size={20} /></div>
                                  <div className="uppercase">
                                    <p className="text-[8px] text-blue-400 tracking-widest">Delivery Partner</p>
                                    <p className="text-sm font-medium text-gray-100">{order.riderName}</p>
                                  </div>
                                </div>
                                
                                {order.riderPhone && !isFinalState && (
                                  <a href={`tel:${order.riderPhone}`} className="px-4 py-2 text-[10px] font-medium uppercase tracking-widest bg-green-600 text-white rounded-lg shadow-lg flex items-center gap-2 active:scale-95 transition-transform">
                                    <PhoneCall size={12} /> Call Partner
                                  </a>
                                )}

                                {statusLower === 'delivered' && (
                                  <div className="flex items-center gap-1.5 text-green-500">
                                    <CheckCircle2 size={16} />
                                    <span className="text-[10px] font-medium uppercase">Delivered</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="mb-8 space-y-3">
                              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-4">Order Breakdown</p>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 border rounded-2xl bg-brand-dark border-white/5">
                                     <div className="relative flex-shrink-0 w-12 h-12 overflow-hidden border rounded-xl bg-brand-surface border-white/5">
                                        <img src={item.imageUrl} className="object-cover w-full h-full" alt={item.name} />
                                        <div className="absolute top-1 right-1">
                                          <VegIndicator type={item.type} />
                                        </div>
                                     </div>
                                     <div className="flex-1 min-w-0 text-left uppercase">
                                        <p className="text-xs font-medium text-gray-100 truncate">{item.name}</p>
                                        <p className="text-[9px] text-gray-500 mt-0.5">{item.selectedWeight} • <Rupee />{item.price} <span className="text-brand-orange">x {item.qty}</span></p>
                                     </div>
                                     <div className="text-xs font-medium tracking-tighter text-white"><Rupee /> {formatCurrency(item.price * item.qty)}</div>
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-1 gap-8 pt-6 border-t border-white/5 md:grid-cols-2">
                                <div className="text-left">
                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><MapPin size={10} className="text-brand-orange"/> Delivery Point</p>
                                    <div className="text-xs font-medium leading-relaxed text-gray-300 uppercase">
                                        {order.deliveryMethod === 'Store Pickup' ? (
                                          <p className="px-2 py-1 italic border rounded text-brand-orange bg-brand-orange/5 w-fit border-brand-orange/10">Self Pickup at Pallikaranai</p>
                                        ) : (
                                          typeof order.shippingAddress === 'object' ? (
                                            <>
                                              <p className="text-white mb-0.5">{order.shippingAddress.line1}</p>
                                              <p>{order.shippingAddress.city}, {order.shippingAddress.zip}</p>
                                            </>
                                          ) : <p>{order.shippingAddress}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-right text-[10px] uppercase font-medium tracking-widest">
                                    <div className="flex justify-between text-gray-500 md:justify-end md:gap-12"><span>Subtotal</span><span className="text-gray-100"><Rupee /> {formatCurrency(order.subtotal || order.totalAmount)}</span></div>
                                    {order.discountAmount > 0 && <div className="flex justify-between text-green-500 md:justify-end md:gap-12"><span>Coupon Applied</span><span>- <Rupee /> {formatCurrency(order.discountAmount)}</span></div>}
                                    <div className="flex justify-between pt-2 mt-2 text-white border-t md:justify-end md:gap-12 border-white/5">
                                      <span className="font-bold">Paid Total</span>
                                      <span className={`font-bold text-sm ${isPaid ? 'text-green-400' : 'text-brand-yellow'}`}>
                                        <Rupee /> {formatCurrency(order.totalAmount)}
                                      </span>
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
  const isVeg = type?.toLowerCase() === 'veg';
  const color = isVeg ? '#16a34a' : '#dc2626';
  return (
    <div className="flex items-center justify-center w-3 h-3 bg-white rounded-sm p-[1px] shadow-md">
       <div className="flex items-center justify-center w-full h-full border border-current" style={{ color }}>
        <div className="w-1 h-1 bg-current rounded-full"></div>
      </div>
    </div>
  );
};

export default Orders;