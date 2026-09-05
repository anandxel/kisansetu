import React, { useState } from "react";
import { 
  Scale, CheckCircle2, ArrowLeft, Download, 
  WalletCards, FileText, Check, AlertCircle, LogOut, HelpCircle,
  Clock, Users, Sprout, X
} from "lucide-react";

export function WeighingPortal({ 
  user = {}, 
  bookings = [], 
  centres = [],
  onCompleteWeighing, 
  onLogout 
}) {
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "completed" | "rates"
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Weighing Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [grossWeight, setGrossWeight] = useState("10.42");
  const [tareWeight, setTareWeight] = useState("2.50");

  const centreBookings = bookings.filter(b => b.centreId === user.centreId || !user.centreId);
  const weighingQueue = centreBookings.filter(b => b.status === "WEIGHING_PROCESS");
  const completedQueue = centreBookings.filter(b => b.status === "PROCUREMENT_COMPLETED" || b.netPayableAmount);

  const getMspRateForCrop = (cropName) => {
    const c = (cropName || "").toLowerCase();
    if (c.includes("mustard") || c.includes("sarson")) return 5650;
    if (c.includes("gram") || c.includes("chana")) return 5440;
    if (c.includes("barley") || c.includes("jau")) return 1850;
    if (c.includes("paddy") || c.includes("rice")) return 2300;
    return 2425; // Standard Wheat MSP
  };

  const currentCrop = selectedBooking?.crop || "Wheat";
  const mspRate = getMspRateForCrop(currentCrop);
  const gNum = parseFloat(grossWeight) || 0;
  const tNum = parseFloat(tareWeight) || 0;
  const netWeight = Math.max(0, gNum - tNum).toFixed(2);
  const netQuintals = (Number(netWeight) * 10).toFixed(2);
  const totalPayable = Math.round(Number(netQuintals) * mspRate);

  const handleOpenWeighing = (b) => {
    setSelectedBooking(b);
    const exp = Number(b.expectedTonnes) || 8.0;
    setGrossWeight((exp + 2.5).toFixed(2));
    setTareWeight("2.50");
  };

  const handleConfirmWeighing = () => {
    if (!selectedBooking) return;
    const paymentRef = `PFMS-2026-DBT-${Math.floor(1000000 + Math.random() * 9000000)}`;
    onCompleteWeighing(selectedBooking.id, Number(netWeight), totalPayable, paymentRef);
    setSelectedBooking(null);
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
              className={`nav-btn ${activeTab === "queue" ? "active" : ""}`}
              onClick={() => { setActiveTab("queue"); setMobileNavOpen(false); }}
            >
              <Scale size={19} />
              <span>Weighbridge Queue ({weighingQueue.length})</span>
            </button>

            <button 
              className={`nav-btn ${activeTab === "completed" ? "active" : ""}`}
              onClick={() => { setActiveTab("completed"); setMobileNavOpen(false); }}
            >
              <FileText size={19} />
              <span>Completed Weighments ({completedQueue.length})</span>
            </button>

            <button 
              className={`nav-btn ${activeTab === "rates" ? "active" : ""}`}
              onClick={() => { setActiveTab("rates"); setMobileNavOpen(false); }}
            >
              <WalletCards size={19} />
              <span>MSP Rate Card</span>
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
            <span className="header-eyebrow">ELECTRONIC WEIGHBRIDGE DESK • {user.centreName || "MANDI SCALE"}</span>
            <h1 className="header-main-title">
              {activeTab === "queue" && "Weighbridge Scale Queue"}
              {activeTab === "completed" && "Completed Weighments & J-Forms"}
              {activeTab === "rates" && "Official MSP Rate Card"}
            </h1>
          </div>

          <div className="header-actions-block">
            <div className="header-profile-pill">
              <div className="profile-avatar-circle">
                {(user.name || "Weighing Officer").charAt(0)}
              </div>
              <div className="profile-meta-text">
                <span className="profile-name">{user.name || "Weighing Officer"}</span>
                <span className="profile-id">{user.centreName || "Electronic Weighbridge"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* TAB 1: WEIGHBRIDGE QUEUE */}
        {activeTab === "queue" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">ELECTRONIC WEIGHMENT & J-FORM ISSUANCE</span>
                <h2 className="section-page-title">Weighbridge Scale Queue</h2>
                <p className="section-page-desc">Record gross vehicle weight, subtract tare weight, and generate official J-Form receipts.</p>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="dash-metrics-grid mt-2">
              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Clock size={20} className="tile-icon teal" />
                  <small>Ready on Scale</small>
                </div>
                <h3>{weighingQueue.length} Trucks</h3>
                <span>Awaiting Weighment</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <CheckCircle2 size={20} className="tile-icon teal" />
                  <small>Procured Today</small>
                </div>
                <h3>{completedQueue.length} Lots</h3>
                <span>J-Forms Dispatched</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <WalletCards size={20} className="tile-icon slate" />
                  <small>Wheat Active MSP</small>
                </div>
                <h3>₹2,425 / Qtl</h3>
                <span>PFMS DBT Direct Settlement</span>
              </div>
            </div>

            {weighingQueue.length === 0 ? (
              <div className="empty-live-report-card mt-4">
                <div className="empty-live-icon">
                  <CheckCircle2 size={38} className="teal-text" />
                </div>
                <h3>No Vehicles Currently in Weighbridge Queue</h3>
                <p>All inspected grain lots have been weighed or are undergoing quality testing.</p>
              </div>
            ) : (
              <div className="table-card mt-4">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Token No.</th>
                      <th>Booking ID</th>
                      <th>Farmer Name</th>
                      <th>Commodity</th>
                      <th>Grade (Lab Tested)</th>
                      <th>Expected Qty</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weighingQueue.map((b, idx) => (
                      <tr key={b.id}>
                        <td><b className="token-tag">Scale #{idx + 1}</b></td>
                        <td><b>{b.id}</b></td>
                        <td>{b.farmerName}</td>
                        <td>{b.crop}</td>
                        <td><span className="status-pill checked_in">{b.qualityResult?.grade || "Grade-A FAQ"}</span></td>
                        <td>{b.expectedTonnes} Tonnes</td>
                        <td>
                          <button 
                            className="btn-dash-primary btn-sm"
                            onClick={() => handleOpenWeighing(b)}
                          >
                            <Scale size={14} /> Open Scale
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMPLETED WEIGHMENTS */}
        {activeTab === "completed" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">J-FORM WEIGHMENT REGISTER</span>
                <h2 className="section-page-title">Completed Procurements</h2>
                <p className="section-page-desc">List of all finalized weighment slips, J-Forms, and PFMS payment disbursements.</p>
              </div>
            </div>

            <div className="table-card mt-3">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Farmer Name</th>
                    <th>Commodity</th>
                    <th>Accepted Weight</th>
                    <th>Total Payout</th>
                    <th>PFMS UTR Ref</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedQueue.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-4">No completed procurements yet today.</td></tr>
                  ) : (
                    completedQueue.map((b) => (
                      <tr key={b.id}>
                        <td><b>{b.id}</b></td>
                        <td>{b.farmerName}</td>
                        <td>{b.crop}</td>
                        <td><b>{b.actualWeightTonnes || b.expectedTonnes} Tonnes</b></td>
                        <td className="teal-text"><b>₹{(b.netPayableAmount || 0).toLocaleString()}</b></td>
                        <td><small>{b.paymentRef || "PFMS-DISPATCHED"}</small></td>
                        <td><span className="status-pill checked_in">● Completed</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MSP RATE CARD */}
        {activeTab === "rates" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">GOVERNMENT PROCUREMENT TARIFF</span>
                <h2 className="section-page-title">Minimum Support Price (MSP) Rates</h2>
                <p className="section-page-desc">Official MSP rates for direct benefit calculation and J-Form payout disbursement.</p>
              </div>
            </div>

            <div className="table-card mt-3">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Commodity Name</th>
                    <th>Season</th>
                    <th>MSP Rate (₹ / Quintal)</th>
                    <th>MSP Rate (₹ / Tonne)</th>
                    <th>Procurement Agency</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Wheat (Kanak)</b></td>
                    <td>Rabi 2026</td>
                    <td><b>₹2,425 / Qtl</b></td>
                    <td>₹24,250 / Tonne</td>
                    <td>FCI / RSAMB</td>
                  </tr>
                  <tr>
                    <td><b>Mustard (Sarson)</b></td>
                    <td>Rabi 2026</td>
                    <td><b>₹5,650 / Qtl</b></td>
                    <td>₹56,500 / Tonne</td>
                    <td>NAFED / RAJFED</td>
                  </tr>
                  <tr>
                    <td><b>Gram (Chana)</b></td>
                    <td>Rabi 2026</td>
                    <td><b>₹5,440 / Qtl</b></td>
                    <td>₹54,400 / Tonne</td>
                    <td>NAFED / RAJFED</td>
                  </tr>
                  <tr>
                    <td><b>Barley (Jau)</b></td>
                    <td>Rabi 2026</td>
                    <td><b>₹1,850 / Qtl</b></td>
                    <td>₹18,500 / Tonne</td>
                    <td>RSAMB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* WEIGHBRIDGE CALIBRATION & J-FORM CONSOLE MODAL */}
      {selectedBooking && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <h3>Electronic Weighbridge Console</h3>
                <p className="text-muted">Farmer: <b>{selectedBooking.farmerName}</b> • Commodity: <b>{selectedBooking.crop}</b></p>
              </div>
              <button className="close-btn" onClick={() => setSelectedBooking(null)}><X size={18} /></button>
            </div>

            {/* LED Display Box */}
            <div className="profile-verified-box mt-3 text-center" style={{ background: "#0f172a", color: "#ffffff", padding: "16px", borderRadius: "12px" }}>
              <span style={{ fontSize: "11px", letterSpacing: "1px", color: "#94a3b8" }}>NET ACCEPTED PRODUCE WEIGHT</span>
              <div style={{ fontSize: "34px", fontWeight: "800", color: "#2dd4bf", margin: "4px 0" }}>
                {netWeight} <span style={{ fontSize: "16px", color: "#94a3b8" }}>TONNES</span>
              </div>
              <span style={{ fontSize: "13px", color: "#cbd5e1" }}>({netQuintals} Quintals)</span>
            </div>

            <div className="profile-verified-box mt-3 text-left">
              {/* Gross Weight Input */}
              <div className="form-group">
                <label><b>Gross Vehicle Weight (Tonnes)</b> (Vehicle + Produce)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={grossWeight} 
                  onChange={e => setGrossWeight(e.target.value)} 
                  className="clean-input mt-1"
                  required
                />
              </div>

              {/* Tare Weight Input */}
              <div className="form-group mt-3">
                <label><b>Tare Weight (Tonnes)</b> (Empty Vehicle Tare)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={tareWeight} 
                  onChange={e => setTareWeight(e.target.value)} 
                  className="clean-input mt-1"
                  required
                />
              </div>

              {/* Payout Calculation Grid */}
              <div className="profile-verified-box mt-3" style={{ background: "#f0fdfa", border: "1px solid #ccfbf1" }}>
                <div className="sum-data-row"><span>Applicable MSP:</span> <b>₹{mspRate} / Quintal</b></div>
                <div className="sum-data-row"><span>Total Payable Payout:</span> <b className="teal-text" style={{ fontSize: "16px" }}>₹{totalPayable.toLocaleString()}.00</b></div>
                <small className="text-muted mt-1" style={{ display: "block" }}>Payment will be disbursed directly to farmer bank account via PFMS DBT.</small>
              </div>
            </div>

            <div className="modal-actions-row mt-4">
              <button className="btn-dash-outline btn-modal-half" onClick={() => setSelectedBooking(null)}>
                Cancel
              </button>
              <button className="btn-dash-primary btn-modal-half" onClick={handleConfirmWeighing}>
                <CheckCircle2 size={16} /> Confirm & Generate J-Form
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
            <p className="mt-2 text-muted-logout">Are you sure you want to end your active officer session?</p>
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
              <h3>Electronic Weighbridge Desk Guide</h3>
              <button className="close-btn" onClick={() => setShowHelpModal(false)}><X size={18} /></button>
            </div>
            <div className="profile-verified-box mt-3 text-left">
              <h4>Weighment Procedure:</h4>
              <p className="mt-1">1. Position loaded vehicle on electronic weighbridge scale platform and record gross weight.</p>
              <p className="mt-1">2. Unload grain produce into designated Mandi storage silo.</p>
              <p className="mt-1">3. Record tare weight of empty vehicle.</p>
              <p className="mt-1">4. System automatically computes net grain weight and calculates MSP payout.</p>
              <p className="mt-1">5. Click "Confirm & Generate J-Form" to complete procurement and trigger DBT payment.</p>
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
