import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Store, 
  Info, 
  Phone, 
  Briefcase, 
  UserCog, 
  ShoppingCart, 
  Search,
  Globe,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Calendar,
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';
import { adminService } from '../utils/adminService';

interface AdminGeneralSettingsProps {
  language: 'en' | 'bn';
}

interface GeneralSettings {
  store_status: string;
  maintenance_mode: string;
  maintenance_message: string;
  store_name: string;
  store_name_bn: string;
  store_logo: string;
  store_favicon: string;
  store_description: string;
  store_phone: string;
  store_whatsapp: string;
  store_email: string;
  store_address: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  date_format: string;
  customer_registration: string;
  guest_checkout: string;
  email_verification: string;
  phone_verification: string;
  min_order_amount: string;
  order_confirmation: string;
  order_cancellation: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  canonical_url: string;
  robots_setting: string;
  og_title: string;
  og_description: string;
  og_image: string;
}

const DEFAULT_SETTINGS: GeneralSettings = {
  store_status: 'open',
  maintenance_mode: 'off',
  maintenance_message: 'Our store is currently under maintenance. We will be back soon!',
  store_name: 'SHAD GHOR',
  store_name_bn: 'স্বাদ ঘর',
  store_logo: '',
  store_favicon: '',
  store_description: 'Pure and Organic Food Shop in Bangladesh.',
  store_phone: '',
  store_whatsapp: '',
  store_email: '',
  store_address: '',
  currency: 'BDT',
  currency_symbol: '৳',
  timezone: 'Asia/Dhaka',
  date_format: 'DD/MM/YYYY',
  customer_registration: 'on',
  guest_checkout: 'on',
  email_verification: 'off',
  phone_verification: 'off',
  min_order_amount: '0',
  order_confirmation: 'manual',
  order_cancellation: 'allowed',
  seo_title: 'SHAD GHOR — Premium Organic Food Shop',
  seo_description: '১০০% খাঁটি ও প্রাকৃতিক সুন্দরবনের মধু, ঘি, মসলা এবং অর্গানিক খাবার।',
  seo_keywords: 'organic food, honey, ghee, dates, nuts, seeds, bangladesh',
  canonical_url: 'https://shadghor.com',
  robots_setting: 'index, follow',
  og_title: 'SHAD GHOR — Premium Organic Food Shop',
  og_description: '১০০% খাঁটি ও প্রাকৃতিক সুন্দরবনের মধু, ঘি, মসলা এবং অর্গানিক খাবার।',
  og_image: ''
};

