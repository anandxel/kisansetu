import React, { useState, useEffect } from "react";
import { 
  Scale, Activity, Users, Clock, 
  CheckCircle2, ArrowLeft, Building2, Sprout
} from "lucide-react";

export function DisplayBoard({ 
  centres, 
  bookings, 
  onClose 
}) {
  const [activeCentreId, setActiveCentreId] = useState(centres[0]?.id || "C001");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const centre = centres.find(c => c.id === activeCentreId) || centres[0];
  const centreBookings = bookings.filter(b => b.centreId === centre.id);

  const qualityWaitingList = centreBookings.filter(b => b.status === "QUALITY_WAITING");
  const weighingList = centreBookings.filter(b => b.status === "WEIGHING_PROCESS");
  const checkedInCount = centreBookings.filter(b => b.status !== "BOOKED").length;
  const completedCount = centreBookings.filter(b => b.status === "PROCUREMENT_COMPLETED" || b.status === "PAYMENT_INITIATED").length;

  const formattedDate = currentDateTime.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  const formattedTime = currentDateTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  return (
    <div className="display-board-screen">
      {/* Top TV Screen Header */}
      <div className="display-top-bar">
        <div className="display-brand">
          <div className="mandi-gov-badge">
            <Sprout size={24} />
          </div>
          <div>
            <h1>{centre.name} • Live Mandi Display</h1>
            <p>District: {centre.district} ({centre.state}) • MSP Procurement Hub</p>
          </div>
        </div>

        <div className="display-clock-controls">
          <div className="centre-switcher-tv">
            <label>Select Mandi:</label>
            <select value={activeCentreId} onChange={e => setActiveCentreId(e.target.value)}>
              {centres.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="live-clock-badge">
            <span className="live-tag-pill">LIVE</span>
            <div className="clock-text-wrap">
              <span className="clock-time">{formattedTime}</span>
              <small className="clock-date">{formattedDate}</small>
            </div>
          </div>

          <button className="btn-close-display" onClick={onClose}>
            <ArrowLeft size={16} /> Exit Display
          </button>
        </div>
      </div>

      {/* Hero Live Token Callouts */}
      <div className="display-callout-row">
        <div className="tv-callout-card quality-callout">
          <div className="callout-head">
            <Activity size={20} />
            <span>NOW SERVING: QUALITY INSPECTION</span>
          </div>
          <div className="token-huge-display">
            {qualityWaitingList.length > 0 ? (
              <>
                <b>Token #1: {qualityWaitingList[0].farmerName}</b>
                <small>Booking: {qualityWaitingList[0].id} • Gate 2</small>
              </>
            ) : (
              <span className="standby-text">Inspection Room Ready</span>
            )}
          </div>
        </div>

        <div className="tv-callout-card weighing-callout">
          <div className="callout-head">
            <Scale size={20} />
            <span>NOW SERVING: WEIGHBRIDGE 1</span>
          </div>
          <div className="token-huge-display">
            {weighingList.length > 0 ? (
              <>
                <b>Token #1: {weighingList[0].farmerName}</b>
                <small>Booking: {weighingList[0].id} • Scale 1</small>
              </>
            ) : (
              <span className="standby-text">Weighbridge Ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="tv-metrics-grid">
        <div className="tv-metric-tile">
          <small>REMAINING CAPACITY</small>
          <h3>{centre.dailyCapacityTonnes - centre.reservedTonnes} Tonnes</h3>
          <span>Total Declared: {centre.dailyCapacityTonnes} T</span>
        </div>

        <div className="tv-metric-tile">
          <small>CHECKED IN</small>
          <h3>{checkedInCount} Farmers</h3>
          <span>Arrival verified</span>
        </div>

        <div className="tv-metric-tile">
          <small>IN QUEUE</small>
          <h3>{qualityWaitingList.length} Farmers</h3>
          <span>Est. Wait: ~{qualityWaitingList.length * 8} Mins</span>
        </div>

        <div className="tv-metric-tile">
          <small>COMPLETED</small>
          <h3>{completedCount} Lots</h3>
          <span>Receipts issued</span>
        </div>
      </div>

      {/* Live Table for Waiting Farmers */}
      <div className="tv-table-section">
        <h3>Live Queue Order (Quality Testing & Weighbridge)</h3>
        <table className="tv-table">
          <thead>
            <tr>
              <th>Queue Position</th>
              <th>Farmer Name</th>
              <th>Commodity</th>
              <th>Expected Quantity</th>
              <th>Current Stage</th>
              <th>Estimated Turn</th>
            </tr>
          </thead>
          <tbody>
            {centreBookings.filter(b => b.status === "QUALITY_WAITING" || b.status === "WEIGHING_PROCESS").length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4">No farmers currently waiting in queue.</td></tr>
            ) : (
              centreBookings.filter(b => b.status === "QUALITY_WAITING" || b.status === "WEIGHING_PROCESS").map((b, idx) => (
                <tr key={b.id} className={idx === 0 ? "highlight-row" : ""}>
                  <td><b className="token-tag">#{idx + 1}</b></td>
                  <td><b>{b.farmerName}</b></td>
                  <td>{b.crop}</td>
                  <td>{b.expectedTonnes} Tonnes</td>
                  <td>
                    <span className={`status-pill ${b.status.toLowerCase()}`}>
                      {b.status === "QUALITY_WAITING" ? "In Quality Queue" : "In Weighing Queue"}
                    </span>
                  </td>
                  <td><b>~{idx * 8 + 5} Mins</b></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
