import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Languages, Check, X } from "lucide-react";
import { LANGUAGES } from "../constants";

export function LanguageSelector({ currentLang, onLangChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  const handleSelect = (code) => {
    onLangChange(code);
    try {
      localStorage.setItem("kks_lang", code);
    } catch (e) {}
    setIsOpen(false);
  };

  const modalContent = isOpen ? (
    <div className="modal-backdrop lang-modal-backdrop" onClick={() => setIsOpen(false)}>
      <div className="modal-card lang-picker-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Languages size={20} className="teal-text" />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Select Language / भाषा चुनें</h3>
          </div>
          <button 
            type="button" 
            className="close-btn" 
            onClick={() => setIsOpen(false)}
            aria-label="Close language selector"
          >
            <X size={18} />
          </button>
        </div>

        <div className="lang-picker-grid mt-3">
          {LANGUAGES.map((l) => {
            const isSelected = l.code === currentLang;
            return (
              <button
                key={l.code}
                type="button"
                className={`lang-option-btn ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelect(l.code)}
              >
                <div className="lang-text-col">
                  <span className="lang-native-name">{l.native}</span>
                  <span className="lang-english-name">{l.name}</span>
                </div>
                {isSelected && <Check size={16} className="lang-check-icon" />}
              </button>
            );
          })}
        </div>

        <div className="modal-btn-row mt-4" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <button 
            type="button" 
            className="btn-dash-primary" 
            onClick={() => setIsOpen(false)}
            style={{ width: "100%", justifyContent: "center", display: "flex" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button 
        type="button"
        className="mini-lang-pill" 
        onClick={() => setIsOpen(true)}
        title="Change Language / भाषा बदलें"
        aria-label="Change Language"
      >
        <Languages size={15} className="mini-lang-icon" />
        <span className="mini-lang-code">{current.initial}</span>
      </button>

      {typeof document !== "undefined" && modalContent
        ? createPortal(modalContent, document.body)
        : modalContent}
    </>
  );
}

export default LanguageSelector;
