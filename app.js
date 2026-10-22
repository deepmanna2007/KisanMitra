/* ═══════════════════════════════════════════════════════════════
   KisanMitra – Smart AI Farming Assistant & Deed Ledger
   Powered by Google Gemini AI
═══════════════════════════════════════════════════════════════ */

"use strict";

// Safely load Gemini API key from config.js or browser localStorage (never hardcoded in source!)
function getGeminiApiKey() {
  if (typeof CONFIG !== "undefined" && CONFIG && CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE") {
    return CONFIG.GEMINI_API_KEY;
  }
  return localStorage.getItem("kisanmitra_gemini_api_key") || "";
}

// Robust multi-model fallback list: Gemini 3.1 & 3.5 Flash Lite work reliably with Gemini API
const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.8-flash"
];

/* ════════════════════════════════════
   CROP SCIENCE PRESETS (ICAR Standards)
═════════════════════════════════════ */
const CROP_PRESETS = {
  Wheat: {
    name: "Wheat (गेहूं - Sharbati/Lokwan)",
    waterDays: 20,
    pestDays: 25,
    harvestDays: 120,
    pesticide: "Chlorpyrifos for termites; Propiconazole (Tilt) for yellow rust",
    fertilizer: "DAP 50kg/acre at sowing; Urea in 2 splits (CRI stage at 21 days & flowering)",
    notes: "Critical CRI watering stage at 21 days is mandatory. Avoid heavy water during grain filling."
  },
  Rice: {
    name: "Paddy / Rice (धान - Basmati/IR64)",
    waterDays: 4,
    pestDays: 14,
    harvestDays: 130,
    pesticide: "Cartap hydrochloride (Padan) for Stem Borer; Tricyclazole for Blast",
    fertilizer: "DAP 50kg + MOP 25kg + Zinc Sulphate 10kg at transplanting; Urea in 3 splits",
    notes: "Maintain 2-3 inches standing water during tillering and panicle initiation."
  },
  Tomato: {
    name: "Tomato (टमाटर - Hybrid)",
    waterDays: 6,
    pestDays: 10,
    harvestDays: 85,
    pesticide: "Mancozeb for Early/Late Blight; Spinosad or Coragen for Fruit Borer",
    fertilizer: "NPK 19:19:19 foliar spray; Calcium nitrate to prevent blossom end rot",
    notes: "Staking is recommended. Drip irrigation prevents fungal foliar diseases."
  },
  Cotton: {
    name: "Cotton (कपास - Bt Cotton)",
    waterDays: 12,
    pestDays: 15,
    harvestDays: 160,
    pesticide: "Flonicamid for whitefly and jassids; Neem oil 1500ppm preventive spray",
    fertilizer: "DAP + Potash at sowing; 3 splits of Urea + Magnesium sulphate",
    notes: "Avoid waterlogging. Monitor for Pink Bollworm using pheromone traps."
  },
  Mustard: {
    name: "Mustard (सरसों - Pusa Bold)",
    waterDays: 25,
    pestDays: 15,
    harvestDays: 110,
    pesticide: "Dimethoate (Rogor) or Imidacloprid for Aphid (Mahu) control",
    fertilizer: "Single Super Phosphate (SSP) 100kg + Urea 35kg at sowing; Sulphur 10kg",
    notes: "First irrigation at 30-35 days (pre-flowering), second at pod formation (60 days)."
  },
  Soybean: {
    name: "Soybean (सोयाबीन - JS 9560)",
    waterDays: 12,
    pestDays: 14,
    harvestDays: 95,
    pesticide: "Chlorantraniliprole (Coragen) for Girdle Beetle and Spodoptera caterpillar",
    fertilizer: "DAP 50kg + Potash 20kg at sowing; Rhizobium seed treatment",
    notes: "Rainfed crop. Provide life-saving irrigation at pod development if drought occurs."
  },
  Potato: {
    name: "Potato (आलू - Kufri Jyoti)",
    waterDays: 8,
    pestDays: 12,
    harvestDays: 90,
    pesticide: "Ridomil Gold / Mancozeb preventive spray against Late Blight",
    fertilizer: "DAP 100kg + MOP 50kg + Urea 50kg at planting; Earthing up at 30 days",
    notes: "Stop irrigation 10-12 days before digging to cure tuber skin."
  },
  Gram: {
    name: "Gram / Chana (चना - Desi/Kabuli)",
    waterDays: 30,
    pestDays: 18,
    harvestDays: 110,
    pesticide: "Emamectin Benzoate for Pod Borer (Helicoverpa)",
    fertilizer: "DAP 40kg/acre; No extra Urea needed (nitrogen-fixing legume)",
    notes: "Nipping apical shoots at 30-40 days increases branching and pods. Avoid water at peak flowering."
  }
};

/* ════════════════════════════════════
   BENCHMARK MANDI PRICES (India)
═════════════════════════════════════ */
const INITIAL_MARKET_PRICES = [
  { id: "m1", crop: "Wheat (गेहूं)", price: 2475, market: "Indore Mandi", state: "Madhya Pradesh", date: "2026-10-22", trend: "up" },
  { id: "m2", crop: "Soybean (सोयाबीन)", price: 4620, market: "Ujjain Mandi", state: "Madhya Pradesh", date: "2026-10-22", trend: "up" },
  { id: "m3", crop: "Paddy/Rice (धान)", price: 2320, market: "Karnal Mandi", state: "Haryana", date: "2026-10-21", trend: "flat" },
  { id: "m4", crop: "Cotton (कपास)", price: 7450, market: "Rajkot APMC", state: "Gujarat", date: "2026-10-22", trend: "up" },
  { id: "m5", crop: "Mustard (सरसों)", price: 5850, market: "Bharatpur Mandi", state: "Rajasthan", date: "2026-10-21", trend: "down" },
  { id: "m6", crop: "Tomato (टमाटर)", price: 1800, market: "Azadpur Mandi", state: "Delhi", date: "2026-10-22", trend: "up" },
  { id: "m7", crop: "Potato (आलू)", price: 1650, market: "Agra Mandi", state: "Uttar Pradesh", date: "2026-10-22", trend: "flat" },
  { id: "m8", crop: "Onion (प्याज)", price: 2850, market: "Lasalgaon Mandi", state: "Maharashtra", date: "2026-10-21", trend: "up" },
  { id: "m9", crop: "Gram/Chana (चना)", price: 6150, market: "Neemuch Mandi", state: "Madhya Pradesh", date: "2026-10-20", trend: "up" },
  { id: "m10", crop: "Maize (मक्का)", price: 2150, market: "Chhindwara Mandi", state: "Madhya Pradesh", date: "2026-10-20", trend: "flat" }
];

/* ════════════════════════════════════
   DEFAULT DEMO FARM STATE
═════════════════════════════════════ */
function getDefaultState() {
  const t = today();
  const dMinus2 = addDays(t, -2);
  const dMinus5 = addDays(t, -5);
  const dPlus3 = addDays(t, 3);
  const dPlus12 = addDays(t, 12);
  const dPlus90 = addDays(t, 90);

  return {
    farmer: {
      name: "Ramesh Patel",
      location: "Ratlam, Madhya Pradesh",
      area: "5.5",
      lang: "hindi"
    },
    crops: [
      {
        id: "c_demo_1",
        name: "Wheat (गेहूं - Lokwan)",
        area: "3.5",
        plantDate: dMinus5,
        harvestDate: dPlus90,
        waterDays: 20,
        lastWatered: dMinus5,
        pestDays: 25,
        lastPest: dMinus5,
        pesticide: "Chlorpyrifos & Tilt",
        fertilizer: "DAP 50kg at sowing, Urea at 21 days",
        notes: "Field #1 near canal. Next irrigation due at Crown Root Initiation (CRI)."
      },
      {
        id: "c_demo_2",
        name: "Tomato (टमाटर - Hybrid)",
        area: "2.0",
        plantDate: addDays(t, -20),
        harvestDate: addDays(t, 45),
        waterDays: 6,
        lastWatered: dMinus5, // Due tomorrow!
        pestDays: 10,
        lastPest: addDays(t, -8), // Due in 2 days!
        pesticide: "Mancozeb for Early Blight prevention",
        fertilizer: "NPK 19:19:19 foliar spray",
        notes: "Flowering stage started. Drip irrigation active."
      }
    ],
    marketPrices: [...INITIAL_MARKET_PRICES],
    expenses: [
      { id: "e1", type: "expense", category: "Seeds (बीज)", amount: 4800, date: dMinus5, desc: "Wheat certified seeds (Lokwan - 3 bags)", crop: "Wheat" },
      { id: "e2", type: "expense", category: "Fertilizer / Urea / DAP (खाद)", amount: 5200, date: dMinus5, desc: "4 bags DAP from IFFCO Society", crop: "Wheat" },
      { id: "e3", type: "expense", category: "Diesel / Fuel (डीजल / पेट्रोल)", amount: 3200, date: dMinus2, desc: "Tractor ploughing and laser levelling", crop: "Wheat" },
      { id: "e4", type: "income", category: "Crop Sale (फसल बिक्री)", amount: 28000, date: addDays(t, -15), desc: "Sold 6 quintals early tomato harvest to local trader", crop: "Tomato" }
    ],
    dues: [
      {
        id: "d1",
        person: "Shri Kisan Khad & Beej Kendra",
        type: "payable",
        amount: 8500,
        dueDate: dPlus12,
        phone: "9826012345",
        interest: "0% (Interest-free shop credit)",
        reason: "Fertilizer & Pesticide purchase deed on 30-day credit",
        notes: "Payable after first vegetable harvesting.",
        status: "pending"
      },
      {
        id: "d2",
        person: "Tractor Hire - Gurmeet Singh",
        type: "payable",
        amount: 3500,
        dueDate: addDays(t, -1), // Overdue!
        phone: "9827054321",
        interest: "0%",
        reason: "Rotavator field preparation deed",
        notes: "Need to pay cash or UPI.",
        status: "pending"
      },
      {
        id: "d3",
        person: "Mohan Lal (Mandi Vyapari)",
        type: "receivable",
        amount: 14000,
        dueDate: dPlus3,
        phone: "9425098765",
        interest: "0%",
        reason: "Pending payment for tomato supply lot #4",
        notes: "Promised cheque on Thursday mandi visit.",
        status: "pending"
      }
    ],
    chatHistory: []
  };
}

