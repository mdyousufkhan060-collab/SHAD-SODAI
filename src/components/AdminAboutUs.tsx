import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2, Layout, FileText, Target, Award, Settings } from 'lucide-react';

export const AdminAboutUs = () => {
  const [settings, setSettings] = useState<any>({});
  const [sections, setSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchAboutUs();
  }, []);

  const fetchAboutUs = async () => {
    try {
      const res = await fetch('/api/admin/about');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {}));
        setSections(data.sections);
      }
    } catch (err) {
      console.error('Fetch About Us error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/about/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) setMessage({ type: 'success', text: 'Saved successfully!' });
      else setMessage({ type: 'error', text: 'Failed to save.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-6 animate-pulse bg-white rounded-xl">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-fade-in" id="admin-about-us-module">
      <h1 className="text-2xl font-black text-gray-900 mb-6">About Us Manager</h1>
      
      {message && (
        <div className={`mb-4 p-4 rounded-xl font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Settings className="w-5 h-5" /> Page Configuration</h2>
          {['title_en', 'title_bn'].map(key => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">{key.replace('_', ' ')}</label>
              <input value={settings[key] || ''} onChange={(e) => setSettings({...settings, [key]: e.target.value})} onBlur={(e) => saveSetting(key, e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          ))}
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileText className="w-5 h-5" /> Sections</h2>
          {sections.map(section => (
            <div key={section.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold">{section.title_en}</p>
                <p className="text-xs text-gray-500 capitalize">{section.section_type}</p>
              </div>
              <button className="text-emerald-600 font-bold text-xs">Edit</button>
            </div>
          ))}
          <button className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Section
          </button>
        </div>
      </div>
    </div>
  );
};
