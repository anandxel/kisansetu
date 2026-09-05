import React, { useState } from "react";
import { 
  FlaskConical, CheckCircle2, XCircle, ArrowLeft, 
  Scale, Clock, ShieldCheck, Check, X, LogOut, HelpCircle,
  Users, Activity, Sprout, AlertCircle, FileText
} from "lucide-react";

export function QualityPortal({ 
  user = {}, 
  bookings = [], 
  centres = [],
  onPassQuality, 
  onFailQuality, 
  onLogout 
}) {
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "graded" | "standards"
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Inspection Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [moistureVal, setMoistureVal] = useState("11.2");
  const [foreignMatterVal, setForeignMatterVal] = useState("0.6");
  const [gradeVal, setGradeVal] = useState("Grade-A (FAQ)");
  const [inspectionRemarks, setInspectionRemarks] = useState("Grain luster and moisture within standard specifications.");

  const centreBookings = bookings.filter(b => b.centreId === user.centreId || !user.centreId);
  const waitingQueue = centreBookings.filter(b => b.status === "QUALITY_WAITING");
  const gradedQueue = centreBookings.filter(b => b.status === "WEIGHING_PROCESS" || b.status === "PROCUREMENT_COMPLETED" || b.status === "QUALITY_FAILED");

  const handleOpenInspection = (b) => {
    setSelectedBooking(b);
    setMoistureVal("11.2");
    setForeignMatterVal("0.6");
    setGradeVal("Grade-A (FAQ)");
    setInspectionRemarks("Grain luster and moisture within standard specifications.");
  };

  const handlePass = () => {
    if (!selectedBooking) return;
    const mNum = parseFloat(moistureVal) || 11.2;
    const fNum = parseFloat(foreignMatterVal) || 0.6;
    const result = {
      pass: true,
      moisture: `${mNum}%`,
      foreignMatter: `${fNum}%`,
      grade: gradeVal,
      gradedBy: user.name || "Quality Inspector",
      remarks: inspectionRemarks
    };
    onPassQuality(selectedBooking.id, result);
    setSelectedBooking(null);
  };

  const handleFail = () => {
    if (!selectedBooking) return;
    const mNum = parseFloat(moistureVal) || 13.5;
    const fNum = parseFloat(foreignMatterVal) || 1.8;
    const result = {
      pass: false,
      moisture: `${mNum}%`,
      foreignMatter: `${fNum}%`,
      grade: "Sub-standard",
      gradedBy: user.name || "Quality Inspector",
      remarks: inspectionRemarks || "Exceeds permissible limits"
    };
    onFailQuality(selectedBooking.id, result);
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
              <FlaskConical size={19} />
              <span>Quality Queue ({waitingQueue.length})</span>
            </button>

            <button 
              className={`nav-btn ${activeTab === "graded" ? "active" : ""}`}
              onClick={() => { setActiveTab("graded"); setMobileNavOpen(false); }}
            >
              <CheckCircle2 size={19} />
              <span>Completed Assays ({gradedQueue.length})</span>
            </button>

            <button 
              className={`nav-btn ${activeTab === "standards" ? "active" : ""}`}
              onClick={() => { setActiveTab("standards"); setMobileNavOpen(false); }}
            >
              <ShieldCheck size={19} />
              <span>FAQ Norms & Standards</span>
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
            <span className="header-eyebrow">QUALITY ASSAY LAB • {user.centreName || "MANDI LAB"}</span>
            <h1 className="header-main-title">
              {activeTab === "queue" && "Live Quality Testing Queue"}
              {activeTab === "graded" && "Completed Assays & Grades"}
              {activeTab === "standards" && "FAQ Norms & Standards"}
            </h1>
          </div>

          <div className="header-actions-block">
            <div className="header-profile-pill">
              <div className="profile-avatar-circle">
                {(user.name || "Quality Officer").charAt(0)}
              </div>
              <div className="profile-meta-text">
                <span className="profile-name">{user.name || "Quality Officer"}</span>
                <span className="profile-id">{user.centreName || "Quality Testing Lab"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* TAB 1: LIVE QUALITY TESTING QUEUE */}
        {activeTab === "queue" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">PHYSICAL CROP GRADING & SCIENTIFIC ASSAY</span>
                <h2 className="section-page-title">Live Quality Testing Queue</h2>
                <p className="section-page-desc">Test physical grain samples for moisture, foreign matter, and assign FAQ Grade.</p>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="dash-metrics-grid mt-2">
              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Clock size={20} className="tile-icon teal" />
                  <small>Awaiting Lab Assay</small>
                </div>
                <h3>{waitingQueue.length} Vehicles</h3>
                <span>In Testing Queue</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <CheckCircle2 size={20} className="tile-icon teal" />
                  <small>Passed FAQ Grade</small>
                </div>
                <h3>{gradedQueue.filter(b => b.qualityResult?.grade.includes("Grade-A")).length} Lots</h3>
                <span>Dispatched to Scale</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <ShieldCheck size={20} className="tile-icon slate" />
                  <small>Total Lots Assayed</small>
                </div>
                <h3>{gradedQueue.length} Today</h3>
                <span>Official Lab Certificates</span>
              </div>
            </div>

            {/* Live Queue Cards / Empty state */}
            {waitingQueue.length === 0 ? (
              <div className="empty-live-report-card mt-4">
                <div className="empty-live-icon">
                  <CheckCircle2 size={38} className="teal-text" />
                </div>
                <h3>No Farmers Waiting for Quality Grading</h3>
                <p>All checked-in farmers have been inspected or are awaiting gate check-in.</p>
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
                      <th>Expected Quantity</th>
                      <th>Arrival Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitingQueue.map((b, idx) => (
                      <tr key={b.id}>
                        <td><b className="token-tag">Token #{idx + 1}</b></td>
                        <td><b>{b.id}</b></td>
                        <td>{b.farmerName}</td>
                        <td>{b.crop}</td>
                        <td>{b.expectedTonnes} Tonnes</td>
                        <td>{b.checkInTime || "Just now"}</td>
                        <td>
                          <button 
                            className="btn-dash-primary btn-sm"
                            onClick={() => handleOpenInspection(b)}
                          >
                            <FlaskConical size={14} /> Start Inspection
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

        {/* TAB 2: COMPLETED ASSAYS */}
        {activeTab === "graded" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">LAB TESTING LOG</span>
                <h2 className="section-page-title">Completed Quality Inspections</h2>
                <p className="section-page-desc">Review grain lots that have passed scientific grading and were sent to weighbridge.</p>
              </div>
            </div>

            <div className="table-card mt-3">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Farmer Name</th>
                    <th>Commodity</th>
                    <th>Assigned Grade</th>
                    <th>Moisture %</th>
                    <th>Foreign Matter %</th>
                    <th>Lab Status</th>
                  </tr>
                </thead>
                <tbody>
                  {gradedQueue.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-4">No inspection records for today yet.</td></tr>
                  ) : (
                    gradedQueue.map((b) => (
                      <tr key={b.id}>
                        <td><b>{b.id}</b></td>
                        <td>{b.farmerName}</td>
                        <td>{b.crop}</td>
                        <td><b>{b.qualityResult?.grade || "Grade-A (FAQ)"}</b></td>
                        <td>{b.qualityResult?.moisture || "11.2%"}</td>
                        <td>{b.qualityResult?.foreignMatter || "0.6%"}</td>
                        <td>
                          <span className={`status-pill ${b.status === "QUALITY_FAILED" ? "cancelled" : "checked_in"}`}>
                            {b.status === "QUALITY_FAILED" ? "● Rejected" : "● Passed (Sent to Scale)"}
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

        {/* TAB 3: FAQ STANDARDS */}
        {activeTab === "standards" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">GOVERNMENT SPECIFICATIONS</span>
                <h2 className="section-page-title">Uniform Quality Specifications (FAQ)</h2>
                <p className="section-page-desc">Standard parameters for Rabi & Kharif procurement set by Ministry of Consumer Affairs & Food.</p>
              </div>
            </div>

            <div className="table-card mt-3">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Commodity</th>
                    <th>Max Moisture %</th>
                    <th>Max Foreign Matter %</th>
                    <th>Damaged / Discolored %</th>
                    <th>Permissible Shriveled Grains</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Wheat (FAQ)</b></td>
                    <td><b>12.0%</b></td>
                    <td><b>0.75%</b></td>
                    <td>2.0%</td>
                    <td>6.0%</td>
                  </tr>
                  <tr>
                    <td><b>Mustard (Sarson)</b></td>
                    <td><b>8.0%</b></td>
                    <td><b>2.00%</b></td>
                    <td>1.0%</td>
                    <td>4.0%</td>
                  </tr>
                  <tr>
                    <td><b>Gram (Chana)</b></td>
                    <td><b>14.0%</b></td>
                    <td><b>1.00%</b></td>
                    <td>3.0%</td>
                    <td>4.0%</td>
                  </tr>
                  <tr>
                    <td><b>Barley (Jau)</b></td>
                    <td><b>12.0%</b></td>
                    <td><b>1.00%</b></td>
                    <td>2.5%</td>
                    <td>6.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SCIENTIFIC LAB INSPECTION MODAL */}
      {selectedBooking && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <h3>Quality Inspection & Grading</h3>
                <p className="text-muted">Farmer: <b>{selectedBooking.farmerName}</b> • Booking: <b>{selectedBooking.id}</b></p>
              </div>
              <button className="close-btn" onClick={() => setSelectedBooking(null)}><X size={18} /></button>
            </div>

            <div className="profile-verified-box mt-3 text-left">
              {/* Moisture Content % Numeric Input */}
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label><b>Moisture Content (%)</b></label>
                  <span className="status-pill checked_in" style={{ fontSize: "11px", padding: "2px 8px" }}>
                    Standard: Max 12%
                  </span>
                </div>
                <input 
                  type="number" 
                  step="0.1" 
                  min="5.0"
                  max="25.0"
                  value={moistureVal} 
                  onChange={e => setMoistureVal(e.target.value)} 
                  className="clean-input"
                  placeholder="e.g. 11.2"
                  required
                />
                <small className="form-hint">Must be 12.0% or less for FAQ compliance.</small>
              </div>

              {/* Foreign Matter % Numeric Input */}
              <div className="form-group mt-3">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label><b>Foreign Matter / Impurities (%)</b></label>
                  <span className="status-pill checked_in" style={{ fontSize: "11px", padding: "2px 8px" }}>
                    Standard: Max 1%
                  </span>
                </div>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0.0"
                  max="10.0"
                  value={foreignMatterVal} 
                  onChange={e => setForeignMatterVal(e.target.value)} 
                  className="clean-input"
                  placeholder="e.g. 0.6"
                  required
                />
                <small className="form-hint">Must be 1.0% or less for FAQ compliance.</small>
              </div>

              {/* Grade Selection */}
              <div className="form-group mt-3">
                <label><b>Grading Standard</b></label>
                <select 
                  value={gradeVal} 
                  onChange={e => setGradeVal(e.target.value)}
                  className="clean-input mt-1"
                >
                  <option value="Grade-A (FAQ)">Grade-A (FAQ - Fair Average Quality)</option>
                  <option value="Grade-B (Standard)">Grade-B (Standard)</option>
                  <option value="Sub-standard">Sub-standard (Requires Reconditioning)</option>
                </select>
              </div>

              {/* Inspector Remarks */}
              <div className="form-group mt-3">
                <label><b>Inspector Remarks</b></label>
                <input 
                  type="text" 
                  value={inspectionRemarks} 
                  onChange={e => setInspectionRemarks(e.target.value)} 
                  className="clean-input mt-1"
                />
              </div>
            </div>

            <div className="modal-actions-row mt-4">
              <button className="btn-cancel-red btn-modal-half" onClick={handleFail}>
                <XCircle size={16} /> Reject Lot
              </button>
              <button className="btn-dash-primary btn-modal-half" onClick={handlePass}>
                <CheckCircle2 size={16} /> Pass & Send to Scale
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
              <h3>Quality Lab Testing Desk Guide</h3>
              <button className="close-btn" onClick={() => setShowHelpModal(false)}><X size={18} /></button>
            </div>
            <div className="profile-verified-box mt-3 text-left">
              <h4>Testing Procedure:</h4>
              <p className="mt-1">1. Take physical grain sample from arrived vehicle.</p>
              <p className="mt-1">2. Measure moisture content using digital moisture meter (Max 12.0%).</p>
              <p className="mt-1">3. Measure foreign matter content (Max 1.0%).</p>
              <p className="mt-1">4. Enter values and click "Pass & Send to Scale" to dispatch vehicle to the electronic weighbridge.</p>
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
