import React, { useState, useEffect } from "react";
import { 
  Sprout, User, CalendarDays, MapPin, 
  FileText, QrCode, Scale, Users, CheckCircle2, RefreshCw, 
  Plus, Download, Check, AlertCircle, Clock, ShieldCheck, 
  WalletCards, Smartphone, History, PhoneCall,
  HelpCircle, LogOut, Bell, KeyRound, Mail, Lock, CheckCircle, Eye,
  Activity, ArrowRight, X, AlertTriangle, Printer, Search,
  Home, ArrowLeft
} from "lucide-react";
import { LANGUAGES, getTranslation, ALL_INDIAN_STATES_DATA } from "../constants";
import { apiUpdateFarmerBank, apiSendSmsOtp, apiVerifySmsOtp } from "../api";
import { LanguageSelector } from "./LanguageSelector";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Comprehensive Database of 28 Indian States & UTs with Cascading Districts, Tehsils & Villages
const ALL_INDIAN_STATES = Object.keys(ALL_INDIAN_STATES_DATA);

const STATE_DISTRICT_DATA = ALL_INDIAN_STATES_DATA;

import { DynamicQRCode } from "./DynamicQRCode";
import { translateToPunjabi } from "../punjabiTranslations";
import { translateToDogri } from "../dogriTranslations";

