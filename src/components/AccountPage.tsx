import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  MapPin, 
  Smartphone, 
  Calendar, 
  Globe, 
  ShoppingBag, 
  Heart, 
  ChevronRight, 
  LogOut, 
  ShieldCheck, 
  CheckCircle, 
  Info,
  Sliders,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { DIVISION_DISTRICTS, getTranslatedName } from '../utils/translations';
import { accountService, Customer, Order } from '../utils/accountService';
import { adminService } from '../utils/adminService';
import { Leaf } from 'lucide-react';

interface AccountPageProps {
  onBackToHome?: () => void;
}

interface Banner {
  id: number;
  name: string;
  image_url_desktop: string;
  image_url_mobile: string;
  heading_en: string | null;
  heading_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  alt_en: string | null;
  alt_bn: string | null;
  button_text_en: string | null;
  button_text_bn: string | null;
  button_link: string | null;
  display_location: string;
}

export const AccountPage = ({ onBackToHome }: AccountPageProps) => {
  const { language, t, changeLanguage } = useLanguage();
  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'dashboard' | 'profile' | 'orders' | 'wishlist' | 'addresses' | 'password' | 'support'>('login');

  // Banners state
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isBannersLoading, setIsBannersLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Login form states
  const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form states
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regDivision, setRegDivision] = useState('');
  const [regDistrict, setRegDistrict] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regGender, setRegGender] = useState<'male' | 'female' | 'other'>('male');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirm, setRegShowConfirm] = useState(false);
  const [regError, setRegError] = useState('');

  // Edit profile states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDivision, setEditDivision] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other'>('male');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Change password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');

  // User orders and data states
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  // Load active user
  const fetchUserData = async () => {
    const user = await accountService.getLoggedInUser();
    setCurrentUser(user);
    if (user) {
      setView('dashboard');
      // Initialize edit form values
      setEditName(user.full_name);
      setEditEmail(user.email);
      setEditPhone(user.phone);
      setEditAddress(user.address);
      setEditDivision(user.division);
      setEditDistrict(user.district);
      setEditGender(user.gender);
    } else {
      setView('login');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Fetch Auth Banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch('/api/homepage/banners?location=auth_banner');
        const data = await response.json();
        if (data.success) {
          setBanners(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch auth banners:', err);
      } finally {
        setIsBannersLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Banner autoplay timer
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (currentUser) {
      accountService.getOrdersForCustomer().then(setCustomerOrders);
    }
  }, [currentUser]);

  const normalizeBdPhone = (num: string): string => {
    let clean = num.replace(/\D/g, '');
    if (clean.startsWith('880')) clean = clean.slice(3);
    if (!clean.startsWith('0') && clean.length === 10) clean = '0' + clean;
    return clean;
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    const normalized = normalizeBdPhone(phone);
    // Bangladesh mobile format check (11 digits starting with 01)
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(normalized)) {
      setOtpError(t('invalidPhoneError'));
      return;
    }

    setOtpSent(true);
    const generatedCode = String(Math.floor(1000 + Math.random() * 9000));
    setSimulatedOtp(generatedCode);
    console.log(`[SMS-GATEWAY] Sending verification OTP ${generatedCode} to +880${normalized.slice(1)}`);
    alert(language === 'bn' ? `আপনার ওটিপি কোড: ${generatedCode}` : `Your OTP code is: ${generatedCode}`);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (otpCode !== simulatedOtp) {
      setOtpError(t('invalidOtp'));
      return;
    }

    const normalized = normalizeBdPhone(phone);
    const res = await accountService.loginWithOTP(normalized);
    if (res.success && res.customer) {
      setCurrentUser(res.customer);
      
      const redirectHash = localStorage.getItem('redirect_after_login');
      if (redirectHash) {
        localStorage.removeItem('redirect_after_login');
        window.location.hash = redirectHash;
        return;
      }

      setView('dashboard');
      // Sync language to preference if stored in user schema
      if (res.customer.language) {
        changeLanguage(res.customer.language);
      }
    } else {
      setOtpError(res.error || 'Authentication Failed!');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!email || !password) {
      setLoginError(t('allFieldsRequired'));
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Attempt server-side admin credentials check
      const adminRes = await adminService.login(cleanEmail, password);
      if (adminRes.success && adminRes.admin) {
        accountService.logout();
        // Redirect to Admin Panel immediately
        window.location.hash = '#/admin/dashboard';
        return;
      }
    } catch (err) {
      console.warn('Admin bypass check skipped or failed: ', err);
    }

    // 2. Fallback to Customer authentication
    const res = await accountService.loginWithEmail(cleanEmail, password);
    if (res.success && res.customer) {
      setCurrentUser(res.customer);

      const redirectHash = localStorage.getItem('redirect_after_login');
      if (redirectHash) {
        localStorage.removeItem('redirect_after_login');
        window.location.hash = redirectHash;
        return;
      }

      setView('dashboard');
      if (res.customer.language) {
        changeLanguage(res.customer.language);
      }
    } else {
      setLoginError(res.error || (language === 'bn' ? 'ভুল ইমেইল অথবা পাসওয়ার্ড দিয়েছেন!' : 'Wrong credentials!'));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName || !regPhone || !regEmail || !regAddress || !regDivision || !regDistrict || !regPassword || !regConfirmPassword) {
      setRegError(t('allFieldsRequired'));
      return;
    }

    // Length check
    if (regName.trim().length < 3) {
      setRegError(language === 'bn' ? 'অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন!' : 'Please enter your full name!');
      return;
    }

    // Phone validation
    const normalizedPhone = normalizeBdPhone(regPhone);
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      setRegError(t('invalidPhoneError'));
      return;
    }

    // Password matches check
    if (regPassword.length < 8) {
      setRegError(t('shortPasswordError'));
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError(t('passwordsDoNotMatch'));
      return;
    }

    const registrationData = {
      full_name: regName.trim(),
      email: regEmail.trim(),
      phone: normalizedPhone,
      password: regPassword,
      address: regAddress.trim(),
      division: regDivision,
      district: regDistrict,
      gender: regGender
    };

    const res = await accountService.register(registrationData);
    if (res.success) {
      alert(t('registrationSuccess'));
      const loginRes = await accountService.loginWithEmail(regEmail, regPassword);
      if (loginRes.success && loginRes.customer) {
        setCurrentUser(loginRes.customer);
        setView('dashboard');
      } else {
        setView('login');
      }
    } else {
      setRegError(res.error || 'Registration failed!');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    if (!currentUser) return;

    if (!editName || !editEmail || !editPhone || !editAddress || !editDivision || !editDistrict) {
      alert(t('allFieldsRequired'));
      return;
    }

    const res = await accountService.updateProfile(currentUser.id, {
      full_name: editName,
      email: editEmail,
      phone: editPhone,
      address: editAddress,
      division: editDivision,
      district: editDistrict,
      gender: editGender
    });

    if (res.success && res.customer) {
      setCurrentUser(res.customer);
      setProfileSuccessMsg(t('profileSaved'));
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } else {
      alert(res.error || 'Update failed!');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    if (!currentUser) return;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      alert(t('allFieldsRequired'));
      return;
    }

    if (newPassword.length < 8) {
      alert(t('shortPasswordError'));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert(t('passwordsDoNotMatch'));
      return;
    }

    const success = await accountService.changePassword(currentUser.id, newPassword);
    if (success) {
      setPasswordSuccessMsg(language === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!' : 'Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccessMsg(''), 3500);
    }
  };

  const handleLogout = () => {
    accountService.logout();
    setCurrentUser(null);
    setView('login');
  };

  // Orders state
  const customerWishlist = currentUser ? accountService.getWishlistForCustomer(currentUser.id) : [];

  useEffect(() => {
    if (currentUser) {
      accountService.getOrdersForCustomer().then(setCustomerOrders);
    }
  }, [currentUser]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" id="customer-account-container">
      {/* 1. Carousel banner at the top of Account page */}
      {!isBannersLoading && banners.length > 0 && (
        <div className="relative w-full h-[160px] sm:h-[220px] md:h-[280px] rounded-2xl overflow-hidden shadow-xs mb-6 group" id="account-carousel-banner">
          {banners.map((b, idx) => (
            <div
              key={b.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                idx === currentBannerIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}
            >
              <picture>
                <source media="(max-width: 640px)" srcSet={b.image_url_mobile} />
                <img 
                  src={b.image_url_desktop} 
                  alt={language === 'bn' ? (b.alt_bn || b.heading_bn || '') : (b.alt_en || b.heading_en || '')} 
                  className="w-full h-full object-cover" 
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/40 to-transparent flex flex-col justify-center px-6 sm:px-12 text-white">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={idx === currentBannerIndex ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <div className="p-1 bg-emerald-500 rounded-lg">
                    <Leaf className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-black tracking-widest text-emerald-400 uppercase">SHAD GHOR</span>
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={idx === currentBannerIndex ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 }}
                  className="text-lg sm:text-2xl md:text-3xl font-black font-sans leading-tight max-w-md"
                >
                  {language === 'bn' ? b.heading_bn : b.heading_en}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={idx === currentBannerIndex ? { opacity: 1 } : {}}
                  transition={{ delay: 0.5 }}
                  className="mt-2 text-[10px] sm:text-sm text-gray-200 font-medium max-w-sm hidden sm:block"
                >
                  {language === 'bn' ? b.description_bn : b.description_en}
                </motion.p>

                {b.button_text_en && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={idx === currentBannerIndex ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.6 }}
                    className="mt-4"
                  >
                    <a 
                      href={b.button_link || '#'}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-black transition-all active:scale-95"
                    >
                      {language === 'bn' ? b.button_text_bn : b.button_text_en}
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </motion.div>
                )}
              </div>
            </div>
          ))}
          
          {/* Carousel indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentBannerIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentBannerIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. LOGGED-OUT VIEW */}
      {view === 'login' && (
        <div className="max-w-md mx-auto bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100" id="login-card">
          {/* Header & Brand */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full mb-3 border border-emerald-100/80">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black tracking-wider text-emerald-800">SHAD GHOR</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              {language === 'bn' ? 'স্বাগতম' : 'Welcome Back'}
            </h1>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              {language === 'bn'
                ? 'SHAD GHOR অ্যাকাউন্টে লগইন করে কেনাকাটা চালিয়ে যান।'
                : 'Log in to your SHAD GHOR account to continue shopping.'}
            </p>
          </div>

          {/* Login tab selector: Email & Password FIRST, Mobile OTP SECOND */}
          <div className="grid grid-cols-2 gap-1.5 bg-gray-100/80 p-1.5 rounded-xl mb-6" id="login-tabs">
            <button
              type="button"
              onClick={() => { setLoginMethod('email'); setLoginError(''); setOtpError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                loginMethod === 'email'
                  ? 'bg-white text-emerald-700 shadow-xs border border-gray-100'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>{language === 'bn' ? 'ইমেইল ও পাসওয়ার্ড' : 'Email & Password'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('otp'); setLoginError(''); setOtpError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                loginMethod === 'otp'
                  ? 'bg-white text-emerald-700 shadow-xs border border-gray-100'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{language === 'bn' ? 'মোবাইল ওটিপি' : 'Mobile OTP'}</span>
            </button>
          </div>

          {/* Tab 1: Email + Password Login (Default) */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4" id="email-login-form">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">{language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}</label>
                <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-2.5 bg-white shadow-3xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="hello@shadghor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 text-xs text-gray-800 placeholder-gray-400 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">{language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</label>
                  <button
                    type="button"
                    onClick={() => alert(language === 'bn' ? 'পাসওয়ার্ড রিসেট করতে আমাদের সাপোর্ট বা মোবাইল ওটিপি সাইন-ইন ব্যবহার করুন।' : 'Please use Mobile OTP Sign-In or contact customer support to access your account.')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-2.5 bg-white shadow-3xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                  <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={language === 'bn' ? 'আপনার পাসওয়ার্ড লিখুন' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 text-xs text-gray-800 placeholder-gray-400 font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer"
              >
                {language === 'bn' ? 'লগইন করুন' : 'Login'}
              </button>
            </form>
          )}

          {/* Tab 2: Bangladesh Mobile OTP Login */}
          {loginMethod === 'otp' && (
            <div id="otp-login-form">
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">{language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}</label>
                    <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white shadow-3xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-3.5 border-r border-gray-200 text-xs text-gray-700 font-bold select-none">
                        <span>🇧🇩</span>
                        <span>+880</span>
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="1712345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-3.5 py-2.5 text-xs text-gray-800 placeholder-gray-400 font-bold tracking-wider focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {language === 'bn' ? '০ ছাড়া ১০ ডিজিটের নম্বর লিখুন (যেমন: 1712345678)' : 'Enter 10-digit number without 0 (e.g. 1712345678)'}
                    </p>
                  </div>

                  {otpError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer"
                  >
                    {language === 'bn' ? 'ওটিপি কোড পাঠান' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">{language === 'bn' ? 'ওটিপি কোড লিখুন' : 'Enter OTP'}</label>
                    <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-white shadow-3xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                      <input
                        type="text"
                        maxLength={4}
                        required
                        placeholder={language === 'bn' ? '৪-ডিজিটের ওটিপি' : 'Enter 4-digit OTP'}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-3 text-center text-base font-black tracking-[0.5em] focus:outline-none text-gray-800 placeholder-gray-300"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5 pt-1">
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'ওটিপি কোড পাঠানো হয়েছে' : 'OTP sent successfully'}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => { setOtpSent(false); setOtpCode(''); }} 
                        className="text-xs text-gray-500 hover:text-emerald-700 font-medium underline cursor-pointer"
                      >
                        {language === 'bn' ? 'নম্বর পরিবর্তন' : 'Change Number'}
                      </button>
                    </div>
                  </div>

                  {otpError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer"
                  >
                    {language === 'bn' ? 'যাচাই ও লগইন' : 'Verify & Login'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Bottom Divider & Create Account Option */}
          <div className="relative my-6 text-center">
            <span className="bg-white px-3 text-[11px] text-gray-400 font-medium relative z-10">
              {language === 'bn' ? 'অথবা' : 'OR'}
            </span>
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-200" />
          </div>

          <div className="text-center space-y-3">
            <p className="text-xs text-gray-500">
              {language === 'bn' ? 'কোনো অ্যাকাউন্ট নেই?' : "Don't have an account?"}
            </p>
            <button
              type="button"
              onClick={() => { setView('register'); setRegError(''); }}
              className="w-full border border-gray-300 hover:border-emerald-600 hover:bg-emerald-50/30 text-gray-800 hover:text-emerald-700 text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-3xs"
              id="register-toggle-btn"
            >
              {language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}
            </button>
          </div>
        </div>
      )}

      {/* 3. CREATE ACCOUNT / REGISTRATION SCREEN */}
      {view === 'register' && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100" id="register-card">
          {/* Header with Back button and Brand title */}
          <div className="mb-6">
            <button 
              type="button"
              onClick={() => { setView('login'); setRegError(''); }} 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-700 transition-colors cursor-pointer mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{language === 'bn' ? 'লগইনে ফিরে যান' : 'Back to Login'}</span>
            </button>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full mb-3 border border-emerald-100/80">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black tracking-wider text-emerald-800">SHAD GHOR</span>
              </div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                {language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create Your Account'}
              </h1>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {language === 'bn'
                  ? 'SHAD GHOR-এ যুক্ত হোন এবং প্রিমিয়াম খাঁটি খাবার উপভোগ করুন।'
                  : 'Join SHAD GHOR and enjoy quality dry foods delivered to your doorstep.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4" id="register-form">
            {/* Row 1: Full Name & Email Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  {language === 'bn' ? 'সম্পূর্ণ নাম' : 'Full Name'} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-2.5 bg-white shadow-3xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder={language === 'bn' ? 'যেমন: মোঃ ইমতিয়াজ খান' : 'MD. IMTIAZ KHAN'}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="flex-1 text-xs text-gray-800 placeholder-gray-400 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  {language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-2.5 bg-white shadow-3xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="hello@shadghor.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="flex-1 text-xs text-gray-800 placeholder-gray-400 font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                {language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'} <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white shadow-3xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3.5 border-r border-gray-200 text-xs text-gray-700 font-bold select-none">
                  <span>🇧🇩</span>
                  <span>+880</span>
                </div>
                <input
                  type="tel"
                  required
                  placeholder="1712345678"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3.5 py-2.5 text-xs text-gray-800 placeholder-gray-400 font-bold tracking-wider focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {language === 'bn' ? '০ ছাড়া ১০ ডিজিটের নম্বর লিখুন (যেমন: 1712345678)' : 'Enter 10-digit number without 0 (e.g. 1712345678)'}
              </p>
            </div>

            {/* Row 3: Division & District */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  {language === 'bn' ? 'বিভাগ' : 'Division'} <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl border border-gray-200 bg-white shadow-3xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all pr-3">
                  <select
                    required
                    value={regDivision}
                    onChange={(e) => {
                      setRegDivision(e.target.value);
                      setRegDistrict('');
                    }}
                    className="w-full bg-transparent px-3.5 py-2.5 text-xs font-medium text-gray-800 focus:outline-none cursor-pointer appearance-none"
                  >
                    <option value="">{language === 'bn' ? 'আপনার বিভাগ নির্বাচন করুন' : 'Select your division'}</option>
                    {Object.keys(DIVISION_DISTRICTS).map((div) => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  {language === 'bn' ? 'জেলা' : 'District'} <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl border border-gray-200 bg-white shadow-3xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all pr-3">
                  <select
                    required
                    disabled={!regDivision}
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    className="w-full bg-transparent px-3.5 py-2.5 text-xs font-medium text-gray-800 focus:outline-none cursor-pointer appearance-none disabled:opacity-50 disabled:bg-gray-50"
                  >
                    <option value="">{language === 'bn' ? 'আপনার জেলা নির্বাচন করুন' : 'Select your district'}</option>
                    {regDivision && DIVISION_DISTRICTS[regDivision].map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Full Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                {language === 'bn' ? 'সম্পূর্ণ ঠিকানা' : 'Full Address'} <span className="text-red-500">*</span>
              </label>
              <div className="rounded-xl border border-gray-200 p-2.5 bg-white shadow-3xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                <textarea
                  required
                  rows={2}
                  placeholder={language === 'bn' ? 'বাড়ি, রাস্তা, এলাকা, শহর' : 'House, Road, Area, City'}
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  className="w-full text-xs text-gray-800 placeholder-gray-400 font-medium focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Row 5: Password & Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-2.5 bg-white shadow-3xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                  <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type={regShowPassword ? 'text' : 'password'}
                    required
                    placeholder={language === 'bn' ? 'কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড' : 'Create a secure password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="flex-1 text-xs text-gray-800 placeholder-gray-400 font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-2.5 bg-white shadow-3xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                  <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type={regShowConfirm ? 'text' : 'password'}
                    required
                    placeholder={language === 'bn' ? 'পাসওয়ার্ড পুনরায় লিখুন' : 'Re-enter your password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="flex-1 text-xs text-gray-800 placeholder-gray-400 font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowConfirm(!regShowConfirm)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                    aria-label="Toggle confirm password visibility"
                  >
                    {regShowConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 6: Gender Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                {language === 'bn' ? 'লিঙ্গ' : 'Gender'}
              </label>
              <div className="grid grid-cols-3 gap-3" id="gender-selection-grid">
                {[
                  { key: 'male', labelEn: 'Male', labelBn: 'পুরুষ' },
                  { key: 'female', labelEn: 'Female', labelBn: 'মহিলা' },
                  { key: 'other', labelEn: 'Other', labelBn: 'অন্যান্য' }
                ].map((item) => {
                  const isSelected = regGender === item.key;
                  return (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => setRegGender(item.key as any)}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800 shadow-3xs ring-1 ring-emerald-500/30'
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span>{language === 'bn' ? item.labelBn : item.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {regError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-red-500" />
                <span>{regError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer"
            >
              {language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                {language === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => { setView('login'); setRegError(''); }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                >
                  {language === 'bn' ? 'লগইন করুন' : 'Login'}
                </button>
              </p>
            </div>
          </form>
        </div>
      )}

      {/* 4. LOGGED-IN CUSTOMER DASHBOARD & VIEW CONTROL */}
      {currentUser && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="logged-in-dashboard">
          {/* Dashboard Left Sidebar Menu Cards */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-4 shadow-xs border border-gray-100/50 h-fit space-y-4">
            {/* Header Profile Info card */}
            <div className="flex items-center gap-3.5 p-1 border-b border-gray-50 pb-4" id="dashboard-user-header">
              <img 
                src={currentUser.profile_image} 
                alt="Customer Profile Cartoon" 
                className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-500/20"
              />
              <div className="overflow-hidden">
                <h3 className="font-extrabold text-sm text-gray-800 truncate">{currentUser.full_name}</h3>
                <p className="text-[10px] text-gray-400 font-bold truncate mt-0.5">{currentUser.email}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">🇧🇩 +880 {currentUser.phone}</p>
              </div>
            </div>

            {/* Nav List */}
            <nav className="flex flex-col gap-1" id="dashboard-nav-list">
              {[
                { key: 'dashboard', label: t('myProfile'), icon: User },
                { key: 'orders', label: t('myOrders'), icon: ShoppingBag },
                { key: 'wishlist', label: t('wishlist'), icon: Heart },
                { key: 'addresses', label: t('myAddresses'), icon: MapPin },
                { key: 'password', label: t('changePassword'), icon: Lock },
                { key: 'support', label: t('support'), icon: Info },
              ].map((item) => {
                const ItemIcon = item.icon;
                const active = view === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => { setView(item.key as any); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      active 
                        ? 'text-emerald-600 bg-emerald-50/50' 
                        : 'text-gray-600 hover:bg-gray-50/40 hover:text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ItemIcon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  </button>
                );
              })}

              {/* Language inside dashboard */}
              <div className="border-t border-gray-50 pt-3 mt-2">
                <div className="flex items-center justify-between px-3 pb-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('languageLabel')}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 px-1">
                  <button
                    onClick={() => changeLanguage('bn')}
                    className={`py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                      language === 'bn' ? 'bg-emerald-600 text-white shadow-3xs' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    বাংলা
                  </button>
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                      language === 'en' ? 'bg-emerald-600 text-white shadow-3xs' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 mt-4 text-xs font-bold text-red-500 hover:bg-red-50/40 rounded-xl transition-all text-left cursor-pointer border border-transparent hover:border-red-100"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>{t('logout')}</span>
              </button>
            </nav>
          </div>

          {/* Dashboard Right Area Render content dynamically based on current selected tab view state */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-xs border border-gray-100/50 min-h-[350px]">
            {/* View: My Profile details edit view */}
            {view === 'dashboard' && (
              <div id="profile-view-tab">
                <div className="flex items-center justify-between pb-4 border-b border-gray-50 mb-5">
                  <h2 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    <span>{t('profileDetails')}</span>
                  </h2>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase">{t('fullName')}</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase">{t('emailAddress')}</label>
                      <input
                        type="email"
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase">{t('mobileNumber')}</label>
                      <input
                        type="tel"
                        required
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-gray-50/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase">{t('gender')}</label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value as any)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
                      >
                        <option value="male">{t('male')}</option>
                        <option value="female">{t('female')}</option>
                        <option value="other">{t('other')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase">{language === 'bn' ? 'বিভাগ' : 'Division'}</label>
                      <select
                        value={editDivision}
                        onChange={(e) => {
                          setEditDivision(e.target.value);
                          setEditDistrict('');
                        }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
                      >
                        <option value="">{t('division')}</option>
                        {Object.keys(DIVISION_DISTRICTS).map((div) => (
                          <option key={div} value={div}>{div}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase">{language === 'bn' ? 'জেলা' : 'District'}</label>
                      <select
                        value={editDistrict}
                        onChange={(e) => setEditDistrict(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
                      >
                        <option value="">{t('district')}</option>
                        {editDivision && DIVISION_DISTRICTS[editDivision].map((dist) => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">{t('fullAddress')}</label>
                    <textarea
                      rows={3}
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                    />
                  </div>

                  {profileSuccessMsg && (
                    <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                      <span>{profileSuccessMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow-3xs cursor-pointer uppercase tracking-wider"
                  >
                    {t('saveChanges')}
                  </button>
                </form>
              </div>
            )}

            {/* View: My Orders of current customer */}
            {view === 'orders' && (
              <div id="orders-view-tab">
                <div className="pb-4 border-b border-gray-50 mb-5">
                  <h2 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-600" />
                    <span>{t('myOrders')}</span>
                  </h2>
                </div>

                {customerOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-xs text-gray-400 font-bold">{t('noOrders')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerOrders.map((order) => {
                      const statusColor = {
                        Pending: 'bg-amber-50 text-amber-600 border-amber-100',
                        Confirmed: 'bg-blue-50 text-blue-600 border-blue-100',
                        Processing: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                        Shipped: 'bg-purple-50 text-purple-600 border-purple-100',
                        Delivered: 'bg-green-50 text-green-600 border-green-100',
                        Cancelled: 'bg-red-50 text-red-600 border-red-100',
                      }[order.status] || 'bg-gray-50 text-gray-500 border-gray-100';

                      return (
                        <div 
                          key={order.id} 
                          className="border border-gray-100 rounded-xl p-4 hover:shadow-3xs transition-shadow space-y-3"
                          id={`order-card-${order.id}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 pb-2">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">{t('orderId')}</span>
                              <p className="text-xs font-black text-gray-800">#{order.id}</p>
                            </div>
                            <div className="space-y-0.5 text-right">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">{t('date')}</span>
                              <p className="text-[11px] font-bold text-gray-600">{order.date}</p>
                            </div>
                          </div>

                          <div className="text-xs font-bold text-gray-600">
                            {order.products}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase block">{t('totalAmount')}</span>
                              <span className="text-sm font-extrabold text-emerald-600">৳{order.totalAmount}</span>
                            </div>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${statusColor}`}>
                              {order.status === 'Delivered' ? t('statusDelivered') : 
                               order.status === 'Processing' ? t('statusProcessing') : 
                               order.status === 'Pending' ? t('statusPending') : order.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* View: My Wishlist products view */}
            {view === 'wishlist' && (
              <div id="wishlist-view-tab">
                <div className="pb-4 border-b border-gray-50 mb-5">
                  <h2 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                    <Heart className="w-5 h-5 text-emerald-600" />
                    <span>{t('wishlist')}</span>
                  </h2>
                </div>

                {customerWishlist.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-xs text-gray-400 font-bold">{language === 'bn' ? 'আপনার উইশলিস্ট খালি আছে!' : 'Your wishlist is currently empty!'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {customerWishlist.map((item) => (
                      <div key={item.id} className="border border-gray-100 rounded-xl p-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <img src={item.imageUrl} alt={item.name} className="w-full aspect-square object-cover rounded-md" />
                          <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{getTranslatedName(item.name, language)}</h4>
                          <p className="text-xs font-extrabold text-emerald-600">৳{item.price}</p>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-3">
                          <button
                            onClick={() => {
                              // Trigger custom cart action or simulated add
                              alert(language === 'bn' ? 'কার্টে সফলভাবে যুক্ত করা হয়েছে!' : 'Successfully added to Cart!');
                            }}
                            className="w-full bg-emerald-600 text-white text-[10px] font-bold py-1.5 rounded-lg text-center"
                          >
                            {t('addToCart')}
                          </button>
                          <button
                            onClick={() => {
                              if (currentUser) {
                                accountService.removeFromWishlist(currentUser.id, item.id);
                                fetchUserData();
                              }
                            }}
                            className="text-[10px] text-red-500 font-bold py-1 bg-red-50/20 rounded-lg hover:bg-red-50"
                          >
                            {language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* View: Addresses view tab */}
            {view === 'addresses' && (
              <div id="addresses-view-tab">
                <div className="pb-4 border-b border-gray-50 mb-5">
                  <h2 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <span>{t('myAddresses')}</span>
                  </h2>
                </div>

                <div className="p-4 border border-emerald-100 bg-emerald-50/20 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'bn' ? 'ডেলিভারি ঠিকানা (প্রধান)' : 'Delivery Address (Primary)'}</span>
                  </div>
                  {currentUser && (
                    <div className="text-xs font-bold text-gray-700 space-y-1 pl-5">
                      <p className="font-extrabold text-gray-800">{currentUser.full_name}</p>
                      <p>+880 {currentUser.phone}</p>
                      <p>{currentUser.address}</p>
                      <p>{currentUser.district}, {currentUser.division}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View: Change password tab view */}
            {view === 'password' && (
              <div id="password-view-tab">
                <div className="pb-4 border-b border-gray-50 mb-5">
                  <h2 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                    <Lock className="w-5 h-5 text-emerald-600" />
                    <span>{t('changePassword')}</span>
                  </h2>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">{language === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}</label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">{language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">{t('confirmPassword')}</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {passwordSuccessMsg && (
                    <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                      <span>{passwordSuccessMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow-3xs cursor-pointer uppercase tracking-wider"
                  >
                    {t('changePassword')}
                  </button>
                </form>
              </div>
            )}

            {/* View: Customer care support help tab */}
            {view === 'support' && (
              <div id="support-view-tab">
                <div className="pb-4 border-b border-gray-50 mb-5">
                  <h2 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                    <Info className="w-5 h-5 text-emerald-600" />
                    <span>{t('supportTitle')}</span>
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl">
                    <h3 className="font-extrabold text-xs text-emerald-800 mb-1">{t('contactSupport')}</h3>
                    <p className="text-[11px] text-gray-500 font-bold mb-3">{t('supportSub')}</p>
                    <div className="flex flex-wrap gap-4 text-xs font-black">
                      <span className="text-gray-700">📞 {t('callUs')}: +880 1712-345678</span>
                      <span className="text-gray-700">✉️ {t('emailUs')}: support@shadghor.com</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { title: t('orderHelp'), desc: 'অর্ডার কাস্টমাইজেশন ও দ্রুত ট্র্যাকিং সেবা।' },
                      { title: t('deliveryHelp'), desc: 'সারাদেশে ৩ দিনের মধ্যে ক্যাশ অন ডেলিভারি সহায়তা।' },
                      { title: t('paymentHelp'), desc: 'বিকাশ, নগদ, রকেট ও কার্ড পেমেন্ট সেবা।' },
                      { title: t('returnRefundHelp'), desc: '৭ দিনের সহজ পণ্য ফেরত ও রিফান্ড পলিসি।' }
                    ].map((item, i) => (
                      <div key={i} className="p-3 border border-gray-100 rounded-xl hover:shadow-3xs transition-shadow">
                        <h4 className="font-extrabold text-xs text-gray-800 mb-1">{item.title}</h4>
                        <p className="text-[11px] text-gray-400 font-bold">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
