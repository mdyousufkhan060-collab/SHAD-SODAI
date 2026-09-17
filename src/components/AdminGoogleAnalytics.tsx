import React, { useState, useEffect, useRef } from 'react';
import { Activity, Save, Play, Power, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { adminService } from '../utils/adminService';

interface GoogleAnalyticsConfig {
  enabled: boolean;
  measurementId: string;
  verified: boolean;
}

interface AdminGoogleAnalyticsProps {
  language: 'en' | 'bn';
}

type ValidationState = 'empty' | 'valid' | 'invalid';

export const AdminGoogleAnalytics: React.FC<AdminGoogleAnalyticsProps> = ({ language }) => {
  const [config, setConfig] = useState<GoogleAnalyticsConfig>({
    enabled: false,
    measurementId: '',
    verified: false
  });

  const [savedConfig, setSavedConfig] = useState<GoogleAnalyticsConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ type: 'verified' | 'failed' | 'none', message?: string }>({ type: 'none' });
  const [validation, setValidation] = useState<ValidationState>('empty');

  const firstInvalidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/admin/tracking/google', {
          headers: adminService.getHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (data.google) {
            const loaded = data.google;
            setConfig({
              enabled: loaded.enabled ?? false,
              measurementId: loaded.measurementId ?? '',
              verified: loaded.verified ?? false
            });
            setSavedConfig(loaded);
            setValidation(validateId(loaded.measurementId ?? ''));
            if (loaded.verified) {
              setVerificationResult({ type: 'verified' });
            }
          }
        } else if (res.status === 401) {
          setStatus({
            type: 'error',
            message: language === 'bn' ? 'অ্যাডমিন অ্যাক্সেস প্রয়োজন (AUTHENTICATION ERROR ✕)' : 'Admin access required (AUTHENTICATION ERROR ✕)'
          });
        }
      } catch (err) {
        console.error('Failed to load Google Analytics config:', err);
      }
    };
    loadConfig();
  }, []);

  const validateId = (id: string): ValidationState => {
    if (!id) return 'empty';
    return /^G-[A-Z0-9]+$/i.test(id) ? 'valid' : 'invalid';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newConfig = { ...config, [name]: value, verified: false };
    setConfig(newConfig);
    setValidation(validateId(value));
    setVerificationResult({ type: 'none' });

    if (savedConfig) {
      setIsDirty(JSON.stringify(newConfig) !== JSON.stringify(savedConfig));
    } else {
      setIsDirty(true);
    }
  };

  const handleToggle = () => {
    const newConfig = { ...config, enabled: !config.enabled, verified: false };
    setConfig(newConfig);
    setVerificationResult({ type: 'none' });
    
    if (savedConfig) {
      setIsDirty(JSON.stringify(newConfig) !== JSON.stringify(savedConfig));
    } else {
      setIsDirty(true);
    }
  };

  const isFormValid = () => {
    if (config.enabled && validation === 'empty') return false;
    return validation !== 'invalid';
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      if (firstInvalidRef.current) {
        firstInvalidRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const res = await fetch('/api/admin/tracking/google', {
        method: 'PUT',
        headers: adminService.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ google: config })
      });

      const data = await res.json();
      if (res.ok) {
        setSavedConfig(config);
        setIsDirty(false);
        setStatus({ 
          type: 'success', 
          message: language === 'bn' ? 'GA4 কনফিগারেশন সেভ হয়েছে' : 'GA4 Configuration Saved ✓' 
        });
        setTimeout(() => setStatus(null), 3000);
      } else {
        if (res.status === 401) {
          throw new Error(language === 'bn' ? 'অ্যাডমিন অ্যাক্সেস প্রয়োজন (AUTHENTICATION ERROR ✕)' : 'Admin access required (AUTHENTICATION ERROR ✕)');
        }
        throw new Error(data.error || (language === 'bn' ? 'সেভ ব্যর্থ হয়েছে (SAVE FAILED ✕)' : 'Save Failed ✕'));
      }
    } catch (err: any) {
      setStatus({ 
        type: 'error', 
        message: err.message || (language === 'bn' ? 'ডাটাবেস সেভ ব্যর্থ হয়েছে (SAVE FAILED ✕)' : 'Database Save Failed ✕') 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    if (!isFormValid() || isDirty) {
      setStatus({
        type: 'error',
        message: language === 'bn' ? 'যাচাই করার আগে সেভ করুন' : 'Please save changes before verifying.'
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult({ type: 'none' });

    try {
      const res = await fetch('/api/admin/tracking/google/verify', {
        method: 'POST',
        headers: adminService.getHeaders()
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setVerificationResult({ type: 'verified' });
        // Reload config to get verified state
        const configRes = await fetch('/api/admin/tracking/google', { headers: adminService.getHeaders() });
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(configData.google);
        }
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (err: any) {
      setVerificationResult({ 
        type: 'failed', 
        message: err.message || (language === 'bn' ? 'ভেরিফিকেশন ব্যর্থ হয়েছে' : 'Verification Failed ✕') 
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTestEvent = async () => {
    if (!config.enabled || !config.measurementId || isDirty) return;
    
    setIsTesting(true);
    try {
      const win = window as any;
      if (win.gtag) {
        win.gtag('event', 'test_verification', {
          event_category: 'admin_test',
          event_label: 'manual_verification_test'
        });
        setStatus({
          type: 'success',
          message: language === 'bn' ? 'টেস্ট পেজ ভিউ পাঠানো হয়েছে' : 'Test event sent successfully ✓'
        });
      } else {
        throw new Error('GA4 not initialized');
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: language === 'bn' ? 'টেস্ট ব্যর্থ হয়েছে' : 'Test event failed ✕'
      });
    } finally {
      setTimeout(() => setIsTesting(false), 1000);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleDisable = () => {
    const disabledConfig = { ...config, enabled: false, verified: false };
    setConfig(disabledConfig);
    setVerificationResult({ type: 'none' });
    setIsDirty(true);
    
    setTimeout(() => {
      const btn = document.getElementById('ga-save-btn');
      if (btn) btn.click();
    }, 100);
  };

  const handleFullReload = () => {
    window.location.href = '/';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-left pb-10" id="google-analytics-config-page">
      
      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-800">Google Analytics 4</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">GA4 E-commerce Implementation</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Indicators Logic */}
          {!config.enabled ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-full border border-gray-100 uppercase">
              DISABLED
            </span>
          ) : isDirty ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-full border border-amber-100 uppercase">
              UNSAVED CHANGES
            </span>
          ) : savedConfig ? (
            <>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-100 uppercase">
                SAVED ✓
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full border border-blue-100 uppercase">
                ACTIVE ✓
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-full border border-gray-100 uppercase">
              NOT CONFIGURED
            </span>
          )}

          {verificationResult.type === 'verified' && !isDirty && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-100 uppercase">
              VERIFIED ✓
            </span>
          )}
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-xs font-bold uppercase">{status.message}</span>
        </div>
      )}

      {verificationResult.type === 'failed' && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 flex items-start gap-3 animate-fade-in">
          <XCircle className="w-5 h-5 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase">VERIFICATION FAILED ✕</p>
            <p className="text-[10px] font-semibold opacity-80">{verificationResult.message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Main Config Card */}
        <div className={`bg-white p-6 rounded-2xl border shadow-xs space-y-6 transition-all ${validation === 'invalid' ? 'border-red-500 ring-1 ring-red-50' : 'border-gray-150'}`} ref={validation === 'invalid' ? firstInvalidRef : null}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Configuration</h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500">Enable Google Analytics</span>
              <button 
                onClick={handleToggle}
                className={`w-10 h-5 rounded-full relative transition-all duration-300 ${config.enabled ? 'bg-orange-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.enabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-gray-700 uppercase tracking-tight flex items-center gap-1.5">
                  GA4 Measurement ID
                  {config.enabled && <span className="text-red-500">*</span>}
                </label>
                
                {validation === 'valid' && (
                  <span className="flex items-center gap-1 text-emerald-600 animate-fade-in">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">Valid ✓</span>
                  </span>
                )}
                {validation === 'invalid' && (
                  <span className="flex items-center gap-1 text-red-500 animate-fade-in">
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">Invalid ✕</span>
                  </span>
                )}
              </div>
              
              <input 
                type="text" 
                name="measurementId"
                value={config.measurementId || ''}
                onChange={handleInputChange}
                placeholder="G-XXXXXXXXXX"
                className={`w-full p-3 bg-gray-50 border rounded-xl text-xs font-bold focus:bg-white transition-all outline-hidden ${validation === 'invalid' ? 'border-red-500' : 'border-gray-150 focus:border-orange-600'}`}
              />
              
              {validation === 'invalid' && (
                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 uppercase">
                  <AlertCircle className="w-3 h-3" />
                  {language === 'bn' ? 'অকার্যকর ফরম্যাট। G-XXXXXXXXXX ফরম্যাট ব্যবহার করুন।' : 'Invalid format. Use G-XXXXXXXXXX.'}
                </p>
              )}
              {config.enabled && validation === 'empty' && (
                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 uppercase">
                  <AlertCircle className="w-3 h-3" />
                  {language === 'bn' ? 'মেজারমেন্ট আইডি প্রয়োজন।' : 'Measurement ID is required when enabled.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* E-commerce Logic Card */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-150 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-orange-600" />
            <h4 className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Automated Event Protection</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Duplicate Prevention</p>
              <p className="text-[10px] text-gray-400 font-semibold leading-relaxed italic">
                Advanced registry prevents duplicate purchase events and ensures unique transaction reporting even on page refreshes.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 h-fit">
              {['page_view', 'view_item', 'search', 'add_to_cart', 'begin_checkout', 'add_payment_info', 'purchase'].map(event => (
                <span key={event} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-500 text-[9px] font-bold rounded-full">
                  {event}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <button 
            id="ga-save-btn"
            onClick={handleSave}
            disabled={isSaving || !isFormValid()}
            className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${isFormValid() ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            <Save className="w-4 h-4" />
            <span className="uppercase">{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
          </button>
          
          <button 
            onClick={handleVerify}
            disabled={isVerifying || !isFormValid() || !config.enabled || isDirty}
            className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${isFormValid() && config.enabled && !isDirty ? 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 shadow-xs' : 'bg-gray-100 text-gray-300 cursor-not-allowed border-transparent'}`}
          >
            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span className="uppercase">{isVerifying ? 'VERIFYING...' : 'VERIFY GA4'}</span>
          </button>

          <button 
            onClick={handleTestEvent}
            disabled={isTesting || !config.enabled || isDirty}
            className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${config.enabled && !isDirty ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-100' : 'bg-gray-100 text-gray-300 cursor-not-allowed border-transparent'}`}
          >
            <Play className={`w-4 h-4 ${isTesting ? 'animate-pulse' : ''}`} />
            <span className="uppercase">TEST GA4 EVENT</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDisable}
            className="px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95"
          >
            <Power className="w-4 h-4" />
            <span className="uppercase">DISABLE GOOGLE ANALYTICS</span>
          </button>
          
          <button 
            onClick={handleFullReload}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <span className="uppercase">FINISH & GO HOME</span>
          </button>
        </div>
      </div>

    </div>
  );
};