export const AdminGeneralSettings: React.FC<AdminGeneralSettingsProps> = ({ language }) => {
  const [settings, setSettings] = useState<GeneralSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<GeneralSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'auth_error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/general-settings', {
        headers: adminService.getHeaders()
      });
      if (res.status === 401 || res.status === 403) {
        setStatus('auth_error');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      
      // Merge with defaults to ensure all fields exist
      const merged = { ...DEFAULT_SETTINGS };
      Object.keys(DEFAULT_SETTINGS).forEach(key => {
        if (data[key] !== undefined && data[key] !== '') {
          merged[key as keyof GeneralSettings] = data[key];
        }
      });
      
      setSettings(merged);
      setOriginalSettings(merged);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const validateField = (name: string, value: string) => {
    let error = '';
    if (['store_name', 'store_email', 'currency', 'currency_symbol'].includes(name) && !value) {
      error = language === 'bn' ? 'এই ক্ষেত্রটি বাধ্যতামূলক' : 'This field is required';
    }
    if (name === 'store_email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = language === 'bn' ? 'সঠিক ইমেল ঠিকানা দিন' : 'Enter a valid email address';
    }
    if (name === 'min_order_amount' && isNaN(Number(value))) {
      error = language === 'bn' ? 'সঠিক সংখ্যা দিন' : 'Enter a valid number';
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
    if (status === 'saved') setStatus('idle');
  };

  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const handleSave = async () => {
    // Final validation check
    let isValid = true;
    Object.keys(settings).forEach(key => {
      if (!validateField(key, settings[key as keyof GeneralSettings])) {
        isValid = false;
      }
    });

    if (!isValid) return;

    setIsSaving(true);
    setStatus('saving');
    try {
      const res = await fetch('/api/admin/general-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminService.getHeaders()
        },
        body: JSON.stringify(settings)
      });

      if (res.status === 401 || res.status === 403) {
        setStatus('auth_error');
        return;
      }

      if (!res.ok) throw new Error('Save failed');

      setOriginalSettings(settings);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setErrors({});
    setStatus('idle');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          {language === 'bn' ? 'সেটিংস লোড হচ্ছে...' : 'Loading Settings...'}
        </p>
      </div>
    );
  }

  const renderField = (label: string, name: keyof GeneralSettings, type: 'text' | 'textarea' | 'select' | 'number' = 'text', options?: { value: string; label: string }[]) => {
    const error = errors[name];
    const isValid = settings[name] && !error;

    return (
      <div className="space-y-1.5" id={`field-container-${name}`}>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
          {label}
        </label>
        
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            {type === 'select' ? (
              <select
                name={name}
                value={settings[name]}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-50 border ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-200'} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 transition-all`}
              >
                {options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : type === 'textarea' ? (
              <textarea
                name={name}
                value={settings[name]}
                onChange={handleInputChange}
                rows={2}
                className={`w-full px-3 py-2 bg-gray-50 border ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-200'} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 transition-all resize-none`}
              />
            ) : (
              <input
                type={type}
                name={name}
                value={settings[name]}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-50 border ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-200'} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 transition-all`}
              />
            )}
          </div>
          
          <div className="w-5 flex justify-center shrink-0">
            {isValid && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-fade-in" />
            )}
            {error && (
              <AlertCircle className="w-4 h-4 text-red-500 animate-fade-in" />
            )}
          </div>
        </div>
        {error && <p className="text-[9px] text-red-500 font-bold ml-1">{error}</p>}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24" id="admin-general-settings-container">
      
      {/* 1. Header Segment */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <Settings className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-black text-gray-900 leading-tight">
              {language === 'bn' ? 'সাধারণ সেটিংস' : 'General Settings'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {language === 'bn' ? 'স্টোর কনফিগারেশন এবং ম্যানেজমেন্ট' : 'Core Store Configuration & Management'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'auth_error' && (
            <div className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black flex items-center gap-1.5 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              AUTHENTICATION ERROR ✕
            </div>
          )}
          {status === 'error' && (
            <div className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              SAVE FAILED ✕
            </div>
          )}
          {status === 'saved' && (
            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              SAVED ✓
            </div>
          )}
          {hasUnsavedChanges && status === 'idle' && (
            <div className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-[10px] font-black flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              UNSAVED CHANGES
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 1 — STORE STATUS */}
        <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-left">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <Store className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'স্টোর স্ট্যাটাস' : 'Store Status'}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField(language === 'bn' ? 'স্টোর স্ট্যাটাস' : 'Store Status', 'store_status', 'select', [
              { value: 'open', label: language === 'bn' ? 'খোলা (Open)' : 'Open' },
              { value: 'closed', label: language === 'bn' ? 'বন্ধ (Closed)' : 'Closed' }
            ])}
            {renderField(language === 'bn' ? 'মেইনটেন্যান্স মোড' : 'Maintenance Mode', 'maintenance_mode', 'select', [
              { value: 'off', label: 'OFF' },
              { value: 'on', label: 'ON' }
            ])}
          </div>
          {renderField(language === 'bn' ? 'মেইনটেন্যান্স মেসেজ' : 'Maintenance Message', 'maintenance_message', 'textarea')}
        </section>

        {/* SECTION 2 — STORE BASIC INFORMATION */}
        <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-left">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <Info className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'স্টোর বেসিক তথ্য' : 'Store Basic Information'}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField(language === 'bn' ? 'স্টোর নাম (EN)' : 'Store Name (EN)', 'store_name')}
            {renderField(language === 'bn' ? 'স্টোর নাম (BN)' : 'Store Name (BN)', 'store_name_bn')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField(language === 'bn' ? 'লোগো ইউআরএল' : 'Logo URL', 'store_logo')}
            {renderField(language === 'bn' ? 'ফেভিকন ইউআরএল' : 'Favicon URL', 'store_favicon')}
          </div>
          {renderField(language === 'bn' ? 'সংক্ষিপ্ত বর্ণনা' : 'Short Description', 'store_description', 'textarea')}
        </section>

        {/* SECTION 3 — CONTACT INFORMATION */}
        <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-left">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <Phone className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'যোগাযোগ তথ্য' : 'Contact Information'}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField(language === 'bn' ? 'ফোন নম্বর' : 'Phone Number', 'store_phone')}
            {renderField(language === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর' : 'WhatsApp Number', 'store_whatsapp')}
          </div>
          {renderField(language === 'bn' ? 'ইমেল অ্যাড্রেস' : 'Email Address', 'store_email')}
          {renderField(language === 'bn' ? 'ব্যবসা ঠিকানা' : 'Business Address', 'store_address', 'textarea')}
        </section>

        {/* SECTION 4 — BUSINESS SETTINGS */}
        <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-left">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'বিজনেস সেটিংস' : 'Business Settings'}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField(language === 'bn' ? 'কারেন্সি' : 'Currency', 'currency', 'select', [
              { value: 'BDT', label: 'Bangladeshi Taka (BDT)' },
              { value: 'USD', label: 'US Dollar (USD)' }
            ])}
            {renderField(language === 'bn' ? 'কারেন্সি সিম্বল' : 'Currency Symbol', 'currency_symbol')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField(language === 'bn' ? 'টাইম জোন' : 'Time Zone', 'timezone', 'select', [
              { value: 'Asia/Dhaka', label: '(GMT+6) Asia/Dhaka' },
              { value: 'UTC', label: 'UTC' }
            ])}
            {renderField(language === 'bn' ? 'ডেট ফরম্যাট' : 'Date Format', 'date_format', 'select', [
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
            ])}
          </div>
        </section>

        {/* SECTION 5 — CUSTOMER ACCOUNT SETTINGS */}
        <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-left">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <UserCog className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'কাস্টমার অ্যাকাউন্ট সেটিংস' : 'Customer Account Settings'}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField(language === 'bn' ? 'কাস্টমার রেজিস্ট্রেশন' : 'Customer Registration', 'customer_registration', 'select', [
              { value: 'on', label: 'ON' },
              { value: 'off', label: 'OFF' }
            ])}
            {renderField(language === 'bn' ? 'গেস্ট চেকআউট' : 'Guest Checkout', 'guest_checkout', 'select', [
              { value: 'on', label: 'ON' },
              { value: 'off', label: 'OFF' }
            ])}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField(language === 'bn' ? 'ইমেল ভেরিফিকেশন' : 'Email Verification', 'email_verification', 'select', [
              { value: 'on', label: 'ON' },
              { value: 'off', label: 'OFF' }
            ])}
            {renderField(language === 'bn' ? 'ফোন ভেরিফিকেশন' : 'Phone Verification', 'phone_verification', 'select', [
              { value: 'on', label: 'ON' },
              { value: 'off', label: 'OFF' }
            ])}
          </div>
        </section>

        {/* SECTION 6 — ORDER SETTINGS */}
        <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-left">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'অর্ডার সেটিংস' : 'Order Settings'}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {renderField(language === 'bn' ? 'মিনিমাম অর্ডার অ্যামাউন্ট' : 'Minimum Order Amount', 'min_order_amount', 'number')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField(language === 'bn' ? 'অর্ডার কনফার্মেশন' : 'Order Confirmation', 'order_confirmation', 'select', [
              { value: 'manual', label: language === 'bn' ? 'ম্যানুয়াল' : 'Manual' },
              { value: 'auto', label: language === 'bn' ? 'অটোমেটিক' : 'Automatic' }
            ])}
            {renderField(language === 'bn' ? 'অর্ডার ক্যান্সেলেশন' : 'Order Cancellation', 'order_cancellation', 'select', [
              { value: 'allowed', label: language === 'bn' ? 'অনুমতি আছে' : 'Allowed' },
              { value: 'disabled', label: language === 'bn' ? 'বন্ধ' : 'Disabled' }
            ])}
          </div>
        </section>

        {/* SECTION 7 — BASIC SEO SETTINGS */}
        <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-left md:col-span-2">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <Globe className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'বেসিক এসইও সেটিংস' : 'Basic SEO Settings'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {renderField(language === 'bn' ? 'ওয়েবসাইট টাইটেল' : 'Website Title', 'seo_title')}
              {renderField(language === 'bn' ? 'মেটা ডেসক্রিপশন' : 'Meta Description', 'seo_description', 'textarea')}
              {renderField(language === 'bn' ? 'ডিফল্ট কিওয়ার্ড' : 'Default Keywords', 'seo_keywords')}
            </div>
            <div className="space-y-4">
              {renderField(language === 'bn' ? 'ক্যানোনিকাল ইউআরএল' : 'Canonical URL', 'canonical_url')}
              {renderField(language === 'bn' ? 'রোবটস সেটিং' : 'Robots Setting', 'robots_setting')}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-gray-50">
            {renderField(language === 'bn' ? 'ওপেন গ্রাফ টাইটেল' : 'Open Graph Title', 'og_title')}
            {renderField(language === 'bn' ? 'ওপেন গ্রাফ ডেসক্রিপশন' : 'Open Graph Description', 'og_description')}
            {renderField(language === 'bn' ? 'ওপেন গ্রাফ ইমেজ (URL)' : 'Open Graph Image (URL)', 'og_image')}
          </div>
        </section>

      </div>

      {/* BOTTOM ACTIONS BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 flex items-center justify-center md:justify-end gap-3 shadow-lg animate-slide-up">
        <button
          onClick={handleReset}
          disabled={!hasUnsavedChanges || isSaving}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          {language === 'bn' ? 'পরিবর্তন বাতিল করুন' : 'Reset Unsaved Changes'}
        </button>
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
          className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {language === 'bn' ? 'সেভ করুন' : 'Save Changes'}
        </button>
      </div>

    </div>
  );
};
