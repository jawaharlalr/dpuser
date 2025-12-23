import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User,  
  ArrowRight, 
  Sparkles, 
  PartyPopper,
  Zap,
  CheckCircle2
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
  
  // New state for Google Phone Step
  const [googleUser, setGoogleUser] = useState(null);
  const [showPhoneStep, setShowPhoneStep] = useState(false);
  const [googlePhone, setGooglePhone] = useState('');

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
    };

    const currentVar = variableDates[year] || {};

    if (todayStr === "01-01") return { isFestival: true, bgImg: "/images/newyear.webp", accent: "from-purple-500 to-brand-orange", msg: "A Fresh Start with Spicy Treats!", icon: <Sparkles className="text-yellow-400" /> };
    if (["01-14", "01-15", "01-16"].includes(todayStr)) return { isFestival: true, bgImg: "/images/pongal.jpg", accent: "from-brand-orange to-yellow-400", msg: "Happy Pongal! Time to Feast.", icon: <Zap className="text-yellow-400" /> };
    if (todayStr === currentVar.diwali) return { isFestival: true, bgImg: "/images/diwali.jpg", accent: "from-yellow-400 to-brand-red", msg: "Happy Diwali! Lights & Snacks.", icon: <Sparkles className="text-yellow-300" /> };
    if (["12-24", "12-25"].includes(todayStr)) return { isFestival: true, bgImg: "/images/christmas.webp", accent: "from-red-500 to-green-600", msg: "Merry Christmas! Sweet & Spicy.", icon: <PartyPopper className="text-red-400" /> };

    return { isFestival: false, bgImg: "/images/loginposter.jpg", accent: "from-brand-red to-brand-orange", msg: "", icon: null };
  }, []);

  // --- Functions ---

  const toggleMode = () => {
    setIsLoginMode((prev) => !prev);
    setFormData({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
  };

  const handlePhoneChange = (val, isGoogle = false) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    if (isGoogle) setGooglePhone(cleaned);
    else setFormData({ ...formData, phone: cleaned });
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists() && userDoc.data().phone) {
        toast.success(`Welcome back, ${user.displayName || 'User'}!`);
        navigate('/');
      } else {
        setGoogleUser(user);
        setShowPhoneStep(true);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitGoogleWithPhone = async (e) => {
    e.preventDefault();
    if (googlePhone.length !== 10) return toast.error("Enter a valid 10-digit number");
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', googleUser.uid), {
        uid: googleUser.uid,
        name: googleUser.displayName,
        email: googleUser.email,
        phone: googlePhone,
        role: 'customer',
        createdAt: new Date().toISOString(),
        photoURL: googleUser.photoURL,
      }, { merge: true });
      toast.success("Profile Setup Complete!");
      navigate('/');
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
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
        if (!name || phone.length !== 10) throw new Error("Please enter a valid 10-digit phone number");
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

  // --- Sub-Components ---

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
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden font-sans bg-brand-dark">
      <motion.div initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }} className="absolute inset-0 z-0">
        <img src={theme.bgImg} alt="bg" className="object-cover w-full h-full" />
        <div className={`absolute inset-0 ${theme.isFestival ? 'bg-black/45' : 'bg-brand-dark/80'} backdrop-blur-[1px]`} />
      </motion.div>

      <AnimatePresence>
        {theme.isFestival && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute z-20 flex items-center gap-3 px-6 py-2 border rounded-full shadow-lg top-6 bg-white/10 backdrop-blur-xl border-white/30">
            {theme.icon}
            <span className="text-[10px] sm:text-xs font-black tracking-widest text-white uppercase drop-shadow-md">{theme.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`relative z-10 w-full max-w-md mx-4 ${theme.isFestival ? 'mt-12' : 'mt-0'}`}>
        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[40px] p-8 shadow-2xl overflow-hidden">
          
          <div className={`absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br ${theme.accent} rounded-full blur-[80px] opacity-40`} />
          <div className={`absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-br ${theme.accent} rounded-full blur-[80px] opacity-20`} />

          <div className="relative z-10 mb-6 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center mb-4">
              <img src="/header.webp" alt="Logo" className="object-contain w-auto h-20 drop-shadow-xl" />
            </motion.div>
            <h2 className="text-2xl italic font-black leading-tight tracking-tighter text-white uppercase">
              DP Evening <br/>
              <span className="text-brand-orange">Snacks & Sweets</span>
            </h2>
            <div className={`h-1 w-16 mx-auto mt-3 rounded-full bg-gradient-to-r ${theme.accent}`} />
          </div>

          <AnimatePresence mode="wait">
            {showPhoneStep ? (
              <motion.div key="phone-step" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <div className="mb-6 text-center">
                  <p className="text-xs font-bold tracking-widest uppercase text-brand-orange">One last step</p>
                  <p className="text-sm text-white/70">Verify your phone to complete registration</p>
                </div>
                <form onSubmit={submitGoogleWithPhone}>
                  <div className="relative mb-6 group">
                    <div className="absolute flex items-center gap-2 pr-3 font-black -translate-y-1/2 border-r text-brand-orange left-4 top-1/2 border-white/20">
                      <span className="text-sm">+91</span>
                    </div>
                    <input 
                      type="tel" placeholder="Phone Number" required
                      value={googlePhone}
                      onChange={(e) => handlePhoneChange(e.target.value, true)}
                      className="w-full py-4 pl-20 pr-4 text-white transition-all border outline-none placeholder-white/40 bg-white/10 border-white/20 rounded-2xl focus:border-brand-orange"
                    />
                  </div>
                  <button type="submit" disabled={loading || googlePhone.length !== 10} className="flex items-center justify-center w-full gap-2 py-4 font-black text-white uppercase transition-all shadow-xl rounded-2xl bg-brand-orange disabled:opacity-50 hover:brightness-110">
                    Complete Setup <CheckCircle2 size={18} />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="auth-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <form onSubmit={handleAuthAction} className="relative z-10">
                  <AnimatePresence mode='wait'>
                    {!isLoginMode && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        <InputField icon={User} name="name" placeholder="Full Name" />
                        <div className="relative mb-4 group">
                          <div className="absolute pr-2 font-bold leading-none transition-colors -translate-y-1/2 border-r text-white/70 left-4 top-1/2 group-focus-within:text-brand-orange border-white/20">
                            +91
                          </div>
                          <input 
                            name="phone" type="tel" placeholder="Phone Number" required
                            value={formData.phone || ''} 
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            className="w-full py-4 pl-16 pr-4 text-white transition-all border outline-none placeholder-white/60 bg-white/20 border-white/30 rounded-2xl focus:border-brand-orange focus:bg-white/30 backdrop-blur-lg"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <InputField icon={Mail} type="email" name="email" placeholder="Email Address" />
                  <InputField icon={Lock} type="password" name="password" placeholder="Password" />

                  {!isLoginMode && <InputField icon={Lock} type="password" name="confirmPassword" placeholder="Confirm Password" />}

                  <button type="submit" disabled={loading} className={`w-full py-4 mt-2 rounded-2xl bg-gradient-to-r ${theme.accent} text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50`}>
                    {loading ? "Authenticating..." : (isLoginMode ? "Sign In" : "Register")}
                    <ArrowRight size={18} />
                  </button>
                </form>

                <div className="relative z-10 mt-6 text-center">
                  <button onClick={toggleMode} className="text-xs font-black tracking-widest uppercase transition-colors text-white/80 hover:text-brand-orange">
                    {isLoginMode ? "Create an account" : "Log In instead"}
                  </button>
                </div>

                <div className="relative z-10 mt-8">
                  <div className="flex items-center gap-4 mb-6 text-white/20">
                    <div className="h-[1px] flex-1 bg-current"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Or Continue With</span>
                    <div className="h-[1px] flex-1 bg-current"></div>
                  </div>

                  <button onClick={handleGoogleLogin} disabled={loading} className="flex items-center justify-center w-full py-4 font-black text-white transition-all border shadow-lg bg-white/5 border-white/10 rounded-2xl hover:bg-white/10 active:scale-95 disabled:opacity-70">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-3" />
                    <span className="text-xs tracking-widest uppercase">Google</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative z-10 flex items-center justify-center gap-2 mt-6 text-white/30">
          <Sparkles size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">DP Snacks Premium</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;