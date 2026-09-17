import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  Trash2, 
  Eye, 
  Save, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  ImageIcon,
  Layout
} from 'lucide-react';
import { adminService } from '../utils/adminService';

interface PaymentMethod {
  id: number;
  payment_key: string;
  payment_name: string;
  logo_url: string | null;
  display_order: number;
  is_enabled: boolean;
}

interface AdminPlatonProps {
  language: 'en' | 'bn';
}

export const AdminPlaton: React.FC<AdminPlatonProps> = ({ language }) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMethod, setNewMethod] = useState({
    payment_name: '',
    is_enabled: true,
    display_order: 0,
    logo_file: null as File | null
  });

  const fetchMethods = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/platon', {
        headers: adminService.getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setMethods(data.data);
      } else {
        throw new Error(data.error || 'Failed to load payment methods');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleToggleEnable = (id: number) => {
    setMethods(prev => prev.map(m => 
      m.id === id ? { ...m, is_enabled: !m.is_enabled } : m
    ));
  };

  const handleNameChange = (id: number, name: string) => {
    setMethods(prev => prev.map(m => 
      m.id === id ? { ...m, payment_name: name } : m
    ));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === methods.length - 1) return;

    const newMethods = [...methods];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newMethods[index], newMethods[targetIndex]] = [newMethods[targetIndex], newMethods[index]];
    
    const updated = newMethods.map((m, i) => ({ ...m, display_order: i + 1 }));
    setMethods(updated);
  };

  const handleFileUpload = async (id: number, file: File) => {
    setUploadingId(id);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const res = await fetch(`/api/admin/platon/upload?id=${id}`, {
        method: 'POST',
        headers: adminService.getHeaders(),
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setMethods(prev => prev.map(m => 
          m.id === id ? { ...m, logo_url: data.data.url } : m
        ));
        setSuccess('Logo uploaded successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteLogo = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this logo?')) return;
    
    setError(null);
    try {
      const res = await fetch(`/api/admin/platon/logo/${id}`, {
        method: 'DELETE',
        headers: adminService.getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setMethods(prev => prev.map(m => 
          m.id === id ? { ...m, logo_url: null } : m
        ));
        setSuccess('Logo removed successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.error || 'Failed to delete logo');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteMethod = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this payment method completely?')) return;
    
    setError(null);
    try {
      const res = await fetch(`/api/admin/platon/${id}`, {
        method: 'DELETE',
        headers: adminService.getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setMethods(prev => prev.filter(m => m.id !== id));
        setSuccess('Payment method removed successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.error || 'Failed to delete method');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setError(null);
    try {
      for (const method of methods) {
        const res = await fetch(`/api/admin/platon/${method.id}`, {
          method: 'PUT',
          headers: adminService.getHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            is_enabled: method.is_enabled,
            display_order: method.display_order,
            payment_name: method.payment_name
          })
        });
        if (!res.ok) throw new Error(`Failed to save ${method.payment_name}`);
      }
      
      setSuccess('All changes saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethod.payment_name) return;

    setIsSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('payment_name', newMethod.payment_name);
      formData.append('is_enabled', String(newMethod.is_enabled));
      formData.append('display_order', String(newMethod.display_order || methods.length + 1));
      if (newMethod.logo_file) {
        formData.append('logo', newMethod.logo_file);
      }

      const res = await fetch('/api/admin/platon', {
        method: 'POST',
        headers: adminService.getHeaders(),
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        await fetchMethods();
        setNewMethod({
          payment_name: '',
          is_enabled: true,
          display_order: 0,
          logo_file: null
        });
        setShowAddForm(false);
        setSuccess('New payment method added successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.error || 'Failed to add method');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs font-bold text-gray-500">
          {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading Platon Settings...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 pb-20">
      
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-600/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">PLATON</h1>
              <p className="text-sm font-bold text-gray-500">
                {language === 'bn' ? 'পেমেন্ট লোগো ও মেথড ম্যানেজমেন্ট' : 'Payment Logo & Payment Method Management'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 relative z-10">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-black/10"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন যোগ করুন' : 'Add Method'}</span>
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{language === 'bn' ? 'সংরক্ষণ করুন' : 'Save All'}</span>
            </button>
          </div>
        </div>
        
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-[11px] font-bold text-emerald-800 leading-relaxed">
            {language === 'bn' 
              ? 'স্বাদ ঘর কাস্টমার ওয়েবসাইটের ফুটারে প্রদর্শিত পেমেন্ট লোগোগুলি এখান থেকে পরিচালনা করুন।' 
              : 'Manage the payment logos displayed in the SHAD GHOR customer footer.'}
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
          <XCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold">{success}</p>
        </div>
      )}

      {/* Add New Method Modal/Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-150 flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">
                {language === 'bn' ? 'নতুন পেমেন্ট মেথড' : 'Add New Payment Method'}
              </h2>
              <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAddMethod} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Payment Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. PayPal, Upay"
                  value={newMethod.payment_name}
                  onChange={(e) => setNewMethod(prev => ({ ...prev, payment_name: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Method Logo</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-dashed border-emerald-300 rounded-xl text-xs font-black cursor-pointer hover:bg-emerald-100 transition-all">
                    <Upload className="w-4 h-4" />
                    <span>{newMethod.logo_file ? newMethod.logo_file.name : 'Select SVG/PNG'}</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => setNewMethod(prev => ({ ...prev, logo_file: e.target.files?.[0] || null }))}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="new-enabled"
                    checked={newMethod.is_enabled}
                    onChange={(e) => setNewMethod(prev => ({ ...prev, is_enabled: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="new-enabled" className="text-xs font-bold text-gray-600">Enabled by Default</label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
                >
                  {isSaving ? 'Creating...' : 'Create Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Methods List */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
          <Layout className="w-4 h-4" />
          {language === 'bn' ? 'পেমেন্ট মেথডসমূহ' : 'Payment Methods Configuration'}
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {methods.map((method, index) => (
            <div 
              key={method.id}
              className={`bg-white rounded-2xl border transition-all duration-300 group ${
                method.is_enabled ? 'border-gray-150 shadow-sm' : 'border-gray-100 opacity-75 grayscale bg-gray-50/30'
              }`}
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                
                {/* Order Controls */}
                <div className="flex flex-row sm:flex-col gap-1 shrink-0">
                  <button 
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-[11px] font-black text-gray-600 border border-gray-150">
                    {method.display_order}
                  </div>
                  <button 
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === methods.length - 1}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Logo Preview */}
                <div className="relative shrink-0">
                  <div className="w-24 h-16 sm:w-32 sm:h-20 bg-gray-50 rounded-xl border border-gray-150 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-emerald-200 transition-colors bg-white">
                    {method.logo_url ? (
                      <img 
                        src={method.logo_url} 
                        alt={method.payment_name} 
                        className="max-w-[75%] max-h-[75%] object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-200" />
                    )}
                    
                    {uploadingId === method.id && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {method.logo_url && (
                    <button
                      onClick={() => handleDeleteLogo(method.id)}
                      title="Remove Logo"
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors cursor-pointer border-2 border-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Info & Controls */}
                <div className="flex-1 min-w-0 space-y-4 sm:space-y-0 w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <input 
                        type="text"
                        value={method.payment_name}
                        onChange={(e) => handleNameChange(method.id, e.target.value)}
                        className="text-base font-black text-gray-900 bg-transparent border-none focus:ring-0 p-0 w-full"
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 py-0.5 bg-gray-100 rounded">
                          ID: {method.payment_key}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Pos: {method.display_order}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={method.is_enabled}
                          onChange={() => handleToggleEnable(method.id)}
                        />
                        <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        <span className="ml-3 text-[11px] font-black text-gray-600 uppercase tracking-tighter">
                          {method.is_enabled ? 'Active' : 'Hidden'}
                        </span>
                      </label>
                      
                      <button 
                        onClick={() => handleDeleteMethod(method.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Payment Method"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-3 border-t border-gray-100 mt-2">
                    <label className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[11px] font-black cursor-pointer transition-all border border-emerald-100/50">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{method.logo_url ? 'Replace Logo' : 'Upload Logo'}</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(method.id, file);
                        }}
                      />
                    </label>
                    
                    {method.logo_url && (
                      <a 
                        href={method.logo_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-[11px] font-black transition-all border border-gray-150"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Preview Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-2">
          Customer Footer Preview
        </h2>
        
        <div className="bg-[#f0f9f4] p-8 rounded-2xl border border-emerald-100 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <h4 className="text-emerald-900 font-black text-[10px] uppercase tracking-widest">
              {language === 'bn' ? 'আমরা গ্রহণ করি' : 'WE ACCEPT'}
            </h4>
            <div className="flex flex-nowrap gap-1.5 justify-center overflow-hidden">
              {methods.filter(m => m.is_enabled).map((m, i) => (
                <div 
                  key={i} 
                  className="h-8 w-11 sm:h-9 sm:w-14 bg-white rounded-sm border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm p-1"
                  title={m.payment_name}
                >
                  {m.logo_url ? (
                    <img src={m.logo_url} alt={m.payment_name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[7px] font-black text-gray-300 uppercase">{m.payment_name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-[9px] font-bold text-emerald-800/40 uppercase tracking-widest">
              Live Preview of the "We Accept" section
            </p>
          </div>
        </div>
      </div>

      {/* Floating Save Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-gray-150 p-4 z-40 flex gap-2">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-xs font-black"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex-[2] flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </div>

    </div>
  );
};
