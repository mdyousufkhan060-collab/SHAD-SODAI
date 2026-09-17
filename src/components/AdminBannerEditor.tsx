import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X, 
  Monitor, 
  Smartphone, 
  Eye, 
  ChevronRight,
  ExternalLink,
  Info,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Layout,
  Type,
  Link as LinkIcon,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminService } from '../utils/adminService';

interface Banner {
  id?: number;
  name: string;
  image_url_desktop: string;
  image_url_mobile: string;
  heading_en: string | null;
  heading_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  alt_en: string | null;
  alt_bn: string | null;
  button_text_en: string | null;
  button_text_bn: string | null;
  button_link: string | null;
  destination_type: 'internal' | 'external' | 'product' | 'category' | 'offer';
  display_location: string;
  status: 'active' | 'inactive';
  sort_order: number;
  category_id: number | null;
  start_date: string | null;
  end_date: string | null;
}

interface Category {
  id: number;
  name: string;
  name_bn: string;
}

interface AdminBannerEditorProps {
  language: 'en' | 'bn';
  banner?: Banner;
  defaultLocation?: string;
  onBack: () => void;
  onSave: () => void;
}

const AdminBannerEditor: React.FC<AdminBannerEditorProps> = ({ language, banner, defaultLocation, onBack, onSave }) => {
  const [formData, setFormData] = useState<Banner>(banner || {
    name: '',
    image_url_desktop: '',
    image_url_mobile: '',
    heading_en: '',
    heading_bn: '',
    description_en: '',
    description_bn: '',
    alt_en: '',
    alt_bn: '',
    button_text_en: 'Shop Now',
    button_text_bn: 'এখনই কিনুন',
    button_link: '',
    destination_type: 'internal',
    display_location: defaultLocation || 'homepage_hero',
    status: 'active',
    sort_order: 1,
    category_id: null,
    start_date: null,
    end_date: null
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isCatLoading, setIsCatLoading] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  useEffect(() => {
    if (formData.display_location === 'category_banner') {
      fetchCategories();
    }
  }, [formData.display_location]);

  const fetchCategories = async () => {
    setIsCatLoading(true);
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setIsCatLoading(false);
    }
  };

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isUploading, setIsUploading] = useState<{ desktop: boolean; mobile: boolean }>({ desktop: false, mobile: false });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ desktop?: any; mobile?: any }>({});
  
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const getRecommendedSize = (type: 'desktop' | 'mobile') => {
    const loc = formData.display_location;
    if (loc === 'category_banner') {
      return type === 'desktop' ? { w: 1920, h: 500, ratio: '19.2:5' } : { w: 1080, h: 600, ratio: '9:5' };
    }
    if (loc === 'homepage_promo') {
      return type === 'desktop' ? { w: 1920, h: 400, ratio: '19.2:4' } : { w: 1080, h: 500, ratio: '10.8:5' };
    }
    if (loc === 'auth_banner') {
      return type === 'desktop' ? { w: 1000, h: 1000, ratio: '1:1' } : { w: 800, h: 400, ratio: '2:1' };
    }
    return type === 'desktop' ? { w: 1920, h: 700, ratio: '19.2:7' } : { w: 1080, h: 1350, ratio: '4:5' };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(prev => ({ ...prev, [type]: true }));
    
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    
    const bannerType = formData.display_location === 'category_banner' ? 'category' : 'main';
    
    try {
      const response = await fetch(`/api/admin/banners/upload?type=${type}&bannerType=${bannerType}`, {
        method: 'POST',
        headers: adminService.getHeaders(),
        body: formDataUpload
      });
      const data = await response.json();
      
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          [type === 'desktop' ? 'image_url_desktop' : 'image_url_mobile']: data.data.url
        }));
        setUploadStats(prev => ({ ...prev, [type]: { ...data.data, success: true } }));
      } else {
        setUploadStats(prev => ({ ...prev, [type]: { error: data.error || 'Upload failed', success: false } }));
      }
    } catch (err) {
      console.error('Upload error', err);
      setUploadStats(prev => ({ ...prev, [type]: { error: 'An error occurred during upload', success: false } }));
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = (type: 'desktop' | 'mobile') => {
    if (window.confirm(language === 'bn' ? 'আপনি কি এই ইমেজটি মুছে ফেলতে নিশ্চিত?' : 'Are you sure you want to remove this image?')) {
      setFormData(prev => ({
        ...prev,
        [type === 'desktop' ? 'image_url_desktop' : 'image_url_mobile']: ''
      }));
      setUploadStats(prev => ({ ...prev, [type]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert(language === 'bn' ? 'ব্যানারের নাম প্রয়োজন' : 'Banner name is required');
      return;
    }
    if (formData.display_location === 'category_banner' && !formData.category_id) {
      alert(language === 'bn' ? 'ক্যাটাগরি সিলেক্ট করুন' : 'Please select a category');
      return;
    }
    if (!formData.image_url_desktop) {
      alert(language === 'bn' ? 'ডেক্সটপ ইমেজ প্রয়োজন' : 'Desktop image is required');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `/api/admin/banners/${formData.id}` : '/api/admin/banners';
      
      const response = await fetch(url, {
        method,
        headers: adminService.getHeaders(),
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => {
          onSave();
        }, 1500);
      } else {
        alert(data.error || 'Failed to save banner');
      }
    } catch (err) {
      console.error('Save error', err);
      alert('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(catSearch.toLowerCase()) || 
    c.name_bn.toLowerCase().includes(catSearch.toLowerCase())
  );

  const selectedCategory = categories.find(c => c.id === formData.category_id);

  return (
    <div className="animate-fade-in text-left pb-20">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-14 h-14 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl border border-gray-200 transition-all cursor-pointer active:scale-90"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              {formData.id 
                ? (language === 'bn' ? 'ব্যানার এডিট করুন' : 'Edit Banner') 
                : (language === 'bn' ? 'নতুন ব্যানার যোগ করুন' : 'Add New Banner')}
            </h1>
            <p className="text-gray-500 text-sm font-semibold">
              {language === 'bn' ? 'ব্যানারের তথ্য এবং ইমেজ আপডেট করুন।' : 'Update the banner information and assets below.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="px-6 py-3 text-gray-500 hover:text-rose-600 font-black text-xs uppercase tracking-widest cursor-pointer transition-colors"
          >
            {language === 'bn' ? 'বাতিল' : 'CANCEL'}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || saveSuccess}
            className={`flex items-center gap-2 px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-xl shadow-emerald-100 ${
              saveSuccess 
                ? 'bg-emerald-500 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isSaving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>
              {saveSuccess 
                ? (language === 'bn' ? 'সংরক্ষিত ✓' : 'SAVED ✓') 
                : isSaving 
                ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'SAVING...')
                : (language === 'bn' ? 'সংরক্ষণ করুন' : 'SAVE CHANGES')}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-7 space-y-16">
          {/* Section: Configuration */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                <Layout className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{language === 'bn' ? 'ব্যানার কনফিগারেশন' : 'Banner Configuration'}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'bn' ? 'ব্যানারের নাম' : 'Banner Name'}</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Summer Collection Hero"
                  className="w-full px-6 py-4 bg-gray-50 border-0 rounded-3xl text-sm font-semibold focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'bn' ? 'ব্যানারের ধরন' : 'Banner Location'}</label>
                <select 
                  value={formData.display_location}
                  onChange={(e) => setFormData({...formData, display_location: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border-0 rounded-3xl text-sm font-black uppercase tracking-wider focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all cursor-pointer appearance-none"
                >
                  <option value="homepage_hero">Homepage Hero</option>
                  <option value="category_banner">Category Banner</option>
                  <option value="homepage_promo">Promotional Banner (Homepage)</option>
                  <option value="auth_banner">Auth/Account Banner</option>
                </select>
              </div>
            </div>

            {formData.display_location === 'category_banner' && (
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'bn' ? 'ক্যাটাগরি' : 'Target Category'}</label>
                <div 
                  onClick={() => setShowCatDropdown(!showCatDropdown)}
                  className="w-full px-6 py-4 bg-gray-50 border-0 rounded-3xl text-sm font-semibold cursor-pointer flex items-center justify-between"
                >
                  <span className={selectedCategory ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedCategory 
                      ? (language === 'bn' ? selectedCategory.name_bn : selectedCategory.name) 
                      : (language === 'bn' ? 'ক্যাটাগরি সিলেক্ট করুন...' : 'Select a category...')}
                  </span>
                  <Layers className="w-5 h-5 text-gray-400" />
                </div>

                <AnimatePresence>
                  {showCatDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-50 left-0 right-0 mt-4 bg-white border border-gray-100 rounded-[32px] shadow-2xl overflow-hidden"
                    >
                      <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <input 
                          type="text" 
                          placeholder="Search categories..."
                          value={catSearch}
                          onChange={(e) => setCatSearch(e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-gray-150 rounded-xl text-xs font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-72 overflow-y-auto p-2">
                        {filteredCategories.map(cat => (
                          <div 
                            key={cat.id}
                            onClick={() => {
                              setFormData({...formData, category_id: cat.id});
                              setShowCatDropdown(false);
                            }}
                            className={`px-6 py-4 text-xs font-black uppercase tracking-wider cursor-pointer rounded-2xl transition-all flex items-center justify-between hover:bg-emerald-50 ${formData.category_id === cat.id ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600'}`}
                          >
                            <span>{language === 'bn' ? cat.name_bn : cat.name}</span>
                            {formData.category_id === cat.id && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-6 py-4 bg-gray-50 border-0 rounded-3xl text-sm font-black uppercase tracking-wider focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer appearance-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'bn' ? 'সর্ট অর্ডার' : 'Sort Order'}</label>
                <input 
                  type="number" 
                  value={formData.sort_order}
                  onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                  className="w-full px-6 py-4 bg-gray-50 border-0 rounded-3xl text-sm font-semibold focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section: Assets */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{language === 'bn' ? 'ব্যানার অ্যাসেটস' : 'Banner Assets'}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Desktop Image */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Desktop Banner</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{getRecommendedSize('desktop').ratio} RATIO</span>
                </div>
                
                <div className={`relative aspect-video rounded-[32px] border-2 border-dashed overflow-hidden group transition-all duration-500 ${formData.image_url_desktop ? 'border-emerald-200 bg-emerald-50/10' : 'border-gray-200 bg-gray-50'}`}>
                  {formData.image_url_desktop ? (
                    <>
                      <img src={formData.image_url_desktop} className="w-full h-full object-cover" alt="Desktop Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button onClick={() => desktopInputRef.current?.click()} className="p-3 bg-white text-emerald-600 rounded-2xl hover:scale-110 transition-transform cursor-pointer"><Upload className="w-5 h-5" /></button>
                        <button onClick={() => removeImage('desktop')} className="p-3 bg-white text-rose-600 rounded-2xl hover:scale-110 transition-transform cursor-pointer"><X className="w-5 h-5" /></button>
                      </div>
                    </>
                  ) : (
                    <div onClick={() => desktopInputRef.current?.click()} className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gray-100/50 transition-all">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-gray-300 shadow-sm border border-gray-100 mb-4 group-hover:scale-110 group-hover:text-emerald-500 transition-all">
                        <Upload className="w-8 h-8" />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload Desktop Image</span>
                    </div>
                  )}
                  <input type="file" ref={desktopInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'desktop')} accept="image/*" />
                  {isUploading.desktop && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center backdrop-blur-sm">
                      <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Uploading...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Image */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Mobile Banner</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{getRecommendedSize('mobile').ratio} RATIO</span>
                </div>
                
                <div className={`relative aspect-video rounded-[32px] border-2 border-dashed overflow-hidden group transition-all duration-500 ${formData.image_url_mobile ? 'border-emerald-200 bg-emerald-50/10' : 'border-gray-200 bg-gray-50'}`}>
                  {formData.image_url_mobile ? (
                    <>
                      <img src={formData.image_url_mobile} className="w-full h-full object-cover" alt="Mobile Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button onClick={() => mobileInputRef.current?.click()} className="p-3 bg-white text-emerald-600 rounded-2xl hover:scale-110 transition-transform cursor-pointer"><Upload className="w-5 h-5" /></button>
                        <button onClick={() => removeImage('mobile')} className="p-3 bg-white text-rose-600 rounded-2xl hover:scale-110 transition-transform cursor-pointer"><X className="w-5 h-5" /></button>
                      </div>
                    </>
                  ) : (
                    <div onClick={() => mobileInputRef.current?.click()} className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gray-100/50 transition-all">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-gray-300 shadow-sm border border-gray-100 mb-4 group-hover:scale-110 group-hover:text-emerald-500 transition-all">
                        <Upload className="w-8 h-8" />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload Mobile Image</span>
                    </div>
                  )}
                  <input type="file" ref={mobileInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'mobile')} accept="image/*" />
                  {isUploading.mobile && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center backdrop-blur-sm">
                      <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Uploading...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Content */}
          <div className="space-y-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                <Type className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{language === 'bn' ? 'টেক্সট কন্টেন্ট' : 'Text Content'}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* English Content */}
              <div className="space-y-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] font-black">EN</div>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-900">English Details</span>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Banner Heading</label>
                    <input 
                      type="text" 
                      value={formData.heading_en || ''} 
                      onChange={(e) => setFormData({...formData, heading_en: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Banner Description</label>
                    <textarea 
                      value={formData.description_en || ''} 
                      onChange={(e) => setFormData({...formData, description_en: e.target.value})}
                      rows={4}
                      className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Bengali Content */}
              <div className="space-y-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">BN</div>
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Bengali Details</span>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">ব্যানার হেডিং</label>
                    <input 
                      type="text" 
                      value={formData.heading_bn || ''} 
                      onChange={(e) => setFormData({...formData, heading_bn: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">ব্যানার বর্ণনা</label>
                    <textarea 
                      value={formData.description_bn || ''} 
                      onChange={(e) => setFormData({...formData, description_bn: e.target.value})}
                      rows={4}
                      className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Previews */}
        <div className="lg:col-span-5">
          <div className="sticky top-12 space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{language === 'bn' ? 'লাইভ প্রিভিউ' : 'Live Preview'}</h3>
              </div>
              <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                <button 
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${previewDevice === 'desktop' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button 
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${previewDevice === 'mobile' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            <div className={`relative bg-gray-900 rounded-[40px] overflow-hidden shadow-2xl transition-all duration-700 ${previewDevice === 'mobile' ? 'max-w-[320px] mx-auto' : 'w-full'}`}>
              <div className="aspect-[16/9] relative overflow-hidden group">
                <img 
                  src={(previewDevice === 'desktop' ? formData.image_url_desktop : formData.image_url_mobile) || 'https://placehold.co/1920x700?text=Waiting+for+Assets...'} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  alt="Live Preview"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-12 flex flex-col justify-end">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={formData.heading_en}
                    className="space-y-4"
                  >
                    <h2 className="text-4xl font-black text-white tracking-tight leading-tight">
                      {language === 'bn' ? (formData.heading_bn || 'ব্যানার হেডিং') : (formData.heading_en || 'Your Banner Heading')}
                    </h2>
                    <p className="text-white/80 text-lg font-medium line-clamp-2 max-w-lg">
                      {language === 'bn' ? (formData.description_bn || 'ব্যানার ডেসক্রিপশন এখানে দেখা যাবে।') : (formData.description_en || 'Your banner description will appear here as a live preview.')}
                    </p>
                    <div className="pt-4">
                      <div className="inline-flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-900/40">
                        {language === 'bn' ? (formData.button_text_bn || 'এখনই কিনুন') : (formData.button_text_en || 'Shop Now')}
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-150 space-y-6">
              <div className="flex items-center gap-3 text-emerald-600">
                <Info className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Editor Guidelines</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[10px] font-black text-gray-900 shadow-sm border border-gray-100 shrink-0">01</div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed pt-1.5">
                    Use high-resolution images for desktop banners (min 1920px wide).
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[10px] font-black text-gray-900 shadow-sm border border-gray-100 shrink-0">02</div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed pt-1.5">
                    Ensure mobile images are vertically oriented for better fit.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[10px] font-black text-gray-900 shadow-sm border border-gray-100 shrink-0">03</div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed pt-1.5">
                    Keep descriptions concise to maintain readability across devices.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBannerEditor;
