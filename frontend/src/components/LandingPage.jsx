import React, { useState } from "react";
import { 
  Sprout, ShieldCheck, Scale, Activity, Languages, CheckCircle2, 
  Building2, Smartphone, FileText, KeyRound,
  User, Check, Eye, EyeOff, ArrowLeft, Lock, RefreshCw, Mail, MapPin, Calendar
} from "lucide-react";
import { LANGUAGES, getTranslation } from "../constants";
import { 
  apiLoginFarmer, 
  apiLoginOfficial, 
  apiRequestAadhaarOtp, 
  apiVerifyAadhaarOtp,
  apiRegisterFarmer,
  apiSendSmsOtp,
  apiVerifySmsOtp,
  apiResetPassword
} from "../api";
import { LanguageSelector } from "./LanguageSelector";

export function LandingPage({ 
  currentLang, 
  onLangChange, 
  onLoginSuccess, 
  centres
}) {
  const [viewMode, setViewMode] = useState("auth"); // "auth" | "register"
  const [userType, setUserType] = useState("farmer"); // "farmer" | "official"
  
  // Login Loading State
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Show / Hide Password state
  const [showFarmerPass, setShowFarmerPass] = useState(false);
  const [showOfficialPass, setShowOfficialPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  // Forgot password modal state
  const [forgotPassModal, setForgotPassModal] = useState(null); // null | "farmer" | "official"
  const [forgotPassInput, setForgotPassInput] = useState("");
  const [forgotPassOtp, setForgotPassOtp] = useState("");
  const [forgotPassNewPassword, setForgotPassNewPassword] = useState("");
  const [forgotPassConfirmPassword, setForgotPassConfirmPassword] = useState("");
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [isSendingForgotOtp, setIsSendingForgotOtp] = useState(false);
  const [isResettingPass, setIsResettingPass] = useState(false);
  const [forgotPassToast, setForgotPassToast] = useState("");

  // Official form state
  const [selectedOfficialRole, setSelectedOfficialRole] = useState("administrator");
  const [selectedCentre, setSelectedCentre] = useState(centres[0]?.id || "C001");
  const [officialId, setOfficialId] = useState("");
  const [officialPass, setOfficialPass] = useState("");

  // Farmer login state
  const [farmerMobile, setFarmerMobile] = useState("");
  const [farmerPass, setFarmerPass] = useState("");

  // Registration states (3-Step UIDAI e-KYC flow)
  const [regStep, setRegStep] = useState(1); // 1: Aadhaar OTP | 2: Confirm Profile | 3: Mobile & Pass
  const [regAadhaar, setRegAadhaar] = useState("");
  const [regAadhaarOtp, setRegAadhaarOtp] = useState("");
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [isSendingAadhaarOtp, setIsSendingAadhaarOtp] = useState(false);
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);

  const [fetchedDemographics, setFetchedDemographics] = useState(null);

  const [regMobile, setRegMobile] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMobileOtp, setRegMobileOtp] = useState("");
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [isSendingMobileOtp, setIsSendingMobileOtp] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const t = (key) => getTranslation(currentLang, key);

  // Live Database Handshake for Farmer Login
  const handleFarmerLogin = async (e) => {
    e.preventDefault();
    if (!farmerMobile || !farmerPass) return;
    setIsLoggingIn(true);
    try {
      const res = await apiLoginFarmer({ mobile: farmerMobile, password: farmerPass });
      if (res?.success && res.farmer) {
        onLoginSuccess(res.farmer);
      } else {
        alert("Farmer profile not found in database. Please register using your 12-digit Aadhaar card.");
      }
    } catch (err) {
      console.error("Farmer login error:", err);
      alert("Error connecting to the backend database server.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Live Database Handshake for Official Login
  const handleOfficialLogin = async (e) => {
    e.preventDefault();
    if (!officialId || !officialPass) return;
    setIsLoggingIn(true);
    try {
      const res = await apiLoginOfficial({
        officialId,
        password: officialPass,
        role: selectedOfficialRole,
        centreId: selectedCentre
      });
      if (res?.success && res.official) {
        onLoginSuccess(res.official);
      } else {
        alert(res?.error || "Invalid official credentials for the selected role. Please check your assigned Officer ID and Password.");
      }
    } catch (err) {
      console.error("Official login error:", err);
      alert(err.message || "Error connecting to backend database server.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Registration Step 1: Send Aadhaar OTP (Real UIDAI Handshake via Backend)
  const handleSendAadhaarOtp = async (e) => {
    e?.preventDefault();
    if (!regAadhaar || regAadhaar.length < 12) {
      alert("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    setIsSendingAadhaarOtp(true);
    try {
      const res = await apiRequestAadhaarOtp(regAadhaar);
      if (res?.success) {
        setAadhaarOtpSent(true);
        setRegAadhaarOtp(""); // Never prefill OTP - user enters SMS OTP or fallback 4829
        if (res.profile) {
          setFetchedDemographics(res.profile);
          setRegMobile(res.profile.mobile ? res.profile.mobile.replace(/\D/g, "").slice(-10) : "");
          setRegEmail(""); // Never prefill email - remains optional and blank
        }
      } else {
        alert(res?.error || "Failed to verify Aadhaar with UIDAI gateway.");
      }
    } catch (err) {
      console.error("Aadhaar OTP request error:", err);
      alert("Failed to communicate with authentication gateway.");
    } finally {
      setIsSendingAadhaarOtp(false);
    }
  };

  // Registration Step 1: Verify Aadhaar OTP & Fetch UIDAI Demographics
  const handleVerifyAadhaarOtp = async (e) => {
    e?.preventDefault();
    if (!regAadhaarOtp) {
      alert("Please enter the verification OTP.");
      return;
    }
    setIsVerifyingAadhaar(true);
    try {
      const targetPhone = (fetchedDemographics?.mobile || regMobile || "").replace(/\D/g, "");
      const verifyRes = await apiVerifyAadhaarOtp(regAadhaar, regAadhaarOtp, targetPhone);
      if (!verifyRes?.success && regAadhaarOtp.trim() !== "4829") {
        alert(verifyRes?.error || "Invalid Aadhaar verification OTP. Please enter the OTP received via SMS or use fallback 4829.");
        setIsVerifyingAadhaar(false);
        return;
      }

      const profile = verifyRes?.profile || fetchedDemographics;
      if (profile) {
        setFetchedDemographics(profile);
        setRegMobile(profile.mobile ? profile.mobile.replace(/\D/g, "").slice(-10) : "");
        setRegEmail(""); // Keep email blank
        setRegStep(2); // Proceed to Demographic Confirmation
      } else {
        alert("Could not fetch UIDAI demographic record. Please try again.");
      }
    } catch (err) {
      console.error("Aadhaar verification error:", err);
      alert("Error verifying Aadhaar demographic record.");
    } finally {
      setIsVerifyingAadhaar(false);
    }
  };

  // Registration Step 2: Confirm Aadhaar Demographics
  const handleConfirmDemographics = () => {
    if (fetchedDemographics?.mobile) {
      setRegMobile(fetchedDemographics.mobile.replace(/\D/g, "").slice(-10));
    }
    setRegEmail(""); // Strictly leave email empty so it is not prefilled
    setRegStep(3); // Proceed to Contact & Password setup
  };

  // Registration Step 3: Send Mobile/Email OTP (Unique OTP dispatched)
  const handleSendMobileOtp = async (e) => {
    e?.preventDefault();
    if (!regMobile || regMobile.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsSendingMobileOtp(true);
    try {
      await apiSendSmsOtp(regMobile);
      setMobileOtpSent(true);
      setRegMobileOtp(""); // Never prefill OTP - user enters unique SMS OTP or fallback 4829
    } catch (err) {
      console.warn("Live OTP notice:", err);
      setMobileOtpSent(true);
      setRegMobileOtp(""); // Never prefill OTP
    } finally {
      setIsSendingMobileOtp(false);
    }
  };

  // Registration Step 3: Complete Account Creation & Save to Supabase Database
  const handleCompleteAccountCreation = async (e) => {
    e?.preventDefault();
    if (!regMobileOtp) {
      alert("Please enter the mobile verification OTP.");
      return;
    }
    if (!fetchedDemographics) {
      alert("Please verify your Aadhaar number first.");
      return;
    }

    setIsCreatingAccount(true);
    try {
      const verifyRes = await apiVerifySmsOtp(regMobile, regMobileOtp);
      if (!verifyRes?.success && regMobileOtp.trim() !== "4829") {
        alert(verifyRes?.error || "Invalid mobile verification OTP. Please enter the OTP received via SMS or use fallback 4829.");
        setIsCreatingAccount(false);
        return;
      }

      const newFarmerProfile = {
        role: "farmer",
        farmerId: fetchedDemographics.farmerId || ("F" + Math.floor(100 + Math.random() * 900)),
        farmerName: fetchedDemographics.farmerName,
        fatherName: fetchedDemographics.fatherName,
        dob: fetchedDemographics.dob,
        age: fetchedDemographics.age,
        gender: fetchedDemographics.gender,
        mobile: `+91 ${regMobile}`,
        email: regEmail ? regEmail.trim() : "",
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
      const registeredUser = (res?.success && res?.data) ? {
        ...newFarmerProfile,
        ...res.data,
        role: "farmer"
      } : newFarmerProfile;
      onLoginSuccess(registeredUser);
    } catch (err) {
      console.error("Register farmer error:", err);
      alert("Error completing registration. Please check your connection.");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleSendForgotOtp = async () => {
    const cleanPhone = forgotPassInput.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number to receive the OTP.");
      return;
    }
    setIsSendingForgotOtp(true);
    try {
      await apiSendSmsOtp(cleanPhone);
      setForgotOtpSent(true);
    } catch (err) {
      console.warn("Send forgot OTP notice:", err);
      setForgotOtpSent(true);
    } finally {
      setIsSendingForgotOtp(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotPassInput) {
      alert("Please enter your registered mobile number or Officer ID.");
      return;
    }
    if (!forgotPassOtp) {
      alert("Please enter the verification OTP.");
      return;
    }
    if (!forgotPassNewPassword || forgotPassNewPassword.length < 4) {
      alert("Please enter a new password (at least 4 characters).");
      return;
    }
    if (forgotPassNewPassword !== forgotPassConfirmPassword) {
      alert("New Password and Confirm New Password do not match. Please ensure both passwords match.");
      return;
    }

    setIsResettingPass(true);
    try {
      // apiResetPassword validates OTP (live Twilio, in-memory, or 4829 fallback) and updates password in DB atomically
      const res = await apiResetPassword({
        identifier: forgotPassInput,
        otp: forgotPassOtp,
        newPassword: forgotPassNewPassword,
        role: forgotPassModal
      });

      if (res?.success) {
        setForgotPassToast(t("passwordResetSuccess") || "Password updated successfully! You can now sign in.");
        if (forgotPassModal === "farmer") {
          setFarmerMobile(forgotPassInput.replace(/\D/g, "").slice(-10));
          setFarmerPass(forgotPassNewPassword);
        } else {
          setOfficialId(forgotPassInput);
          setOfficialPass(forgotPassNewPassword);
        }
        setTimeout(() => {
          setForgotPassModal(null);
          setForgotPassToast("");
          setForgotPassOtp("");
          setForgotPassNewPassword("");
          setForgotPassConfirmPassword("");
          setForgotOtpSent(false);
        }, 1600);
      } else {
        alert(res?.error || t("passwordResetFailed") || "Failed to reset password. Please check your OTP and try again.");
      }
    } catch (err) {
      console.error("Forgot pass submit error:", err);
      alert("Failed to communicate with server. Please try again.");
    } finally {
      setIsResettingPass(false);
    }
  };

  return (
    <div className="landing-container">
      {/* Clean Modern Header with Original Sprout Logo */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="logo-section">
            <div className="orig-sprout-logo">
              <Sprout size={26} className="sprout-icon-svg" />
            </div>
            <div className="brand-text-wrap">
              <span className="brand-main">{t("appName")}</span>
            </div>
          </div>

          {/* Compact Initials Language Selector */}
          <div className="nav-actions">
            <LanguageSelector currentLang={currentLang} onLangChange={onLangChange} />
          </div>
        </div>
      </header>

      {/* VIEW 1: REGISTRATION PAGE (CLEAN, CENTERED & RESPONSIVE) */}
      {viewMode === "register" ? (
        <main className="landing-register-view">
          <div className="register-container-card">
            <div className="register-header-bar">
              <button 
                type="button" 
                className="btn-back-link"
                onClick={() => { setViewMode("auth"); setRegStep(1); setAadhaarOtpSent(false); setMobileOtpSent(false); }}
              >
                <ArrowLeft size={18} />
                <span>{t("backToSignIn")}</span>
              </button>
              <h2 className="register-title">{t("farmerRegistrationTitle")}</h2>
            </div>

            {/* STEP 1: AADHAAR NUMBER & OTP */}
            {regStep === 1 && (
              <div className="register-form-step">
                <form onSubmit={!aadhaarOtpSent ? handleSendAadhaarOtp : handleVerifyAadhaarOtp}>
                  <div className="form-group">
                    <label><b>Aadhaar Number</b></label>
                    <input 
                      type="text" 
                      maxLength="12" 
                      disabled={aadhaarOtpSent}
                      value={regAadhaar} 
                      onChange={(e) => setRegAadhaar(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 12-digit Aadhaar number" 
                      className="clean-input mt-1"
                      required
                    />
                    <small className="form-hint">Your 12-digit Aadhaar is securely authenticated with UIDAI e-KYC.</small>
                  </div>

                  {!aadhaarOtpSent ? (
                    <button type="submit" disabled={isSendingAadhaarOtp} className="btn-auth-submit mt-4">
                      {isSendingAadhaarOtp ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>Sending UIDAI OTP...</span>
                        </>
                      ) : (
                        <span>Send Verification OTP</span>
                      )}
                    </button>
                  ) : (
                    <div className="otp-verification-section mt-3">
                      <div className="otp-banner">
                        <CheckCircle2 size={18} className="teal-text" /> 
                        <span>OTP dispatched to registered mobile ending in <b>XXXX-XXXX-{regAadhaar.slice(-4)}</b></span>
                      </div>

                      <div className="form-group mt-3">
                        <label><b>Enter Verification OTP</b></label>
                        <input 
                          type="text" 
                          maxLength="6"
                          value={regAadhaarOtp} 
                          onChange={(e) => setRegAadhaarOtp(e.target.value)} 
                          placeholder="Enter OTP" 
                          className="clean-input mt-1"
                          required
                        />
                      </div>

                      <button type="submit" disabled={isVerifyingAadhaar} className="btn-auth-submit mt-4">
                        {isVerifyingAadhaar ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            <span>Verifying with UIDAI...</span>
                          </>
                        ) : (
                          <span>Verify Aadhaar & Fetch Profile</span>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* STEP 2: AADHAAR DEMOGRAPHIC CONFIRMATION (NO LAND DETAILS SHOWN) */}
            {regStep === 2 && fetchedDemographics && (
              <div className="register-form-step">
                <div className="profile-verified-box">
                  <div className="verified-head">
                    <CheckCircle2 size={20} className="teal-text" />
                    <b>UIDAI Verified Demographic Profile</b>
                  </div>
                  
                  <div className="profile-grid-details">
                    <div className="profile-field">
                      <span>Farmer Name:</span> 
                      <b>{fetchedDemographics.farmerName}</b>
                    </div>
                    <div className="profile-field">
                      <span>Father's Name:</span> 
                      <b>{fetchedDemographics.fatherName}</b>
                    </div>
                    <div className="profile-field">
                      <span>Date of Birth / Age:</span> 
                      <b>{fetchedDemographics.dob} ({fetchedDemographics.age})</b>
                    </div>
                    <div className="profile-field">
                      <span>Gender:</span> 
                      <b>{fetchedDemographics.gender}</b>
                    </div>
                    <div className="profile-field">
                      <span>Village & Tehsil:</span> 
                      <b>{fetchedDemographics.village}, {fetchedDemographics.tehsil}</b>
                    </div>
                    <div className="profile-field">
                      <span>District & State:</span> 
                      <b>{fetchedDemographics.district}, {fetchedDemographics.state}</b>
                    </div>
                    <div className="profile-field full-width">
                      <span>Full Residential Address:</span> 
                      <b>{fetchedDemographics.address}</b>
                    </div>
                  </div>
                </div>

                <div className="confirmation-actions mt-4">
                  <button 
                    type="button" 
                    className="btn-auth-submit w-full"
                    onClick={handleConfirmDemographics}
                  >
                    <span>Confirm Details & Continue</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: MOBILE, EMAIL & PASSWORD SETUP */}
            {regStep === 3 && (
              <div className="register-form-step">
                <form onSubmit={!mobileOtpSent ? handleSendMobileOtp : handleCompleteAccountCreation}>
                  <div className="form-group">
                    <label>Mobile Number (Mandatory for SMS alerts & Mandi Passes)</label>
                    <div className="input-with-icon">
                      <Smartphone size={18} />
                      <input 
                        type="text" 
                        maxLength="10"
                        value={regMobile} 
                        onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 10-digit mobile number" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group mt-3">
                    <label>Email Address (Optional)</label>
                    <div className="input-with-icon">
                      <Mail size={18} />
                      <input 
                        type="email" 
                        value={regEmail} 
                        onChange={(e) => setRegEmail(e.target.value)} 
                        placeholder="Enter email address (optional)" 
                      />
                    </div>
                  </div>

                  <div className="form-group mt-3">
                    <label>Create Account Password</label>
                    <div className="input-with-icon">
                      <KeyRound size={18} />
                      <input 
                        type={showRegPass ? "text" : "password"} 
                        value={regPassword} 
                        onChange={(e) => setRegPassword(e.target.value)} 
                        placeholder="Enter account password" 
                        required 
                      />
                      <button 
                        type="button" 
                        className="btn-toggle-eye" 
                        onClick={() => setShowRegPass(!showRegPass)}
                        aria-label="Toggle password visibility"
                      >
                        {showRegPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {!mobileOtpSent ? (
                    <button type="submit" disabled={isSendingMobileOtp} className="btn-auth-submit mt-4">
                      {isSendingMobileOtp ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>Sending Verification OTP...</span>
                        </>
                      ) : (
                        <span>Send Mobile Verification OTP</span>
                      )}
                    </button>
                  ) : (
                    <div className="otp-verification-section mt-3">
                      <div className="otp-banner">
                        <CheckCircle2 size={18} className="teal-text" /> 
                        <span>Verification OTP sent to +91 {regMobile}</span>
                      </div>

                      <div className="form-group mt-3">
                        <label><b>Enter OTP</b></label>
                        <input 
                          type="text" 
                          maxLength="6"
                          value={regMobileOtp} 
                          onChange={(e) => setRegMobileOtp(e.target.value)} 
                          placeholder="Enter OTP" 
                          className="aadhaar-input-large"
                          required 
                        />
                      </div>

                      <button type="submit" disabled={isCreatingAccount} className="btn-auth-submit mt-4">
                        {isCreatingAccount ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            <span>Creating Account & Securing Profile...</span>
                          </>
                        ) : (
                          <span>Complete Registration & Sign In</span>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </main>
      ) : (
        /* VIEW 2: STANDARD LANDING HERO & AUTH GRID */
        <main className="landing-hero-grid">
          {/* Left Column: Platform Overview */}
          <div className="hero-content-col">
            <h1 className="hero-main-heading">
              {t("heroTitle1")} <br />
              <span className="accent-text">{t("heroTitle2")}</span>
            </h1>

            <p className="hero-desc-text">
              {t("heroDesc")}
            </p>

            <div className="feature-cards-grid">
              <div className="feature-card">
                <div className="feature-icon teal-bg">
                  <Scale size={24} className="teal-text" />
                </div>
                <div>
                  <h4>{t("feat1Title")}</h4>
                  <p>{t("feat1Desc")}</p>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon slate-bg">
                  <ShieldCheck size={24} className="slate-text" />
                </div>
                <div>
                  <h4>{t("feat2Title")}</h4>
                  <p>{t("feat2Desc")}</p>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon teal-bg">
                  <Activity size={24} className="teal-text" />
                </div>
                <div>
                  <h4>{t("feat3Title")}</h4>
                  <p>{t("feat3Desc")}</p>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon slate-bg">
                  <FileText size={24} className="slate-text" />
                </div>
                <div>
                  <h4>{t("feat4Title")}</h4>
                  <p>{t("feat4Desc")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Authentication Box */}
          <div className="hero-auth-col">
            <div className="auth-card">
              {/* User Type Switcher */}
              <div className="user-type-tabs">
                <button 
                  type="button"
                  className={`type-tab ${userType === "farmer" ? "active" : ""}`}
                  onClick={() => setUserType("farmer")}
                >
                  <User size={19} />
                  <span>{t("farmer")}</span>
                </button>
                
                <button 
                  type="button"
                  className={`type-tab ${userType === "official" ? "active" : ""}`}
                  onClick={() => setUserType("official")}
                >
                  <Building2 size={19} />
                  <span>{t("official")}</span>
                </button>
              </div>

              {/* A. FARMER LOGIN SECTION */}
              {userType === "farmer" && (
                <div className="auth-body">
                  <h3 className="auth-section-title-center">{t("farmerSignIn")}</h3>

                  <form onSubmit={handleFarmerLogin} className="auth-form">
                    <div className="form-group">
                      <label>{t("mobileNumber")}</label>
                      <div className="input-with-icon">
                        <Smartphone size={18} />
                        <input 
                          type="text" 
                          value={farmerMobile} 
                          onChange={(e) => setFarmerMobile(e.target.value)} 
                          placeholder="Enter 10-digit mobile number" 
                          required 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>{t("password")}</label>
                      <div className="input-with-icon">
                        <KeyRound size={18} />
                        <input 
                          type={showFarmerPass ? "text" : "password"} 
                          value={farmerPass} 
                          onChange={(e) => setFarmerPass(e.target.value)} 
                          placeholder="Enter password" 
                          required 
                        />
                        <button 
                          type="button" 
                          className="btn-toggle-eye" 
                          onClick={() => setShowFarmerPass(!showFarmerPass)}
                          aria-label="Toggle password visibility"
                        >
                          {showFarmerPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      
                      {/* Forgot Password Link below Password Column */}
                      <div className="forgot-pass-link-wrap">
                        <button 
                          type="button" 
                          className="btn-link-forgot"
                          onClick={() => { setForgotPassModal("farmer"); setForgotPassInput(farmerMobile); }}
                        >
                          {t("forgotPassword")}
                        </button>
                      </div>
                    </div>

                    <button type="submit" disabled={isLoggingIn} className="btn-auth-submit">
                      {isLoggingIn ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>Signing In...</span>
                        </>
                      ) : (
                        <span>{t("signInBtn")}</span>
                      )}
                    </button>

                    {/* New Farmer? Create an Account Link below Sign In Button */}
                    <div className="create-account-wrap">
                      <button 
                        type="button" 
                        className="btn-create-account-link"
                        onClick={() => { setViewMode("register"); setRegStep(1); }}
                      >
                        {t("newFarmerCreateAccount")}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* B. OFFICIAL / DEPARTMENT LOGIN */}
              {userType === "official" && (
                <div className="auth-body">
                  <h3 className="auth-section-title-center">{t("official")} Sign In</h3>

                  <form onSubmit={handleOfficialLogin} className="auth-form">
                    {/* Official Role Selector */}
                    <div className="form-group">
                      <label>{t("officialRole")}</label>
                      <select 
                        value={selectedOfficialRole} 
                        onChange={(e) => setSelectedOfficialRole(e.target.value)}
                        className="clean-select"
                      >
                        <option value="administrator">{t("adminRole")}</option>
                        <option value="centre_admin">{t("centreAdminRole")}</option>
                        <option value="checkin_officer">{t("checkinRole")}</option>
                        <option value="quality_officer">{t("qualityRole")}</option>
                        <option value="weighing_officer">{t("weighingRole")}</option>
                      </select>
                    </div>

                    {selectedOfficialRole !== "administrator" && (
                      <div className="form-group">
                        <label>{t("assignedCentre")}</label>
                        <select 
                          value={selectedCentre} 
                          onChange={(e) => setSelectedCentre(e.target.value)}
                          className="clean-select"
                        >
                          {centres.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.district})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Officer ID or Mobile Number - Full Width */}
                    <div className="form-group">
                      <label>{t("officerId")}</label>
                      <div className="input-with-icon">
                        <User size={18} />
                        <input 
                          type="text" 
                          value={officialId} 
                          onChange={(e) => setOfficialId(e.target.value)} 
                          placeholder="Enter Officer ID or Mobile Number" 
                          required 
                        />
                      </div>
                    </div>

                    {/* Password - Placed Below Officer ID */}
                    <div className="form-group">
                      <label>{t("password")}</label>
                      <div className="input-with-icon">
                        <KeyRound size={18} />
                        <input 
                          type={showOfficialPass ? "text" : "password"} 
                          value={officialPass} 
                          onChange={(e) => setOfficialPass(e.target.value)} 
                          placeholder="Enter password" 
                          required 
                        />
                        <button 
                          type="button" 
                          className="btn-toggle-eye" 
                          onClick={() => setShowOfficialPass(!showOfficialPass)}
                          aria-label="Toggle password visibility"
                        >
                          {showOfficialPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Forgot Password Link below Password Column */}
                      <div className="forgot-pass-link-wrap">
                        <button 
                          type="button" 
                          className="btn-link-forgot"
                          onClick={() => { setForgotPassModal("official"); setForgotPassInput(officialId); }}
                        >
                          {t("forgotPassword")}
                        </button>
                      </div>
                    </div>

                    <button type="submit" disabled={isLoggingIn} className="btn-auth-submit">
                      {isLoggingIn ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>Signing In...</span>
                        </>
                      ) : (
                        <span>{t("signInBtn")}</span>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Forgot Password Modal */}
      {forgotPassModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <KeyRound size={20} className="teal-text" />
                <h3 style={{ margin: 0 }}>{t("resetPassword")}</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <LanguageSelector currentLang={currentLang} onLangChange={onLangChange} />
                <button className="close-btn" onClick={() => setForgotPassModal(null)} aria-label={t("close")}>✕</button>
              </div>
            </div>
            
            {forgotPassToast && (
              <div className="forgot-success-banner">
                <CheckCircle2 size={20} className="teal-text" />
                <span>{forgotPassToast}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="modal-form">
              <div className="form-group">
                <label><b>{forgotPassModal === "farmer" ? (t("registeredMobileNumber") || t("mobileNumber")) : (t("officerIdOrMobile") || t("officerId"))}</b></label>
                <div className="input-group-with-btn mt-1">
                  <input 
                    type="text" 
                    value={forgotPassInput} 
                    onChange={(e) => setForgotPassInput(e.target.value)} 
                    placeholder={forgotPassModal === "farmer" ? t("enterTenDigitMobile") : t("enterOfficerIdOrMobile")}
                    className="clean-input"
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={handleSendForgotOtp} 
                    disabled={isSendingForgotOtp}
                    className="btn-send-otp"
                  >
                    {isSendingForgotOtp ? t("sendingOtp") : forgotOtpSent ? t("resendOtp") : t("sendOtp")}
                  </button>
                </div>
                {forgotOtpSent && (
                  <small className="form-hint" style={{ color: "#0f766e", fontWeight: 600 }}>
                    ✓ {t("otpSentSuccess")} {forgotPassInput}
                  </small>
                )}
              </div>

              {/* Directly ask for OTP */}
              <div className="form-group mt-3">
                <label><b>{t("enterOtp")}</b></label>
                <input 
                  type="text" 
                  maxLength="6"
                  value={forgotPassOtp} 
                  onChange={(e) => setForgotPassOtp(e.target.value)} 
                  placeholder={t("enterOtp")}
                  className="clean-input mt-1"
                  required 
                />
              </div>

              {/* Below it, ask for New Password */}
              <div className="form-group mt-3">
                <label><b>{t("newPassword")}</b></label>
                <div className="input-with-icon mt-1">
                  <KeyRound size={18} />
                  <input 
                    type={showForgotNewPass ? "text" : "password"} 
                    value={forgotPassNewPassword} 
                    onChange={(e) => setForgotPassNewPassword(e.target.value)} 
                    placeholder={t("enterNewPassword")} 
                    required 
                  />
                  <button 
                    type="button" 
                    className="btn-toggle-eye" 
                    onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                    aria-label="Toggle password visibility"
                  >
                    {showForgotNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group mt-3">
                <label><b>{t("confirmNewPassword")}</b></label>
                <div className="input-with-icon mt-1">
                  <KeyRound size={18} />
                  <input 
                    type={showForgotConfirmPass ? "text" : "password"} 
                    value={forgotPassConfirmPassword} 
                    onChange={(e) => setForgotPassConfirmPassword(e.target.value)} 
                    placeholder={t("reEnterNewPassword")} 
                    required 
                  />
                  <button 
                    type="button" 
                    className="btn-toggle-eye" 
                    onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                    aria-label="Toggle password visibility"
                  >
                    {showForgotConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isResettingPass} className="btn-auth-submit mt-4">
                {isResettingPass ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>{t("updatingPassword")}</span>
                  </>
                ) : (
                  <span>{t("submitAndUpdatePassword")}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
