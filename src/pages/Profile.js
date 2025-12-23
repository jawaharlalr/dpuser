import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  onSnapshot, 
  collection, 
  query, 
  where 
} from 'firebase/firestore';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { motion } from 'framer-motion';
import { 
  LogOut, 
  Edit, 
  Trash2, 
  Plus, 
  X, 
  ClipboardList,
  User as UserIcon,
  MapPin,
  Phone,
  ShieldCheck,
  IndianRupee
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation(); // Hook to catch navigation state
  
  // Local State
  const [profileData, setProfileData] = useState(null); 
  const [activeTab, setActiveTab] = useState('info'); 
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Stats State
  const [stats, setStats] = useState({ orders: 0, expense: 0 }); 

  // Forms
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'Home', line1: '', city: '', state: '', zip: '', phone: ''
  });

  // --- NEW: HANDLE DIRECT NAVIGATION FROM HOME ---
  useEffect(() => {
    if (location.state?.openAddressModal) {
      setActiveTab('address');     // Switch to Address Tab
      setShowAddressForm(true);    // Open the Form automatically
      
      // Optional: Clear state so it doesn't reopen on manual refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // --- 1. REAL-TIME PROFILE SYNC ---
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileData(data);
            
            if (!isEditing) {
                setFormData({
                    name: data.name || user.displayName || '',
                    phone: data.phone || ''
                });
            }
        }
    });

    return () => unsubscribe();
  }, [user, isEditing]);

  // --- 2. CALCULATE TOTAL ORDERS & SPENT ---
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        let totalCount = 0;
        let totalSpent = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            totalCount++;
            if (data.status !== 'Cancelled') {
                totalSpent += Number(data.totalAmount) || 0;
            }
        });

        setStats({ orders: totalCount, expense: totalSpent });
    });

    return () => unsubscribe();
  }, [user]);

  // --- 3. PHONE VALIDATION HELPER ---
  const handlePhoneChange = (e, setter, field = 'phone') => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/\D/g, '').slice(0, 10);
    
    if (setter === setFormData) {
        setFormData(prev => ({ ...prev, phone: numericValue }));
    } else {
        setNewAddress(prev => ({ ...prev, [field]: numericValue }));
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Logged out successfully");
      navigate('/login');
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.name) return toast.error("Name cannot be empty");
    if (formData.phone.length !== 10) return toast.error("Phone number must be exactly 10 digits");
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        phone: formData.phone
      });
      toast.success("Profile Updated!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.line1 || !newAddress.city || !newAddress.zip) {
      return toast.error("Please fill required fields");
    }
    if (newAddress.phone && newAddress.phone.length !== 10) {
        return toast.error("Address phone must be 10 digits");
    }

    setLoading(true);
    try {
      const addressObject = {
        id: Date.now().toString(),
        ...newAddress
      };

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        addresses: arrayUnion(addressObject)
      });

      toast.success("Address Added!");
      setShowAddressForm(false);
      setNewAddress({ type: 'Home', line1: '', city: '', state: '', zip: '', phone: '' }); 
    } catch (error) {
      toast.error("Failed to add address");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if(!window.confirm("Delete this address?")) return;
    try {
      const currentAddresses = profileData.addresses || [];
      const updatedAddresses = currentAddresses.filter(addr => addr.id !== addressId);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { addresses: updatedAddresses });
      toast.success("Address Deleted");
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 pt-20 pb-24 overflow-x-hidden font-sans bg-brand-dark">
      
      {/* Decorative Background */}
      <div className="fixed top-0 right-0 w-64 h-64 rounded-full bg-brand-orange/10 blur-3xl -z-10"></div>
      <div className="fixed bottom-0 left-0 w-64 h-64 rounded-full bg-brand-red/10 blur-3xl -z-10"></div>

      <div className="relative w-full max-w-2xl">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex items-center justify-center w-24 h-24 overflow-hidden border-4 rounded-full shadow-lg border-brand-orange shadow-brand-orange/20 bg-brand-surface">
             {user?.photoURL ? (
               <img src={user.photoURL} alt="Profile" className="object-cover w-full h-full" />
             ) : (
               <span className="text-4xl font-bold text-brand-orange">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
             )}
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl italic font-black tracking-tighter text-transparent uppercase bg-clip-text bg-gradient-to-r from-brand-orange to-brand-yellow">
                {profileData?.name || user?.displayName || 'Snack Lover'}
            </h2>
            <p className="mb-4 text-sm font-medium text-gray-400">{user?.email}</p>
            
            <div className="flex justify-center gap-3">
              <Link to="/orders" className="flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all border rounded-full bg-brand-surface hover:bg-brand-red/20 border-brand-red/30">
                 <ClipboardList size={14} className="text-brand-orange"/> My Orders
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 transition-all border rounded-full bg-brand-surface hover:bg-red-900/20 border-red-500/30">
                 <LogOut size={14}/> Logout
              </button>
            </div>
          </div>
        </div>

        {/* --- STATS DISPLAY --- */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="flex flex-col items-center justify-center p-5 text-center border bg-brand-surface/50 backdrop-blur-md rounded-[24px] border-white/5">
              <div className="p-2.5 mb-2 rounded-full bg-brand-orange/10 text-brand-orange">
                 <ClipboardList size={22} />
              </div>
              <p className="text-2xl font-black text-white">{stats.orders}</p>
              <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Total Orders</p>
           </div>

           <div className="flex flex-col items-center justify-center p-5 text-center border bg-brand-surface/50 backdrop-blur-md rounded-[24px] border-white/5">
              <div className="p-2.5 mb-2 rounded-full bg-brand-yellow/10 text-brand-yellow">
                 <IndianRupee size={22} />
              </div>
              <p className="text-2xl font-black text-white">₹{stats.expense.toLocaleString()}</p>
              <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Total Spent</p>
           </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex mb-8 border-b border-white/5">
          {['info', 'address'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-brand-orange' : 'text-gray-500'}`}
            >
              {tab === 'info' ? 'Personal Info' : 'Saved Addresses'}
              {activeTab === tab && (
                <motion.span layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange shadow-[0_0_15px_rgba(255,69,0,0.5)]"></motion.span>
              )}
            </button>
          ))}
        </div>

        {/* --- CONTENT: INFO --- */}
        {activeTab === 'info' && (
          <div className="space-y-4 duration-500 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center justify-between mb-2">
                <h3 className="flex items-center gap-2 text-lg italic font-black tracking-tighter text-white uppercase">
                    <UserIcon size={18} className="text-brand-orange"/> Account Details
                </h3>
                <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full">
                  <Edit size={12}/> {isEditing ? 'Cancel' : 'Edit'}
                </button>
             </div>

             <div className="space-y-5">
                <div className="group">
                  <label className="block mb-1.5 text-[10px] font-black tracking-widest text-gray-500 uppercase">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!isEditing}
                    className="w-full p-4 text-sm font-bold text-white transition-all border outline-none bg-brand-surface rounded-2xl border-white/5 focus:border-brand-orange/50 disabled:opacity-40"
                  />
                </div>
                
                <div className="group">
                  <label className="block mb-1.5 text-[10px] font-black tracking-widest text-gray-500 uppercase">Email Address</label>
                  <input 
                    type="email" 
                    value={user?.email || ''}
                    disabled
                    className="w-full p-4 text-sm font-bold text-gray-500 border bg-brand-dark/50 rounded-2xl border-white/5 opacity-60"
                  />
                </div>

                <div className="group">
                  <label className="block mb-1.5 text-[10px] font-black tracking-widest text-gray-500 uppercase">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e, setFormData)}
                    maxLength={10}
                    disabled={!isEditing}
                    placeholder="Enter 10-digit number"
                    className="w-full p-4 text-sm font-bold text-white transition-all border outline-none bg-brand-surface rounded-2xl border-white/5 focus:border-brand-orange/50 disabled:opacity-40"
                  />
                </div>
             </div>

             {isEditing && (
               <button 
                 onClick={handleUpdateProfile}
                 disabled={loading}
                 className="w-full py-4 mt-6 text-xs font-black tracking-widest text-white uppercase transition-all shadow-xl bg-gradient-to-r from-brand-red to-brand-orange rounded-2xl active:scale-95"
               >
                 {loading ? 'Updating...' : 'Save Profile Changes'}
               </button>
             )}
             
             <div className="flex items-center justify-center gap-2 mt-12 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                <ShieldCheck size={14} className="text-green-500/50" /> Secure Account
             </div>
          </div>
        )}

        {/* --- CONTENT: ADDRESSES --- */}
        {activeTab === 'address' && (
          <div className="space-y-4 duration-500 animate-in fade-in slide-in-from-bottom-4">
            
            {profileData?.addresses && profileData.addresses.length > 0 ? (
               <div className="space-y-4">
                  {profileData.addresses.map((addr) => (
                    <div key={addr.id} className="relative p-5 border bg-brand-surface/40 rounded-[24px] border-white/5 group hover:border-brand-orange/20 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                         <span className={`text-[9px] px-2.5 py-1 rounded-full uppercase font-black tracking-widest ${
                            addr.type === 'Home' ? 'bg-blue-500/10 text-blue-400' : 
                            addr.type === 'Work' ? 'bg-purple-500/10 text-purple-400' : 
                            'bg-gray-500/10 text-gray-400'
                         }`}>
                            {addr.type}
                         </span>
                         {addr.phone && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                               <Phone size={10} /> {addr.phone}
                            </span>
                         )}
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="p-2.5 rounded-2xl bg-brand-orange/10 text-brand-orange">
                            <MapPin size={20} />
                         </div>
                         <div>
                            <p className="text-sm italic font-black tracking-tighter text-white uppercase">{addr.line1}</p>
                            <p className="mt-1 text-xs font-bold text-gray-500">{addr.city}, {addr.state} - {addr.zip}</p>
                         </div>
                      </div>

                      <button 
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="absolute p-2.5 text-gray-600 transition-all bg-brand-dark rounded-xl top-4 right-4 hover:text-red-500 hover:scale-110 shadow-lg"
                      >
                         <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
               </div>
            ) : (
                <div className="py-12 text-center text-gray-500 bg-brand-surface/20 rounded-[32px] border border-dashed border-white/5">
                   <p className="text-xs font-black tracking-widest uppercase">No addresses found</p>
                </div>
            )}

            {!showAddressForm && (
               <button 
                 onClick={() => setShowAddressForm(true)}
                 className="flex items-center justify-center w-full gap-2 py-5 font-black text-xs uppercase tracking-widest transition-all border border-dashed border-brand-orange/40 text-brand-orange rounded-[24px] hover:bg-brand-orange/5 active:scale-95"
               >
                 <Plus size={18} /> Add New Address
               </button>
            )}

            {showAddressForm && (
               <form onSubmit={handleAddAddress} className="p-6 mb-4 border bg-brand-surface rounded-[32px] border-white/5 shadow-2xl relative overflow-hidden duration-500 animate-in zoom-in-95">
                 <div className="flex items-center justify-between mb-6">
                   <h4 className="italic font-black tracking-tight text-white uppercase">New Delivery Address</h4>
                   <button type="button" onClick={() => setShowAddressForm(false)} className="p-1.5 bg-brand-dark rounded-full text-gray-500 hover:text-white"><X size={20}/></button>
                 </div>
                 
                 <div className="mb-6 space-y-4">
                   <input placeholder="Flat, House no., Building" className="w-full p-4 text-sm font-bold text-white transition-all border outline-none rounded-2xl bg-brand-dark border-white/5 focus:border-brand-orange" value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} required />
                   <div className="grid grid-cols-2 gap-4">
                       <input placeholder="City" className="p-4 text-sm font-bold text-white transition-all border outline-none rounded-2xl bg-brand-dark border-white/5 focus:border-brand-orange" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} required />
                       <input placeholder="State" className="p-4 text-sm font-bold text-white transition-all border outline-none rounded-2xl bg-brand-dark border-white/5 focus:border-brand-orange" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} required />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <input placeholder="Pincode" type="number" className="p-4 text-sm font-bold text-white transition-all border outline-none rounded-2xl bg-brand-dark border-white/5 focus:border-brand-orange" value={newAddress.zip} onChange={e => setNewAddress({...newAddress, zip: e.target.value})} required />
                       <input 
                         placeholder="Phone" 
                         type="tel" 
                         className="p-4 text-sm font-bold text-white transition-all border outline-none rounded-2xl bg-brand-dark border-white/5 focus:border-brand-orange" 
                         value={newAddress.phone} 
                         onChange={e => handlePhoneChange(e, setNewAddress, 'phone')} 
                         maxLength={10}
                       />
                   </div>
                 </div>
                 
                 <div className="flex gap-2 mb-6">
                   {['Home', 'Work', 'Other'].map(type => (
                     <button 
                       type="button" 
                       key={type}
                       onClick={() => setNewAddress({...newAddress, type})}
                       className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newAddress.type === type ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/20' : 'border-white/5 text-gray-500 hover:border-white/20'}`}
                     >
                       {type}
                     </button>
                   ))}
                 </div>

                 <button type="submit" disabled={loading} className="w-full py-4 text-xs font-black tracking-widest text-white uppercase transition-all shadow-xl bg-brand-orange rounded-2xl active:scale-95">
                   {loading ? 'Saving...' : 'Confirm & Save Address'}
                 </button>
               </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;