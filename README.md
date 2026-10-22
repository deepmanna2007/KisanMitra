# 🌾 KisanMitra (किसान मित्र)
### Smart AI Farming Assistant & Rural Deed Ledger
*Built for Hacktoberfest 2026 – Open-Source AI Challenge Week 3: Slow and Steady*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini%20AI-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/)

---

## 📖 Overview

**KisanMitra** is a lightweight, responsive, and privacy-respecting Web AI application designed for smallholder farmers in India. It solves daily cognitive overload by automating field scheduling, market price tracking, weather agro-advisories, farm expenses, and informal loan/deed agreements (**Bahi-Khata**).

---

## ✨ Key Features

1. **🌱 Crop & Irrigation Scheduler (ICAR Standards)**:
   - Automated watering and pesticide rotation countdowns for major Indian crops (**Wheat, Rice/Paddy, Tomato, Cotton, Mustard, Soybean, Potato, and Gram**).
   - Real-time urgency badges: 🔴 Overdue, 🟡 Due Soon, 🟢 Optimal.
   - 1-Click *"Watered Today"* and *"Sprayed Today"* action buttons.
   - **🤖 AI Schedule Optimizer**: Calculates ideal irrigation windows tailored to your soil, crop, and region.

2. **🤝 Deed & Bahi-Khata Ledger (Rural Finance)**:
   - Track **"Dena Hai"** (Payable Deeds / Loans: Land lease, fertilizer credit, tractor rent, KCC) and **"Lena Hai"** (Receivables from mandi traders and buyers).
   - **💬 1-Click WhatsApp Reminders**: Generates polite, pre-formatted payment reminder messages in Hindi or English.
   - **💵 Partial Settlement**: Log partial payments; auto-updates remaining balances and syncs directly into farm expenses.

3. **📈 Mandi Market Prices (मंडी भाव)**:
   - Benchmark APMC mandi rates across India (Indore, Azadpur, Rajkot, etc.).
   - Search by crop, filter by state, and log personal crop sale prices.
   - **Gemini AI Market Intelligence**: Forecasts price trends and suggests the best selling windows.

4. **⛅ Live Agro-Weather Advisory**:
   - Live weather telemetry (temperature, humidity, wind, rainfall probability) powered by Open-Meteo API.
   - Crop safety advisories: warns against pesticide spraying during high winds (>18 km/h) or fungal risks in high humidity.

5. **🎙️ Voice AI Farm Doctor**:
   - Bilingual support (**Hindi & English**).
   - Hands-free voice speech input (🎙️) and voice readout (🔊) built with the browser Web Speech API.

---

## 🚀 Quickstart & Setup

No heavy frameworks or node dependencies required. KisanMitra runs directly in any modern web browser!

### 1. Clone the Repository
```bash
git clone https://github.com/deepmanna2007/KisanMitra.git
cd KisanMitra
```

### 2. Configure Your Gemini API Key (Secure)
To use the Gemini AI features:
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Copy `config.example.js` to `config.js`:
   ```bash
   cp config.example.js config.js
   ```
3. Open `config.js` and paste your API key:
   ```javascript
   const CONFIG = {
     GEMINI_API_KEY: "YOUR_ACTUAL_API_KEY"
   };
   ```
*(Note: `config.js` is automatically excluded by `.gitignore` to keep your credentials safe! Alternatively, you can also paste your API key directly inside the app's Settings modal).*

### 3. Run Locally
Open `index.html` in your browser, or start a lightweight local web server:
```bash
# Using Node.js
npx serve .

# OR using Python
python -m http.server 3000
```
Then visit: `http://localhost:3000`

---

## 🔒 Security & Privacy

- **No Hardcoded Secrets**: Secret API keys are strictly externalized via `config.js` (gitignored) or browser `localStorage`.
- **Local-First Data**: All farm logs, crop lists, financial deeds, and transactions reside strictly on the user's device (`localStorage`).
- **Resilient AI Pipeline**: Automatically falls back gracefully across `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, and an internal offline agricultural database.

---

## 📄 License

Distributed under the [MIT License](LICENSE). Free for farmers, developers, and open-source contributors!
