import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  PhoneCall, 
  Truck, 
  MessageCircle, 
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ApiConfig {
  enabled: boolean;
  [key: string]: any;
}

interface AllConfigs {
  gemini: ApiConfig;
  twilio: ApiConfig;
  steadfast: ApiConfig;
  whatsapp: ApiConfig;
  messenger: ApiConfig;
  smtp: ApiConfig;
}

const DEFAULT_CONFIGS: AllConfigs = {
  gemini: { enabled: false, apiKey: '', model: 'gemini-1.5-flash' },
  twilio: { enabled: false, accountSid: '', authToken: '', phoneNumber: '' },
  steadfast: { enabled: false, apiKey: '', secretKey: '', baseUrl: 'https://portal.steadfast.com.bd/api/v1' },
  whatsapp: { enabled: false, accessToken: '', businessAccountId: '', phoneNumberId: '', verifyToken: '' },
  messenger: { enabled: false, pageId: '', accessToken: '', verifyToken: '' },
  smtp: { enabled: false, host: '', port: '465', user: '', pass: '', sender: '' }
};

export const AdminAiApiSettings: React.FC = () => {
  const { language } = useLanguage();
  const [configs, setConfigs] = useState<AllConfigs>(DEFAULT_CONFIGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, { success?: boolean; message?: string }>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    gemini: true,
    twilio: false,
    steadfast: false,
    whatsapp: false,
    messenger: false,
    smtp: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/site-settings');
      if (res.ok) {
        const data = await res.json();
        const newConfigs = { ...DEFAULT_CONFIGS };
        
        Object.keys(DEFAULT_CONFIGS).forEach(key => {
          if (data[`api_${key}`]) {
            try {
              newConfigs[key as keyof AllConfigs] = JSON.parse(data[`api_${key}`]);
            } catch (e) {
              console.error(`Failed to parse config for ${key}`);
            }
          }
        });
        
        setConfigs(newConfigs);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (section: keyof AllConfigs) => {
    setIsSaving(section);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [`api_${section}`]: JSON.stringify(configs[section])
        })
      });
      
      if (res.ok) {
        setStatus(prev => ({ ...prev, [section]: { success: true, message: language === 'bn' ? 'সেটিংস সংরক্ষিত হয়েছে' : 'Settings saved successfully' } }));
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      setStatus(prev => ({ ...prev, [section]: { success: false, message: language === 'bn' ? 'সংরক্ষণ ব্যর্থ হয়েছে' : 'Failed to save' } }));
    } finally {
      setIsSaving(null);
      setTimeout(() => setStatus(prev => {
        const next = { ...prev };
        delete next[section];
        return next;
      }), 3000);
    }
  };

  const handleTest = async (section: string) => {
    setTesting(section);
    try {
      // Endpoint to be implemented in server.ts
      const res = await fetch(`/api/admin/test-api/${section}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configs[section as keyof AllConfigs])
      });
      const data = await res.json();
      setStatus(prev => ({ ...prev, [`test_${section}`]: { success: data.success, message: data.message } }));
    } catch (err) {
      setStatus(prev => ({ ...prev, [`test_${section}`]: { success: false, message: 'Connection failed' } }));
    } finally {
      setTesting(null);
    }
  };

  const updateConfig = (section: keyof AllConfigs, field: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleKeyVisibility = (field: string) => {
    setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const SectionHeader = ({ id, icon: Icon, title, purpose, enabled }: any) => (
    <div 
      className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => toggleSection(id)}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{title}</h3>
          <p className="text-[10px] text-gray-500 font-medium">{purpose}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {enabled ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
            <CheckCircle className="w-3 h-3" />
            {language === 'bn' ? 'সক্রিয়' : 'Enabled'}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase">
            <XCircle className="w-3 h-3" />
            {language === 'bn' ? 'নিষ্ক্রিয়' : 'Disabled'}
          </span>
        )}
        {expandedSections[id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>
    </div>
  );

  const InputField = ({ label, value, onChange, type = 'text', placeholder, isSecret, id }: any) => (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black text-gray-500 uppercase tracking-tight">{label}</label>
      <div className="relative">
        <input
          type={isSecret && !showKeys[id] ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 px-3 bg-white border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-300"
        />
        {isSecret && (
          <button 
            type="button"
            onClick={() => toggleKeyVisibility(id)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
          >
            {showKeys[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 animate-fade-in space-y-6 pb-20">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-emerald-600" />
            {language === 'bn' ? 'AI এবং API সেটিংস' : 'AI & API Settings'}
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            {language === 'bn' ? 'সিস্টেম অটোমেশন এবং এক্সটার্নাল সার্ভিস ইন্টিগ্রেশন ম্যানেজ করুন' : 'Manage system automation and external service integrations'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* GEMINI AI */}
        <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
          <SectionHeader 
            id="gemini" 
            icon={ShieldCheck} 
            title="Gemini AI Settings" 
            purpose="Customer confirmation & verification"
            enabled={configs.gemini.enabled}
          />
          {expandedSections.gemini && (
            <div className="p-5 space-y-5 animate-slide-down">
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="checkbox" 
                  id="gemini-enabled"
                  checked={configs.gemini.enabled}
                  onChange={(e) => updateConfig('gemini', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="gemini-enabled" className="text-sm font-bold text-gray-700">Enable Gemini AI Service</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField 
                  id="gemini-key"
                  label="Gemini API Key" 
                  value={configs.gemini.apiKey} 
                  onChange={(val: string) => updateConfig('gemini', 'apiKey', val)}
                  isSecret={true}
                  placeholder="Enter your API key"
                />
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-tight">Model Selection</label>
                  <select 
                    value={configs.gemini.model}
                    onChange={(e) => updateConfig('gemini', 'model', e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended - Fast)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Powerful)</option>
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Latest)</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button 
                  onClick={() => handleSave('gemini')}
                  disabled={isSaving === 'gemini'}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {isSaving === 'gemini' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Settings'}
                </button>
                <button 
                  onClick={() => handleTest('gemini')}
                  disabled={testing === 'gemini'}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {testing === 'gemini' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {language === 'bn' ? 'টেস্ট কানেকশন' : 'Test Connection'}
                </button>
                {status.gemini && (
                  <span className={`text-xs font-bold ${status.gemini.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {status.gemini.message}
                  </span>
                )}
                {status.test_gemini && (
                  <span className={`text-xs font-bold ${status.test_gemini.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {status.test_gemini.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* TWILIO VOICE */}
        <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
          <SectionHeader 
            id="twilio" 
            icon={PhoneCall} 
            title="Twilio Voice Call Settings" 
            purpose="Automated order confirmation calls"
            enabled={configs.twilio.enabled}
          />
          {expandedSections.twilio && (
            <div className="p-5 space-y-5 animate-slide-down">
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="checkbox" 
                  id="twilio-enabled"
                  checked={configs.twilio.enabled}
                  onChange={(e) => updateConfig('twilio', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="twilio-enabled" className="text-sm font-bold text-gray-700">Enable Automated Voice Calls</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField 
                  label="Account SID" 
                  value={configs.twilio.accountSid} 
                  onChange={(val: string) => updateConfig('twilio', 'accountSid', val)}
                  placeholder="ACxxxxxxxxxxxxxxxx"
                />
                <InputField 
                  id="twilio-token"
                  label="Auth Token" 
                  value={configs.twilio.authToken} 
                  onChange={(val: string) => updateConfig('twilio', 'authToken', val)}
                  isSecret={true}
                  placeholder="Enter auth token"
                />
                <InputField 
                  label="Twilio Phone Number" 
                  value={configs.twilio.phoneNumber} 
                  onChange={(val: string) => updateConfig('twilio', 'phoneNumber', val)}
                  placeholder="+1xxxxxxxxxx"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button 
                  onClick={() => handleSave('twilio')}
                  disabled={isSaving === 'twilio'}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {isSaving === 'twilio' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Settings'}
                </button>
                <button 
                  onClick={() => handleTest('twilio')}
                  disabled={testing === 'twilio'}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {testing === 'twilio' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PhoneCall className="w-3.5 h-3.5" />}
                  {language === 'bn' ? 'টেস্ট কল' : 'Test Call'}
                </button>
                {status.twilio && (
                  <span className={`text-xs font-bold ${status.twilio.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {status.twilio.message}
                  </span>
                )}
                {status.test_twilio && (
                  <span className={`text-xs font-bold ${status.test_twilio.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {status.test_twilio.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STEADFAST COURIER */}
        <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
          <SectionHeader 
            id="steadfast" 
            icon={Truck} 
            title="Steadfast Courier API Settings" 
            purpose="Automated courier booking"
            enabled={configs.steadfast.enabled}
          />
          {expandedSections.steadfast && (
            <div className="p-5 space-y-5 animate-slide-down">
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="checkbox" 
                  id="steadfast-enabled"
                  checked={configs.steadfast.enabled}
                  onChange={(e) => updateConfig('steadfast', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="steadfast-enabled" className="text-sm font-bold text-gray-700">Enable Steadfast API Integration</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField 
                  id="steadfast-key"
                  label="Steadfast API Key" 
                  value={configs.steadfast.apiKey} 
                  onChange={(val: string) => updateConfig('steadfast', 'apiKey', val)}
                  isSecret={true}
                />
                <InputField 
                  id="steadfast-secret"
                  label="Secret Key" 
                  value={configs.steadfast.secretKey} 
                  onChange={(val: string) => updateConfig('steadfast', 'secretKey', val)}
                  isSecret={true}
                />
                <InputField 
                  label="API Base URL" 
                  value={configs.steadfast.baseUrl} 
                  onChange={(val: string) => updateConfig('steadfast', 'baseUrl', val)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button 
                  onClick={() => handleSave('steadfast')}
                  disabled={isSaving === 'steadfast'}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {isSaving === 'steadfast' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Settings'}
                </button>
                <button 
                  onClick={() => handleTest('steadfast')}
                  disabled={testing === 'steadfast'}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {testing === 'steadfast' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {language === 'bn' ? 'টেস্ট কানেকশন' : 'Test Connection'}
                </button>
                {status.steadfast && (
                  <span className={`text-xs font-bold ${status.steadfast.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {status.steadfast.message}
                  </span>
                )}
                {status.test_steadfast && (
                  <span className={`text-xs font-bold ${status.test_steadfast.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {status.test_steadfast.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* WHATSAPP */}
        <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
          <SectionHeader 
            id="whatsapp" 
            icon={MessageCircle} 
            title="Meta WhatsApp Business API" 
            purpose="Automated WhatsApp notifications"
            enabled={configs.whatsapp.enabled}
          />
          {expandedSections.whatsapp && (
            <div className="p-5 space-y-5 animate-slide-down">
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="checkbox" 
                  id="whatsapp-enabled"
                  checked={configs.whatsapp.enabled}
                  onChange={(e) => updateConfig('whatsapp', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="whatsapp-enabled" className="text-sm font-bold text-gray-700">Enable WhatsApp Messaging</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField 
                  id="wa-token"
                  label="Meta Access Token" 
                  value={configs.whatsapp.accessToken} 
                  onChange={(val: string) => updateConfig('whatsapp', 'accessToken', val)}
                  isSecret={true}
                />
                <InputField 
                  label="WhatsApp Business Account ID" 
                  value={configs.whatsapp.businessAccountId} 
                  onChange={(val: string) => updateConfig('whatsapp', 'businessAccountId', val)}
                />
                <InputField 
                  label="Phone Number ID" 
                  value={configs.whatsapp.phoneNumberId} 
                  onChange={(val: string) => updateConfig('whatsapp', 'phoneNumberId', val)}
                />
                <InputField 
                  id="wa-webhook"
                  label="Webhook Verify Token" 
                  value={configs.whatsapp.verifyToken} 
                  onChange={(val: string) => updateConfig('whatsapp', 'verifyToken', val)}
                  isSecret={true}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button 
                  onClick={() => handleSave('whatsapp')}
                  disabled={isSaving === 'whatsapp'}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {isSaving === 'whatsapp' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Settings'}
                </button>
                <button 
                  onClick={() => handleTest('whatsapp')}
                  disabled={testing === 'whatsapp'}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {testing === 'whatsapp' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {language === 'bn' ? 'টেস্ট কানেকশন' : 'Test Connection'}
                </button>
                {status.whatsapp && (
                  <span className={`text-xs font-bold ${status.whatsapp.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {status.whatsapp.message}
                  </span>
                )}
                {status.test_whatsapp && (
                  <span className={`text-xs font-bold ${status.test_whatsapp.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {status.test_whatsapp.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MESSENGER */}
        <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
          <SectionHeader 
            id="messenger" 
            icon={MessageCircle} 
            title="Meta Messenger Settings" 
            purpose="Customer communication via Facebook"
            enabled={configs.messenger.enabled}
          />
          {expandedSections.messenger && (
            <div className="p-5 space-y-5 animate-slide-down">
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="checkbox" 
                  id="messenger-enabled"
                  checked={configs.messenger.enabled}
                  onChange={(e) => updateConfig('messenger', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="messenger-enabled" className="text-sm font-bold text-gray-700">Enable Messenger Service</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField 
                  label="Facebook Page ID" 
                  value={configs.messenger.pageId} 
                  onChange={(val: string) => updateConfig('messenger', 'pageId', val)}
                />
                <InputField 
                  id="ms-token"
                  label="Meta Access Token" 
                  value={configs.messenger.accessToken} 
                  onChange={(val: string) => updateConfig('messenger', 'accessToken', val)}
                  isSecret={true}
                />
                <InputField 
                  id="ms-webhook"
                  label="Webhook Verify Token" 
                  value={configs.messenger.verifyToken} 
                  onChange={(val: string) => updateConfig('messenger', 'verifyToken', val)}
                  isSecret={true}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button 
                  onClick={() => handleSave('messenger')}
                  disabled={isSaving === 'messenger'}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {isSaving === 'messenger' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Settings'}
                </button>
                <button 
                  onClick={() => handleTest('messenger')}
                  disabled={testing === 'messenger'}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {testing === 'messenger' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {language === 'bn' ? 'টেস্ট কানেকশন' : 'Test Connection'}
                </button>
                {status.messenger && (
                  <span className={`text-xs font-bold ${status.messenger.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {status.messenger.message}
                  </span>
                )}
                {status.test_messenger && (
                  <span className={`text-xs font-bold ${status.test_messenger.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {status.test_messenger.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* EMAIL / SMTP */}
        <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
          <SectionHeader 
            id="smtp" 
            icon={Mail} 
            title="Email / SMTP Settings" 
            purpose="Transaction emails via Hostinger"
            enabled={configs.smtp.enabled}
          />
          {expandedSections.smtp && (
            <div className="p-5 space-y-5 animate-slide-down">
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="checkbox" 
                  id="smtp-enabled"
                  checked={configs.smtp.enabled}
                  onChange={(e) => updateConfig('smtp', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="smtp-enabled" className="text-sm font-bold text-gray-700">Enable Email Notifications</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <InputField 
                  label="SMTP Host" 
                  value={configs.smtp.host} 
                  onChange={(val: string) => updateConfig('smtp', 'host', val)}
                  placeholder="smtp.hostinger.com"
                />
                <InputField 
                  label="SMTP Port" 
                  value={configs.smtp.port} 
                  onChange={(val: string) => updateConfig('smtp', 'port', val)}
                  placeholder="465"
                />
                <InputField 
                  label="SMTP Username" 
                  value={configs.smtp.user} 
                  onChange={(val: string) => updateConfig('smtp', 'user', val)}
                  placeholder="info@shadshodai.com"
                />
                <InputField 
                  id="smtp-pass"
                  label="SMTP Password" 
                  value={configs.smtp.pass} 
                  onChange={(val: string) => updateConfig('smtp', 'pass', val)}
                  isSecret={true}
                  placeholder="Enter password"
                />
                <InputField 
                  label="Sender Email" 
                  value={configs.smtp.sender} 
                  onChange={(val: string) => updateConfig('smtp', 'sender', val)}
                  placeholder="SHAD SHODAI <info@shadshodai.com>"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button 
                  onClick={() => handleSave('smtp')}
                  disabled={isSaving === 'smtp'}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {isSaving === 'smtp' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Settings'}
                </button>
                <button 
                  onClick={() => handleTest('smtp')}
                  disabled={testing === 'smtp'}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {testing === 'smtp' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  {language === 'bn' ? 'টেস্ট ইমেইল' : 'Test Email'}
                </button>
                {status.smtp && (
                  <span className={`text-xs font-bold ${status.smtp.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {status.smtp.message}
                  </span>
                )}
                {status.test_smtp && (
                  <span className={`text-xs font-bold ${status.test_smtp.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {status.test_smtp.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="text-[11px] text-amber-800 leading-relaxed">
          <p className="font-bold uppercase tracking-widest mb-1">Security Notice</p>
          <p>
            {language === 'bn' 
              ? 'আপনার API Key-গুলো ব্যাকএন্ডে এনক্রিপ্টেড অবস্থায় সংরক্ষিত হয়। এগুলো কখনই গ্রাহকদের বা অননুমোদিত ব্যবহারকারীদের কাছে প্রদর্শিত হবে না। টেস্ট কানেকশন বাটনে ক্লিক করার আগে সেটিংস সেভ করে নেওয়া বাঞ্ছনীয়।'
              : 'Your API keys are stored securely on the server. They will never be exposed to customers or unauthorized users. It is recommended to save settings before testing connections.'}
          </p>
        </div>
      </div>
    </div>
  );
};
