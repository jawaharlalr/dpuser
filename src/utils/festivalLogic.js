// src/utils/festivalLogic.js

export const getFestivalConfig = () => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const year = today.getFullYear();

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

  if (month === 12 && (date === 24 || date === 25))
    return { name: "Christmas", emoji: "❄️", msg: "Merry Christmas!", sub: "Wishing you a sweet & spicy holiday.", theme: "from-red-600/20 to-green-600/20" };
  
  if (month === 1 && date === 1)
    return { name: "New Year", emoji: "✨", msg: "Happy New Year!", sub: "Start your year with crunchy treats.", theme: "from-purple-600/20 to-blue-600/20" };
  
  if (month === 1 && date >= 14 && date <= 16)
    return { name: "Pongal", emoji: "🍯", msg: "Happy Pongal!", sub: "Let the pot boil with happiness.", theme: "from-orange-500/20 to-yellow-500/20" };

  if (todayStr === currentVar.vinayakaChaturthi)
    return { name: "Vinayaka Chaturthi", emoji: "🐘", msg: "Happy Vinayaka Chaturthi!", sub: "May Ganesha remove all your obstacles.", theme: "from-orange-600/20 to-yellow-500/20" };

  if (todayStr === currentVar.diwali)
    return { name: "Diwali", emoji: "💥", msg: "Happy Diwali!", sub: "Light up your day with our sweets.", theme: "from-yellow-600/20 to-red-600/20" };

  if (todayStr === currentVar.karthigai)
    return { name: "Karthigai", emoji: "🪔", msg: "Happy Karthigai Deepam!", sub: "Spreading warmth and light.", theme: "from-brand-orange/20 to-red-500/20" };

  if (month === 1 && date === 26)
    return { name: "Republic Day", emoji: "🇮🇳", displayText: "🇮🇳 INDIA", msg: "Happy Republic Day!", sub: "Celebrating India.", theme: "from-orange-500/20 via-white/10 to-green-500/20" };

  if (month === 8 && date === 15)
    return { name: "Independence Day", emoji: "🇮🇳", displayText: "🇮🇳 INDIA", msg: "Happy Independence Day!", sub: "Taste the freedom of spices.", theme: "from-orange-500/20 via-white/10 to-green-500/20" };

  return null;
};