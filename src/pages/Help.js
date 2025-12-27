import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Phone, MapPin, Globe } from 'lucide-react';

const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 pt-10 pb-24 font-sans text-white sm:p-6 bg-brand-dark">
      {/* Header */}
      <div className="flex items-center max-w-2xl gap-4 mx-auto mb-10">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 transition-transform rounded-full bg-white/5 text-brand-orange active:scale-95"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl italic font-black tracking-tighter uppercase sm:text-3xl">Help & Support</h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-10">
        
        {/* About Us Section */}
        <section className="space-y-4">
          <h2 className="pl-4 text-xl font-black tracking-widest uppercase border-l-4 text-brand-orange border-brand-orange">
            About Us
          </h2>
          <div className="p-6 bg-white/5 border border-white/10 rounded-[32px] leading-relaxed text-gray-300 italic text-sm sm:text-base">
            Welcome to <span className="font-bold text-white">DP Evening Snacks & Sweets</span>. 
            We are dedicated to bringing you the most authentic and delicious traditional 
            treats, made with love and the finest ingredients. Our mission is to make 
            every evening special with a bite of happiness.
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="space-y-4">
          <h2 className="pl-4 text-xl font-black tracking-widest uppercase border-l-4 text-brand-orange border-brand-orange">
            Contact Us
          </h2>
          
          <div className="grid gap-4">
            {/* Phone Link */}
            <a href="tel:+919884609789" className="flex items-center gap-4 p-4 sm:p-5 transition-all border bg-white/5 border-white/10 rounded-2xl hover:bg-white/10 active:scale-[0.98]">
              <div className="p-3 rounded-full bg-brand-orange/20 text-brand-orange shrink-0">
                <Phone size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-black text-gray-500">Call Us</p>
                <p className="text-sm font-bold sm:text-base">+91 9884609789</p>
              </div>
            </a>

            {/* Email Link - FIXED FOR MOBILE */}
            <a href="mailto:dpeveningsnacksandsweets@gmail.com" className="flex items-center gap-4 p-4 sm:p-5 transition-all border bg-white/5 border-white/10 rounded-2xl hover:bg-white/10 active:scale-[0.98]">
              <div className="p-3 rounded-full bg-brand-orange/20 text-brand-orange shrink-0">
                <Mail size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-black text-gray-500">Email Us</p>
                {/* break-all ensures the long email wraps on small screens */}
                <p className="text-sm font-bold break-all sm:text-base sm:break-normal">
                  dpeveningsnacksandsweets@gmail.com
                </p>
              </div>
            </a>

            {/* Clickable Address Link */}
            <a 
              href="https://www.google.com/maps/search/?api=1&query=DP+Evening+Snacks+and+Sweets+Pallikaranai"
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 sm:p-5 transition-all border bg-white/5 border-white/10 rounded-2xl hover:bg-white/10 active:scale-[0.98]"
            >
              <div className="p-3 rounded-full bg-brand-orange/20 text-brand-orange shrink-0">
                <MapPin size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-black text-gray-500">Visit Us</p>
                <p className="text-sm font-bold leading-tight sm:text-base">
                  No:144, Velachery Main Road, <br />
                  Pallikaranai, Chennai - 600100
                </p>
              </div>
            </a>
          </div>
        </section>

        {/* Global Website Link */}
        <div className="flex justify-center gap-6 pt-6">
          <a 
            href="https://dpeveningsnacksandsweets.vercel.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-2 transition-all border rounded-full bg-white/5 border-white/10 hover:border-brand-orange group"
          >
            <Globe className="text-gray-500 transition-colors group-hover:text-brand-orange" size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Visit Website</span>
          </a>
        </div>

        <p className="text-center text-[10px] text-gray-600 uppercase font-black tracking-[0.3em] pb-4">
          DP Evening Snacks & Sweets v1.0
        </p>
      </div>
    </div>
  );
};

export default Help;