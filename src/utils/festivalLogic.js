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
    return { emoji: "✨", animation: "float", count: 30 };

  // --- PONGAL ---
  if (isDateRange(1, 13, 17))
    return { emoji: "🍯", animation: "float", count: 25 };

  // --- REPUBLIC DAY ---
  if (month === 1 && date === 26)
    return { emoji: "🇮🇳", animation: "float", count: 25 };

  // --- VALENTINE'S WEEK ---
  if (isDateRange(2, 7, 14))
    return { emoji: "💕", animation: "float", count: 20 };

  // --- HOLI ---
  if (todayStr === currentVar.holi)
    return { emoji: "🎨", animation: "pop", count: 40 };

  // --- TAMIL NEW YEAR (PUTHANDU) ---
  if (month === 4 && date === 14)
    return { emoji: "🥭", animation: "float", count: 20 };

  // --- EID ---
  if (todayStr === currentVar.eid)
    return { emoji: "🌙", animation: "float", count: 20 };

  // --- INDEPENDENCE DAY ---
  if (month === 8 && date === 15)
    return { emoji: "🇮🇳", animation: "float", count: 20 };

  // --- VINAYAKA CHATURTHI ---
  if (todayStr === currentVar.vinayakaChaturthi)
    return { emoji: "🐘", animation: "float", count: 15 };

  // --- DIWALI ---
  if (todayStr === currentVar.diwali)
    return { emoji: "💥", animation: "pop", count: 35 };

  // --- KARTHIGAI DEEPAM ---
  if (todayStr === currentVar.karthigai)
    return { emoji: "🕯️", animation: "float", count: 25 };

  // --- CHRISTMAS ---
  if (isDateRange(12, 20, 25))
    return { emoji: "❄️", animation: "snow", count: 40 };

  return null;
};