/* ════════════════════════════════════
   APPLICATION STATE
═════════════════════════════════════ */
let state = {
  farmer: { name: "", location: "", area: "", lang: "hindi" },
  crops: [],
  marketPrices: [],
  expenses: [],
  dues: [],
  chatHistory: []
};

function saveState() {
  localStorage.setItem("kisanmitra_farm_state_v2", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("kisanmitra_farm_state_v2");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.farmer && parsed.farmer.name) {
        state = { ...state, ...parsed };
        return;
      }
    } catch (e) { console.warn("Failed to parse state:", e); }
  }
  // Initialize with realistic demo data so the app is instantly functional!
  state = getDefaultState();
  saveState();
}

/* ════════════════════════════════════
   GEMINI AI MULTI-MODEL CALLER
═════════════════════════════════════ */
async function callGemini(prompt, systemContext = "") {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.info("No Gemini API key configured. Using local agricultural intelligence.");
    return generateLocalFarmAdvice(prompt);
  }

  const systemMsg = systemContext || buildFarmContext();
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `SYSTEM DIRECTIVE:\n${systemMsg}\n\nUSER REQUEST:\n${prompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Model ${model} returned ${response.status}:`, errText);
        lastError = new Error(`Model ${model}: ${response.status}`);
        continue; // Try next model in list
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      console.warn(`Fetch error on ${model}:`, err);
      lastError = err;
    }
  }

  // Graceful fallback if network is completely down
  console.error("All Gemini models failed, using local agricultural fallback", lastError);
  return generateLocalFarmAdvice(prompt);
}

async function callGeminiChat(messages) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.info("No Gemini API key configured. Using local agricultural intelligence.");
    const lastUserMsg = messages[messages.length - 1]?.text || "";
    return generateLocalFarmAdvice(lastUserMsg);
  }

  const systemText = `SYSTEM: ${buildFarmContext()}\nYou are KisanMitra, an expert Indian agricultural advisor. Answer warmly in ${state.farmer.lang === "hindi" ? "Hindi (हिन्दी)" : "English"}. Give practical, actionable advice with dosage and timing.`;

  const contents = [
    { role: "user", parts: [{ text: systemText }] },
    { role: "model", parts: [{ text: "राम-राम किसान भाई! मैं किसान मित्र हूँ। पूछिए आपकी फसल या खेती का क्या सवाल है?" }] }
  ];

  messages.forEach(m => {
    contents.push({
      role: m.role === "bot" ? "model" : m.role,
      parts: [{ text: m.text }]
    });
  });

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.warn(`Chat model ${model} error:`, e);
    }
  }

  // Local fallback reply
  const lastUserMsg = messages[messages.length - 1]?.text || "";
  return generateLocalFarmAdvice(lastUserMsg);
}

function buildFarmContext() {
  const crops = state.crops.map(c =>
    `- ${c.name}: ${c.area} acres, Planted: ${c.plantDate}, Water every ${c.waterDays}d (Last: ${c.lastWatered}), Pesticide every ${c.pestDays}d (Last: ${c.lastPest}), Fertilizer: ${c.fertilizer || "N/A"}`
  ).join("\n");

  const dues = state.dues.map(d =>
    `- ${d.type === "payable" ? "PAYABLE TO" : "RECEIVABLE FROM"} ${d.person}: ₹${d.amount} (Due: ${d.dueDate || "N/A"}, Reason: ${d.reason})`
  ).join("\n");

  const totalExpense = state.expenses.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const totalIncome = state.expenses.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);

  return `FARMER PROFILE:
Name: ${state.farmer.name || "Kisan"}
Location: ${state.farmer.location || "India"}
Total Land: ${state.farmer.area || "5"} acres
Language: ${state.farmer.lang}

ACTIVE CROPS IN FIELD:
${crops || "No crops recorded"}

DEED & LOAN LEDGER (BAHI-KHATA):
${dues || "No deeds recorded"}

FINANCIAL POSITION:
Total Income: ₹${totalIncome}
Total Expense: ₹${totalExpense}
Net Profit: ₹${totalIncome - totalExpense}`;
}

// Built-in Indian agricultural knowledge base fallback (works 100% offline)
function generateLocalFarmAdvice(query) {
  const q = query.toLowerCase();
  if (q.includes("पानी") || q.includes("water") || q.includes("irrigation") || q.includes("गेहूं")) {
    return `🌾 **गेहूं में सिंचाई सलाह (Watering Advice):**\n\n1. **पहला पानी (CRI अवस्था):** बुवाई के 20-22 दिन बाद अवश्य दें। यह जड़ों के विकास के लिए सबसे जरूरी है। इसके साथ 35 किलो यूरिया प्रति एकड़ दें।\n2. **दूसरा पानी (कल्ले फूटते समय):** 40-45 दिन बाद दें।\n3. **तीसरा पानी (गाभा/तने की गांठ):** 60-65 दिन बाद।\n4. **चौथा पानी (फूल व बालियां निकलते समय):** 80-85 दिन बाद।\n5. **पांचवां पानी (दूधिया अवस्था):** 100-105 दिन बाद।\n\n💡 *सलाह:* बालियां आते समय तेज हवा में पानी न दें, फसल गिर सकती है।`;
  }
  if (q.includes("टमाटर") || q.includes("tomato") || q.includes("पीली") || q.includes("blight")) {
    return `🍅 **टमाटर में पत्ती पीली पड़ना व रोग रोकथाम:**\n\n- **कारण:** अक्सर अगेती झुलसा (Early Blight) या सूक्ष्म पोषक तत्वों (Zinc/Iron) की कमी से पत्तियां पीली होती हैं।\n- **दवा उपचार:**\n  1. साफ (Saaf) या मेंकोजेब (Mancozeb) 2 ग्राम प्रति लीटर पानी में मिलाकर स्प्रे करें।\n  2. यदि रस चूसक कीट हैं, तो नीम तेल (1500 ppm) 3ml/लीटर या एसिटामिप्रिड 0.5gm/लीटर मिलाएं।\n  3. 19:19:19 घुलनशील खाद का हल्का स्प्रे 15 दिन में एक बार करें।`;
  }
  if (q.includes("खर्च") || q.includes("expense") || q.includes("finance") || q.includes("बजट")) {
    return `💰 **खेती खर्च कम करने के 4 सुनहरे उपाय:**\n\n1. **संतुलित खाद:** अंधाधुंध यूरिया न डालें। सॉइल टेस्ट के अनुसार डीएपी और पोटाश का सही अनुपात प्रयोग करें। नैनो यूरिया (Nano Urea) स्प्रे से 30% खर्च बचता है।\n2. **कीटनाशक का सही समय:** कीट की प्रारंभिक अवस्था में ही नीम ऑयल या जैविक कीटनाशक डालें। अधिक संक्रमण होने पर ही महंगे रसायन का छिड़काव करें।\n3. **डीजल की बचत:** लेजर लैंड लेवलर से समतल खेत में 25% कम सिंचाई और ट्रैक्टर समय लगता है।\n4. **उधार और ब्याज:** साहूकारों के महंगे ब्याज (2-3% प्रति माह) से बचें; KCC (किसान क्रेडिट कार्ड) से 4% वार्षिक रियायती ऋण का उपयोग करें।`;
  }
  return `🌾 **किसान मित्र सलाह:**\n\nआपकी खेत की स्थिति के अनुसार सलाह तैयार की गई है।\n- अपनी खड़ी फसलों में नमी की जांच करके ही सिंचाई करें।\n- कीटनाशक छिड़काव सुबह 8 से 11 बजे या शाम 4 बजे के बाद करें जब धूप मध्यम हो।\n- अपने बही-खाते में बकाया देनदारियों का समय पर निपटारा करें ताकि ब्याज न बढ़े।\n\nअधिक सटीक जानकारी के लिए अपनी फसल का नाम व समस्या लिखकर पूछें!`;
}

/* ════════════════════════════════════
   DATE & FORMAT UTILITIES
═════════════════════════════════════ */
function today() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr, days) {
  const dt = new Date(dateStr + "T00:00:00");
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().split("T")[0];
}

