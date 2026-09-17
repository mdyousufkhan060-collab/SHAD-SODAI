import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../utils/adminService';
import { 
  Save, AlertCircle, CheckCircle2, Phone, Mail, MapPin,
  Facebook, Instagram, Youtube, Linkedin, Layout, Camera, Trash2, X,
  Plus, Edit2, ChevronDown, ChevronUp, Link as LinkIcon, ExternalLink, Smartphone, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FooterSettings {
  [key: string]: string;
}

interface FooterColumn {
  id: number;
  name_en: string;
  name_bn: string;
  sort_order: number;
}

interface FooterLink {
  id: number;
  column_id: number;
  name_en: string;
  name_bn: string;
  url: string;
  sort_order: number;
}

export const AdminFooterManagement = ({ language }: { language: 'en' | 'bn' }) => {
  const [settings, setSettings] = useState<FooterSettings>({});
  const [columns, setColumns] = useState<FooterColumn[]>([]);
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Column/Link Editor States
  const [editingColumn, setEditingColumn] = useState<Partial<FooterColumn> | null>(null);
  const [editingLink, setEditingLink] = useState<Partial<FooterLink> | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/footer/all', { 
        headers: adminService.getHeaders() 
      });
      if (!res.ok) throw new Error('Failed to fetch data');
      const d = await res.json();
      setSettings(d.settings || {});
      setColumns(d.columns || []);
      setLinks(d.links || []);
    } catch (err) {
      setErrorMessage('Failed to load footer management data.');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setStatus('saving');
    try {
      const res = await fetch('/api/admin/footer/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminService.getHeaders() },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Failed to save footer settings.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch('/api/admin/footer/upload-logo', {
        method: 'POST',
        headers: adminService.getHeaders(),
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setSettings({ ...settings, footer_logo_url: data.data.url });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading logo');
    } finally {
      setUploading(false);
    }
  };

  // Column CRUD
  const saveColumn = async () => {
    if (!editingColumn) return;
    try {
      const res = await fetch('/api/admin/footer/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminService.getHeaders() },
        body: JSON.stringify(editingColumn)
      });
      if (res.ok) {
        setEditingColumn(null);
        fetchData();
      }
    } catch (err) {
      alert('Failed to save column');
    }
  };

  const deleteColumn = async (id: number) => {
    if (!confirm('Are you sure? This will delete all links in this column.')) return;
    try {
      await fetch(`/api/admin/footer/columns/${id}`, { 
        method: 'DELETE',
        headers: adminService.getHeaders()
      });
      fetchData();
    } catch (err) {
      alert('Failed to delete column');
    }
  };

  // Link CRUD
  const saveLink = async () => {
    if (!editingLink) return;
    try {
      const res = await fetch('/api/admin/footer/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminService.getHeaders() },
        body: JSON.stringify(editingLink)
      });
      if (res.ok) {
        setEditingLink(null);
        fetchData();
      }
    } catch (err) {
      alert('Failed to save link');
    }
  };

  const deleteLink = async (id: number) => {
    if (!confirm('Delete this link?')) return;
    try {
      await fetch(`/api/admin/footer/links/${id}`, { 
        method: 'DELETE',
        headers: adminService.getHeaders()
      });
      fetchData();
    } catch (err) {
      alert('Failed to delete link');
    }
  };

  const tiktokIcon = (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.9-.39-2.81-.12-.62.18-1.16.55-1.55 1.05-.53.66-.73 1.52-.64 2.35.06.65.34 1.28.78 1.77.56.62 1.34 1.02 2.16 1.14 1.01.14 2.1-.11 2.91-.77.72-.56 1.15-1.44 1.24-2.35.12-2.58.05-5.17.06-7.76.01-4.03 0-8.05.01-12.08z"/>
    </svg>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-fade-in" id="admin-footer-management">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-100 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Advanced Footer Management</h1>
          <p className="text-slate-500 text-sm mt-1">Configure SHAD GHOR's global footer branding, links, and integrations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveSettings}
            disabled={status === 'saving'}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 active:scale-95"
          >
            {status === 'saving' ? 'Saving...' : <><Save size={18}/> Save All Changes</>}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {status === 'saved' && (
          <motion.div initial={{ opacity: 0, y: -20 }} exit={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 border border-emerald-100 mx-auto max-w-2xl shadow-sm">
            <CheckCircle2 size={20} />
            <p className="font-bold text-sm">✓ Footer configuration synchronized with live website!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Section: Identity & Contact */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Layout size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-700">Brand Identity</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Logo Area */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Logo</label>
                <div className="relative group aspect-video bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all hover:border-emerald-400 group">
                  {settings.footer_logo_url ? (
                    <div className="relative w-full h-full p-6 flex items-center justify-center">
                      <img src={settings.footer_logo_url} alt="Logo" className="max-w-full max-h-full object-contain drop-shadow-md" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white rounded-lg text-emerald-600 hover:scale-110 transition-all"><Camera size={18}/></button>
                        <button onClick={() => setSettings({...settings, footer_logo_url: ''})} className="p-2 bg-white rounded-lg text-red-600 hover:scale-110 transition-all"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 text-slate-400">
                      <Camera size={32} strokeWidth={1} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Upload Logo</span>
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </div>
              </div>

              {/* Tagline EN/BN */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tagline (English)</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-bold"
                    value={settings.footer_tagline_en || ''}
                    onChange={e => setSettings({...settings, footer_tagline_en: e.target.value})}
                    placeholder="Your Trusted Online Grocery Store"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tagline (Bangla)</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-bold font-bengali"
                    value={settings.footer_tagline_bn || ''}
                    onChange={e => setSettings({...settings, footer_tagline_bn: e.target.value})}
                    placeholder="আপনার বিশ্বস্ত অনলাইন গ্রোসারি শপ"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Apps & Payments */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Smartphone size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-700">App & Payment</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Play Store URL</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs font-mono"
                    value={settings.footer_play_store_url || ''}
                    onChange={e => setSettings({...settings, footer_play_store_url: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">App Store URL</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs font-mono"
                    value={settings.footer_app_store_url || ''}
                    onChange={e => setSettings({...settings, footer_app_store_url: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Center/Right Section: Details & Navigation Links */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Detailed Info Editor */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Edit2 size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-700">Detailed Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description (EN)</label>
                    <textarea 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm min-h-[100px]"
                      value={settings.footer_description_en || ''}
                      onChange={e => setSettings({...settings, footer_description_en: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description (BN)</label>
                    <textarea 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-bengali min-h-[100px]"
                      value={settings.footer_description_bn || ''}
                      onChange={e => setSettings({...settings, footer_description_bn: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Contact Phone</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={settings.footer_contact_phone || ''} onChange={e => setSettings({...settings, footer_contact_phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Contact Email</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={settings.footer_contact_email || ''} onChange={e => setSettings({...settings, footer_contact_email: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Address (EN)</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={settings.footer_contact_address_en || ''} onChange={e => setSettings({...settings, footer_contact_address_en: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Address (BN)</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold font-bengali" value={settings.footer_contact_address_bn || ''} onChange={e => setSettings({...settings, footer_contact_address_bn: e.target.value})} />
                </div>
              </div>
            </div>
          </section>

          {/* Social Presence Hub */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Facebook size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-700">Social Media Connections</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'footer_social_facebook', icon: Facebook, label: 'Facebook' },
                { key: 'footer_social_youtube', icon: Youtube, label: 'YouTube' },
                { key: 'footer_social_instagram', icon: Instagram, label: 'Instagram' },
                { key: 'footer_social_tiktok', icon: null, label: 'TikTok' },
                { key: 'footer_social_linkedin', icon: Linkedin, label: 'LinkedIn' }
              ].map(social => (
                <div key={social.key} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400 shrink-0">
                    {social.icon ? <social.icon size={18}/> : tiktokIcon}
                  </div>
                  <input 
                    className="flex-1 bg-transparent border-none text-xs font-bold focus:ring-0 placeholder:text-slate-300"
                    placeholder={`${social.label} Link`}
                    value={settings[social.key] || ''}
                    onChange={e => setSettings({...settings, [social.key]: e.target.value})}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Business / Office Location */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <MapPin size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-700">Office / Business Location</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Address Line 1</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                    value={settings.store_address || ''}
                    onChange={e => setSettings({...settings, store_address: e.target.value})}
                    placeholder="e.g. Rampura"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Address Line 2 (Optional)</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                    value={settings.store_address_line2 || ''}
                    onChange={e => setSettings({...settings, store_address_line2: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Area</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={settings.store_area || ''} onChange={e => setSettings({...settings, store_area: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">City</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={settings.store_city || ''} onChange={e => setSettings({...settings, store_city: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">District</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={settings.store_district || ''} onChange={e => setSettings({...settings, store_district: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Post Code</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={settings.store_post_code || ''} onChange={e => setSettings({...settings, store_post_code: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Country</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={settings.store_country || ''} onChange={e => setSettings({...settings, store_country: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Google Maps URL</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono" value={settings.maps_url || ''} onChange={e => setSettings({...settings, maps_url: e.target.value})} />
                </div>
              </div>
            </div>
          </section>

          {/* Navigation Links Architecture */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon size={18} className="text-slate-400" />
                <h2 className="font-bold text-slate-700">Footer Navigation Architecture</h2>
              </div>
              <button 
                onClick={() => setEditingColumn({ name_en: '', name_bn: '', sort_order: 0 })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95"
              >
                <Plus size={14}/> Add Column
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {columns.map(col => (
                <div key={col.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-100/50 px-5 py-4 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Column Name</span>
                        <span className="font-bold text-slate-800">{col.name_en} / <span className="font-bengali text-sm">{col.name_bn}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingColumn(col)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Edit2 size={16}/></button>
                      <button onClick={() => deleteColumn(col.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                      <button 
                        onClick={() => setEditingLink({ column_id: col.id, name_en: '', name_bn: '', url: '', sort_order: 0 })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all ml-2"
                      >
                        <Plus size={12}/> Add Link
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {links.filter(l => l.column_id === col.id).map(link => (
                        <div key={link.id} className="group flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/60 hover:border-emerald-200 hover:shadow-md transition-all">
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate">{link.name_en}</span>
                            <span className="text-[10px] text-slate-400 font-mono truncate">{link.url}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingLink(link)} className="p-1.5 text-slate-400 hover:text-emerald-600"><Edit2 size={14}/></button>
                            <button onClick={() => deleteLink(link.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Column Modal */}
      <AnimatePresence>
        {editingColumn && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">{editingColumn.id ? 'Edit Column' : 'New Column'}</h3>
                <button onClick={() => setEditingColumn(null)}><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Column Name (English)" value={editingColumn.name_en} onChange={e => setEditingColumn({...editingColumn, name_en: e.target.value})} />
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold font-bengali" placeholder="নাম (বাংলা)" value={editingColumn.name_bn} onChange={e => setEditingColumn({...editingColumn, name_bn: e.target.value})} />
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" type="number" placeholder="Sort Order" value={editingColumn.sort_order} onChange={e => setEditingColumn({...editingColumn, sort_order: parseInt(e.target.value)})} />
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setEditingColumn(null)} className="flex-1 py-3 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={saveColumn} className="flex-1 py-3 font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">Save Column</button>
              </div>
            </motion.div>
          </div>
        )}

        {editingLink && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">{editingLink.id ? 'Edit Link' : 'New Link'}</h3>
                <button onClick={() => setEditingLink(null)}><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Link Text (English)" value={editingLink.name_en} onChange={e => setEditingLink({...editingLink, name_en: e.target.value})} />
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold font-bengali" placeholder="নাম (বাংলা)" value={editingLink.name_bn} onChange={e => setEditingLink({...editingLink, name_bn: e.target.value})} />
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="URL (e.g. #/about)" value={editingLink.url} onChange={e => setEditingLink({...editingLink, url: e.target.value})} />
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" type="number" placeholder="Sort Order" value={editingLink.sort_order} onChange={e => setEditingLink({...editingLink, sort_order: parseInt(e.target.value)})} />
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setEditingLink(null)} className="flex-1 py-3 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={saveLink} className="flex-1 py-3 font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">Save Link</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={handleSaveSettings}
          disabled={status === 'saving'}
          className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold transition-all shadow-2xl shadow-emerald-600/40 disabled:opacity-50 active:scale-95"
        >
          {status === 'saving' ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
          ) : (
            <><Save size={20}/> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
};
