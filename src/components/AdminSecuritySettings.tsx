import React, { useState, useEffect } from 'react';
import { 
  Lock, Shield, UserCheck, Key, Smartphone, Eye, EyeOff, Save, 
  RotateCcw, AlertTriangle, CheckCircle2, XCircle, Clock, 
  History, Globe, Database, Fingerprint, Activity, ShieldAlert
} from 'lucide-react';
import { adminService } from '../utils/adminService';

interface SecurityConfig {
  admin_login_limit: string;
  admin_lockout_duration: string;
  admin_session_timeout: string;
  customer_registration_enabled: string;
  customer_email_verification: string;
  customer_phone_verification: string;
  otp_enabled: string;
  otp_expiry: string;
  otp_max_attempts: string;
  otp_resend_cooldown: string;
  admin_2fa_enabled: string;
  customer_2fa_enabled: string;
  api_rate_limit: string;
  cors_policy: string;
  password_reset_expiry: string;
  min_password_length: string;
}

interface AuditLog {
  id: number;
  user_id: number | null;
  user_type: string;
  event_type: string;
  description: string;
  ip_address: string;
  created_at: string;
  metadata: string;
}

interface AdminSecuritySettingsProps {
  language: 'en' | 'bn';
}

export const AdminSecuritySettings: React.FC<AdminSecuritySettingsProps> = ({ language }) => {
  const [config, setConfig] = useState<SecurityConfig>({
    admin_login_limit: '5',
    admin_lockout_duration: '30',
    admin_session_timeout: '120',
    customer_registration_enabled: 'true',
    customer_email_verification: 'true',
    customer_phone_verification: 'false',
    otp_enabled: 'true',
    otp_expiry: '5',
    otp_max_attempts: '3',
    otp_resend_cooldown: '60',
    admin_2fa_enabled: 'false',
    customer_2fa_enabled: 'false',
    api_rate_limit: '100',
    cors_policy: 'strict',
    password_reset_expiry: '60',
    min_password_length: '8'
  });
  
  const [originalConfig, setOriginalConfig] = useState<SecurityConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'logs'>('settings');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (originalConfig) {
      const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setIsDirty(hasChanges);
    }
  }, [config, originalConfig]);

  const fetchData = async () => {
    try {
      const [configRes, logsRes] = await Promise.all([
        fetch('/api/admin/security/config', { headers: adminService.getHeaders() }),
        fetch('/api/admin/security/audit-logs', { headers: adminService.getHeaders() })
      ]);

      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(data);
        setOriginalConfig(data);
      }
      if (logsRes.ok) {
        setAuditLogs(await logsRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch security data:', err);
    }
  };

  const handleConfigChange = (key: keyof SecurityConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/security/config', {
        method: 'POST',
        headers: adminService.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(config)
      });

      if (res.ok) {
        setOriginalConfig(config);
        setIsDirty(false);
        setStatus({ 
          type: 'success', 
          message: language === 'bn' ? 'নিরাপত্তা সেটিংস সংরক্ষিত হয়েছে ✓' : 'Security settings saved successfully ✓' 
        });
        setTimeout(() => setStatus(null), 3000);
        fetchData(); // Refresh logs to see the change
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: language === 'bn' ? 'সেভ ব্যর্থ হয়েছে ✕' : 'Failed to save security settings ✕' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBoolean = (key: keyof SecurityConfig) => {
    handleConfigChange(key, config[key] === 'true' ? 'false' : 'true');
  };

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-6 animate-fade-in text-left pb-20" id="admin-security-settings">
      
      {/* Header Info */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-black text-gray-800 leading-tight truncate">
              {language === 'bn' ? 'নিরাপত্তা সেটিংস' : 'Security Settings'}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">
              {language === 'bn' ? 'সিস্টেম অ্যাক্সেস ও ডেটা সুরক্ষা ব্যবস্থাপনা' : 'Manage system access and data protection'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-hidden">
            <button 
              onClick={() => setActiveSubTab('settings')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${activeSubTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {language === 'bn' ? 'সেটিংস' : 'Settings'}
            </button>
            <button 
              onClick={() => setActiveSubTab('logs')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${activeSubTab === 'logs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {language === 'bn' ? 'অডিট লগ' : 'Audit Logs'}
            </button>
          </div>

          {activeSubTab === 'settings' && (
            <button 
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="flex-1 sm:flex-none justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-sm shadow-indigo-200"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? '...' : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Settings')}</span>
            </button>
          )}
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-xs font-bold">{status.message}</span>
        </div>
      )}

      {activeSubTab === 'settings' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. Login & Authentication */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-150 shadow-xs space-y-5">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Key className="w-3.5 h-3.5" />
              {language === 'bn' ? 'লগইন ও অথেনটিকেশন' : 'Login & Authentication'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'ব্যর্থ লগইন লিমিট' : 'Failed Login Limit'}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={config.admin_login_limit}
                    onChange={(e) => handleConfigChange('admin_login_limit', e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold focus:border-indigo-500 transition-all outline-hidden pr-10"
                  />
                  <span className="absolute right-3 top-2.5 text-[9px] font-black text-gray-400 uppercase tracking-tighter">Attempts</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'লকআউট সময় (মিনিট)' : 'Lockout Duration (Min)'}</label>
                <input 
                  type="number" 
                  value={config.admin_lockout_duration}
                  onChange={(e) => handleConfigChange('admin_lockout_duration', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold focus:border-indigo-500 transition-all outline-hidden"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'সেশন টাইমআউট (মিনিট)' : 'Session Timeout (Min)'}</label>
                <input 
                  type="number" 
                  value={config.admin_session_timeout}
                  onChange={(e) => handleConfigChange('admin_session_timeout', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold focus:border-indigo-500 transition-all outline-hidden"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'পাসওয়ার্ড রিলেট এক্সপায়ারি' : 'Reset Token Expiry'}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={config.password_reset_expiry}
                    onChange={(e) => handleConfigChange('password_reset_expiry', e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold focus:border-indigo-500 transition-all outline-hidden"
                  />
                  <span className="absolute right-3 top-2.5 text-[9px] font-black text-gray-400 uppercase tracking-tighter">Min</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Customer Account Security */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-150 shadow-xs space-y-5">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5" />
              {language === 'bn' ? 'কাস্টমার অ্যাকাউন্ট সিকিউরিটি' : 'Customer Account Security'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 group">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-gray-700 block truncate">{language === 'bn' ? 'কাস্টমার রেজিস্ট্রেশন' : 'Registration Enabled'}</span>
                  <p className="text-[9px] text-gray-400 font-medium truncate">{language === 'bn' ? 'নতুন ইউজার রেজিস্ট্রেশন অন/অফ করুন' : 'Allow/Disallow new customer signups'}</p>
                </div>
                <button 
                  onClick={() => toggleBoolean('customer_registration_enabled')}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 shrink-0 ${config.customer_registration_enabled === 'true' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.customer_registration_enabled === 'true' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 group pt-3 border-t border-gray-50">
                <span className="text-xs font-bold text-gray-700 truncate">{language === 'bn' ? 'ইমেইল ভেরিফিকেশন' : 'Email Verification Required'}</span>
                <button 
                  onClick={() => toggleBoolean('customer_email_verification')}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 shrink-0 ${config.customer_email_verification === 'true' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.customer_email_verification === 'true' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 group pt-3 border-t border-gray-50">
                <span className="text-xs font-bold text-gray-700 truncate">{language === 'bn' ? 'ফোন ভেরিফিকেশন' : 'Phone Verification Required'}</span>
                <button 
                  onClick={() => toggleBoolean('customer_phone_verification')}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 shrink-0 ${config.customer_phone_verification === 'true' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.customer_phone_verification === 'true' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 3. OTP & Verification */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-150 shadow-xs space-y-5">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5" />
              {language === 'bn' ? 'ওটিপি ও ভেরিফিকেশন' : 'OTP & Verification'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between col-span-1 sm:col-span-2 mb-2 p-3 bg-gray-50 rounded-xl gap-4">
                <span className="text-xs font-bold text-gray-700 truncate">{language === 'bn' ? 'ওটিপি সিস্টেম সক্রিয়' : 'Global OTP System'}</span>
                <button 
                  onClick={() => toggleBoolean('otp_enabled')}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 shrink-0 ${config.otp_enabled === 'true' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.otp_enabled === 'true' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'ওটিপি মেয়াদ (মিনিট)' : 'OTP Expiry (Min)'}</label>
                <input 
                  type="number" 
                  value={config.otp_expiry}
                  onChange={(e) => handleConfigChange('otp_expiry', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold focus:border-indigo-500 transition-all outline-hidden"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'সর্বোচ্চ চেষ্টা' : 'Max Attempts'}</label>
                <input 
                  type="number" 
                  value={config.otp_max_attempts}
                  onChange={(e) => handleConfigChange('otp_max_attempts', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold focus:border-indigo-500 transition-all outline-hidden"
                />
              </div>
              <div className="space-y-1.5 col-span-1 sm:col-span-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'পুনরায় পাঠানোর বিরতি (সেকেন্ড)' : 'Resend Cooldown (Sec)'}</label>
                <input 
                  type="number" 
                  value={config.otp_resend_cooldown}
                  onChange={(e) => handleConfigChange('otp_resend_cooldown', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold focus:border-indigo-500 transition-all outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 4. Two-Factor Authentication & Advanced */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-150 shadow-xs space-y-5">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Fingerprint className="w-3.5 h-3.5" />
              {language === 'bn' ? 'অ্যাডভান্সড সিকিউরিটি' : 'Advanced Security'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 group">
                <span className="text-xs font-bold text-gray-700 truncate">{language === 'bn' ? 'অ্যাডমিন ২-ফ্যাক্টর (2FA)' : 'Admin 2FA'}</span>
                <button 
                  onClick={() => toggleBoolean('admin_2fa_enabled')}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 shrink-0 ${config.admin_2fa_enabled === 'true' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.admin_2fa_enabled === 'true' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 group pt-3 border-t border-gray-50">
                <span className="text-xs font-bold text-gray-700 truncate">{language === 'bn' ? 'কাস্টমার ২-ফ্যাক্টর (2FA)' : 'Customer 2FA'}</span>
                <button 
                  onClick={() => toggleBoolean('customer_2fa_enabled')}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 shrink-0 ${config.customer_2fa_enabled === 'true' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.customer_2fa_enabled === 'true' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="pt-3 border-t border-gray-50 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'এপিআই রেট লিমিট' : 'API Rate Limit (Req/Min)'}</label>
                  <input 
                    type="number" 
                    value={config.api_rate_limit}
                    onChange={(e) => handleConfigChange('api_rate_limit', e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold focus:border-indigo-500 transition-all outline-hidden"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'CORS পলিসি' : 'CORS Policy'}</label>
                  <select 
                    value={config.cors_policy}
                    onChange={(e) => handleConfigChange('cors_policy', e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold focus:border-indigo-500 transition-all outline-hidden"
                  >
                    <option value="strict">Strict (Only App Domains)</option>
                    <option value="permissive">Permissive (Subdomains Included)</option>
                    <option value="trusted">Trusted IPs Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Warnings */}
          <div className="lg:col-span-2 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3.5 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-[11px] font-black text-amber-800 uppercase tracking-tight">
                {language === 'bn' ? 'সতর্কবার্তা: গুরুত্বপূর্ণ পরিবর্তন' : 'CRITICAL WARNING: SENSITIVE CHANGES'}
              </p>
              <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                {language === 'bn' 
                  ? 'নিরাপত্তা সেটিংস পরিবর্তন করলে সিস্টেমের অ্যাক্সেস এবং ইউজার লগইন প্রক্রিয়া সরাসরি প্রভাবিত হতে পারে। কোনো পরিবর্তন করার আগে নিশ্চিত হয়ে নিন যে আপনি সেটিংসগুলো বুঝতে পেরেছেন।'
                  : 'Modifying security settings directly impacts system access and user authentication flows. Ensure you understand the implications of lockout periods and verification requirements before saving.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Audit Logs View */
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-150 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <History className="w-3.5 h-3.5" />
              {language === 'bn' ? 'নিরাপত্তা অডিট লগ' : 'Security Audit Logs'}
            </h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full">
              <Activity className="w-3 h-3 text-indigo-600" />
              <span className="text-[10px] font-black text-indigo-700">{auditLogs.length} Events Logged</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'সময়' : 'Timestamp'}</th>
                  <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'ইভেন্ট' : 'Event'}</th>
                  <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'বিবরণ' : 'Description'}</th>
                  <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'ইউজার' : 'User'}</th>
                  <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">{language === 'bn' ? 'আইপি' : 'IP Address'}</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs font-bold text-gray-400">
                      {language === 'bn' ? 'কোনো লগ পাওয়া যায়নি' : 'No security logs found'}
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 text-[10px] font-bold text-gray-500 whitespace-nowrap">{formatTimestamp(log.created_at)}</td>
                      <td className="p-3">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight ${
                          log.event_type.includes('FAIL') || log.event_type.includes('LOCK') || log.event_type.includes('ERROR')
                            ? 'bg-red-50 text-red-700 border border-red-100' 
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {log.event_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] font-medium text-gray-600 max-w-xs">{log.description}</td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-700 capitalize">{log.user_type}</span>
                          {log.user_id && <span className="text-[9px] text-gray-400">ID: {log.user_id}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-[10px] font-mono font-bold text-gray-400">{log.ip_address || '---'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
