import React, { useState, useEffect } from 'react';
import { Activity, Save, Play, Power, ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { adminService } from '../utils/adminService';

interface TikTokPixelConfig {
  enabled: boolean;
  pixelId: string;
  accessToken: string;
  testEventCode: string;
  verified: boolean;
  events: {
    pageView: boolean;
    viewContent: boolean;
    search: boolean;
    addToCart: boolean;
    initiateCheckout: boolean;
    addPaymentInfo: boolean;
    completePayment: boolean;
  };
}

interface ValidationErrors {
  pixelId?: string;
  accessToken?: string;
  testEventCode?: string;
}

interface AdminTikTokPixelProps {
  language: 'en' | 'bn';
}

export const AdminTikTokPixel: React.FC<AdminTikTokPixelProps> = ({ language }) => {
  const [config, setConfig] = useState<TikTokPixelConfig>({
    enabled: false,
    pixelId: '',
    accessToken: '',
    testEventCode: '',
    verified: false,
    events: {
      pageView: true,
      viewContent: true,
      search: true,
      addToCart: true,
      initiateCheckout: true,
      addPaymentInfo: true,
      completePayment: true,
    }
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/admin/tracking/tiktok', {
          headers: adminService.getHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (data.tiktok) {
            setConfig(prev => ({
              ...prev,
              ...data.tiktok,
              pixelId: data.tiktok.pixelId ?? '',
              accessToken: data.tiktok.accessToken ?? '',
              testEventCode: data.tiktok.testEventCode ?? ''
            }));
            if (data.tiktok.enabled && data.tiktok.pixelId && data.tiktok.accessToken) {
              setIsConfigured(true);
            }
          }
        } else if (res.status === 401 || res.status === 403) {
          setStatus({ 
            type: 'error', 
            message: language === 'bn' ? 'অ্যাক্সেস প্রত্যাখ্যান করা হয়েছে - অ্যাডমিন অ্যাক্সেস প্রয়োজন।' : 'Authentication error — Admin access required.' 
          });
        }
      } catch (err) {
        console.error('Failed to load TikTok Pixel config:', err);
      }
    };
    loadConfig();
  }, [language]);

  const validate = (name: string, value: string) => {
    let error = '';
    
    if (name === 'pixelId') {
      if (config.enabled && !value) {
        error = language === 'bn' ? 'প্রয়োজনীয়' : 'Required';
      } else if (value && !/^[A-Z0-9]+$/i.test(value)) {
        error = language === 'bn' ? 'অবৈধ পিক্সেল আইডি' : 'Invalid Pixel ID';
      }
    }

    if (name === 'accessToken') {
      if (config.enabled && !value) {
        error = language === 'bn' ? 'অ্যাক্সেস টোকেন প্রয়োজন' : 'Access Token required';
      } else if (value && value.length < 10 && !value.includes('***')) {
        error = language === 'bn' ? 'অবৈধ অ্যাক্সেস টোকেন' : 'Invalid Access Token';
      }
    }

    if (name === 'testEventCode' && value) {
      if (!/^[A-Z0-9_]+$/i.test(value)) {
        error = language === 'bn' ? 'অবৈধ টেস্ট কোড' : 'Invalid Test Event Code';
      }
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
    validate(name, value);
  };

  const handleToggle = () => {
    const newEnabled = !config.enabled;
    setConfig(prev => ({ ...prev, enabled: newEnabled }));
    if (newEnabled) {
      validate('pixelId', config.pixelId);
      validate('accessToken', config.accessToken);
    } else {
      setErrors({});
    }
  };

  const isFormValid = () => {
    if (!config.enabled) return true;
    const pixelIdValid = config.pixelId.length >= 5 && /^[A-Z0-9]+$/i.test(config.pixelId);
    const tokenValid = config.accessToken.length >= 10;
    const testCodeValid = !config.testEventCode || /^[A-Z0-9_]+$/i.test(config.testEventCode);
    return pixelIdValid && tokenValid && testCodeValid && !Object.values(errors).some(e => !!e);
  };

  const handleSave = async () => {
    // Re-validate everything before save
    const pValid = validate('pixelId', config.pixelId);
    const aValid = validate('accessToken', config.accessToken);
    const tValid = validate('testEventCode', config.testEventCode);
    
    if (config.enabled && (!pValid || !aValid || !tValid)) {
      setStatus({ 
        type: 'error', 
        message: language === 'bn' ? 'দয়া করে হাইলাইট করা ক্ষেত্রগুলো সংশোধন করুন।' : 'Please correct the highlighted fields.' 
      });
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const res = await fetch('/api/admin/tracking/tiktok', {
        method: 'PUT',
        headers: adminService.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ tiktok: config })
      });

      if (res.ok) {
        setStatus({ 
          type: 'success', 
          message: language === 'bn' ? 'টিকটক পিক্সেল কনফিগারেশন সংরক্ষিত হয়েছে ✓' : 'TikTok Pixel configuration saved ✓' 
        });
        setIsConfigured(config.enabled && !!config.pixelId && !!config.accessToken);
        setTimeout(() => setStatus(null), 3000);
      } else {
        const data = await res.json();
        if (res.status === 401 || res.status === 403) {
          throw new Error(language === 'bn' ? 'প্রমাণীকরণ ত্রুটি — অ্যাডমিন অ্যাক্সেস প্রয়োজন।' : 'Authentication error — Admin access required.');
        }
        throw new Error(data.error || (language === 'bn' ? 'সেভ ব্যর্থ হয়েছে — কনফিগারেশন সংরক্ষিত হয়নি।' : 'Save failed — configuration was not saved.'));
      }
    } catch (err: any) {
      setStatus({ 
        type: 'error', 
        message: err.message || (language === 'bn' ? 'সেভ ব্যর্থ হয়েছে।' : 'Save failed.') 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEvent = async () => {
    if (!config.pixelId || !config.accessToken) {
      setStatus({ type: 'error', message: 'Pixel ID and Access Token are required for testing.' });
      return;
    }

    setIsTesting(true);
    setStatus(null);

    try {
      const res = await fetch('/api/tracking/tiktok-events', {
        method: 'POST',
        headers: adminService.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          eventName: 'TestEvent',
          eventData: { 
            value: 0.01, 
            currency: 'USD',
            content_type: 'product',
            contents: [{ id: 'test_123', name: 'Test Product', quantity: 1, price: 0.01 }]
          },
          eventId: `test_${Date.now()}`,
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      });

      const data = await res.json();
      if (data.success) {
        setStatus({ 
          type: 'success', 
          message: language === 'bn' ? 'টেস্ট ইভেন্ট সফলভাবে পাঠানো হয়েছে ✓' : 'Test event sent successfully ✓' 
        });
      } else {
        throw new Error(data.message || 'Test event failed');
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to send test event.' });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusDisplay = () => {
    if (!config.enabled) return { label: language === 'bn' ? 'টিকটক পিক্সেল বন্ধ' : 'DISABLED', color: 'bg-gray-100 text-gray-500 border-gray-200' };
    
    if (!config.pixelId || !config.accessToken) return { label: language === 'bn' ? 'কনফিগার করা হয়নি' : 'NOT CONFIGURED', color: 'bg-orange-50 text-orange-600 border-orange-100' };
    
    if (config.verified) return { label: language === 'bn' ? 'সক্রিয় ✓' : 'ACTIVE ✓', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    
    if (status?.message.includes('saved')) {
       return { label: language === 'bn' ? 'সংরক্ষিত ✓' : 'SAVED ✓', color: 'bg-blue-50 text-blue-600 border-blue-100' };
    }
    
    return { label: language === 'bn' ? 'অপেক্ষমান' : 'PENDING SAVE', color: 'bg-gray-50 text-gray-400 border-gray-200' };
  };

  const statusDisplay = getStatusDisplay();

  const handleVerify = async () => {
    if (!isConfigured) return;
    setIsVerifying(true);
    setStatus(null);

    try {
      const res = await fetch('/api/admin/tracking/tiktok/verify', {
        method: 'POST',
        headers: adminService.getHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({ type: 'success', message: data.message });
        // Reload to get verified state
        const configRes = await fetch('/api/admin/tracking/tiktok', { headers: adminService.getHeaders() });
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(prev => ({ ...prev, verified: configData.tiktok.verified }));
        }
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (err: any) {
      setStatus({ 
        type: 'error', 
        message: err.message || (language === 'bn' ? 'যাচাইকরণ ব্যর্থ হয়েছে ✕' : 'VERIFICATION FAILED ✕') 
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = () => {
    setConfig(prev => ({ ...prev, enabled: false }));
    setErrors({});
    setTimeout(() => {
      const btn = document.getElementById('tt-save-btn');
      if (btn) btn.click();
    }, 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-left pb-10" id="tiktok-pixel-config-page">
      
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.28-2.26.74-4.63 2.58-5.93 1.12-.81 2.45-1.28 3.84-1.35 0 2.2 0 4.39-.01 6.59-.88.13-1.88.58-2.32 1.4-.49.91-.3 2.12.44 2.91.72.71 1.76.92 2.73.74.97-.14 1.87-.74 2.33-1.6.34-.64.46-1.36.45-2.08V.02z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-black text-gray-800">TikTok Pixel</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Conversion Tracking & API Integration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusDisplay.color}`}>
            {statusDisplay.label}
          </span>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-xs font-bold">{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Core Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pixel Setup</h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-500">{language === 'bn' ? 'টিকটক পিক্সেল চালু করুন' : 'Enable TikTok Pixel'}</span>
                <button 
                  onClick={handleToggle}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${config.enabled ? 'bg-gray-900' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.enabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Pixel ID */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[11px] font-black text-gray-700 uppercase tracking-tight flex items-center gap-1.5">
                    TikTok Pixel ID
                    {config.enabled && <span className="text-red-500">*</span>}
                  </label>
                  <input 
                    type="text" 
                    name="pixelId"
                    value={config.pixelId || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. C3V4U5G6H7J8K9"
                    className={`w-full p-3 bg-gray-50 border rounded-xl text-xs font-bold focus:bg-white transition-all outline-hidden ${errors.pixelId ? 'border-red-500' : 'border-gray-150 focus:border-gray-900'}`}
                  />
                </div>
                <div className="sm:pt-6 shrink-0 w-28">
                  {errors.pixelId ? (
                    <div className="flex items-center gap-1.5 text-red-500">
                      <XCircle className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase">{errors.pixelId}</span>
                    </div>
                  ) : config.pixelId.length >= 5 ? (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase">{language === 'bn' ? 'সঠিক ✓' : 'Valid ✓'}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-gray-300 uppercase italic">
                      {language === 'bn' ? 'অপেক্ষমান' : 'Waiting...'}
                    </div>
                  )}
                </div>
              </div>

              {/* Access Token */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[11px] font-black text-gray-700 uppercase tracking-tight flex items-center gap-1.5">
                    API Access Token
                    {config.enabled && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input 
                      type={showToken ? 'text' : 'password'} 
                      name="accessToken"
                      value={config.accessToken || ''}
                      onChange={handleInputChange}
                      placeholder="Enter TikTok Marketing API token..."
                      className={`w-full p-3 bg-gray-50 border rounded-xl text-xs font-bold focus:bg-white transition-all outline-hidden pr-10 ${errors.accessToken ? 'border-red-500' : 'border-gray-150 focus:border-gray-900'}`}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowToken(!showToken)} 
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="sm:pt-6 shrink-0 w-28">
                  {errors.accessToken ? (
                    <div className="flex items-center gap-1.5 text-red-500">
                      <XCircle className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase whitespace-pre-wrap leading-tight">{errors.accessToken}</span>
                    </div>
                  ) : config.accessToken.length > 20 || config.accessToken.includes('***') ? (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase">{language === 'bn' ? 'সঠিক ✓' : 'Valid ✓'}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-gray-300 uppercase italic">
                      {language === 'bn' ? 'অপেক্ষমান' : 'Waiting...'}
                    </div>
                  )}
                </div>
              </div>

              {/* Test Event Code */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[11px] font-black text-gray-700 uppercase tracking-tight">Test Event Code (Optional)</label>
                  <input 
                    type="text" 
                    name="testEventCode"
                    value={config.testEventCode || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. TEST_CODE_123"
                    className={`w-full p-3 bg-gray-50 border rounded-xl text-xs font-bold focus:bg-white transition-all outline-hidden ${errors.testEventCode ? 'border-red-500' : 'border-gray-150 focus:border-gray-900'}`}
                  />
                </div>
                <div className="sm:pt-6 shrink-0 w-28">
                  {errors.testEventCode ? (
                    <div className="flex items-center gap-1.5 text-red-500">
                      <XCircle className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase whitespace-pre-wrap leading-tight">{errors.testEventCode}</span>
                    </div>
                  ) : config.testEventCode ? (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase">{language === 'bn' ? 'সঠিক ✓' : 'Valid ✓'}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-gray-400 uppercase italic">
                      {language === 'bn' ? 'ঐচ্ছিক' : 'Optional'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Events */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-5">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Tracking Events</h3>
            <div className="space-y-3">
              {(Object.keys(config.events) as Array<keyof typeof config.events>).map((eventKey) => (
                <div key={eventKey} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <span className="text-[11px] font-bold text-gray-700 capitalize">{(eventKey as string).replace(/([A-Z])/g, ' $1').trim()}</span>
                  <button 
                    onClick={() => setConfig(prev => ({ 
                      ...prev, 
                      events: { ...prev.events, [eventKey]: !prev.events[eventKey] } 
                    }))}
                    className={`w-8 h-4 rounded-full relative transition-all duration-300 ${config.events[eventKey] ? 'bg-red-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.events[eventKey] ? 'left-4.5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <button 
            id="tt-save-btn"
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 bg-gray-900 hover:bg-black text-white shadow-sm`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'সেভ করুন' : 'Save Changes')}</span>
          </button>
          <button 
            onClick={handleTestEvent}
            disabled={isTesting || !isConfigured}
            className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${isConfigured ? 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 shadow-sm' : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'}`}
          >
            <Play className={`w-4 h-4 ${isTesting ? 'animate-pulse' : ''}`} />
            <span>{isTesting ? (language === 'bn' ? 'টেস্ট হচ্ছে...' : 'Testing...') : (language === 'bn' ? 'টেস্ট ইভেন্ট' : 'Test Event')}</span>
          </button>
          <button 
            onClick={handleVerify}
            disabled={isVerifying || !isConfigured}
            className="px-6 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <ShieldCheck className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? (language === 'bn' ? 'যাচাই হচ্ছে...' : 'Verifying...') : (language === 'bn' ? 'যাচাই করুন' : 'Verify Pixel')}</span>
          </button>
        </div>
        
        <button 
          onClick={handleDisable}
          className="px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95"
        >
          <Power className="w-4 h-4" />
          <span>{language === 'bn' ? 'পিক্সেল বন্ধ করুন' : 'Disable Pixel'}</span>
        </button>
      </div>

    </div>
  );
};
