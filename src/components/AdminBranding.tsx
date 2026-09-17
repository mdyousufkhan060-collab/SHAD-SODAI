import React, { useState, useEffect } from 'react';
import { 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Trash2, 
  Eye, 
  RefreshCw,
  Globe, 
  Image as ImageIcon, 
  Tag, 
  Palette, 
  FileText, 
  Phone, 
  Sparkles,
  ExternalLink,
  Leaf,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { BrandingData } from '../types';
import { useBranding } from '../context/BrandingContext';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_BRANDING, brandingService } from '../utils/brandingService';

export const AdminBranding: React.FC = () => {
  const { language } = useLanguage();
  const { branding: currentBranding, refreshBranding } = useBranding();

  const [formData, setFormData] = useState<BrandingData>(currentBranding || DEFAULT_BRANDING);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Sync state when context updates
  useEffect(() => {
    if (currentBranding) {
      setFormData(prev => ({
        ...prev,
        ...currentBranding
      }));
    }
  }, [currentBranding]);

  const handleChange = (field: keyof BrandingData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (field: keyof BrandingData, file: File, assetType: string) => {
    setUploadingField(field as string);
    setSaveStatus(null);
    try {
      const res = await brandingService.uploadAsset(file, assetType);
      if (res.success && res.url) {
        handleChange(field, res.url);
        setSaveStatus({
          type: 'success',
          message: `${assetType.replace('_', ' ').toUpperCase()} uploaded successfully.`
        });
      } else {
        setSaveStatus({
          type: 'error',
          message: res.error || 'Failed to upload asset file.'
        });
      }
    } catch (err: any) {
      setSaveStatus({
        type: 'error',
        message: err.message || 'Error occurred while uploading'
      });
    } finally {
      setUploadingField(null);
    }
  };

  const handleAutoSlug = () => {
    if (!formData.site_name) return;
    const slug = formData.site_name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    handleChange('short_name', slug);
  };

  const handleReset = () => {
    if (currentBranding) {
      setFormData(currentBranding);
    } else {
      setFormData(DEFAULT_BRANDING);
    }
    setSaveStatus({
      type: 'success',
      message: language === 'bn' ? 'পরিবর্তন বাতিল করা হয়েছে।' : 'Changes reverted to last saved state.'
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const res = await brandingService.saveBranding(formData);
      if (res.success) {
        setSaveStatus({
          type: 'success',
          message: language === 'bn' 
            ? 'ব্র্যান্ডিং সেটিংস সফলভাবে সংরক্ষিত ও সম্পূর্ণ ওয়েবসাইটে আপডেট হয়েছে।'
            : 'Branding settings saved and updated across the entire website.'
        });
        await refreshBranding();
      } else {
        setSaveStatus({
          type: 'error',
          message: res.message || 'Failed to save branding settings'
        });
      }
    } catch (err: any) {
      setSaveStatus({
        type: 'error',
        message: err.message || 'Unexpected error occurred while saving'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-5" id="admin-branding-section">
      
      {/* ======================================================== */}
      {/* 1. PAGE HEADER & TOP ACTION BAR */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {language === 'bn' ? 'ওয়েবসাইট ব্র্যান্ডিং ও আইডেন্টিটি' : 'Website Branding Settings'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'ওয়েবসাইটের নাম, লোগো, ট্যাগলাইন, কালার প্যালেট ও এসইও মেটাডাটা পরিচালনা করুন।'
              : 'Manage canonical website identity, logos, tagline, color palette, and SEO meta tags.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className="h-10 px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium text-xs sm:text-sm rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            id="branding-toggle-preview-btn"
          >
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>{showLivePreview ? (language === 'bn' ? 'প্রিভিউ লুকান' : 'Hide Preview') : (language === 'bn' ? 'লাইভ প্রিভিউ' : 'Live Preview')}</span>
            {showLivePreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 px-4 sm:px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-md shadow-xs flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            id="branding-top-save-btn"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes')}</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast / Banner */}
      {saveStatus && (
        <div 
          className={`p-3.5 rounded-md border flex items-center gap-2.5 text-xs sm:text-sm font-medium transition-all ${
            saveStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
          id="branding-save-alert"
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* OPTIONAL LIVE PREVIEWS ACCORDION */}
      {/* ======================================================== */}
      {showLivePreview && (
        <div className="bg-white border border-gray-200 rounded-md p-4 sm:p-5 space-y-4 shadow-xs" id="branding-live-preview-box">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>{language === 'bn' ? 'লাইভ প্রিভিউ (হেডার, অ্যাডমিন ও ফুটার)' : 'Live Multi-Surface Previews'}</span>
            </h3>
            <span className="text-[11px] text-gray-500">Real-time preview of unsaved changes</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Header Preview */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-gray-700">Website Header Preview</span>
              <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                {formData.tagline_enabled && (
                  <div 
                    className="py-1 px-3 text-[11px] font-medium"
                    style={{
                      backgroundColor: formData.tagline_bg_color || formData.primary_color || '#065f46',
                      color: formData.tagline_text_color || '#ffffff',
                      textAlign: formData.tagline_align || 'center'
                    }}
                  >
                    {language === 'bn' ? (formData.tagline_text_bn || formData.tagline_text) : (formData.tagline_text || formData.tagline)}
                  </div>
                )}
                <div className="px-3 py-2.5 flex items-center justify-between border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {formData.primary_logo ? (
                      <img src={formData.primary_logo} alt="Logo" className="w-6 h-6 object-contain" />
                    ) : (
                      <Leaf className="w-5 h-5 text-emerald-600" />
                    )}
                    <span className="font-bold text-sm tracking-tight text-emerald-700 uppercase">
                      {formData.site_name || 'SHAD SHODAI'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                    Header Live View
                  </div>
                </div>
              </div>
            </div>

            {/* Admin & Footer Mock */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-gray-700">Admin Sidebar & Footer Preview</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900 text-white p-2.5 rounded-md border border-slate-800 flex items-center gap-2 text-xs">
                  {formData.admin_logo || formData.primary_logo ? (
                    <img src={formData.admin_logo || formData.primary_logo} alt="Admin Logo" className="w-5 h-5 object-contain" />
                  ) : (
                    <Leaf className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="font-bold text-xs uppercase truncate">
                    {formData.site_name || 'SHAD SHODAI'}
                  </span>
                </div>

                <div className="bg-slate-950 text-slate-300 p-2.5 rounded-md border border-slate-800 flex items-center gap-2 text-xs">
                  {formData.footer_logo || formData.primary_logo ? (
                    <img src={formData.footer_logo || formData.primary_logo} alt="Footer Logo" className="w-5 h-5 object-contain" />
                  ) : (
                    <Leaf className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="font-bold text-xs text-white truncate">
                    {formData.site_name || 'SHAD SHODAI'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MAIN COMPACT RECTANGULAR FORM CONTAINER */}
      {/* ======================================================== */}
      <div className="bg-white border border-gray-200 rounded-md p-4 sm:p-6 space-y-6 shadow-xs">

        {/* ======================================================== */}
        {/* SECTION 1: WEBSITE IDENTITY */}
        {/* ======================================================== */}
        <section id="section-website-identity" className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>{language === 'bn' ? 'ওয়েবসাইট আইডেন্টিটি' : 'Website Identity'}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {language === 'bn'
                ? 'ব্র্যান্ডের প্রাথমিক নাম, স্থানীয় বাংলা নাম এবং পরিচিতি তথ্য।'
                : 'Define canonical brand names, slug identifiers, and category details.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand Name EN */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'bn' ? 'ব্র্যান্ড নাম (ইংরেজি)' : 'Brand Name (English)'}
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.site_name}
                onChange={e => handleChange('site_name', e.target.value)}
                placeholder="SHAD SHODAI"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-colors"
                id="input-site-name"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Primary website name used in headers, invoices, emails, and page titles.
              </span>
            </div>

            {/* Brand Name BN */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'bn' ? 'ব্র্যান্ড নাম (বাংলা)' : 'Bengali / Local Brand Name'}
              </label>
              <input
                type="text"
                value={formData.site_name_bn}
                onChange={e => handleChange('site_name_bn', e.target.value)}
                placeholder="স্বাদ সদাই"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-colors"
                id="input-site-name-bn"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Displayed for Bengali language visitors and local documentation.
              </span>
            </div>

            {/* Brand Slug */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'bn' ? 'ব্র্যান্ড স্লাগ / আইডেন্টিফায়ার' : 'Brand Slug'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.short_name}
                  onChange={e => handleChange('short_name', e.target.value)}
                  placeholder="shad-shodai"
                  className="flex-1 h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-mono focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-colors"
                  id="input-brand-slug"
                />
                <button
                  type="button"
                  onClick={handleAutoSlug}
                  className="h-11 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-xs font-semibold shrink-0 cursor-pointer transition-colors"
                  title="Generate slug from name"
                >
                  Auto
                </button>
              </div>
            </div>

            {/* Business / Store Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'bn' ? 'ব্যবসার ধরণ / ক্যাটাগরি' : 'Business Category / Store Type'}
              </label>
              <input
                type="text"
                value={formData.business_type}
                onChange={e => handleChange('business_type', e.target.value)}
                placeholder="Online Organic Grocery & Food Store"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-colors"
                id="input-business-type"
              />
            </div>

            {/* Short Tagline Slogan */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'bn' ? 'সংক্ষিপ্ত স্লোগান / ট্যাগলাইন' : 'Short Tagline / Slogan'}
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => handleChange('tagline', e.target.value)}
                placeholder="100% Pure Organic & Safe Food"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-colors"
                id="input-short-tagline"
              />
            </div>

            {/* Core Brand Keywords */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'bn' ? 'ব্র্যান্ড কোর কি-ওয়ার্ডস' : 'Brand Core Keywords'}
              </label>
              <input
                type="text"
                value={formData.brand_keywords}
                onChange={e => handleChange('brand_keywords', e.target.value)}
                placeholder="organic food, pure honey, mustard oil, desi ghee, spices"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-colors"
                id="input-brand-keywords"
              />
            </div>

            {/* Full Description EN */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'bn' ? 'ব্র্যান্ড স্টোরি / বিস্তারিত বিবরণ (ইংরেজি)' : 'Full Brand Story / Description (English)'}
              </label>
              <textarea
                rows={3}
                value={formData.brand_description}
                onChange={e => handleChange('brand_description', e.target.value)}
                placeholder="SHAD SHODAI is a premier organic e-commerce destination committed to delivering 100% chemical-free, natural, and traditional culinary essentials directly to your doorstep."
                className="w-full min-h-[88px] p-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-colors"
                id="input-description-en"
              />
            </div>

            {/* Full Description BN */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'bn' ? 'ব্র্যান্ড স্টোরি / বিস্তারিত বিবরণ (বাংলা)' : 'Full Brand Story / Description (Bengali)'}
              </label>
              <textarea
                rows={3}
                value={formData.brand_description_bn}
                onChange={e => handleChange('brand_description_bn', e.target.value)}
                placeholder="স্বাদ সদাই বাংলাদেশের একটি বিশ্বস্ত প্রিমিয়াম অর্গানিক ফুড শপ। আমরা শতভাগ বিশুদ্ধ মধু, সরিষার তেল, ঘি ও নিরাপদ খাদ্য সরবরাহ করি।"
                className="w-full min-h-[88px] p-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-colors"
                id="input-description-bn"
              />
            </div>

            {/* Copyright Notice EN */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'bn' ? 'কপিরাইট নোটিস (ইংরেজি)' : 'Copyright Notice (English)'}
              </label>
              <input
                type="text"
                value={formData.copyright_text}
                onChange={e => handleChange('copyright_text', e.target.value)}
                placeholder="© 2026 SHAD SHODAI. All Rights Reserved."
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-colors"
                id="input-copyright-en"
              />
            </div>

            {/* Copyright Notice BN */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'bn' ? 'কপিরাইট নোটিস (বাংলা)' : 'Copyright Notice (Bengali)'}
              </label>
              <input
                type="text"
                value={formData.copyright_text_bn}
                onChange={e => handleChange('copyright_text_bn', e.target.value)}
                placeholder="© ২০২৬ স্বাদ সদাই। সর্বস্বত্ব সংরক্ষিত।"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-colors"
                id="input-copyright-bn"
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* ======================================================== */}
        {/* SECTION 2: BRAND MEDIA & ASSETS */}
        {/* ======================================================== */}
        <section id="section-brand-media" className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>{language === 'bn' ? 'ব্র্যান্ড মিডিয়া ও লোগো' : 'Brand Media & Logos'}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {language === 'bn'
                ? 'Primary Brand Logo হলো মূল লোগো। অন্য কোনো ফিল্ড খালি থাকলে স্বয়ংক্রিয়ভাবে Primary Logo ব্যবহৃত হবে।'
                : 'Primary Logo is the canonical source of truth. Unset specialized logos automatically fallback to it.'}
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Asset Row: Primary Logo */}
            <div className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900">
                    {language === 'bn' ? 'মূল ব্র্যান্ড লোগো (Primary Brand Logo)' : 'Primary Brand Logo'}
                  </span>
                  <span className="text-[10px] ml-2 px-1.5 py-0.5 bg-emerald-600 text-white rounded font-bold uppercase">
                    Primary / Canonical
                  </span>
                </div>
                <span className="text-[11px] text-emerald-800 font-medium">SVG, PNG, WebP (Transparent)</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* 48px Preview Box */}
                <div className="w-12 h-12 bg-white border border-gray-300 rounded-md flex items-center justify-center p-1 shrink-0 relative group">
                  {formData.primary_logo ? (
                    <img src={formData.primary_logo} alt="Primary Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Leaf className="w-6 h-6 text-emerald-600" />
                  )}
                  {formData.primary_logo && (
                    <button
                      type="button"
                      onClick={() => handleChange('primary_logo', '')}
                      className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Upload Button */}
                <label className="h-11 px-3.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{uploadingField === 'primary_logo' ? 'Uploading...' : 'Upload Logo'}</span>
                  <input
                    type="file"
                    accept="image/*,.svg"
                    className="hidden"
                    disabled={uploadingField === 'primary_logo'}
                    onChange={e => {
                      if (e.target.files?.[0]) handleFileUpload('primary_logo', e.target.files[0], 'primary_logo');
                    }}
                  />
                </label>

                {/* Direct URL Input */}
                <input
                  type="text"
                  value={formData.primary_logo}
                  onChange={e => handleChange('primary_logo', e.target.value)}
                  placeholder="Asset URL (e.g. /uploads/branding/logo.png or https://...)"
                  className="flex-1 h-11 px-3 bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  id="input-primary-logo"
                />
              </div>
            </div>

            {/* Asset Row: Compact Logo */}
            <div className="p-3 bg-gray-50/70 border border-gray-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">
                  Compact / Icon Logo (Mobile & Collapsed)
                </span>
                {!formData.compact_logo && formData.primary_logo && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    Using Primary Logo Fallback
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="w-12 h-12 bg-white border border-gray-300 rounded-md flex items-center justify-center p-1 shrink-0 relative group">
                  {formData.compact_logo || formData.primary_logo ? (
                    <img src={formData.compact_logo || formData.primary_logo} alt="Compact Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-gray-400 font-medium">Icon</span>
                  )}
                  {formData.compact_logo && (
                    <button
                      type="button"
                      onClick={() => handleChange('compact_logo', '')}
                      className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer"
                      title="Clear"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <label className="h-11 px-3.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-gray-500" />
                  <span>{uploadingField === 'compact_logo' ? 'Uploading...' : 'Upload Compact'}</span>
                  <input
                    type="file"
                    accept="image/*,.svg"
                    className="hidden"
                    disabled={uploadingField === 'compact_logo'}
                    onChange={e => {
                      if (e.target.files?.[0]) handleFileUpload('compact_logo', e.target.files[0], 'compact_logo');
                    }}
                  />
                </label>

                <input
                  type="text"
                  value={formData.compact_logo}
                  onChange={e => handleChange('compact_logo', e.target.value)}
                  placeholder="URL for compact logo (Optional)"
                  className="flex-1 h-11 px-3 bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  id="input-compact-logo"
                />
              </div>
            </div>

            {/* Asset Row: Favicon */}
            <div className="p-3 bg-gray-50/70 border border-gray-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">
                  Website Favicon (.ico / .png / .svg)
                </span>
                {!formData.favicon && formData.primary_logo && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    Using Primary Logo Fallback
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="w-12 h-12 bg-white border border-gray-300 rounded-md flex items-center justify-center p-1 shrink-0 relative group">
                  {formData.favicon || formData.primary_logo ? (
                    <img src={formData.favicon || formData.primary_logo} alt="Favicon" className="w-6 h-6 object-contain" />
                  ) : (
                    <span className="text-[10px] text-gray-400 font-medium">Favicon</span>
                  )}
                  {formData.favicon && (
                    <button
                      type="button"
                      onClick={() => handleChange('favicon', '')}
                      className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer"
                      title="Clear"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <label className="h-11 px-3.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-gray-500" />
                  <span>{uploadingField === 'favicon' ? 'Uploading...' : 'Upload Favicon'}</span>
                  <input
                    type="file"
                    accept="image/*,.ico,.png,.svg"
                    className="hidden"
                    disabled={uploadingField === 'favicon'}
                    onChange={e => {
                      if (e.target.files?.[0]) handleFileUpload('favicon', e.target.files[0], 'favicon');
                    }}
                  />
                </label>

                <input
                  type="text"
                  value={formData.favicon}
                  onChange={e => handleChange('favicon', e.target.value)}
                  placeholder="URL for favicon (e.g. /favicon.ico or .png)"
                  className="flex-1 h-11 px-3 bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  id="input-favicon"
                />
              </div>
            </div>

            {/* Asset Row: Admin Logo */}
            <div className="p-3 bg-gray-50/70 border border-gray-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">
                  Admin Panel Header Logo
                </span>
                {!formData.admin_logo && formData.primary_logo && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    Using Primary Logo Fallback
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-md flex items-center justify-center p-1 shrink-0 relative group">
                  {formData.admin_logo || formData.primary_logo ? (
                    <img src={formData.admin_logo || formData.primary_logo} alt="Admin Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Leaf className="w-5 h-5 text-emerald-400" />
                  )}
                  {formData.admin_logo && (
                    <button
                      type="button"
                      onClick={() => handleChange('admin_logo', '')}
                      className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer"
                      title="Clear"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <label className="h-11 px-3.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-gray-500" />
                  <span>{uploadingField === 'admin_logo' ? 'Uploading...' : 'Upload Admin Logo'}</span>
                  <input
                    type="file"
                    accept="image/*,.svg"
                    className="hidden"
                    disabled={uploadingField === 'admin_logo'}
                    onChange={e => {
                      if (e.target.files?.[0]) handleFileUpload('admin_logo', e.target.files[0], 'admin_logo');
                    }}
                  />
                </label>

                <input
                  type="text"
                  value={formData.admin_logo}
                  onChange={e => handleChange('admin_logo', e.target.value)}
                  placeholder="URL for Admin Logo (Optional)"
                  className="flex-1 h-11 px-3 bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  id="input-admin-logo"
                />
              </div>
            </div>

            {/* Asset Row: Footer Logo */}
            <div className="p-3 bg-gray-50/70 border border-gray-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">
                  Footer Logo (Dark Background)
                </span>
                {!formData.footer_logo && formData.primary_logo && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    Using Primary Logo Fallback
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-md flex items-center justify-center p-1 shrink-0 relative group">
                  {formData.footer_logo || formData.primary_logo ? (
                    <img src={formData.footer_logo || formData.primary_logo} alt="Footer Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Leaf className="w-5 h-5 text-emerald-500" />
                  )}
                  {formData.footer_logo && (
                    <button
                      type="button"
                      onClick={() => handleChange('footer_logo', '')}
                      className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer"
                      title="Clear"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <label className="h-11 px-3.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-gray-500" />
                  <span>{uploadingField === 'footer_logo' ? 'Uploading...' : 'Upload Footer Logo'}</span>
                  <input
                    type="file"
                    accept="image/*,.svg"
                    className="hidden"
                    disabled={uploadingField === 'footer_logo'}
                    onChange={e => {
                      if (e.target.files?.[0]) handleFileUpload('footer_logo', e.target.files[0], 'footer_logo');
                    }}
                  />
                </label>

                <input
                  type="text"
                  value={formData.footer_logo}
                  onChange={e => handleChange('footer_logo', e.target.value)}
                  placeholder="URL for Footer Logo (Optional)"
                  className="flex-1 h-11 px-3 bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  id="input-footer-logo"
                />
              </div>
            </div>

          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* ======================================================== */}
        {/* SECTION 3: TAGLINE & ANNOUNCEMENT BAR */}
        {/* ======================================================== */}
        <section id="section-tagline-bar" className="space-y-4">
          <div className="border-b border-gray-200 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'ট্যাগলাইন ও নোটিস বার' : 'Tagline & Announcement Bar'}</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {language === 'bn'
                  ? 'হেডারের ঠিক উপরে সার্বজনীন অফার ও নোটিস বার পরিচালনা করুন।'
                  : 'Configure the global announcement banner situated directly above the main website header.'}
              </p>
            </div>

            {/* Toggle Switch */}
            <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md self-start sm:self-auto">
              <input
                type="checkbox"
                checked={formData.tagline_enabled}
                onChange={e => handleChange('tagline_enabled', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                id="checkbox-tagline-enabled"
              />
              <span>{formData.tagline_enabled ? 'Active / Enabled' : 'Disabled'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tagline EN */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'bn' ? 'ট্যাগলাইন টেক্সট (ইংরেজি)' : 'Tagline Text (English)'}
              </label>
              <input
                type="text"
                value={formData.tagline_text}
                onChange={e => handleChange('tagline_text', e.target.value)}
                placeholder="🌿 Free Delivery on Orders Over ৳1500 | 100% Pure Organic"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                id="input-tagline-en"
              />
            </div>

            {/* Tagline BN */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'bn' ? 'ট্যাগলাইন টেক্সট (বাংলা)' : 'Tagline Text (Bengali)'}
              </label>
              <input
                type="text"
                value={formData.tagline_text_bn}
                onChange={e => handleChange('tagline_text_bn', e.target.value)}
                placeholder="🌿 ১৫০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি | ১০০% খাঁটি ও অর্গানিক"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                id="input-tagline-bn"
              />
            </div>

            {/* Tagline Link */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'bn' ? 'ক্লিকেবল লিঙ্ক / গন্তব্য (ঐচ্ছিক)' : 'Clickable Destination URL (Optional)'}
              </label>
              <input
                type="text"
                value={formData.tagline_link}
                onChange={e => handleChange('tagline_link', e.target.value)}
                placeholder="#/offers or https://example.com"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                id="input-tagline-link"
              />
            </div>

            {/* Link Target & Alignment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Link Target
                </label>
                <select
                  value={formData.tagline_link_target || '_self'}
                  onChange={e => handleChange('tagline_link_target', e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-gray-300 rounded-md text-xs font-medium focus:border-emerald-600 focus:outline-none"
                >
                  <option value="_self">Same Tab (_self)</option>
                  <option value="_blank">New Tab (_blank)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Alignment
                </label>
                <select
                  value={formData.tagline_align || 'center'}
                  onChange={e => handleChange('tagline_align', e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-gray-300 rounded-md text-xs font-medium focus:border-emerald-600 focus:outline-none"
                >
                  <option value="center">Center</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>

            {/* Background & Text Color */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Tagline Background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.tagline_bg_color || '#065f46'}
                    onChange={e => handleChange('tagline_bg_color', e.target.value)}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={formData.tagline_bg_color}
                    onChange={e => handleChange('tagline_bg_color', e.target.value)}
                    placeholder="#065f46"
                    className="flex-1 h-11 px-2.5 bg-white border border-gray-300 rounded-md text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Tagline Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.tagline_text_color || '#ffffff'}
                    onChange={e => handleChange('tagline_text_color', e.target.value)}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={formData.tagline_text_color}
                    onChange={e => handleChange('tagline_text_color', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 h-11 px-2.5 bg-white border border-gray-300 rounded-md text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Visibility checkboxes */}
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.tagline_show_desktop}
                  onChange={e => handleChange('tagline_show_desktop', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Show on Desktop</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.tagline_show_mobile}
                  onChange={e => handleChange('tagline_show_mobile', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Show on Mobile</span>
              </label>
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* ======================================================== */}
        {/* SECTION 4: BRAND COLOR PALETTE */}
        {/* ======================================================== */}
        <section id="section-brand-colors" className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-600" />
              <span>{language === 'bn' ? 'ব্র্যান্ড কালার প্যালেট' : 'Brand Color Palette'}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {language === 'bn'
                ? 'ওয়েবসাইটের প্রাথমিক, সেকেন্ডারি ও অ্যাকসেন্ট কালার নির্ধারণ করুন।'
                : 'Primary, secondary, and accent colors utilized across buttons, badges, and accents.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Primary Brand Color */}
            <div className="p-3 border border-gray-200 rounded-md bg-white space-y-2">
              <div className="h-10 rounded flex items-center justify-center font-bold text-xs text-white" style={{ backgroundColor: formData.primary_color }}>
                Primary Green
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={e => handleChange('primary_color', e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={e => handleChange('primary_color', e.target.value)}
                  className="flex-1 h-9 px-2.5 bg-white border border-gray-300 rounded-md text-xs font-mono font-semibold"
                />
              </div>
            </div>

            {/* Secondary Dark Color */}
            <div className="p-3 border border-gray-200 rounded-md bg-white space-y-2">
              <div className="h-10 rounded flex items-center justify-center font-bold text-xs text-white" style={{ backgroundColor: formData.secondary_color }}>
                Secondary Dark
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={e => handleChange('secondary_color', e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={e => handleChange('secondary_color', e.target.value)}
                  className="flex-1 h-9 px-2.5 bg-white border border-gray-300 rounded-md text-xs font-mono font-semibold"
                />
              </div>
            </div>

            {/* Accent Amber Color */}
            <div className="p-3 border border-gray-200 rounded-md bg-white space-y-2">
              <div className="h-10 rounded flex items-center justify-center font-bold text-xs text-white" style={{ backgroundColor: formData.accent_color }}>
                Accent Amber
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.accent_color}
                  onChange={e => handleChange('accent_color', e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={formData.accent_color}
                  onChange={e => handleChange('accent_color', e.target.value)}
                  className="flex-1 h-9 px-2.5 bg-white border border-gray-300 rounded-md text-xs font-mono font-semibold"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* ======================================================== */}
        {/* SECTION 5: BUSINESS & CONTACT PROFILE */}
        {/* ======================================================== */}
        <section id="section-business-profile" className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>{language === 'bn' ? 'ব্যবসায়িক যোগাযোগ ও ঠিকানা' : 'Business Contact & Additional Information'}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {language === 'bn'
                ? 'অফিসিয়াল ফোন, ইমেইল, হোয়াটসঅ্যাপ ও অফিসের অবস্থান।'
                : 'Customer support touchpoints, physical store location, and operational hours.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Country */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={formData.store_country || 'Bangladesh'}
                onChange={e => handleChange('store_country', e.target.value)}
                placeholder="Bangladesh"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Official Website URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Official Website URL
              </label>
              <input
                type="text"
                value={formData.website_url || formData.canonical_url}
                onChange={e => {
                  handleChange('website_url', e.target.value);
                  handleChange('canonical_url', e.target.value);
                }}
                placeholder="https://shadshodai.com"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Official Phone Number
              </label>
              <input
                type="text"
                value={formData.store_phone}
                onChange={e => handleChange('store_phone', e.target.value)}
                placeholder="+880 1700-000000"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                WhatsApp Support Number
              </label>
              <input
                type="text"
                value={formData.store_whatsapp}
                onChange={e => handleChange('store_whatsapp', e.target.value)}
                placeholder="+880 1700-000000"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Official Email Address
              </label>
              <input
                type="email"
                value={formData.store_email}
                onChange={e => handleChange('store_email', e.target.value)}
                placeholder="info@shadshodai.com"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Support Hours */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Support Operating Hours
              </label>
              <input
                type="text"
                value={formData.support_hours}
                onChange={e => handleChange('support_hours', e.target.value)}
                placeholder="Sat - Thu: 9:00 AM - 9:00 PM"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Physical Office / Store Address
              </label>
              <input
                type="text"
                value={formData.store_address}
                onChange={e => handleChange('store_address', e.target.value)}
                placeholder="Rampura, Dhaka, Bangladesh"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* ======================================================== */}
        {/* SECTION 6: SEARCH ENGINE OPTIMIZATION (SEO) */}
        {/* ======================================================== */}
        <section id="section-brand-seo" className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{language === 'bn' ? 'ব্র্যান্ড এসইও সেটিংস (SEO)' : 'Brand SEO Settings'}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {language === 'bn'
                ? 'গুগল সার্চ ইঞ্জিন ও সামাজিক যোগাযোগ মাধ্যমের মেটাডাটা।'
                : 'Configure Google search results preview, title tags, and OpenGraph social metadata.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SEO Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                SEO Title
              </label>
              <input
                type="text"
                value={formData.seo_title}
                onChange={e => handleChange('seo_title', e.target.value)}
                placeholder="SHAD SHODAI — 100% Pure & Organic Grocery Shop"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                id="input-seo-title"
              />
            </div>

            {/* Canonical URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Canonical URL
              </label>
              <input
                type="text"
                value={formData.canonical_url}
                onChange={e => handleChange('canonical_url', e.target.value)}
                placeholder="https://shadshodai.com"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                id="input-canonical-url"
              />
            </div>

            {/* Meta Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Meta Description
              </label>
              <textarea
                rows={2}
                value={formData.seo_description}
                onChange={e => handleChange('seo_description', e.target.value)}
                placeholder="Buy 100% pure organic spices, natural honey, cold-pressed mustard oil, and authentic ghee online in Bangladesh."
                className="w-full min-h-[80px] p-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                id="input-seo-description"
              />
            </div>

            {/* SEO Keywords */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                SEO Keywords
              </label>
              <input
                type="text"
                value={formData.seo_keywords || formData.brand_keywords}
                onChange={e => handleChange('seo_keywords', e.target.value)}
                placeholder="organic food, pure honey, mustard oil, grocery bangladesh"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                id="input-seo-keywords"
              />
            </div>

            {/* OpenGraph Social Image */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                OpenGraph Social Image URL
              </label>
              <input
                type="text"
                value={formData.og_image}
                onChange={e => handleChange('og_image', e.target.value)}
                placeholder="https://shadshodai.com/og-banner.jpg"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                id="input-og-image"
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* ======================================================== */}
        {/* BOTTOM ACTION BAR */}
        {/* ======================================================== */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="h-11 px-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium text-sm rounded-md shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            id="branding-cancel-btn"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>{language === 'bn' ? 'বাতিল / পূর্বাবস্থায় ফিরুন' : 'Cancel'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-md shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            id="branding-bottom-save-btn"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
