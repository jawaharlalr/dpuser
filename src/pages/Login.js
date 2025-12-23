import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  Sparkles, 
  PartyPopper,
  Zap
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' });

  const theme = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const todayStr = `${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;

    const variableDates = {
      2024: { diwali: "10-31", karthigai: "12-13" },
      2025: { diwali: "10-20", karthigai: "12-04" },
      2026: { diwali: "11-08", karthigai: "11-23" },
      2027: { diwali: "10-29", karthigai: "12-12" },
      2028: { diwali: "10-17", karthigai: "11-30" },
      2029: { diwali: "11-05", karthigai: "11-20" },
      2030: { diwali: "10-26", karthigai: "12-09" },
    };

    const currentVar = variableDates[year] || {};

    if (todayStr === "01-01") return {
      name: "New Year", bgImg: "/images/newyear.webp", accent: "from-purple-500 to-brand-orange", msg: "A Fresh Start with Spicy Treats!", icon: <Sparkles className="text-yellow-400" />
    };
    if (["01-14", "01-15", "01-16"].includes(todayStr)) return {
      name: "Pongal", bgImg: "/images/pongal.jpg", accent: "from-brand-orange to-yellow-400", msg: "Happy Pongal! Time to Feast.", icon: <Zap className="text-yellow-400" />
    };
    if (todayStr === "01-26") return {
      name: "National Day", bgImg: "/images/rebulicday.jpg", accent: "from-orange-500 via-white to-green-500", msg: "Pride in Every Spicy Bite!", icon: <PartyPopper className="text-orange-400" />
    };
    if (todayStr === "08-15") return {
        name: "National Day", bgImg: "/images/independenceday.webp", accent: "from-orange-500 via-white to-green-500", msg: "Pride in Every Spicy Bite!", icon: <PartyPopper className="text-orange-400" />
    };
    if (todayStr === currentVar.diwali) return {
      name: "Diwali", bgImg: "/images/diwali.jpg", accent: "from-yellow-400 to-brand-red", msg: "Happy Diwali! Lights & Snacks.", icon: <Sparkles className="text-yellow-300" />
    };
    if (todayStr === currentVar.karthigai) return {
      name: "Karthigai", bgImg: "/images/karthigaideepam.webp", accent: "from-orange-500 to-brand-red", msg: "Happy Karthigai Deepam!", icon: <Sparkles className="text-yellow-300" />
    };
    if (["12-24", "12-25"].includes(todayStr)) return {
      name: "Christmas", bgImg: "/images/christmas.webp", accent: "from-red-500 to-green-600", msg: "Merry Christmas! Sweet & Spicy.", icon: <PartyPopper className="text-red-400" />
    };

    return {
      name: "Default", bgImg: "https://images.unsplash.com/photo-1601050690597-df056fb1d745?q=80&w=2040", accent: "from-brand-red to-brand-orange", msg: "Your Daily Spicy Cravings", icon: <Sparkles className="text-brand-yellow" />
    };
  }, []);

  const toggleMode = () => {
    setIsLoginMode((prev) => !prev);
    setFormData({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid, name: user.displayName, email: user.email, role: 'customer', createdAt: new Date().toISOString(), photoURL: user.photoURL,
      }, { merge: true });
      toast.success(`Welcome, ${user.displayName || 'User'}!`);
      navigate('/');
    } catch (error) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { email, password, name, phone, confirmPassword } = formData;
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        if (!name || !phone) throw new Error("All fields are required");
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid, name, email, phone, role: 'customer', createdAt: new Date().toISOString(), addresses: []
        });
        navigate('/');
      }
    } catch (error) { toast.error(error.message.replace('Firebase: ', '')); }
    finally { setLoading(false); }
  };

  const InputField = ({ icon: Icon, type, name, placeholder }) => (
    <div className="relative mb-4 group">
      <div className="absolute transition-colors -translate-y-1/2 text-white/70 left-4 top-1/2 group-focus-within:text-brand-orange">
        <Icon size={18} />
      </div>
      <input 
        name={name} type={type} placeholder={placeholder} required
        value={formData[name] || ''} 
        onChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})}
        className="w-full py-4 pl-12 pr-4 text-white transition-all border outline-none placeholder-white/60 bg-white/20 border-white/30 rounded-2xl focus:border-brand-orange focus:bg-white/30 backdrop-blur-lg"
      />
    </div>
  );

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden font-sans bg-black">
      
      {/* 1. BACKGROUND */}
      <motion.div initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }} className="absolute inset-0 z-0">
        <img src={theme.bgImg} alt="festival-bg" className="object-cover w-full h-full" />
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
      </motion.div>

      {/* 2. FESTIVAL BADGE - Pushed higher to avoid overlap */}
      <AnimatePresence>
        {theme.name !== "Default" && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            className="absolute z-20 flex items-center gap-3 px-6 py-2 border rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] top-6 bg-white/10 backdrop-blur-xl border-white/30"
          >
            {theme.icon}
            <span className="text-[10px] sm:text-xs font-black tracking-widest text-white uppercase drop-shadow-md">{theme.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN LOGIN CARD - Added pt-12 to create space below the badge */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md mx-4 mt-12">
        <div className="bg-white/10 backdrop-blur-3xl border border-white/40 rounded-[40px] p-8 shadow-2xl overflow-hidden shadow-black/40">
          
          <div className={`absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br ${theme.accent} rounded-full blur-[70px] opacity-60`} />
          <div className={`absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-br ${theme.accent} rounded-full blur-[70px] opacity-40`} />

          {/* --- BRAND HEADER --- */}
          <div className="relative z-10 mb-6 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="flex justify-center mb-4">
              <img src="/header.webp" alt="DP Snacks Logo" className="object-contain w-auto h-20 drop-shadow-xl" />
            </motion.div>

            <h2 className="text-2xl italic font-black leading-tight tracking-tighter text-white uppercase drop-shadow-lg">
              DP Evening <br/>
              <span className="text-brand-orange">Snacks & Sweets</span>
            </h2>
            <div className={`h-1 w-16 mx-auto mt-3 rounded-full bg-gradient-to-r ${theme.accent} shadow-lg`} />
          </div>

          {/* --- FORM SECTION --- */}
          <form onSubmit={handleAuthAction} className="relative z-10">
            <AnimatePresence mode='wait'>
              {!isLoginMode && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <InputField icon={User} name="name" placeholder="Full Name" />
                  <InputField icon={Phone} name="phone" placeholder="Phone Number" />
                </motion.div>
              )}
            </AnimatePresence>

            <InputField icon={Mail} type="email" name="email" placeholder="Email Address" />
            <InputField icon={Lock} type="password" name="password" placeholder="Password" />

            {!isLoginMode && <InputField icon={Lock} type="password" name="confirmPassword" placeholder="Confirm Password" />}

            <button 
              type="submit" disabled={loading}
              className={`w-full py-4 mt-2 rounded-2xl bg-gradient-to-r ${theme.accent} text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50`}
            >
              {loading ? "Processing..." : (isLoginMode ? "Sign In" : "Register")}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="relative z-10 mt-6 text-center">
            <button 
              onClick={toggleMode}
              className="text-xs font-black tracking-widest text-white uppercase transition-colors hover:text-brand-orange drop-shadow-md"
            >
              {isLoginMode ? "Create an account" : "Log In instead"}
            </button>
          </div>

          {/* --- GOOGLE LOGIN (BOTTOM) --- */}
          <div className="relative z-10 mt-8">
            <div className="flex items-center gap-4 mb-6">
                <div className="h-[1px] flex-1 bg-white/20"></div>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Or Continue With</span>
                <div className="h-[1px] flex-1 bg-white/20"></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white/5 backdrop-blur-md border border-white/20 text-white font-black py-4 rounded-2xl flex items-center justify-center transition-all hover:bg-white/15 active:scale-[0.98] disabled:opacity-70 shadow-lg"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-3" />
              <span className="text-xs tracking-widest uppercase">Google</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center gap-2 mt-6 text-white/50">
          <Sparkles size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">DP Snacks Premium</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;