function daysBetween(d1, d2) {
  const t1 = new Date(d1 + "T00:00:00").getTime();
  const t2 = new Date(d2 + "T00:00:00").getTime();
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

function formatDate(d) {
  if (!d) return "–";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateShort(d) {
  if (!d) return "–";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatINR(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

function genId() {
  return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
}

/* ════════════════════════════════════
   TAB NAVIGATION
═════════════════════════════════════ */
function switchTab(tab) {
  document.querySelectorAll(".tab-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  const targetSection = document.getElementById(`tab-${tab}`);
  const targetNav = document.getElementById(`nav-${tab}`);

  if (targetSection) targetSection.classList.add("active");
  if (targetNav) targetNav.classList.add("active");

  closeSidebar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
window.switchTab = switchTab;

const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");

if (menuToggle && sidebar) {
  menuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
}

function closeSidebar() {
  if (sidebar) sidebar.classList.remove("open");
}

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.tab) switchTab(btn.dataset.tab);
  });
});

/* ════════════════════════════════════
   PROFILE / SETUP
═════════════════════════════════════ */
function applyFarmerProfile() {
  const name = state.farmer.name || "Kisan Bhai";
  const loc = state.farmer.location || "Your Farm";

  const d1 = document.getElementById("farmer-name-display");
  const d2 = document.getElementById("farmer-location-display");
  const d3 = document.getElementById("farmer-name-h1");
  const d4 = document.getElementById("quick-city");

  if (d1) d1.textContent = name;
  if (d2) d2.textContent = loc;
  if (d3) d3.textContent = name;
  if (d4) d4.textContent = loc.split(",")[0].trim();

  const langLabel = document.getElementById("current-lang-label");
  if (langLabel) {
    langLabel.textContent = state.farmer.lang === "hindi" ? "हिन्दी" : "English";
  }
}

document.getElementById("edit-profile-btn")?.addEventListener("click", () => {
  document.getElementById("setup-name").value = state.farmer.name || "";
  document.getElementById("setup-location").value = state.farmer.location || "";
  document.getElementById("setup-area").value = state.farmer.area || "";
  document.getElementById("setup-lang").value = state.farmer.lang || "hindi";
  const apiKeyField = document.getElementById("setup-api-key");
  if (apiKeyField) apiKeyField.value = getGeminiApiKey();
  document.getElementById("setup-modal")?.classList.remove("hidden");
});

document.getElementById("setup-save-btn")?.addEventListener("click", () => {
  const name = document.getElementById("setup-name").value.trim();
  const location = document.getElementById("setup-location").value.trim();
  const area = document.getElementById("setup-area").value.trim();
  const lang = document.getElementById("setup-lang").value;
  const apiKeyInput = document.getElementById("setup-api-key")?.value.trim();

  if (!name) { alert("Please enter your name!"); return; }

  if (apiKeyInput) {
    localStorage.setItem("kisanmitra_gemini_api_key", apiKeyInput);
  }

  state.farmer = { name, location: location || "India", area: area || "5", lang };
  saveState();
  document.getElementById("setup-modal")?.classList.add("hidden");
  applyFarmerProfile();
  renderAll();
});

document.getElementById("setup-demo-btn")?.addEventListener("click", () => {
  state = getDefaultState();
  saveState();
  document.getElementById("setup-modal")?.classList.add("hidden");
  applyFarmerProfile();
  renderAll();
});

document.getElementById("load-demo-btn")?.addEventListener("click", () => {
  showConfirm("Load sample farm demo data? (This will refresh your dashboard with sample crops, expenses, and deeds)", () => {
    state = getDefaultState();
    saveState();
    applyFarmerProfile();
    renderAll();
  });
});

document.getElementById("lang-toggle-btn")?.addEventListener("click", () => {
  state.farmer.lang = state.farmer.lang === "hindi" ? "english" : "hindi";
  saveState();
  applyFarmerProfile();
  renderDashboard();
});

/* ════════════════════════════════════
   DASHBOARD RENDERING
═════════════════════════════════════ */
function renderDashboard() {
  const tod = today();

  // Active crops count
  const statCrops = document.getElementById("stat-crops");
  if (statCrops) statCrops.textContent = state.crops.length;

  // Water due count (due today or within 1 day)
  const waterDueCount = state.crops.filter(c => {
    if (!c.lastWatered || !c.waterDays) return false;
    const nextDate = addDays(c.lastWatered, parseInt(c.waterDays));
    return daysBetween(tod, nextDate) <= 1;
  }).length;
  const statWater = document.getElementById("stat-water-due");
  if (statWater) statWater.textContent = waterDueCount;

  // Total Deed Payable
  const totalPayable = state.dues.filter(d => d.type === "payable" && d.status !== "paid")
    .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  const statDues = document.getElementById("stat-dues");
  if (statDues) statDues.textContent = formatINR(totalPayable);

  // Total Receivable
  const totalReceivable = state.dues.filter(d => d.type === "receivable" && d.status !== "paid")
    .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  const statRecv = document.getElementById("stat-receivables");
  if (statRecv) statRecv.textContent = formatINR(totalReceivable);

  // Update sidebar due badge
  const sidebarDueBadge = document.getElementById("sidebar-due-badge");
  const pendingCount = state.dues.filter(d => d.status !== "paid").length;
  if (sidebarDueBadge) {
    if (pendingCount > 0) {
      sidebarDueBadge.textContent = pendingCount;
      sidebarDueBadge.style.display = "inline-block";
    } else {
      sidebarDueBadge.style.display = "none";
    }
  }

  renderAlerts();
  renderSchedule();
  renderMiniDues();
}

function renderAlerts() {
  const list = document.getElementById("alerts-list");
  const badge = document.getElementById("alerts-count-badge");
  if (!list) return;

  const tod = today();
  const alerts = [];

  // 1. Crop water alerts
  state.crops.forEach(c => {
    if (c.waterDays && c.lastWatered) {
      const next = addDays(c.lastWatered, parseInt(c.waterDays));
      const diff = daysBetween(tod, next);
      if (diff < 0) {
        alerts.push({
          type: "urgent",
          icon: "💧",
          title: `OVERDUE: Water ${c.name}`,
          desc: `Irrigation was due ${Math.abs(diff)} day(s) ago (Scheduled: ${formatDate(next)})!`
        });
      } else if (diff === 0) {
        alerts.push({
          type: "urgent",
          icon: "💧",
          title: `TODAY: Give Water to ${c.name}`,
          desc: `Irrigation scheduled for today on ${c.area || "–"} acres.`
        });
      } else if (diff <= 2) {
        alerts.push({
          type: "warning",
          icon: "💧",
          title: `SOON: Water ${c.name} in ${diff} day(s)`,
          desc: `Prepare pump & field channels for ${formatDate(next)}.`
        });
      }
    }

    // 2. Pesticide alerts
    if (c.pestDays && c.lastPest) {
      const nextPest = addDays(c.lastPest, parseInt(c.pestDays));
      const diffPest = daysBetween(tod, nextPest);
      if (diffPest < 0) {
        alerts.push({
          type: "urgent",
          icon: "🐛",
          title: `OVERDUE: Pesticide spray for ${c.name}`,
          desc: `Spray was due ${Math.abs(diffPest)} day(s) ago (${c.pesticide || "Recommended spray"}).`
        });
      } else if (diffPest === 0) {
        alerts.push({
          type: "warning",
          icon: "🐛",
          title: `TODAY: Pesticide spray for ${c.name}`,
          desc: `Recommended: ${c.pesticide || "Spray as planned"}. Check wind speed before spraying.`
        });
      }
    }
  });

  // 3. Deed / Finance alerts
  state.dues.filter(d => d.status !== "paid").forEach(d => {
    if (d.dueDate) {
      const diff = daysBetween(tod, d.dueDate);
      if (diff < 0) {
        alerts.push({
          type: "urgent",
          icon: "💸",
          title: `DEED OVERDUE: ${d.type === "payable" ? "Pay to" : "Collect from"} ${d.person}`,
          desc: `${formatINR(d.amount)} was due ${Math.abs(diff)} day(s) ago on ${formatDate(d.dueDate)} (${d.reason || "Deed"}).`
        });
      } else if (diff <= 3) {
        alerts.push({
          type: "warning",
          icon: "🤝",
          title: `DEED DUE in ${diff === 0 ? "Today" : diff + " days"}: ${d.person}`,
          desc: `${formatINR(d.amount)} due on ${formatDate(d.dueDate)}.`
        });
      }
    }
  });

  if (badge) badge.textContent = `${alerts.length} Alert${alerts.length === 1 ? "" : "s"}`;

  if (alerts.length === 0) {
    list.innerHTML = `<div class="alert-empty">✅ All caught up! Crops are watered, sprays on track, and deeds are clear.</div>`;
  } else {
    list.innerHTML = alerts.map(a => `
      <div class="alert-item ${a.type}">
        <span class="alert-icon">${a.icon}</span>
        <div class="alert-text">
          <strong>${a.title}</strong>
          <span>${a.desc}</span>
        </div>
      </div>
    `).join("");
  }
}

function renderSchedule() {
  const list = document.getElementById("schedule-list");
  if (!list) return;

  const tod = today();
  const schedule = [];

  state.crops.forEach(c => {
    if (c.waterDays && c.lastWatered) {
      const next = addDays(c.lastWatered, parseInt(c.waterDays));
      const diff = daysBetween(tod, next);
      if (diff >= 0 && diff <= 7) {
        schedule.push({ type: "water", icon: "💧", title: `Water ${c.name}`, date: next, diff });
      }
    }
    if (c.pestDays && c.lastPest) {
      const nextP = addDays(c.lastPest, parseInt(c.pestDays));
      const diffP = daysBetween(tod, nextP);
      if (diffP >= 0 && diffP <= 7) {
        schedule.push({ type: "pest", icon: "🐛", title: `Spray ${c.name}`, date: nextP, diff: diffP });
      }
    }
    if (c.harvestDate) {
      const diffH = daysBetween(tod, c.harvestDate);
      if (diffH >= 0 && diffH <= 14) {
        schedule.push({ type: "harvest", icon: "🌾", title: `Harvest ${c.name}`, date: c.harvestDate, diff: diffH });
      }
    }
  });

  schedule.sort((a, b) => a.diff - b.diff);

  if (schedule.length === 0) {
    list.innerHTML = `<div class="empty-state">No watering or sprays scheduled in next 7 days.</div>`;
  } else {
    list.innerHTML = schedule.map(s => `
      <div class="schedule-item">
        <div class="schedule-dot ${s.type}"></div>
        <div class="schedule-info">
          <strong>${s.icon} ${s.title}</strong>
          <span>${s.diff === 0 ? "Today" : `In ${s.diff} day(s)`}</span>
        </div>
        <div class="schedule-date">${formatDateShort(s.date)}</div>
      </div>
    `).join("");
  }
}

function renderMiniDues() {
  const container = document.getElementById("mini-dues-list");
  if (!container) return;

  const activeDues = state.dues.filter(d => d.status !== "paid").slice(0, 4);
  if (activeDues.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:16px;">No pending deeds or loans. All clear! 🎉</div>`;
    return;
  }

  container.innerHTML = activeDues.map(d => `
    <div class="mini-due-row">
      <div>
        <div class="mini-due-person">${d.type === "payable" ? "📤 Pay to:" : "📥 Collect:"} ${d.person}</div>
        <div class="mini-due-reason">${d.reason || "Farm deed"} • Due: ${formatDateShort(d.dueDate)}</div>
      </div>
      <div class="mini-due-amt ${d.type}">${formatINR(d.amount)}</div>
    </div>
  `).join("");
}

/* ════════════════════════════════════
   CROP MANAGER & AUTO-PRESETS
═════════════════════════════════════ */
let editingCropId = null;

function applyCropPreset(cropKey) {
  const preset = CROP_PRESETS[cropKey];
  if (!preset) return;

  document.getElementById("crop-name").value = preset.name;
  document.getElementById("crop-water-days").value = preset.waterDays;
  document.getElementById("crop-pest-days").value = preset.pestDays;
  document.getElementById("crop-pesticide-name").value = preset.pesticide;
  document.getElementById("crop-fertilizer").value = preset.fertilizer;
  document.getElementById("crop-notes").value = preset.notes;

  const sowDate = document.getElementById("crop-plant-date").value || today();
  document.getElementById("crop-harvest-date").value = addDays(sowDate, preset.harvestDays);
}
window.applyCropPreset = applyCropPreset;

document.getElementById("add-crop-btn")?.addEventListener("click", () => {
  editingCropId = null;
  clearCropForm();
  document.getElementById("crop-form-title").textContent = "🌱 Add New Crop Schedule";
  document.getElementById("crop-plant-date").value = today();
  document.getElementById("crop-last-watered").value = today();
  document.getElementById("crop-last-pest").value = today();
  document.getElementById("crop-form-card")?.classList.remove("hidden");
  document.getElementById("crop-form-card")?.scrollIntoView({ behavior: "smooth" });
});

document.getElementById("close-crop-form")?.addEventListener("click", () => {
  document.getElementById("crop-form-card")?.classList.add("hidden");
});

document.getElementById("cancel-crop-btn")?.addEventListener("click", () => {
  document.getElementById("crop-form-card")?.classList.add("hidden");
});

function clearCropForm() {
  [
    "crop-name", "crop-area", "crop-plant-date", "crop-harvest-date",
    "crop-water-days", "crop-last-watered", "crop-pest-days", "crop-last-pest",
    "crop-pesticide-name", "crop-fertilizer", "crop-notes", "crop-edit-id"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

// AI Auto Optimize Crop Schedule
document.getElementById("ai-auto-crop-btn")?.addEventListener("click", async () => {
  const cropName = document.getElementById("crop-name").value.trim();
  if (!cropName) {
    alert("Please enter a crop name first (e.g. Wheat, Mustard, Cotton)!");
    return;
  }

  showLoading(`Gemini AI is calculating optimal irrigation & spray schedule for ${cropName}...`);
  try {
    const prompt = `For the crop "${cropName}" grown in India (${state.farmer.location}), return the scientifically recommended schedule:
1. Watering interval (in days)
2. Pesticide spray interval (in days) and recommended chemical/bio pesticide
3. Fertilizer dosage
4. Days to maturity (harvest days)
5. Brief field management advice

Format your reply strictly as JSON:
{
  "waterDays": 15,
  "pestDays": 20,
  "pesticide": "Name of recommended spray",
  "fertilizer": "Dosage schedule",
  "harvestDays": 120,
  "notes": "Key practical advice"
}`;

    const raw = await callGemini(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      if (data.waterDays) document.getElementById("crop-water-days").value = data.waterDays;
      if (data.pestDays) document.getElementById("crop-pest-days").value = data.pestDays;
      if (data.pesticide) document.getElementById("crop-pesticide-name").value = data.pesticide;
      if (data.fertilizer) document.getElementById("crop-fertilizer").value = data.fertilizer;
      if (data.notes) document.getElementById("crop-notes").value = data.notes;
      if (data.harvestDays) {
        const sow = document.getElementById("crop-plant-date").value || today();
        document.getElementById("crop-harvest-date").value = addDays(sow, data.harvestDays);
      }
    }
  } catch (err) {
    console.warn("AI Crop calculation fallback:", err);
    // Fallback to general preset
    applyCropPreset("Wheat");
  } finally {
    hideLoading();
  }
});

document.getElementById("save-crop-btn")?.addEventListener("click", () => {
  const name = document.getElementById("crop-name").value.trim();
  const area = document.getElementById("crop-area").value.trim();
  const waterDays = document.getElementById("crop-water-days").value.trim();
  const pestDays = document.getElementById("crop-pest-days").value.trim();

  if (!name) { alert("Please enter crop name!"); return; }
  if (!waterDays) { alert("Please enter watering interval in days!"); return; }

  const crop = {
    id: editingCropId || genId(),
    name,
    area: area || "1",
    plantDate: document.getElementById("crop-plant-date").value || today(),
    harvestDate: document.getElementById("crop-harvest-date").value || addDays(today(), 100),
    waterDays: parseInt(waterDays) || 10,
    lastWatered: document.getElementById("crop-last-watered").value || today(),
    pestDays: parseInt(pestDays) || 15,
    lastPest: document.getElementById("crop-last-pest").value || today(),
    pesticide: document.getElementById("crop-pesticide-name").value || "",
    fertilizer: document.getElementById("crop-fertilizer").value || "",
    notes: document.getElementById("crop-notes").value || "",
    updatedAt: today()
  };

  if (editingCropId) {
    const idx = state.crops.findIndex(c => c.id === editingCropId);
    if (idx !== -1) state.crops[idx] = crop;
  } else {
    state.crops.push(crop);
  }

  saveState();
  renderCrops();
  renderDashboard();
  document.getElementById("crop-form-card")?.classList.add("hidden");
  clearCropForm();
});

function renderCrops() {
  const grid = document.getElementById("crops-grid");
  if (!grid) return;

  if (state.crops.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">🌾</div>
        <p>No crops added yet. Click "+ Add New Crop" or select a preset to get started!</p>
      </div>`;
    return;
  }

  const tod = today();

  grid.innerHTML = state.crops.map(c => {
    // Water timing
    let waterStatus = "N/A", waterClass = "good";
    if (c.waterDays && c.lastWatered) {
      const nextWater = addDays(c.lastWatered, c.waterDays);
      const diff = daysBetween(tod, nextWater);
      if (diff < 0) {
        waterStatus = `Overdue (${Math.abs(diff)}d ago)`;
        waterClass = "overdue";
      } else if (diff === 0) {
        waterStatus = "Water TODAY!";
        waterClass = "due-soon";
      } else if (diff <= 2) {
        waterStatus = `In ${diff} day(s)`;
        waterClass = "due-soon";
      } else {
        waterStatus = `In ${diff} days (${formatDateShort(nextWater)})`;
        waterClass = "good";
      }
    }

    // Pest timing
    let pestStatus = "N/A", pestClass = "good";
    if (c.pestDays && c.lastPest) {
      const nextPest = addDays(c.lastPest, c.pestDays);
      const diffP = daysBetween(tod, nextPest);
      if (diffP < 0) {
        pestStatus = `Overdue (${Math.abs(diffP)}d ago)`;
        pestClass = "overdue";
      } else if (diffP === 0) {
        pestStatus = "Spray TODAY!";
        pestClass = "due-soon";
      } else {
        pestStatus = `In ${diffP} days`;
        pestClass = "good";
      }
    }

    // Harvest timing
    let harvestStatus = "–";
    if (c.harvestDate) {
      const diffH = daysBetween(tod, c.harvestDate);
      harvestStatus = diffH < 0 ? "Harvest time reached" : diffH === 0 ? "Harvest today!" : `${diffH} days remaining`;
    }

    return `
    <div class="crop-card" id="crop-${c.id}">
      <div class="crop-header">
        <span class="crop-name">🌱 ${c.name}</span>
        <span class="crop-area">${c.area || "1"} Acres</span>
      </div>

      <div class="crop-schedule">
        <div class="sched-item">
          <span class="sched-label">💧 Next Water (सिंचाई)</span>
          <span class="sched-val ${waterClass}">${waterStatus}</span>
        </div>
        <div class="sched-item">
          <span class="sched-label">🐛 Next Spray (कीटनाशक)</span>
          <span class="sched-val ${pestClass}">${pestStatus}</span>
        </div>
        <div class="sched-item">
          <span class="sched-label">🌾 Expected Harvest</span>
          <span class="sched-val">${harvestStatus}</span>
        </div>
        <div class="sched-item">
          <span class="sched-label">💧 Frequency</span>
          <span class="sched-val">Every ${c.waterDays} days</span>
        </div>
      </div>

      <div class="crop-pills">
        ${c.pesticide ? `<div class="crop-detail-pill"><strong>Spray:</strong> ${c.pesticide}</div>` : ""}
        ${c.fertilizer ? `<div class="crop-detail-pill"><strong>Fertilizer:</strong> ${c.fertilizer}</div>` : ""}
      </div>

      <div class="crop-dates">
        Sown: <span>${formatDate(c.plantDate)}</span> • Harvest: <span>${formatDate(c.harvestDate)}</span>
      </div>

      ${c.notes ? `<div class="crop-notes-text">📝 ${c.notes}</div>` : ""}

      <div class="crop-actions">
        <button class="crop-btn water" onclick="window.markWatered('${c.id}')" title="Reset watering timer">💧 Watered Today</button>
        <button class="crop-btn pest" onclick="window.markPest('${c.id}')" title="Reset pesticide timer">🐛 Sprayed Today</button>
        <button class="crop-btn" onclick="window.editCrop('${c.id}')">✏️ Edit</button>
        <button class="crop-btn delete" onclick="window.deleteCrop('${c.id}')">🗑️</button>
      </div>
    </div>
    `;
  }).join("");
}

function markWatered(id) {
  const c = state.crops.find(crop => crop.id === id);
  if (c) {
    c.lastWatered = today();
    saveState();
    renderCrops();
    renderDashboard();
  }
}
window.markWatered = markWatered;

function markPest(id) {
  const c = state.crops.find(crop => crop.id === id);
  if (c) {
    c.lastPest = today();
    saveState();
    renderCrops();
    renderDashboard();
  }
}
window.markPest = markPest;

function editCrop(id) {
  const c = state.crops.find(crop => crop.id === id);
  if (!c) return;

  editingCropId = id;
  document.getElementById("crop-form-title").textContent = "✏️ Edit Crop: " + c.name;
  document.getElementById("crop-name").value = c.name || "";
  document.getElementById("crop-area").value = c.area || "";
  document.getElementById("crop-plant-date").value = c.plantDate || "";
  document.getElementById("crop-harvest-date").value = c.harvestDate || "";
  document.getElementById("crop-water-days").value = c.waterDays || "";
  document.getElementById("crop-last-watered").value = c.lastWatered || "";
  document.getElementById("crop-pest-days").value = c.pestDays || "";
  document.getElementById("crop-last-pest").value = c.lastPest || "";
  document.getElementById("crop-pesticide-name").value = c.pesticide || "";
  document.getElementById("crop-fertilizer").value = c.fertilizer || "";
  document.getElementById("crop-notes").value = c.notes || "";

  document.getElementById("crop-form-card")?.classList.remove("hidden");
  document.getElementById("crop-form-card")?.scrollIntoView({ behavior: "smooth" });
}
window.editCrop = editCrop;

function deleteCrop(id) {
  showConfirm("Are you sure you want to delete this crop?", () => {
    state.crops = state.crops.filter(c => c.id !== id);
    saveState();
    renderCrops();
    renderDashboard();
  });
}
window.deleteCrop = deleteCrop;

/* ════════════════════════════════════
   MANDI MARKET PRICES
═════════════════════════════════════ */
document.getElementById("open-add-price-btn")?.addEventListener("click", () => {
  document.getElementById("market-form-card")?.classList.remove("hidden");
  document.getElementById("mp-date").value = today();
  document.getElementById("market-form-card")?.scrollIntoView({ behavior: "smooth" });
});

document.getElementById("close-market-form")?.addEventListener("click", () => {
  document.getElementById("market-form-card")?.classList.add("hidden");
});

document.getElementById("cancel-market-btn")?.addEventListener("click", () => {
  document.getElementById("market-form-card")?.classList.add("hidden");
});

document.getElementById("save-market-btn")?.addEventListener("click", () => {
  const crop = document.getElementById("mp-crop").value.trim();
  const price = parseFloat(document.getElementById("mp-price").value);
  const market = document.getElementById("mp-market").value.trim() || "Local Mandi";
  const date = document.getElementById("mp-date").value || today();

  if (!crop || !price) {
    alert("Please enter crop name and price per quintal!");
    return;
  }

  state.marketPrices.unshift({
    id: genId(),
    crop,
    price,
    market,
    state: state.farmer.location || "India",
    date,
    trend: "flat"
  });

  saveState();
  renderMarketTable();
  document.getElementById("market-form-card")?.classList.add("hidden");
  document.getElementById("mp-crop").value = "";
  document.getElementById("mp-price").value = "";
  document.getElementById("mp-market").value = "";
});

document.getElementById("market-search-input")?.addEventListener("input", renderMarketTable);
document.getElementById("market-crop-filter")?.addEventListener("change", renderMarketTable);

function renderMarketTable() {
  const tbody = document.getElementById("market-tbody");
  if (!tbody) return;

  const search = (document.getElementById("market-search-input")?.value || "").toLowerCase().trim();
  const filter = document.getElementById("market-crop-filter")?.value || "all";

  let list = state.marketPrices;

  if (filter !== "all") {
    list = list.filter(m => m.crop.toLowerCase().includes(filter.toLowerCase()));
  }

  if (search) {
    list = list.filter(m =>
      m.crop.toLowerCase().includes(search) ||
      (m.market && m.market.toLowerCase().includes(search)) ||
      (m.state && m.state.toLowerCase().includes(search))
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-td">No mandi rates found for this query.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(m => {
    const trendIcon = m.trend === "up" ? "▲ Up" : m.trend === "down" ? "▼ Down" : "━ Stable";
    const trendClass = m.trend === "up" ? "trend-up" : m.trend === "down" ? "trend-down" : "trend-flat";

    return `
      <tr>
        <td><strong>${m.crop}</strong></td>
        <td><span class="price-badge">₹${Number(m.price).toLocaleString("en-IN")}</span></td>
        <td>${m.market}</td>
        <td>${m.state || "–"}</td>
        <td>${formatDate(m.date)}</td>
        <td><span class="trend-pill ${trendClass}">${trendIcon}</span></td>
        <td>
          <button class="table-btn danger" onclick="window.deleteMarketPrice('${m.id}')" title="Delete">🗑️</button>
        </td>
      </tr>
    `;
  }).join("");
}

function deleteMarketPrice(id) {
  state.marketPrices = state.marketPrices.filter(m => m.id !== id);
  saveState();
  renderMarketTable();
}
window.deleteMarketPrice = deleteMarketPrice;

// AI Mandi Forecast & Trend Analysis
document.getElementById("fetch-market-btn")?.addEventListener("click", async () => {
  showLoading("Gemini AI is analyzing current Indian mandi prices and best selling time...");
  try {
    const crops = state.crops.map(c => c.name).join(", ") || "Wheat, Soybean, Tomato";
    const prompt = `Act as an Indian agricultural commodity market expert. Give current price trends and strategic selling recommendations for farmer located in ${state.farmer.location}:
Crops: ${crops}

Provide:
1. Expected Mandi price range (₹/quintal) for these crops in this season.
2. Market Trend (Will prices rise or fall in next 30 days?).
3. Best selling strategy (Sell immediately or store in warehouse/warehouse receipt loan?).
4. Top 3 APMC mandis giving highest prices.

Keep the tone encouraging and write in ${state.farmer.lang === "hindi" ? "Hindi (हिन्दी)" : "English"}.`;

    const text = await callGemini(prompt);
    const box = document.getElementById("market-ai-response");
    const out = document.getElementById("market-ai-text");
    if (box && out) {
      box.style.display = "block";
      out.innerHTML = formatMarkdown(text);
      box.scrollIntoView({ behavior: "smooth" });
    }
  } catch (err) {
    alert("Could not fetch AI market analysis: " + err.message);
  } finally {
    hideLoading();
  }
});

/* ════════════════════════════════════
   LIVE WEATHER & AGRO-ADVISORY
═════════════════════════════════════ */
async function fetchLiveWeather(city) {
  const cityName = city || state.farmer.location.split(",")[0].trim() || "Indore";
  showLoading(`Fetching real-time weather for ${cityName}...`);

  try {
    // 1. Geocode city using Open-Meteo Geocoding API (free, reliable, no key needed)
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    let lat = 22.7196, lon = 75.8577, resolvedName = cityName; // default Indore
    if (geoData.results && geoData.results.length > 0) {
      lat = geoData.results[0].latitude;
      lon = geoData.results[0].longitude;
      resolvedName = `${geoData.results[0].name}, ${geoData.results[0].admin1 || geoData.results[0].country}`;
    }

    // 2. Fetch current weather and 5-day daily forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
    const wRes = await fetch(weatherUrl);
    const wData = await wRes.json();

    const current = wData.current;
    const temp = Math.round(current.temperature_2m);
    const humidity = current.relative_humidity_2m;
    const wind = Math.round(current.wind_speed_10m);
    const rain = current.precipitation;
    const iconDesc = getWeatherCodeInfo(current.weather_code);

    // Update main weather card
    document.getElementById("weather-city-name").textContent = resolvedName;
    document.getElementById("weather-temp-big").textContent = `${temp}°C`;
    document.getElementById("weather-big-icon").textContent = iconDesc.icon;
    document.getElementById("weather-desc").textContent = iconDesc.desc;
    document.getElementById("w-humidity").textContent = `${humidity}%`;
    document.getElementById("w-wind").textContent = `${wind} km/h`;
    document.getElementById("w-rain").textContent = `${rain > 0 ? rain + " mm" : "0%"}`;
    document.getElementById("w-dew").textContent = `${Math.round(temp - ((100 - humidity) / 5))}°C`;
    document.getElementById("weather-updated-time").textContent = `Updated: ${new Date().toLocaleTimeString("en-IN")}`;

    // Update topbar quick weather
    const quickTemp = document.getElementById("quick-temp");
    const quickIcon = document.getElementById("quick-weather-icon");
    const quickCity = document.getElementById("quick-city");
    if (quickTemp) quickTemp.textContent = `${temp}°C`;
    if (quickIcon) quickIcon.textContent = iconDesc.icon;
    if (quickCity) quickCity.textContent = cityName;

    // Update dashboard mini weather
    const dTemp = document.getElementById("dash-w-temp");
    const dIcon = document.getElementById("dash-w-icon");
    const dDesc = document.getElementById("dash-w-desc");
    if (dTemp) dTemp.textContent = `${temp}°C`;
    if (dIcon) dIcon.textContent = iconDesc.icon;
    if (dDesc) dDesc.textContent = iconDesc.desc;

    // Render 5-Day Forecast Grid
    const fGrid = document.getElementById("weather-forecast-grid");
    if (fGrid && wData.daily) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      fGrid.innerHTML = wData.daily.time.slice(0, 5).map((dStr, i) => {
        const dt = new Date(dStr + "T00:00:00");
        const dayName = days[dt.getDay()];
        const code = wData.daily.weather_code[i];
        const wInfo = getWeatherCodeInfo(code);
        const max = Math.round(wData.daily.temperature_2m_max[i]);
        const min = Math.round(wData.daily.temperature_2m_min[i]);
        const rainProb = wData.daily.precipitation_probability_max[i] || 0;

        return `
          <div class="forecast-card">
            <div class="forecast-day">${dayName} (${formatDateShort(dStr)})</div>
            <div class="forecast-icon">${wInfo.icon}</div>
            <div class="forecast-temp">${max}°C</div>
            <div class="forecast-lo">Low: ${min}°C</div>
            <div class="forecast-rain">🌧️ ${rainProb}% rain</div>
          </div>
        `;
      }).join("");
    }

    // Auto-update Agro Advisory based on weather parameters
    updateAgroAdvisory(temp, humidity, wind, iconDesc.desc);

  } catch (err) {
    console.warn("Weather fetch failed, keeping baseline:", err);
  } finally {
    hideLoading();
  }
}

function getWeatherCodeInfo(code) {
  if (code === 0) return { icon: "☀️", desc: "Clear sunny sky" };
  if (code === 1 || code === 2) return { icon: "🌤️", desc: "Partly cloudy & mild" };
  if (code === 3) return { icon: "☁️", desc: "Overcast cloud cover" };
  if (code >= 45 && code <= 48) return { icon: "🌫️", desc: "Dense morning fog" };
  if (code >= 51 && code <= 67) return { icon: "🌧️", desc: "Rain showers expected" };
  if (code >= 80 && code <= 82) return { icon: "🌦️", desc: "Passing rain showers" };
  if (code >= 95) return { icon: "⛈️", desc: "Thunderstorm with rain" };
  return { icon: "☀️", desc: "Clear weather" };
}

function updateAgroAdvisory(temp, humidity, wind, desc) {
  const advText = document.getElementById("weather-ai-text");
  const dashTip = document.getElementById("dash-w-tip");
  if (!advText) return;

  let sprayAdvice = "";
  let waterAdvice = "";

  if (wind > 18) {
    sprayAdvice = "❌ <strong>High Wind Alert (" + wind + " km/h):</strong> Postpone pesticide spraying to prevent drift waste.";
  } else {
    sprayAdvice = "✅ <strong>Pesticide Spraying:</strong> Wind is calm (" + wind + " km/h). Safe for spraying in early morning or late evening.";
  }

  if (humidity > 75) {
    waterAdvice = "⚠️ <strong>High Humidity (" + humidity + "%):</strong> Watch out for fungal diseases in vegetable crops. Avoid flood irrigation.";
  } else {
    waterAdvice = "✅ <strong>Irrigation:</strong> Dry conditions (" + humidity + "% humidity). Standing crops can be given regular irrigation.";
  }

  const fullAdv = `
    ${waterAdvice}
    <br><br>
    ${sprayAdvice}
    <br><br>
    🌱 <strong>Crop Care:</strong> Current temperature of ${temp}°C is suitable for active field operations. Ensure proper drainage in low-lying beds.
  `;

  advText.innerHTML = fullAdv;
  if (dashTip) dashTip.innerHTML = `🌿 <strong>Agro Advice:</strong> ${sprayAdvice.replace(/<[^>]+>/g, "").slice(0, 90)}...`;
}

document.getElementById("get-weather-btn")?.addEventListener("click", () => {
  const city = document.getElementById("weather-city")?.value.trim();
  fetchLiveWeather(city);
});

document.getElementById("weather-ai-advice-btn")?.addEventListener("click", async () => {
  showLoading("Generating crop-specific Gemini AI agro advisory...");
  try {
    const crops = state.crops.map(c => c.name).join(", ");
    const prompt = `Based on current weather in ${state.farmer.location}:
Crops grown: ${crops || "Wheat, Tomato, Mustard"}
Temperature: ${document.getElementById("weather-temp-big")?.textContent || "28°C"}
Conditions: ${document.getElementById("weather-desc")?.textContent || "Sunny"}

Give 3 actionable farming instructions for this week:
1. Irrigation timing
2. Disease/Pest prevention precautions
3. Fertilizer application advice

Write in ${state.farmer.lang === "hindi" ? "Hindi (हिन्दी)" : "English"}.`;

    const text = await callGemini(prompt);
    const el = document.getElementById("weather-ai-text");
    if (el) el.innerHTML = formatMarkdown(text);
  } catch (e) {
    alert("AI Advisory error: " + e.message);
  } finally {
    hideLoading();
  }
});

/* ════════════════════════════════════
   EXPENSE TRACKER & AUDIT
═════════════════════════════════════ */
let editingExpId = null;

document.getElementById("add-expense-btn")?.addEventListener("click", () => {
  editingExpId = null;
  clearExpenseForm();
  document.getElementById("exp-date").value = today();
  document.getElementById("expense-form-card")?.classList.remove("hidden");
  document.getElementById("expense-form-card")?.scrollIntoView({ behavior: "smooth" });
});

document.getElementById("close-expense-form")?.addEventListener("click", () => {
  document.getElementById("expense-form-card")?.classList.add("hidden");
});

document.getElementById("cancel-expense-btn")?.addEventListener("click", () => {
  document.getElementById("expense-form-card")?.classList.add("hidden");
});

function clearExpenseForm() {
  ["exp-amount", "exp-desc", "exp-crop", "exp-edit-id"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("exp-type").value = "expense";
  document.getElementById("exp-category").value = "Seeds (बीज)";
}

document.getElementById("save-expense-btn")?.addEventListener("click", () => {
  const amount = parseFloat(document.getElementById("exp-amount").value);
  if (!amount || amount <= 0) {
    alert("Please enter a valid amount!");
    return;
  }

  const entry = {
    id: editingExpId || genId(),
    type: document.getElementById("exp-type").value,
    category: document.getElementById("exp-category").value,
    amount,
    date: document.getElementById("exp-date").value || today(),
    desc: document.getElementById("exp-desc").value.trim() || "Farm transaction",
    crop: document.getElementById("exp-crop").value.trim() || ""
  };

  if (editingExpId) {
    const idx = state.expenses.findIndex(e => e.id === editingExpId);
    if (idx !== -1) state.expenses[idx] = entry;
  } else {
    state.expenses.unshift(entry);
  }

  saveState();
  renderExpenses();
  renderDashboard();
  document.getElementById("expense-form-card")?.classList.add("hidden");
  clearExpenseForm();
});

["exp-filter-type", "exp-filter-cat"].forEach(id => {
  document.getElementById(id)?.addEventListener("change", renderExpenses);
});

function renderExpenses() {
  const filterType = document.getElementById("exp-filter-type")?.value || "all";
  const filterCat = document.getElementById("exp-filter-cat")?.value || "all";

  let list = state.expenses;
  if (filterType !== "all") list = list.filter(e => e.type === filterType);
  if (filterCat !== "all") list = list.filter(e => e.category === filterCat);

  const tbody = document.getElementById("expense-tbody");
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-td">No transactions recorded yet.</td></tr>`;
  } else {
    tbody.innerHTML = list.map(e => `
      <tr>
        <td>${formatDate(e.date)}</td>
        <td>${e.type === "expense" ? "💸 Expense" : "💵 Income"}</td>
        <td><strong>${e.category}</strong></td>
        <td>${e.desc}</td>
        <td>${e.crop || "–"}</td>
        <td class="${e.type === "expense" ? "amount-expense" : "amount-income"}">
          ${e.type === "expense" ? "-" : "+"}${formatINR(e.amount)}
        </td>
        <td>
          <button class="table-btn" onclick="window.editExpense('${e.id}')">✏️</button>
          <button class="table-btn danger" onclick="window.deleteExpense('${e.id}')">🗑️</button>
        </td>
      </tr>
    `).join("");
  }

  // Update Summary Cards
  const totalExp = state.expenses.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const totalInc = state.expenses.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const net = totalInc - totalExp;

  const thisMonthStr = today().slice(0, 7);
  const monthExp = state.expenses.filter(e => e.type === "expense" && e.date?.startsWith(thisMonthStr))
    .reduce((s, e) => s + e.amount, 0);

  document.getElementById("exp-income").textContent = formatINR(totalInc);
  document.getElementById("exp-total").textContent = formatINR(totalExp);
  document.getElementById("exp-net-profit").textContent = formatINR(net);
  document.getElementById("exp-this-month").textContent = formatINR(monthExp);
}

function editExpense(id) {
  const e = state.expenses.find(exp => exp.id === id);
  if (!e) return;

  editingExpId = id;
  document.getElementById("exp-type").value = e.type;
  document.getElementById("exp-category").value = e.category;
  document.getElementById("exp-amount").value = e.amount;
  document.getElementById("exp-date").value = e.date;
  document.getElementById("exp-desc").value = e.desc;
  document.getElementById("exp-crop").value = e.crop;

  document.getElementById("expense-form-card")?.classList.remove("hidden");
  document.getElementById("expense-form-card")?.scrollIntoView({ behavior: "smooth" });
}
window.editExpense = editExpense;

function deleteExpense(id) {
  showConfirm("Delete this transaction entry?", () => {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveState();
    renderExpenses();
    renderDashboard();
  });
}
window.deleteExpense = deleteExpense;

// AI Expense Audit
document.getElementById("analyze-expenses-btn")?.addEventListener("click", async () => {
  showLoading("Gemini AI is auditing your farming expenses for cost savings...");
  try {
    const totalExp = state.expenses.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    const totalInc = state.expenses.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const categories = {};
    state.expenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });

    const prompt = `Perform an agricultural cost-cutting audit for an Indian farmer:
Total Revenue: ₹${totalInc}
Total Expenses: ₹${totalExp}
Net Income: ₹${totalInc - totalExp}
Category Breakdown:
${Object.entries(categories).map(([k, v]) => `- ${k}: ₹${v}`).join("\n")}

Provide:
1. Top 2 areas where money is being overspent.
2. 3 concrete ways to save ₹10,000 to ₹25,000 per season (e.g. bulk buying, custom hiring machinery, soil-based fertilizer).
3. Recommendation on reinvesting profit.

Write in ${state.farmer.lang === "hindi" ? "Hindi (हिन्दी)" : "English"}.`;

    const text = await callGemini(prompt);
    const bubble = document.getElementById("expense-ai-bubble");
    const out = document.getElementById("expense-ai-text");
    if (bubble && out) {
      bubble.classList.remove("hidden");
      out.innerHTML = formatMarkdown(text);
      bubble.scrollIntoView({ behavior: "smooth" });
    }
  } catch (e) {
    alert("AI Analysis error: " + e.message);
  } finally {
    hideLoading();
  }
});

/* ════════════════════════════════════
   FINANCE & DEED LEDGER (BAHI-KHATA)
═════════════════════════════════════ */
let editingDueId = null;
let currentPartialDueId = null;

document.getElementById("add-due-btn")?.addEventListener("click", () => {
  editingDueId = null;
  clearDueForm();
  document.getElementById("due-form-title").textContent = "🤝 Record Deed, Loan or Credit (खाता दर्ज करें)";
  document.getElementById("due-date").value = addDays(today(), 15);
  document.getElementById("due-form-card")?.classList.remove("hidden");
  document.getElementById("due-form-card")?.scrollIntoView({ behavior: "smooth" });
});

document.getElementById("close-due-form")?.addEventListener("click", () => {
  document.getElementById("due-form-card")?.classList.add("hidden");
});

document.getElementById("cancel-due-btn")?.addEventListener("click", () => {
  document.getElementById("due-form-card")?.classList.add("hidden");
});

function clearDueForm() {
  [
    "due-person", "due-amount", "due-date", "due-phone",
    "due-interest", "due-reason", "due-notes", "due-edit-id"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("due-type").value = "payable";
}

document.getElementById("save-due-btn")?.addEventListener("click", () => {
  const person = document.getElementById("due-person").value.trim();
  const amount = parseFloat(document.getElementById("due-amount").value);
  const type = document.getElementById("due-type").value;

  if (!person) { alert("Please enter person/organization name!"); return; }
  if (!amount || amount <= 0) { alert("Please enter a valid amount!"); return; }

  const entry = {
    id: editingDueId || genId(),
    person,
    type,
    amount,
    dueDate: document.getElementById("due-date").value || addDays(today(), 30),
    phone: document.getElementById("due-phone").value.trim(),
    interest: document.getElementById("due-interest").value.trim() || "0%",
    reason: document.getElementById("due-reason").value.trim() || "Farm deed agreement",
    notes: document.getElementById("due-notes").value.trim(),
    status: "pending",
    createdAt: today()
  };

  if (editingDueId) {
    const idx = state.dues.findIndex(d => d.id === editingDueId);
    if (idx !== -1) state.dues[idx] = { ...state.dues[idx], ...entry };
  } else {
    state.dues.unshift(entry);
  }

  saveState();
  renderDues();
  renderDashboard();
  document.getElementById("due-form-card")?.classList.add("hidden");
  clearDueForm();
});

function renderDues() {
  const tod = today();
  const payable = state.dues.filter(d => d.type === "payable" && d.status !== "paid");
  const receivable = state.dues.filter(d => d.type === "receivable" && d.status !== "paid");

  // Stats
  const totPay = payable.reduce((s, d) => s + d.amount, 0);
  const totRec = receivable.reduce((s, d) => s + d.amount, 0);
  const totOverdue = [...payable, ...receivable].filter(d => d.dueDate && d.dueDate < tod)
    .reduce((s, d) => s + d.amount, 0);

  document.getElementById("fin-payable").textContent = formatINR(totPay);
  document.getElementById("fin-receivable").textContent = formatINR(totRec);
  document.getElementById("fin-overdue").textContent = formatINR(totOverdue);

  function renderList(list, containerId, isPayable) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (list.length === 0) {
      el.innerHTML = `<div class="empty-state">${isPayable ? "No payable deeds or loans." : "No receivables due."}</div>`;
      return;
    }

    el.innerHTML = list.map(d => {
      const isOverdue = d.dueDate && d.dueDate < tod;
      return `
        <div class="due-card ${d.type} ${isOverdue ? "overdue" : ""}">
          <div class="due-avatar">${isPayable ? "📤" : "📥"}</div>
          <div class="due-info">
            <div class="due-person-name">${d.person}</div>
            <div class="due-reason">${d.reason || "Farm deed transaction"}</div>
            <div class="due-meta-tags">
              ${d.interest ? `<span class="due-meta-tag">Interest: ${d.interest}</span>` : ""}
              ${d.phone ? `<span class="due-meta-tag">📞 ${d.phone}</span>` : ""}
              ${d.notes ? `<span class="due-meta-tag">📝 ${d.notes}</span>` : ""}
            </div>
          </div>
          <div class="due-amount-col">
            <div class="due-amount">${formatINR(d.amount)}</div>
            <div class="due-date">Due: ${formatDate(d.dueDate)}</div>
            ${isOverdue ? `<div class="due-overdue-tag">⚠️ OVERDUE</div>` : ""}
          </div>
          <div class="due-actions">
            <button class="whatsapp-btn" onclick="window.sendWhatsAppReminder('${d.id}')" title="Send WhatsApp Message">
              💬 WhatsApp
            </button>
            <button class="table-btn" onclick="window.openPartialPayment('${d.id}')">💵 Settle / Pay</button>
            <button class="table-btn" onclick="window.editDue('${d.id}')">✏️ Edit</button>
            <button class="table-btn danger" onclick="window.deleteDue('${d.id}')">🗑️</button>
          </div>
        </div>
      `;
    }).join("");
  }

  renderList(payable, "dues-payable-list", true);
  renderList(receivable, "dues-receivable-list", false);
}

// WhatsApp Reminder Generator
function sendWhatsAppReminder(id) {
  const d = state.dues.find(item => item.id === id);
  if (!d) return;

  const farmerName = state.farmer.name || "Kisan";
  let msg = "";

  if (d.type === "receivable") {
    msg = `नमस्ते ${d.person} जी! 🙏\n\nयह किसान ${farmerName} की ओर से विनम्र याद-दहानी (Reminder) है।\nहमारे हिसाब/डीड के अनुसार कुल ₹${d.amount.toLocaleString("en-IN")} बकाया हैं, जो कि ${formatDate(d.dueDate)} तक देय हैं (${d.reason || "खाता"}).\n\nकृपया भुगतान की व्यवस्था करें। धन्यवाद! 🌾`;
  } else {
    msg = `नमस्ते ${d.person} जी! 🙏\n\nमैं ${farmerName}। आपके खाते का ₹${d.amount.toLocaleString("en-IN")} का हिसाब नोट है (${d.reason || "डीड"}).\nनियत तिथि ${formatDate(d.dueDate)} पर भुगतान कर दिया जाएगा।\n\nधन्यवाद! 🌾`;
  }

  const phone = (d.phone || "").replace(/[^0-9]/g, "");
  const waUrl = phone.length >= 10
    ? `https://wa.me/91${phone.slice(-10)}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  window.open(waUrl, "_blank");
}
window.sendWhatsAppReminder = sendWhatsAppReminder;

// Partial Payment / Settlement Modal
function openPartialPayment(id) {
  const d = state.dues.find(item => item.id === id);
  if (!d) return;

  currentPartialDueId = id;
  const modal = document.getElementById("payment-modal");
  document.getElementById("payment-modal-desc").textContent =
    `Record payment for ${d.person} (Current Balance: ${formatINR(d.amount)})`;
  document.getElementById("pay-partial-amount").value = d.amount;
  document.getElementById("pay-partial-date").value = today();
  modal?.classList.remove("hidden");
}
window.openPartialPayment = openPartialPayment;

document.getElementById("payment-confirm-btn")?.addEventListener("click", () => {
  const d = state.dues.find(item => item.id === currentPartialDueId);
  if (!d) return;

  const paidAmt = parseFloat(document.getElementById("pay-partial-amount").value);
  const payDate = document.getElementById("pay-partial-date").value || today();

  if (!paidAmt || paidAmt <= 0) {
    alert("Please enter a valid payment amount!");
    return;
  }

  // Deduct from due
  if (paidAmt >= d.amount) {
    d.status = "paid";
    d.amount = 0;
  } else {
    d.amount -= paidAmt;
  }

  // Log to farm expense tracker automatically!
  state.expenses.unshift({
    id: genId(),
    type: d.type === "payable" ? "expense" : "income",
    category: "Other Farm Expense (अन्य)",
    amount: paidAmt,
    date: payDate,
    desc: `${d.type === "payable" ? "Paid to" : "Collected from"} ${d.person}: ${d.reason || "Deed settlement"}`,
    crop: ""
  });

  saveState();
  renderDues();
  renderExpenses();
  renderDashboard();
  document.getElementById("payment-modal")?.classList.add("hidden");
});

document.getElementById("payment-cancel-btn")?.addEventListener("click", () => {
  document.getElementById("payment-modal")?.classList.add("hidden");
});

function editDue(id) {
  const d = state.dues.find(item => item.id === id);
  if (!d) return;

  editingDueId = id;
  document.getElementById("due-form-title").textContent = "✏️ Edit Deed / Loan";
  document.getElementById("due-person").value = d.person;
  document.getElementById("due-type").value = d.type;
  document.getElementById("due-amount").value = d.amount;
  document.getElementById("due-date").value = d.dueDate || "";
  document.getElementById("due-phone").value = d.phone || "";
  document.getElementById("due-interest").value = d.interest || "";
  document.getElementById("due-reason").value = d.reason || "";
  document.getElementById("due-notes").value = d.notes || "";

  document.getElementById("due-form-card")?.classList.remove("hidden");
  document.getElementById("due-form-card")?.scrollIntoView({ behavior: "smooth" });
}
window.editDue = editDue;

function deleteDue(id) {
  showConfirm("Delete this deed / due record?", () => {
    state.dues = state.dues.filter(d => d.id !== id);
    saveState();
    renderDues();
    renderDashboard();
  });
}
window.deleteDue = deleteDue;

// AI Debt & Financial Advice
document.getElementById("analyze-finance-btn")?.addEventListener("click", async () => {
  showLoading("Gemini AI is analyzing your debt & bahi-khata position...");
  try {
    const payable = state.dues.filter(d => d.type === "payable" && d.status !== "paid");
    const receivable = state.dues.filter(d => d.type === "receivable" && d.status !== "paid");

    const prompt = `Give expert Indian rural finance & debt management advice for this farmer:
Dues Farmer Needs to Pay (Debts/Deeds):
${payable.map(d => `- To ${d.person}: ₹${d.amount} (Due: ${d.dueDate}, Interest: ${d.interest})`).join("\n") || "None"}

Money Owed to Farmer (Receivables):
${receivable.map(d => `- From ${d.person}: ₹${d.amount} (Due: ${d.dueDate})`).join("\n") || "None"}

Give:
1. Urgent risk assessment (which debts have high interest and must be repaid first).
2. Action plan to recover money from mandi traders and buyers.
3. How to use Kisan Credit Card (KCC) or PM-Kisan to clear high-interest informal loans.

Write in ${state.farmer.lang === "hindi" ? "Hindi (हिन्दी)" : "English"}.`;

    const text = await callGemini(prompt);
    const bubble = document.getElementById("finance-ai-bubble");
    const out = document.getElementById("finance-ai-text");
    if (bubble && out) {
      bubble.classList.remove("hidden");
      out.innerHTML = formatMarkdown(text);
      bubble.scrollIntoView({ behavior: "smooth" });
    }
  } catch (e) {
    alert("AI Finance error: " + e.message);
  } finally {
    hideLoading();
  }
});

/* ════════════════════════════════════
   GEMINI AI ASSISTANT (CHAT + VOICE)
═════════════════════════════════════ */
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const chatSendBtn = document.getElementById("chat-send-btn");
const chatMicBtn = document.getElementById("chat-mic-btn");

chatSendBtn?.addEventListener("click", sendChat);

chatInput?.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendChat();
  }
});

chatInput?.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
});

function sendSuggestion(text) {
  if (chatInput) {
    chatInput.value = text;
    sendChat();
  }
}
window.sendSuggestion = sendSuggestion;

document.getElementById("clear-chat-btn")?.addEventListener("click", () => {
  showConfirm("Clear chat history?", () => {
    state.chatHistory = [];
    saveState();
    if (chatMessages) {
      chatMessages.innerHTML = `
        <div class="chat-message bot">
          <div class="chat-avatar">🌾</div>
          <div class="chat-bubble">
            <p><strong>राम-राम! 🙏</strong> चैट साफ कर दी गई है। कोई नया सवाल पूछें!</p>
          </div>
        </div>`;
    }
  });
});

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = "";
  chatInput.style.height = "auto";
  chatSendBtn.disabled = true;

  appendChatMessage("user", text);
  state.chatHistory.push({ role: "user", text });

  showTypingIndicator();

  try {
    const reply = await callGeminiChat(state.chatHistory.slice(-8));
    removeTypingIndicator();
    appendChatMessage("bot", reply);
    state.chatHistory.push({ role: "bot", text: reply });
    if (state.chatHistory.length > 40) state.chatHistory = state.chatHistory.slice(-40);
    saveState();
  } catch (err) {
    removeTypingIndicator();
    appendChatMessage("bot", `⚠️ Could not respond: ${err.message}`);
  } finally {
    chatSendBtn.disabled = false;
    chatInput.focus();
  }
}

function appendChatMessage(role, text) {
  if (!chatMessages) return;

  const div = document.createElement("div");
  div.className = `chat-message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "chat-avatar";
  avatar.textContent = role === "bot" ? "🌾" : "👨‍🌾";

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.innerHTML = formatMarkdown(text);

  if (role === "bot") {
    const speakBtn = document.createElement("button");
    speakBtn.className = "chat-audio-btn";
    speakBtn.title = "Read aloud (सुनें)";
    speakBtn.textContent = "🔊";
    speakBtn.onclick = () => speakPlainText(text);
    bubble.appendChild(speakBtn);
  }

  div.appendChild(avatar);
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const div = document.createElement("div");
  div.className = "chat-message bot";
  div.id = "typing-indicator";
  div.innerHTML = `
    <div class="chat-avatar">🌾</div>
    <div class="chat-bubble">
      <div class="chat-typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
    </div>`;
  chatMessages?.appendChild(div);
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById("typing-indicator")?.remove();
}

// Voice Recognition (Speech-to-Text)
let recognition = null;
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = state.farmer.lang === "hindi" ? "hi-IN" : "en-IN";

  recognition.onresult = e => {
    const spoken = e.results[0][0].transcript;
    if (chatInput) {
      chatInput.value = spoken;
      sendChat();
    }
  };

  recognition.onerror = e => {
    console.warn("Speech error:", e);
    chatMicBtn?.classList.remove("listening");
  };

  recognition.onend = () => {
    chatMicBtn?.classList.remove("listening");
  };
}

