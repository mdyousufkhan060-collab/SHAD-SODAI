import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Image as ImageIcon, 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  MoveUp, 
  MoveDown, 
  Eye, 
  EyeOff, 
  ChevronRight,
  GripVertical,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Monitor,
  Smartphone,
  Calendar
} from 'lucide-react';
import { adminService } from '../utils/adminService';
import { HomepageSection, DBBanner } from '../types';

interface AdminHomepageCMSProps {
  language: 'en' | 'bn';
}

export const AdminHomepageCMS: React.FC<AdminHomepageCMSProps> = ({ language }) => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [editingConfigSection, setEditingConfigSection] = useState<HomepageSection | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const sectionsRes = await fetch('/api/admin/homepage/sections', { headers: adminService.getHeaders() });

      if (sectionsRes.ok) setSections(await sectionsRes.json());
    } catch (err) {
      console.error('Fetch data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSection = async (section: HomepageSection) => {
    try {
      const updated = { ...section, enabled: !section.enabled };
      const res = await fetch(`/api/admin/homepage/sections/${section.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminService.getHeaders() },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setSections(prev => prev.map(s => s.id === section.id ? updated : s));
      }
    } catch (err) {
      console.error('Toggle section error:', err);
    }
  };

  const handleUpdateConfig = async (sectionId: string, config: any) => {
    setIsSaving(true);
    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      const updated = { ...section, config };
      const res = await fetch(`/api/admin/homepage/sections/${sectionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminService.getHeaders() },
        body: JSON.stringify(updated)
      });

      if (res.ok) {
        setSections(prev => prev.map(s => s.id === sectionId ? updated : s));
        setEditingConfigSection(null);
      }
    } catch (err) {
      console.error('Update config error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Update sort_order locally
    newSections.forEach((s, i) => s.sort_order = i + 1);
    setSections(newSections);

    // Save orders to server
    try {
      await Promise.all(newSections.map(s => 
        fetch(`/api/admin/homepage/sections/${s.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...adminService.getHeaders() },
          body: JSON.stringify(s)
        })
      ));
    } catch (err) {
      console.error('Move section error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          {language === 'bn' ? 'হোমপেজ ডাটা লোড হচ্ছে...' : 'Loading Homepage Data...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 text-left" id="admin-homepage-cms">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <Layout className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">
              {language === 'bn' ? 'হোমপেজ সিএমএস' : 'Homepage CMS'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {language === 'bn' ? 'কাস্টমার প্যানেল হোমপেজ কন্ট্রোল' : 'Customer Panel Homepage Control'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 animate-fade-in">
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 font-semibold leading-relaxed">
              {language === 'bn' 
                ? 'এখানে আপনি হোমপেজের সেকশনগুলোর অর্ডার পরিবর্তন করতে পারবেন এবং কোনো নির্দিষ্ট সেকশন চালু বা বন্ধ করতে পারবেন।'
                : 'Here you can manage the sequence of homepage sections and toggle visibility for specific modules.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider w-12">#</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{language === 'bn' ? 'সেকশন নাম' : 'Section Name'}</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="px-5 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">{language === 'bn' ? 'অর্ডার' : 'Order'}</th>
                    <th className="px-5 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-wider">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sections.map((section, index) => (
                    <tr key={section.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <GripVertical className="w-4 h-4 text-gray-300" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-800">{language === 'bn' ? section.title_bn : section.title_en}</span>
                          <span className="text-[9px] font-mono text-gray-400 uppercase mt-0.5">{section.section_key}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleSection(section)}
                          className={`flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                            section.enabled 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                          }`}
                        >
                          {section.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {section.enabled 
                            ? (language === 'bn' ? 'সক্রিয়' : 'ENABLED') 
                            : (language === 'bn' ? 'বন্ধ' : 'DISABLED')}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleMoveSection(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-gray-700">{section.sort_order}</span>
                          <button
                            onClick={() => handleMoveSection(index, 'down')}
                            disabled={index === sections.length - 1}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button 
                          onClick={() => setEditingConfigSection(section)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* Config Modal */}
      {editingConfigSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-gray-800">
                  {editingConfigSection.title_en} {language === 'bn' ? 'কনফিগারেশন' : 'Configuration'}
                </h3>
              </div>
              <button onClick={() => setEditingConfigSection(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {editingConfigSection.section_key === 'category_banner' || editingConfigSection.section_key === 'hero_slider' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {language === 'bn' ? 'অটো-স্লাইড ইন্টারভ্যাল (সেকেন্ড)' : 'Auto-Slide Interval (Seconds)'}
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="0.5"
                      defaultValue={editingConfigSection.config?.interval || 3}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const display = document.getElementById('interval-display');
                        if (display) display.innerText = `${val}s`;
                      }}
                      className="flex-1 accent-emerald-600"
                      id="interval-range"
                    />
                    <span id="interval-display" className="w-12 text-center font-black text-emerald-600 bg-emerald-50 py-1 rounded-lg border border-emerald-100">
                      {editingConfigSection.config?.interval || 3}s
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium italic">
                    {language === 'bn' ? 'ব্যানার কত সময় পর পর স্লাইড হবে তা সেট করুন (১-৫ সেকেন্ড)।' : 'Set how fast banners should slide automatically (1-5 seconds).'}
                  </p>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    {language === 'bn' ? 'কোনো কনফিগারেশন নেই' : 'No Configuration Available'}
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setEditingConfigSection(null)}
                className="px-5 py-2 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button 
                disabled={isSaving}
                onClick={() => {
                  const range = document.getElementById('interval-range') as HTMLInputElement;
                  if (range) {
                    handleUpdateConfig(editingConfigSection.id, { 
                      ...editingConfigSection.config, 
                      interval: parseFloat(range.value) 
                    });
                  }
                }}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{language === 'bn' ? 'সেভ করুন' : 'Save Config'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
