import React, { useState } from "react";
import { 
  Building2, ShieldCheck, Scale, Users, TrendingUp, 
  Check, X, Plus, Key, FileSpreadsheet, ArrowLeft,
  CheckCircle2, AlertCircle, RefreshCw, Layers, LogOut,
  HelpCircle, Sprout, WalletCards, MapPin, UserPlus
} from "lucide-react";
import { apiCreateOfficial } from "../api";

export function StateAdminPortal({ 
  user = {}, 
  centres = [], 
  bookings = [], 
  onCreateCentre, 
  onLogout 
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "centres" | "add_centre"
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [stateToast, setStateToast] = useState("");

  // New Centre Form State
  const [newCentreName, setNewCentreName] = useState("");
  const [newCentreDistrict, setNewCentreDistrict] = useState("Alwar");
  const [newCentreCapacity, setNewCentreCapacity] = useState("50");
  const [newCentreCrop, setNewCentreCrop] = useState("Wheat");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminId, setNewAdminId] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");

  const totalProcuredTonnes = bookings.filter(b => b.status === "PROCUREMENT_COMPLETED" || b.netPayableAmount).reduce((acc, b) => acc + (b.actualWeightTonnes || b.expectedTonnes || 0), 0);
  const totalExpenditure = bookings.filter(b => b.netPayableAmount).reduce((acc, b) => acc + (b.netPayableAmount || 0), 0);

  const handleCreateCentreSubmit = async (e) => {
    e.preventDefault();
    if (!newCentreName || !newAdminId || !newAdminPass || !newAdminPhone) {
      alert("Please fill in all centre and admin details including mobile number.");
      return;
    }

    const newId = "C00" + (centres.length + 1);
    const newCentre = {
      id: newId,
      name: newCentreName.trim(),
      district: newCentreDistrict,
      state: "Rajasthan",
      distance: "12.0 km",
      dailyCapacityTonnes: Number(newCentreCapacity),
      reservedTonnes: 0,
      crop: newCentreCrop,
      mspRatePerQtl: newCentreCrop === "Mustard" ? 5650 : (newCentreCrop === "Gram" ? 5440 : 2425),
      officerName: newAdminName || "Centre In-Charge",
      phone: newAdminPhone.trim()
    };

    // 1. Create Centre
    await onCreateCentre(newCentre);

    // 2. Create Centre Admin Login Credentials in Official Registry
    await apiCreateOfficial({
      officialId: newAdminId.trim().toUpperCase(),
      password: newAdminPass.trim(),
      role: "centre_admin",
      centreId: newId,
      centreName: newCentre.name,
      name: newAdminName.trim() || `${newCentre.name} Administrator`,
      phone: newAdminPhone.trim()
    });

    setStateToast(`Procurement Centre '${newCentre.name}' and Centre Admin '${newAdminId.toUpperCase()}' created successfully!`);
    setTimeout(() => setStateToast(""), 4000);

    setNewCentreName("");
    setNewAdminName("");
    setNewAdminId("");
    setNewAdminPass("");
    setNewAdminPhone("");
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
          <span className="sidebar-brand-name">KisanSetu</span>
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
              <span className="brand-title">Kisan</span>
              <span className="brand-subtitle">Setu</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="sidebar-nav sidebar-nav-spaced">
            <button 
              className={`nav-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => { setActiveTab("overview"); setMobileNavOpen(false); }}
            >
              <TrendingUp size={19} />
              <span>State Overview</span>
            </button>

            <button 
              className={`nav-btn ${activeTab === "centres" ? "active" : ""}`}
              onClick={() => { setActiveTab("centres"); setMobileNavOpen(false); }}
            >
              <Building2 size={19} />
              <span>Procurement Centres ({centres.length})</span>
            </button>

            <button 
              className={`nav-btn ${activeTab === "add_centre" ? "active" : ""}`}
              onClick={() => { setActiveTab("add_centre"); setMobileNavOpen(false); }}
            >
              <Plus size={19} />
              <span>Add Centre & Assign Admin</span>
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
            <span className="header-eyebrow">STATE DIRECTORATE OF AGRICULTURE</span>
            <h1 className="header-main-title">
              {activeTab === "overview" && "State Directorate Overview"}
              {activeTab === "centres" && "Procurement Centres"}
              {activeTab === "add_centre" && "Add Centre & Assign Admin"}
            </h1>
          </div>

          <div className="header-actions-block">
            <div className="header-profile-pill">
              <div className="profile-avatar-circle">
                {(user.name || "Aditi Sharma").charAt(0)}
              </div>
              <div className="profile-meta-text">
                <span className="profile-name">{user.name || "Aditi Sharma"}</span>
                <span className="profile-id">State Procurement Director</span>
              </div>
            </div>
          </div>
        </header>

        {/* TOAST BANNER */}
        {stateToast && (
          <div className="toast-notification-banner mt-2">
            <CheckCircle2 size={18} className="teal-text" />
            <span>{stateToast}</span>
          </div>
        )}

        {/* TAB 1: STATE OVERVIEW */}
        {activeTab === "overview" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">STATE-WIDE CONSOLIDATED METRICS</span>
                <h2 className="section-page-title">Procurement Directorate Overview</h2>
                <p className="section-page-desc">Real-time procurement progress, total government expenditure, and district performance.</p>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="dash-metrics-grid mt-2">
              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Scale size={20} className="tile-icon teal" />
                  <small>Total Grain Procured</small>
                </div>
                <h3>{totalProcuredTonnes.toFixed(2)} Tonnes</h3>
                <span>Consolidated State Total</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <WalletCards size={20} className="tile-icon teal" />
                  <small>Direct Benefit Payout</small>
                </div>
                <h3>₹{totalExpenditure.toLocaleString()}</h3>
                <span>Transferred via PFMS DBT</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Building2 size={20} className="tile-icon slate" />
                  <small>Active Mandi Centres</small>
                </div>
                <h3>{centres.length} Mandis</h3>
                <span>Operational Network</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Sprout size={20} className="tile-icon slate" />
                  <small>Procurement Commodities</small>
                </div>
                <h3>Wheat, Mustard, Gram</h3>
                <span>Active MSP Seasons</span>
              </div>
            </div>

            {/* Mandi Performance Table */}
            <div className="table-card mt-4">
              <h3 style={{ fontSize: "16px", fontWeight: "700", padding: "16px 20px 8px 20px" }}>
                Active Mandi Procurement Network
              </h3>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Centre Code</th>
                    <th>Mandi Name</th>
                    <th>District</th>
                    <th>Primary Commodity</th>
                    <th>Daily Capacity</th>
                    <th>Reserved Tonnes</th>
                    <th>Centre Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {centres.map((c) => (
                    <tr key={c.id}>
                      <td><b>{c.id}</b></td>
                      <td><b>{c.name}</b></td>
                      <td>{c.district}</td>
                      <td>{c.crop}</td>
                      <td>{c.dailyCapacityTonnes} T/Day</td>
                      <td>{c.reservedTonnes || 0} Tonnes</td>
                      <td><span className="status-pill checked_in">{c.officerName || "Admin Assigned"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CENTRES DIRECTORY */}
        {activeTab === "centres" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">CENTRE REGISTRY</span>
                <h2 className="section-page-title">Procurement Centres & Assigned Admins</h2>
                <p className="section-page-desc">List of all government procurement hubs, capacities, and appointed centre in-charges.</p>
              </div>
              <button className="btn-dash-primary" onClick={() => setActiveTab("add_centre")}>
                <Plus size={16} /> Add New Mandi
              </button>
            </div>

            <div className="table-card mt-3">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Procurement Centre</th>
                    <th>District</th>
                    <th>Assigned Admin</th>
                    <th>Helpline Phone</th>
                    <th>MSP Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {centres.map((c) => (
                    <tr key={c.id}>
                      <td><b>{c.id}</b></td>
                      <td><b>{c.name}</b></td>
                      <td>{c.district}, {c.state}</td>
                      <td>{c.officerName || "Assigned Officer"}</td>
                      <td>{c.phone || "+91 98290 11223"}</td>
                      <td><b>₹{c.mspRatePerQtl || 2425}/Qtl</b></td>
                      <td><span className="status-pill checked_in">● Operational</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ADD CENTRE & ASSIGN ADMIN */}
        {activeTab === "add_centre" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">INFRASTRUCTURE EXPANSION</span>
                <h2 className="section-page-title">Add New Procurement Centre & Assign Centre Admin</h2>
                <p className="section-page-desc">Establish a new Mandi procurement hub and generate login credentials for the appointed Centre Admin.</p>
              </div>
            </div>

            <div className="profile-verified-box mt-3">
              <form onSubmit={handleCreateCentreSubmit}>
                <div className="profile-data-columns">
                  <div>
                    <h4 style={{ color: "var(--primary)", marginBottom: "12px" }}>1. Mandi Facility Details</h4>
                    <div className="form-group">
                      <label><b>Mandi Facility Name</b></label>
                      <input 
                        type="text" 
                        placeholder="e.g. Kotputli Krishi Upaj Mandi" 
                        value={newCentreName} 
                        onChange={e => setNewCentreName(e.target.value)} 
                        className="clean-input mt-1"
                        required
                      />
                    </div>

                    <div className="form-group mt-3">
                      <label><b>District</b></label>
                      <select 
                        value={newCentreDistrict} 
                        onChange={e => setNewCentreDistrict(e.target.value)}
                        className="clean-input mt-1"
                      >
                        <option value="Alwar">Alwar</option>
                        <option value="Dausa">Dausa</option>
                        <option value="Jaipur">Jaipur</option>
                        <option value="Bharatpur">Bharatpur</option>
                        <option value="Sikar">Sikar</option>
                        <option value="Kota">Kota</option>
                        <option value="Sri Ganganagar">Sri Ganganagar</option>
                      </select>
                    </div>

                    <div className="form-group mt-3">
                      <label><b>Daily Procurement Intake Target (Tonnes / Day)</b></label>
                      <input 
                        type="number" 
                        value={newCentreCapacity} 
                        onChange={e => setNewCentreCapacity(e.target.value)} 
                        className="clean-input mt-1"
                        required
                      />
                    </div>

                    <div className="form-group mt-3">
                      <label><b>Primary Commodity</b></label>
                      <select 
                        value={newCentreCrop} 
                        onChange={e => setNewCentreCrop(e.target.value)}
                        className="clean-input mt-1"
                      >
                        <option value="Wheat">Wheat (MSP ₹2,425/Qtl)</option>
                        <option value="Mustard">Mustard (MSP ₹5,650/Qtl)</option>
                        <option value="Gram">Gram (MSP ₹5,440/Qtl)</option>
                        <option value="Barley">Barley (MSP ₹1,850/Qtl)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ color: "var(--primary)", marginBottom: "12px" }}>2. Centre Admin Appointed Credentials</h4>
                    <div className="form-group">
                      <label><b>Appointed Centre Admin Name</b></label>
                      <input 
                        type="text" 
                        placeholder="e.g. Ramesh Chandra Sharma" 
                        value={newAdminName} 
                        onChange={e => setNewAdminName(e.target.value)} 
                        className="clean-input mt-1"
                        required
                      />
                    </div>

                    <div className="form-group mt-3">
                      <label><b>Centre Admin Login Officer ID</b></label>
                      <input 
                        type="text" 
                        placeholder="e.g. CA_KOTPUTLI_04" 
                        value={newAdminId} 
                        onChange={e => setNewAdminId(e.target.value)} 
                        className="clean-input mt-1"
                        required
                      />
                    </div>

                    <div className="form-group mt-3">
                      <label><b>Assigned Login Password</b></label>
                      <input 
                        type="text" 
                        placeholder="e.g. kotputli123" 
                        value={newAdminPass} 
                        onChange={e => setNewAdminPass(e.target.value)} 
                        className="clean-input mt-1"
                        required
                      />
                    </div>

                    <div className="form-group mt-3">
                      <label><b>Centre Admin Mobile Number (For Login & SMS)</b></label>
                      <input 
                        type="text" 
                        placeholder="e.g. 9829011223"
                        maxLength="10"
                        value={newAdminPhone} 
                        onChange={e => setNewAdminPhone(e.target.value.replace(/\D/g, ''))} 
                        className="clean-input mt-1"
                        required
                      />
                      <small className="form-hint">Used for official 10-digit mobile number sign-in.</small>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-dash-primary mt-4">
                  <Plus size={16} /> Establish Mandi & Create Centre Admin Credentials
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* LOGOUT CONFIRMATION DIALOG MODAL (CLEAN TEXT, ZERO LOGOUT ICONS) */}
      {showLogoutModal && (
        <div className="modal-backdrop">
          <div className="modal-card text-center logout-text-modal">
            <h3>Sign Out</h3>
            <p className="mt-2 text-muted-logout">Are you sure you want to end your active State Directorate session?</p>
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
              <h3>State Directorate Administration Guide</h3>
              <button className="close-btn" onClick={() => setShowHelpModal(false)}><X size={18} /></button>
            </div>
            <div className="profile-verified-box mt-3 text-left">
              <h4>State Admin Authority:</h4>
              <p className="mt-1">1. You have the master authority to create new Mandi Centres and assign appointed Centre Admins with their login Officer IDs and passwords.</p>
              <p className="mt-1">2. Each appointed Centre Admin will then manage their own Mandi staff (Check-In, Quality Lab, Weighbridge).</p>
              <p className="mt-1">3. Monitor state-wide procurement capacity, MSP rates, and active lot processing in real-time.</p>
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
