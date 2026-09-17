import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Camera, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Building2,
  Upload,
  RefreshCw
} from 'lucide-react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';

export const AdminProfile: React.FC = () => {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/site-settings', {
        headers: adminService.getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus('idle');
    setError(null);

    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: {
          ...adminService.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_name: settings.store_name || '',
          company_name: settings.store_name || '', // Keep in sync
          company_logo: settings.company_logo || settings.footer_logo_url || ''
        })
      });

      if (res.ok) {
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        setError('Failed to save profile settings');
      }
    } catch (err) {
      setStatus('error');
      setError('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch('/api/admin/profile/upload-logo', {
        method: 'POST',
        headers: adminService.getHeaders(),
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ 
          ...prev, 
          company_logo: data.logoUrl,
          footer_logo_url: data.logoUrl 
        }));
      } else {
        setError('Failed to upload logo');
      }
    } catch (err) {
      setError('An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          {language === 'bn' ? 'লোড হচ্ছে...' : 'LOADING PROFILE...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
        <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2.5">
          <Building2 className="w-6 h-6 text-emerald-600" />
          {language === 'bn' ? 'কোম্পানি প্রোফাইল' : 'My Profile / Company Profile'}
        </h1>
        <p className="text-xs text-gray-500 font-semibold mt-1">
          {language === 'bn' ? 'আপনার কোম্পানির লোগো এবং নাম ব্যবস্থাপনা করুন' : 'Manage your company logo, name, and branding assets'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Logo Section */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col items-center text-center space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-full text-left">
              Company Logo
            </h3>
            
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden p-2 group-hover:border-emerald-500 transition-colors">
                {(settings.company_logo || settings.footer_logo_url) ? (
                  <img 
                    src={settings.company_logo || settings.footer_logo_url} 
                    alt="Logo Preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-gray-300" />
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 p-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-all active:scale-90 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleLogoUpload}
            />
            
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-700">Update Logo</p>
              <p className="text-[9px] text-gray-400 font-semibold px-4">
                Recommended: Square or horizontal logo with transparent background.
              </p>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest pt-2 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Replace Logo
            </button>
          </div>
        </div>

        {/* Details Section */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden h-full">
            <div className="p-6 space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                General Information
              </h3>

              {status === 'saved' && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-[11px] font-bold text-emerald-700">
                    Profile updated successfully!
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-[11px] font-bold text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">
                    Company Name / Store Name *
                  </label>
                  <input 
                    type="text"
                    required
                    value={settings.store_name || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
                    placeholder="e.g. SHAD GHOR"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <p className="text-[9px] text-gray-400 font-semibold pl-1">
                    This name will appear in the Header, Footer, and Emails.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    Branding Preview
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center p-1.5 shadow-xs overflow-hidden">
                      {(settings.company_logo || settings.footer_logo_url) ? (
                        <img src={settings.company_logo || settings.footer_logo_url} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Building2 className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-emerald-950 uppercase tracking-tighter">
                        {settings.store_name || 'SHAD GHOR'}
                      </h5>
                      <p className="text-[10px] text-gray-500 font-bold">Preview of Header/Footer Logo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end">
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm shadow-emerald-200 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
