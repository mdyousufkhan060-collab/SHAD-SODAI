import React, { useState, useEffect, useRef } from 'react';
import { Activity, Save, Play, Power, CheckCircle2, AlertCircle, Code, ShieldCheck, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { adminService } from '../utils/adminService';

interface WebsiteTrackingConfig {
  enabled: boolean;
  gtmId: string;
  headScript: string;
  bodyScript: string;
  footerScript: string;
  verified: boolean;
}

interface ValidationStates {
  gtmId: 'empty' | 'valid' | 'invalid';
  headScript: 'empty' | 'valid' | 'invalid';
  bodyScript: 'empty' | 'valid' | 'invalid';
  footerScript: 'empty' | 'valid' | 'invalid';
}

interface AdminWebsiteTrackingProps {
  language: 'en' | 'bn';
}

export const AdminWebsiteTracking: React.FC<AdminWebsiteTrackingProps> = ({ language }) => {
  const [config, setConfig] = useState<WebsiteTrackingConfig>({
    enabled: false,
    gtmId: '',
    headScript: '',
    bodyScript: '',
    footerScript: '',
    verified: false
  });

  const [savedConfig, setSavedConfig] = useState<WebsiteTrackingConfig | null>(null);
  const [validation, setValidation] = useState<ValidationStates>({
    gtmId: 'empty',
    headScript: 'empty',
    bodyScript: 'empty',
    footerScript: 'empty'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ type: 'verified' | 'failed' | 'none', message?: string }>({ type: 'none' });
  const [isDirty, setIsDirty] = useState(false);

  const firstInvalidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/admin/tracking/website', {
          headers: adminService.getHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (data.website) {
            const loaded = data.website;
            setConfig({
              enabled: loaded.enabled ?? false,
              gtmId: loaded.gtmId ?? '',
              headScript: loaded.headScript ?? '',
              bodyScript: loaded.bodyScript ?? '',
              footerScript: loaded.footerScript ?? '',
              verified: loaded.verified ?? false
            });
            setSavedConfig(loaded);
            
            setValidation({
              gtmId: validateField('gtmId', loaded.gtmId ?? ''),
              headScript: validateField('headScript', loaded.headScript ?? ''),
              bodyScript: validateField('bodyScript', loaded.bodyScript ?? ''),
              footerScript: validateField('footerScript', loaded.footerScript ?? '')
            });

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
        console.error('Failed to load Website tracking config:', err);
      }
    };
    loadConfig();
  }, []);

  const validateField = (name: string, value: string): 'empty' | 'valid' | 'invalid' => {
    if (!value) return 'empty';
    
    if (name === 'gtmId') {
      return /^GTM-[A-Z0-9]+$/i.test(value) ? 'valid' : 'invalid';
    }

    if (name.includes('Script')) {
      if (value.includes('<') && !value.includes('>')) return 'invalid';
      return 'valid';
    }

    return 'valid';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newConfig = { ...config, [name]: value, verified: false };
    setConfig(newConfig);
    setValidation(prev => ({ ...prev, [name]: validateField(name, value) }));
    setVerificationResult({ type: 'none' });
    
    if (savedConfig) {
      const dirty = JSON.stringify(newConfig) !== JSON.stringify(savedConfig);
      setIsDirty(dirty);
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
    return validation.gtmId !== 'invalid' && 
           validation.headScript !== 'invalid' && 
           validation.bodyScript !== 'invalid' && 
           validation.footerScript !== 'invalid';
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
      const res = await fetch('/api/admin/tracking/website', {
        method: 'PUT',
        headers: adminService.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ website: config })
      });

      if (res.ok) {
        setSavedConfig(config);
        setIsDirty(false);
        setStatus({ 
          type: 'success', 
          message: language === 'bn' ? 'সেভিংস সফল হয়েছে (SAVED ✓)' : 'SAVED ✓' 
        });
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        if (res.status === 401) {
          throw new Error(language === 'bn' ? 'অ্যাডমিন অ্যাক্সেস প্রয়োজন (AUTHENTICATION ERROR ✕)' : 'Admin access required (AUTHENTICATION ERROR ✕)');
        }
        throw new Error(data.error || (language === 'bn' ? 'সেভ ব্যর্থ হয়েছে (SAVE FAILED ✕)' : 'SAVE FAILED ✕'));
      }
    } catch (err: any) {
      setStatus({ 
        type: 'error', 
        message: err.message || (language === 'bn' ? 'সেভ ব্যর্থ হয়েছে (SAVE FAILED ✕)' : 'SAVE FAILED ✕') 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    if (!isFormValid() || isDirty) {
      setStatus({
        type: 'error',
        message: language === 'bn' ? 'যাচাই করার আগে আপনার পরিবর্তনগুলি সেভ করুন।' : 'Please save your changes before verifying.'
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult({ type: 'none' });

    try {
      const res = await fetch('/api/admin/tracking/website/verify', {
        method: 'POST',
        headers: adminService.getHeaders()
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setVerificationResult({ type: 'verified' });
        // Reload config to get verified state
        const configRes = await fetch('/api/admin/tracking/website', { headers: adminService.getHeaders() });
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(configData.website);
        }
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (err: any) {
      setVerificationResult({ 
        type: 'failed', 
        message: err.message || (language === 'bn' ? 'ভেরিফিকেশন সম্পন্ন করা যায়নি।' : 'Verification could not be completed.') 
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = () => {
    const disabledConfig = { ...config, enabled: false, verified: false };
    setConfig(disabledConfig);
    setVerificationResult({ type: 'none' });
    setIsDirty(true);
    
    setTimeout(() => {
      const btn = document.getElementById('ws-save-btn');
      if (btn) btn.click();
    }, 100);
  };

  const handleFullReload = () => {
    window.location.href = '/';
  };

  const renderStatusIndicator = (field: keyof ValidationStates) => {
    const state = validation[field];
    if (state === 'empty') return null;
    if (state === 'valid') return (
      <div className="flex items-center gap-1 text-emerald-600 animate-fade-in">
        <CheckCircle className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold">Valid ✓</span>
      </div>
    );
    return (
      <div className="flex items-center gap-1 text-red-500 animate-fade-in">
        <XCircle className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold">Invalid ✕</span>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-left pb-10" id="website-tracking-config-page">
      
      <div className="bg-white p-5 rounded-2xl border border-gray-150 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-800">Website Tracking</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Configuration & Script Management</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!config.enabled ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-full border border-gray-100 uppercase">
              DISABLED
            </span>
          ) : isDirty ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-full border border-amber-100 uppercase">
              UNSAVED CHANGES
            </span>
          ) : savedConfig ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-100 uppercase">
              SAVED ✓
            </span>
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

          {verificationResult.type === 'failed' && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-[10px] font-black rounded-full border border-red-100 uppercase">
              VERIFICATION FAILED ✕
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

      {verificationResult.type === 'failed' && verificationResult.message && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase">{language === 'bn' ? 'ভেরিফিকেশন ব্যর্থ হয়েছে' : 'Verification Failed ✕'}</p>
            <p className="text-[10px] font-semibold opacity-80">{verificationResult.message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        
        <div className={`bg-white p-6 rounded-2xl border shadow-xs space-y-5 transition-all ${validation.gtmId === 'invalid' ? 'border-red-500 ring-1 ring-red-50' : 'border-gray-150'}`} ref={validation.gtmId === 'invalid' ? firstInvalidRef : null}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Google Tag Manager</h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500">Enable Website Tracking</span>
              <button 
                onClick={handleToggle}
                className={`w-10 h-5 rounded-full relative transition-all duration-300 ${config.enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.enabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-gray-700 uppercase tracking-tight flex items-center gap-1.5">
                  GTM Container ID (Optional)
                </label>
                {renderStatusIndicator('gtmId')}
              </div>
              <input 
                type="text" 
                name="gtmId"
                value={config.gtmId || ''}
                onChange={handleInputChange}
                placeholder="e.g. GTM-XXXXXXX"
                className={`w-full p-3 bg-gray-50 border rounded-xl text-xs font-bold focus:bg-white transition-all outline-hidden ${validation.gtmId === 'invalid' ? 'border-red-500' : 'border-gray-150 focus:border-indigo-600'}`}
              />
              {validation.gtmId === 'invalid' && (
                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 uppercase">
                  <AlertCircle className="w-3 h-3" /> 
                  {language === 'bn' ? 'অকার্যকর GTM আইডি। GTM-XXXXXXX ফরম্যাট ব্যবহার করুন।' : 'Invalid GTM Container ID. Use the format GTM-XXXXXXX.'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Custom Scripts</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`space-y-2 p-1 rounded-xl transition-all ${validation.headScript === 'invalid' ? 'bg-red-50/30' : ''}`}>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-gray-700 uppercase tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  Custom Head Script
                </label>
                {renderStatusIndicator('headScript')}
              </div>
              <p className="text-[9px] text-gray-400 font-semibold italic">Inside &lt;head&gt; tag</p>
              <textarea 
                name="headScript"
                value={config.headScript || ''}
                onChange={handleInputChange}
                rows={6}
                placeholder="<!-- Custom Head Code -->"
                className={`w-full p-3 bg-gray-50 border rounded-xl text-[10px] font-mono focus:bg-white transition-all outline-hidden ${validation.headScript === 'invalid' ? 'border-red-500' : 'border-gray-150 focus:border-indigo-600'}`}
              />
            </div>

            <div className={`space-y-2 p-1 rounded-xl transition-all ${validation.bodyScript === 'invalid' ? 'bg-red-50/30' : ''}`}>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-gray-700 uppercase tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Custom Body Script
                </label>
                {renderStatusIndicator('bodyScript')}
              </div>
              <p className="text-[9px] text-gray-400 font-semibold italic">Start of &lt;body&gt;</p>
              <textarea 
                name="bodyScript"
                value={config.bodyScript || ''}
                onChange={handleInputChange}
                rows={6}
                placeholder="<!-- Custom Body Code -->"
                className={`w-full p-3 bg-gray-50 border rounded-xl text-[10px] font-mono focus:bg-white transition-all outline-hidden ${validation.bodyScript === 'invalid' ? 'border-red-500' : 'border-gray-150 focus:border-indigo-600'}`}
              />
            </div>

            <div className={`space-y-2 p-1 rounded-xl transition-all ${validation.footerScript === 'invalid' ? 'bg-red-50/30' : ''}`}>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-gray-700 uppercase tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                  Custom Footer Script
                </label>
                {renderStatusIndicator('footerScript')}
              </div>
              <p className="text-[9px] text-gray-400 font-semibold italic">Before &lt;/body&gt; ends</p>
              <textarea 
                name="footerScript"
                value={config.footerScript || ''}
                onChange={handleInputChange}
                rows={6}
                placeholder="<!-- Custom Footer Code -->"
                className={`w-full p-3 bg-gray-50 border rounded-xl text-[10px] font-mono focus:bg-white transition-all outline-hidden ${validation.footerScript === 'invalid' ? 'border-red-500' : 'border-gray-150 focus:border-indigo-600'}`}
              />
            </div>
          </div>
        </div>

      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <button 
            id="ws-save-btn"
            onClick={handleSave}
            disabled={isSaving || !isFormValid()}
            className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${isFormValid() ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
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
            <span className="uppercase">{isVerifying ? 'VERIFYING...' : 'VERIFY TRACKING'}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDisable}
            className="px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95"
          >
            <Power className="w-4 h-4" />
            <span className="uppercase">DISABLE TRACKING</span>
          </button>
          
          <button 
            onClick={handleFullReload}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <span className="uppercase">FINISH & GO HOME</span>
          </button>
        </div>
      </div>

    </div>
  );
};

