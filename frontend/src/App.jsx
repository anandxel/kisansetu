import React, { useState, useEffect, useCallback } from "react";
import { 
  apiFetchCentres, 
  apiCreateCentre,
  apiFetchBookings, 
  apiCreateBooking, 
  apiUpdateBookingStatus,
  apiFetchFarmerLands,
  apiSyncAgriStackLands,
  apiSubmitLandParcel, 
  apiVerifyLandParcel, 
  apiRegisterFarmer 
} from "./api";
import { useRealtime } from "./useRealtime";
import { LandingPage } from "./components/LandingPage";
import { FarmerPortal } from "./components/FarmerPortal";
import { StateAdminPortal } from "./components/StateAdminPortal";
import { CentreAdminPortal } from "./components/CentreAdminPortal";
import { CheckInPortal } from "./components/CheckInPortal";
import { QualityPortal } from "./components/QualityPortal";
import { WeighingPortal } from "./components/WeighingPortal";
import { DisplayBoard } from "./components/DisplayBoard";
import "./styles.css";

export function App() {
  // Safe helper for reading localStorage JSON
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("kks_user");
      if (!saved || saved === "undefined" || saved === "null") return null;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        if (!parsed.role) {
          parsed.role = parsed.officialId ? "administrator" : "farmer";
        }
        return parsed;
      }
      return null;
    } catch (err) {
      console.warn("Failed to parse saved user from localStorage:", err);
      return null;
    }
  });

  const [currentLang, setCurrentLang] = useState(() => {
    try {
      return localStorage.getItem("kks_lang") || "en";
    } catch (e) {
      return "en";
    }
  });

  const [isDisplayBoardOpen, setIsDisplayBoardOpen] = useState(false);

  // Live Database State (Zero Mock Data, Safe initial array fallback)
  const [centres, setCentres] = useState(() => {
    try {
      const saved = localStorage.getItem("kks_centres");
      if (saved && saved !== "undefined" && saved !== "null") {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { id: "C001", name: "Kherli Krishi Upaj Mandi", district: "Alwar", state: "Rajasthan", distance: "4.2 km", dailyCapacityTonnes: 50, reservedTonnes: 38, crop: "Wheat", mspRatePerQtl: 2425, officerName: "Rajesh Sharma", phone: "+91 98290 11223" },
      { id: "C002", name: "Mahwa Procurement Hub", district: "Dausa", state: "Rajasthan", distance: "9.8 km", dailyCapacityTonnes: 45, reservedTonnes: 29, crop: "Wheat", mspRatePerQtl: 2425, officerName: "Vikram Meena", phone: "+91 98290 44556" },
      { id: "C003", name: "Mandawar Grain Center", district: "Dausa", state: "Rajasthan", distance: "13.4 km", dailyCapacityTonnes: 60, reservedTonnes: 52, crop: "Mustard", mspRatePerQtl: 5650, officerName: "Anil Gurjar", phone: "+91 98290 77889" }
    ];
  });
  const [bookings, setBookings] = useState([]);
  const [landParcels, setLandParcels] = useState([]);

  // Real-Time Event Dispatcher for live WebSocket synchronization across all portals
  const handleRealtimeEvent = useCallback((event) => {
    if (!event || !event.type) return;
    const { type, payload } = event;

    switch (type) {
      case "BOOKING_CREATED":
        setBookings(prev => {
          if (prev.some(b => b.id === payload.id)) return prev;
          if (payload.centreId && payload.expectedTonnes) {
            setCentres(cPrev => cPrev.map(c => 
              c.id === payload.centreId 
                ? { ...c, reservedTonnes: (c.reservedTonnes || 0) + Number(payload.expectedTonnes) }
                : c
            ));
          }
          return [payload, ...prev];
        });
        break;

      case "BOOKING_UPDATED":
        setBookings(prev => prev.map(b => {
          if (b.id === payload.id) {
            return {
              ...b,
              ...payload,
              status: payload.status || b.status,
              paymentStatus: payload.paymentStatus !== undefined ? payload.paymentStatus : b.paymentStatus,
              checkInTime: payload.checkInTime !== undefined ? payload.checkInTime : b.checkInTime,
              qualityResult: payload.qualityResult !== undefined ? payload.qualityResult : b.qualityResult,
              actualWeightTonnes: payload.actualWeightTonnes !== undefined ? payload.actualWeightTonnes : b.actualWeightTonnes,
              netPayableAmount: payload.netPayableAmount !== undefined ? payload.netPayableAmount : b.netPayableAmount,
              paymentRef: payload.paymentRef !== undefined ? payload.paymentRef : b.paymentRef,
              bankUtr: payload.bankUtr !== undefined ? payload.bankUtr : b.bankUtr,
              paymentDate: payload.paymentDate !== undefined ? payload.paymentDate : b.paymentDate
            };
          }
          return b;
        }));
        break;

      case "CENTRE_CAPACITY_UPDATED":
        setCentres(prev => prev.map(c => {
          if (c.id === payload.id) {
            return {
              ...c,
              dailyCapacityTonnes: payload.dailyCapacityTonnes !== undefined ? payload.dailyCapacityTonnes : c.dailyCapacityTonnes,
              reservedTonnes: payload.reservedTonnes !== undefined ? payload.reservedTonnes : c.reservedTonnes
            };
          }
          return c;
        }));
        break;

      case "CENTRE_CREATED":
        setCentres(prev => {
          if (prev.some(c => c.id === payload.id)) return prev;
          return [...prev, payload];
        });
        break;

      case "LAND_SUBMITTED":
        setLandParcels(prev => {
          if (prev.some(l => l.id === payload.id)) return prev;
          return [payload, ...prev];
        });
        break;

      case "LAND_VERIFIED":
        setLandParcels(prev => prev.map(l => l.id === payload.id ? { ...l, verified: payload.verified } : l));
        break;

      default:
        break;
    }
  }, []);

  const { isConnected: isWsConnected } = useRealtime({ onEvent: handleRealtimeEvent });

  // Fetch Centres & Bookings on Mount directly from Backend API
  useEffect(() => {
    async function loadInitialData() {
      try {
        const cRes = await apiFetchCentres();
        if (cRes?.success && Array.isArray(cRes.centres)) {
          setCentres(cRes.centres.map(c => ({
            id: c.id,
            name: c.name,
            district: c.district,
            state: c.state,
            distance: c.distance || "4.5 km",
            dailyCapacityTonnes: Number(c.daily_capacity_tonnes || c.dailyCapacityTonnes || 50),
            reservedTonnes: Number(c.reserved_tonnes || c.reservedTonnes || 0),
            crop: c.crop || "Wheat",
            mspRatePerQtl: Number(c.msp_rate_per_qtl || c.mspRatePerQtl || 2425),
            officerName: c.officer_name || c.officerName || "Mandi Officer",
            phone: c.phone || "+91 98290 00000"
          })));
        }

        const bRes = await apiFetchBookings();
        if (bRes?.success && Array.isArray(bRes.bookings)) {
          setBookings(bRes.bookings.map(b => {
            const pref = b.paymentRef || b.payment_ref;
            let bankUtr = b.bankUtr || b.bank_utr;
            let paymentStatus = b.paymentStatus || b.payment_status;

            if (pref && typeof pref === "string" && pref.includes("|")) {
              const parts = pref.split("|");
              bankUtr = parts[1];
              paymentStatus = "PAYMENT_COMPLETED";
            } else if (pref && typeof pref === "string" && pref.startsWith("UTR")) {
              bankUtr = pref;
              paymentStatus = "PAYMENT_COMPLETED";
            } else if (pref && typeof pref === "string" && pref.startsWith("PFMS")) {
              if (!paymentStatus) paymentStatus = "PAYMENT_INITIATED";
            } else if (b.status === "PROCUREMENT_COMPLETED" || b.net_payable_amount || b.netPayableAmount) {
              if (!paymentStatus) paymentStatus = "PENDING_STATE";
            }

            return {
              id: b.id,
              farmerId: b.farmer_id || b.farmerId,
              farmerName: b.farmer_name || b.farmerName,
              mobile: b.mobile,
              aadhaarMasked: b.aadhaar_masked || b.aadhaarMasked,
              crop: b.crop,
              season: b.season,
              centreId: b.centre_id || b.centreId,
              centreName: b.centre_name || b.centreName,
              khasraNo: b.khasra_no || b.khasraNo,
              areaHectares: Number(b.area_hectares || b.areaHectares || 1.5),
              expectedTonnes: Number(b.expected_tonnes || b.expectedTonnes || 5),
              date: b.date,
              slotTime: b.slot_time || b.slotTime,
              status: b.status,
              checkInTime: b.check_in_time || b.checkInTime,
              qualityResult: b.quality_result || b.qualityResult,
              actualWeightTonnes: b.actual_weight_tonnes !== null && b.actual_weight_tonnes !== undefined ? Number(b.actual_weight_tonnes) : (b.actualWeightTonnes !== undefined ? b.actualWeightTonnes : null),
              netPayableAmount: b.net_payable_amount !== null && b.net_payable_amount !== undefined ? Number(b.net_payable_amount) : (b.netPayableAmount !== undefined ? b.netPayableAmount : null),
              paymentRef: pref && typeof pref === "string" && pref.includes("|") ? pref.split("|")[0] : pref,
              bankUtr: bankUtr,
              paymentStatus: paymentStatus,
              paymentDate: b.payment_date || b.paymentDate
            };
          }));
        }
      } catch (err) {
        console.error("Initial load error:", err);
      }
    }
    loadInitialData();
  }, []);

  // Fetch Farmer Land Parcels when logged in as Farmer
  useEffect(() => {
    async function loadFarmerLands() {
      if (currentUser && currentUser.role === "farmer" && currentUser.farmerId) {
        try {
          const lRes = await apiFetchFarmerLands(currentUser.farmerId);
          if (lRes?.success && Array.isArray(lRes.lands) && lRes.lands.length > 0) {
            setLandParcels(lRes.lands.map(l => ({
              id: l.id,
              farmerId: l.farmer_id || l.farmerId,
              state: l.state,
              district: l.district,
              tehsil: l.tehsil,
              village: l.village,
              khasraNo: l.khasra_no || l.khasraNo,
              areaHectare: Number(l.area_hectare || l.areaHectare),
              soilType: l.soil_type || l.soilType,
              crop: l.crop || "Wheat",
              verified: Boolean(l.verified),
              source: l.source || "State Land Record"
            })));
          } else {
            setLandParcels([]);
          }
        } catch (err) {
          console.error("Farmer lands load error:", err);
          setLandParcels([]);
        }
      }
    }
    loadFarmerLands();
  }, [currentUser]);

  // Sync to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("kks_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("kks_user");
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("kks_lang", currentLang);
  }, [currentLang]);

  // Auth Handlers
  const handleLoginSuccess = (userObj) => {
    if (!userObj) return;
    const normalized = {
      ...userObj,
      role: userObj.role || (userObj.officialId ? (userObj.role || "administrator") : "farmer")
    };
    setCurrentUser(normalized);
    try {
      localStorage.setItem("kks_user", JSON.stringify(normalized));
    } catch (e) {}
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("kks_user");
    } catch (e) {}
    setCurrentUser(null);
    setLandParcels([]);
  };

  // Farmer Actions
  const handleBookSlot = async (bookingData) => {
    setBookings(prev => {
      if (prev.some(b => b.id === bookingData.id)) return prev;
      return [bookingData, ...prev];
    });

    setCentres(prev => prev.map(c => {
      if (c.id === bookingData.centreId) {
        return { ...c, reservedTonnes: (c.reservedTonnes || 0) + Number(bookingData.expectedTonnes || 0) };
      }
      return c;
    }));

    try {
      await apiCreateBooking(bookingData);
    } catch (err) {
      console.error("Booking error:", err);
    }
  };

  const handleCancelBooking = (bookingId) => {
    const bookingToCancel = bookings.find(b => b.id === bookingId);
    apiUpdateBookingStatus(bookingId, { status: "CANCELLED" });
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "CANCELLED" } : b));

    setCentres(prev => prev.map(c => {
      if (bookingToCancel && c.id === bookingToCancel.centreId) {
        return { ...c, reservedTonnes: Math.max(0, c.reservedTonnes - bookingToCancel.expectedTonnes) };
      }
      return c;
    }));
  };

  const handleSyncAgriStack = async () => {
    const aadhaarClean = currentUser?.aadhaar || (currentUser?.aadhaarMasked ? currentUser.aadhaarMasked.replace(/\D/g, "") : "542188904829");
    const res = await apiSyncAgriStackLands(aadhaarClean);
    if (res?.success && Array.isArray(res.lands)) {
      const synced = res.lands.map((l, idx) => ({
        id: `L-${currentUser?.farmerId || "F101"}-AS-${idx + 1}`,
        farmerId: currentUser?.farmerId || "F101",
        state: l.state || currentUser?.state || "Rajasthan",
        district: l.district || currentUser?.district || "Alwar",
        tehsil: l.tehsil || currentUser?.tehsil || "Kherli",
        village: l.village || currentUser?.village || "Kherli Kalan",
        khasraNo: l.khasraNo,
        areaHectare: l.areaHectare,
        soilType: l.soilType,
        crop: l.crop || "Wheat",
        irrigation: l.irrigation || "Canal / Tube-well",
        ownership: l.ownership || "Private / Khatedari",
        verified: true,
        source: "AgriStack"
      }));

      // Upsert synced lands into Supabase
      for (const p of synced) {
        await apiSubmitLandParcel(p);
      }

      // Re-fetch all lands from Supabase so both AgriStack + Manual lands are accurately merged
      const lRes = await apiFetchFarmerLands(currentUser?.farmerId);
      if (lRes?.success && Array.isArray(lRes.lands) && lRes.lands.length > 0) {
        setLandParcels(lRes.lands.map(l => ({
          id: l.id,
          farmerId: l.farmer_id || l.farmerId,
          state: l.state,
          district: l.district,
          tehsil: l.tehsil,
          village: l.village,
          khasraNo: l.khasra_no || l.khasraNo,
          areaHectare: Number(l.area_hectare || l.areaHectare),
          soilType: l.soil_type || l.soilType,
          crop: l.crop || "Wheat",
          verified: Boolean(l.verified),
          source: l.source
        })));
      } else {
        setLandParcels(prev => {
          const manualOnly = prev.filter(p => p.source !== "AgriStack");
          return [...synced, ...manualOnly];
        });
      }
    }
  };

  const handleAddBhulekhLand = async (newParcel) => {
    const formatted = {
      ...newParcel,
      verified: true,
      source: "State Land Record"
    };
    await apiSubmitLandParcel(formatted);
    setLandParcels(prev => [formatted, ...prev.filter(p => p.id !== formatted.id)]);
  };

  // State Admin Actions
  const handleApproveLand = async (landId) => {
    await apiVerifyLandParcel(landId, true);
    setLandParcels(prev => prev.map(l => l.id === landId ? { ...l, verified: true } : l));
  };

  const handleRejectLand = (landId) => {
    setLandParcels(prev => prev.filter(l => l.id !== landId));
  };

  const handleCreateCentre = async (newCentre) => {
    await apiCreateCentre(newCentre);
    setCentres(prev => [...prev, newCentre]);
  };

  // Centre Admin Actions
  const handleUpdateCapacity = (centreId, newCapacity) => {
    setCentres(prev => prev.map(c => c.id === centreId ? { ...c, dailyCapacityTonnes: newCapacity } : c));
  };

  const handleAssistedBooking = (newBooking) => {
    handleBookSlot(newBooking);
  };

  // Check-in Officer Actions
  const handleCheckInFarmer = (bookingId) => {
    const checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    apiUpdateBookingStatus(bookingId, { status: "QUALITY_WAITING", checkInTime });
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return { 
          ...b, 
          status: "QUALITY_WAITING", 
          checkInTime 
        };
      }
      return b;
    }));
  };

  // Quality Officer Actions
  const handlePassQuality = (bookingId, qualityResult) => {
    apiUpdateBookingStatus(bookingId, { status: "WEIGHING_PROCESS", qualityResult });
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return { 
          ...b, 
          status: "WEIGHING_PROCESS", 
          qualityResult 
        };
      }
      return b;
    }));
  };

  const handleFailQuality = (bookingId, qualityResult) => {
    const booking = bookings.find(b => b.id === bookingId);
    apiUpdateBookingStatus(bookingId, { status: "QUALITY_FAILED", qualityResult });
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return { 
          ...b, 
          status: "QUALITY_FAILED", 
          qualityResult 
        };
      }
      return b;
    }));

    if (booking) {
      setCentres(prev => prev.map(c => {
        if (c.id === booking.centreId) {
          return { ...c, reservedTonnes: Math.max(0, c.reservedTonnes - booking.expectedTonnes) };
        }
        return c;
      }));
    }
  };

  // Weighing Officer Actions
  const handleCompleteWeighing = (bookingId, actualWeightTonnes, netPayableAmount, paymentRef) => {
    const paymentDate = new Date().toISOString().split("T")[0];
    apiUpdateBookingStatus(bookingId, { 
      status: "PROCUREMENT_COMPLETED", 
      paymentStatus: "PENDING_STATE",
      actualWeightTonnes, 
      netPayableAmount, 
      paymentRef: null, // Initialized as pending at state level 
      paymentDate 
    });
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return { 
          ...b, 
          status: "PROCUREMENT_COMPLETED", 
          paymentStatus: "PENDING_STATE",
          actualWeightTonnes, 
          netPayableAmount, 
          paymentRef: null,
          paymentDate 
        };
      }
      return b;
    }));
  };

  // Farmer Payment Status Transition & DB Handshake
  const handleUpdatePaymentStatus = (bookingId, paymentStatus, paymentRef, bankUtr) => {
    const paymentDate = new Date().toISOString().split("T")[0];
    const updates = {
      paymentStatus,
      paymentDate
    };
    if (paymentRef) updates.paymentRef = paymentRef;
    if (bankUtr) updates.bankUtr = bankUtr;

    apiUpdateBookingStatus(bookingId, updates);
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          paymentStatus,
          paymentDate,
          ...(paymentRef ? { paymentRef } : {}),
          ...(bankUtr ? { bankUtr } : {})
        };
      }
      return b;
    }));
  };

  // Render Display Board
  if (isDisplayBoardOpen || currentUser?.role === "display_board") {
    return (
      <div className="app-root">
        <DisplayBoard 
          centres={centres} 
          bookings={bookings} 
          onClose={() => {
            setIsDisplayBoardOpen(false);
            if (currentUser?.role === "display_board") setCurrentUser(null);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="app-root">
      {!currentUser ? (
        <LandingPage 
          currentLang={currentLang}
          onLangChange={setCurrentLang}
          onLoginSuccess={handleLoginSuccess}
          centres={centres}
        />
      ) : (
        <>
          {(currentUser.role === "farmer" || !["administrator", "centre_admin", "checkin_officer", "quality_officer", "weighing_officer"].includes(currentUser.role)) && (
            <FarmerPortal 
              user={currentUser}
              bookings={bookings}
              centres={centres}
              landParcels={landParcels}
              onBookSlot={handleBookSlot}
              onCancelBooking={handleCancelBooking}
              onSyncAgriStack={handleSyncAgriStack}
              onAddBhulekhLand={handleAddBhulekhLand}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
              onLogout={handleLogout}
              currentLang={currentLang}
              onLangChange={setCurrentLang}
            />
          )}

          {(currentUser.role === "administrator" || currentUser.role === "state_admin") && (
            <StateAdminPortal 
              user={currentUser}
              centres={centres}
              bookings={bookings}
              onCreateCentre={handleCreateCentre}
              onLogout={handleLogout}
              currentLang={currentLang}
              onLangChange={setCurrentLang}
            />
          )}

          {currentUser.role === "centre_admin" && (
            <CentreAdminPortal 
              user={currentUser}
              centres={centres}
              bookings={bookings}
              onUpdateCapacity={handleUpdateCapacity}
              onAssistedBooking={handleAssistedBooking}
              onLogout={handleLogout}
              onOpenDisplayBoard={() => setIsDisplayBoardOpen(true)}
              currentLang={currentLang}
              onLangChange={setCurrentLang}
            />
          )}

          {currentUser.role === "checkin_officer" && (
            <CheckInPortal 
              user={currentUser}
              bookings={bookings}
              centres={centres}
              onCheckInFarmer={handleCheckInFarmer}
              onLogout={handleLogout}
            />
          )}

          {currentUser.role === "quality_officer" && (
            <QualityPortal 
              user={currentUser}
              bookings={bookings}
              centres={centres}
              onPassQuality={handlePassQuality}
              onFailQuality={handleFailQuality}
              onLogout={handleLogout}
            />
          )}

          {currentUser.role === "weighing_officer" && (
            <WeighingPortal 
              user={currentUser}
              bookings={bookings}
              centres={centres}
              onCompleteWeighing={handleCompleteWeighing}
              onLogout={handleLogout}
            />
          )}
        </>
      )}
    </div>
  );
}
export default App;
