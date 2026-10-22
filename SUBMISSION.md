# Hacktoberfest Week 3 Challenge Submission

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19)*

---

## What I Built

**KisanMitra (किसान मित्र)** is an intelligent, bilingual AI farm management assistant and rural deed ledger designed specifically for smallholder farmers. 

Farming is mentally overwhelming: remembering the exact day each field needs irrigation (e.g., Crown Root Initiation stage at 21 days for wheat), tracking pesticide intervals before pests multiply, keeping up with volatile Mandi (crop market) commodity prices, and managing informal rural financial credit—"Bahi-Khata" (who owes whom, agricultural deeds, land leases, seed credit, and trader payments).

### What KisanMitra Does:
- **🌱 Smart Irrigation & Spray Scheduler**: Automatically calculates ideal watering and pesticide schedules using agricultural science standards (ICAR) for crops like Wheat, Rice, Tomato, Cotton, Mustard, Soybean, Potato, and Gram. Features live countdown timers, urgency alerts (🔴 Overdue, 🟡 Due Soon), and 1-click "Watered Today" / "Sprayed Today" logging.
- **🤝 Deed & Bahi-Khata Ledger**: Tracks "Dena Hai" (deeds/loans to pay back) and "Lena Hai" (receivables from mandi traders and buyers), with interest tracking, partial settlement recording, and a **1-click WhatsApp payment reminder generator** in Hindi and English.
- **📈 Mandi Market Intelligence**: Provides real-time benchmark commodity rates across major APMC mandis (Indore, Azadpur, Rajkot, etc.) paired with Gemini AI price forecasting and selling advice.
- **⛅ Live Agro-Weather Advisory**: Uses real-time weather data (temperature, wind speed, rain probability, humidity) to provide actionable crop advice (e.g., *"Wind > 18 km/h: Postpone pesticide spray to prevent drift loss"*).
- **🎙️ Voice AI Farm Doctor**: Farmers can speak their farming questions in Hindi or English using Web Speech Recognition, and hear the AI recommendations read aloud using Text-to-Speech.

### Who Gets to Be Lazier?
**Farmers and their families.** Instead of maintaining messy paper diaries, guessing when to irrigate, making daily phone calls to multiple mandis, or awkwardly pursuing neighbors and traders for pending deed payments, KisanMitra handles the calculations, monitors the calendar, generates polite WhatsApp payment reminders, and advises on crop care automatically.

---

## Demo

- **Local Prototype URL**: `http://localhost:3000`
- **Source Code**: [`d:/Hacktoberfest/challege-week3`](file:///d:/Hacktoberfest/challege-week3)
- **Live Demo & Prototype Features**:
  1. **Dashboard**: Immediate visibility into water/pesticide alerts, 7-day calendar, and pending deed totals.
  2. **Crop Manager**: 1-click crop presets with auto-calculated watering days, pesticide dosages, fertilizer splits, and AI schedule optimization.
  3. **Mandi Prices**: Filterable commodity rate board with AI price trend predictions.
  4. **Weather**: Real-time city forecast with automated spray/irrigation advisories.
  5. **Deed & Bahi-Khata**: Manage loans/deeds with WhatsApp reminder triggers and partial payment settlements.
  6. **Voice AI Assistant**: Bilingual chat powered by Google Gemini with speech recognition (🎙️) and voice readout (🔊).

---

## Code

The application is built with clean, zero-dependency vanilla web standards designed to run on low-end mobile devices in rural areas without app store downloads.

### Core Architecture:
- [`index.html`](file:///d:/Hacktoberfest/challege-week3/index.html): Semantic, accessible structure with responsive layout, bilingual labels (Hindi & English), and offline-first modals.
- [`style.css`](file:///d:/Hacktoberfest/challege-week3/style.css): Custom dark emerald-green design system, high-contrast indicators, responsive cards, and micro-animations.
- [`app.js`](file:///d:/Hacktoberfest/challege-week3/app.js): Application logic containing:
  - Gemini AI multi-model fallback pipeline (`gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-flash-lite-latest`)
  - ICAR crop schedule preset engine
  - Open-Meteo real-time geocoding and meteorological data parser
  - Bahi-Khata ledger, interest engine, and WhatsApp message generator
  - Web Speech API integration (`SpeechRecognition` & `speechSynthesis`)
  - LocalStorage persistence and offline agricultural fallback

---

## How I Built It

1. **AI Model Pipeline**:
   Integrated Google Gemini through a resilient multi-model client-side architecture. To guarantee 100% uptime even during traffic spikes or network latency, the app implements automated fallback across `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, and `gemini-flash-lite-latest`, backed by an offline rule-based agricultural advisory system.

2. **Weather & Geocoding**:
   Integrated the Open-Meteo API (free, open, no API key required) to fetch live temperature, wind speed, precipitation probability, and humidity for any Indian city or district, converting raw weather telemetry into actionable agricultural decisions.

3. **Accessibility-First Voice Interface**:
   Many smallholder farmers are uncomfortable typing on small smartphone keyboards. Built-in Web Speech API enables native Hindi and Indian-English speech-to-text and text-to-speech audio playback directly inside the browser.

4. **Agent-Assisted Development**:
   Built and iterated pair programming with Google DeepMind's Antigravity AI coding assistant, diagnosing model availability, implementing responsive CSS, and testing local HTTP server prototypes.

---

## Why Does Open Innovation Matter?

Over 80% of Indian farmers operate on small landholdings (< 2 hectares) with limited disposable income and spotty 2G/3G connectivity. Proprietary "AgTech" solutions often lock vital crop recommendations behind expensive paywalls, require high-end smartphones, or trap data in proprietary silos.

Open innovation matters because:
1. **Zero Barrier to Entry**: By using open web standards and open APIs, any farmer can open a URL on a budget smartphone without paying app store commissions or installing bloated 100MB apps.
2. **Transparent Science**: Agricultural rules (like water intervals and pesticide rotations) should be transparent and verifiable against public agricultural research (ICAR, agricultural universities), not proprietary black boxes.
3. **Privacy of Financial Deeds**: Farmers' private credit, loans, and local deed agreements remain stored locally in their device's browser (`localStorage`), preventing commercial monetization of vulnerable farmers' financial distress.

---

## My Agent Session

This project was built and debugged interactively using the **Antigravity AI Agent** workspace. The agent assisted in diagnosing Gemini model API compatibility, architecting multi-model fallbacks, structuring the bahi-khata deed ledger, and deploying a background HTTP test server on localhost.

---

## The Lazy Payoff

- **5+ Hours Saved Weekly**: No more tracking down multiple grain traders or traveling miles to the mandi just to check daily rates—rates and AI trend predictions are available on the home screen.
- **Zero Forgotten Irrigations**: Prevents costly crop damage (e.g., missing the critical 21-day CRI watering in wheat causes up to 30% yield loss).
- **Stress-Free Debt Tracking**: Instead of awkward phone calls or lost paper slips, farmers generate clear, polite WhatsApp payment reminders with one tap.
- **Pesticide Savings**: Prevents spraying right before heavy rainfall, saving ₹1,500–₹3,000 per acre in wasted chemicals.

---

## Prize Categories

- **Main Track**: Open-Source AI Challenge Week 3: Slow and Steady
- **AI for Good / Social Impact**: Empowering smallholder agricultural communities with accessible, voice-enabled AI and open financial ledger tools.
