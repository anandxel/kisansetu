/**
 * KisanSaathi Frontend API Client
 * Exclusively communicates with the Express Backend (which interfaces with Supabase DB)
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Helper for safe JSON fetch
async function apiRequest(endpoint, method = "GET", body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json"
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`API [${method} ${endpoint}] Notice:`, error.message);
    return null;
  }
}

// 1. Health & Status
export async function apiGetHealth() {
  return await apiRequest("/api/health");
}

// 2. Auth & Login (Backend Database Handshake)
export async function apiLoginFarmer({ mobile, password }) {
  return await apiRequest("/api/auth/login-farmer", "POST", { mobile, password });
}

export async function apiLoginOfficial({ officialId, password, role, centreId }) {
  return await apiRequest("/api/auth/login-official", "POST", { officialId, password, role, centreId });
}

export async function apiRequestAadhaarOtp(aadhaar) {
  return await apiRequest("/api/auth/aadhaar-otp", "POST", { aadhaar });
}

export async function apiVerifyAadhaarOtp(aadhaar, code, phone) {
  return await apiRequest("/api/auth/verify-aadhaar-otp", "POST", { aadhaar, code, phone });
}

export async function apiSendSmsOtp(phone) {
  return await apiRequest("/api/auth/send-sms-otp", "POST", { phone });
}

export async function apiVerifySmsOtp(phone, code) {
  return await apiRequest("/api/auth/verify-sms-otp", "POST", { phone, code });
}

export async function apiResetPassword({ identifier, otp, newPassword, role }) {
  return await apiRequest("/api/auth/reset-password", "POST", { identifier, otp, newPassword, role });
}

export async function apiRegisterFarmer(farmerData) {
  return await apiRequest("/api/auth/register-farmer", "POST", farmerData);
}

export async function apiUpdateFarmerBank(farmerId, bankData) {
  return await apiRequest("/api/auth/update-bank", "POST", { farmerId, bankData });
}

// 3. Procurement Centres
export async function apiFetchCentres() {
  return await apiRequest("/api/centres");
}

export async function apiCreateCentre(centreData) {
  return await apiRequest("/api/centres", "POST", centreData);
}

// 4. Land Parcels & AgriStack
export async function apiFetchFarmerLands(farmerId) {
  return await apiRequest(`/api/lands/${farmerId}`);
}

export async function apiSyncAgriStackLands(aadhaar) {
  return await apiRequest(`/api/lands/agristack/${aadhaar}`);
}

export async function apiSubmitLandParcel(parcel) {
  return await apiRequest("/api/lands/submit", "POST", parcel);
}

export async function apiVerifyLandParcel(landId, verified) {
  return await apiRequest(`/api/lands/${landId}/verify`, "PUT", { verified });
}

// 5. Bookings & Mandi Queue
export async function apiFetchBookings() {
  return await apiRequest("/api/bookings");
}

export async function apiCreateBooking(booking) {
  return await apiRequest("/api/bookings", "POST", booking);
}

export async function apiUpdateBookingStatus(bookingId, updates) {
  return await apiRequest(`/api/bookings/${bookingId}/status`, "PUT", updates);
}

// 6. Authentic QR Code Generation
export async function apiGenerateQRCode(bookingData) {
  return await apiRequest("/api/qr/generate", "POST", bookingData);
}

// 7. Official Accounts & Hierarchy Management
export async function apiCreateOfficial(officialData) {
  return await apiRequest("/api/officials/create", "POST", officialData);
}

export async function apiUpdateOfficial(officialId, updates) {
  return await apiRequest(`/api/officials/${officialId}`, "PUT", updates);
}

export async function apiDeleteOfficial(officialId) {
  return await apiRequest(`/api/officials/${officialId}`, "DELETE");
}

export async function apiFetchCentreOfficials(centreId) {
  return await apiRequest(`/api/officials/${centreId}`);
}

export async function apiFetchAllOfficials() {
  return await apiRequest("/api/officials");
}
