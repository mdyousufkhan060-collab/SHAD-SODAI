import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Globe, 
  Facebook, 
  Instagram, 
  Youtube,
  Linkedin,
  MessageCircle,
  Video,
  Info,
  Map as MapIcon,
  Fingerprint
} from 'lucide-react';
import { adminService } from '../utils/adminService';

interface AdminStoreInformationProps {
  language: 'en' | 'bn';
}

interface StoreInformation {
  store_name: string;
  store_name_bn: string;
  store_logo: string;
  store_favicon: string;
  store_description: string;
  store_phone: string;
  store_whatsapp: string;
  store_email: string;
  support_phone: string;
  store_address: string;
  store_address_line2: string;
  store_area: string;
  store_city: string;
  store_district: string;
  store_country: string;
  store_post_code: string;
  company_name: string;
  registration_number: string;
  vat_tin: string;
  maps_url: string;
  latitude: string;
  longitude: string;
  hours_sat: string;
  hours_sun: string;
  hours_mon: string;
  hours_tue: string;
  hours_wed: string;
  hours_thu: string;
  hours_fri: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  youtube_url: string;
  linkedin_url: string;
}

const DEFAULT_INFO: StoreInformation = {
  store_name: 'SHAD GHOR',
  store_name_bn: 'স্বাদ ঘর',
  store_logo: '',
  store_favicon: '',
  store_description: 'Pure and Organic Food Shop in Bangladesh.',
  store_phone: '',
  store_whatsapp: '',
  store_email: '',
  support_phone: '',
  store_address: '',
  store_address_line2: '',
  store_area: '',
  store_city: 'Dhaka',
  store_district: 'Dhaka',
  store_country: 'Bangladesh',
  store_post_code: '',
  company_name: 'SHAD GHOR ENTERPRISE',
  registration_number: '',
  vat_tin: '',
  maps_url: '',
  latitude: '',
  longitude: '',
  hours_sat: '{"open":true,"opening":"09:00","closing":"21:00"}',
  hours_sun: '{"open":true,"opening":"09:00","closing":"21:00"}',
  hours_mon: '{"open":true,"opening":"09:00","closing":"21:00"}',
  hours_tue: '{"open":true,"opening":"09:00","closing":"21:00"}',
  hours_wed: '{"open":true,"opening":"09:00","closing":"21:00"}',
  hours_thu: '{"open":true,"opening":"09:00","closing":"21:00"}',
  hours_fri: '{"open":false,"opening":"00:00","closing":"00:00"}',
  facebook_url: '',
  instagram_url: '',
  tiktok_url: '',
  youtube_url: '',
  linkedin_url: ''
};

