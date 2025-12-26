// src/utils/festivalLogic.js

export const getFestivalConfig = () => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const year = today.getFullYear();

  // Updated lunar-based festival dates
  const variableFestivals = {
    2024: { diwali: "10-31", karthigai: "12-13", vinayakaChaturthi: "09-07" },
    2025: { diwali: "10-20", karthigai: "12-04", vinayakaChaturthi: "08-27" },
    2026: { diwali: "11-08", karthigai: "11-23", vinayakaChaturthi: "09-14" },
    2027: { diwali: "10-29", karthigai: "12-12", vinayakaChaturthi: "09-04" },
    2028: { diwali: "10-17", karthigai: "11-30", vinayakaChaturthi: "08-23" },
    2029: { diwali: "11-05", karthigai: "11-20", vinayakaChaturthi: "09-11" },
    2030: { diwali: "10-26", karthigai: "12-09", vinayakaChaturthi: "09-01" },
    2031: { diwali: "11-14", karthigai: "11-28", vinayakaChaturthi: "09-20" },
    2032: { diwali: "11-02", karthigai: "12-16", vinayakaChaturthi: "09-09" },
    2033: { diwali: "10-22", karthigai: "12-05", vinayakaChaturthi: "08-29" },
    2034: { diwali: "11-10", karthigai: "11-24", vinayakaChaturthi: "09-16" },
    2035: { diwali: "10-30", karthigai: "12-13", vinayakaChaturthi: "09-05" },
    2036: { diwali: "10-19", karthigai: "12-02", vinayakaChaturthi: "08-25" },
    2037: { diwali: "11-07", karthigai: "11-21", vinayakaChaturthi: "09-13" },
    2038: { diwali: "10-27", karthigai: "12-10", vinayakaChaturthi: "09-02" },
    2039: { diwali: "10-17", karthigai: "11-30", vinayakaChaturthi: "08-22" },
    2040: { diwali: "11-04", karthigai: "11-18", vinayakaChaturthi: "09-10" },
  };

  const currentVar = variableFestivals[year] || {};
  const todayStr = `${month.toString().padStart(2, "0")}-${date.toString().padStart(2, "0")}`;

  const isDateRange = (m, start, end) => month === m && date >= start && date <= end;

  // --- NEW YEAR ---
  if ((month === 12 && date >= 31) || (month === 1 && date === 2))
    return { 
      name: "New Year", emoji: "✨", userBadge: "🥳", 
      deadline: `${year + (month === 12 ? 1 : 0)}-01-01T23:59:59`,
      msg: "Happy New Year!", sub: "Start your year with crunchy treats.", 
      theme: "from-purple-600/30 to-blue-600/30",
      animation: "float", count: 30 
    };

  // --- PONGAL ---
  if (isDateRange(1, 13, 17))
    return { 
      name: "Pongal", emoji: "🍯", userBadge: "🌾", 
      deadline: `${year}-01-17T23:59:59`,
      msg: "Happy Pongal!", sub: "Let the pot boil with happiness.", 
      theme: "from-orange-500/30 to-yellow-500/30",
      animation: "float", count: 25 
    };

  // --- REPUBLIC DAY ---
