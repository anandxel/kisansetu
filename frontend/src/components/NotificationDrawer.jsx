import React, { useState } from "react";
import { Bell, Smartphone, Mail, X, CheckCheck, RefreshCw, Send } from "lucide-react";

export function NotificationDrawer({ notifications, currentLang, onClear }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all, sms, email

  const filtered = notifications.filter(n => {
    if (activeTab === "all") return true;
    return n.type.toLowerCase() === activeTab;
  });

  return (
    <>
      {/* Floating Widget Button */}
      <button 
        className="floating-notif-btn" 
        onClick={() => setOpen(true)}
        title="Live Simulated SMS & Email Notifications"
      >
        <div className="notif-badge-wrap">
          <Smartphone size={20} />
          {notifications.length > 0 && <span className="notif-count">{notifications.length}</span>}
        </div>
        <span className="btn-text">Live SMS / Email Alerts</span>
      </button>

      {/* Slide-over Drawer / Modal */}
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="notif-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="notif-drawer-header">
              <div className="drawer-title">
                <div className="icon-badge"><Smartphone size={18} /></div>
                <div>
                  <h3>Simulated SMS & Email Dispatcher</h3>
                  <p>Real-time notifications sent to farmers in their language</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>

            <div className="drawer-tabs">
              <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
                All ({notifications.length})
              </button>
              <button className={activeTab === "sms" ? "active" : ""} onClick={() => setActiveTab("sms")}>
                <Smartphone size={14} /> SMS / WhatsApp ({notifications.filter(n => n.type === "SMS").length})
              </button>
              <button className={activeTab === "email" ? "active" : ""} onClick={() => setActiveTab("email")}>
                <Mail size={14} /> Email ({notifications.filter(n => n.type === "EMAIL").length})
              </button>
            </div>

            <div className="notif-list">
              {filtered.length === 0 ? (
                <div className="empty-notif">
                  <Mail size={32} />
                  <p>No notifications yet. Perform a booking, check-in, or weighing to trigger live SMS & emails!</p>
                </div>
              ) : (
                filtered.map((item) => (
                  <div key={item.id} className={`notif-card ${item.type.toLowerCase()}`}>
                    <div className="notif-card-head">
                      <span className={`notif-pill ${item.type.toLowerCase()}`}>
                        {item.type === "SMS" ? <Smartphone size={12} /> : <Mail size={12} />}
                        {item.type}
                      </span>
                      <span className="notif-to">To: <b>{item.recipient}</b> ({item.mobile})</span>
                      <span className="notif-time">{item.timestamp}</span>
                    </div>
                    <h4 className="notif-title">{item.title}</h4>
                    <div className="notif-body-box">
                      <p>{item.body}</p>
                    </div>
                    <div className="notif-footer">
                      <span className="status-delivered"><CheckCheck size={14} /> Delivered via Gov SMS Gateway (NIC)</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="drawer-footer">
              <button className="btn-subtle" onClick={onClear}>Clear History</button>
              <button className="btn-primary-small" onClick={() => setOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