export const AdminStoreInformation: React.FC<AdminStoreInformationProps> = ({ language }) => {
  const [info, setInfo] = useState<StoreInformation>(DEFAULT_INFO);
  const [originalInfo, setOriginalInfo] = useState<StoreInformation>(DEFAULT_INFO);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'auth_error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInfo();
  }, []);

  const fetchInfo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/store-information', {
        headers: adminService.getHeaders()
      });
      if (res.status === 401 || res.status === 403) {
        setStatus('auth_error');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch info');
      const data = await res.json();
      
      const merged = { ...DEFAULT_INFO };
      Object.keys(DEFAULT_INFO).forEach(key => {
        if (data[key] !== undefined && data[key] !== '') {
          merged[key as keyof StoreInformation] = data[key];
        }
      });
      
      setInfo(merged);
      setOriginalInfo(merged);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const validateField = (name: string, value: string) => {
    let error = '';
    if (['store_name', 'store_email', 'store_phone', 'store_address'].includes(name) && !value) {
      error = language === 'bn' ? 'এই ক্ষেত্রটি বাধ্যতামূলক' : 'This field is required';
    }
    if (name === 'store_email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = language === 'bn' ? 'সঠিক ইমেল ঠিকানা দিন' : 'Enter a valid email address';
    }
    if (['store_phone', 'store_whatsapp', 'support_phone'].includes(name) && value && !/^(\+8801|01)[3-9]\d{8}$/.test(value)) {
      error = language === 'bn' ? 'সঠিক বাংলাদেশী নম্বর দিন' : 'Enter a valid BD phone number';
    }
    if (name.includes('_url') && value && !/^https?:\/\/.+/.test(value)) {
      error = language === 'bn' ? 'সঠিক ইউআরএল দিন' : 'Enter a valid URL (http/https)';
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
    if (status === 'saved') setStatus('idle');
  };

  const handleHourChange = (day: string, field: 'open' | 'opening' | 'closing', value: any) => {
    const currentDayStr = info[`hours_${day}` as keyof StoreInformation];
    const currentDay = JSON.parse(currentDayStr);
    const updatedDay = { ...currentDay, [field]: value };
    setInfo(prev => ({ ...prev, [`hours_${day}`]: JSON.stringify(updatedDay) }));
    if (status === 'saved') setStatus('idle');
  };

  const hasUnsavedChanges = JSON.stringify(info) !== JSON.stringify(originalInfo);

  const handleSave = async () => {
    let isValid = true;
    Object.keys(info).forEach(key => {
      if (!validateField(key, info[key as keyof StoreInformation])) {
        isValid = false;
      }
    });

    if (!isValid) return;

    setIsSaving(true);
    setStatus('saving');
    try {
      const res = await fetch('/api/admin/store-information', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminService.getHeaders()
        },
        body: JSON.stringify(info)
      });

      if (res.status === 401 || res.status === 403) {
        setStatus('auth_error');
        return;
      }

      if (!res.ok) throw new Error('Save failed');

      setOriginalInfo(info);
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
    setInfo(originalInfo);
    setErrors({});
    setStatus('idle');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          {language === 'bn' ? 'স্টোর তথ্য লোড হচ্ছে...' : 'Loading Store Info...'}
        </p>
      </div>
    );
  }

  const renderField = (label: string, name: keyof StoreInformation, type: 'text' | 'textarea' | 'select' | 'number' = 'text', options?: { value: string; label: string }[]) => {
    const error = errors[name];
    const isValid = info[name] && !error;

    return (
      <div className="space-y-1.5" id={`field-container-${name}`}>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
          {label}
        </label>
        
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            {type === 'textarea' ? (
              <textarea
                name={name}
                value={info[name]}
                onChange={handleInputChange}
                rows={2}
                className={`w-full px-3 py-2 bg-gray-50 border ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-200'} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 transition-all resize-none`}
              />
            ) : (
              <input
                type={type}
                name={name}
                value={info[name]}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-50 border ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-200'} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 transition-all`}
              />
            )}
          </div>
          <div className="w-5 flex justify-center shrink-0">
            {isValid && <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-fade-in" />}
            {error && <AlertCircle className="w-4 h-4 text-red-500 animate-fade-in" />}
          </div>
        </div>
        {error && <p className="text-[9px] text-red-500 font-bold ml-1">{error}</p>}
      </div>
    );
  };

  const days = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
  const dayNames: Record<string, any> = {
    sat: { en: 'Saturday', bn: 'শনিবার' },
    sun: { en: 'Sunday', bn: 'রবিবার' },
    mon: { en: 'Monday', bn: 'সোমবার' },
    tue: { en: 'Tuesday', bn: 'মঙ্গলবার' },
    wed: { en: 'Wednesday', bn: 'বুধবার' },
    thu: { en: 'Thursday', bn: 'বৃহস্পতিবার' },
    fri: { en: 'Friday', bn: 'শুক্রবার' }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 text-left" id="admin-store-info-container">
      
      {/* Header Segment */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <Building2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">
              {language === 'bn' ? 'স্টোর তথ্য' : 'Store Information'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {language === 'bn' ? 'ব্যবসায়িক পরিচিতি ও যোগাযোগ তথ্য' : 'Business Identity & Contact Profile'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION 1 — STORE IDENTITY */}
          <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <Fingerprint className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'স্টোর আইডেন্টিটি' : 'Store Identity'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField(language === 'bn' ? 'স্টোর নাম (EN)' : 'Store Name (EN)', 'store_name')}
              {renderField(language === 'bn' ? 'স্টোর নাম (BN)' : 'Store Name (BN)', 'store_name_bn')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField(language === 'bn' ? 'লোগো ইউআরএল' : 'Logo URL', 'store_logo')}
              {renderField(language === 'bn' ? 'ফেভিকন ইউআরএল' : 'Favicon URL', 'store_favicon')}
            </div>
            {renderField(language === 'bn' ? 'সংক্ষিপ্ত বর্ণনা' : 'Short Description', 'store_description', 'textarea')}
          </section>

          {/* SECTION 2 — BUSINESS CONTACT */}
          <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <Phone className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'ব্যবসায়িক যোগাযোগ' : 'Business Contact'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField(language === 'bn' ? 'ফোন নম্বর' : 'Phone Number', 'store_phone')}
              {renderField(language === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর' : 'WhatsApp Number', 'store_whatsapp')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField(language === 'bn' ? 'ইমেল অ্যাড্রেস' : 'Email Address', 'store_email')}
              {renderField(language === 'bn' ? 'কাস্টমার সাপোর্ট নম্বর' : 'Customer Support', 'support_phone')}
            </div>
          </section>

          {/* SECTION 3 — STORE ADDRESS */}
          <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'স্টোর ঠিকানা' : 'Store Address'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField(language === 'bn' ? 'ঠিকানা (লাইন ১)' : 'Address Line 1', 'store_address')}
              {renderField(language === 'bn' ? 'ঠিকানা (লাইন ২)' : 'Address Line 2', 'store_address_line2')}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {renderField(language === 'bn' ? 'এলাকা' : 'Area', 'store_area')}
              {renderField(language === 'bn' ? 'শহর' : 'City', 'store_city')}
              {renderField(language === 'bn' ? 'জেলা' : 'District', 'store_district')}
              {renderField(language === 'bn' ? 'পোস্ট কোড' : 'Post Code', 'store_post_code')}
              {renderField(language === 'bn' ? 'দেশ' : 'Country', 'store_country')}
            </div>
          </section>

          {/* SECTION 4 — BUSINESS INFORMATION */}
          <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <Info className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'ব্যবসা তথ্য' : 'Business Information'}</h2>
            </div>
            {renderField(language === 'bn' ? 'কোম্পানির নাম' : 'Company Name', 'company_name')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField(language === 'bn' ? 'ট্রেড লাইসেন্স নম্বর' : 'Trade License No', 'registration_number')}
              {renderField(language === 'bn' ? 'VAT / TIN নম্বর' : 'VAT / TIN No', 'vat_tin')}
            </div>
          </section>

        </div>

        <div className="space-y-6">
          
          {/* SECTION 6 — BUSINESS HOURS */}
          <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'অফিস সময়' : 'Business Hours'}</h2>
            </div>
            <div className="space-y-3">
              {days.map(day => {
                const h = JSON.parse(info[`hours_${day}` as keyof StoreInformation] || '{"open":false}');
                return (
                  <div key={day} className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 min-w-[70px]">
                      <input 
                        type="checkbox" 
                        checked={h.open} 
                        onChange={(e) => handleHourChange(day, 'open', e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 cursor-pointer"
                      />
                      <span className="text-[10px] font-black text-gray-700">{language === 'bn' ? dayNames[day].bn : dayNames[day].en}</span>
                    </div>
                    {h.open ? (
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="time" 
                          value={h.opening}
                          onChange={(e) => handleHourChange(day, 'opening', e.target.value)}
                          className="px-1.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-gray-300">-</span>
                        <input 
                          type="time" 
                          value={h.closing}
                          onChange={(e) => handleHourChange(day, 'closing', e.target.value)}
                          className="px-1.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest pr-2">{language === 'bn' ? 'বন্ধ' : 'Closed'}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 5 — STORE LOCATION */}
          <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <MapIcon className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'স্টোর লোকেশন' : 'Store Location'}</h2>
            </div>
            {renderField(language === 'bn' ? 'গুগল ম্যাপ ইউআরএল' : 'Google Maps URL', 'maps_url')}
            <div className="grid grid-cols-2 gap-4">
              {renderField(language === 'bn' ? 'অক্ষাংশ (Lat)' : 'Latitude', 'latitude')}
              {renderField(language === 'bn' ? 'দ্রাঘিমাংশ (Long)' : 'Longitude', 'longitude')}
            </div>
          </section>

          {/* SECTION 7 — SOCIAL LINKS */}
          <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <Globe className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'সোশ্যাল লিংকস' : 'Social Links'}</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Facebook className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="flex-1">{renderField('Facebook', 'facebook_url')}</div>
              </div>
              <div className="flex items-center gap-3">
                <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                <div className="flex-1">{renderField('Instagram', 'instagram_url')}</div>
              </div>
              <div className="flex items-center gap-3">
                <Video className="w-4 h-4 text-black shrink-0" />
                <div className="flex-1">{renderField('TikTok', 'tiktok_url')}</div>
              </div>
              <div className="flex items-center gap-3">
                <Youtube className="w-4 h-4 text-red-600 shrink-0" />
                <div className="flex-1">{renderField('YouTube', 'youtube_url')}</div>
              </div>
              <div className="flex items-center gap-3">
                <Linkedin className="w-4 h-4 text-blue-700 shrink-0" />
                <div className="flex-1">{renderField('LinkedIn', 'linkedin_url')}</div>
              </div>
            </div>
          </section>

        </div>

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
