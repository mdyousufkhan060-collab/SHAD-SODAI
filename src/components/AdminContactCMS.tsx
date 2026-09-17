import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Settings, Upload } from 'lucide-react';

export const AdminContactCMS = () => {
  const [settings, setSettings] = useState({
    id: 1,
    title_en: '',
    title_bn: '',
    description_en: '',
    description_bn: '',
    banner_url: '',
    is_published: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetch('/api/admin/contact-settings')
      .then(res => res.json())
      .then(data => {
        if (data) setSettings(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Fetch Contact Settings error:', err);
        setIsLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/contact-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Contact page updated successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update contact page.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-6 animate-pulse bg-white rounded-xl">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-fade-in" id="admin-contact-cms">
      <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2"><Settings className="w-6 h-6" /> Contact Page CMS</h1>
      
      {message && (
        <div className={`mb-4 p-4 rounded-xl font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase">Page Title (EN)</label>
            <input value={settings.title_en} onChange={(e) => setSettings({...settings, title_en: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase">Page Title (BN)</label>
            <input value={settings.title_bn} onChange={(e) => setSettings({...settings, title_bn: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-gray-700 uppercase">Short Description (EN)</label>
            <textarea rows={4} value={settings.description_en} onChange={(e) => setSettings({...settings, description_en: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-gray-700 uppercase">Short Description (BN)</label>
            <textarea rows={4} value={settings.description_bn} onChange={(e) => setSettings({...settings, description_bn: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-gray-700 uppercase">Banner Image URL</label>
            <input value={settings.banner_url} onChange={(e) => setSettings({...settings, banner_url: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <input type="checkbox" checked={settings.is_published === 1} onChange={(e) => setSettings({...settings, is_published: e.target.checked ? 1 : 0})} className="w-5 h-5 accent-emerald-600" />
            <label className="text-sm font-bold text-gray-700 uppercase">Published</label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
        </button>
      </form>
    </div>
  );
};
