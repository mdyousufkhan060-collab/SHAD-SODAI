import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Eye,
  Share2,
  Twitter,
  Settings,
  Database,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Layout,
  FileCode,
  Image as ImageIcon
} from 'lucide-react';
import { adminService } from '../utils/adminService';

interface AdminSeoSettingsProps {
  language: 'en' | 'bn';
}

interface GlobalSeoSettings {
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_canonical: string;
  seo_index: string;
  seo_follow: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_card: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  seo_auto_title: string;
  seo_auto_description: string;
  seo_auto_products: string;
  seo_auto_categories: string;
  about_seo_title: string;
  about_seo_description: string;
}

interface SeoStatus {
  sitemap_status: string;
  sitemap_url: string;
  robots_status: string;
  last_updated: string;
}

const DEFAULT_SEO: GlobalSeoSettings = {
  seo_title: 'SHAD GHOR — Premium Organic Food Shop',
  seo_description: '১০০% খাঁটি ও প্রাকৃতিক সুন্দরবনের মধু, ঘি, মসলা এবং অর্গানিক খাবার।',
  seo_keywords: 'organic food, honey, ghee, dates, nuts, seeds, bangladesh',
  seo_canonical: 'https://shadghor.com',
  seo_index: 'index',
  seo_follow: 'follow',
  og_title: 'SHAD GHOR — Premium Organic Food Shop',
  og_description: '১০০% খাঁটি ও প্রাকৃতিক সুন্দরবনের মধু, ঘি, মসলা এবং অর্গানিক খাবার।',
  og_image: '',
  twitter_card: 'summary_large_image',
  twitter_title: 'SHAD GHOR — Premium Organic Food Shop',
  twitter_description: '১০০% খাঁটি ও প্রাকৃতিক সুন্দরবনের মধু, ঘি, মসলা এবং অর্গানিক খাবার।',
  twitter_image: '',
  seo_auto_title: 'on',
  seo_auto_description: 'on',
  seo_auto_products: 'on',
  seo_auto_categories: 'on',
  about_seo_title: '',
  about_seo_description: ''
};