if (month === 1 && date === 26)
  return { 
    name: "Republic Day", 
    emoji: "\uD83C\uDDEE\uD83C\uDDF3", // Unicode for 🇮🇳
    userBadge: "🎖️", 
    deadline: `${year}-01-26T23:59:59`,
    msg: "Happy Republic Day!", 
    sub: "Celebrating the spirit of India.", 
    theme: "from-[#FF9933]/20 via-white/10 to-[#138808]/20", // Actual Saffron and Green hex
    animation: "float", 
    count: 25,
    specialText: "PROUDLY INDIAN"
  };

  // --- VALENTINE'S WEEK ---
  if (isDateRange(2, 7, 14))
    return { 
      name: "Valentine", emoji: "💕💝", userBadge: "💌", 
      deadline: `${year}-02-14T23:59:59`,
      msg: "Season of Love! 💓", sub: "Share the sweetness with loved ones.", 
      theme: "from-pink-600/30 to-red-600/20",
      animation: "float", count: 20 
    };

  // --- HOLI ---
  if (todayStr === currentVar.holi)
    return { 
      name: "Holi", emoji: "🎨", userBadge: "🎭", 
      deadline: `${year}-${currentVar.holi}T23:59:59`,
      msg: "Happy Holi!", sub: "A festival of vibrant colors and snacks.", 
      theme: "from-pink-500/30 via-yellow-500/20 to-blue-500/30",
      animation: "pop", count: 40 
    };

  // --- TAMIL NEW YEAR (PUTHANDU) ---
  if (month === 4 && date === 14)
    return { 
      name: "Puthandu", emoji: "🥭", userBadge: "🪔", 
      deadline: `${year}-04-14T23:59:59`,
      msg: "Iniya Puthandu Vazhthukal!", sub: "Sweetness for a new beginning.", 
      theme: "from-yellow-500/30 to-green-500/30",
      animation: "float", count: 20 
    };

  // --- EID ---
  if (todayStr === currentVar.eid)
    return { 
      name: "Eid", emoji: "🌙", userBadge: "🕌", 
      deadline: `${year}-${currentVar.eid}T23:59:59`,
      msg: "Eid Mubarak!", sub: "Feast together with special sweets.", 
      theme: "from-green-700/30 to-emerald-500/20",
      animation: "float", count: 20 
    };

  // --- INDEPENDENCE DAY ---
  if (month === 8 && date === 15)
    return { 
      name: "Independence Day", emoji: "🇮🇳", userBadge: "🎗️", 
      deadline: `${year}-08-15T23:59:59`,
      msg: "Happy Independence Day!", sub: "Taste the freedom of tradition.", 
      theme: "from-orange-600/20 via-white/5 to-green-600/20",
      animation: "float", count: 20,
      specialText: "79 YEARS OF FREEDOM"
    };

  // --- VINAYAKA CHATURTHI ---
  if (todayStr === currentVar.vinayakaChaturthi)
    return { 
      name: "Vinayaka Chaturthi", emoji: "🐘", userBadge: "🪷", 
      deadline: `${year}-${currentVar.vinayakaChaturthi}T23:59:59`,
      msg: "Happy Vinayaka Chaturthi!", sub: "Ganesha's blessings to you.", 
      theme: "from-orange-600/30 to-yellow-500/30",
      animation: "float", count: 15 
    };

  // --- DIWALI ---
  if (todayStr === currentVar.diwali)
    return { 
      name: "Diwali", emoji: "💥", userBadge: "🪔", 
      deadline: `${year}-${currentVar.diwali}T23:59:59`,
      msg: "Happy Diwali!", sub: "Light up your day with crunchy snacks.", 
      theme: "from-yellow-600/40 via-red-600/20 to-brand-dark",
      animation: "pop", count: 35 
    };

  // --- KARTHIGAI DEEPAM ---
  if (todayStr === currentVar.karthigai)
    return { 
      name: "Karthigai Deepam", emoji: "🕯️", userBadge: "🔥", 
      deadline: `${year}-${currentVar.karthigai}T23:59:59`,
      msg: "Happy Karthigai Deepam!", sub: "Let the light of sweets shine.", 
      theme: "from-red-700/30 to-orange-500/20",
      animation: "float", count: 25 
    };

  // --- CHRISTMAS ---
  if (isDateRange(12, 20, 25))
    return { 
      name: "Christmas", emoji: "❄️", userBadge: "🎅", 
      deadline: `${year}-12-25T23:59:59`,
      msg: "Merry Christmas!", sub: "Wishing you a sweet holiday.", 
      theme: "from-red-600/30 to-green-600/30",
      animation: "snow", count: 40 
    };

  return null;
};