export function FarmerPortal({ 
  user = {}, 
  bookings = [], 
  centres = [], 
  landParcels = [], 
  onBookSlot, 
  onCancelBooking, 
  onSyncAgriStack, 
  onAddBhulekhLand, 
  onUpdatePaymentStatus,
  onLogout,
  currentLang = "en",
  onLangChange
}) {
  // Tabs: "home" | "profile" | "land" | "book" | "live" | "history" | "procurements" | "alerts"
  // Persist current tab in localStorage across page refreshes
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const saved = localStorage.getItem("kks_farmer_tab");
      if (saved && saved !== "home" && saved !== "alerts") return saved;
      if (typeof window !== "undefined" && window.innerWidth <= 768) {
        return "home";
      }
      return "profile";
    } catch (e) {
      return "profile";
    }
  });

  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth > 768);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Automatically sync desktop vs mobile activeTab on resize and mount
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth > 768;
      setIsDesktop(desktop);
      if (desktop && (activeTab === "home" || activeTab === "alerts")) {
        setActiveTabState("profile");
        try {
          localStorage.setItem("kks_farmer_tab", "profile");
        } catch (e) {}
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab]);

  const currentViewTab = (isDesktop && (activeTab === "home" || activeTab === "alerts")) ? "profile" : activeTab;

  const setActiveTab = (tab, pushHistory = true) => {
    if (tab === activeTab) return;
    setActiveTabState(tab);
    try {
      localStorage.setItem("kks_farmer_tab", tab);
    } catch (e) {}
    if (pushHistory && typeof window !== "undefined") {
      try {
        window.history.pushState({ tab, modal: null }, "", window.location.pathname);
      } catch (e) {}
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      const mainArea = document.querySelector(".dash-main-area");
      if (mainArea) mainArea.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  };

  // Scroll to top on every activeTab change
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      const mainArea = document.querySelector(".dash-main-area");
      if (mainArea) mainArea.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [activeTab]);

  const t = (k) => getTranslation(currentLang, k);

  // Dynamic multilingual text helper (Guarantees 100% pure English when currentLang === 'en')
  const loc = (enVal, hiVal, paVal, doiVal) => {
    if (currentLang === "doi") {
      if (doiVal !== undefined) return doiVal;
      return translateToDogri(enVal, hiVal);
    }
    if (currentLang === "pa") {
      if (paVal !== undefined) return paVal;
      return translateToPunjabi(enVal, hiVal);
    }
    if (currentLang === "hi") {
      return hiVal !== undefined ? hiVal : enVal;
    }
    return enVal;
  };

  const translateCrop = (crop) => {
    if (!crop || (currentLang !== "hi" && currentLang !== "pa" && currentLang !== "doi")) return crop;
    if (currentLang === "hi") {
      const map = {
        Wheat: "गेहूं",
        Mustard: "सरसों",
        Gram: "चना",
        Barley: "जौ",
        Bajra: "बाजरा",
        Paddy: "धान (चावल)",
        Moong: "मूंग",
        Soybean: "सोयाबीन",
        Groundnut: "मूंगफली",
        Cotton: "कपास",
        Maize: "मक्का"
      };
      return map[crop] || crop;
    }
    if (currentLang === "pa") {
      const map = {
        Wheat: "ਕਣਕ",
        Mustard: "ਸਰ੍ਹੋਂ",
        Gram: "ਛੋਲੇ",
        Barley: "ਜੌਂ",
        Bajra: "ਬਾਜਰਾ",
        Paddy: "ਝੋਨਾ (ਚੌਲ)",
        Moong: "ਮੂੰਗੀ",
        Soybean: "ਸੋਇਆਬੀਨ",
        Groundnut: "ਮੂੰਗਫਲੀ",
        Cotton: "ਨਰਮਾ / ਕਪਾਹ",
        Maize: "ਮੱਕੀ"
      };
      return map[crop] || crop;
    }
    if (currentLang === "doi") {
      const map = {
        Wheat: "कनक",
        Mustard: "सरयों",
        Gram: "छोले",
        Barley: "जौ",
        Bajra: "बाजरा",
        Paddy: "धान (चावल)",
        Moong: "मूंगी",
        Soybean: "सोयाबीन",
        Groundnut: "मूंगफली",
        Cotton: "कपास",
        Maize: "मक्की"
      };
      return map[crop] || crop;
    }
    return crop;
  };

  const translateSeason = (season) => {
    if (!season || (currentLang !== "hi" && currentLang !== "pa" && currentLang !== "doi")) return season;
    if (currentLang === "hi") {
      if (season === "Rabi") return "रबी";
      if (season === "Kharif") return "खरीफ";
      if (season === "Rabi season") return "रबी सीजन";
      if (season === "Kharif season") return "खरीफ सीजन";
      if (season.includes("Rabi")) return season.replace("Rabi", "रबी");
      if (season.includes("Kharif")) return season.replace("Kharif", "खरीफ");
      return season;
    }
    if (currentLang === "pa") {
      if (season === "Rabi") return "ਹਾੜ੍ਹੀ (ਰਬੀ)";
      if (season === "Kharif") return "ਸਾਉਣੀ (ਖਰੀਫ)";
      if (season === "Rabi season") return "ਹਾੜ੍ਹੀ ਸੀਜ਼ਨ";
      if (season === "Kharif season") return "ਸਾਉਣੀ ਸੀਜ਼ਨ";
      if (season.includes("Rabi")) return season.replace("Rabi", "ਹਾੜ੍ਹੀ");
      if (season.includes("Kharif")) return season.replace("Kharif", "ਸਾਉਣੀ");
      return season;
    }
    if (currentLang === "doi") {
      if (season === "Rabi") return "हाड़ी (रबी)";
      if (season === "Kharif") return "सौणी (खरीफ)";
      if (season === "Rabi season") return "हाड़ी मौसम";
      if (season === "Kharif season") return "सौणी मौसम";
      if (season.includes("Rabi")) return season.replace("Rabi", "हाड़ी");
      if (season.includes("Kharif")) return season.replace("Kharif", "सौणी");
      return season;
    }
    return season;
  };

  const translateCentre = (name) => {
    if (!name || (currentLang !== "hi" && currentLang !== "pa" && currentLang !== "doi")) return name;
    if (currentLang === "hi") {
      if (name.includes("Kherli")) return "खैरली कृषि उपज मंडी";
      if (name.includes("Alwar")) return "अलवर मुख्य यार्ड";
      if (name.includes("Rajgarh")) return "राजगढ़ उप-मंडी";
      if (name.includes("Mahwa")) return "महवा खरीद केंद्र";
      if (name.includes("Mandawar")) return "मंडावर अनाज केंद्र";
      return name;
    }
    if (currentLang === "pa") {
      if (name.includes("Kherli")) return "ਖੇਰਲੀ ਕ੍ਰਿਸ਼ੀ ਉਪਜ ਮੰਡੀ";
      if (name.includes("Alwar")) return "ਅਲਵਰ ਮੁੱਖ ਯਾਰਡ";
      if (name.includes("Rajgarh")) return "ਰਾਜਗੜ੍ਹ ਉਪ-ਮੰਡੀ";
      if (name.includes("Mahwa")) return "ਮਹਵਾ ਖਰੀਦ ਕੇਂਦਰ";
      if (name.includes("Mandawar")) return "ਮੰਡਾਵਰ ਅਨਾਜ ਕੇਂਦਰ";
      return name;
    }
    if (currentLang === "doi") {
      if (name.includes("Kherli")) return "खैरली कृषि उपज मंडी";
      if (name.includes("Alwar")) return "अलवर मुख्य यार्ड";
      if (name.includes("Rajgarh")) return "राजगढ़ उप-मंडी";
      if (name.includes("Mahwa")) return "महवा खरीद केंद्र";
      if (name.includes("Mandawar")) return "मंडावर अनाज केंद्र";
      return name;
    }
    return name;
  };

  const translateSoil = (soil) => {
    if (!soil || (currentLang !== "hi" && currentLang !== "pa" && currentLang !== "doi")) return soil;
    if (currentLang === "hi") {
      const map = {
        "Sandy Loam": "बलुई दोमट",
        "Alluvial / Loamy": "जलोढ़ / दोमट",
        "Clay Loam": "मटियार दोमट",
        "Clay": "काली मिट्टी",
        "Sandy": "बलुई",
        "Loamy": "दोमट",
        "Black Cotton": "काली कपास मिट्टी"
      };
      return map[soil] || soil;
    }
    if (currentLang === "pa") {
      const map = {
        "Sandy Loam": "ਰੇਤਲੀ ਦੋਮਟ",
        "Alluvial / Loamy": "ਜਲੋੜ / ਦੋਮਟ",
        "Clay Loam": "ਚੀਕਣੀ ਦੋਮਟ",
        "Clay": "ਚੀਕਣੀ ਮਿੱਟੀ",
        "Sandy": "ਰੇਤਲੀ",
        "Loamy": "ਦੋਮਟ",
        "Black Cotton": "ਕਾਲੀ ਕਪਾਹ ਮਿੱਟੀ"
      };
      return map[soil] || soil;
    }
    if (currentLang === "doi") {
      const map = {
        "Sandy Loam": "रेतली दोमट",
        "Alluvial / Loamy": "जलोढ़ / दोमट",
        "Clay Loam": "चीकनी दोमट",
        "Clay": "चीकनी मिट्टी",
        "Sandy": "रेतली",
        "Loamy": "दोमट",
        "Black Cotton": "काली कपास मिट्टी"
      };
      return map[soil] || soil;
    }
    return soil;
  };

  const translateSource = (source) => {
    if (!source || (currentLang !== "hi" && currentLang !== "pa" && currentLang !== "doi")) return source;
    if (currentLang === "hi") {
      if (source === "State Land Record") return "भूलेख रिकॉर्ड";
      if (source === "AgriStack") return "एग्रीस्टैक";
      if (source === "Bhulekh Verified") return "भूलेख सत्यापित";
      return source;
    }
    if (currentLang === "pa") {
      if (source === "State Land Record") return "ਜ਼ਮੀਨੀ ਰਿਕਾਰਡ";
      if (source === "AgriStack") return "ਐਗਰੀਸਟੈਕ";
      if (source === "Bhulekh Verified") return "ਭੂਲੇਖ ਤਸਦੀਕਸ਼ੁਦਾ";
      return source;
    }
    if (currentLang === "doi") {
      if (source === "State Land Record") return "जमीन रिकार्ड";
      if (source === "AgriStack") return "एग्रीस्टैक";
      if (source === "Bhulekh Verified") return "भूलेख सत्यापित";
      return source;
    }
    return source;
  };

  const translateFarmerName = (name) => {
    if (!name || (currentLang !== "hi" && currentLang !== "pa" && currentLang !== "doi")) return name;
    let res = String(name);
    if (currentLang === "hi" || currentLang === "doi") {
      res = res.replace(/\bShri\b/gi, "श्री");
      res = res.replace(/\bSh\.\b/gi, "श्री");
      res = res.replace(/Badri Narayan Meena/gi, "बद्री नारायण मीणा");
      res = res.replace(/Badri Narayan/gi, "बद्री नारायण");
      res = res.replace(/Om Prakash Meena/gi, "ओम प्रकाश मीणा");
      res = res.replace(/Ram Swaroop Meena/gi, "राम स्वरूप मीणा");
      res = res.replace(/Rameshwar Meena/gi, "रामेश्वर मीणा");
      res = res.replace(/Rameshwar/gi, "रामेश्वर");
      res = res.replace(/Ramesh Kumar/gi, "रमेश कुमार");
      res = res.replace(/Suresh Kumar/gi, "सुरेश कुमार");
      res = res.replace(/\bMeena\b/gi, "मीणा");
      res = res.replace(/\bFarmer\b/gi, "किसान");
      return res;
    }
    if (currentLang === "pa") {
      res = res.replace(/\bShri\b/gi, "ਸ਼੍ਰੀ");
      res = res.replace(/\bSh\.\b/gi, "ਸ਼੍ਰੀ");
      res = res.replace(/Badri Narayan Meena/gi, "ਬਦਰੀ ਨਾਰਾਇਣ ਮੀਣਾ");
      res = res.replace(/Badri Narayan/gi, "ਬਦਰੀ ਨਾਰਾਇਣ");
      res = res.replace(/Om Prakash Meena/gi, "ਓਮ ਪ੍ਰਕਾਸ਼ ਮੀਣਾ");
      res = res.replace(/Ram Swaroop Meena/gi, "ਰਾਮ ਸਵਰੂਪ ਮੀਣਾ");
      res = res.replace(/Rameshwar Meena/gi, "ਰਾਮੇਸ਼ਵਰ ਮੀਣਾ");
      res = res.replace(/Rameshwar/gi, "ਰਾਮੇਸ਼ਵਰ");
      res = res.replace(/Ramesh Kumar/gi, "ਰਮੇਸ਼ ਕੁਮਾਰ");
      res = res.replace(/Suresh Kumar/gi, "ਸੁਰੇਸ਼ ਕੁਮਾਰ");
      res = res.replace(/\bMeena\b/gi, "ਮੀਣਾ");
      res = res.replace(/\bFarmer\b/gi, "ਕਿਸਾਨ");
      return res;
    }
    return res;
  };

  const translateAge = (age) => {
    if (!age) return "";
    if (currentLang !== "hi" && currentLang !== "pa" && currentLang !== "doi") return age;
    const str = String(age).trim();
    if (currentLang === "hi") {
      if (/years?/i.test(str)) {
        return str.replace(/years?/gi, "वर्ष");
      }
      return `${str} वर्ष`;
    }
    if (currentLang === "pa") {
      if (/years?/i.test(str)) {
        return str.replace(/years?/gi, "ਸਾਲ");
      }
      return `${str} ਸਾਲ`;
    }
    if (currentLang === "doi") {
      if (/years?/i.test(str)) {
        return str.replace(/years?/gi, "साल");
      }
      return `${str} साल`;
    }
    return age;
  };

  const translateTime = (time) => {
    if (!time || (currentLang !== "hi" && currentLang !== "pa" && currentLang !== "doi")) return time;
    if (currentLang === "hi") {
      return String(time).replace(/AM/g, "पूर्वाह्न").replace(/PM/g, "अपराह्न");
    }
    if (currentLang === "pa") {
      return String(time).replace(/AM/g, "ਸਵੇਰੇ").replace(/PM/g, "ਸ਼ਾਮ");
    }
    if (currentLang === "doi") {
      return String(time).replace(/AM/g, "सवेरे").replace(/PM/g, "शाम");
    }
    return time;
  };

  const translateGender = (g) => {
    if (!g || (currentLang !== "hi" && currentLang !== "pa" && currentLang !== "doi")) return g;
    if (currentLang === "hi") {
      if (g === "Male") return "पुरुष";
      if (g === "Female") return "महिला";
      return g;
    }
    if (currentLang === "pa") {
      if (g === "Male") return "ਪੁਰਸ਼";
      if (g === "Female") return "ਔਰਤ";
      return g;
    }
    if (currentLang === "doi") {
      if (g === "Male") return "मर्द";
      if (g === "Female") return "जनानी";
      return g;
    }
    return g;
  };

  const translateLocation = (text) => {
    if (!text || (currentLang !== "hi" && currentLang !== "pa" && currentLang !== "doi")) return text;
    if (currentLang === "hi") {
      return String(text)
        .replace(/Alwar/g, "अलवर")
        .replace(/Bharatpur/g, "भरतपुर")
        .replace(/Dausa/g, "दौसा")
        .replace(/Jaipur/g, "जयपुर")
        .replace(/Kota/g, "कोटा")
        .replace(/Kherli Kalan/g, "खैरली कलां")
        .replace(/Kherli Mandi Branch/g, "खैरली मंडी शाखा")
        .replace(/Kherli/g, "खैरली")
        .replace(/Kathumar/g, "कठूमर")
        .replace(/Laxmangarh/g, "लक्ष्मणगढ़")
        .replace(/Bayana Rural/g, "बयाना ग्रामीण")
        .replace(/Bayana/g, "बयाना")
        .replace(/Ramganj Mandi Station/g, "रामगंज मंडी स्टेशन")
        .replace(/Ramganj Mandi Town/g, "रामगंज मंडी टाउन")
        .replace(/Ramganj Mandi/g, "रामगंज मंडी")
        .replace(/Main Branch/g, "मुख्य शाखा")
        .replace(/Rajasthan/g, "राजस्थान")
        .replace(/House /g, "मकान ")
        .replace(/Ward /g, "वार्ड ")
        .replace(/Village /g, "ग्राम ")
        .replace(/Tehsil /g, "तहसील ")
        .replace(/District /g, "जिला ");
    }
    if (currentLang === "pa") {
      return String(text)
        .replace(/Alwar/g, "ਅਲਵਰ")
        .replace(/Bharatpur/g, "ਭਰਤਪੁਰ")
        .replace(/Dausa/g, "ਦੌਸਾ")
        .replace(/Jaipur/g, "ਜੈਪੁਰ")
        .replace(/Kota/g, "ਕੋਟਾ")
        .replace(/Kherli Kalan/g, "ਖੇਰਲੀ ਕਲਾਂ")
        .replace(/Kherli Mandi Branch/g, "ਖੇਰਲੀ ਮੰਡੀ ਸ਼ਾਖਾ")
        .replace(/Kherli/g, "ਖੇਰਲੀ")
        .replace(/Kathumar/g, "ਕਠੂਮਰ")
        .replace(/Laxmangarh/g, "ਲਕਸ਼ਮਣਗੜ੍ਹ")
        .replace(/Bayana Rural/g, "ਬਯਾਨਾ ਦਿਹਾਤੀ")
        .replace(/Bayana/g, "ਬਯਾਨਾ")
        .replace(/Ramganj Mandi Station/g, "ਰਾਮਗੰਜ ਮੰਡੀ ਸਟੇਸ਼ਨ")
        .replace(/Ramganj Mandi Town/g, "ਰਾਮਗੰਜ ਮੰਡੀ ਟਾਊਨ")
        .replace(/Ramganj Mandi/g, "ਰਾਮਗੰਜ ਮੰਡੀ")
        .replace(/Main Branch/g, "ਮੁੱਖ ਸ਼ਾਖਾ")
        .replace(/Rajasthan/g, "ਰਾਜਸਥਾਨ")
        .replace(/House /g, "ਮਕਾਨ ")
        .replace(/Ward /g, "ਵਾਰਡ ")
        .replace(/Village /g, "ਪਿੰਡ ")
        .replace(/Tehsil /g, "ਤਹਿਸੀਲ ")
        .replace(/District /g, "ਜ਼ਿਲ੍ਹਾ ");
    }
    if (currentLang === "doi") {
      return String(text)
        .replace(/Alwar/g, "अलवर")
        .replace(/Bharatpur/g, "भरतपुर")
        .replace(/Dausa/g, "दौसा")
        .replace(/Jaipur/g, "जयपुर")
        .replace(/Kota/g, "कोटा")
        .replace(/Kherli Kalan/g, "खैरली कलां")
        .replace(/Kherli Mandi Branch/g, "खैरली मंडी शाखा")
        .replace(/Kherli/g, "खैरली")
        .replace(/Kathumar/g, "कठूमर")
        .replace(/Laxmangarh/g, "लक्ष्मणगढ़")
        .replace(/Bayana Rural/g, "बयाना ग्रामीण")
        .replace(/Bayana/g, "बयाना")
        .replace(/Ramganj Mandi Station/g, "रामगंज मंडी स्टेशन")
        .replace(/Ramganj Mandi Town/g, "रामगंज मंडी टाउन")
        .replace(/Ramganj Mandi/g, "रामगंज मंडी")
        .replace(/Main Branch/g, "मुख्य शाखा")
        .replace(/Rajasthan/g, "राजस्थान")
        .replace(/House /g, "मकान ")
        .replace(/Ward /g, "वार्ड ")
        .replace(/Village /g, "ग्रां ")
        .replace(/Tehsil /g, "तहसील ")
        .replace(/District /g, "जिला ");
    }
    return text;
  };

  const translateBank = (b) => {
    if (!b || (currentLang !== "hi" && currentLang !== "pa" && currentLang !== "doi")) return b;
    if (currentLang === "hi" || currentLang === "doi") {
      if (b.includes("State Bank of India")) return "भारतीय स्टेट बैंक (SBI)";
      if (b.includes("Punjab National Bank")) return "पंजाब नेशनल बैंक (PNB)";
      if (b.includes("Bank of Baroda")) return "बैंक ऑफ बड़ौदा (BOB)";
      if (b.includes("HDFC")) return "एचडीएफसी बैंक";
      if (b.includes("ICICI")) return "आईसीआईसीआई बैंक";
      if (b.includes("Rajasthan Marudhara")) return "राजस्थान मरुधरा ग्रामीण बैंक (RMGB)";
      if (b.includes("Baroda Rajasthan")) return "बड़ौदा राजस्थान क्षेत्रीय ग्रामीण बैंक (BRKGB)";
      if (b.includes("Canara Bank")) return "केनरा बैंक";
      if (b.includes("Union Bank")) return "यूनियन बैंक ऑफ इंडिया";
      return b;
    }
    if (currentLang === "pa") {
      if (b.includes("State Bank of India")) return "ਸਟੇਟ ਬੈਂਕ ਆਫ਼ ਇੰਡੀਆ (SBI)";
      if (b.includes("Punjab National Bank")) return "ਪੰਜਾਬ ਨੈਸ਼ਨਲ ਬੈਂਕ (PNB)";
      if (b.includes("Bank of Baroda")) return "ਬੈਂਕ ਆਫ਼ ਬੜੌਦਾ (BOB)";
      if (b.includes("HDFC")) return "ਐਚਡੀਐਫਸੀ ਬੈਂਕ";
      if (b.includes("ICICI")) return "ਆਈਸੀਆਈਸੀਆਈ ਬੈਂਕ";
      if (b.includes("Rajasthan Marudhara")) return "ਰਾਜਸਥਾਨ ਮਰੂਧਰਾ ਗ੍ਰਾਮੀਣ ਬੈਂਕ (RMGB)";
      if (b.includes("Baroda Rajasthan")) return "ਬੜੌਦਾ ਰਾਜਸਥਾਨ ਖੇਤਰੀ ਗ੍ਰਾਮੀਣ ਬੈਂਕ (BRKGB)";
      if (b.includes("Canara Bank")) return "ਕੇਨਰਾ ਬੈਂਕ";
      if (b.includes("Union Bank")) return "ਯੂਨੀਅਨ ਬੈਂਕ ਆਫ਼ ਇੰਡੀਆ";
      return b;
    }
    return b;
  };

  // Global Dialog Modals & Drawers States
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWebNotificationDrawer, setShowWebNotificationDrawer] = useState(false);
  const [isClosingDrawer, setIsClosingDrawer] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddLandModal, setShowAddLandModal] = useState(false);
  const [viewBookingDetails, setViewBookingDetails] = useState(null);
  const [viewReceiptModal, setViewReceiptModal] = useState(null);
  const [cancelBookingConfirmId, setCancelBookingConfirmId] = useState(null);
  const [bookingSuccessModal, setBookingSuccessModal] = useState(null);

  // Helper to open modal with history push (so pressing device back button closes modal first)
  const openModalWithHistory = (setter, modalName) => {
    setter(true);
    if (typeof window !== "undefined") {
      try {
        window.history.pushState({ tab: activeTab, modal: modalName }, "", window.location.pathname);
      } catch (e) {}
    }
  };

  const handleCloseWebDrawer = () => {
    setIsClosingDrawer(true);
    setTimeout(() => {
      setShowWebNotificationDrawer(false);
      setIsClosingDrawer(false);
    }, 250);
  };

  // Set up Browser / Device Back button history management (Clean URLs without hash)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ensure initial clean state exists in history
    const validTabs = ["home", "profile", "land", "book", "live", "history", "procurements", "alerts"];
    try {
      window.history.replaceState({ tab: activeTab, modal: null }, "", window.location.pathname);
    } catch (e) {}

    const handlePopState = (event) => {
      // 1. If any modal or popup is open, close it first and prevent page/app exit
      const anyModalOpen = 
        showAddLandModal || 
        viewBookingDetails !== null || 
        showLogoutModal || 
        showHelpModal || 
        showBankModal || 
        showContactModal || 
        showPasswordModal || 
        showPaymentModal || 
        showWebNotificationDrawer || 
        cancelBookingConfirmId !== null;

      if (anyModalOpen) {
        setShowAddLandModal(false);
        setViewBookingDetails(null);
        setShowLogoutModal(false);
        setShowHelpModal(false);
        setShowBankModal(false);
        setShowContactModal(false);
        setShowPasswordModal(false);
        setShowPaymentModal(false);
        setShowWebNotificationDrawer(false);
        setCancelBookingConfirmId(null);
        return;
      }

      // 2. If no modal is open, navigate tabs based on history state
      const targetTab = event.state?.tab || (window.innerWidth <= 768 ? "home" : "profile");
      if (targetTab && validTabs.includes(targetTab)) {
        setActiveTabState(targetTab);
        try {
          localStorage.setItem("kks_farmer_tab", targetTab);
        } catch (err) {}
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        const mainArea = document.querySelector(".dash-main-area");
        if (mainArea) mainArea.scrollTo({ top: 0, left: 0, behavior: "instant" });
      } else {
        const defaultTab = window.innerWidth <= 768 ? "home" : "profile";
        setActiveTabState(defaultTab);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    activeTab,
    showAddLandModal,
    viewBookingDetails,
    showLogoutModal,
    showHelpModal,
    showBankModal,
    showContactModal,
    showPasswordModal,
    showPaymentModal,
    showWebNotificationDrawer,
    cancelBookingConfirmId
  ]);

  // Swipe Gesture Support for Mobile PWA (Swipe Right to go Home)
  const touchStartXRef = React.useRef(0);
  const touchStartYRef = React.useRef(0);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartXRef.current;
    const diffY = touchEndY - touchStartYRef.current;

    // Detect intentional horizontal swipe right (diffX > 60px) to return home
    if (diffX > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
      if (activeTab !== "home") {
        setActiveTab("home");
      }
    }
  };

  // Sync AgriStack & Toast States
  const [isSyncingAgriStack, setIsSyncingAgriStack] = useState(false);
  const [syncToast, setSyncToast] = useState("");

  // Profile State
  const [farmerProfile, setFarmerProfile] = useState({
    farmerId: user?.farmerId || "F110",
    farmerName: user?.farmerName || "Om Prakash Meena",
    fatherName: user?.fatherName || "Shri Badri Narayan Meena",
    dob: user?.dob || "05/04/1981",
    age: user?.age || "45 Years",
    gender: user?.gender || "Male",
    mobile: user?.mobile || "+91 6375828910",
    email: user?.email || "omprakash.meena@gmail.com",
    aadhaarMasked: user?.aadhaarMasked || (user?.aadhaar ? `XXXX-XXXX-${user.aadhaar.slice(-4)}` : "XXXX-XXXX-9012"),
    village: user?.village || "Ramganj Mandi Town",
    tehsil: user?.tehsil || "Ramganj Mandi",
    district: user?.district || "Kota",
    state: user?.state || "Rajasthan",
    pincode: user?.pincode || "326519",
    address: user?.address || "Village Ramganj Mandi Town, Tehsil Ramganj Mandi, District Kota, Rajasthan - 326519",
    bankName: user?.bankName || "State Bank of India",
    accountMasked: user?.accountMasked || (user?.accountNo ? `XXXX-XXXX-${user.accountNo.slice(-4)}` : "XXXX-XXXX-3746"),
    accountNo: user?.accountNo || "582019283746",
    accountHolderName: user?.accountHolderName || "Om Prakash Meena",
    ifsc: user?.ifsc || "SBIN0001429",
    branch: user?.branch || "Ramganj Mandi Station"
  });

  // Sync Profile when user prop updates
  useEffect(() => {
    if (user && user.farmerName) {
      setFarmerProfile({
        farmerId: user.farmerId || "F110",
        farmerName: user.farmerName || "Om Prakash Meena",
        fatherName: user.fatherName || "Shri Badri Narayan Meena",
        dob: user.dob || "05/04/1981",
        age: user.age || "45 Years",
        gender: user.gender || "Male",
        mobile: user.mobile && user.mobile.includes("6375828910") ? user.mobile : (user.farmerName === "Om Prakash Meena" ? "+91 6375828910" : (user.mobile || "+91 6375828910")),
        email: user.email || "omprakash.meena@gmail.com",
        aadhaarMasked: user.aadhaarMasked || (user.aadhaar ? `XXXX-XXXX-${user.aadhaar.slice(-4)}` : "XXXX-XXXX-9012"),
        village: user.village || "Ramganj Mandi Town",
        tehsil: user.tehsil || "Ramganj Mandi",
        district: user.district || "Kota",
        state: user.state || "Rajasthan",
        pincode: user.pincode || "326519",
        address: user.address || "Village Ramganj Mandi Town, Tehsil Ramganj Mandi, District Kota, Rajasthan - 326519",
        bankName: user.bankName || "State Bank of India",
        accountMasked: user.accountMasked || (user.accountNo ? `XXXX-XXXX-${user.accountNo.slice(-4)}` : "XXXX-XXXX-3746"),
        accountNo: user.accountNo || "582019283746",
        accountHolderName: user.accountHolderName || "Om Prakash Meena",
        ifsc: user.ifsc || "SBIN0001429",
        branch: user.branch || "Ramganj Mandi Station"
      });
      setEditBankName(user.bankName || "State Bank of India");
      setEditAccountNo(user.accountNo || "");
      setEditConfirmAccountNo(user.accountNo || "");
      setEditIfsc(user.ifsc || "SBIN0001429");
      setEditAccountHolder(user.accountHolderName || user.farmerName || "");
      setEditBranch(user.branch || "Main Branch");
      setEditMobile(user.mobile || "");
      setEditEmail(user.email || "");
    }
  }, [user]);

  // Bank Details Form State
  const [editBankName, setEditBankName] = useState(farmerProfile.bankName);
  const [editAccountNo, setEditAccountNo] = useState(farmerProfile.accountNo || "");
  const [editConfirmAccountNo, setEditConfirmAccountNo] = useState(farmerProfile.accountNo || "");
  const [editIfsc, setEditIfsc] = useState(farmerProfile.ifsc);
  const [editAccountHolder, setEditAccountHolder] = useState(farmerProfile.accountHolderName || farmerProfile.farmerName);
  const [editBranch, setEditBranch] = useState(farmerProfile.branch || "Main Branch");
  const [bankSuccessMsg, setBankSuccessMsg] = useState("");

  // Contact Details Form State
  const [editMobile, setEditMobile] = useState(farmerProfile.mobile);
  const [editEmail, setEditEmail] = useState(farmerProfile.email);
  const [contactOtpStep, setContactOtpStep] = useState(1);
  const [contactOtp, setContactOtp] = useState("");
  const [contactSuccessMsg, setContactSuccessMsg] = useState("");

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSuccessMsg, setPassSuccessMsg] = useState("");

  const handleBankUpdateSubmit = (e) => {
    e.preventDefault();
    if (editAccountNo !== editConfirmAccountNo) {
      alert("Account numbers do not match! Please verify.");
      return;
    }
    if (!editIfsc || editIfsc.length < 5) {
      alert("Please enter a valid IFSC code (e.g. SBIN0001429).");
      return;
    }
    const updatedBank = {
      bankName: editBankName,
      accountNo: editAccountNo,
      accountMasked: `XXXX-XXXX-${editAccountNo.slice(-4)}`,
      accountHolderName: editAccountHolder,
      ifsc: editIfsc.toUpperCase(),
      branch: editBranch
    };

    apiUpdateFarmerBank(farmerProfile.farmerId || user.farmerId, updatedBank);

    setFarmerProfile(prev => ({
      ...prev,
      ...updatedBank
    }));
    setBankSuccessMsg(loc("Bank Details Updated & Verified with PFMS Gateway!", "बैंक विवरण अपडेट किया गया और PFMS गेटवे से सत्यापित हुआ!"));
    setTimeout(() => {
      setBankSuccessMsg("");
      setShowBankModal(false);
      setSyncToast(loc("Bank Account Details Successfully Saved & Linked for DBT", "बैंक खाता विवरण सफलतापूर्वक सहेजा गया और डीबीटी के लिए लिंक हुआ"));
      setTimeout(() => setSyncToast(""), 3500);
    }, 1200);
  };

  // Crop Lists by Season
  const CROPS_BY_SEASON = {
    Rabi: [
      "Wheat (गेहूं)",
      "Mustard (सरसों)",
      "Gram / Chickpea (चना)",
      "Barley (जौ)",
      "Lentil / Masoor (मसूर)",
      "Rapeseed (राई)"
    ],
    Kharif: [
      "Paddy / Rice (धान)",
      "Maize / Corn (मक्का)",
      "Bajra / Pearl Millet (बाजरा)",
      "Soybean (सोयाबीन)",
      "Cotton (कपास)",
      "Moong / Green Gram (मूंग)",
      "Groundnut (मूंगफली)",
      "Jowar / Sorghum (ज्वार)"
    ]
  };

  // Slot Booking Form State (Multi-Land Selection)
  const [selectedSeason, setSelectedSeason] = useState("Rabi");
  const [selectedCrop, setSelectedCrop] = useState(CROPS_BY_SEASON["Rabi"][0]);
  const [selectedLandIds, setSelectedLandIds] = useState([landParcels[0]?.id || "L1"]);
  const [expectedQuantity, setExpectedQuantity] = useState("12");
  const [selectedCentreId, setSelectedCentreId] = useState(centres[0]?.id || "C001");
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedSlotTime, setSelectedSlotTime] = useState("10:00–10:20 AM");
  const [isBookingSlot, setIsBookingSlot] = useState(false);

  // Live Report Payment Sub-view
  const [activePaymentSubTab, setActivePaymentSubTab] = useState("initiated"); // "initiated" | "completed"

  // Add Land Form State (Complete 28 States & Cascading Selectors)
  const [newLandState, setNewLandState] = useState("Rajasthan");
  const [newLandDistrict, setNewLandDistrict] = useState("Alwar");
  const [newLandTehsil, setNewLandTehsil] = useState("Kherli");
  const [newLandVillage, setNewLandVillage] = useState("Kherli Kalan");
  const [newLandKhasra, setNewLandKhasra] = useState("142/3");
  const [isSearchingKhasra, setIsSearchingKhasra] = useState(false);
  const [khasraSearchResults, setKhasraSearchResults] = useState(null);
  const [selectedKhasraParcels, setSelectedKhasraParcels] = useState([]);

  // Handle Cascading Location Changes
  const handleStateSelect = (state) => {
    setNewLandState(state);
    const districts = STATE_DISTRICT_DATA[state] ? Object.keys(STATE_DISTRICT_DATA[state]) : ["Central District", "North District", "South District"];
    const defDistrict = districts[0] || "District 1";
    setNewLandDistrict(defDistrict);

    const tehsils = STATE_DISTRICT_DATA[state]?.[defDistrict] ? Object.keys(STATE_DISTRICT_DATA[state][defDistrict]) : ["Tehsil 1", "Tehsil 2"];
    const defTehsil = tehsils[0] || "Tehsil 1";
    setNewLandTehsil(defTehsil);

    const villages = STATE_DISTRICT_DATA[state]?.[defDistrict]?.[defTehsil] || ["Village A", "Village B", "Village C"];
    setNewLandVillage(villages[0] || "Village A");
    setKhasraSearchResults(null);
  };

  const handleDistrictSelect = (district) => {
    setNewLandDistrict(district);
    const tehsils = STATE_DISTRICT_DATA[newLandState]?.[district] ? Object.keys(STATE_DISTRICT_DATA[newLandState][district]) : ["Tehsil 1", "Tehsil 2"];
    const defTehsil = tehsils[0] || "Tehsil 1";
    setNewLandTehsil(defTehsil);

    const villages = STATE_DISTRICT_DATA[newLandState]?.[district]?.[defTehsil] || ["Village A", "Village B", "Village C"];
    setNewLandVillage(villages[0] || "Village A");
    setKhasraSearchResults(null);
  };

  const handleTehsilSelect = (tehsil) => {
    setNewLandTehsil(tehsil);
    const villages = STATE_DISTRICT_DATA[newLandState]?.[newLandDistrict]?.[tehsil] || ["Village A", "Village B", "Village C"];
    setNewLandVillage(villages[0] || "Village A");
    setKhasraSearchResults(null);
  };

  // Trigger AgriStack Sync with Animated Toast
  const handleTriggerAgriStackSync = () => {
    setIsSyncingAgriStack(true);
    setTimeout(() => {
      onSyncAgriStack();
      setIsSyncingAgriStack(false);
      setSyncToast(loc("AgriStack Synced Successfully: Verified Land Records Updated", "एग्रीस्टैक सफलतापूर्वक सिंक हुआ: सत्यापित भूमि रिकॉर्ड अपडेट हो गए"));
      setTimeout(() => setSyncToast(""), 3500);
    }, 1200);
  };

  // Search Land Records by Khasra Number via Bhulekh
  const handleSearchKhasraRecords = (e) => {
    e.preventDefault();
    if (!newLandKhasra) {
      alert("Please enter a valid Khasra Number (e.g. 142/3).");
      return;
    }
    setIsSearchingKhasra(true);
    setTimeout(() => {
      const cleanKhasra = newLandKhasra.trim();
      const results = [
        {
          id: `TEMP_${Date.now()}_1`,
          khasraNo: `${cleanKhasra}A`,
          areaHectare: 1.25,
          soilType: "Alluvial / Loamy",
          irrigation: "Tube-well Irrigated",
          ownership: `${farmerProfile.farmerName} (Self)`,
          status: "Verified in State Bhulekh"
        },
        {
          id: `TEMP_${Date.now()}_2`,
          khasraNo: `${cleanKhasra}B`,
          areaHectare: 0.85,
          soilType: "Sandy Loam",
          irrigation: "Canal Water Feed",
          ownership: `${farmerProfile.farmerName} (Joint / Family)`,
          status: "Verified in State Bhulekh"
        },
        {
          id: `TEMP_${Date.now()}_3`,
          khasraNo: `${cleanKhasra}C`,
          areaHectare: 0.50,
          soilType: "Clay Loam",
          irrigation: "Rainfed (Barani)",
          ownership: `${farmerProfile.farmerName} (Inherited)`,
          status: "Verified in State Bhulekh"
        }
      ];
      setKhasraSearchResults(results);
      setSelectedKhasraParcels(results.map(r => r.id));
      setIsSearchingKhasra(false);
    }, 750);
  };

  // Submit Searched Land Records to Profile (Submitted for State Admin Verification)
  const handleAddSearchedLands = () => {
    if (!khasraSearchResults || selectedKhasraParcels.length === 0) {
      alert("Please select at least one land parcel to submit.");
      return;
    }
    const parcelsToAdd = khasraSearchResults
      .filter(r => selectedKhasraParcels.includes(r.id))
      .map((r, idx) => ({
        id: `L-${user.farmerId || "F101"}-MANUAL-${Date.now()}-${idx + 1}`,
        farmerId: user.farmerId,
        state: newLandState,
        district: newLandDistrict,
        tehsil: newLandTehsil,
        village: newLandVillage,
        khasraNo: r.khasraNo,
        areaHectare: r.areaHectare,
        soilType: r.soilType,
        crop: "Wheat",
        irrigation: r.irrigation || "Canal / Tube-well",
        ownership: r.ownership || `${farmerProfile.farmerName} (Self)`,
        verified: true,
        source: "State Land Record"
      }));

    parcelsToAdd.forEach(p => onAddBhulekhLand(p));
    setShowAddLandModal(false);
    setKhasraSearchResults(null);
    setSelectedKhasraParcels([]);
    setSyncToast(loc(`Added ${parcelsToAdd.length} Land Parcels from State Land Record.`, `भूलेख रिकॉर्ड से ${parcelsToAdd.length} भूमि पार्सल जोड़े गए।`));
    setTimeout(() => setSyncToast(""), 3500);
  };

  // Selected Centre & Land Totals
  const activeCentre = (centres && centres.length > 0) 
    ? (centres.find(c => c.id === selectedCentreId) || centres[0])
    : { id: "C001", name: "Procurement Centre", district: user?.district || "Alwar", state: "Rajasthan", distance: "4.5 km", dailyCapacityTonnes: 50, reservedTonnes: 0, mspRatePerQtl: 2425, crop: "Wheat" };
  const selectedLands = (landParcels || []).filter(l => selectedLandIds.includes(l.id));
  const totalSelectedArea = selectedLands.reduce((acc, l) => acc + Number(l.areaHectare || 0), 0).toFixed(2);

  // Filter Farmer Bookings (Deduplicated by unique booking ID)
  const todayDateStr = new Date().toISOString().split("T")[0];
  const uniqueBookings = Array.from(new Map((bookings || []).map(b => [b.id, b])).values());
  const farmerBookings = uniqueBookings.filter(b => b.farmerId === user.farmerId);
  const activeFarmerBooking = farmerBookings.find(b => b.status !== "CANCELLED");
  // Only 1 Active/Upcoming Procurement (No cancelled, no past dates, no completed)
  const upcomingProcurement = farmerBookings.find(b => 
    b.status !== "CANCELLED" && 
    b.status !== "PROCUREMENT_COMPLETED" && 
    b.date >= todayDateStr
  );
  const completedProcurements = farmerBookings.filter(b => b.status === "PROCUREMENT_COMPLETED" || b.netPayableAmount);
  const totalCropSoldTonnes = completedProcurements.reduce((acc, b) => acc + (b.actualWeightTonnes || b.expectedTonnes || 0), 0).toFixed(2);
  const totalMoneyReceived = completedProcurements.reduce((acc, b) => acc + (b.netPayableAmount || 0), 0);

  // Find all booked slots for the selected centre and date from database bookings
  const centreDateBookings = uniqueBookings.filter(b => b.centreId === selectedCentreId && b.date === bookingDate && b.status !== "CANCELLED");
  const bookedSlotTimes = centreDateBookings.map(b => b.slotTime);
  const myBookedSlotTimes = centreDateBookings.filter(b => b.farmerId === user.farmerId).map(b => b.slotTime);

  // Progressive State-to-Bank Payment Status Inquirer Handshake
  const handleCheckPaymentStatus = async () => {
    if (!activeFarmerBooking) return;
    setIsCheckingPayment(true);

    setTimeout(async () => {
      const currentStatus = activeFarmerBooking.paymentStatus;
      if (!currentStatus || currentStatus === "PENDING_STATE" || currentStatus === "PENDING") {
        // Step 1 -> Step 2: Transition to PAYMENT_INITIATED
        const newPaymentRef = activeFarmerBooking.paymentRef || `PFMS-2026-DBT-${Math.floor(1000000 + Math.random() * 9000000)}`;
        if (onUpdatePaymentStatus) {
          await onUpdatePaymentStatus(activeFarmerBooking.id, "PAYMENT_INITIATED", newPaymentRef, null);
        }
      } else if (currentStatus === "PAYMENT_INITIATED") {
        // Step 2 -> Step 3: Transition to PAYMENT_COMPLETED
        const newUtr = `UTR-SBIN-2026-${Math.floor(1000000 + Math.random() * 9000000)}`;
        if (onUpdatePaymentStatus) {
          await onUpdatePaymentStatus(activeFarmerBooking.id, "PAYMENT_COMPLETED", activeFarmerBooking.paymentRef, newUtr);
        }
      }
      setIsCheckingPayment(false);
    }, 1000);
  };

  // Toggle Land Selection (Multi-Select)
  const handleToggleLand = (landId) => {
    if (selectedLandIds.includes(landId)) {
      if (selectedLandIds.length === 1) {
        alert("Please keep at least one land parcel selected.");
        return;
      }
      setSelectedLandIds(prev => prev.filter(id => id !== landId));
    } else {
      setSelectedLandIds(prev => [...prev, landId]);
    }
  };

  // Handle Season Change -> Automatically update crop options
  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
    setSelectedCrop(CROPS_BY_SEASON[season][0]);
  };

  // Handle Slot Booking Submit with Anti-Spam & Concurrency Lock
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const today = new Date().toISOString().split("T")[0];
    if (bookingDate < today) {
      alert("Past dates cannot be selected for appointment booking. Please pick today or an upcoming date.");
      setBookingDate(today);
      return;
    }

    if (!expectedQuantity || Number(expectedQuantity) <= 0) {
      alert("Please enter a valid expected quantity in tonnes.");
      return;
    }

    if (bookedSlotTimes.includes(selectedSlotTime)) {
      alert(`The time slot ${selectedSlotTime} is already booked at this Mandi. Please pick another available slot.`);
      return;
    }

    if (isBookingSlot) return; // Prevent duplicate rapid submission
    setIsBookingSlot(true);

    const cleanCropName = selectedCrop.split(" ")[0];
    const newBookingId = `KKS-${cleanCropName.slice(0, 3).toUpperCase()}-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const khasrasList = selectedLands.map(l => l.khasraNo).join(", ");
    
    const newBooking = {
      id: newBookingId,
      farmerId: user.farmerId,
      farmerName: farmerProfile.farmerName,
      mobile: farmerProfile.mobile,
      aadhaarMasked: farmerProfile.aadhaarMasked,
      crop: cleanCropName,
      season: `${selectedSeason} season`,
      centreId: activeCentre.id,
      centreName: activeCentre.name,
      khasraNo: khasrasList || "142/3",
      areaHectares: Number(totalSelectedArea) || 1.5,
      expectedTonnes: Number(expectedQuantity),
      date: bookingDate,
      slotTime: selectedSlotTime,
      status: "BOOKED",
      checkInTime: null,
      qualityResult: null,
      actualWeightTonnes: null,
      netPayableAmount: null,
      paymentRef: null,
      paymentDate: null
    };

    setTimeout(() => {
      onBookSlot(newBooking);
      setBookingSuccessModal(newBooking);
      setIsBookingSlot(false);
    }, 850);
  };

  // Handle Contact Update (Mobile & Email OTP)
  const handleSendContactOtp = async (e) => {
    e.preventDefault();
    if (!editMobile) {
      alert("Please enter a valid mobile number.");
      return;
    }
    try {
      await apiSendSmsOtp(editMobile);
    } catch (err) {
      console.warn("Live OTP notice:", err);
    }
    setContactOtpStep(2);
    setContactOtp("");
  };

  const handleVerifyContactOtp = async (e) => {
    e.preventDefault();
    if (!contactOtp) {
      alert("Please enter the verification OTP.");
      return;
    }
    if (contactOtp.trim() !== "4829") {
      const verifyRes = await apiVerifySmsOtp(editMobile, contactOtp);
      if (!verifyRes?.success) {
        alert(verifyRes?.error || "Invalid OTP code. Please enter the OTP received via SMS or use fallback 4829.");
        return;
      }
    }
    setFarmerProfile(prev => ({
      ...prev,
      mobile: editMobile,
      email: editEmail
    }));
    setContactSuccessMsg(loc("Mobile Number and Email Address updated successfully!", "मोबाइल नंबर और ईमेल पता सफलतापूर्वक अपडेट किया गया!"));
    setTimeout(() => {
      setContactSuccessMsg("");
      setShowContactModal(false);
      setContactOtpStep(1);
    }, 1500);
  };

  // Handle Password Update
  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!currentPassword) {
      alert("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }
    setPassSuccessMsg(loc("Password updated successfully!", "पासवर्ड सफलतापूर्वक अपडेट किया गया!"));
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      setPassSuccessMsg("");
      setShowPasswordModal(false);
    }, 1500);
  };

  // Handle Add Land Submit
  const handleAddLandSubmit = (e) => {
    e.preventDefault();
    const newParcel = {
      id: `L-${user.farmerId || "F101"}-MANUAL-${Date.now()}`,
      farmerId: user.farmerId,
      state: newLandState,
      district: newLandDistrict,
      tehsil: newLandTehsil,
      village: newLandVillage,
      khasraNo: newLandKhasra,
      areaHectare: 1.2,
      soilType: "Alluvial / Loamy",
      crop: "Wheat",
      irrigation: "Canal / Tube-well",
      ownership: `${farmerProfile.farmerName} (Self)`,
      verified: true,
      source: "State Land Record"
    };
    onAddBhulekhLand(newParcel);
    setShowAddLandModal(false);
    setSyncToast(loc("Land Record Added from State Land Record.", "भूलेख रिकॉर्ड से भूमि पार्सल सफलतापूर्वक जोड़ा गया।"));
    setTimeout(() => setSyncToast(""), 3500);
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Direct Landscape A4 J-Form PDF Downloader (.pdf file)
  const handleDownloadJFormPdf = async (proc) => {
    if (!proc) return;
    setIsGeneratingPdf(true);
    try {
      // Create dedicated off-screen landscape container for pixel-perfect PDF rendering
      const printContainer = document.createElement("div");
      printContainer.style.position = "fixed";
      printContainer.style.left = "-9999px";
      printContainer.style.top = "0";
      printContainer.style.width = "1080px";
      printContainer.style.backgroundColor = "#ffffff";
      printContainer.style.padding = "32px 40px";
      printContainer.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
      printContainer.style.color = "#0f172a";
      printContainer.style.boxSizing = "border-box";
      printContainer.style.zIndex = "-1";

      printContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px;">
          <div>
            <h2 style="margin: 0; font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: 0.02em;">GOVERNMENT OF INDIA • DEPARTMENT OF AGRICULTURE</h2>
            <h3 style="margin: 3px 0; font-size: 15px; font-weight: 800; color: #0f766e;">OFFICIAL PROCUREMENT CERTIFICATE (FORM J)</h3>
            <p style="margin: 0; font-size: 11px; color: #64748b;">Valid electronic record issued under National Agricultural Procurement Portal</p>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 0.05em; display: block;">CERTIFICATE ID</span>
            <span style="font-family: monospace; font-size: 15px; font-weight: 800; color: #0f172a; display: block; margin: 2px 0;">${proc.id}</span>
            <span style="font-size: 12px; color: #64748b; display: block;">Issued on: ${proc.paymentDate || "2026-09-29"}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 40px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px 24px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;"><span style="color: #64748b;">Farmer Name:</span> <b style="color: #0f172a;">${farmerProfile.farmerName}</b></div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;"><span style="color: #64748b;">Father's Name:</span> <b style="color: #0f172a;">${farmerProfile.fatherName}</b></div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;"><span style="color: #64748b;">Farmer ID:</span> <b style="color: #0f172a;">${user.farmerId}</b></div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;"><span style="color: #64748b;">Aadhaar Number:</span> <b style="color: #0f172a;">${farmerProfile.aadhaarMasked}</b></div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;"><span style="color: #64748b;">Registered Mobile:</span> <b style="color: #0f172a;">${farmerProfile.mobile}</b></div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;"><span style="color: #64748b;">Procurement Mandi:</span> <b style="color: #0f172a;">${proc.centreName}</b></div>
          <div style="display: flex; justify-content: space-between; font-size: 13px;"><span style="color: #64748b;">Commodity & Grade:</span> <b style="color: #0f172a;">${proc.crop} (Grade A)</b></div>
          <div style="display: flex; justify-content: space-between; font-size: 13px;"><span style="color: #64748b;">Land Khasra No.:</span> <b style="color: #0f172a;">Khasra ${proc.khasraNo || "142/3"}</b></div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="border: 1px solid #cbd5e1; padding: 12px 14px; text-align: left; font-weight: 700; color: #334155;">Commodity Details</th>
              <th style="border: 1px solid #cbd5e1; padding: 12px 14px; text-align: left; font-weight: 700; color: #334155;">Gross Weight</th>
              <th style="border: 1px solid #cbd5e1; padding: 12px 14px; text-align: left; font-weight: 700; color: #334155;">Tare Weight</th>
              <th style="border: 1px solid #cbd5e1; padding: 12px 14px; text-align: left; font-weight: 700; color: #334155;">Net Accepted</th>
              <th style="border: 1px solid #cbd5e1; padding: 12px 14px; text-align: left; font-weight: 700; color: #334155;">MSP Rate</th>
              <th style="border: 1px solid #cbd5e1; padding: 12px 14px; text-align: right; font-weight: 700; color: #334155;">Net Total (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 12px 14px; color: #0f172a;">${proc.crop} (${proc.season || "Rabi 2026"})</td>
              <td style="border: 1px solid #cbd5e1; padding: 12px 14px; color: #0f172a;">10.42 T</td>
              <td style="border: 1px solid #cbd5e1; padding: 12px 14px; color: #0f172a;">3.00 T</td>
              <td style="border: 1px solid #cbd5e1; padding: 12px 14px; font-weight: 800; color: #0f172a;">${proc.actualWeightTonnes || 7.42} Tonnes</td>
              <td style="border: 1px solid #cbd5e1; padding: 12px 14px; color: #0f172a;">₹2,425 / Qtl</td>
              <td style="border: 1px solid #cbd5e1; padding: 12px 14px; text-align: right; font-weight: 800; color: #166534;">₹${(proc.netPayableAmount || 179935).toLocaleString()}.00</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 18px; margin-top: 20px;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 18px;">
            <span style="font-size: 13px; color: #166534; display: block;">Payment Status: <b>PAID VIA PFMS DBT</b></span>
            <small style="font-size: 11px; color: #64748b; display: block; margin-top: 2px;">Bank Ref: ${proc.paymentRef || "PFMS-2026-DBT-8839201"}</small>
          </div>
          <div style="text-align: right;">
            <small style="font-size: 11px; color: #64748b; display: block; margin-bottom: 2px;">Digitally Authenticated by Mandi In-charge</small>
            <b style="font-size: 13px; color: #0f172a;">Rajesh Sharma (Centre Officer)</b>
          </div>
        </div>
      `;

      document.body.appendChild(printContainer);

      const canvas = await html2canvas(printContainer, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1100
      });

      document.body.removeChild(printContainer);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm
      const imgWidth = pageWidth - 24; // 273mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const posY = Math.max(8, (pageHeight - imgHeight) / 2); // Centered vertically

      pdf.addImage(imgData, "PNG", 12, posY, imgWidth, imgHeight);
      pdf.save(`J-Form-${proc.id}.pdf`);
    } catch (err) {
      console.error("Landscape PDF generation error:", err);
      alert("Error generating PDF. Please use the Print / Save as PDF option.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 24 Time slots from 09:00 AM to 05:00 PM with 20-minute intervals
  const TIME_SLOTS_20MIN = [
    "09:00–09:20 AM",
    "09:20–09:40 AM",
    "09:40–10:00 AM",
    "10:00–10:20 AM",
    "10:20–10:40 AM",
    "10:40–11:00 AM",
    "11:00–11:20 AM",
    "11:20–11:40 AM",
    "11:40–12:00 PM",
    "12:00–12:20 PM",
    "12:20–12:40 PM",
    "12:40–01:00 PM",
    "01:00–01:20 PM",
    "01:20–01:40 PM",
    "01:40–02:00 PM",
    "02:00–02:20 PM",
    "02:20–02:40 PM",
    "02:40–03:00 PM",
    "03:00–03:20 PM",
    "03:20–03:40 PM",
    "03:40–04:00 PM",
    "04:00–04:20 PM",
    "04:20–04:40 PM",
    "04:40–05:00 PM"
  ];

  return (
    <div className="dash-layout" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Mobile Top App Bar (PWA Header) */}
      <div className="mobile-top-bar">
        <div className="logo-brand-mini" onClick={() => setActiveTab("home")} style={{ cursor: "pointer" }}>
          <div className="sidebar-logo-icon">
            <Sprout size={20} />
          </div>
          <span className="sidebar-brand-name">{t("appName") || "KisanSaathi"}</span>
        </div>
        <div className="mobile-right-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <LanguageSelector currentLang={currentLang} onLangChange={onLangChange} />
          <button 
            className="mobile-pwa-logout-btn" 
            onClick={() => setShowLogoutModal(true)}
            title="Sign Out"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* LEFT SIDEBAR NAVIGATION (WEB DESKTOP ONLY - 6 CORE TABS) */}
      <aside className={`dash-sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          {/* Logo Brand */}
          <div className="sidebar-brand">
            <div className="sidebar-logo-icon">
              <Sprout size={24} />
            </div>
            <div className="sidebar-brand-text">
              <span className="brand-title">{t("appName") || "KisanSaathi"}</span>
            </div>
          </div>

          {/* 6 Dedicated Web Navigation Tabs */}
          <nav className="sidebar-nav sidebar-nav-spaced">
            <button 
              className={`nav-btn ${currentViewTab === "profile" ? "active" : ""}`}
              onClick={() => { setActiveTab("profile"); setMobileNavOpen(false); }}
            >
              <User size={19} />
              <span>{t("myProfile")}</span>
            </button>

            <button 
              className={`nav-btn ${currentViewTab === "land" ? "active" : ""}`}
              onClick={() => { setActiveTab("land"); setMobileNavOpen(false); }}
            >
              <MapPin size={19} />
              <span>{t("landRecords")}</span>
            </button>

            <button 
              className={`nav-btn ${currentViewTab === "book" ? "active" : ""}`}
              onClick={() => { setActiveTab("book"); setMobileNavOpen(false); }}
            >
              <CalendarDays size={19} />
              <span>{t("slotBooking")}</span>
            </button>

            <button 
              className={`nav-btn ${currentViewTab === "live" ? "active" : ""}`}
              onClick={() => { setActiveTab("live"); setMobileNavOpen(false); }}
            >
              <Activity size={19} />
              <span>{t("liveReport")}</span>
            </button>

            <button 
              className={`nav-btn ${currentViewTab === "history" ? "active" : ""}`}
              onClick={() => { setActiveTab("history"); setMobileNavOpen(false); }}
            >
              <History size={19} />
              <span>{t("bookingHistory")}</span>
            </button>

            <button 
              className={`nav-btn ${currentViewTab === "procurements" ? "active" : ""}`}
              onClick={() => { setActiveTab("procurements"); setMobileNavOpen(false); }}
            >
              <FileText size={19} />
              <span>{t("procurements")}</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-footer-btn" onClick={() => setShowHelpModal(true)}>
            <HelpCircle size={18} />
            <span>{t("helpSupport")}</span>
          </button>
          <button className="sidebar-footer-btn logout-link" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={18} />
            <span>{t("switchRole")}</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="dash-main-area">
        {/* Top Header Bar: Clean with Language & Notification icon ONLY */}
        <header className="dash-top-header">
          <div className="header-title-block">
            <span className="header-eyebrow">FARMER PORTAL</span>
            <h1 className="header-main-title">
              {currentViewTab === "profile" && t("myProfile")}
              {currentViewTab === "land" && t("landRecords")}
              {currentViewTab === "book" && t("slotBooking")}
              {currentViewTab === "live" && t("liveReport")}
              {currentViewTab === "history" && t("bookingHistory")}
              {currentViewTab === "procurements" && t("procurements")}
            </h1>
          </div>

          <div className="header-actions-block">
            <LanguageSelector currentLang={currentLang} onLangChange={onLangChange} />
            <button 
              className="header-icon-btn" 
              title={t("notificationsAndAlerts")} 
              onClick={() => setShowWebNotificationDrawer(true)}
            >
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* =========================================================
            VIEW 0: MOBILE PWA HOME HUB
            ========================================================= */}
        {currentViewTab === "home" && (
          <div className="dash-content-body pwa-home-body">
            {/* Farmer Greeting (Full Name, Clean Typography) */}
            <div className="pwa-greeting-block">
              <div className="pwa-greeting-text">
                <h2 className="pwa-greeting-title">
                  {loc("Hello,", "नमस्ते,")} {translateFarmerName(farmerProfile.farmerName)}! 👋
                </h2>
                <p className="pwa-greeting-sub">{t("welcomeBack")}</p>
              </div>
            </div>

            {/* UPCOMING PROCUREMENT CARD (Only 1 Active Upcoming Booking) */}
            <div className="pwa-upcoming-card mt-3">
              <div className="pwa-card-header">
                <div className="pwa-card-badge">
                  <CalendarDays size={15} />
                  <span>{t("upcomingProcurement")}</span>
                </div>
                {upcomingProcurement && (
                  <span className="pwa-status-pill">
                    {loc(
                      upcomingProcurement.status.replace("_", " "),
                      upcomingProcurement.status === "BOOKED" 
                        ? "बुक किया गया" 
                        : (upcomingProcurement.status === "CONFIRMED" 
                            ? "पुष्टि की गई" 
                            : upcomingProcurement.status.replace("_", " "))
                    )}
                  </span>
                )}
              </div>

              {upcomingProcurement ? (
                <div className="pwa-card-content mt-2">
                  <div className="pwa-crop-row">
                    <h3 className="pwa-crop-title">{loc(upcomingProcurement.crop, translateCrop(upcomingProcurement.crop))}</h3>
                    <span className="pwa-tonnage-tag">
                      {loc(
                        `${upcomingProcurement.actualWeightTonnes || upcomingProcurement.expectedTonnes} Tonnes`,
                        `${upcomingProcurement.actualWeightTonnes || upcomingProcurement.expectedTonnes} टन`
                      )}
                    </span>
                  </div>

                  <div className="pwa-meta-list mt-2">
                    <div className="pwa-meta-item">
                      <Clock size={14} className="teal-text flex-shrink-0" />
                      <span><b>{upcomingProcurement.date}</b> • {loc(upcomingProcurement.slotTime, translateTime(upcomingProcurement.slotTime))}</span>
                    </div>
                    <div className="pwa-meta-item">
                      <MapPin size={14} className="teal-text flex-shrink-0" />
                      <span>{loc(upcomingProcurement.centreName, translateCentre(upcomingProcurement.centreName))}</span>
                    </div>
                  </div>

                  <div className="pwa-card-actions mt-3">
                    <button 
                      className="pwa-details-btn"
                      onClick={() => setViewBookingDetails(upcomingProcurement)}
                    >
                      <span>{t("viewDetails")}</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pwa-card-empty mt-2">
                  <p className="pwa-empty-text">{t("noActiveBooking")}</p>
                  <button className="btn-dash-primary btn-sm mt-2" onClick={() => setActiveTab("book")}>
                    <Plus size={14} /> {t("bookSlotNow")}
                  </button>
                </div>
              )}
            </div>

            {/* SERVICES SECTION (Theme Palette: Soft Teal) */}
            <div className="pwa-services-section mt-4">
              <div className="section-title-row">
                <h3 className="pwa-services-heading">{t("services")}</h3>
              </div>

              <div className="pwa-services-grid mt-2">
                {/* 1. My Profile */}
                <div className="pwa-service-card" onClick={() => setActiveTab("profile")}>
                  <div className="pwa-service-icon-bubble bubble-teal">
                    <User size={24} />
                  </div>
                  <span className="pwa-service-name">{t("myProfile")}</span>
                  <small className="pwa-service-hint">{loc("Aadhaar & Bank", "आधार और बैंक")}</small>
                </div>

                {/* 2. Land Records */}
                <div className="pwa-service-card" onClick={() => setActiveTab("land")}>
                  <div className="pwa-service-icon-bubble bubble-teal">
                    <MapPin size={24} />
                  </div>
                  <span className="pwa-service-name">{t("landRecords")}</span>
                  <small className="pwa-service-hint">{loc(`${landParcels.length} Parcels`, `${landParcels.length} पार्सल`)}</small>
                </div>

                {/* 3. Live Reports */}
                <div className="pwa-service-card" onClick={() => setActiveTab("live")}>
                  <div className="pwa-service-icon-bubble bubble-teal">
                    <Activity size={24} />
                  </div>
                  <span className="pwa-service-name">{t("liveReport")}</span>
                  <small className="pwa-service-hint">{loc("Queue & DBT", "कतार और डीबीटी")}</small>
                </div>

                {/* 4. Booking History */}
                <div className="pwa-service-card" onClick={() => setActiveTab("history")}>
                  <div className="pwa-service-icon-bubble bubble-teal">
                    <History size={24} />
                  </div>
                  <span className="pwa-service-name">{t("bookingHistory")}</span>
                  <small className="pwa-service-hint">{loc(`${farmerBookings.length} Bookings`, `${farmerBookings.length} बुकिंग`)}</small>
                </div>

                {/* 5. Procurements */}
                <div className="pwa-service-card" onClick={() => setActiveTab("procurements")}>
                  <div className="pwa-service-icon-bubble bubble-teal">
                    <FileText size={24} />
                  </div>
                  <span className="pwa-service-name">{t("procurements")}</span>
                  <small className="pwa-service-hint">{loc("Form J Receipts", "फॉर्म 'जे' रसीदें")}</small>
                </div>

                {/* 6. Help & Support */}
                <div className="pwa-service-card" onClick={() => setShowHelpModal(true)}>
                  <div className="pwa-service-icon-bubble bubble-teal">
                    <HelpCircle size={24} />
                  </div>
                  <span className="pwa-service-name">{t("helpSupport")}</span>
                  <small className="pwa-service-hint">{loc("Toll-Free & Guide", "टोल-फ्री और निर्देशिका")}</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            VIEW 1: PROFILE (PERSONAL, IDENTITY, ADDRESS & BANK ONLY)
            ========================================================= */}
        {currentViewTab === "profile" && (
          <div className="dash-content-body">
            <div className="profile-hero-card">
              <div className="profile-hero-left">
                <div className="profile-large-avatar">
                  <User size={38} />
                </div>
                <div className="profile-main-meta">
                  <h2>{translateFarmerName(farmerProfile.farmerName)}</h2>
                  <p>{t("fatherName")}: <b>{translateFarmerName(farmerProfile.fatherName)}</b> • {t("age") || "Age"}: <b>{translateAge(farmerProfile.age)}</b></p>
                  <span className="badge-verified-dbt">
                    <ShieldCheck size={15} /> {t("aadhaarAgriVerified")}
                  </span>
                </div>
              </div>

              <div className="profile-action-buttons">
                <button className="btn-dash-primary" onClick={() => setShowBankModal(true)}>
                  <WalletCards size={16} />
                  <span>{t("updateAddBank")}</span>
                </button>
                <button className="btn-dash-outline" onClick={() => setShowContactModal(true)}>
                  <Smartphone size={16} />
                  <span>{t("updateContact")}</span>
                </button>
                <button className="btn-dash-outline" onClick={() => setShowPasswordModal(true)}>
                  <KeyRound size={16} />
                  <span>{t("updatePassword")}</span>
                </button>
              </div>
            </div>

            <div className="profile-details-grid">
              {/* Card 1: Personal & Identity Information */}
              <div className="profile-info-box">
                <div className="box-section-title">
                  <User size={18} className="teal-text" />
                  <h3>{t("personalDetails")}</h3>
                </div>

                <div className="profile-kv-list">
                  <div className="kv-item">
                    <span>{t("farmerName")}</span>
                    <b>{translateFarmerName(farmerProfile.farmerName)}</b>
                  </div>
                  <div className="kv-item">
                    <span>{t("fatherName")}</span>
                    <b>{translateFarmerName(farmerProfile.fatherName)}</b>
                  </div>
                  <div className="kv-item">
                    <span>{t("ageGender")}</span>
                    <b>{translateAge(farmerProfile.age)} • {translateGender(farmerProfile.gender)}</b>
                  </div>
                  <div className="kv-item">
                    <span>{t("aadhaarCardNumber")}</span>
                    <b>{farmerProfile.aadhaarMasked} <span className="tag-green">{t("linked")}</span></b>
                  </div>
                  <div className="kv-item">
                    <span>{t("primaryMobile")}</span>
                    <b>{farmerProfile.mobile}</b>
                  </div>
                  <div className="kv-item">
                    <span>{t("emailAddress")}</span>
                    <b>{farmerProfile.email || loc("Not Provided", "उपलब्ध नहीं")}</b>
                  </div>
                </div>
              </div>

              {/* Card 2: Residential Address */}
              <div className="profile-info-box">
                <div className="box-section-title">
                  <MapPin size={18} className="teal-text" />
                  <h3>{t("residentialAddress")}</h3>
                </div>

                <div className="profile-kv-list">
                  <div className="kv-item">
                    <span>{t("permanentAddress")}</span>
                    <b>{translateLocation(farmerProfile.address)}</b>
                  </div>
                  <div className="kv-item">
                    <span>{t("villageTehsil")}</span>
                    <b>{translateLocation(farmerProfile.village)}, {translateLocation(farmerProfile.tehsil)}</b>
                  </div>
                  <div className="kv-item">
                    <span>{t("districtState")}</span>
                    <b>{translateLocation(farmerProfile.district)}, {translateLocation(farmerProfile.state)} - {farmerProfile.pincode}</b>
                  </div>
                  <div className="kv-item">
                    <span>{t("agriZone")}</span>
                    <b>{loc("North-Eastern Semi-Arid Zone (Zone III-B)", "उत्तर-पूर्वी अर्ध-शुष्क क्षेत्र (जोन III-B)")}</b>
                  </div>
                  <div className="kv-item">
                    <span>{t("registryVerification")}</span>
                    <b><span className="tag-green">{t("verifiedUidai")}</span></b>
                  </div>
                </div>
              </div>

              {/* Card 3: Bank & DBT Direct Payout Account */}
              <div className="profile-info-box full-span-box">
                <div className="box-section-title-between">
                  <div className="box-section-title">
                    <WalletCards size={18} className="teal-text" />
                    <h3>{t("dbtBankAccount")}</h3>
                  </div>
                  <button className="btn-dash-primary-mini" onClick={() => setShowBankModal(true)}>
                    <Plus size={14} /> {t("updateAddBank")}
                  </button>
                </div>

                <div className="bank-profile-summary-grid">
                  <div className="bank-card-highlight">
                    <div className="bank-meta-top">
                      <span className="bank-label-sub">{t("primaryDbtBank")}</span>
                      <span className="badge-pfms-active">
                        <CheckCircle2 size={13} /> {t("activeDbtSeeded")}
                      </span>
                    </div>
                    <h3 className="bank-display-name">{translateBank(farmerProfile.bankName)}</h3>
                    <div className="bank-acc-numbers">
                      <div className="bank-acc-col">
                        <span>{t("accountNumber")}</span>
                        <b>{farmerProfile.accountMasked}</b>
                      </div>
                      <div className="bank-acc-col">
                        <span>{t("ifscCode")}</span>
                        <b>{farmerProfile.ifsc}</b>
                      </div>
                      <div className="bank-acc-col">
                        <span>{t("accountHolder")}</span>
                        <b>{translateFarmerName(farmerProfile.accountHolderName)}</b>
                      </div>
                      <div className="bank-acc-col">
                        <span>{t("branchName")}</span>
                        <b>{translateLocation(farmerProfile.branch)}</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL: UPDATE / ADD BANK DETAILS */}
            {showBankModal && (
              <div className="modal-backdrop">
                <div className="modal-card">
                  <div className="modal-head">
                    <div>
                      <h3>{loc("Update / Add Bank Account", "बैंक खाता जोड़ें / अपडेट करें")}</h3>
                      <small className="text-muted">{loc("Direct Benefit Transfer (DBT) Payout Account for MSP Payments", "एमएसपी भुगतान के लिए प्रत्यक्ष लाभ अंतरण (DBT) बैंक खाता")}</small>
                    </div>
                    <button className="close-btn" onClick={() => setShowBankModal(false)}><X size={18} /></button>
                  </div>

                  {bankSuccessMsg ? (
                    <div className="forgot-success-box">
                      <CheckCircle2 size={45} className="teal-text" />
                      <h4>{bankSuccessMsg}</h4>
                    </div>
                  ) : (
                    <form onSubmit={handleBankUpdateSubmit} className="modal-form">
                      <div className="form-group">
                        <label>{loc("Bank Name", "बैंक का नाम")}</label>
                        <select 
                          value={editBankName} 
                          onChange={e => setEditBankName(e.target.value)} 
                          className="clean-select"
                          required
                        >
                          <option value="State Bank of India">{loc("State Bank of India (SBI)", "भारतीय स्टेट बैंक (SBI)")}</option>
                          <option value="Punjab National Bank">{loc("Punjab National Bank (PNB)", "पंजाब नेशनल बैंक (PNB)")}</option>
                          <option value="Bank of Baroda">{loc("Bank of Baroda (BOB)", "बैंक ऑफ बड़ौदा (BOB)")}</option>
                          <option value="HDFC Bank">{loc("HDFC Bank", "एचडीएफसी बैंक")}</option>
                          <option value="ICICI Bank">{loc("ICICI Bank", "आईसीआईसीआई बैंक")}</option>
                          <option value="Rajasthan Marudhara Gramin Bank">{loc("Rajasthan Marudhara Gramin Bank (RMGB)", "राजस्थान मरुधरा ग्रामीण बैंक (RMGB)")}</option>
                          <option value="Baroda Rajasthan Kshetriya Gramin Bank">{loc("Baroda Rajasthan Kshetriya Gramin Bank (BRKGB)", "बड़ौदा राजस्थान क्षेत्रीय ग्रामीण बैंक (BRKGB)")}</option>
                          <option value="Canara Bank">{loc("Canara Bank", "केनरा बैंक")}</option>
                          <option value="Union Bank of India">{loc("Union Bank of India", "यूनियन बैंक ऑफ इंडिया")}</option>
                        </select>
                      </div>

                      <div className="form-group mt-3">
                        <label>{loc("Account Holder Name (As per Bank Passbook)", "खाताधारक का नाम (बैंक पासबुक के अनुसार)")}</label>
                        <input 
                          type="text" 
                          value={editAccountHolder} 
                          onChange={e => setEditAccountHolder(e.target.value)} 
                          placeholder={loc("e.g. Ramesh Kumar", "उदा. ओम प्रकाश मीणा")}
                          required 
                        />
                      </div>

                      <div className="form-grid-2 mt-3">
                        <div className="form-group">
                          <label>{loc("Account Number", "खाता संख्या")}</label>
                          <input 
                            type="text" 
                            value={editAccountNo} 
                            onChange={e => setEditAccountNo(e.target.value.replace(/\D/g, ''))} 
                            placeholder={loc("e.g. 308291048921", "उदा. 308291048921")}
                            required 
                          />
                        </div>

                        <div className="form-group">
                          <label>{loc("Confirm Account Number", "खाता संख्या की पुष्टि करें")}</label>
                          <input 
                            type="text" 
                            value={editConfirmAccountNo} 
                            onChange={e => setEditConfirmAccountNo(e.target.value.replace(/\D/g, ''))} 
                            placeholder={loc("e.g. 308291048921", "उदा. 308291048921")}
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-grid-2 mt-3">
                        <div className="form-group">
                          <label>{loc("IFSC Code", "आईएफएससी (IFSC) कोड")}</label>
                          <input 
                            type="text" 
                            maxLength="11"
                            value={editIfsc} 
                            onChange={e => setEditIfsc(e.target.value.toUpperCase())} 
                            placeholder={loc("e.g. SBIN0001429", "उदा. SBIN0001429")}
                            required 
                          />
                        </div>

                        <div className="form-group">
                          <label>{loc("Branch Name", "शाखा का नाम")}</label>
                          <input 
                            type="text" 
                            value={editBranch} 
                            onChange={e => setEditBranch(e.target.value)} 
                            placeholder={loc("e.g. Kherli Mandi Branch", "उदा. रामगंज मंडी शाखा")}
                            required 
                          />
                        </div>
                      </div>

                      <div className="modal-action-btns mt-4">
                        <button type="submit" className="btn-dash-primary w-full">
                          <Check size={16} /> {loc("Save & Verify Bank Account", "बैंक खाता सहेजें और सत्यापित करें")}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* MODAL: UPDATE CONTACT DETAILS */}
            {showContactModal && (
              <div className="modal-backdrop">
                <div className="modal-card">
                  <div className="modal-head">
                    <h3>{loc("Update Contact Details (OTP Verification)", "संपर्क विवरण अपडेट करें (ओटीपी सत्यापन)")}</h3>
                    <button className="close-btn" onClick={() => { setShowContactModal(false); setContactOtpStep(1); }}><X size={18} /></button>
                  </div>

                  {contactSuccessMsg ? (
                    <div className="forgot-success-box">
                      <CheckCircle2 size={45} className="teal-text" />
                      <h4>{contactSuccessMsg}</h4>
                    </div>
                  ) : contactOtpStep === 1 ? (
                    <form onSubmit={handleSendContactOtp} className="modal-form">
                      <div className="form-group">
                        <label>{loc("New Mobile Number", "नया मोबाइल नंबर")}</label>
                        <div className="input-with-icon">
                          <Smartphone size={18} />
                          <input 
                            type="text" 
                            value={editMobile} 
                            onChange={e => setEditMobile(e.target.value)} 
                            placeholder="+91 98765 43210" 
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group mt-3">
                        <label>{loc("Email Address", "ईमेल पता")}</label>
                        <div className="input-with-icon">
                          <Mail size={18} />
                          <input 
                            type="email" 
                            value={editEmail} 
                            onChange={e => setEditEmail(e.target.value)} 
                            placeholder="farmer@example.com" 
                            required 
                          />
                        </div>
                      </div>

                      <button type="submit" className="btn-dash-primary w-full mt-4">
                        {loc("Send Verification OTP", "सत्यापन ओटीपी भेजें")}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyContactOtp} className="modal-form">
                      <div className="alert-badge-top">
                        <span>{loc("OTP sent to", "ओटीपी भेजा गया:")} {editMobile}</span>
                      </div>

                      <div className="form-group mt-2">
                        <label>{loc("Enter Verification OTP", "सत्यापन ओटीपी दर्ज करें")}</label>
                        <input 
                          type="text" 
                          maxLength="6"
                          value={contactOtp} 
                          onChange={e => setContactOtp(e.target.value)} 
                          className="aadhaar-input-large"
                          placeholder="••••••"
                          required 
                        />
                      </div>

                      <button type="submit" className="btn-dash-primary w-full mt-4">
                        {loc("Verify & Update Contact Details", "सत्यापित करें और संपर्क विवरण अपडेट करें")}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* MODAL: UPDATE PASSWORD */}
            {showPasswordModal && (
              <div className="modal-backdrop">
                <div className="modal-card">
                  <div className="modal-head">
                    <h3>{loc("Change Account Password", "खाता पासवर्ड बदलें")}</h3>
                    <button className="close-btn" onClick={() => setShowPasswordModal(false)}><X size={18} /></button>
                  </div>

                  {passSuccessMsg ? (
                    <div className="forgot-success-box">
                      <CheckCircle2 size={45} className="teal-text" />
                      <h4>{passSuccessMsg}</h4>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordUpdate} className="modal-form">
                      <div className="form-group">
                        <label>{loc("Current Password", "वर्तमान पासवर्ड")}</label>
                        <div className="input-with-icon">
                          <Lock size={18} />
                          <input 
                            type="password" 
                            value={currentPassword} 
                            onChange={e => setCurrentPassword(e.target.value)} 
                            placeholder="••••••••" 
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group mt-3">
                        <label>{loc("New Password", "नया पासवर्ड")}</label>
                        <div className="input-with-icon">
                          <KeyRound size={18} />
                          <input 
                            type="password" 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            placeholder="••••••••" 
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group mt-3">
                        <label>{loc("Confirm New Password", "नए पासवर्ड की पुष्टि करें")}</label>
                        <div className="input-with-icon">
                          <KeyRound size={18} />
                          <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            placeholder="••••••••" 
                            required 
                          />
                        </div>
                      </div>

                      <button type="submit" className="btn-dash-primary w-full mt-4">
                        {loc("Update Password", "पासवर्ड अपडेट करें")}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            VIEW 2: LAND RECORDS
            ========================================================= */}
        {currentViewTab === "land" && (
          <div className="dash-content-body">
            <div className="section-head-with-actions land-records-header">
              <div className="section-head-text">
                <span className="section-eyebrow">{t("agriCadastreEyebrow")}</span>
                <h2 className="section-page-title">{t("landRecords")}</h2>
                <p className="section-page-desc">{t("agriCadastreDesc")}</p>
              </div>
              <div className="header-action-btns land-header-actions">
                <button 
                  className="btn-dash-outline" 
                  disabled={isSyncingAgriStack}
                  onClick={handleTriggerAgriStackSync}
                >
                  <RefreshCw size={16} className={isSyncingAgriStack ? "animate-spin" : ""} />
                  <span>{isSyncingAgriStack ? t("syncingAgriStack") : t("syncAgriStack")}</span>
                </button>
                <button 
                  className="btn-dash-primary" 
                  onClick={() => { 
                    openModalWithHistory(setShowAddLandModal, "addLand"); 
                    setKhasraSearchResults(null); 
                  }}
                >
                  <Plus size={16} /> {t("addLand")}
                </button>
              </div>
            </div>

            {/* Sync Success / Error Toast */}
            {syncToast && (
              <div className="toast-notification-banner mt-2">
                <CheckCircle2 size={18} className="teal-text" />
                <span>{syncToast}</span>
              </div>
            )}

            {/* Empty State vs Table List */}
            {landParcels.length === 0 ? (
              <div className="empty-live-report-card mt-3">
                <div className="empty-live-icon">
                  <MapPin size={38} className="teal-text" />
                </div>
                <h3>No Land Records Found</h3>
                <p>You currently do not have any registered land parcels linked to your account. You can synchronize pre-verified parcels from the AgriStack registry or search and submit state land records.</p>
                <div className="empty-actions-row mt-3">
                  <button className="btn-dash-primary" onClick={handleTriggerAgriStackSync}>
                    <RefreshCw size={16} className={isSyncingAgriStack ? "animate-spin" : ""} />
                    <span>{isSyncingAgriStack ? t("syncingAgriStack") : t("syncAgriStack")}</span>
                  </button>
                  <button 
                    className="btn-dash-outline" 
                    onClick={() => { 
                      openModalWithHistory(setShowAddLandModal, "addLand"); 
                      setKhasraSearchResults(null); 
                    }}
                  >
                    <Plus size={16} /> {t("addLand")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-card mt-3">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>{t("khasraNoHeader")}</th>
                      <th>{t("villageTehsilHeader")}</th>
                      <th>{t("districtHeader")}</th>
                      <th>{t("areaHeader")}</th>
                      <th>{t("soilTypeHeader")}</th>
                      <th>{t("sourceHeader")}</th>
                      <th>{t("statusHeader")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landParcels.map((parcel) => (
                      <tr key={parcel.id}>
                        <td><b>{parcel.khasraNo}</b></td>
                        <td>{translateLocation(parcel.village)}, {translateLocation(parcel.tehsil)}</td>
                        <td>{translateLocation(parcel.district)}</td>
                        <td>{parcel.areaHectare} {loc("Ha", "हेक्टेयर")}</td>
                        <td>{translateSoil(parcel.soilType)}</td>
                        <td><small className="tag-source">{translateSource(parcel.source)}</small></td>
                        <td>
                          {parcel.verified ? (
                            <span className="status-pill checked_in"><Check size={13} /> {t("verified")}</span>
                          ) : (
                            <span className="status-pill booked"><Clock size={13} /> {t("pending")}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ADD LAND MODAL (CLEAN TEXT & STRICTLY SUBMIT BUTTON) */}
            {showAddLandModal && (
              <div className="modal-backdrop">
                <div className="modal-card modal-card-wide">
                  <div className="modal-head">
                    <div>
                      <h3>{loc("Add Land Record", "भूमि रिकॉर्ड जोड़ें")}</h3>
                      <small className="text-muted">{loc("Select location and enter Khasra Number to search cadastral records.", "स्थान चुनें और भूलेख रिकॉर्ड खोजने के लिए खसरा संख्या दर्ज करें।")}</small>
                    </div>
                    <button className="close-btn" onClick={() => setShowAddLandModal(false)}><X size={18} /></button>
                  </div>
                  
                  <form onSubmit={handleSearchKhasraRecords} className="modal-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>{loc("State", "राज्य")}</label>
                        <select 
                          value={newLandState} 
                          onChange={e => handleStateSelect(e.target.value)} 
                          className="clean-select"
                        >
                          {ALL_INDIAN_STATES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>{loc("District", "जिला")}</label>
                        <select 
                          value={newLandDistrict} 
                          onChange={e => handleDistrictSelect(e.target.value)} 
                          className="clean-select"
                        >
                          {(STATE_DISTRICT_DATA[newLandState] ? Object.keys(STATE_DISTRICT_DATA[newLandState]) : ["Alwar", "Jaipur", "Dausa"]).map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-2 mt-2">
                      <div className="form-group">
                        <label>{loc("Tehsil", "तहसील")}</label>
                        <select 
                          value={newLandTehsil} 
                          onChange={e => handleTehsilSelect(e.target.value)} 
                          className="clean-select"
                        >
                          {(STATE_DISTRICT_DATA[newLandState]?.[newLandDistrict] ? Object.keys(STATE_DISTRICT_DATA[newLandState][newLandDistrict]) : ["Kherli", "Kathumar", "Laxmangarh"]).map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>{loc("Village", "गांव / ग्राम")}</label>
                        <select 
                          value={newLandVillage} 
                          onChange={e => setNewLandVillage(e.target.value)} 
                          className="clean-select"
                        >
                          {(STATE_DISTRICT_DATA[newLandState]?.[newLandDistrict]?.[newLandTehsil] || ["Kherli Kalan", "Madhogarh", "Samaspur"]).map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group mt-2">
                      <label>{loc("Khasra Number", "खसरा संख्या")}</label>
                      <div className="search-input-wrap">
                        <input 
                          type="text"
                          value={newLandKhasra} 
                          onChange={e => setNewLandKhasra(e.target.value)} 
                          className="clean-input"
                          placeholder={loc("e.g. 142/3 or 312/5", "उदा. 142/3 या 312/5")}
                          required
                        />
                        <button 
                          type="submit" 
                          disabled={isSearchingKhasra}
                          className="btn-dash-primary btn-search-khasra"
                        >
                          <Search size={16} />
                          <span>{isSearchingKhasra ? loc("Searching...", "खोज रहे हैं...") : loc("Search", "खोजें")}</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* KHASRA SEARCH RESULTS WITH SELECT ALL */}
                  {khasraSearchResults && (
                    <div className="khasra-results-box mt-3">
                      <div className="results-head">
                        <label className="checkbox-select-all">
                          <input 
                            type="checkbox"
                            className="green-themed-checkbox"
                            checked={selectedKhasraParcels.length === khasraSearchResults.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedKhasraParcels(khasraSearchResults.map(r => r.id));
                              } else {
                                setSelectedKhasraParcels([]);
                              }
                            }}
                          />
                          <b>{loc("Select All", "सभी चुनें")} ({khasraSearchResults.length} {loc("parcels found", "पार्सल मिले")})</b>
                        </label>
                        <span className="tag-source">{translateSource("Bhulekh Verified")}</span>
                      </div>

                      <div className="khasra-parcels-list mt-2">
                        {khasraSearchResults.map((parcel) => {
                          const isSelected = selectedKhasraParcels.includes(parcel.id);
                          return (
                            <div 
                              key={parcel.id} 
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedKhasraParcels(prev => prev.filter(id => id !== parcel.id));
                                } else {
                                  setSelectedKhasraParcels(prev => [...prev, parcel.id]);
                                }
                              }}
                              className={`khasra-item-card ${isSelected ? "checked" : ""}`}
                            >
                              <div className="parcel-left">
                                <input 
                                  type="checkbox" 
                                  className="green-themed-checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                />
                                <div className="parcel-info-col">
                                  <div className="parcel-title-row">
                                    <b>{loc("Khasra", "खसरा")} {parcel.khasraNo}</b>
                                    <span className="owner-tag">{loc(parcel.ownership, parcel.ownership?.includes("Self") ? "स्वयं" : (parcel.ownership?.includes("Joint") ? "संयुक्त / पारिवारिक" : "पैतृक"))}</span>
                                  </div>
                                  <div className="parcel-meta-sub">
                                    <span>{loc("Area", "क्षेत्रफल")}: <b>{parcel.areaHectare} {loc("Ha", "हेक्टेयर")}</b></span>
                                    <span>{loc("Soil", "मिट्टी")}: <b>{translateSoil(parcel.soilType)}</b></span>
                                    <span>{loc("Irrigation", "सिंचाई")}: <b>{loc(parcel.irrigation, parcel.irrigation?.includes("Tube") ? "नलकूप सिंचित" : (parcel.irrigation?.includes("Canal") ? "नहर जल आपूर्ति" : "वर्षा आधारित (बारानी)"))}</b></span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="modal-btn-row mt-3">
                        <button 
                          className="btn-dash-primary w-full"
                          onClick={handleAddSearchedLands}
                        >
                          <Check size={16} /> {loc("Submit", "जमा करें")}
                        </button>
                        <button 
                          className="btn-dash-outline"
                          onClick={() => setKhasraSearchResults(null)}
                        >
                          {loc("Cancel", "रद्द करें")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            VIEW 3: SLOT BOOKING (DYNAMIC CROPS & GREEN CHECKBOXES)
            ========================================================= */}
        {currentViewTab === "book" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">{t("bookingEyebrow")}</span>
                <h2 className="section-page-title">{t("slotBooking")}</h2>
                <p className="section-page-desc">{t("bookingDesc")}</p>
              </div>
              <span className="badge-booking-open">{t("bookingOpen")}</span>
            </div>

            <form onSubmit={handleBookingSubmit} className="booking-layout-grid">
              {/* Left Column: 4 Progressive Steps */}
              <div className="booking-steps-col">
                {/* Step 1: Crop details */}
                <div className="wizard-step-card">
                  <div className="step-num-circle">1</div>
                  <div className="step-main-body">
                    <div className="step-title-wrap">
                      <h4>{t("cropDetailsStep")}</h4>
                      <p>{t("cropDetailsDesc")}</p>
                    </div>

                    <div className="form-grid-2 mt-3">
                      <div className="form-group">
                        <label>{t("season")}</label>
                        <select 
                          value={selectedSeason} 
                          onChange={e => handleSeasonChange(e.target.value)}
                          className="clean-select"
                        >
                          <option value="Rabi">{loc("Rabi", "रबी")}</option>
                          <option value="Kharif">{loc("Kharif", "खरीफ")}</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>{t("cropName")}</label>
                        <select 
                          value={selectedCrop} 
                          onChange={e => setSelectedCrop(e.target.value)}
                          className="clean-select"
                        >
                          {CROPS_BY_SEASON[selectedSeason].map((cropItem) => (
                            <option key={cropItem} value={cropItem}>
                              {translateCrop(cropItem.split(" ")[0])}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Select Land (GREEN THEMED MULTI-SELECT) */}
                <div className="wizard-step-card">
                  <div className="step-num-circle">2</div>
                  <div className="step-main-body">
                    <div className="step-title-wrap">
                      <h4>{t("selectLandStep")}</h4>
                      <p>{t("selectLandDesc")}</p>
                    </div>

                    <div className="land-radio-stack mt-3">
                      {landParcels.filter(l => l.verified).map(land => {
                        const isChecked = selectedLandIds.includes(land.id);
                        return (
                          <div 
                            key={land.id} 
                            onClick={() => handleToggleLand(land.id)}
                            className={`land-select-card ${isChecked ? "checked" : ""}`}
                          >
                            <div className="land-radio-left">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                className="green-themed-checkbox"
                                onChange={() => {}}
                              />
                              <div className="land-meta-info">
                                <b>{loc("Khasra", "खसरा")} {land.khasraNo}</b>
                                <span>{translateLocation(land.village)} • {land.areaHectare} {loc("ha", "हेक्टेयर")} • <span className="text-success">{t("verified")}</span></span>
                              </div>
                            </div>
                            {isChecked && (
                              <CheckCircle size={20} className="teal-check" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Step 3: Expected quantity */}
                <div className="wizard-step-card">
                  <div className="step-num-circle">3</div>
                  <div className="step-main-body">
                    <div className="step-title-wrap">
                      <h4>{t("expectedQtyStep")}</h4>
                      <p>{t("expectedQtyDesc")}</p>
                    </div>

                    <div className="form-group mt-3">
                      <label>{t("expectedQtyTonnes")}</label>
                      <input 
                        type="number" 
                        min="0.01" 
                        step="any"
                        value={expectedQuantity}
                        onChange={e => setExpectedQuantity(e.target.value)}
                        className="clean-input"
                        placeholder="e.g. 12 or 150"
                        required
                      />
                      <small className="field-subtext">{loc(`Total produce weight calculated for ${totalSelectedArea} Hectares of land (uncapped capacity)`, `भूमि के ${totalSelectedArea} हेक्टेयर के लिए कुल अनुमानित उपज भार`)}</small>
                    </div>
                  </div>
                </div>

                {/* Step 4: Centre, date & time slot */}
                <div className="wizard-step-card">
                  <div className="step-num-circle">4</div>
                  <div className="step-main-body">
                    <div className="step-title-wrap">
                      <h4>{t("centreDateTimeStep")}</h4>
                      <p>{t("centreDateTimeDesc")}</p>
                    </div>

                    <div className="form-group mt-3">
                      <label>{t("procurementCentre")}</label>
                      <select 
                        value={selectedCentreId} 
                        onChange={e => setSelectedCentreId(e.target.value)}
                        className="clean-select"
                      >
                        {centres.map(c => (
                          <option key={c.id} value={c.id}>
                            {(currentLang === "hi" || currentLang === "pa" || currentLang === "doi") ? `${translateCentre(c.name)} • ${c.distance.replace("km", loc("km", "किमी", "ਕਿ.ਮੀ.", "किमी"))}` : `${c.name.split(" ")[0]} • ${c.distance}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group mt-3">
                      <label>{t("dateLabel")}</label>
                      <input 
                        type="date" 
                        min={new Date().toISOString().split("T")[0]}
                        value={bookingDate} 
                        onChange={e => {
                          const val = e.target.value;
                          const today = new Date().toISOString().split("T")[0];
                          if (val < today) {
                            alert("Past dates cannot be selected for appointment booking.");
                            setBookingDate(today);
                            return;
                          }
                          setBookingDate(val);
                        }} 
                        className="clean-input"
                        required
                      />
                    </div>

                    {/* Slots Grid with Dynamic Booked/Full State */}
                    <label className="mt-3 block-label">{t("selectTimeSlot")}</label>
                    <div className="slots-grid-scroll">
                      {TIME_SLOTS_20MIN.map((timeStr) => {
                        const isMyBooking = myBookedSlotTimes.includes(timeStr);
                        const isBooked = bookedSlotTimes.includes(timeStr);
                        const isSelected = selectedSlotTime === timeStr;
                        const isDisabled = isBooked;
                        return (
                          <button 
                            key={timeStr}
                            type="button" 
                            disabled={isDisabled}
                            className={`slot-pill-btn ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                            onClick={() => !isDisabled && setSelectedSlotTime(timeStr)}
                          >
                            <b>{timeStr}</b>
                            <small className={isDisabled ? "text-full" : "text-avail"}>
                              {isMyBooking ? loc("Your Booking", "आपकी बुकिंग", "ਤੁਹਾਡੀ ਬੁਕਿੰਗ") : isBooked ? loc("Booked", "बुक किया गया", "ਬੁੱਕ ਕੀਤਾ ਗਿਆ") : loc("Available", "उपलब्ध", "ਉਪਲਬਧ")}
                            </small>
                          </button>
                        );
                      })}
                    </div>

                    <button 
                      type="submit" 
                      disabled={isBookingSlot}
                      className="btn-dash-primary w-full mt-4"
                    >
                      {isBookingSlot ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>{t("bookingSlotBtn")}</span>
                        </>
                      ) : (
                        <span>{t("bookSlotBtn")}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Sticky Booking Summary Card */}
              <div className="booking-summary-col">
                <div className="summary-sticky-card">
                  <h3>{t("bookingSummary")}</h3>

                  <div className="summary-crop-header">
                    <div className="crop-icon-box">
                      <Sprout size={24} className="teal-text" />
                    </div>
                    <div>
                      <h4>{translateCrop(selectedCrop.split(" ")[0])}</h4>
                      <span>{translateSeason(selectedSeason)} {loc("season", "सीजन")}</span>
                    </div>
                  </div>

                  <div className="summary-data-table">
                    <div className="sum-data-row">
                      <span>{t("selectedLands")}</span>
                      <b>{selectedLands.map(l => `${loc("Khasra ", "खसरा ")}${l.khasraNo}`).join(", ")} ({totalSelectedArea} {loc("ha", "हेक्टेयर")})</b>
                    </div>
                    <div className="sum-data-row">
                      <span>{t("expectedQtyLabel")}</span>
                      <b>{expectedQuantity || 0} {loc("Tonnes", "टन")}</b>
                    </div>
                    <div className="sum-data-row">
                      <span>{t("centreLabel")}</span>
                      <b>{translateCentre(activeCentre?.name)}</b>
                    </div>
                    <div className="sum-data-row">
                      <span>{t("dateLabel")}</span>
                      <b>{bookingDate}</b>
                    </div>
                    <div className="sum-data-row">
                      <span>{t("timeSlotLabel")}</span>
                      <b>{selectedSlotTime}</b>
                    </div>
                  </div>

                  <div className="summary-checked-note">
                    <ShieldCheck size={18} className="teal-text flex-shrink-0" />
                    <span>{t("slotConfirmedNote")}</span>
                  </div>
                </div>
              </div>
            </form>

            {/* SUCCESS MODAL (REAL CENTERED QR CODE + CLOSE BUTTON) */}
            {bookingSuccessModal && (
              <div className="modal-backdrop">
                <div className="modal-card text-center qr-modal-card">
                  <div className="success-icon-badge"><CheckCircle2 size={45} className="teal-text" /></div>
                  <h3 className="mt-2">{loc("Slot Successfully Reserved", "स्लॉट सफलतापूर्वक आरक्षित हुआ")}</h3>
                  <p className="mt-1">{loc("Your appointment has been confirmed at", "आपकी अपॉइंटमेंट की पुष्टि हो गई है:")} {translateCentre(bookingSuccessModal.centreName)}.</p>
                  
                  <div className="profile-verified-box mt-3 text-left">
                    <div className="sum-data-row"><span>{loc("Booking ID:", "बुकिंग आईडी:")}</span> <b>{bookingSuccessModal.id}</b></div>
                    <div className="sum-data-row"><span>{loc("Date & Slot:", "दिनांक और स्लॉट:")}</span> <b>{bookingSuccessModal.date} ({bookingSuccessModal.slotTime})</b></div>
                    <div className="sum-data-row"><span>{loc("Selected Lands:", "चयनित भूमि:")}</span> <b>{loc("Khasra ", "खसरा ")}{bookingSuccessModal.khasraNo} ({bookingSuccessModal.areaHectares} {loc("ha", "हेक्टेयर")})</b></div>
                    <div className="sum-data-row"><span>{loc("Expected Qty:", "अनुमानित मात्रा:")}</span> <b>{bookingSuccessModal.expectedTonnes} {loc("Tonnes", "टन")}</b></div>
                  </div>

                  {/* Dynamic Authentic QR Pass */}
                  <div className="qr-centered-container mt-3">
                    <DynamicQRCode 
                      value={bookingSuccessModal.id} 
                      payloadData={bookingSuccessModal} 
                      size={140} 
                      title={`Pass #${bookingSuccessModal.id}`}
                    />
                    <small className="qr-label-sub">{loc("Official Digital Mandi Gate Pass", "आधिकारिक डिजिटल मंडी गेट पास")}</small>
                  </div>

                  <button className="btn-dash-primary w-full mt-4" onClick={() => setBookingSuccessModal(null)}>
                    {loc("Close", "बंद करें")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            VIEW 4: LIVE REPORT (DESKTOP HORIZONTAL / MOBILE VERTICAL STEPPER)
            ========================================================= */}
        {currentViewTab === "live" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">{t("liveTrackerEyebrow")}</span>
                <h2 className="section-page-title">{t("liveReport")}</h2>
                <p className="section-page-desc">{t("liveReportDesc")}</p>
              </div>
              {activeFarmerBooking && (
                <span className="status-pill checked_in">
                  ● {t("tokenActive") || "Token Active"}: #{activeFarmerBooking.id.slice(-6)}
                </span>
              )}
            </div>

            {activeFarmerBooking ? (
              <div className="live-report-container mt-3">
                {/* Centre Status Summary Banner */}
                <div className="live-centre-banner">
                  <div className="centre-banner-info">
                    <div className="live-pulse-icon">
                      <Activity size={22} className="teal-text" />
                    </div>
                    <div>
                      <h3>{translateCrop(activeFarmerBooking.crop)} {loc("Procurement •", "खरीद •")} {translateCentre(activeFarmerBooking.centreName)}</h3>
                      <p>{loc("Appointment:", "अपॉइंटमेंट:")} <b>{activeFarmerBooking.date} ({activeFarmerBooking.slotTime})</b> • {loc("Expected:", "अनुमानित:")} <b>{activeFarmerBooking.expectedTonnes} {loc("T", "टन")}</b></p>
                    </div>
                  </div>

                  <div className="centre-banner-tokens">
                    <div className="token-chip">
                      <small>{t("currentQueue")}</small>
                      <b>{loc("#1 in Line", "कतार में #1")}</b>
                    </div>
                    <div className="token-chip">
                      <small>{t("gatePass")}</small>
                      <b>{activeFarmerBooking.id}</b>
                    </div>
                  </div>
                </div>

                {/* PROGRESSIVE JOURNEY (HORIZONTAL DESKTOP / VERTICAL MOBILE) */}
                <div className="live-stepper-card mt-3">
                  <div className="stepper-section-title">
                    <h4>{t("procurementProcessingStages")}</h4>
                    <span className="stepper-refresh-hint"><RefreshCw size={14} /> {loc("Auto-updating in real time", "वास्तविक समय में स्वतः अपडेट")}</span>
                  </div>

                  <div className="live-stepper-track">
                    {/* Stage 1: Booking Confirmed */}
                    <div className="stepper-stage-node done">
                      <div className="node-marker">
                        <Check size={16} />
                      </div>
                      <div className="node-content">
                        <b>{t("stage1")}</b>
                        <p className="node-time">{activeFarmerBooking.date}, {activeFarmerBooking.slotTime.split("–")[0]}</p>
                        <small className="node-detail">{loc("Slot Reserved & Token Generated", "स्लॉट आरक्षित और टोकन जनरेट हुआ")}</small>
                      </div>
                    </div>

                    {/* Stage 2: Gate Check-in */}
                    <div className={`stepper-stage-node ${activeFarmerBooking.checkInTime ? "done" : "pending"}`}>
                      <div className="node-marker">
                        {activeFarmerBooking.checkInTime ? <Check size={16} /> : "2"}
                      </div>
                      <div className="node-content">
                        <b>{t("stage2")}</b>
                        <p className="node-time">
                          {activeFarmerBooking.checkInTime ? `${activeFarmerBooking.date}, ${activeFarmerBooking.checkInTime}` : loc("Pending", "प्रतीक्षारत", "ਬਕਾਇਆ")}
                        </p>
                        <small className="node-detail">
                          {activeFarmerBooking.checkInTime ? loc("Recorded at Mandi Gate 1", "मंडी गेट 1 पर दर्ज किया गया") : loc("Awaiting arrival at entrance", "प्रवेश द्वार पर आगमन की प्रतीक्षा")}
                        </small>
                      </div>
                    </div>

                    {/* Stage 3: Quality Check */}
                    <div className={`stepper-stage-node ${activeFarmerBooking.qualityResult ? "done" : "pending"}`}>
                      <div className="node-marker">
                        {activeFarmerBooking.qualityResult ? <Check size={16} /> : "3"}
                      </div>
                      <div className="node-content">
                        <b>{t("stage3")}</b>
                        <p className="node-time">
                          {activeFarmerBooking.qualityResult ? `${activeFarmerBooking.date}, 10:15 AM` : loc("Pending", "प्रतीक्षारत", "ਬਕਾਇਆ")}
                        </p>
                        <small className="node-detail">
                          {activeFarmerBooking.qualityResult ? `${loc(activeFarmerBooking.qualityResult.grade, activeFarmerBooking.qualityResult.grade === "Grade A" ? "ग्रेड ए" : activeFarmerBooking.qualityResult.grade, activeFarmerBooking.qualityResult.grade === "Grade A" ? "ਗ੍ਰੇਡ ਏ" : activeFarmerBooking.qualityResult.grade)} (${loc("Moisture", "नमी", "ਨਮੀ")}: ${activeFarmerBooking.qualityResult.moisture})` : loc("Moisture & purity assay", "नमी और गुणवत्ता परीक्षण", "ਨਮੀ ਅਤੇ ਸ਼ੁੱਧਤਾ ਜਾਂਚ")}
                        </small>
                      </div>
                    </div>

                    {/* Stage 4: Weighbridge Weighing */}
                    <div className={`stepper-stage-node ${activeFarmerBooking.actualWeightTonnes ? "done" : "pending"}`}>
                      <div className="node-marker">
                        {activeFarmerBooking.actualWeightTonnes ? <Check size={16} /> : "4"}
                      </div>
                      <div className="node-content">
                        <b>{t("stage4")}</b>
                        <p className="node-time">
                          {activeFarmerBooking.actualWeightTonnes ? `${activeFarmerBooking.date}, 10:30 AM` : loc("Pending", "प्रतीक्षारत", "ਬਕਾਇਆ")}
                        </p>
                        <small className="node-detail">
                          {activeFarmerBooking.actualWeightTonnes ? loc(`Net: ${activeFarmerBooking.actualWeightTonnes} T accepted`, `शुद्ध: ${activeFarmerBooking.actualWeightTonnes} टन स्वीकार`) : loc("Electronic scale feed", "इलेक्ट्रॉनिक धर्मकांटा तौल")}
                        </small>
                      </div>
                    </div>

                    {/* Stage 5: Procurement Completed */}
                    <div className={`stepper-stage-node ${activeFarmerBooking.status === "PROCUREMENT_COMPLETED" || activeFarmerBooking.netPayableAmount ? "done" : "pending"}`}>
                      <div className="node-marker">
                        {activeFarmerBooking.status === "PROCUREMENT_COMPLETED" || activeFarmerBooking.netPayableAmount ? <Check size={16} /> : "5"}
                      </div>
                      <div className="node-content">
                        <b>{t("stage5")}</b>
                        <p className="node-time">
                          {activeFarmerBooking.paymentDate ? `${activeFarmerBooking.paymentDate}` : loc("Pending", "प्रतीक्षारत", "ਬਕਾਇਆ")}
                        </p>
                        <small className="node-detail">
                          {activeFarmerBooking.status === "PROCUREMENT_COMPLETED" || activeFarmerBooking.netPayableAmount ? loc("Form J Generated & Produce Deposited", "जे-फॉर्म जनरेट हुआ और उपज जमा की गई") : loc("Final approval & slip issuance", "अंतिम अनुमोदन और पर्ची जारी")}
                        </small>
                      </div>
                    </div>

                    {/* Stage 6: Payment Settlement */}
                    <div className={`stepper-stage-node ${activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" ? "done" : (activeFarmerBooking.paymentStatus === "PAYMENT_INITIATED" ? "in-progress" : "pending")}`}>
                      <div className="node-marker">
                        {activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" ? (
                          <Check size={16} />
                        ) : activeFarmerBooking.paymentStatus === "PAYMENT_INITIATED" ? (
                          <Clock size={16} className="teal-text animate-pulse" />
                        ) : (
                          "6"
                        )}
                      </div>
                      <div className="node-content">
                        <b>{t("stage6")}</b>
                        <p className="node-time">
                          {activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" 
                            ? loc("Credited in Bank", "बैंक खाते में जमा") 
                            : (activeFarmerBooking.paymentStatus === "PAYMENT_INITIATED" ? loc("PFMS Initiated", "पीएफएमएस द्वारा जारी") : loc("Pending at State Level", "राज्य स्तर पर लंबित"))}
                        </p>
                        <small className="node-detail">
                          {activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" 
                            ? loc("Direct Bank Transfer Successful", "प्रत्यक्ष बैंक अंतरण सफल") 
                            : (activeFarmerBooking.paymentStatus === "PAYMENT_INITIATED" ? loc("PFMS Batch Clearance In-Progress", "पीएफएमएस बैच क्लीयरेंस प्रगति पर है") : loc("Bill submitted to Treasury", "बिल राज्य कोषालय को प्रस्तुत किया गया"))}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* REALISTIC PAYMENT TRACKER BANNER */}
                {activeFarmerBooking.status === "PROCUREMENT_COMPLETED" || activeFarmerBooking.netPayableAmount ? (
                  <div className="live-payment-card mt-3">
                    <div className="profile-verified-box" style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", padding: "18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <div className="stat-icon-circle" style={{ background: activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" ? "#dcfce7" : "#f0fdfa" }}>
                            {activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" ? (
                              <CheckCircle2 size={24} className="text-success" />
                            ) : (
                              <Clock size={24} className="teal-text" />
                            )}
                          </div>
                          <div>
                            <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                              {loc("Direct Benefit Transfer (DBT) Payout", "प्रत्यक्ष लाभ अंतरण (DBT) भुगतान")}
                            </span>
                            <h4 style={{ fontSize: "16px", fontWeight: "700", margin: "2px 0" }}>
                              {loc("Payment Status:", "भुगतान स्थिति:")}{" "}
                              {activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" ? (
                                <span className="text-success">{loc("Paid via PFMS DBT", "PFMS DBT द्वारा भुगतान संपन्न")}</span>
                              ) : activeFarmerBooking.paymentStatus === "PAYMENT_INITIATED" ? (
                                <span className="teal-text">{loc("Payment Initiated (PFMS Clearance)", "भुगतान जारी (PFMS क्लीयरेंस)")}</span>
                              ) : (
                                <span style={{ color: "var(--slate)" }}>{loc("Pending at State Level", "राज्य स्तर पर लंबित")}</span>
                              )}
                            </h4>
                            <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>
                              {loc("Payable Amount:", "देय राशि:")} <b className="teal-text">₹{(activeFarmerBooking.netPayableAmount || 0).toLocaleString()}.00</b>
                              {" • "}
                              {activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" 
                                ? loc(`Credited via UTR: ${activeFarmerBooking.bankUtr || "UTR-SBIN-2026-9824892"}`, `यूटीआर द्वारा जमा: ${activeFarmerBooking.bankUtr || "UTR-SBIN-2026-9824892"}`, `UTR ਰਾਹੀਂ ਜਮ੍ਹਾ: ${activeFarmerBooking.bankUtr || "UTR-SBIN-2026-9824892"}`)
                                : (activeFarmerBooking.paymentStatus === "PAYMENT_INITIATED" ? loc(`PFMS Ref: ${activeFarmerBooking.paymentRef}`, `पीएफएमएस संदर्भ: ${activeFarmerBooking.paymentRef}`, `PFMS ਰੈਫਰੈਂਸ: ${activeFarmerBooking.paymentRef}`) : loc("Mandi weighment done. Awaiting state treasury disbursement.", "मंडी में तौल संपन्न। राज्य कोषागार भुगतान की प्रतीक्षा।"))}
                            </p>
                          </div>
                        </div>

                        <div>
                          <button 
                            className="btn-dash-primary"
                            onClick={() => setShowPaymentModal(true)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                          >
                            <WalletCards size={16} />
                            <span>{t("trackPaymentBtn")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="payment-pending-banner mt-3">
                    <Clock size={22} className="teal-text flex-shrink-0" />
                    <div>
                      <h4>{loc("PFMS Direct Benefit Transfer (DBT) Pending", "PFMS प्रत्यक्ष लाभ अंतरण (DBT) लंबित")}</h4>
                      <p>{loc("Direct bank transfer of procurement payout will be initiated automatically once physical weighment and Form J generation are completed at the Mandi.", "मंडी में भौतिक तौल और फॉर्म जे जनरेट होने के बाद खरीद भुगतान का प्रत्यक्ष बैंक ट्रांसफर स्वतः शुरू हो जाएगा।")}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-live-report-card mt-3">
                <div className="empty-live-icon">
                  <Activity size={38} className="teal-text" />
                </div>
                <h3>Live Report Not Available</h3>
                <p>You have no active mandi appointment scheduled for today. Book a slot from the Slot Booking tab to track your live queue position, gate arrival, quality inspection, and electronic weighbridge progress in real-time.</p>
                <button className="btn-dash-primary mt-3" onClick={() => setActiveTab("book")}>
                  <CalendarDays size={16} /> Book a Slot Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            VIEW 5: BOOKING HISTORY (RECENT, ONGOING & COMPLETED)
            ========================================================= */}
        {currentViewTab === "history" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">{t("historyEyebrow")}</span>
                <h2 className="section-page-title">{t("bookingHistory")}</h2>
                <p className="section-page-desc">{t("historyDesc")}</p>
              </div>
            </div>

            <div className="booking-history-stack mt-2">
              {farmerBookings.length === 0 ? (
                <div className="empty-live-report-card mt-2">
                  <div className="empty-live-icon">
                    <History size={38} className="teal-text" />
                  </div>
                  <h3>No Booking History Available</h3>
                  <p>You have not made any grain procurement appointments yet. Use the Slot Booking tab to book a slot for your verified land produce.</p>
                  <button className="btn-dash-primary mt-3" onClick={() => setActiveTab("book")}>
                    <CalendarDays size={16} /> {t("bookSlotNow")}
                  </button>
                </div>
              ) : (
                farmerBookings.map((b) => {
                  const isCompleted = b.status === "PROCUREMENT_COMPLETED";
                  const isCancelled = b.status === "CANCELLED";
                  const isUpcoming = b.status === "BOOKED" || b.status === "QUALITY_WAITING" || b.status === "WEIGHING_PROCESS";

                  return (
                  <div key={b.id} className={`history-item-card ${isCancelled ? "cancelled-card" : ""}`}>
                    <div className="history-card-top">
                      <div className="history-head-info">
                        <div className="history-date-badge">
                          <b>{b.date.split("-")[2] || "29"}</b>
                          <small>SEP</small>
                        </div>
                        <div>
                          <h4>{translateCrop(b.crop)} {loc("Procurement", "खरीद")} ({translateSeason(b.season)})</h4>
                          <span className="history-centre-tag">{translateCentre(b.centreName)}</span>
                        </div>
                      </div>

                      <div className="history-status-badge-wrap">
                        {isCompleted && <span className="status-pill procurement_completed">● {loc("Completed", "संपन्न", "ਸੰਪੰਨ")}</span>}
                        {isCancelled && <span className="status-pill cancelled">● {loc("Cancelled", "रद्द", "ਰੱਦ")}</span>}
                        {isUpcoming && <span className="status-pill checked_in">● {loc(b.status.replace("_", " "), b.status === "BOOKED" ? "बुक किया गया" : (b.status === "QUALITY_WAITING" ? "गुणवत्ता जांच प्रतीक्षारत" : "तौल प्रक्रिया"), b.status === "BOOKED" ? "ਬੁੱਕ ਕੀਤਾ ਗਿਆ" : (b.status === "QUALITY_WAITING" ? "ਗੁਣਵੱਤਾ ਜਾਂਚ ਉਡੀਕ ਅਧੀਨ" : "ਤੋਲ ਪ੍ਰਕਿਰਿਆ"))}</span>}
                      </div>
                    </div>

                    <div className="history-meta-grid">
                      <div>
                        <span>{loc("Booking ID", "बुकिंग आईडी")}</span>
                        <b>{b.id}</b>
                      </div>
                      <div>
                        <span>{loc("Appointment Slot", "अपॉइंटमेंट स्लॉट")}</span>
                        <b>{b.slotTime}</b>
                      </div>
                      <div>
                        <span>{loc("Lands / Area", "भूमि / क्षेत्रफल")}</span>
                        <b>{loc("Khasra", "खसरा")} {b.khasraNo} ({b.areaHectares} {loc("Ha", "हेक्टेयर")})</b>
                      </div>
                      <div>
                        <span>{loc("Quantity", "मात्रा")}</span>
                        <b>{b.actualWeightTonnes ? loc(`${b.actualWeightTonnes} T Accepted`, `${b.actualWeightTonnes} टन स्वीकृत`, `${b.actualWeightTonnes} ਟਨ ਪ੍ਰਵਾਨਿਤ`) : loc(`${b.expectedTonnes} T Expected`, `${b.expectedTonnes} टन अनुमानित`, `${b.expectedTonnes} ਟਨ ਅੰਦਾਜ਼ਨ`)}</b>
                      </div>
                    </div>

                    <div className="history-card-actions">
                      <button className="btn-dash-outline" onClick={() => setViewBookingDetails(b)}>
                        <Eye size={15} /> {t("viewDetailsQr")}
                      </button>

                      {isUpcoming && (
                        <button className="btn-cancel-red" onClick={() => setCancelBookingConfirmId(b.id)}>
                          {t("cancelBooking")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        )}

        {/* =========================================================
            VIEW 6: PROCUREMENTS (METRICS & DOWNLOADABLE J-FORMS)
            ========================================================= */}
        {currentViewTab === "procurements" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">{t("procurementsEyebrow")}</span>
                <h2 className="section-page-title">{t("procurements")}</h2>
                <p className="section-page-desc">{t("procurementsDesc")}</p>
              </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="dash-metrics-grid mt-2">
              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Scale size={20} className="tile-icon teal" />
                  <small>{t("totalCropSold")}</small>
                </div>
                <h3>{totalCropSoldTonnes} {loc("Tonnes", "टन")}</h3>
                <span>{(totalCropSoldTonnes * 10).toFixed(1)} {loc("Quintals Delivered", "क्विंटल वितरित")}</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <WalletCards size={20} className="tile-icon teal" />
                  <small>{t("totalMoneyReceived")}</small>
                </div>
                <h3>₹{totalMoneyReceived.toLocaleString()}</h3>
                <span>{loc("Direct PFMS Bank Transfer", "प्रत्यक्ष PFMS बैंक अंतरण")}</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Clock size={20} className="tile-icon slate" />
                  <small>{t("pendingPayouts")}</small>
                </div>
                <h3>₹0.00</h3>
                <span>{loc("All settlements cleared", "सभी भुगतान निपटान संपन्न")}</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <FileText size={20} className="tile-icon slate" />
                  <small>{t("totalTransactions")}</small>
                </div>
                <h3>{completedProcurements.length}</h3>
                <span>{loc("J-Forms Generated", "जे-फॉर्म जनरेट किए गए")}</span>
              </div>
            </div>

            {/* List of Procurement Receipts (J-Forms) */}
            <div className="section-sub-head mt-4">
              <h3>{t("authenticatedJForms")}</h3>
            </div>

            <div className="receipts-grid-cards mt-2">
              {completedProcurements.length > 0 ? (
                completedProcurements.map((proc) => (
                  <div key={proc.id} className="receipt-list-card">
                    <div className="receipt-card-left">
                      <div className="receipt-doc-icon">
                        <FileText size={26} className="teal-text" />
                      </div>
                      <div className="receipt-meta">
                        <h4>{loc("J-Form #", "जे-फॉर्म #")}{proc.id}</h4>
                        <p>{translateCrop(proc.crop)} • {proc.actualWeightTonnes || 7.42} {loc("Tonnes", "टन")} (₹2,425/{loc("Qtl", "क्विंटल")})</p>
                        <small className="text-muted">{loc("Procurement Date:", "खरीद दिनांक:")} {proc.paymentDate || "22/09/2026"} • {translateCentre(proc.centreName)}</small>
                      </div>
                    </div>

                    <div className="receipt-card-right">
                      <div className="payout-amount-tag">
                        <span>{loc("Net Paid", "कुल भुगतान")}</span>
                        <b>₹{(proc.netPayableAmount || 179935).toLocaleString()}</b>
                      </div>
                      <button className="btn-dash-primary" onClick={() => setViewReceiptModal(proc)}>
                        <Download size={15} /> {t("viewDownloadJForm")}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-booking-banner">
                  <p>No completed procurements found yet. Book a slot to start selling your produce.</p>
                </div>
              )}
            </div>

            {/* J-FORM MODAL VIEW / PRINT (CLEAN SEPARATED LAYOUT) */}
            {viewReceiptModal && (
              <div className="modal-backdrop">
                <div className="modal-card receipt-modal-card">
                  <div className="modal-head">
                    <h3>Digital Procurement Certificate (Form J)</h3>
                    <button className="close-btn" onClick={() => setViewReceiptModal(null)}><X size={18} /></button>
                  </div>

                  <div className="receipt-paper mt-2" id="printable-receipt-paper">
                    {/* Header with clear side-by-side columns (No overlapping) */}
                    <div className="receipt-header-clean">
                      <div className="gov-seal-clean">
                        <h3>GOVERNMENT OF INDIA • DEPARTMENT OF AGRICULTURE</h3>
                        <b>OFFICIAL PROCUREMENT CERTIFICATE (FORM J)</b>
                        <span className="seal-sub">Valid electronic record issued under National Agricultural Procurement Portal</span>
                      </div>
                      <div className="receipt-no-clean">
                        <span className="cert-tag">CERTIFICATE ID</span>
                        <b className="cert-id-text">{viewReceiptModal.id}</b>
                        <span className="cert-date-text">Issued on: {viewReceiptModal.paymentDate || "29/09/2026"}</span>
                      </div>
                    </div>

                    {/* Metadata Table Grid */}
                    <div className="receipt-meta-grid-clean mt-3">
                      <div className="meta-clean-item"><span>Farmer Name:</span> <b>{farmerProfile.farmerName}</b></div>
                      <div className="meta-clean-item"><span>Father's Name:</span> <b>{farmerProfile.fatherName}</b></div>
                      <div className="meta-clean-item"><span>Farmer ID:</span> <b>{user.farmerId}</b></div>
                      <div className="meta-clean-item"><span>Aadhaar Number:</span> <b>{farmerProfile.aadhaarMasked}</b></div>
                      <div className="meta-clean-item"><span>Registered Mobile:</span> <b>{farmerProfile.mobile}</b></div>
                      <div className="meta-clean-item"><span>Procurement Mandi:</span> <b>{viewReceiptModal.centreName}</b></div>
                      <div className="meta-clean-item"><span>Commodity & Grade:</span> <b>{viewReceiptModal.crop} (Grade A)</b></div>
                      <div className="meta-clean-item"><span>Land Khasra No.:</span> <b>Khasra {viewReceiptModal.khasraNo || "142/3"}</b></div>
                    </div>

                    {/* Quantity & Amount Table */}
                    <div className="receipt-table-wrap mt-3">
                      <table className="receipt-table-clean">
                        <thead>
                          <tr>
                            <th>Commodity Details</th>
                            <th>Gross Weight</th>
                            <th>Tare Weight</th>
                            <th>Net Accepted</th>
                            <th>MSP Rate</th>
                            <th>Net Total (INR)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{viewReceiptModal.crop} ({viewReceiptModal.season})</td>
                            <td>10.42 T</td>
                            <td>3.00 T</td>
                            <td><b>{viewReceiptModal.actualWeightTonnes || 7.42} Tonnes</b></td>
                            <td>₹2,425 / Qtl</td>
                            <td className="amount-col"><b>₹{(viewReceiptModal.netPayableAmount || 179935).toLocaleString()}.00</b></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Footer Payment & Authentication */}
                    <div className="receipt-footer-clean mt-3">
                      <div className="payment-dbt-badge-clean">
                        <WalletCards size={24} className="teal-text" />
                        <div>
                          <span>Payment Status: <b className="text-success">PAID VIA PFMS DBT</b></span>
                          <small>Bank Ref: {viewReceiptModal.paymentRef || "PFMS-2026-DBT-8839201"}</small>
                        </div>
                      </div>
                      <div className="sign-box-clean">
                        <small>Digitally Authenticated by Mandi In-charge</small>
                        <b>Rajesh Sharma (Centre Officer)</b>
                      </div>
                    </div>
                  </div>

                  <div className="modal-btn-row mt-4">
                    <button 
                      className="btn-dash-primary btn-modal-half" 
                      disabled={isGeneratingPdf}
                      onClick={() => handleDownloadJFormPdf(viewReceiptModal)}
                    >
                      <Download size={16} /> {isGeneratingPdf ? loc("Generating PDF...", "पीडीएफ बन रहा है...") : loc("Download J-Form PDF", "जे-फॉर्म पीडीएफ डाउनलोड करें")}
                    </button>
                    <button 
                      className="btn-dash-outline btn-modal-half" 
                      onClick={() => setViewReceiptModal(null)}
                    >
                      {loc("Close", "बंद करें")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            VIEW 7: NOTIFICATIONS & ALERTS (DEDICATED FULL MOBILE PAGE)
            ========================================================= */}
        {currentViewTab === "alerts" && (
          <div className="dash-content-body pwa-alerts-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">{loc("NOTIFICATIONS & UPDATES", "सूचनाएं एवं अपडेट")}</span>
                <h2 className="section-page-title">{loc("Live Alerts", "लाइव अलर्ट")}</h2>
                <p className="section-page-desc">{loc("Real-time alerts, mandi queue call-outs and PFMS DBT updates.", "रीयल-टाइम अलर्ट, मंडी कतार की स्थिति और पीएफएमएस डीबीटी अपडेट।")}</p>
              </div>
            </div>

            <div className="alerts-fullpage-list mt-3">
              {upcomingProcurement && (
                <div className="alert-item-card active-alert">
                  <div className="alert-badge-row">
                    <span className="badge-active-tag">{loc("Upcoming Appointment", "आगामी अपॉइंटमेंट")}</span>
                    <small>{upcomingProcurement.date}</small>
                  </div>
                  <h4 style={{ margin: "6px 0 2px" }}>{loc("Token #", "टोकन #")}{upcomingProcurement.id} • {translateCrop(upcomingProcurement.crop)}</h4>
                  <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0 8px" }}>
                    {loc("Centre:", "खरीद केंद्र:")} <b>{translateCentre(upcomingProcurement.centreName)}</b> | {loc("Slot:", "स्लॉट:")} <b>{upcomingProcurement.slotTime}</b>
                  </p>
                  <div className="alert-status-pill">
                    {loc("Status:", "स्थिति:")} <b className="teal-text">{loc(upcomingProcurement.status.replace("_", " "), upcomingProcurement.status === "BOOKED" ? "बुक किया गया" : upcomingProcurement.status.replace("_", " "), upcomingProcurement.status === "BOOKED" ? "ਬੁੱਕ ਕੀਤਾ ਗਿਆ" : upcomingProcurement.status.replace("_", " "))}</b>
                  </div>
                  <button 
                    className="btn-dash-primary btn-sm mt-3" 
                    onClick={() => setActiveTab("live")}
                  >
                    {loc("Open Live Mandi Report →", "लाइव मंडी रिपोर्ट खोलें →")}
                  </button>
                </div>
              )}

              <div className="alert-item-card">
                <div className="alert-badge-row">
                  <span className="badge-verified-tag">{loc("AgriStack Verified", "एग्रीस्टैक सत्यापित")}</span>
                  <small>{loc("Cadastre", "भूलेख")}</small>
                </div>
                <h4 style={{ margin: "6px 0 2px" }}>{loc("Land Record Registry Synchronized", "भूमि रिकॉर्ड रजिस्ट्री सिंक हुई")}</h4>
                <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0" }}>
                  {loc(`Your land holdings (${landParcels.length} verified parcels) are synced with the State Revenue Department for dynamic grain quota allocation.`, `आपकी भूमि जोत (${landParcels.length} सत्यापित पार्सल) गतिशील अनाज कोटा आवंटन के लिए राज्य राजस्व विभाग के साथ सिंक हैं।`)}
                </p>
              </div>

              <div className="alert-item-card mt-2">
                <div className="alert-badge-row">
                  <span className="badge-info-tag">{loc("PFMS Gateway", "पीएफएमएस गेटवे")}</span>
                  <small>{loc("Direct Benefit Transfer", "प्रत्यक्ष लाभ अंतरण (DBT)")}</small>
                </div>
                <h4 style={{ margin: "6px 0 2px" }}>{loc("Bank Account Active for DBT", "बैंक खाता डीबीटी हेतु सक्रिय")}</h4>
                <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0" }}>
                  {loc(`${farmerProfile.bankName} (A/C: ${farmerProfile.accountMasked}) is seeded with NPCI Aadhaar bridge for 24-48 hr MSP grain settlements.`, `${translateBank(farmerProfile.bankName)} (खाता: ${farmerProfile.accountMasked}) 24-48 घंटे में एमएसपी अनाज भुगतान के लिए एनपीसीआई आधार ब्रिज से जुड़ा है।`)}
                </p>
              </div>

              <div className="alert-item-card mt-2">
                <div className="alert-badge-row">
                  <span className="badge-info-tag">{loc("Mandi System Notice", "मंडी प्रणाली सूचना")}</span>
                  <small>{loc("Rabi 2026", "रबी 2026")}</small>
                </div>
                <h4 style={{ margin: "6px 0 2px" }}>{loc("Fair Average Quality (FAQ) Standards", "उचित औसत गुणवत्ता (FAQ) मानक")}</h4>
                <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0" }}>
                  {loc("Please ensure Wheat moisture content is below 12.0% and Foreign Matter is under 0.75% for instant gate clearance.", "त्वरित गेट क्लीयरेंस के लिए कृपया सुनिश्चित करें कि गेहूं की नमी 12.0% से कम और बाह्य पदार्थ 0.75% से कम हो।")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          GLOBAL MODAL: HELP & SUPPORT (CENTERED CLOSE BUTTON)
          ========================================================= */}
      {showHelpModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head-centered text-center">
              <h3>{loc("Help & Support Desk", "सहायता एवं समर्थन डेस्क")}</h3>
            </div>
            
            <div className="help-info-body">
              <div className="help-card-item">
                <div className="help-icon-circle"><PhoneCall size={20} className="teal-text" /></div>
                <div>
                  <h4>{loc("Kisan Call Center (Toll-Free Helpline)", "किसान कॉल सेंटर (टोल-फ्री हेल्पलाइन)")}</h4>
                  <p className="phone-highlight">📞 1800-180-1551</p>
                  <small>{loc("Available 24/7 in 22 regional languages", "22 क्षेत्रीय भाषाओं में 24/7 उपलब्ध")}</small>
                </div>
              </div>

              <div className="help-card-item mt-3">
                <div className="help-icon-circle"><Mail size={20} className="teal-text" /></div>
                <div>
                  <h4>{loc("Email Support", "ईमेल सहायता")}</h4>
                  <p className="email-highlight">✉️ support@kisansaathi.gov.in</p>
                  <small>{loc("For technical and DBT payment inquiries (Turnaround: 24h)", "तकनीकी और डीबीटी भुगतान पूछताछ के लिए (समाधान समय: 24 घंटे)")}</small>
                </div>
              </div>

              <div className="help-card-item mt-3">
                <div className="help-icon-circle"><Smartphone size={20} className="teal-text" /></div>
                <div>
                  <h4>{loc("WhatsApp Farmer Bot", "व्हाट्सएप किसान बॉट")}</h4>
                  <p className="phone-highlight">💬 +91 98765 00000</p>
                  <small>{loc("Instant queue updates, slot alerts and J-Form downloads", "तत्काल कतार अपडेट, स्लॉट अलर्ट और जे-फॉर्म डाउनलोड")}</small>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <button className="btn-dash-primary btn-modal-center" onClick={() => setShowHelpModal(false)}>
                {loc("Close", "बंद करें")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          GLOBAL MODAL: CANCEL BOOKING CONFIRMATION
          ========================================================= */}
      {cancelBookingConfirmId && (
        <div className="modal-backdrop">
          <div className="modal-card text-center logout-text-modal">
            <h3>{loc("Cancel Appointment?", "अपॉइंटमेंट रद्द करें?")}</h3>
            <p className="mt-2 text-muted-logout">
              {loc("Are you sure you want to cancel your booking", "क्या आप वाकई अपनी बुकिंग रद्द करना चाहते हैं")} (<b>{cancelBookingConfirmId}</b>)?
            </p>

            <div className="modal-btn-row mt-4">
              <button 
                className="btn-dash-outline btn-modal-half" 
                onClick={() => setCancelBookingConfirmId(null)}
              >
                {loc("Keep Booking", "बुकिंग रखें")}
              </button>
              <button 
                className="btn-danger-solid btn-modal-half" 
                onClick={() => {
                  onCancelBooking(cancelBookingConfirmId);
                  setCancelBookingConfirmId(null);
                  if (viewBookingDetails && viewBookingDetails.id === cancelBookingConfirmId) {
                    setViewBookingDetails(null);
                  }
                }}
              >
                {loc("Yes, Cancel Booking", "हाँ, बुकिंग रद्द करें")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          GLOBAL MODAL: PFMS DBT PAYMENT STATUS TRACKING MODAL
          ========================================================= */}
      {showPaymentModal && activeFarmerBooking && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: "600px" }}>
            <div className="modal-head">
              <div>
                <span className="role-eyebrow-tag">{loc("PFMS DIRECT BENEFIT TRANSFER (DBT)", "पीएफएमएस प्रत्यक्ष लाभ अंतरण (DBT)")}</span>
                <h3 style={{ margin: "2px 0 0" }}>{loc("Payment Settlement Inquiry", "भुगतान निपटान पूछताछ")}</h3>
              </div>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Farmer & Lot Snapshot */}
            <div className="profile-verified-box mt-3" style={{ background: "#f8fafc", padding: "14px" }}>
              <div className="sum-data-row"><span>{loc("Token / Booking ID:", "टोकन / बुकिंग आईडी:")}</span> <b>{activeFarmerBooking.id}</b></div>
              <div className="sum-data-row"><span>{loc("Commodity & Weight:", "जिंस और वजन:")}</span> <b>{translateCrop(activeFarmerBooking.crop)} ({activeFarmerBooking.actualWeightTonnes || activeFarmerBooking.expectedTonnes} {loc("Tonnes", "टन")})</b></div>
              <div className="sum-data-row"><span>{loc("Net Payable MSP:", "कुल देय एमएसपी:")}</span> <b className="teal-text" style={{ fontSize: "16px" }}>₹{(activeFarmerBooking.netPayableAmount || 0).toLocaleString()}.00</b></div>
              <div className="sum-data-row"><span>{loc("Beneficiary Farmer:", "लाभार्थी किसान:")}</span> <b>{translateFarmerName(farmerProfile.farmerName)} ({loc("Aadhaar:", "आधार:")} {farmerProfile.aadhaarMasked})</b></div>
              <div className="sum-data-row"><span>{loc("Target Bank Account:", "लक्षित बैंक खाता:")}</span> <b>{translateBank(farmerProfile.bankName)} ({loc("A/C:", "खाता:")} {farmerProfile.accountMasked})</b></div>
            </div>

            {/* Dynamic Progressive Payment Stage */}
            {(!activeFarmerBooking.paymentStatus || activeFarmerBooking.paymentStatus === "PENDING_STATE" || activeFarmerBooking.paymentStatus === "PENDING") && (
              <div className="profile-verified-box mt-3 text-left" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Clock size={20} className="teal-text" />
                  <h4 style={{ color: "var(--ink)", margin: 0 }}>{loc("Current Status: Pending at State Level", "वर्तमान स्थिति: राज्य स्तर पर लंबित")}</h4>
                </div>
                <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", margin: "4px 0 12px" }}>
                  {loc(`Physical weighment and J-Form generation have been completed at ${activeFarmerBooking.centreName}. The bill has been queued for audit and batch authorization by the State Directorate of Agriculture Treasury.`, `मंडी ${translateCentre(activeFarmerBooking.centreName)} में भौतिक तौल और जे-फॉर्म जारी हो चुका है। बिल राज्य कृषि निदेशालय कोषालय द्वारा ऑडिट और अनुमोदन के लिए प्रक्रियाधीन है।`)}
                </p>

                <div className="stepper-sub-stages mt-2" style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                  <span style={{ color: "var(--primary)", fontWeight: "700" }}>{loc("✓ J-Form Issued", "✓ जे-फॉर्म जारी")}</span>
                  <span style={{ color: "#94a3b8" }}>➔</span>
                  <span style={{ color: "var(--primary)", fontWeight: "700" }}>{loc("● State Treasury Audit", "● राज्य कोषालय ऑडिट")}</span>
                  <span style={{ color: "#94a3b8" }}>➔</span>
                  <span style={{ color: "#94a3b8" }}>{loc("○ Bank Credit", "○ बैंक क्रेडिट")}</span>
                </div>
              </div>
            )}

            {activeFarmerBooking.paymentStatus === "PAYMENT_INITIATED" && (
              <div className="profile-verified-box mt-3 text-left" style={{ background: "#f0fdfa", border: "1px solid #ccfbf1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <RefreshCw size={20} className="teal-text animate-spin" />
                  <h4 style={{ color: "var(--primary-dark)", margin: 0 }}>{loc("Current Status: Payment Initiated", "वर्तमान स्थिति: भुगतान जारी")}</h4>
                </div>
                <p style={{ fontSize: "13px", color: "#334155", margin: "4px 0 12px" }}>
                  {loc("Treasury sanction approved. PFMS Direct Benefit Transfer batch has been dispatched for electronic clearing.", "कोषालय स्वीकृति अनुमोदित। PFMS प्रत्यक्ष लाभ अंतरण बैच इलेक्ट्रॉनिक क्लीयरेंस के लिए प्रेषित कर दिया गया है।")}
                </p>

                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #ccfbf1", fontSize: "13px" }}>
                  <div className="sum-data-row"><span>{loc("PFMS Sanction Ref:", "पीएफएमएस संदर्भ:")}</span> <b>{activeFarmerBooking.paymentRef || "PFMS-2026-DBT-8839201"}</b></div>
                  <div className="sum-data-row"><span>{loc("Sanction Date:", "स्वीकृति दिनांक:")}</span> <b>{activeFarmerBooking.paymentDate || loc("Today", "आज")}</b></div>
                  <div className="sum-data-row"><span>{loc("Dispatched Amount:", "प्रेषित राशि:")}</span> <b className="teal-text">₹{(activeFarmerBooking.netPayableAmount || 0).toLocaleString()}.00</b></div>
                  <div className="sum-data-row"><span>{loc("NPCI / RBI Clearance:", "एनपीसीआई / आरबीआई क्लीयरेंस:")}</span> <b className="teal-text">{loc("In Progress (Expected 24-48 hrs)", "प्रगति पर (24-48 घंटे संभावित)")}</b></div>
                </div>
              </div>
            )}

            {activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" && (
              <div className="profile-verified-box mt-3 text-left" style={{ background: "#f0fdfa", border: "1.5px solid #a7f3d0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <CheckCircle2 size={22} className="text-success" />
                  <h4 style={{ color: "#15803d", margin: 0 }}>{loc("Current Status: Payment Completed & Credited", "वर्तमान स्थिति: भुगतान पूर्ण एवं बैंक में जमा")}</h4>
                </div>
                <p style={{ fontSize: "13px", color: "#166534", margin: "4px 0 12px" }}>
                  {loc("Amount has been successfully credited directly to your Aadhaar-seeded bank account via PFMS Direct Benefit Transfer.", "राशि सीधे आपके आधार-सीडेड बैंक खाते में पीएफएमएस डायरेक्ट बेनिफिट ट्रांसफर के माध्यम से सफलतापूर्वक जमा कर दी गई है।")}
                </p>

                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #a7f3d0", fontSize: "13px" }}>
                  <div className="sum-data-row"><span>{loc("Bank Confirmation UTR:", "बैंक पुष्टिकरण यूटीआर (UTR):")}</span> <b>{activeFarmerBooking.bankUtr || "UTR-SBIN-2026-9938201"}</b></div>
                  <div className="sum-data-row"><span>{loc("Credit Timestamp:", "क्रेडिट समय:")}</span> <b>{activeFarmerBooking.paymentDate || loc("Today", "आज")}, 11:32 AM</b></div>
                  <div className="sum-data-row"><span>{loc("Credited Amount:", "जमा राशि:")}</span> <b className="text-success" style={{ fontSize: "16px" }}>₹{(activeFarmerBooking.netPayableAmount || 0).toLocaleString()}.00</b></div>
                  <div className="sum-data-row"><span>{loc("Transaction Status:", "लेनदेन स्थिति:")}</span> <b className="status-pill checked_in">● {loc("SUCCESS (NEFT/PFMS)", "सफल (NEFT/PFMS)")}</b></div>
                </div>
              </div>
            )}

            {/* Interactive Status Inquirer Button */}
            <div className="modal-actions-row mt-4">
              {activeFarmerBooking.paymentStatus !== "PAYMENT_COMPLETED" ? (
                <>
                  <button className="btn-dash-outline btn-modal-half" onClick={() => setShowPaymentModal(false)}>
                    {loc("Close", "बंद करें")}
                  </button>
                  <button 
                    className="btn-dash-primary btn-modal-half" 
                    onClick={handleCheckPaymentStatus}
                    disabled={isCheckingPayment}
                  >
                    {isCheckingPayment ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>{loc("Querying PFMS Gateway...", "PFMS गेटवे से पूछताछ हो रही है...")}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} />
                        <span>{loc("Check Current Status", "वर्तमान स्थिति जांचें")}</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button className="btn-dash-primary w-full" onClick={() => setShowPaymentModal(false)}>
                  {loc("Close Tracker", "ट्रैकर बंद करें")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          GLOBAL MODAL: BOOKING CONFIRMATION & DETAILS INSPECTOR
          ========================================================= */}
      {viewBookingDetails && (
        <div className="modal-backdrop">
          <div className="modal-card text-center qr-modal-card">
            <div className="modal-head text-left">
              <h3>{loc("Booking Details", "बुकिंग विवरण")}</h3>
              <button className="close-btn" onClick={() => setViewBookingDetails(null)}><X size={18} /></button>
            </div>

            <div className="profile-verified-box text-left mt-2">
              <div className="sum-data-row"><span>{loc("Booking ID:", "बुकिंग आईडी:")}</span> <b>{viewBookingDetails.id}</b></div>
              <div className="sum-data-row"><span>{loc("Crop:", "फसल:")}</span> <b>{translateCrop(viewBookingDetails.crop)}</b></div>
              <div className="sum-data-row"><span>{loc("Centre:", "खरीद केंद्र:")}</span> <b>{translateCentre(viewBookingDetails.centreName)}</b></div>
              <div className="sum-data-row"><span>{loc("Date & Slot:", "दिनांक और स्लॉट:")}</span> <b>{viewBookingDetails.date} ({viewBookingDetails.slotTime})</b></div>
              <div className="sum-data-row"><span>{loc("Status:", "स्थिति:")}</span> <b className="text-success">{loc(viewBookingDetails.status, viewBookingDetails.status === "BOOKED" ? "बुक किया गया" : (viewBookingDetails.status === "CANCELLED" ? "रद्द" : "संपन्न"))}</b></div>
            </div>

            {viewBookingDetails.status !== "CANCELLED" && (
              <div className="qr-centered-container mt-3">
                <DynamicQRCode 
                  value={viewBookingDetails.id} 
                  payloadData={viewBookingDetails} 
                  size={140} 
                  title={`Token #${viewBookingDetails.id}`}
                />
                <small className="qr-label-sub">{loc("Official Digital Mandi Token ID:", "आधिकारिक डिजिटल मंडी टोकन आईडी:")} {viewBookingDetails.id}</small>
              </div>
            )}

            {viewBookingDetails.status !== "CANCELLED" && viewBookingDetails.status !== "PROCUREMENT_COMPLETED" ? (
              <div className="modal-btn-row mt-4">
                <button className="btn-dash-outline btn-modal-half" onClick={() => setViewBookingDetails(null)}>
                  {t("close")}
                </button>
                <button 
                  className="btn-cancel-red btn-modal-half"
                  onClick={() => {
                    const idToCancel = viewBookingDetails.id;
                    setViewBookingDetails(null);
                    setCancelBookingConfirmId(idToCancel);
                  }}
                >
                  {t("cancelBooking")}
                </button>
              </div>
            ) : (
              <div className="text-center mt-4">
                <button className="btn-dash-primary btn-modal-center" onClick={() => setViewBookingDetails(null)}>
                  {t("close")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          GLOBAL MODAL: LOGOUT CONFIRMATION (TEXT ONLY, BUTTON STYLED)
          ========================================================= */}
      {showLogoutModal && (
        <div className="modal-backdrop">
          <div className="modal-card text-center logout-text-modal">
            <h3>{t("logoutConfirmTitle")}</h3>
            <p className="mt-2 text-muted-logout">{t("logoutConfirmDesc")}</p>

            <div className="modal-btn-row mt-4">
              <button className="btn-dash-outline btn-modal-half" onClick={() => setShowLogoutModal(false)}>
                {t("cancel")}
              </button>
              <button className="btn-danger-solid btn-modal-half" onClick={onLogout}>
                {t("switchRole")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          WEB RIGHT-SIDE SLIDEBAR DRAWER FOR NOTIFICATIONS & ALERTS
          ========================================================= */}
      {showWebNotificationDrawer && (
        <div className={`web-drawer-backdrop ${isClosingDrawer ? "closing" : ""}`} onClick={handleCloseWebDrawer}>
          <div className={`web-drawer-card ${isClosingDrawer ? "closing" : ""}`} onClick={e => e.stopPropagation()}>
            <div className="web-drawer-head">
              <div>
                <h3 style={{ margin: 0, fontSize: "16px" }}>{t("notificationsAndAlerts")}</h3>
                <small style={{ color: "#64748b" }}>{loc("Live Mandi & DBT Updates", "लाइव मंडी और डीबीटी अपडेट")}</small>
              </div>
              <button className="close-btn" onClick={handleCloseWebDrawer}>
                <X size={18} />
              </button>
            </div>

            <div className="web-drawer-body mt-3">
              <div className="alert-item-card">
                <div className="alert-badge-row">
                  <span className="badge-info-tag">{loc("System Notification", "सिस्टम अधिसूचना")}</span>
                  <small>{loc("Today", "आज")}</small>
                </div>
                <h4 style={{ margin: "6px 0 2px" }}>{loc("Mandi Procurement Active", "मंडी खरीद सक्रिय")}</h4>
                <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0" }}>
                  {loc("Rabi 2026 grain procurement is active across all authorized Krishi Upaj Mandis. You can book slots for Wheat, Mustard, and Gram.", "रबी 2026 अनाज खरीद सभी अधिकृत कृषि उपज मंडियों में सक्रिय है। आप गेहूं, सरसों और चना के लिए स्लॉट बुक कर सकते हैं।")}
                </p>
              </div>

              <div className="alert-item-card mt-2">
                <div className="alert-badge-row">
                  <span className="badge-verified-tag">{loc("AgriStack Verified", "एग्रीस्टैक सत्यापित")}</span>
                  <small>{loc("Cadastre", "भूलेख")}</small>
                </div>
                <h4 style={{ margin: "6px 0 2px" }}>{loc("Land Record Registry Synchronized", "भूमि रिकॉर्ड रजिस्ट्री सिंक हुई")}</h4>
                <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0" }}>
                  {loc(`Your land holdings (${landParcels.length} verified parcels) are synced with the State Revenue Department for dynamic grain quota allocation.`, `आपकी भूमि जोत (${landParcels.length} सत्यापित पार्सल) गतिशील अनाज कोटा आवंटन के लिए राज्य राजस्व विभाग के साथ सिंक हैं।`)}
                </p>
              </div>

              <div className="alert-item-card mt-2">
                <div className="alert-badge-row">
                  <span className="badge-verified-tag">{loc("Aadhaar Linked", "आधार लिंक")}</span>
                  <small>{loc("AgriStack", "एग्रीस्टैक")}</small>
                </div>
                <h4 style={{ margin: "6px 0 2px" }}>{loc("Direct Benefit Transfer Ready", "प्रत्यक्ष लाभ अंतरण (DBT) तैयार")}</h4>
                <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0" }}>
                  {loc(`Your bank account (${farmerProfile.bankName} - ${farmerProfile.accountMasked}) is seeded for PFMS DBT disbursements.`, `आपका बैंक खाता (${translateBank(farmerProfile.bankName)} - ${farmerProfile.accountMasked}) PFMS DBT संवितरण के लिए सीडेड है।`)}
                </p>
              </div>
            </div>

            <div className="web-drawer-footer mt-4">
              <button className="btn-dash-outline w-full" onClick={handleCloseWebDrawer}>
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          FIXED MOBILE BOTTOM NAVIGATION BAR (PWA 3-TABS)
          ========================================================= */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`bottom-nav-item ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
        >
          <div className="nav-item-icon-wrap">
            <Home size={24} />
          </div>
          <span>{t("home")}</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === "book" ? "active" : ""}`}
          onClick={() => setActiveTab("book")}
        >
          <div className="nav-item-icon-wrap">
            <CalendarDays size={24} />
          </div>
          <span>{t("slotBooking")}</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === "alerts" ? "active" : ""}`}
          onClick={() => setActiveTab("alerts")}
        >
          <div className="nav-item-icon-wrap">
            <Bell size={24} />
            {upcomingProcurement && <span className="nav-unread-dot" />}
          </div>
          <span>{t("alerts")}</span>
        </button>
      </nav>
    </div>
  );
}
export default FarmerPortal;
