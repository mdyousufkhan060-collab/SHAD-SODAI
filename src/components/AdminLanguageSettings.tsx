import React, { useState, useEffect } from 'react';
import { Globe, Save, RotateCcw, Search, Plus, Edit2, Trash2, AlertTriangle, CheckCircle2, XCircle, ChevronDown, Filter } from 'lucide-react';
import { adminService } from '../utils/adminService';

interface LanguageConfig {
  default_language: string;
  language_en_enabled: string;
  language_bn_enabled: string;
  customer_language_switcher_enabled: string;
  admin_panel_language: string;
}

interface Translation {
  id?: number;
  translation_key: string;
  category: string;
  en: string;
  bn: string;
}

interface AdminLanguageSettingsProps {
  language: 'en' | 'bn';
}

export const AdminLanguageSettings: React.FC<AdminLanguageSettingsProps> = ({ language }) => {
  const [config, setConfig] = useState<LanguageConfig>({
    default_language: 'bn',
    language_en_enabled: 'true',
    language_bn_enabled: 'true',
    customer_language_switcher_enabled: 'true',
    admin_panel_language: 'bn'
  });
  const [originalConfig, setOriginalConfig] = useState<LanguageConfig | null>(null);
  
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const categories = [
    'Header', 'Navigation', 'Products', 'Cart', 'Checkout', 'Orders', 
    'Customer Account', 'Footer', 'Contact', 'Support', 'System Messages', 
    'Errors', 'Success Messages'
  ];

  useEffect(() => {
    fetchConfig();
    fetchTranslations();
  }, []);

  useEffect(() => {
    if (originalConfig) {
      const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setIsDirty(hasChanges);
    }
  }, [config, originalConfig]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/languages/config', {
        headers: adminService.getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setOriginalConfig(data);
      }
    } catch (err) {
      console.error('Failed to fetch language config:', err);
    }
  };

  const fetchTranslations = async () => {
    try {
      let url = '/api/admin/languages/translations';
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: adminService.getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTranslations(data);
      }
    } catch (err) {
      console.error('Failed to fetch translations:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTranslations();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const handleConfigChange = (key: keyof LanguageConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/languages/config', {
        method: 'POST',
        headers: adminService.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(config)
      });

      if (res.ok) {
        setOriginalConfig(config);
        setIsDirty(false);
        setStatus({ 
          type: 'success', 
          message: language === 'bn' ? 'ভাষা কনফিগারেশন সংরক্ষিত হয়েছে ✓' : 'Language configuration saved ✓' 
        });
        setTimeout(() => setStatus(null), 3000);
        
        // If admin panel language changed, reload to apply
        if (config.admin_panel_language !== originalConfig?.admin_panel_language) {
          window.location.reload();
        }
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: language === 'bn' ? 'সেভ ব্যর্থ হয়েছে ✕' : 'SAVE FAILED ✕' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetConfig = () => {
    if (originalConfig) {
      setConfig(originalConfig);
      setIsDirty(false);
    }
  };

  const handleSaveTranslation = async (trans: Translation) => {
    try {
      const res = await fetch('/api/admin/languages/translations', {
        method: 'POST',
        headers: adminService.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(trans)
      });
      if (res.ok) {
        setEditingTranslation(null);
        setIsAddingNew(false);
        fetchTranslations();
        setStatus({ 
          type: 'success', 
          message: language === 'bn' ? 'অনুবাদ সংরক্ষিত হয়েছে ✓' : 'Translation saved ✓' 
        });
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save translation:', err);
    }
  };

  const handleDeleteTranslation = async (id: number) => {
    if (!window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই অনুবাদটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this translation?')) return;
    try {
      const res = await fetch(`/api/admin/languages/translations/${id}`, {
        method: 'DELETE',
        headers: adminService.getHeaders()
      });
      if (res.ok) {
        fetchTranslations();
      }
    } catch (err) {
      console.error('Failed to delete translation:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in text-left pb-20" id="admin-language-settings">
      
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-800 leading-tight">
              {language === 'bn' ? 'ভাষা সেটিংস' : 'Language Settings'}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {language === 'bn' ? 'কাস্টমার এবং অ্যাডমিন প্যানেলের ভাষা ব্যবস্থাপনা' : 'Manage translations and panel languages'}
            </p>
          </div>
        </div>
        
        {isDirty && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full animate-pulse">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span className="text-[9px] font-black text-amber-700 uppercase">Unsaved Changes</span>
          </div>
        )}
      </div>

      {status && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-xs font-bold">{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Language Config */}
        <div className="space-y-6">
          
          {/* Default Language */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              {language === 'bn' ? 'ডিফল্ট ভাষা' : 'Default Language'}
            </h3>
            
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-gray-500">{language === 'bn' ? 'ওয়েবসাইটের ডিফল্ট ভাষা' : 'Default Website Language'}</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleConfigChange('default_language', 'bn')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${config.default_language === 'bn' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-gray-50 border-gray-150 text-gray-600 hover:bg-white'}`}
                >
                  বাংলা (BN)
                </button>
                <button 
                  onClick={() => handleConfigChange('default_language', 'en')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${config.default_language === 'en' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-gray-50 border-gray-150 text-gray-600 hover:bg-white'}`}
                >
                  English (EN)
                </button>
              </div>
            </div>
          </div>

          {/* Customer Panel Settings */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              {language === 'bn' ? 'কাস্টমার প্যানেল' : 'Customer Panel'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">{language === 'bn' ? 'বাংলা ভাষা সক্রিয়' : 'Bengali (BN)'}</span>
                <button 
                  onClick={() => handleConfigChange('language_bn_enabled', config.language_bn_enabled === 'true' ? 'false' : 'true')}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${config.language_bn_enabled === 'true' ? 'bg-emerald-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.language_bn_enabled === 'true' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">{language === 'bn' ? 'ইংরেজি ভাষা সক্রিয়' : 'English (EN)'}</span>
                <button 
                  onClick={() => handleConfigChange('language_en_enabled', config.language_en_enabled === 'true' ? 'false' : 'true')}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${config.language_en_enabled === 'true' ? 'bg-emerald-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.language_en_enabled === 'true' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-700">{language === 'bn' ? 'ভাষা সুইচার প্রদর্শন' : 'Language Switcher'}</span>
                  <p className="text-[10px] text-gray-400 font-medium">{language === 'bn' ? 'গ্রাহকদের জন্য ভাষা পরিবর্তন বোতাম' : 'Show switcher to customers'}</p>
                </div>
                <button 
                  onClick={() => handleConfigChange('customer_language_switcher_enabled', config.customer_language_switcher_enabled === 'true' ? 'false' : 'true')}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${config.customer_language_switcher_enabled === 'true' ? 'bg-emerald-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.customer_language_switcher_enabled === 'true' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Admin Panel Settings */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              {language === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}
            </h3>
            
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-gray-500">{language === 'bn' ? 'অ্যাডমিন প্যানেল ভাষা' : 'Admin Panel Language'}</label>
              <select 
                value={config.admin_panel_language}
                onChange={(e) => handleConfigChange('admin_panel_language', e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
              >
                <option value="bn">বাংলা (Bengali)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Save/Reset Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSaveConfig}
              disabled={isSaving || !isDirty}
              className="flex-1 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-sm shadow-emerald-200"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? '...' : (language === 'bn' ? 'সেভ করুন' : 'Save Changes')}</span>
            </button>
            <button 
              onClick={handleResetConfig}
              disabled={!isDirty}
              className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Translation Manager */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                {language === 'bn' ? 'অনুবাদ ব্যবস্থাপনা' : 'Translation Management'}
              </h3>
              
              <button 
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingTranslation({ translation_key: '', category: 'Header', en: '', bn: '' });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                {language === 'bn' ? 'নতুন অনুবাদ' : 'Add New Translation'}
              </button>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={language === 'bn' ? 'কীওয়ার্ড দিয়ে খুঁজুন...' : 'Search translations...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-500 transition-all outline-hidden"
                />
              </div>
              <div className="relative w-full md:w-48">
                <Filter className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-[11px] font-bold appearance-none outline-hidden focus:border-emerald-500 transition-all"
                >
                  <option value="all">{language === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Translation List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {translations.length === 0 ? (
                <div className="p-10 text-center space-y-2 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Globe className="w-8 h-8 text-gray-200 mx-auto" />
                  <p className="text-xs font-bold text-gray-400">
                    {language === 'bn' ? 'কোনো অনুবাদ পাওয়া যায়নি।' : 'No translations found.'}
                  </p>
                </div>
              ) : (
                translations.map((trans) => (
                  <div 
                    key={trans.id} 
                    className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-emerald-200 hover:shadow-xs transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                          {trans.category}
                        </span>
                        <code className="text-[10px] font-mono font-bold text-gray-400">{trans.translation_key}</code>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingTranslation(trans)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => trans.id && handleDeleteTranslation(trans.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black text-gray-400 uppercase">English</label>
                          {!trans.en && (
                            <span className="text-[8px] font-black text-red-500 uppercase flex items-center gap-0.5">
                              <AlertTriangle className="w-2 h-2" />
                              Missing
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] font-bold ${trans.en ? 'text-gray-700' : 'text-gray-300 italic'}`}>
                          {trans.en || 'No English translation...'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Bengali (বাংলা)</label>
                          {!trans.bn && (
                            <span className="text-[8px] font-black text-red-500 uppercase flex items-center gap-0.5">
                              <AlertTriangle className="w-2 h-2" />
                              Missing
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] font-bold ${trans.bn ? 'text-gray-700' : 'text-gray-300 italic'}`}>
                          {trans.bn || 'বাংলা অনুবাদ নেই...'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Add Modal Overlay */}
      {editingTranslation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-150 overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                {isAddingNew ? (language === 'bn' ? 'নতুন অনুবাদ যোগ করুন' : 'Add New Translation') : (language === 'bn' ? 'অনুবাদ এডিট করুন' : 'Edit Translation')}
              </h3>
              <button 
                onClick={() => {
                  setEditingTranslation(null);
                  setIsAddingNew(false);
                }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Translation Key</label>
                <input 
                  type="text" 
                  value={editingTranslation.translation_key}
                  readOnly={!isAddingNew}
                  onChange={(e) => setEditingTranslation({ ...editingTranslation, translation_key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className={`w-full p-2.5 border rounded-xl text-xs font-mono font-bold outline-hidden ${isAddingNew ? 'bg-white border-gray-150 focus:border-emerald-500' : 'bg-gray-100 border-gray-100 text-gray-400'}`}
                  placeholder="e.g. welcome_message"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Category</label>
                <select 
                  value={editingTranslation.category}
                  onChange={(e) => setEditingTranslation({ ...editingTranslation, category: e.target.value })}
                  className="w-full p-2.5 bg-white border border-gray-150 rounded-xl text-xs font-bold outline-hidden focus:border-emerald-500"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">English Text</label>
                <textarea 
                  rows={2}
                  value={editingTranslation.en}
                  onChange={(e) => setEditingTranslation({ ...editingTranslation, en: e.target.value })}
                  className="w-full p-2.5 bg-white border border-gray-150 rounded-xl text-xs font-bold outline-hidden focus:border-emerald-500 resize-none"
                  placeholder="Enter English text..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Bengali Text (বাংলা)</label>
                <textarea 
                  rows={2}
                  value={editingTranslation.bn}
                  onChange={(e) => setEditingTranslation({ ...editingTranslation, bn: e.target.value })}
                  className="w-full p-2.5 bg-white border border-gray-150 rounded-xl text-xs font-bold outline-hidden focus:border-emerald-500 resize-none"
                  placeholder="বাংলা টেক্সট লিখুন..."
                />
              </div>
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => {
                  setEditingTranslation(null);
                  setIsAddingNew(false);
                }}
                className="px-5 py-2 text-[10px] font-black text-gray-500 hover:text-gray-700 uppercase"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button 
                onClick={() => handleSaveTranslation(editingTranslation)}
                disabled={!editingTranslation.translation_key || !editingTranslation.category}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black shadow-sm shadow-emerald-200 disabled:opacity-50 uppercase"
              >
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Translation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
