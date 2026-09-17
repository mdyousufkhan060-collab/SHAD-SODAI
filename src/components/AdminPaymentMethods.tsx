import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Camera,
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertCircle,
  X,
  Upload,
  ArrowUpDown,
  Check,
  ChevronRight,
  Save,
  Loader2
} from 'lucide-react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';
import { PaymentMethod } from '../types';

export const AdminPaymentMethods: React.FC = () => {
  const { language } = useLanguage();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingMethod, setEditingMethod] = useState<Partial<PaymentMethod> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/payment-methods', {
        headers: adminService.getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data);
      }
    } catch (err) {
      console.error('Fetch payment methods error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (method: PaymentMethod) => {
    const newStatus = method.status === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/admin/payment-methods/${method.id}`, {
        method: 'PUT',
        headers: {
          ...adminService.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...method, status: newStatus })
      });
      if (res.ok) {
        setPaymentMethods(prev => prev.map(m => m.id === method.id ? { ...m, status: newStatus } : m));
      }
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই পেমেন্ট পদ্ধতিটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this payment method?')) return;

    try {
      const res = await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'DELETE',
        headers: adminService.getHeaders()
      });
      if (res.ok) {
        setPaymentMethods(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error('Delete payment method error:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod?.name || !editingMethod?.logo) return;

    setIsSaving(true);
    setError(null);
    try {
      const url = editingMethod.id 
        ? `/api/admin/payment-methods/${editingMethod.id}` 
        : '/api/admin/payment-methods';
      const method = editingMethod.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          ...adminService.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingMethod)
      });

      if (res.ok) {
        await fetchPaymentMethods();
        setShowEditor(false);
        setEditingMethod(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save payment method');
      }
    } catch (err) {
      setError('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch('/api/admin/profile/upload-logo', { // Reuse the existing upload endpoint
        method: 'POST',
        headers: adminService.getHeaders(),
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setEditingMethod(prev => ({ ...prev!, logo: data.logoUrl }));
      } else {
        setError('Failed to upload logo');
      }
    } catch (err) {
      setError('An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  const filteredMethods = paymentMethods.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            {language === 'bn' ? 'পেমেন্ট পদ্ধতি ব্যবস্থাপনা' : 'Payment Methods Management'}
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            {language === 'bn' ? 'ওয়েবসাইটের পেমেন্ট গেটওয়ে এবং লোগো নিয়ন্ত্রণ করুন' : 'Control website payment gateways and logos'}
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingMethod({ status: 1, sort_order: 0 });
            setShowEditor(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm shadow-emerald-200"
        >
          <Plus className="w-4 h-4" />
          {language === 'bn' ? 'নতুন পদ্ধতি যোগ করুন' : 'Add New Method'}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder={language === 'bn' ? 'পেমেন্ট পদ্ধতি খুঁজুন...' : 'Search payment methods...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Methods List */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {language === 'bn' ? 'লোড হচ্ছে...' : 'LOADING DATA...'}
            </p>
          </div>
        ) : filteredMethods.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8 text-gray-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-800">
                {language === 'bn' ? 'কোনো পেমেন্ট পদ্ধতি পাওয়া যায়নি' : 'No Payment Methods Found'}
              </h3>
              <p className="text-xs text-gray-500 font-semibold">
                {language === 'bn' ? 'আপনার সার্চ টার্ম পরিবর্তন করে দেখুন অথবা নতুন পদ্ধতি যোগ করুন।' : 'Try adjusting your search or add a new payment method.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Order</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMethods.map((method) => (
                  <tr key={method.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-16 h-10 bg-white border border-gray-150 rounded-lg flex items-center justify-center p-1.5 shadow-xs">
                        <img 
                          src={method.logo} 
                          alt={method.alt_text || method.name} 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-800">{method.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => handleToggleStatus(method)}
                          className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                            method.status === 1 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                              : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {method.status === 1 ? (language === 'bn' ? 'সক্রিয়' : 'Active') : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-gray-500">{method.sort_order}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingMethod(method);
                            setShowEditor(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(method.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                {editingMethod?.id ? <Edit2 className="w-4 h-4 text-blue-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
                {editingMethod?.id 
                  ? (language === 'bn' ? 'পদ্ধতি সংশোধন করুন' : 'Edit Payment Method') 
                  : (language === 'bn' ? 'নতুন পদ্ধতি যোগ করুন' : 'Add New Payment Method')}
              </h3>
              <button 
                onClick={() => {
                  setShowEditor(false);
                  setEditingMethod(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">
                      Payment Name *
                    </label>
                    <input 
                      type="text"
                      required
                      value={editingMethod?.name || ''}
                      onChange={(e) => setEditingMethod(prev => ({ ...prev!, name: e.target.value }))}
                      placeholder="e.g. Visa, bKash"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">
                      Sort Order
                    </label>
                    <input 
                      type="number"
                      value={editingMethod?.sort_order || 0}
                      onChange={(e) => setEditingMethod(prev => ({ ...prev!, sort_order: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">
                    Logo URL / Upload *
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      required
                      value={editingMethod?.logo || ''}
                      onChange={(e) => setEditingMethod(prev => ({ ...prev!, logo: e.target.value }))}
                      placeholder="https://example.com/logo.svg"
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      title="Upload Logo"
                    >
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    </button>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    <div className="w-12 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center p-1 shadow-xs overflow-hidden shrink-0">
                      {editingMethod?.logo ? (
                        <img src={editingMethod.logo} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Upload className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">
                    Alt Text
                  </label>
                  <input 
                    type="text"
                    value={editingMethod?.alt_text || ''}
                    onChange={(e) => setEditingMethod(prev => ({ ...prev!, alt_text: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-150">
                  <button
                    type="button"
                    onClick={() => setEditingMethod(prev => ({ ...prev!, status: prev?.status === 1 ? 0 : 1 }))}
                    className={`w-10 h-5 rounded-full relative transition-colors ${editingMethod?.status === 1 ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${editingMethod?.status === 1 ? 'left-6' : 'left-1'}`} />
                  </button>
                  <span className="text-[11px] font-bold text-gray-600">
                    {editingMethod?.status === 1 ? 'Active (Will show on website)' : 'Inactive (Hidden)'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => {
                    setShowEditor(false);
                    setEditingMethod(null);
                  }}
                  className="px-5 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm shadow-emerald-200 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {language === 'bn' ? 'সেভ করুন' : 'Save Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