export const AdminSeoSettings: React.FC<AdminSeoSettingsProps> = ({ language }) => {
  const [settings, setSettings] = useState<GlobalSeoSettings>(DEFAULT_SEO);
  const [originalSettings, setOriginalSettings] = useState<GlobalSeoSettings>(DEFAULT_SEO);
  const [status, setStatus] = useState<SeoStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'auth_error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    social: true,
    twitter: false,
    automation: false,
    status: false,
    health: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, statusRes] = await Promise.all([
        fetch('/api/admin/seo-global', { headers: adminService.getHeaders() }),
        fetch('/api/admin/seo-status', { headers: adminService.getHeaders() })
      ]);

      if (settingsRes.status === 401 || settingsRes.status === 403) {
        setSaveStatus('auth_error');
        return;
      }

      const settingsData = await settingsRes.json();
      const statusData = await statusRes.json();

      const merged = { ...DEFAULT_SEO };
      Object.keys(DEFAULT_SEO).forEach(key => {
        if (settingsData[key] !== undefined && settingsData[key] !== '') {
          merged[key as keyof GlobalSeoSettings] = settingsData[key];
        }
      });

      setSettings(merged);
      setOriginalSettings(merged);
      setStatus(statusData);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'seo_title' && value.length > 70) {
      error = language === 'bn' ? 'টাইটেল ৭০ অক্ষরের বেশি হওয়া উচিত নয়' : 'Title should not exceed 70 characters';
    }
    if (name === 'seo_description' && value.length > 160) {
      error = language === 'bn' ? 'ডেসক্রিপশন ১৬০ অক্ষরের বেশি হওয়া উচিত নয়' : 'Description should not exceed 160 characters';
    }
    if (name === 'seo_canonical' && value && !/^https?:\/\/.+/.test(value)) {
      error = language === 'bn' ? 'সঠিক ইউআরএল দিন' : 'Enter a valid URL';
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
    if (saveStatus === 'saved') setSaveStatus('idle');
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const handleSave = async () => {
    let isValid = true;
    Object.keys(settings).forEach(key => {
      if (!validateField(key, settings[key as keyof GlobalSeoSettings])) {
        isValid = false;
      }
    });

    if (!isValid) return;

    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/seo-global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminService.getHeaders()
        },
        body: JSON.stringify(settings)
      });

      if (res.status === 401 || res.status === 403) {
        setSaveStatus('auth_error');
        return;
      }

      if (!res.ok) throw new Error('Save failed');

      setOriginalSettings(settings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setErrors({});
    setSaveStatus('idle');
  };

  const handleRegenerateSitemap = async () => {
    try {
      const res = await fetch('/api/admin/seo-regenerate-sitemap', {
        method: 'POST',
        headers: adminService.getHeaders()
      });
      if (res.ok) {
        alert(language === 'bn' ? 'সাইটম্যাপ পুনরায় তৈরির অনুরোধ পাঠানো হয়েছে!' : 'Sitemap regeneration triggered!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          {language === 'bn' ? 'এসইও সেটিংস লোড হচ্ছে...' : 'Loading SEO Settings...'}
        </p>
      </div>
    );
  }

  const renderHealthCheck = () => {
    const checks = [
      { id: 'title', label: 'SEO Title', status: settings.seo_title ? 'good' : 'error' },
      { id: 'desc', label: 'Meta Description', status: settings.seo_description ? 'good' : 'error' },
      { id: 'canonical', label: 'Canonical URL', status: settings.seo_canonical ? 'good' : 'warning' },
      { id: 'og', label: 'OG Information', status: settings.og_title && settings.og_image ? 'good' : 'warning' },
      { id: 'robots', label: 'Index Control', status: settings.seo_index === 'index' ? 'good' : 'warning' }
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {checks.map(check => (
          <div key={check.id} className="bg-gray-50 p-2 rounded-xl border border-gray-100 text-center space-y-1">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{check.label}</p>
            <div className={`text-[10px] font-black uppercase flex items-center justify-center gap-1 ${
              check.status === 'good' ? 'text-emerald-600' : check.status === 'warning' ? 'text-amber-600' : 'text-red-600'
            }`}>
              {check.status === 'good' ? 'GOOD ✓' : check.status === 'warning' ? 'WARNING' : 'ERROR ✕'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderField = (label: string, name: keyof GlobalSeoSettings, type: 'text' | 'textarea' | 'select' = 'text', options?: { value: string; label: string }[]) => {
    const error = errors[name];
    const value = settings[name];
    const charCount = value?.length || 0;
    const maxChars = name === 'seo_title' ? 70 : name === 'seo_description' ? 160 : null;

    return (
      <div className="space-y-1" id={`seo-field-${name}`}>
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</label>
          {maxChars && (
            <span className={`text-[9px] font-bold ${charCount > maxChars ? 'text-red-500' : 'text-gray-400'}`}>
              {charCount}/{maxChars}
            </span>
          )}
        </div>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            {type === 'select' ? (
              <select
                name={name}
                value={value}
                onChange={handleInputChange}
                className={`w-full px-3 py-1.5 bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500'} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-200/50 transition-all`}
              >
                {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ) : type === 'textarea' ? (
              <textarea
                name={name}
                value={value}
                onChange={handleInputChange}
                rows={2}
                className={`w-full px-3 py-1.5 bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500'} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-200/50 transition-all resize-none`}
              />
            ) : (
              <input
                type="text"
                name={name}
                value={value}
                onChange={handleInputChange}
                className={`w-full px-3 py-1.5 bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500'} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-200/50 transition-all`}
              />
            )}
          </div>
          <div className="w-5 flex justify-center shrink-0">
            {value && !error && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            {error && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 text-left animate-fade-in" id="admin-seo-settings">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <Globe className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">
              {language === 'bn' ? 'এসইও সেটিংস' : 'SEO Control Center'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {language === 'bn' ? 'সার্চ ইঞ্জিন অপ্টিমাইজেশন ও মেটাডাটা ম্যানেজমেন্ট' : 'Global Search Presence & Social Optimization'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saved' && (
            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> SAVED ✓
            </div>
          )}
          {hasUnsavedChanges && saveStatus === 'idle' && (
            <div className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-[10px] font-black flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> UNSAVED CHANGES
            </div>
          )}
        </div>
      </div>

      {/* SEO Health & Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <section className="md:col-span-2 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-[10px] font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'এসইও স্বাস্থ্য' : 'SEO Health Overview'}</h2>
            </div>
            <span className="text-[9px] font-bold text-gray-400">LIVE ANALYSIS</span>
          </div>
          {renderHealthCheck()}
        </section>

        <section className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <h2 className="text-[10px] font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'ইনডেক্সিং স্ট্যাটাস' : 'Indexing Status'}</h2>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-gray-400">SITEMAP:</span>
              <span className="text-emerald-600">{status?.sitemap_status} ✓</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-gray-400">ROBOTS:</span>
              <span className="text-emerald-600">{status?.robots_status} ✓</span>
            </div>
            <button 
              onClick={handleRegenerateSitemap}
              className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3 h-3" /> {language === 'bn' ? 'সাইটম্যাপ রিফ্রেশ করুন' : 'Regenerate Sitemap'}
            </button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column — Configs */}
        <div className="space-y-6">
          
          {/* BASIC SEO */}
          <section className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('basic')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-600" />
                <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'বেসিক এসইও' : 'Basic SEO'}</h2>
              </div>
              {expandedSections.basic ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedSections.basic && (
              <div className="p-4 pt-0 space-y-4 border-t border-gray-50">
                {renderField(language === 'bn' ? 'এসইও টাইটেল' : 'Website SEO Title', 'seo_title')}
                {renderField(language === 'bn' ? 'মেটা ডেসক্রিপশন' : 'Meta Description', 'seo_description', 'textarea')}
                {renderField(language === 'bn' ? 'ডিফল্ট কিওয়ার্ড' : 'Default Keywords', 'seo_keywords')}
                {renderField(language === 'bn' ? 'ক্যানোনিকাল ইউআরএল' : 'Canonical URL', 'seo_canonical')}
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Robots Index', 'seo_index', 'select', [
                    { value: 'index', label: 'Index' },
                    { value: 'noindex', label: 'No Index' }
                  ])}
                  {renderField('Robots Follow', 'seo_follow', 'select', [
                    { value: 'follow', label: 'Follow' },
                    { value: 'nofollow', label: 'No Follow' }
                  ])}
                </div>
              </div>
            )}
          </section>

          {/* OPEN GRAPH */}
          <section className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('social')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'সোশ্যাল মিডিয়া (OG)' : 'Social Meta (Open Graph)'}</h2>
              </div>
              {expandedSections.social ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedSections.social && (
              <div className="p-4 pt-0 space-y-4 border-t border-gray-50">
                {renderField(language === 'bn' ? 'ওজি টাইটেল' : 'OG Title', 'og_title')}
                {renderField(language === 'bn' ? 'ওজি ডেসক্রিপশন' : 'OG Description', 'og_description', 'textarea')}
                {renderField(language === 'bn' ? 'ওজি ইমেজ (URL)' : 'OG Image (URL)', 'og_image')}
              </div>
            )}
          </section>

          {/* TWITTER CARD */}
          <section className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('twitter')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Twitter className="w-4 h-4 text-sky-500" />
                <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'টুইটার / X কার্ড' : 'Twitter / X Card'}</h2>
              </div>
              {expandedSections.twitter ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedSections.twitter && (
              <div className="p-4 pt-0 space-y-4 border-t border-gray-50">
                {renderField('Card Type', 'twitter_card', 'select', [
                  { value: 'summary', label: 'Summary' },
                  { value: 'summary_large_image', label: 'Summary Large Image' }
                ])}
                {renderField('Twitter Title', 'twitter_title')}
                {renderField('Twitter Description', 'twitter_description', 'textarea')}
                {renderField('Twitter Image (URL)', 'twitter_image')}
              </div>
            )}
          </section>

          {/* SEO AUTOMATION */}
          <section className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('automation')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'এসইও অটোমেশন' : 'SEO Automation'}</h2>
              </div>
              {expandedSections.automation ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedSections.automation && (
              <div className="p-4 pt-0 space-y-3 border-t border-gray-50">
                {[
                  { label: 'Auto SEO Title', key: 'seo_auto_title' },
                  { label: 'Auto Meta Description', key: 'seo_auto_description' },
                  { label: 'Auto Product SEO', key: 'seo_auto_products' },
                  { label: 'Auto Category SEO', key: 'seo_auto_categories' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-600">{item.label}</span>
                    <select 
                      value={settings[item.key as keyof GlobalSeoSettings]}
                      onChange={(e) => handleInputChange({ target: { name: item.key, value: e.target.value } } as any)}
                      className="bg-white border border-gray-200 rounded-lg text-[10px] font-black px-2 py-0.5"
                    >
                      <option value="on">ENABLED</option>
                      <option value="off">DISABLED</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* PAGE SEO */}
          <section className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('page_seo')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-emerald-600" />
                <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'পেজ এসইও' : 'Page SEO'}</h2>
              </div>
              {expandedSections.page_seo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedSections.page_seo && (
              <div className="p-4 pt-0 space-y-4 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-500 mt-2">{language === 'bn' ? 'About Us পেজের জন্য আলাদা এসইও সেটিংস' : 'Specific SEO settings for the About Us page'}</p>
                {renderField(language === 'bn' ? 'About এসইও টাইটেল' : 'About SEO Title', 'about_seo_title')}
                {renderField(language === 'bn' ? 'About মেটা ডেসক্রিপশন' : 'About Meta Description', 'about_seo_description', 'textarea')}
              </div>
            )}
          </section>

        </div>

        {/* Right Column — Previews */}
        <div className="space-y-6">
          
          {/* SEARCH PREVIEW */}
          <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <Search className="w-4 h-4 text-blue-600" />
              <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'গুগল সার্চ প্রিভিউ' : 'Google Search Preview'}</h2>
            </div>
            <div className="bg-white border border-gray-100 p-4 rounded-xl space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 overflow-hidden">
                <span className="whitespace-nowrap">shadghor.com ›</span>
                <span className="text-gray-400 truncate">{settings.seo_canonical.replace(/^https?:\/\//, '') || 'home'}</span>
              </div>
              <h4 className="text-[15px] text-blue-800 font-medium hover:underline cursor-pointer leading-tight break-words">
                {settings.seo_title || 'Please enter a Title'}
              </h4>
              <p className="text-[12px] text-gray-600 leading-snug break-words line-clamp-2">
                {settings.seo_description || 'Please enter a Meta Description to see how it appears in search results.'}
              </p>
            </div>
            <p className="text-[9px] text-gray-400 font-bold px-1">
              * Actual preview may vary based on user device and screen size.
            </p>
          </section>

          {/* SOCIAL PREVIEW */}
          <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <Eye className="w-4 h-4 text-pink-600" />
              <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'সোশ্যাল শেয়ার প্রিভিউ' : 'Social Share Preview'}</h2>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="h-36 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                {settings.og_image ? (
                  <img src={settings.og_image} alt="OG" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-gray-200" />
                )}
              </div>
              <div className="p-3 bg-gray-50 space-y-1 border-t border-gray-100">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">SHADGHOR.COM</span>
                <h5 className="text-[12px] font-black text-gray-800 truncate">{settings.og_title || settings.seo_title}</h5>
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight">{settings.og_description || settings.seo_description}</p>
              </div>
            </div>
          </section>

          {/* STRUCTURED DATA */}
          <section className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <FileCode className="w-4 h-4 text-amber-600" />
              <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">{language === 'bn' ? 'স্ট্রাকচার্ড ডাটা' : 'Structured Data (JSON-LD)'}</h2>
            </div>
            <div className="bg-gray-900 p-4 rounded-xl overflow-hidden">
              <pre className="text-[10px] text-emerald-400 font-mono leading-relaxed overflow-x-auto">
{`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${settings.seo_title.split('—')[0].trim()}",
  "url": "https://shadghor.com",
  "logo": "https://shadghor.com/logo.png"
}`}
              </pre>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                {language === 'bn' 
                  ? 'প্রোডাক্ট ও রিভিউ স্কিমা আপনার ডাটাবেস থেকে স্বয়ংক্রিয়ভাবে জেনারেট করা হয়।' 
                  : 'Product, Offer, and Review schemas are automatically synced from your live database.'}
              </p>
            </div>
          </section>

        </div>

      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 flex items-center justify-center md:justify-end gap-3 shadow-lg animate-slide-up">
        <button
          onClick={handleReset}
          disabled={!hasUnsavedChanges || isSaving}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          {language === 'bn' ? 'পরিবর্তন বাতিল করুন' : 'Reset Changes'}
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
