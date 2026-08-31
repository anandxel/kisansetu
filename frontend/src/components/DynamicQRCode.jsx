import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, RefreshCw, CheckCircle2, ExternalLink } from "lucide-react";

/**
 * Authentic Dynamic QR Code Generator Component
 * Generates dynamic, high-contrast, verifiable QR codes using the qrcode engine.
 * Encodes standard verifiable URL recognized by all mobile phone cameras & optical scanners.
 */
export function DynamicQRCode({ 
  value, 
  size = 170, 
  title = "Appointment Token",
  subtitle,
  payloadData = null 
}) {
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [encodedUrl, setEncodedUrl] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function generateQR() {
      setLoading(true);
      setError(false);
      try {
        let contentToEncode = "";

        if (payloadData && typeof payloadData === "object") {
          const bId = payloadData.id || payloadData.bookingId || value || "KKS-PASS";
          const fName = payloadData.farmerName || "Kisan Citizen";
          const crop = payloadData.crop || "Wheat";
          const date = payloadData.date || new Date().toISOString().split("T")[0];
          const slot = payloadData.slotTime || "10:00 AM";
          const centre = payloadData.centreName || "Procurement Mandi";
          const tonnes = payloadData.expectedTonnes || payloadData.actualWeightTonnes || "5.0";

          // Standard universal URL recognized instantly by Apple Camera, Google Lens, Samsung Camera, and QR apps
          contentToEncode = `https://kisansetu.gov.in/pass?id=${encodeURIComponent(bId)}&farmer=${encodeURIComponent(fName)}&crop=${encodeURIComponent(crop)}&qty=${encodeURIComponent(tonnes)}T&date=${encodeURIComponent(date)}&slot=${encodeURIComponent(slot)}&centre=${encodeURIComponent(centre)}`;
        } else if (typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"))) {
          contentToEncode = value;
        } else {
          const tokenStr = String(value || "KKS-PASS-001");
          contentToEncode = `https://kisansetu.gov.in/pass?id=${encodeURIComponent(tokenStr)}`;
        }

        if (isMounted) {
          setEncodedUrl(contentToEncode);
        }

        // Generate high-contrast, easily scannable QR Code
        const url = await QRCode.toDataURL(contentToEncode, {
          errorCorrectionLevel: "M", // Medium (15%) - gives clean, large, distinct blocks
          type: "image/png",
          quality: 1.0,
          margin: 2, // Ample quiet zone margin for camera autofocus
          width: Math.max(300, size * 2), // High pixel density for sharp rendering
          color: {
            dark: "#000000", // Pure black for maximum optical contrast
            light: "#ffffff"  // Pure crisp white background
          }
        });

        if (isMounted) {
          setDataUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.error("QR Code generation error:", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    generateQR();

    return () => {
      isMounted = false;
    };
  }, [value, size, payloadData]);

  if (loading) {
    return (
      <div className="dynamic-qr-container" style={{ width: size, height: size }}>
        <div className="qr-loading-box">
          <RefreshCw size={24} className="animate-spin text-teal" />
          <small>Generating QR...</small>
        </div>
      </div>
    );
  }

  if (error || !dataUrl) {
    return (
      <div className="dynamic-qr-container" style={{ width: size, height: size }}>
        <div className="qr-error-box">
          <QrCode size={28} className="text-muted" />
          <small>QR Error</small>
        </div>
      </div>
    );
  }

  return (
    <div className="dynamic-qr-wrapper" style={{ maxWidth: size + 20, margin: "0 auto", textAlign: "center" }}>
      <div 
        className="dynamic-qr-frame"
        style={{ 
          background: "#ffffff", 
          padding: "8px", 
          borderRadius: "8px", 
          border: "2px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          display: "inline-block"
        }}
      >
        <img 
          src={dataUrl} 
          alt={`QR Code: ${title || value}`} 
          width={size} 
          height={size}
          style={{ display: "block", width: `${size}px`, height: `${size}px` }}
          className="dynamic-qr-image"
        />
      </div>
      {subtitle && (
        <span className="dynamic-qr-subtitle" style={{ display: "block", marginTop: "6px", fontSize: "11px", color: "#64748b" }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}

export default DynamicQRCode;