chatMicBtn?.addEventListener("click", () => {
  if (!recognition) {
    alert("Voice speech recognition is not supported in this browser. Please use Chrome or Edge.");
    return;
  }
  recognition.lang = state.farmer.lang === "hindi" ? "hi-IN" : "en-IN";
  chatMicBtn.classList.add("listening");
  try {
    recognition.start();
  } catch (e) {
    recognition.stop();
    chatMicBtn.classList.remove("listening");
  }
});

// Text-to-Speech (Audio Voice Readout)
function speakPlainText(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  // Strip markdown
  const clean = text.replace(/[*_#`>-]/g, "").replace(/<[^>]*>/g, "");
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = state.farmer.lang === "hindi" ? "hi-IN" : "en-IN";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

function speakText(elementId) {
  const el = document.getElementById(elementId);
  if (el) speakPlainText(el.innerText || el.textContent);
}
window.speakText = speakText;

/* ════════════════════════════════════
   MARKDOWN PARSER
═════════════════════════════════════ */
function formatMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^### (.*$)/gim, "<h4>$1</h4>")
    .replace(/^## (.*$)/gim, "<h3>$1</h3>")
    .replace(/^# (.*$)/gim, "<h2>$1</h2>")
    .replace(/^\s*[-•]\s+(.*$)/gim, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

/* ════════════════════════════════════
   MODALS & OVERLAYS
═════════════════════════════════════ */
function showLoading(msg = "Gemini AI is analyzing...") {
  const el = document.getElementById("loading-text");
  if (el) el.textContent = msg;
  document.getElementById("loading-overlay")?.classList.remove("hidden");
}

function hideLoading() {
  document.getElementById("loading-overlay")?.classList.add("hidden");
}

let confirmCallback = null;
function showConfirm(text, cb) {
  const el = document.getElementById("confirm-text");
  if (el) el.textContent = text;
  confirmCallback = cb;
  document.getElementById("confirm-modal")?.classList.remove("hidden");
}

document.getElementById("confirm-yes-btn")?.addEventListener("click", () => {
  document.getElementById("confirm-modal")?.classList.add("hidden");
  if (confirmCallback) { confirmCallback(); confirmCallback = null; }
});

document.getElementById("confirm-no-btn")?.addEventListener("click", () => {
  document.getElementById("confirm-modal")?.classList.add("hidden");
  confirmCallback = null;
});

/* ════════════════════════════════════
   INIT APPLICATION
═════════════════════════════════════ */
function renderAll() {
  renderDashboard();
  renderCrops();
  renderMarketTable();
  renderExpenses();
  renderDues();
}

function init() {
  loadState();

  // Set today date
  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    dateEl.textContent = new Date().toLocaleDateString("en-IN", opts);
  }

  applyFarmerProfile();
  renderAll();

  // Fetch real-time weather
  const city = state.farmer.location ? state.farmer.location.split(",")[0].trim() : "Indore";
  fetchLiveWeather(city);

  console.log("🌾 KisanMitra initialized successfully with Gemini AI!");
}

document.addEventListener("DOMContentLoaded", init);
if (document.readyState === "interactive" || document.readyState === "complete") {
  init();
}
