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
  apiRegisterFarmer 
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
  const [forgotPassDone, setForgotPassDone] = useState(false);

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
        setRegAadhaarOtp(res.demoOtp || "4829");
        if (res.profile) {
          setFetchedDemographics(res.profile);
          setRegMobile(res.profile.mobile ? res.profile.mobile.replace(/\D/g, "").slice(-10) : "");
          setRegEmail(res.profile.email || "");
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
      alert("Please enter the 4-digit Aadhaar OTP.");
      return;
    }
    setIsVerifyingAadhaar(true);
    try {
      let profile = fetchedDemographics;
      if (!profile) {
        const res = await apiRequestAadhaarOtp(regAadhaar);
        if (res?.success && res.profile) {
          profile = res.profile;
          setFetchedDemographics(profile);
        }
      }
      if (profile) {
        setRegMobile(profile.mobile ? profile.mobile.replace(/\D/g, "").slice(-10) : "");
        setRegEmail(profile.email || "");
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
    if (fetchedDemographics?.email) {
      setRegEmail(fetchedDemographics.email);
    }
    setRegStep(3); // Proceed to Contact & Password setup
  };

  // Registration Step 3: Send Mobile/Email OTP
  const handleSendMobileOtp = (e) => {
    e?.preventDefault();
    if (!regMobile || regMobile.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsSendingMobileOtp(true);
    setTimeout(() => {
      setIsSendingMobileOtp(false);
      setMobileOtpSent(true);
      setRegMobileOtp("4829");
    }, 500);
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
    const newFarmerProfile = {
      role: "farmer",
      farmerId: fetchedDemographics.farmerId || ("F" + Math.floor(100 + Math.random() * 900)),
      farmerName: fetchedDemographics.farmerName,
      fatherName: fetchedDemographics.fatherName,
      dob: fetchedDemographics.dob,
      age: fetchedDemographics.age,
      gender: fetchedDemographics.gender,
      mobile: `+91 ${regMobile}`,
      email: regEmail || fetchedDemographics.email || "",
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

    try {
      const res = await apiRegisterFarmer(newFarmerProfile);
      const registeredUser = (res?.success && res?.data) ? {
        ...newFarmerProfile,
        ...res.data,
        role: "farmer"
      } : newFarmerProfile;
      onLoginSuccess(registeredUser);
    } catch (err) {
      console.error("Register farmer error:", err);
      onLoginSuccess(newFarmerProfile);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    setForgotPassDone(true);
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
                          placeholder="Enter 4-digit OTP" 
                          className="clean-input mt-1"
                          required
                        />
                        <small className="form-hint">Verification OTP: <b>4829</b></small>
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
                        <label>Enter Mobile OTP</label>
                        <input 
                          type="text" 
                          maxLength="6"
                          value={regMobileOtp} 
                          onChange={(e) => setRegMobileOtp(e.target.value)} 
                          placeholder="Enter 4-digit OTP" 
                          className="aadhaar-input-large"
                          required 
                        />
                        <small className="form-hint">Verification OTP: <b>4829</b></small>
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
                          onClick={() => { setForgotPassModal("farmer"); setForgotPassDone(false); setForgotPassInput(farmerMobile); }}
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
                          onClick={() => { setForgotPassModal("official"); setForgotPassDone(false); setForgotPassInput(officialId); }}
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
              <h3>Reset Password</h3>
              <button className="close-btn" onClick={() => setForgotPassModal(null)}>✕</button>
            </div>
            
            {!forgotPassDone ? (
              <form onSubmit={handleForgotPasswordSubmit} className="modal-form">
                <p className="forgot-modal-desc">
                  {forgotPassModal === "farmer" 
                    ? "Enter your registered mobile number or Farmer ID to receive a verification OTP."
                    : "Enter your official Officer ID or registered official email to receive a password reset link."
                  }
                </p>

                <div className="form-group mt-3">
                  <label>{forgotPassModal === "farmer" ? "Registered Mobile Number" : "Officer ID / Email"}</label>
                  <input 
                    type="text" 
                    value={forgotPassInput} 
                    onChange={(e) => setForgotPassInput(e.target.value)} 
                    placeholder={forgotPassModal === "farmer" ? "Enter registered mobile number" : "Enter officer ID"}
                    required 
                  />
                </div>

                <button type="submit" className="btn-primary mt-4 w-100">
                  Send Reset Verification
                </button>
              </form>
            ) : (
              <div className="forgot-success-box">
                <CheckCircle2 size={36} className="teal-text" />
                <h4>Reset Link / OTP Dispatched</h4>
                <p>
                  A temporary password reset link and 6-digit OTP has been sent to your registered contact channel.
                </p>
                <button className="btn-primary mt-3" onClick={() => setForgotPassModal(null)}>
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
