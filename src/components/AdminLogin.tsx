import React, { useState, useEffect } from 'react';
import { Leaf, Eye, EyeOff, Lock, Mail, AlertCircle, Globe } from 'lucide-react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const { language, changeLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Apply strict SEO meta block tags on mount to shield from Google crawler indexing
  useEffect(() => {
    let robotsMeta = document.querySelector('meta[name="robots"]');
    const wasExisted = !!robotsMeta;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow, noarchive');

    return () => {
      if (robotsMeta) {
        if (wasExisted) {
          robotsMeta.setAttribute('content', 'index, follow');
        } else {
          robotsMeta.remove();
        }
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(language === 'bn' ? 'দয়া করে অ্যাডমিন ইমেইল দিন।' : 'Please enter your admin email.');
      return;
    }
    if (!password) {
      setError(language === 'bn' ? 'দয়া করে আপনার পাসওয়ার্ডটি লিখুন।' : 'Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await adminService.login(email.trim(), password);
      setIsLoading(false);

      if (result.success) {
        onLoginSuccess();
      } else {
        // Obfuscate specific error information as requested for security
        setError(language === 'bn' ? 'ভুল অ্যাডমিন ইমেইল অথবা পাসওয়ার্ড!' : 'Invalid admin email or password.');
      }
    } catch (err) {
      setIsLoading(false);
      setError(language === 'bn' ? 'ভুল অ্যাডমিন ইমেইল অথবা পাসওয়ার্ড!' : 'Invalid admin email or password.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans text-gray-800 relative select-none" id="admin-login-page-root">
      
      {/* 🌐 Clean Floating Language Toggle */}
      <div className="absolute top-4 right-4 z-50 animate-fade-in" id="admin-login-lang-wrapper">
        <button
          onClick={() => changeLanguage(language === 'bn' ? 'en' : 'bn')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-all cursor-pointer border border-emerald-100/50"
          title="Switch Admin Language"
          id="admin-login-lang-btn"
        >
          <Globe className="w-4 h-4" />
          <span className="font-sans text-[11px] font-black">{language === 'bn' ? 'ENGLISH' : 'বাংলা'}</span>
        </button>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center" id="admin-login-container">
        
        {/* SHAD GHOR Leaf Logo Container */}
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 mb-5 animate-fade-in" id="admin-login-logo">
          <Leaf className="w-8 h-8 fill-emerald-600/10 text-emerald-600" />
        </div>

        {/* Branding Headers */}
        <div className="text-center space-y-1 mb-8" id="admin-login-header-group">
          <h1 className="font-black text-2xl tracking-widest text-emerald-800 font-sans">
            SHAD GHOR
          </h1>
          <p className="text-xs font-black text-gray-400 tracking-wider uppercase mt-1">
            {language === 'bn' ? 'অ্যাডমিন প্যানেল' : 'ADMIN PANEL'}
          </p>
        </div>

        {/* Compact Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4" id="admin-login-form">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-100 text-xs animate-shake" id="admin-login-error">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span className="font-bold leading-relaxed">{error}</span>
            </div>
          )}

          {/* Admin Email Input */}
          <div className="space-y-1" id="admin-login-email-group">
            <label className="text-[11px] text-gray-400 font-black tracking-widest uppercase block">
              {language === 'bn' ? 'অ্যাডমিন ইমেইল' : 'Admin Email'}
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder={language === 'bn' ? 'ইমেইল এড্রেস লিখুন' : 'Enter admin email'}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-300 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all duration-200"
                id="admin-login-email-input"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1" id="admin-login-password-group">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-gray-400 font-black tracking-widest uppercase block">
                {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder={language === 'bn' ? '••••••••' : '••••••••'}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-300 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all duration-200"
                id="admin-login-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                id="admin-login-password-toggle"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-600/10 active:scale-98 mt-6"
            id="admin-login-submit-btn"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{language === 'bn' ? 'লগইন করুন' : 'Sign In to Panel'}</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
