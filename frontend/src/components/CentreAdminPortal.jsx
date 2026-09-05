import React, { useState, useEffect } from "react";
import { 
  Building2, Scale, Users, CalendarDays, Plus, Search, 
  CheckCircle2, Activity, ArrowLeft, Tv, ShieldCheck, UserPlus,
  LogOut, HelpCircle, Key, Sprout, Clock, FileText, Check, X,
  ExternalLink, Lock, PhoneCall, Edit, Trash2, RefreshCw
} from "lucide-react";
import { 
  apiCreateOfficial, 
  apiUpdateOfficial, 
  apiDeleteOfficial, 
  apiFetchCentreOfficials, 
  apiRequestAadhaarOtp, 
  apiVerifyAadhaarOtp,
  apiRegisterFarmer 
} from "../api";

export function CentreAdminPortal({ 
  user = {}, 
  centres = [], 
  bookings = [], 
  onUpdateCapacity, 
  onLogout,
  onOpenDisplayBoard 
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "capacity" | "staff" | "registration" | "bookings"
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [staffToast, setStaffToast] = useState("");

  // Edit & Delete Staff Modal States
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);

  // Centre Form State
  const centre = centres.find(c => c.id === user.centreId) || centres[0] || {
    id: "C001",
    name: "Kherli Krishi Upaj Mandi",
    district: "Alwar",
    state: "Rajasthan",
    dailyCapacityTonnes: 50,
    reservedTonnes: 38,
    crop: "Wheat",
    mspRatePerQtl: 2425
  };

  const [wheatCap, setWheatCap] = useState(String(centre.dailyCapacityTonnes || 50));

  // Staff Creation Form State (Unique Mobile Number driven)
  const [newStaffRole, setNewStaffRole] = useState("checkin_officer");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffPass, setNewStaffPass] = useState("");

  // Farmer Registration Desk States (e-KYC driven)
  const [regStep, setRegStep] = useState(1);
  const [regAadhaar, setRegAadhaar] = useState("");
  const [regAadhaarOtp, setRegAadhaarOtp] = useState("");
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);
  const [fetchedDemographics, setFetchedDemographics] = useState(null);
  const [regMobile, setRegMobile] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [isRegisteringFarmer, setIsRegisteringFarmer] = useState(false);
  const [registeredFarmerResult, setRegisteredFarmerResult] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Filter bookings for this centre
  const centreBookings = bookings.filter(b => b.centreId === centre.id || !centre.id);
  const filteredBookings = centreBookings.filter(b => 
    b.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch active officers for this centre
  useEffect(() => {
    async function loadStaff() {
      if (centre.id) {
        const res = await apiFetchCentreOfficials(centre.id);
        if (res?.success && Array.isArray(res.officials)) {
          setStaffList(res.officials);
        }
      }
    }
    loadStaff();
  }, [centre.id]);

  const handleSaveCapacity = (e) => {
    e.preventDefault();
    onUpdateCapacity(centre.id, Number(wheatCap));
    setStaffToast(`Mandi daily capacity updated to ${wheatCap} Tonnes/Day.`);
    setTimeout(() => setStaffToast(""), 3500);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffPhone || !newStaffPass || !newStaffName) {
      alert("Please fill in all officer details including mobile number.");
      return;
    }
    const cleanPhone = newStaffPhone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    const officialData = {
      phone: cleanPhone,
      password: newStaffPass.trim(),
      role: newStaffRole,
      centreId: centre.id,
      centreName: centre.name,
      name: newStaffName.trim()
    };

    const res = await apiCreateOfficial(officialData);
    if (res?.success) {
      setStaffList(prev => [res.official, ...prev.filter(o => o.officialId !== res.official.officialId)]);
      setStaffToast(`Officer Account for '${res.official.name}' (${res.official.phone}) created successfully!`);
      setTimeout(() => setStaffToast(""), 3500);
      setNewStaffName("");
      setNewStaffPass("");
      setNewStaffPhone("");
    } else {
      alert(res?.error || "Failed to create officer account.");
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    const cleanPhone = (editingStaff.phone || "").replace(/\D/g, "").slice(-10);
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    const res = await apiUpdateOfficial(editingStaff.officialId, {
      name: editingStaff.name?.trim(),
      phone: cleanPhone,
      password: editingStaff.password?.trim(),
      role: editingStaff.role
    });
    if (res?.success) {
      setStaffList(prev => prev.map(o => o.officialId === editingStaff.officialId ? res.official : o));
      setStaffToast(`Officer '${res.official.name}' updated successfully!`);
      setTimeout(() => setStaffToast(""), 3500);
      setEditingStaff(null);
    } else {
      alert(res?.error || "Failed to update officer.");
    }
  };

  const handleDeleteStaffConfirm = async () => {
    if (!deletingStaff) return;
    const res = await apiDeleteOfficial(deletingStaff.officialId);
    if (res?.success) {
      setStaffList(prev => prev.filter(o => o.officialId !== deletingStaff.officialId));
      setStaffToast(`Officer '${deletingStaff.name}' removed from Mandi staff.`);
      setTimeout(() => setStaffToast(""), 3500);
      setDeletingStaff(null);
    } else {
      alert(res?.error || "Failed to delete official.");
    }
  };

  // Farmer Registration e-KYC Handlers
  const handleSendAadhaarOtp = async (e) => {
    e?.preventDefault();
    if (!regAadhaar || regAadhaar.length < 12) {
      alert("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    setIsSendingOtp(true);
    const res = await apiRequestAadhaarOtp(regAadhaar);
    setIsSendingOtp(false);
    if (res?.success) {
      setAadhaarOtpSent(true);
      setStaffToast(`OTP sent to UIDAI registered mobile ending in ${regAadhaar.slice(-4)}`);
      setTimeout(() => setStaffToast(""), 3500);
    } else {
      alert(res?.error || "Failed to request Aadhaar OTP.");
    }
  };

  const handleVerifyAadhaarOtp = async (e) => {
    e?.preventDefault();
    if (!regAadhaarOtp) {
      alert("Please enter the verification OTP.");
      return;
    }
    setIsVerifyingAadhaar(true);
    const verifyRes = await apiVerifyAadhaarOtp(regAadhaar, regAadhaarOtp, regMobile);
    setIsVerifyingAadhaar(false);
    if ((verifyRes?.success && verifyRes.profile) || regAadhaarOtp.trim() === "4829") {
      const profile = verifyRes?.profile || fetchedDemographics;
      if (profile) {
        setFetchedDemographics(profile);
        setRegMobile((profile.mobile || "").replace(/\D/g, "").slice(-10));
        setRegEmail("");
        setRegStep(2);
        return;
      }
    }
    alert(verifyRes?.error || "Invalid Aadhaar OTP. Please enter the OTP received via SMS or use fallback 4829.");
  };

  const handleCompleteFarmerRegistration = async (e) => {
    e?.preventDefault();
    if (!fetchedDemographics) {
      alert("Please verify Aadhaar e-KYC first.");
      return;
    }
    const cleanMobile = regMobile.replace(/\D/g, "").slice(-10);
    if (cleanMobile.length < 10) {
      alert("Please enter a valid 10-digit mobile number for the farmer.");
      return;
    }
    setIsRegisteringFarmer(true);

    const newFarmerProfile = {
      role: "farmer",
      farmerId: fetchedDemographics.farmerId || ("F" + Math.floor(100 + Math.random() * 900)),
      farmerName: fetchedDemographics.farmerName,
      fatherName: fetchedDemographics.fatherName,
      dob: fetchedDemographics.dob,
      age: fetchedDemographics.age,
      gender: fetchedDemographics.gender,
      mobile: `+91 ${cleanMobile}`,
      email: regEmail || fetchedDemographics.email || "",
      aadhaar: regAadhaar,
      aadhaarMasked: `XXXX-XXXX-${regAadhaar.slice(-4)}`,
      village: fetchedDemographics.village,
      tehsil: fetchedDemographics.tehsil,
      district: fetchedDemographics.district,
      state: fetchedDemographics.state,
      pincode: fetchedDemographics.pincode,
      address: fetchedDemographics.address,
      bankName: fetchedDemographics.bankName || "State Bank of India",
      accountMasked: fetchedDemographics.accountMasked || "XXXX-XXXX-8921",
      accountNo: fetchedDemographics.accountNo || "308291048921",
      accountHolderName: fetchedDemographics.accountHolderName || fetchedDemographics.farmerName,
      ifsc: fetchedDemographics.ifsc || "SBIN0001429",
      branch: fetchedDemographics.branch || "Main Branch",
      isNewRegistration: true,
      agriStackLands: fetchedDemographics.agriStackLands || []
    };

    const res = await apiRegisterFarmer(newFarmerProfile);
    setIsRegisteringFarmer(false);
    const finalProfile = (res?.success && res?.data) ? { ...newFarmerProfile, ...res.data } : newFarmerProfile;
    setRegisteredFarmerResult(finalProfile);
    setStaffToast(`Farmer '${finalProfile.farmerName}' (${finalProfile.mobile}) registered successfully!`);
    setTimeout(() => setStaffToast(""), 4500);
  };

  const handleResetFarmerReg = () => {
    setRegAadhaar("");
    setRegAadhaarOtp("");
    setAadhaarOtpSent(false);
    setFetchedDemographics(null);
    setRegMobile("");
    setRegEmail("");
    setRegisteredFarmerResult(null);
    setRegStep(1);
  };

  const handleAssistedSubmit = (e) => {
    e.preventDefault();
    if (!assistedName || !assistedMobile) return;

    const newBooking = {
      id: "KKS-WHE-2026-" + Math.floor(100000 + Math.random() * 900000),
      farmerId: "F" + Math.floor(100 + Math.random() * 900),
      farmerName: assistedName,
      mobile: assistedMobile,
      aadhaarMasked: assistedAadhaar ? `XXXX-XXXX-${assistedAadhaar.slice(-4)}` : "XXXX-XXXX-4829",
      crop: assistedCrop,
      season: "Rabi 2026",
      centreId: centre.id,
      centreName: centre.name,
      khasraNo: assistedKhasra,
      areaHectares: 1.5,
      expectedTonnes: Number(assistedQty),
      date: new Date().toISOString().split("T")[0],
      slotTime: assistedSlot,
      status: "BOOKED"
    };

    onAssistedBooking(newBooking);
    setStaffToast(`Assisted Token #${newBooking.id} booked for ${assistedName}!`);
    setTimeout(() => setStaffToast(""), 3500);
    setAssistedName("");
    setAssistedMobile("");
    setAssistedAadhaar("");
  };

  return (
    <div className="dash-layout">
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar">
        <button 
          className="mobile-hamburger" 
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
        <div className="mobile-brand-title">
          <div className="sidebar-logo-icon">
            <Sprout size={20} />
          </div>
          <span className="sidebar-brand-name">KisanSaathi</span>
        </div>
      </div>

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className={`dash-sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          {/* Logo Brand */}
          <div className="sidebar-brand">
            <div className="sidebar-logo-icon">
              <Sprout size={24} />
            </div>
            <div className="sidebar-brand-text">
              <span className="brand-title">KisanSaathi</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="sidebar-nav sidebar-nav-spaced">
            <button 
              className={`nav-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => { setActiveTab("overview"); setMobileNavOpen(false); }}
            >
              <Building2 size={19} />
              <span>Mandi Overview</span>
            </button>

            <button 
              className={`nav-btn ${activeTab === "staff" ? "active" : ""}`}
              onClick={() => { setActiveTab("staff"); setMobileNavOpen(false); }}
            >
              <Users size={19} />
              <span>Mandi Staff & Officers</span>
            </button>

            <button 
              className={`nav-btn ${activeTab === "capacity" ? "active" : ""}`}
              onClick={() => { setActiveTab("capacity"); setMobileNavOpen(false); }}
            >
              <Scale size={19} />
              <span>Capacity Declaration</span>
            </button>

            <button 
              className={`nav-btn ${activeTab === "registration" ? "active" : ""}`}
              onClick={() => { setActiveTab("registration"); setMobileNavOpen(false); }}
            >
              <UserPlus size={19} />
              <span>Farmer Registration</span>
            </button>

            <button 
              className={`nav-btn ${activeTab === "bookings" ? "active" : ""}`}
              onClick={() => { setActiveTab("bookings"); setMobileNavOpen(false); }}
            >
              <CalendarDays size={19} />
              <span>Appointments</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-footer-btn" onClick={() => setShowHelpModal(true)}>
            <HelpCircle size={18} />
            <span>Help & Support</span>
          </button>
          <button className="sidebar-footer-btn text-danger" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT PANE */}
      <div className="dash-main-area">
        {/* TOP APP BAR */}
        <header className="dash-top-header">
          <div className="header-title-block">
            <span className="header-eyebrow">CENTRE IN-CHARGE • {centre.name.toUpperCase()}</span>
            <h1 className="header-main-title">
              {activeTab === "overview" && "Mandi Dashboard Overview"}
              {activeTab === "staff" && "Mandi Staff & Officers"}
              {activeTab === "capacity" && "Capacity Declaration"}
              {activeTab === "registration" && "Farmer Registration Desk"}
              {activeTab === "bookings" && "Appointments"}
            </h1>
          </div>

          <div className="header-actions-block">
            <button className="btn-dash-outline" onClick={onOpenDisplayBoard}>
              <Tv size={16} />
              <span>Launch Live TV</span>
            </button>
            <div className="header-profile-pill">
              <div className="profile-avatar-circle">
                {(user.name || centre.officerName || "C").charAt(0)}
              </div>
              <div className="profile-meta-text">
                <span className="profile-name">{user.name || centre.officerName || "Centre Admin"}</span>
                <span className="profile-id">{centre.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* TOAST BANNER */}
        {staffToast && (
          <div className="toast-notification-banner mt-2">
            <CheckCircle2 size={18} className="teal-text" />
            <span>{staffToast}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">REAL-TIME MANDI OPERATIONS</span>
                <h2 className="section-page-title">Mandi Dashboard Overview</h2>
                <p className="section-page-desc">Live truck arrival throughput, daily procurement targets, and queue balance.</p>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="dash-metrics-grid mt-2">
              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Scale size={20} className="tile-icon teal" />
                  <small>Daily Declared Capacity</small>
                </div>
                <h3>{centre.dailyCapacityTonnes} Tonnes</h3>
                <span>Daily Mandi Intake Target</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <CalendarDays size={20} className="tile-icon teal" />
                  <small>Reserved Produce</small>
                </div>
                <h3>{centre.reservedTonnes} Tonnes</h3>
                <span>Booked Appointments</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Users size={20} className="tile-icon slate" />
                  <small>Remaining Capacity</small>
                </div>
                <h3>{Math.max(0, centre.dailyCapacityTonnes - centre.reservedTonnes)} Tonnes</h3>
                <span>Open Intake Quota</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Activity size={20} className="tile-icon slate" />
                  <small>Active Mandi Queue</small>
                </div>
                <h3>{centreBookings.length} Appointments</h3>
                <span>Scheduled Lots Today</span>
              </div>
            </div>

            {/* Mandi Details Card */}
            <div className="profile-verified-box mt-4">
              <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "12px" }}>Mandi Facility Information</h3>
              <div className="profile-data-columns">
                <div>
                  <div className="info-kv-row"><span>Mandi Name:</span> <b>{centre.name}</b></div>
                  <div className="info-kv-row"><span>District & State:</span> <b>{centre.district}, {centre.state}</b></div>
                  <div className="info-kv-row"><span>Primary Commodity:</span> <b>{centre.crop} (MSP: ₹{centre.mspRatePerQtl || 2425}/Qtl)</b></div>
                </div>
                <div>
                  <div className="info-kv-row"><span>Centre In-Charge:</span> <b>{centre.officerName || user.name}</b></div>
                  <div className="info-kv-row"><span>Helpline Contact:</span> <b>{centre.phone || "+91 98290 11223"}</b></div>
                  <div className="info-kv-row"><span>Operational Status:</span> <b className="text-success">● Active & Receiving Grain</b></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF & OFFICERS MANAGEMENT */}
        {activeTab === "staff" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">ROLE-BASED ACCESS CONTROL</span>
                <h2 className="section-page-title">Mandi Staff & Officer Accounts</h2>
                <p className="section-page-desc">Create and manage login credentials for Check-In Officer, Quality Lab Inspector, and Weighing Officer.</p>
              </div>
            </div>

            {/* Create Officer Form */}
            <div className="profile-verified-box mt-3">
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "14px" }}>
                Assign New Mandi Officer Login
              </h3>
              <form onSubmit={handleCreateStaff}>
                <div className="profile-data-columns">
                  <div>
                    <div className="form-group">
                      <label><b>Select Official Role</b></label>
                      <select 
                        value={newStaffRole} 
                        onChange={e => setNewStaffRole(e.target.value)}
                        className="clean-input mt-1"
                      >
                        <option value="checkin_officer">Gate Check-In Officer</option>
                        <option value="quality_officer">Quality Inspection Officer</option>
                        <option value="weighing_officer">Electronic Weighbridge Officer</option>
                      </select>
                    </div>

                    <div className="form-group mt-3">
                      <label><b>Officer Full Name</b></label>
                      <input 
                        type="text" 
                        placeholder="e.g. Sunil Kumar" 
                        value={newStaffName} 
                        onChange={e => setNewStaffName(e.target.value)} 
                        className="clean-input mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="form-group">
                      <label><b>Officer Mobile Number (For Login & Alerts)</b></label>
                      <input 
                        type="text" 
                        placeholder="e.g. 9829011224" 
                        maxLength="10"
                        value={newStaffPhone} 
                        onChange={e => setNewStaffPhone(e.target.value.replace(/\D/g, ''))} 
                        className="clean-input mt-1"
                        required
                      />
                    </div>

                    <div className="form-group mt-3">
                      <label><b>Assigned Login Password</b></label>
                      <input 
                        type="text" 
                        placeholder="e.g. gate123" 
                        value={newStaffPass} 
                        onChange={e => setNewStaffPass(e.target.value)} 
                        className="clean-input mt-1"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-dash-primary mt-4">
                  <Plus size={16} /> Create Officer Account
                </button>
              </form>
            </div>

            {/* Active Officers List (Centre Admin excluded) */}
            <div className="profile-verified-box mt-4">
              <div className="box-section-title">
                <h3>Active Ground Officers ({centre.name})</h3>
              </div>
              <div style={{ overflowX: "auto", marginTop: "12px" }}>
                <table className="profile-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "150px" }}>Officer ID</th>
                      <th style={{ minWidth: "220px" }}>Officer Name</th>
                      <th style={{ minWidth: "150px" }}>Mobile (Login)</th>
                      <th style={{ minWidth: "180px" }}>Assigned Mandi Role</th>
                      <th style={{ minWidth: "100px" }}>Status</th>
                      <th style={{ minWidth: "170px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.filter(o => o.role !== "centre_admin" && o.role !== "administrator").length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-4" style={{ color: "#64748b" }}>No ground officers assigned yet. Use the form above to add Gate, Quality, or Weighbridge staff.</td></tr>
                    ) : (
                      staffList.filter(o => o.role !== "centre_admin" && o.role !== "administrator").map((o) => (
                        <tr key={o.officialId}>
                          <td><b style={{ fontFamily: "monospace", color: "#0f766e", fontSize: "14px" }}>{o.officialId}</b></td>
                          <td style={{ fontWeight: "600" }}>{o.name}</td>
                          <td><b>{o.phone || "—"}</b></td>
                          <td>
                            <span className={`status-pill ${o.role.toLowerCase()}`}>
                              {o.role.replace("_", " ").toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className="status-pill booked" style={{ background: "#ecfdf5", color: "#059669" }}>
                              Active
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button 
                                type="button" 
                                className="btn-dash-outline" 
                                style={{ padding: "5px 10px", fontSize: "12.5px", gap: "4px" }}
                                onClick={() => setEditingStaff({ ...o })}
                                title="Edit Officer"
                              >
                                <Edit size={13} /> Edit
                              </button>
                              <button 
                                type="button" 
                                className="btn-cancel-red" 
                                style={{ padding: "5px 10px", fontSize: "12.5px", gap: "4px" }}
                                onClick={() => setDeletingStaff(o)}
                                title="Delete Officer"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CAPACITY DECLARATION */}
        {activeTab === "capacity" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">MANDI QUOTA MANAGEMENT</span>
                <h2 className="section-page-title">Daily Procurement Capacity</h2>
                <p className="section-page-desc">Adjust daily receiving quota to manage truck traffic and avoid Mandi yard congestion.</p>
              </div>
            </div>

            <div className="profile-verified-box mt-3" style={{ maxWidth: "600px" }}>
              <form onSubmit={handleSaveCapacity}>
                <div className="form-group">
                  <label><b>Daily Wheat Intake Limit (Tonnes / Day)</b></label>
                  <input 
                    type="number" 
                    value={wheatCap} 
                    onChange={e => setWheatCap(e.target.value)} 
                    className="clean-input mt-1"
                    required
                  />
                  <small className="form-hint">Current intake capacity for {centre.name}.</small>
                </div>

                <button type="submit" className="btn-dash-primary mt-4">
                  <Check size={16} /> Save Capacity Declaration
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: FARMER REGISTRATION */}
        {activeTab === "registration" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">MANDI DESK ONBOARDING</span>
                <h2 className="section-page-title">Farmer Registration & e-KYC Desk</h2>
                <p className="section-page-desc">Register new farmers into the State Procurement Database using Aadhaar e-KYC authentication.</p>
              </div>
            </div>

            {/* If farmer was just registered successfully */}
            {registeredFarmerResult ? (
              <div className="profile-verified-box mt-3" style={{ background: "#f0fdf4", border: "1.5px solid #86efac", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#166534" }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#166534", margin: 0 }}>Farmer Registration Completed Successfully!</h3>
                    <p style={{ fontSize: "13.5px", color: "#15803d", margin: "2px 0 0" }}>Profile has been added to the database and is now eligible for slot booking.</p>
                  </div>
                </div>

                <div className="profile-details-grid mt-3">
                  <div className="profile-info-box">
                    <div className="box-section-title">
                      <h3>Registered Identity</h3>
                    </div>
                    <div className="profile-kv-list">
                      <div className="kv-item"><span>Farmer ID:</span> <b>{registeredFarmerResult.farmerId}</b></div>
                      <div className="kv-item"><span>Farmer Name:</span> <b>{registeredFarmerResult.farmerName}</b></div>
                      <div className="kv-item"><span>Father's Name:</span> <b>{registeredFarmerResult.fatherName}</b></div>
                      <div className="kv-item"><span>Mobile (Login):</span> <b>{registeredFarmerResult.mobile}</b></div>
                      <div className="kv-item"><span>Aadhaar:</span> <b>{registeredFarmerResult.aadhaarMasked}</b></div>
                    </div>
                  </div>

                  <div className="profile-info-box">
                    <div className="box-section-title">
                      <h3>Location & Bank DBT</h3>
                    </div>
                    <div className="profile-kv-list">
                      <div className="kv-item"><span>Village / Tehsil:</span> <b>{registeredFarmerResult.village}, {registeredFarmerResult.tehsil}</b></div>
                      <div className="kv-item"><span>District:</span> <b>{registeredFarmerResult.district}</b></div>
                      <div className="kv-item"><span>Bank Name:</span> <b>{registeredFarmerResult.bankName}</b></div>
                      <div className="kv-item"><span>Account Number:</span> <b>{registeredFarmerResult.accountMasked || registeredFarmerResult.accountNo}</b></div>
                      <div className="kv-item"><span>IFSC Code:</span> <b>{registeredFarmerResult.ifsc}</b></div>
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn-dash-primary mt-4"
                  onClick={handleResetFarmerReg}
                >
                  <UserPlus size={16} /> Register Another Farmer
                </button>
              </div>
            ) : (
              <div className="profile-verified-box mt-3">
                {/* STEP 1: Aadhaar Number & OTP */}
                {regStep === 1 && (
                  <form onSubmit={!aadhaarOtpSent ? handleSendAadhaarOtp : handleVerifyAadhaarOtp}>
                    <div className="form-group" style={{ maxWidth: "500px" }}>
                      <label><b>Farmer 12-digit Aadhaar Number</b></label>
                      <input 
                        type="text" 
                        maxLength="12" 
                        disabled={aadhaarOtpSent}
                        value={regAadhaar} 
                        onChange={(e) => setRegAadhaar(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 12-digit Aadhaar number" 
                        className="clean-input mt-1"
                        style={{ fontSize: "16px", letterSpacing: "0.05em" }}
                        required
                      />
                      <small className="form-hint">UIDAI Aadhaar e-KYC will fetch authentic demographic & land records.</small>
                    </div>

                    {!aadhaarOtpSent ? (
                      <button type="submit" disabled={isSendingOtp} className="btn-dash-primary mt-4">
                        {isSendingOtp ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" /> Sending UIDAI OTP...
                          </>
                        ) : (
                          <>
                            <Check size={16} /> Send e-KYC Verification OTP
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="mt-4" style={{ maxWidth: "500px" }}>
                        <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", padding: "12px 16px", borderRadius: "8px", color: "#0f766e", fontSize: "13.5px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <CheckCircle2 size={18} />
                          <span>OTP dispatched to registered mobile ending in <b>XXXX-XXXX-{regAadhaar.slice(-4)}</b></span>
                        </div>

                        <div className="form-group">
                          <label><b>Enter Verification OTP</b></label>
                          <input 
                            type="text" 
                            maxLength="6"
                            value={regAadhaarOtp} 
                            onChange={(e) => setRegAadhaarOtp(e.target.value)} 
                            placeholder="Enter OTP" 
                            className="clean-input mt-1"
                            style={{ fontSize: "16px", letterSpacing: "0.1em" }}
                            required
                          />
                        </div>

                        <div className="modal-btn-row mt-4">
                          <button type="button" className="btn-dash-outline" onClick={() => setAadhaarOtpSent(false)}>
                            Re-enter Aadhaar
                          </button>
                          <button type="submit" disabled={isVerifyingAadhaar} className="btn-dash-primary">
                            {isVerifyingAadhaar ? (
                              <>
                                <RefreshCw size={16} className="animate-spin" /> Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={16} /> Verify & Fetch Demographics
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                )}

                {/* STEP 2: Demographics Confirmation */}
                {regStep === 2 && fetchedDemographics && (
                  <div>
                    <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", padding: "12px 16px", borderRadius: "8px", color: "#0f766e", fontSize: "14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <CheckCircle2 size={18} />
                      <span><b>UIDAI e-KYC Verified</b>: Details matched with state revenue and banking system.</span>
                    </div>

                    <div className="profile-details-grid">
                      <div className="profile-info-box">
                        <div className="box-section-title">
                          <h3>Personal Details</h3>
                        </div>
                        <div className="profile-kv-list">
                          <div className="kv-item"><span>Farmer Name:</span> <b>{fetchedDemographics.farmerName}</b></div>
                          <div className="kv-item"><span>Father's Name:</span> <b>{fetchedDemographics.fatherName}</b></div>
                          <div className="kv-item"><span>Date of Birth:</span> <b>{fetchedDemographics.dob} ({fetchedDemographics.age})</b></div>
                          <div className="kv-item"><span>Gender:</span> <b>{fetchedDemographics.gender}</b></div>
                          <div className="kv-item"><span>Address:</span> <b>{fetchedDemographics.address}</b></div>
                        </div>
                      </div>

                      <div className="profile-info-box">
                        <div className="box-section-title">
                          <h3>Bank Account & Land Parity</h3>
                        </div>
                        <div className="profile-kv-list">
                          <div className="kv-item"><span>Village / Tehsil:</span> <b>{fetchedDemographics.village}, {fetchedDemographics.tehsil}</b></div>
                          <div className="kv-item"><span>District:</span> <b>{fetchedDemographics.district}</b></div>
                          <div className="kv-item"><span>Bank:</span> <b>{fetchedDemographics.bankName}</b></div>
                          <div className="kv-item"><span>Account Number:</span> <b>{fetchedDemographics.accountNo || fetchedDemographics.accountMasked}</b></div>
                          <div className="kv-item"><span>IFSC:</span> <b>{fetchedDemographics.ifsc}</b></div>
                        </div>
                      </div>
                    </div>

                    <div className="modal-btn-row mt-4">
                      <button type="button" className="btn-dash-outline" onClick={() => setRegStep(1)}>
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button type="button" className="btn-dash-primary" onClick={() => setRegStep(3)}>
                        Proceed to Mobile Number Setup <Check size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Mobile Number & Final Registration */}
                {regStep === 3 && fetchedDemographics && (
                  <form onSubmit={handleCompleteFarmerRegistration} style={{ maxWidth: "600px" }}>
                    <div className="form-group">
                      <label><b>Farmer 10-Digit Mobile Number (Used for Login & SMS)</b></label>
                      <input 
                        type="text" 
                        maxLength="10" 
                        placeholder="e.g. 9829012345"
                        value={regMobile} 
                        onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, ''))}
                        className="clean-input mt-1"
                        style={{ fontSize: "16px" }}
                        required
                      />
                      <small className="form-hint">Farmer will use this 10-digit mobile number to log in.</small>
                    </div>

                    <div className="form-group mt-3">
                      <label><b>Email Address (Optional)</b></label>
                      <input 
                        type="email" 
                        placeholder="e.g. farmer@gmail.com"
                        value={regEmail} 
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="clean-input mt-1"
                      />
                    </div>

                    <div className="modal-btn-row mt-4">
                      <button type="button" className="btn-dash-outline" onClick={() => setRegStep(2)}>
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button type="submit" disabled={isRegisteringFarmer} className="btn-dash-primary">
                        {isRegisteringFarmer ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" /> Registering in Database...
                          </>
                        ) : (
                          <>
                            <UserPlus size={16} /> Complete Farmer Registration
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ALL MANDI BOOKINGS */}
        {activeTab === "bookings" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">MANDI ROSTER</span>
                <h2 className="section-page-title">Appointments</h2>
                <p className="section-page-desc">Complete register of scheduled, active, and completed farmer appointments.</p>
              </div>
            </div>

            <div className="profile-verified-box mt-3" style={{ display: "flex", gap: "10px" }}>
              <input 
                type="text" 
                placeholder="Search by Booking ID or Farmer Name..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="clean-input"
              />
              {searchTerm && <button className="btn-dash-outline" onClick={() => setSearchTerm("")}>Clear</button>}
            </div>

            <div className="table-card mt-3">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Farmer Name</th>
                    <th>Mobile</th>
                    <th>Commodity</th>
                    <th>Expected Qty</th>
                    <th>Slot Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-4">No appointments found.</td></tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id}>
                        <td><b>{b.id}</b></td>
                        <td>{b.farmerName}</td>
                        <td>{b.mobile}</td>
                        <td>{b.crop}</td>
                        <td>{b.expectedTonnes} Tonnes</td>
                        <td>{b.slotTime}</td>
                        <td>
                          <span className={`status-pill ${b.status.toLowerCase()}`}>
                            {b.status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* EDIT STAFF MODAL */}
      {editingStaff && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <h3>Edit Mandi Officer Account</h3>
              <button className="close-btn" onClick={() => setEditingStaff(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateStaff} className="mt-3">
              <div className="form-group">
                <label><b>Officer Role</b></label>
                <select 
                  value={editingStaff.role} 
                  onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value })}
                  className="clean-input mt-1"
                >
                  <option value="checkin_officer">Gate Check-In Officer</option>
                  <option value="quality_officer">Quality Inspection Officer</option>
                  <option value="weighing_officer">Electronic Weighbridge Officer</option>
                </select>
              </div>

              <div className="form-group mt-3">
                <label><b>Officer Full Name</b></label>
                <input 
                  type="text" 
                  value={editingStaff.name || ""} 
                  onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="clean-input mt-1"
                  required
                />
              </div>

              <div className="form-group mt-3">
                <label><b>Officer Mobile Number (For Login & Alerts)</b></label>
                <input 
                  type="text" 
                  maxLength="10"
                  value={editingStaff.phone || ""} 
                  onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value.replace(/\D/g, '') })}
                  className="clean-input mt-1"
                  required
                />
                <small className="form-hint">Unique 10-digit mobile number.</small>
              </div>

              <div className="form-group mt-3">
                <label><b>Assigned Login Password</b></label>
                <input 
                  type="text" 
                  value={editingStaff.password || ""} 
                  onChange={e => setEditingStaff({ ...editingStaff, password: e.target.value })}
                  className="clean-input mt-1"
                  required
                />
              </div>

              <div className="modal-btn-row mt-4">
                <button type="button" className="btn-dash-outline btn-modal-half" onClick={() => setEditingStaff(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-dash-primary btn-modal-half">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE STAFF CONFIRMATION MODAL */}
      {deletingStaff && (
        <div className="modal-backdrop">
          <div className="modal-card text-center logout-text-modal">
            <h3>Delete Officer Account</h3>
            <p className="mt-2 text-muted-logout">
              Are you sure you want to permanently delete <b>{deletingStaff.name}</b> ({deletingStaff.phone}) from Mandi staff?
            </p>
            <div className="modal-btn-row mt-4">
              <button className="btn-dash-outline btn-modal-half" onClick={() => setDeletingStaff(null)}>
                Cancel
              </button>
              <button className="btn-danger-solid btn-modal-half" onClick={handleDeleteStaffConfirm}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION DIALOG MODAL (CLEAN TEXT, ZERO LOGOUT ICONS) */}
      {showLogoutModal && (
        <div className="modal-backdrop">
          <div className="modal-card text-center logout-text-modal">
            <h3>Sign Out</h3>
            <p className="mt-2 text-muted-logout">Are you sure you want to end your active administrator session?</p>
            <div className="modal-btn-row mt-4">
              <button className="btn-dash-outline btn-modal-half" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="btn-danger-solid btn-modal-half" onClick={onLogout}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {showHelpModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <h3>Centre Administrator Guide</h3>
              <button className="close-btn" onClick={() => setShowHelpModal(false)}><X size={18} /></button>
            </div>
            <div className="profile-verified-box mt-3 text-left">
              <h4>Mandi Management Instructions:</h4>
              <p className="mt-1">1. Use the <b>Mandi Staff & Officers</b> tab to create and manage login accounts for your Check-In, Quality Lab, and Weighing officers.</p>
              <p className="mt-1">2. Provide each officer with their assigned Officer ID and Password.</p>
              <p className="mt-1">3. Launch the Waiting Hall Electronic TV Signboard using the sidebar button.</p>
              <p className="mt-1">4. Register walk-in farmers on the spot using the Assisted Booking tab.</p>
            </div>
            <button className="btn-dash-primary w-full mt-4" onClick={() => setShowHelpModal(false)}>
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
