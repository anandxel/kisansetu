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
import { apiUpdateFarmerBank } from "../api";
import { LanguageSelector } from "./LanguageSelector";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Comprehensive Database of 28 Indian States & UTs with Cascading Districts, Tehsils & Villages
const ALL_INDIAN_STATES = Object.keys(ALL_INDIAN_STATES_DATA);

const STATE_DISTRICT_DATA = ALL_INDIAN_STATES_DATA;

import { DynamicQRCode } from "./DynamicQRCode";

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

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const t = (k) => getTranslation(currentLang, k);

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
    farmerId: user?.farmerId || "F101",
    farmerName: user?.farmerName || "Farmer",
    fatherName: user?.fatherName || "",
    dob: user?.dob || "",
    age: user?.age || "",
    gender: user?.gender || "Male",
    mobile: user?.mobile || "",
    email: user?.email || "",
    aadhaarMasked: user?.aadhaarMasked || (user?.aadhaar ? `XXXX-XXXX-${user.aadhaar.slice(-4)}` : "XXXX-XXXX-4829"),
    village: user?.village || "",
    tehsil: user?.tehsil || "",
    district: user?.district || "",
    state: user?.state || "Rajasthan",
    pincode: user?.pincode || "",
    address: user?.address || "",
    bankName: user?.bankName || "State Bank of India",
    accountMasked: user?.accountMasked || (user?.accountNo ? `XXXX-XXXX-${user.accountNo.slice(-4)}` : "XXXX-XXXX-8921"),
    accountNo: user?.accountNo || "",
    accountHolderName: user?.accountHolderName || user?.farmerName || "Farmer",
    ifsc: user?.ifsc || "SBIN0001429",
    branch: user?.branch || "Main Branch"
  });

  // Sync Profile when user prop updates
  useEffect(() => {
    if (user && user.farmerName) {
      setFarmerProfile({
        farmerId: user.farmerId || "F101",
        farmerName: user.farmerName,
        fatherName: user.fatherName || "",
        dob: user.dob || "",
        age: user.age || "",
        gender: user.gender || "Male",
        mobile: user.mobile || "",
        email: user.email || "",
        aadhaarMasked: user.aadhaarMasked || (user.aadhaar ? `XXXX-XXXX-${user.aadhaar.slice(-4)}` : "XXXX-XXXX-4829"),
        village: user.village || "",
        tehsil: user.tehsil || "",
        district: user.district || "",
        state: user.state || "Rajasthan",
        pincode: user.pincode || "",
        address: user.address || "",
        bankName: user.bankName || "State Bank of India",
        accountMasked: user.accountMasked || (user.accountNo ? `XXXX-XXXX-${user.accountNo.slice(-4)}` : "XXXX-XXXX-8921"),
        accountNo: user.accountNo || "",
        accountHolderName: user.accountHolderName || user.farmerName,
        ifsc: user.ifsc || "SBIN0001429",
        branch: user.branch || "Main Branch"
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
    setBankSuccessMsg("Bank Details Updated & Verified with PFMS Gateway!");
    setTimeout(() => {
      setBankSuccessMsg("");
      setShowBankModal(false);
      setSyncToast("Bank Account Details Successfully Saved & Linked for DBT");
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
      setSyncToast("AgriStack Synced Successfully: Verified Land Records Updated");
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
    setSyncToast(`Added ${parcelsToAdd.length} Land Parcels from State Land Record.`);
    setTimeout(() => setSyncToast(""), 3500);
  };

  // Selected Centre & Land Totals
  const activeCentre = (centres && centres.length > 0) 
    ? (centres.find(c => c.id === selectedCentreId) || centres[0])
    : { id: "C001", name: "Procurement Centre", district: user?.district || "Alwar", state: "Rajasthan", distance: "4.5 km", dailyCapacityTonnes: 50, reservedTonnes: 0, mspRatePerQtl: 2425, crop: "Wheat" };
  const selectedLands = (landParcels || []).filter(l => selectedLandIds.includes(l.id));
  const totalSelectedArea = selectedLands.reduce((acc, l) => acc + Number(l.areaHectare || 0), 0).toFixed(2);

  // Filter Farmer Bookings
  const todayDateStr = new Date().toISOString().split("T")[0];
  const farmerBookings = bookings.filter(b => b.farmerId === user.farmerId);
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
  const centreDateBookings = bookings.filter(b => b.centreId === selectedCentreId && b.date === bookingDate && b.status !== "CANCELLED");
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
  const handleSendContactOtp = (e) => {
    e.preventDefault();
    if (!editMobile) {
      alert("Please enter a valid mobile number.");
      return;
    }
    setContactOtpStep(2);
    setContactOtp("4829");
  };

  const handleVerifyContactOtp = (e) => {
    e.preventDefault();
    setFarmerProfile(prev => ({
      ...prev,
      mobile: editMobile,
      email: editEmail
    }));
    setContactSuccessMsg("Mobile Number and Email Address updated successfully!");
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
    setPassSuccessMsg("Password updated successfully!");
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
    setSyncToast("Land Record Added from State Land Record.");
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
          <span className="sidebar-brand-name">KisanSetu</span>
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
              <span className="brand-title">Kisan</span>
              <span className="brand-subtitle">Setu</span>
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
                  Hello, {farmerProfile.farmerName}! 👋
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
                    {upcomingProcurement.status.replace("_", " ")}
                  </span>
                )}
              </div>

              {upcomingProcurement ? (
                <div className="pwa-card-content mt-2">
                  <div className="pwa-crop-row">
                    <h3 className="pwa-crop-title">{upcomingProcurement.crop}</h3>
                    <span className="pwa-tonnage-tag">
                      {upcomingProcurement.actualWeightTonnes || upcomingProcurement.expectedTonnes} Tonnes
                    </span>
                  </div>

                  <div className="pwa-meta-list mt-2">
                    <div className="pwa-meta-item">
                      <Clock size={14} className="teal-text flex-shrink-0" />
                      <span><b>{upcomingProcurement.date}</b> • {upcomingProcurement.slotTime}</span>
                    </div>
                    <div className="pwa-meta-item">
                      <MapPin size={14} className="teal-text flex-shrink-0" />
                      <span>{upcomingProcurement.centreName}</span>
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
                  <small className="pwa-service-hint">Aadhaar & Bank</small>
                </div>

                {/* 2. Land Records */}
                <div className="pwa-service-card" onClick={() => setActiveTab("land")}>
                  <div className="pwa-service-icon-bubble bubble-teal">
                    <MapPin size={24} />
                  </div>
                  <span className="pwa-service-name">{t("landRecords")}</span>
                  <small className="pwa-service-hint">{landParcels.length} Parcels</small>
                </div>

                {/* 3. Live Reports */}
                <div className="pwa-service-card" onClick={() => setActiveTab("live")}>
                  <div className="pwa-service-icon-bubble bubble-teal">
                    <Activity size={24} />
                  </div>
                  <span className="pwa-service-name">{t("liveReport")}</span>
                  <small className="pwa-service-hint">Queue & DBT</small>
                </div>

                {/* 4. Booking History */}
                <div className="pwa-service-card" onClick={() => setActiveTab("history")}>
                  <div className="pwa-service-icon-bubble bubble-teal">
                    <History size={24} />
                  </div>
                  <span className="pwa-service-name">{t("bookingHistory")}</span>
                  <small className="pwa-service-hint">{farmerBookings.length} Bookings</small>
                </div>

                {/* 5. Procurements */}
                <div className="pwa-service-card" onClick={() => setActiveTab("procurements")}>
                  <div className="pwa-service-icon-bubble bubble-teal">
                    <FileText size={24} />
                  </div>
                  <span className="pwa-service-name">{t("procurements")}</span>
                  <small className="pwa-service-hint">Form J Receipts</small>
                </div>

                {/* 6. Help & Support */}
                <div className="pwa-service-card" onClick={() => setShowHelpModal(true)}>
                  <div className="pwa-service-icon-bubble bubble-teal">
                    <HelpCircle size={24} />
                  </div>
                  <span className="pwa-service-name">{t("helpSupport")}</span>
                  <small className="pwa-service-hint">Toll-Free & Guide</small>
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
                  <h2>{farmerProfile.farmerName}</h2>
                  <p>{t("fatherName")}: <b>{farmerProfile.fatherName}</b> • {t("age") || "Age"}: <b>{farmerProfile.age}</b></p>
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
                    <b>{farmerProfile.farmerName}</b>
                  </div>
                  <div className="kv-item">
                    <span>{t("fatherName")}</span>
                    <b>{farmerProfile.fatherName}</b>
                  </div>
                  <div className="kv-item">
                    <span>{t("ageGender")}</span>
                    <b>{farmerProfile.age} • {farmerProfile.gender}</b>
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
                    <b>{farmerProfile.email || "Not Provided"}</b>
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
                    <b>{farmerProfile.address}</b>
                  </div>
                  <div className="kv-item">
                    <span>{t("villageTehsil")}</span>
                    <b>{farmerProfile.village}, {farmerProfile.tehsil}</b>
                  </div>
                  <div className="kv-item">
                    <span>{t("districtState")}</span>
                    <b>{farmerProfile.district}, {farmerProfile.state} - {farmerProfile.pincode}</b>
                  </div>
                  <div className="kv-item">
                    <span>{t("agriZone")}</span>
                    <b>North-Eastern Semi-Arid Zone (Zone III-B)</b>
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
                      <span className="bank-label-sub">Primary DBT Payout Bank</span>
                      <span className="badge-pfms-active">
                        <CheckCircle2 size={13} /> {t("activeDbtSeeded")}
                      </span>
                    </div>
                    <h3 className="bank-display-name">{farmerProfile.bankName}</h3>
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
                        <span>Account Holder</span>
                        <b>{farmerProfile.accountHolderName}</b>
                      </div>
                      <div className="bank-acc-col">
                        <span>{t("branchName")}</span>
                        <b>{farmerProfile.branch}</b>
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
                      <h3>Update / Add Bank Account</h3>
                      <small className="text-muted">Direct Benefit Transfer (DBT) Payout Account for MSP Payments</small>
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
                        <label>Bank Name</label>
                        <select 
                          value={editBankName} 
                          onChange={e => setEditBankName(e.target.value)} 
                          className="clean-select"
                          required
                        >
                          <option value="State Bank of India">State Bank of India (SBI)</option>
                          <option value="Punjab National Bank">Punjab National Bank (PNB)</option>
                          <option value="Bank of Baroda">Bank of Baroda (BOB)</option>
                          <option value="HDFC Bank">HDFC Bank</option>
                          <option value="ICICI Bank">ICICI Bank</option>
                          <option value="Rajasthan Marudhara Gramin Bank">Rajasthan Marudhara Gramin Bank (RMGB)</option>
                          <option value="Baroda Rajasthan Kshetriya Gramin Bank">Baroda Rajasthan Kshetriya Gramin Bank (BRKGB)</option>
                          <option value="Canara Bank">Canara Bank</option>
                          <option value="Union Bank of India">Union Bank of India</option>
                        </select>
                      </div>

                      <div className="form-group mt-3">
                        <label>Account Holder Name (As per Bank Passbook)</label>
                        <input 
                          type="text" 
                          value={editAccountHolder} 
                          onChange={e => setEditAccountHolder(e.target.value)} 
                          placeholder="e.g. Ramesh Kumar"
                          required 
                        />
                      </div>

                      <div className="form-grid-2 mt-3">
                        <div className="form-group">
                          <label>Account Number</label>
                          <input 
                            type="text" 
                            value={editAccountNo} 
                            onChange={e => setEditAccountNo(e.target.value.replace(/\D/g, ''))} 
                            placeholder="e.g. 308291048921"
                            required 
                          />
                        </div>

                        <div className="form-group">
                          <label>Confirm Account Number</label>
                          <input 
                            type="text" 
                            value={editConfirmAccountNo} 
                            onChange={e => setEditConfirmAccountNo(e.target.value.replace(/\D/g, ''))} 
                            placeholder="e.g. 308291048921"
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-grid-2 mt-3">
                        <div className="form-group">
                          <label>IFSC Code</label>
                          <input 
                            type="text" 
                            maxLength="11"
                            value={editIfsc} 
                            onChange={e => setEditIfsc(e.target.value.toUpperCase())} 
                            placeholder="e.g. SBIN0001429"
                            required 
                          />
                        </div>

                        <div className="form-group">
                          <label>Branch Name</label>
                          <input 
                            type="text" 
                            value={editBranch} 
                            onChange={e => setEditBranch(e.target.value)} 
                            placeholder="e.g. Kherli Mandi Branch"
                            required 
                          />
                        </div>
                      </div>

                      <div className="modal-action-btns mt-4">
                        <button type="submit" className="btn-dash-primary w-full">
                          <Check size={16} /> Save & Verify Bank Account
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
                    <h3>Update Contact Details (OTP Verification)</h3>
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
                        <label>New Mobile Number</label>
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
                        <label>Email Address</label>
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
                        Send Verification OTP
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyContactOtp} className="modal-form">
                      <div className="alert-badge-top">
                        <span>OTP sent to {editMobile}</span>
                      </div>

                      <div className="form-group mt-2">
                        <label>Enter 4-digit OTP</label>
                        <input 
                          type="text" 
                          maxLength="4"
                          value={contactOtp} 
                          onChange={e => setContactOtp(e.target.value)} 
                          className="aadhaar-input-large"
                          placeholder="••••"
                          required 
                        />
                        <small className="form-hint text-center">Demo OTP: <b>4829</b></small>
                      </div>

                      <button type="submit" className="btn-dash-primary w-full mt-4">
                        Verify & Update Contact Details
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
                    <h3>Change Account Password</h3>
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
                        <label>Current Password</label>
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
                        <label>New Password</label>
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
                        <label>Confirm New Password</label>
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
                        Update Password
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
                <span className="section-eyebrow">AGRICADASTRE & AGRISTACK</span>
                <h2 className="section-page-title">{t("landRecords")}</h2>
                <p className="section-page-desc">Centralized cadastral verification and verified land titles.</p>
              </div>
              <div className="header-action-btns land-header-actions">
                <button 
                  className="btn-dash-outline" 
                  disabled={isSyncingAgriStack}
                  onClick={handleTriggerAgriStackSync}
                >
                  <RefreshCw size={16} className={isSyncingAgriStack ? "animate-spin" : ""} />
                  <span>{isSyncingAgriStack ? "Syncing..." : "Sync AgriStack"}</span>
                </button>
                <button 
                  className="btn-dash-primary" 
                  onClick={() => { 
                    openModalWithHistory(setShowAddLandModal, "addLand"); 
                    setKhasraSearchResults(null); 
                  }}
                >
                  <Plus size={16} /> Add Land
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
                    <span>{isSyncingAgriStack ? "Syncing AgriStack..." : "Sync AgriStack"}</span>
                  </button>
                  <button 
                    className="btn-dash-outline" 
                    onClick={() => { 
                      openModalWithHistory(setShowAddLandModal, "addLand"); 
                      setKhasraSearchResults(null); 
                    }}
                  >
                    <Plus size={16} /> Add Land
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-card mt-3">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Khasra No.</th>
                      <th>Village & Tehsil</th>
                      <th>District</th>
                      <th>Area</th>
                      <th>Soil Type</th>
                      <th>Source</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landParcels.map((parcel) => (
                      <tr key={parcel.id}>
                        <td><b>{parcel.khasraNo}</b></td>
                        <td>{parcel.village}, {parcel.tehsil}</td>
                        <td>{parcel.district}</td>
                        <td>{parcel.areaHectare} Ha</td>
                        <td>{parcel.soilType}</td>
                        <td><small className="tag-source">{parcel.source}</small></td>
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
                      <h3>Add Land Record</h3>
                      <small className="text-muted">Select location and enter Khasra Number to search cadastral records.</small>
                    </div>
                    <button className="close-btn" onClick={() => setShowAddLandModal(false)}><X size={18} /></button>
                  </div>
                  
                  <form onSubmit={handleSearchKhasraRecords} className="modal-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>State</label>
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
                        <label>District</label>
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
                        <label>Tehsil</label>
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
                        <label>Village</label>
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
                      <label>Khasra Number</label>
                      <div className="search-input-wrap">
                        <input 
                          type="text"
                          value={newLandKhasra} 
                          onChange={e => setNewLandKhasra(e.target.value)} 
                          className="clean-input"
                          placeholder="e.g. 142/3 or 312/5"
                          required
                        />
                        <button 
                          type="submit" 
                          disabled={isSearchingKhasra}
                          className="btn-dash-primary btn-search-khasra"
                        >
                          <Search size={16} />
                          <span>{isSearchingKhasra ? "Searching..." : "Search"}</span>
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
                          <b>Select All ({khasraSearchResults.length} parcels found)</b>
                        </label>
                        <span className="tag-source">Bhulekh Verified</span>
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
                                    <b>Khasra {parcel.khasraNo}</b>
                                    <span className="owner-tag">{parcel.ownership}</span>
                                  </div>
                                  <div className="parcel-meta-sub">
                                    <span>Area: <b>{parcel.areaHectare} Ha</b></span>
                                    <span>Soil: <b>{parcel.soilType}</b></span>
                                    <span>Irrigation: <b>{parcel.irrigation}</b></span>
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
                          <Check size={16} /> Submit
                        </button>
                        <button 
                          className="btn-dash-outline"
                          onClick={() => setKhasraSearchResults(null)}
                        >
                          Cancel
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
                <span className="section-eyebrow">PROCUREMENT BOOKING</span>
                <h2 className="section-page-title">Slot Booking</h2>
                <p className="section-page-desc">Select crop, verified lands, expected produce quantity and your preferred 20-minute appointment slot.</p>
              </div>
              <span className="badge-booking-open">Booking open</span>
            </div>

            <form onSubmit={handleBookingSubmit} className="booking-layout-grid">
              {/* Left Column: 4 Progressive Steps */}
              <div className="booking-steps-col">
                {/* Step 1: Crop details */}
                <div className="wizard-step-card">
                  <div className="step-num-circle">1</div>
                  <div className="step-main-body">
                    <div className="step-title-wrap">
                      <h4>Crop details</h4>
                      <p>Choose the crop you're bringing</p>
                    </div>

                    <div className="form-grid-2 mt-3">
                      <div className="form-group">
                        <label>Season</label>
                        <select 
                          value={selectedSeason} 
                          onChange={e => handleSeasonChange(e.target.value)}
                          className="clean-select"
                        >
                          <option value="Rabi">Rabi</option>
                          <option value="Kharif">Kharif</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Crop name</label>
                        <select 
                          value={selectedCrop} 
                          onChange={e => setSelectedCrop(e.target.value)}
                          className="clean-select"
                        >
                          {CROPS_BY_SEASON[selectedSeason].map((cropItem) => (
                            <option key={cropItem} value={cropItem}>
                              {cropItem}
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
                      <h4>Select land</h4>
                      <p>Select all verified land parcels where this crop was harvested</p>
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
                                <b>Khasra {land.khasraNo}</b>
                                <span>{land.village} • {land.areaHectare} ha • <span className="text-success">Verified</span></span>
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
                      <h4>Expected quantity</h4>
                      <p>Enter total expected grain weight across all selected parcels.</p>
                    </div>

                    <div className="form-group mt-3">
                      <label>Expected quantity (Tonnes)</label>
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
                      <small className="field-subtext">Total produce weight calculated for {totalSelectedArea} Hectares of land (uncapped capacity)</small>
                    </div>
                  </div>
                </div>

                {/* Step 4: Centre, date & time slot */}
                <div className="wizard-step-card">
                  <div className="step-num-circle">4</div>
                  <div className="step-main-body">
                    <div className="step-title-wrap">
                      <h4>Centre, date & time slot</h4>
                      <p>Choose procurement centre and your preferred time slot.</p>
                    </div>

                    <div className="form-group mt-3">
                      <label>Procurement centre</label>
                      <select 
                        value={selectedCentreId} 
                        onChange={e => setSelectedCentreId(e.target.value)}
                        className="clean-select"
                      >
                        {centres.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name.split(" ")[0]} • {c.distance}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group mt-3">
                      <label>Date</label>
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
                    <label className="mt-3 block-label">Select Time Slot (09:00 AM – 05:00 PM)</label>
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
                              {isMyBooking ? "Your Booking" : isBooked ? "Booked" : "Available"}
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
                          <span>Booking slot...</span>
                        </>
                      ) : (
                        <span>Book Slot</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Sticky Booking Summary Card */}
              <div className="booking-summary-col">
                <div className="summary-sticky-card">
                  <h3>Booking summary</h3>

                  <div className="summary-crop-header">
                    <div className="crop-icon-box">
                      <Sprout size={24} className="teal-text" />
                    </div>
                    <div>
                      <h4>{selectedCrop.split(" ")[0]}</h4>
                      <span>{selectedSeason} season</span>
                    </div>
                  </div>

                  <div className="summary-data-table">
                    <div className="sum-data-row">
                      <span>Selected Lands</span>
                      <b>{selectedLands.map(l => l.khasraNo).join(", ")} ({totalSelectedArea} ha)</b>
                    </div>
                    <div className="sum-data-row">
                      <span>Expected Qty</span>
                      <b>{expectedQuantity || 0} Tonnes</b>
                    </div>
                    <div className="sum-data-row">
                      <span>Centre</span>
                      <b>{activeCentre?.name ? activeCentre.name.split(" ")[0] : "Centre"}</b>
                    </div>
                    <div className="sum-data-row">
                      <span>Date</span>
                      <b>{bookingDate}</b>
                    </div>
                    <div className="sum-data-row">
                      <span>Time Slot</span>
                      <b>{selectedSlotTime}</b>
                    </div>
                  </div>

                  <div className="summary-checked-note">
                    <ShieldCheck size={18} className="teal-text flex-shrink-0" />
                    <span>Slot appointment is confirmed with instant digital gate pass.</span>
                  </div>
                </div>
              </div>
            </form>

            {/* SUCCESS MODAL (REAL CENTERED QR CODE + CLOSE BUTTON) */}
            {bookingSuccessModal && (
              <div className="modal-backdrop">
                <div className="modal-card text-center qr-modal-card">
                  <div className="success-icon-badge"><CheckCircle2 size={45} className="teal-text" /></div>
                  <h3 className="mt-2">Slot Successfully Reserved</h3>
                  <p className="mt-1">Your appointment has been confirmed at {bookingSuccessModal.centreName}.</p>
                  
                  <div className="profile-verified-box mt-3 text-left">
                    <div className="sum-data-row"><span>Booking ID:</span> <b>{bookingSuccessModal.id}</b></div>
                    <div className="sum-data-row"><span>Date & Slot:</span> <b>{bookingSuccessModal.date} ({bookingSuccessModal.slotTime})</b></div>
                    <div className="sum-data-row"><span>Selected Lands:</span> <b>{bookingSuccessModal.khasraNo} ({bookingSuccessModal.areaHectares} ha)</b></div>
                    <div className="sum-data-row"><span>Expected Qty:</span> <b>{bookingSuccessModal.expectedTonnes} Tonnes</b></div>
                  </div>

                  {/* Dynamic Authentic QR Pass */}
                  <div className="qr-centered-container mt-3">
                    <DynamicQRCode 
                      value={bookingSuccessModal.id} 
                      payloadData={bookingSuccessModal} 
                      size={140} 
                      title={`Pass #${bookingSuccessModal.id}`}
                    />
                    <small className="qr-label-sub">Official Digital Mandi Gate Pass</small>
                  </div>

                  <button className="btn-dash-primary w-full mt-4" onClick={() => setBookingSuccessModal(null)}>
                    Close
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
                <span className="section-eyebrow">LIVE MANDI TRACKER</span>
                <h2 className="section-page-title">Live Report</h2>
                <p className="section-page-desc">Real-time tracking of your current procurement processing at {activeFarmerBooking?.centreName || "Procurement Centre"}.</p>
              </div>
              {activeFarmerBooking && (
                <span className="status-pill checked_in">
                  ● Token Active: #{activeFarmerBooking.id.slice(-6)}
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
                      <h3>{activeFarmerBooking.crop} Procurement • {activeFarmerBooking.centreName}</h3>
                      <p>Appointment: <b>{activeFarmerBooking.date} ({activeFarmerBooking.slotTime})</b> • Expected: <b>{activeFarmerBooking.expectedTonnes} T</b></p>
                    </div>
                  </div>

                  <div className="centre-banner-tokens">
                    <div className="token-chip">
                      <small>Current Queue</small>
                      <b>#1 in Line</b>
                    </div>
                    <div className="token-chip">
                      <small>Gate Pass</small>
                      <b>{activeFarmerBooking.id}</b>
                    </div>
                  </div>
                </div>

                {/* PROGRESSIVE JOURNEY (HORIZONTAL DESKTOP / VERTICAL MOBILE) */}
                <div className="live-stepper-card mt-3">
                  <div className="stepper-section-title">
                    <h4>Procurement Processing Stages</h4>
                    <span className="stepper-refresh-hint"><RefreshCw size={14} /> Auto-updating in real time</span>
                  </div>

                  <div className="live-stepper-track">
                    {/* Stage 1: Booking Confirmed */}
                    <div className="stepper-stage-node done">
                      <div className="node-marker">
                        <Check size={16} />
                      </div>
                      <div className="node-content">
                        <b>1. Booking Confirmed</b>
                        <p className="node-time">{activeFarmerBooking.date}, {activeFarmerBooking.slotTime.split("–")[0]}</p>
                        <small className="node-detail">Slot Reserved & Token Generated</small>
                      </div>
                    </div>

                    {/* Stage 2: Gate Check-in */}
                    <div className={`stepper-stage-node ${activeFarmerBooking.checkInTime ? "done" : "pending"}`}>
                      <div className="node-marker">
                        {activeFarmerBooking.checkInTime ? <Check size={16} /> : "2"}
                      </div>
                      <div className="node-content">
                        <b>2. Gate Check-in</b>
                        <p className="node-time">
                          {activeFarmerBooking.checkInTime ? `${activeFarmerBooking.date}, ${activeFarmerBooking.checkInTime}` : "Pending"}
                        </p>
                        <small className="node-detail">
                          {activeFarmerBooking.checkInTime ? "Recorded at Mandi Gate 1" : "Awaiting arrival at entrance"}
                        </small>
                      </div>
                    </div>

                    {/* Stage 3: Quality Check */}
                    <div className={`stepper-stage-node ${activeFarmerBooking.qualityResult ? "done" : "pending"}`}>
                      <div className="node-marker">
                        {activeFarmerBooking.qualityResult ? <Check size={16} /> : "3"}
                      </div>
                      <div className="node-content">
                        <b>3. Quality Check</b>
                        <p className="node-time">
                          {activeFarmerBooking.qualityResult ? `${activeFarmerBooking.date}, 10:15 AM` : "Pending"}
                        </p>
                        <small className="node-detail">
                          {activeFarmerBooking.qualityResult ? `${activeFarmerBooking.qualityResult.grade} (Moisture: ${activeFarmerBooking.qualityResult.moisture})` : "Moisture & purity assay"}
                        </small>
                      </div>
                    </div>

                    {/* Stage 4: Weighbridge Weighing */}
                    <div className={`stepper-stage-node ${activeFarmerBooking.actualWeightTonnes ? "done" : "pending"}`}>
                      <div className="node-marker">
                        {activeFarmerBooking.actualWeightTonnes ? <Check size={16} /> : "4"}
                      </div>
                      <div className="node-content">
                        <b>4. Weighbridge</b>
                        <p className="node-time">
                          {activeFarmerBooking.actualWeightTonnes ? `${activeFarmerBooking.date}, 10:30 AM` : "Pending"}
                        </p>
                        <small className="node-detail">
                          {activeFarmerBooking.actualWeightTonnes ? `Net: ${activeFarmerBooking.actualWeightTonnes} T accepted` : "Electronic scale feed"}
                        </small>
                      </div>
                    </div>

                    {/* Stage 5: Procurement Completed */}
                    <div className={`stepper-stage-node ${activeFarmerBooking.status === "PROCUREMENT_COMPLETED" || activeFarmerBooking.netPayableAmount ? "done" : "pending"}`}>
                      <div className="node-marker">
                        {activeFarmerBooking.status === "PROCUREMENT_COMPLETED" || activeFarmerBooking.netPayableAmount ? <Check size={16} /> : "5"}
                      </div>
                      <div className="node-content">
                        <b>5. Procurement Completed</b>
                        <p className="node-time">
                          {activeFarmerBooking.paymentDate ? `${activeFarmerBooking.paymentDate}` : "Pending"}
                        </p>
                        <small className="node-detail">
                          {activeFarmerBooking.status === "PROCUREMENT_COMPLETED" || activeFarmerBooking.netPayableAmount ? "Form J Generated & Produce Deposited" : "Final approval & slip issuance"}
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
                        <b>6. PFMS DBT Payment</b>
                        <p className="node-time">
                          {activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" 
                            ? "Credited in Bank" 
                            : (activeFarmerBooking.paymentStatus === "PAYMENT_INITIATED" ? "PFMS Initiated" : "Pending at State Level")}
                        </p>
                        <small className="node-detail">
                          {activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" 
                            ? "Direct Bank Transfer Successful" 
                            : (activeFarmerBooking.paymentStatus === "PAYMENT_INITIATED" ? "PFMS Batch Clearance In-Progress" : "Bill submitted to Treasury")}
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
                              Direct Benefit Transfer (DBT) Payout
                            </span>
                            <h4 style={{ fontSize: "16px", fontWeight: "700", margin: "2px 0" }}>
                              Payment Status:{" "}
                              {activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" ? (
                                <span className="text-success">Paid via PFMS DBT</span>
                              ) : activeFarmerBooking.paymentStatus === "PAYMENT_INITIATED" ? (
                                <span className="teal-text">Payment Initiated (PFMS Clearance)</span>
                              ) : (
                                <span style={{ color: "var(--slate)" }}>Pending at State Level</span>
                              )}
                            </h4>
                            <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>
                              Payable Amount: <b className="teal-text">₹{(activeFarmerBooking.netPayableAmount || 0).toLocaleString()}.00</b>
                              {" • "}
                              {activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" 
                                ? `Credited via UTR: ${activeFarmerBooking.bankUtr || "UTR-SBIN-2026-9824892"}`
                                : (activeFarmerBooking.paymentStatus === "PAYMENT_INITIATED" ? `PFMS Ref: ${activeFarmerBooking.paymentRef}` : "Mandi weighment done. Awaiting state treasury disbursement.")}
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
                            <span>Click Here to Track Payment Status</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="payment-pending-banner mt-3">
                    <Clock size={22} className="teal-text flex-shrink-0" />
                    <div>
                      <h4>PFMS Direct Benefit Transfer (DBT) Pending</h4>
                      <p>Direct bank transfer of procurement payout will be initiated automatically once physical weighment and Form J generation are completed at the Mandi.</p>
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
                <span className="section-eyebrow">APPOINTMENTS & JOURNEY</span>
                <h2 className="section-page-title">Booking History</h2>
                <p className="section-page-desc">View all your upcoming, active, and completed grain delivery appointments.</p>
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
                    <CalendarDays size={16} /> Book Your First Slot
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
                          <h4>{b.crop} Procurement ({b.season})</h4>
                          <span className="history-centre-tag">{b.centreName}</span>
                        </div>
                      </div>

                      <div className="history-status-badge-wrap">
                        {isCompleted && <span className="status-pill procurement_completed">● Completed</span>}
                        {isCancelled && <span className="status-pill cancelled">● Cancelled</span>}
                        {isUpcoming && <span className="status-pill checked_in">● {b.status.replace("_", " ")}</span>}
                      </div>
                    </div>

                    <div className="history-meta-grid">
                      <div>
                        <span>Booking ID</span>
                        <b>{b.id}</b>
                      </div>
                      <div>
                        <span>Appointment Slot</span>
                        <b>{b.slotTime}</b>
                      </div>
                      <div>
                        <span>Lands / Area</span>
                        <b>Khasra {b.khasraNo} ({b.areaHectares} Ha)</b>
                      </div>
                      <div>
                        <span>Quantity</span>
                        <b>{b.actualWeightTonnes ? `${b.actualWeightTonnes} T Accepted` : `${b.expectedTonnes} T Expected`}</b>
                      </div>
                    </div>

                    <div className="history-card-actions">
                      <button className="btn-dash-outline" onClick={() => setViewBookingDetails(b)}>
                        <Eye size={15} /> View Details & QR
                      </button>

                      {isUpcoming && (
                        <button className="btn-cancel-red" onClick={() => setCancelBookingConfirmId(b.id)}>
                          Cancel Booking
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
                <span className="section-eyebrow">TRANSACTIONS & PAYMENTS</span>
                <h2 className="section-page-title">Procurements & Receipts</h2>
                <p className="section-page-desc">Summary of crop sold, PFMS DBT payouts, and authenticated digital J-Form certificates.</p>
              </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="dash-metrics-grid mt-2">
              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Scale size={20} className="tile-icon teal" />
                  <small>Total Crop Sold</small>
                </div>
                <h3>{totalCropSoldTonnes} Tonnes</h3>
                <span>{(totalCropSoldTonnes * 10).toFixed(1)} Quintals Delivered</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <WalletCards size={20} className="tile-icon teal" />
                  <small>Total Money Received</small>
                </div>
                <h3>₹{totalMoneyReceived.toLocaleString()}</h3>
                <span>Direct PFMS Bank Transfer</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Clock size={20} className="tile-icon slate" />
                  <small>Pending Payouts</small>
                </div>
                <h3>₹0.00</h3>
                <span>All settlements cleared</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <FileText size={20} className="tile-icon slate" />
                  <small>Total Transactions</small>
                </div>
                <h3>{completedProcurements.length}</h3>
                <span>J-Forms Generated</span>
              </div>
            </div>

            {/* List of Procurement Receipts (J-Forms) */}
            <div className="section-sub-head mt-4">
              <h3>Authenticated Procurement Receipts (J-Forms)</h3>
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
                        <h4>J-Form #{proc.id}</h4>
                        <p>{proc.crop} • {proc.actualWeightTonnes || 7.42} Tonnes (₹2,425/Qtl)</p>
                        <small className="text-muted">Procurement Date: {proc.paymentDate || "22/09/2026"} • {proc.centreName}</small>
                      </div>
                    </div>

                    <div className="receipt-card-right">
                      <div className="payout-amount-tag">
                        <span>Net Paid</span>
                        <b>₹{(proc.netPayableAmount || 179935).toLocaleString()}</b>
                      </div>
                      <button className="btn-dash-primary" onClick={() => setViewReceiptModal(proc)}>
                        <Download size={15} /> View / Download J-Form
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
                      <Download size={16} /> {isGeneratingPdf ? "Generating PDF..." : "Download J-Form PDF"}
                    </button>
                    <button 
                      className="btn-dash-outline btn-modal-half" 
                      onClick={() => setViewReceiptModal(null)}
                    >
                      Close
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
                <span className="section-eyebrow">NOTIFICATIONS & UPDATES</span>
                <h2 className="section-page-title">Live Alerts</h2>
                <p className="section-page-desc">Real-time alerts, mandi queue call-outs and PFMS DBT updates.</p>
              </div>
            </div>

            <div className="alerts-fullpage-list mt-3">
              {upcomingProcurement && (
                <div className="alert-item-card active-alert">
                  <div className="alert-badge-row">
                    <span className="badge-active-tag">Upcoming Appointment</span>
                    <small>{upcomingProcurement.date}</small>
                  </div>
                  <h4 style={{ margin: "6px 0 2px" }}>Token #{upcomingProcurement.id} • {upcomingProcurement.crop}</h4>
                  <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0 8px" }}>
                    Centre: <b>{upcomingProcurement.centreName}</b> | Slot: <b>{upcomingProcurement.slotTime}</b>
                  </p>
                  <div className="alert-status-pill">
                    Status: <b className="teal-text">{upcomingProcurement.status.replace("_", " ")}</b>
                  </div>
                  <button 
                    className="btn-dash-primary btn-sm mt-3" 
                    onClick={() => setActiveTab("live")}
                  >
                    Open Live Mandi Report →
                  </button>
                </div>
              )}

              <div className="alert-item-card">
                <div className="alert-badge-row">
                  <span className="badge-verified-tag">AgriStack Verified</span>
                  <small>Cadastre</small>
                </div>
                <h4 style={{ margin: "6px 0 2px" }}>Land Record Registry Synchronized</h4>
                <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0" }}>
                  Your land holdings ({landParcels.length} verified parcels) are synced with the State Revenue Department for dynamic grain quota allocation.
                </p>
              </div>

              <div className="alert-item-card mt-2">
                <div className="alert-badge-row">
                  <span className="badge-info-tag">PFMS Gateway</span>
                  <small>Direct Benefit Transfer</small>
                </div>
                <h4 style={{ margin: "6px 0 2px" }}>Bank Account Active for DBT</h4>
                <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0" }}>
                  {farmerProfile.bankName} (A/C: {farmerProfile.accountMasked}) is seeded with NPCI Aadhaar bridge for 24-48 hr MSP grain settlements.
                </p>
              </div>

              <div className="alert-item-card mt-2">
                <div className="alert-badge-row">
                  <span className="badge-info-tag">Mandi System Notice</span>
                  <small>Rabi 2026</small>
                </div>
                <h4 style={{ margin: "6px 0 2px" }}>Fair Average Quality (FAQ) Standards</h4>
                <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0" }}>
                  Please ensure Wheat moisture content is below 12.0% and Foreign Matter is under 0.75% for instant gate clearance.
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
              <h3>Help & Support Desk</h3>
            </div>
            
            <div className="help-info-body">
              <div className="help-card-item">
                <div className="help-icon-circle"><PhoneCall size={20} className="teal-text" /></div>
                <div>
                  <h4>Kisan Call Center (Toll-Free Helpline)</h4>
                  <p className="phone-highlight">📞 1800-180-1551</p>
                  <small>Available 24/7 in 22 regional languages</small>
                </div>
              </div>

              <div className="help-card-item mt-3">
                <div className="help-icon-circle"><Mail size={20} className="teal-text" /></div>
                <div>
                  <h4>Email Support</h4>
                  <p className="email-highlight">✉️ support@kisansetu.gov.in</p>
                  <small>For technical and DBT payment inquiries (Turnaround: 24h)</small>
                </div>
              </div>

              <div className="help-card-item mt-3">
                <div className="help-icon-circle"><Smartphone size={20} className="teal-text" /></div>
                <div>
                  <h4>WhatsApp Farmer Bot</h4>
                  <p className="phone-highlight">💬 +91 98765 00000</p>
                  <small>Instant queue updates, slot alerts and J-Form downloads</small>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <button className="btn-dash-primary btn-modal-center" onClick={() => setShowHelpModal(false)}>
                Close
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
            <h3>Cancel Appointment?</h3>
            <p className="mt-2 text-muted-logout">
              Are you sure you want to cancel your booking (<b>{cancelBookingConfirmId}</b>)?
            </p>

            <div className="modal-btn-row mt-4">
              <button 
                className="btn-dash-outline btn-modal-half" 
                onClick={() => setCancelBookingConfirmId(null)}
              >
                Keep Booking
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
                Yes, Cancel Booking
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
                <span className="role-eyebrow-tag">PFMS DIRECT BENEFIT TRANSFER (DBT)</span>
                <h3 style={{ margin: "2px 0 0" }}>Payment Settlement Inquiry</h3>
              </div>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Farmer & Lot Snapshot */}
            <div className="profile-verified-box mt-3" style={{ background: "#f8fafc", padding: "14px" }}>
              <div className="sum-data-row"><span>Token / Booking ID:</span> <b>{activeFarmerBooking.id}</b></div>
              <div className="sum-data-row"><span>Commodity & Weight:</span> <b>{activeFarmerBooking.crop} ({activeFarmerBooking.actualWeightTonnes || activeFarmerBooking.expectedTonnes} Tonnes)</b></div>
              <div className="sum-data-row"><span>Net Payable MSP:</span> <b className="teal-text" style={{ fontSize: "16px" }}>₹{(activeFarmerBooking.netPayableAmount || 0).toLocaleString()}.00</b></div>
              <div className="sum-data-row"><span>Beneficiary Farmer:</span> <b>{farmerProfile.farmerName} (Aadhaar: {farmerProfile.aadhaarMasked})</b></div>
              <div className="sum-data-row"><span>Target Bank Account:</span> <b>{farmerProfile.bankName} (A/C: {farmerProfile.accountMasked})</b></div>
            </div>

            {/* Dynamic Progressive Payment Stage */}
            {(!activeFarmerBooking.paymentStatus || activeFarmerBooking.paymentStatus === "PENDING_STATE" || activeFarmerBooking.paymentStatus === "PENDING") && (
              <div className="profile-verified-box mt-3 text-left" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Clock size={20} className="teal-text" />
                  <h4 style={{ color: "var(--ink)", margin: 0 }}>Current Status: Pending at State Level</h4>
                </div>
                <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", margin: "4px 0 12px" }}>
                  Physical weighment and J-Form generation have been completed at <b>{activeFarmerBooking.centreName}</b>. The bill has been queued for audit and batch authorization by the State Directorate of Agriculture Treasury.
                </p>

                <div className="stepper-sub-stages mt-2" style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                  <span style={{ color: "var(--primary)", fontWeight: "700" }}>✓ J-Form Issued</span>
                  <span style={{ color: "#94a3b8" }}>➔</span>
                  <span style={{ color: "var(--primary)", fontWeight: "700" }}>● State Treasury Audit</span>
                  <span style={{ color: "#94a3b8" }}>➔</span>
                  <span style={{ color: "#94a3b8" }}>○ Bank Credit</span>
                </div>
              </div>
            )}

            {activeFarmerBooking.paymentStatus === "PAYMENT_INITIATED" && (
              <div className="profile-verified-box mt-3 text-left" style={{ background: "#f0fdfa", border: "1px solid #ccfbf1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <RefreshCw size={20} className="teal-text animate-spin" />
                  <h4 style={{ color: "var(--primary-dark)", margin: 0 }}>Current Status: Payment Initiated</h4>
                </div>
                <p style={{ fontSize: "13px", color: "#334155", margin: "4px 0 12px" }}>
                  Treasury sanction approved. PFMS Direct Benefit Transfer batch has been dispatched for electronic clearing.
                </p>

                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #ccfbf1", fontSize: "13px" }}>
                  <div className="sum-data-row"><span>PFMS Sanction Ref:</span> <b>{activeFarmerBooking.paymentRef || "PFMS-2026-DBT-8839201"}</b></div>
                  <div className="sum-data-row"><span>Sanction Date:</span> <b>{activeFarmerBooking.paymentDate || "Today"}</b></div>
                  <div className="sum-data-row"><span>Dispatched Amount:</span> <b className="teal-text">₹{(activeFarmerBooking.netPayableAmount || 0).toLocaleString()}.00</b></div>
                  <div className="sum-data-row"><span>NPCI / RBI Clearance:</span> <b className="teal-text">In Progress (Expected 24-48 hrs)</b></div>
                </div>
              </div>
            )}

            {activeFarmerBooking.paymentStatus === "PAYMENT_COMPLETED" && (
              <div className="profile-verified-box mt-3 text-left" style={{ background: "#f0fdfa", border: "1.5px solid #a7f3d0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <CheckCircle2 size={22} className="text-success" />
                  <h4 style={{ color: "#15803d", margin: 0 }}>Current Status: Payment Completed & Credited</h4>
                </div>
                <p style={{ fontSize: "13px", color: "#166534", margin: "4px 0 12px" }}>
                  Amount has been successfully credited directly to your Aadhaar-seeded bank account via PFMS Direct Benefit Transfer.
                </p>

                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #a7f3d0", fontSize: "13px" }}>
                  <div className="sum-data-row"><span>Bank Confirmation UTR:</span> <b>{activeFarmerBooking.bankUtr || "UTR-SBIN-2026-9938201"}</b></div>
                  <div className="sum-data-row"><span>Credit Timestamp:</span> <b>{activeFarmerBooking.paymentDate || "Today"}, 11:32 AM</b></div>
                  <div className="sum-data-row"><span>Credited Amount:</span> <b className="text-success" style={{ fontSize: "16px" }}>₹{(activeFarmerBooking.netPayableAmount || 0).toLocaleString()}.00</b></div>
                  <div className="sum-data-row"><span>Transaction Status:</span> <b className="status-pill checked_in">● SUCCESS (NEFT/PFMS)</b></div>
                </div>
              </div>
            )}

            {/* Interactive Status Inquirer Button */}
            <div className="modal-actions-row mt-4">
              {activeFarmerBooking.paymentStatus !== "PAYMENT_COMPLETED" ? (
                <>
                  <button className="btn-dash-outline btn-modal-half" onClick={() => setShowPaymentModal(false)}>
                    Close
                  </button>
                  <button 
                    className="btn-dash-primary btn-modal-half" 
                    onClick={handleCheckPaymentStatus}
                    disabled={isCheckingPayment}
                  >
                    {isCheckingPayment ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Querying PFMS Gateway...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} />
                        <span>Check Current Status</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button className="btn-dash-primary w-full" onClick={() => setShowPaymentModal(false)}>
                  Close Tracker
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
              <h3>Booking Details</h3>
              <button className="close-btn" onClick={() => setViewBookingDetails(null)}><X size={18} /></button>
            </div>

            <div className="profile-verified-box text-left mt-2">
              <div className="sum-data-row"><span>Booking ID:</span> <b>{viewBookingDetails.id}</b></div>
              <div className="sum-data-row"><span>Crop:</span> <b>{viewBookingDetails.crop}</b></div>
              <div className="sum-data-row"><span>Centre:</span> <b>{viewBookingDetails.centreName}</b></div>
              <div className="sum-data-row"><span>Date & Slot:</span> <b>{viewBookingDetails.date} ({viewBookingDetails.slotTime})</b></div>
              <div className="sum-data-row"><span>Status:</span> <b className="text-success">{viewBookingDetails.status}</b></div>
            </div>

            {viewBookingDetails.status !== "CANCELLED" && (
              <div className="qr-centered-container mt-3">
                <DynamicQRCode 
                  value={viewBookingDetails.id} 
                  payloadData={viewBookingDetails} 
                  size={140} 
                  title={`Token #${viewBookingDetails.id}`}
                />
                <small className="qr-label-sub">Official Digital Mandi Token ID: {viewBookingDetails.id}</small>
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
                <small style={{ color: "#64748b" }}>Live Mandi & DBT Updates</small>
              </div>
              <button className="close-btn" onClick={handleCloseWebDrawer}>
                <X size={18} />
              </button>
            </div>

            <div className="web-drawer-body mt-3">
              <div className="alert-item-card">
                <div className="alert-badge-row">
                  <span className="badge-info-tag">System Notification</span>
                  <small>Today</small>
                </div>
                <h4 style={{ margin: "6px 0 2px" }}>Mandi Procurement Active</h4>
                <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0" }}>
                  Rabi 2026 grain procurement is active across all authorized Krishi Upaj Mandis. You can book slots for Wheat, Mustard, and Gram.
                </p>
              </div>

              <div className="alert-item-card mt-2">
                <div className="alert-badge-row">
                  <span className="badge-verified-tag">AgriStack Verified</span>
                  <small>Cadastre</small>
                </div>
                <h4 style={{ margin: "6px 0 2px" }}>Land Record Registry Synchronized</h4>
                <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0" }}>
                  Your land holdings ({landParcels.length} verified parcels) are synced with the State Revenue Department for dynamic grain quota allocation.
                </p>
              </div>

              <div className="alert-item-card mt-2">
                <div className="alert-badge-row">
                  <span className="badge-verified-tag">Aadhaar Linked</span>
                  <small>AgriStack</small>
                </div>
                <h4 style={{ margin: "6px 0 2px" }}>Direct Benefit Transfer Ready</h4>
                <p style={{ fontSize: "13px", color: "#475569", margin: "2px 0" }}>
                  Your bank account ({farmerProfile.bankName} - {farmerProfile.accountMasked}) is seeded for PFMS DBT disbursements.
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
