import React, { useState } from "react";
import { 
  QrCode, Search, CheckCircle2, AlertCircle, Clock, 
  ArrowLeft, UserCheck, Smartphone, Check, LogOut, HelpCircle,
  Users, User, Sprout, CalendarDays, ShieldCheck, X
} from "lucide-react";
import { DynamicQRCode } from "./DynamicQRCode";

export function CheckInPortal({ 
  user = {}, 
  bookings = [], 
  centres = [],
  onCheckInFarmer, 
  onLogout 
}) {
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "checked_in" | "search"
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedBookingForPass, setSelectedBookingForPass] = useState(null);

  // Filter bookings for this officer's centre
  const centreBookings = bookings.filter(b => b.centreId === user.centreId || !user.centreId);
  const scheduledList = centreBookings.filter(b => b.status === "BOOKED");
  const checkedInList = centreBookings.filter(b => b.status !== "BOOKED" && b.status !== "CANCELLED");

  // Search Results
  const searchResults = searchQuery.trim() 
    ? centreBookings.filter(b => 
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.mobile.includes(searchQuery.trim())
      )
    : [];

  const handleConfirmCheckIn = (b) => {
    onCheckInFarmer(b.id);
    setSelectedBookingForPass(null);
  };

  return (
    <div className="dash-layout">
      {/* Mobile Top App Bar */}
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
              <Users size={19} />
              <span>Gate Arrivals Queue ({scheduledList.length})</span>
            </button>

            <button 
              className={`nav-btn ${activeTab === "checked_in" ? "active" : ""}`}
              onClick={() => { setActiveTab("checked_in"); setMobileNavOpen(false); }}
            >
              <CheckCircle2 size={19} />
              <span>Checked-In ({checkedInList.length})</span>
            </button>

            <button 
              className={`nav-btn ${activeTab === "search" ? "active" : ""}`}
              onClick={() => { setActiveTab("search"); setMobileNavOpen(false); }}
            >
              <Search size={19} />
              <span>Token Lookup</span>
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
            <span className="header-eyebrow">GATE CHECK-IN OFFICER • {user.centreName || "MANDI GATE"}</span>
            <h1 className="header-main-title">
              {activeTab === "queue" && "Today's Scheduled Arrivals"}
              {activeTab === "checked_in" && "Checked-In Vehicles"}
              {activeTab === "search" && "Token & Booking Lookup"}
            </h1>
          </div>

          <div className="header-actions-block">
            <div className="header-profile-pill">
              <div className="profile-avatar-circle">
                {(user.name || "Gate Officer").charAt(0)}
              </div>
              <div className="profile-meta-text">
                <span className="profile-name">{user.name || "Gate Officer"}</span>
                <span className="profile-id">{user.centreName || "Procurement Mandi"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* TAB 1: SCHEDULED ARRIVALS QUEUE */}
        {activeTab === "queue" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">PHYSICAL ARRIVAL & VERIFICATION</span>
                <h2 className="section-page-title">Today's Scheduled Arrivals</h2>
                <p className="section-page-desc">Verify arriving farmers and dispatch vehicles to the Quality Inspection Lab.</p>
              </div>
            </div>

            {/* Quick Summary Glass Cards */}
            <div className="dash-metrics-grid mt-2">
              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Clock size={20} className="tile-icon teal" />
                  <small>Awaiting Arrival</small>
                </div>
                <h3>{scheduledList.length} Farmers</h3>
                <span>Pending Check-in Today</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <CheckCircle2 size={20} className="tile-icon teal" />
                  <small>Processed Inside</small>
                </div>
                <h3>{checkedInList.length} Vehicles</h3>
                <span>Sent to Quality Lab</span>
              </div>

              <div className="metric-tile">
                <div className="metric-tile-top">
                  <Users size={20} className="tile-icon slate" />
                  <small>Total Appointments</small>
                </div>
                <h3>{centreBookings.length} Today</h3>
                <span>Scheduled Mandi Quota</span>
              </div>
            </div>

            {/* Live Scheduled Arrivals Table */}
            <div className="table-card mt-4">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Token / Booking ID</th>
                    <th>Farmer Name</th>
                    <th>Mobile</th>
                    <th>Crop</th>
                    <th>Expected Qty</th>
                    <th>Slot Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        All scheduled farmers for today have checked in!
                      </td>
                    </tr>
                  ) : (
                    scheduledList.map((b) => (
                      <tr key={b.id}>
                        <td><b>{b.id}</b></td>
                        <td>{b.farmerName}</td>
                        <td>{b.mobile}</td>
                        <td>{b.crop}</td>
                        <td>{b.expectedTonnes} Tonnes</td>
                        <td><b>{b.slotTime}</b></td>
                        <td>
                          <button 
                            className="btn-dash-primary btn-sm"
                            onClick={() => handleConfirmCheckIn(b)}
                          >
                            <Check size={14} /> Check In
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CHECKED-IN FARMERS */}
        {activeTab === "checked_in" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">INSIDE MANDI YARD</span>
                <h2 className="section-page-title">Checked-In Vehicles</h2>
                <p className="section-page-desc">Track farmers currently in Quality Inspection, Electronic Weighbridge, or completed.</p>
              </div>
            </div>

            <div className="table-card mt-3">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Farmer Name</th>
                    <th>Gate Arrival Time</th>
                    <th>Crop</th>
                    <th>Current Yard Stage</th>
                    <th>Digital QR Pass</th>
                  </tr>
                </thead>
                <tbody>
                  {checkedInList.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-4">No vehicles currently checked in.</td></tr>
                  ) : (
                    checkedInList.map((b) => (
                      <tr key={b.id}>
                        <td><b>{b.id}</b></td>
                        <td>{b.farmerName}</td>
                        <td>{b.checkInTime || "Recorded"}</td>
                        <td>{b.crop} ({b.expectedTonnes} T)</td>
                        <td>
                          <span className={`status-pill ${b.status.toLowerCase()}`}>
                            {b.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <button className="btn-dash-outline btn-sm" onClick={() => setSelectedBookingForPass(b)}>
                            <QrCode size={14} /> View Pass
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TOKEN SEARCH */}
        {activeTab === "search" && (
          <div className="dash-content-body">
            <div className="booking-page-header">
              <div>
                <span className="section-eyebrow">GATE SCANNER & LOOKUP</span>
                <h2 className="section-page-title">Token / Appointment Lookup</h2>
                <p className="section-page-desc">Search by Booking ID, Farmer Name, or Mobile Number for instant verification.</p>
              </div>
            </div>

            <div className="profile-verified-box mt-3">
              <div className="form-group">
                <label>Search by Booking ID, Farmer Name or Mobile Number</label>
                <div className="search-box-row mt-2" style={{ display: "flex", gap: "10px" }}>
                  <input 
                    type="text" 
                    placeholder="Enter Booking ID (e.g. B101) or mobile number..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="clean-input"
                  />
                  {searchQuery && (
                    <button className="btn-dash-outline" onClick={() => setSearchQuery("")}>Clear</button>
                  )}
                </div>
              </div>
            </div>

            {searchQuery && (
              <div className="table-card mt-4">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Farmer Name</th>
                      <th>Mobile</th>
                      <th>Crop</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-4">No matching bookings found for "{searchQuery}".</td></tr>
                    ) : (
                      searchResults.map((b) => (
                        <tr key={b.id}>
                          <td><b>{b.id}</b></td>
                          <td>{b.farmerName}</td>
                          <td>{b.mobile}</td>
                          <td>{b.crop}</td>
                          <td>
                            <span className={`status-pill ${b.status.toLowerCase()}`}>
                              {b.status.replace("_", " ")}
                            </span>
                          </td>
                          <td>
                            {b.status === "BOOKED" ? (
                              <button className="btn-dash-primary btn-sm" onClick={() => handleConfirmCheckIn(b)}>
                                <Check size={14} /> Check In
                              </button>
                            ) : (
                              <button className="btn-dash-outline btn-sm" onClick={() => setSelectedBookingForPass(b)}>
                                <QrCode size={14} /> View Pass
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIEW PASS MODAL */}
      {selectedBookingForPass && (
        <div className="modal-backdrop">
          <div className="modal-card text-center qr-modal-card">
            <div className="modal-head text-left">
              <h3>Verified Gate Pass</h3>
              <button className="close-btn" onClick={() => setSelectedBookingForPass(null)}><X size={18} /></button>
            </div>
            <div className="profile-verified-box text-left mt-2">
              <div className="sum-data-row"><span>Booking ID:</span> <b>{selectedBookingForPass.id}</b></div>
              <div className="sum-data-row"><span>Farmer:</span> <b>{selectedBookingForPass.farmerName}</b></div>
              <div className="sum-data-row"><span>Commodity:</span> <b>{selectedBookingForPass.crop} ({selectedBookingForPass.expectedTonnes} T)</b></div>
              <div className="sum-data-row"><span>Slot:</span> <b>{selectedBookingForPass.date} ({selectedBookingForPass.slotTime})</b></div>
              <div className="sum-data-row"><span>Status:</span> <b className="text-success">{selectedBookingForPass.status}</b></div>
            </div>
            <div className="qr-centered-container mt-3">
              <DynamicQRCode value={selectedBookingForPass.id} payloadData={selectedBookingForPass} size={150} />
              <small className="qr-label-sub">Official Digital Mandi Token ID: {selectedBookingForPass.id}</small>
            </div>
            <button className="btn-dash-primary w-full mt-4" onClick={() => setSelectedBookingForPass(null)}>
              Close Pass
            </button>
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
              <h3>Mandi Gate Check-in Desk Guide</h3>
              <button className="close-btn" onClick={() => setShowHelpModal(false)}><X size={18} /></button>
            </div>
            <div className="profile-verified-box mt-3 text-left">
              <h4>Operating Procedure:</h4>
              <p className="mt-1">1. Verify physical tractor/trolley arrival at Mandi Gate entrance.</p>
              <p className="mt-1">2. Search farmer's Booking ID or scan their digital QR Gate Pass.</p>
              <p className="mt-1">3. Click "Check In" to stamp arrival time and automatically move the farmer into the Quality Testing queue.</p>
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
