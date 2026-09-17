import React, { useState, useEffect } from 'react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';
import { Save, Plus, Trash2, AlertCircle } from 'lucide-react';

export const AdminFAQModule = () => {
  const { language } = useLanguage();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [selectedFaq, setSelectedFaq] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const categories = ['General', 'Products', 'Orders', 'Payment', 'Delivery', 'Return & Refund', 'Account', 'Offers & Coupons', 'Customer Support'];

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/faqs', { headers: adminService.getHeaders() });
      const data = await res.json();
      setFaqs(data);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { ...adminService.getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedFaq)
      });
      if (res.ok) {
        setStatus('success');
        fetchFaqs();
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
        await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE', headers: adminService.getHeaders() });
        fetchFaqs();
    } catch (err) {
        console.error('Failed to delete FAQ:', err);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-black text-gray-900 mb-4">{language === 'bn' ? 'FAQ ম্যানেজমেন্ট' : 'FAQ Management'}</h2>
      
      <button 
        onClick={() => setSelectedFaq({ question_en: '', question_bn: '', answer_en: '', answer_bn: '', category: 'General', is_active: 1, is_published: 0, display_order: 0, is_featured: 0 })}
        className="mb-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add FAQ
      </button>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2 max-h-[500px] overflow-y-auto">
          {faqs.map(f => (
            <div key={f.id} className="flex gap-2 items-center">
                <button
                onClick={() => setSelectedFaq({...f})}
                className={`flex-1 text-left p-3 rounded-lg text-xs font-bold ${selectedFaq?.id === f.id ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                >
                {language === 'bn' ? f.question_bn : f.question_en}
                </button>
                <button onClick={() => handleDelete(f.id)} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        
        {selectedFaq && (
          <div className="md:col-span-2 space-y-4">
            <input className="w-full p-2 border rounded text-xs" value={selectedFaq.question_en} onChange={e => setSelectedFaq({...selectedFaq, question_en: e.target.value})} placeholder="Question (EN)" />
            <input className="w-full p-2 border rounded text-xs" value={selectedFaq.question_bn} onChange={e => setSelectedFaq({...selectedFaq, question_bn: e.target.value})} placeholder="Question (BN)" />
            <textarea className="w-full p-2 border rounded h-24 text-xs" value={selectedFaq.answer_en} onChange={e => setSelectedFaq({...selectedFaq, answer_en: e.target.value})} placeholder="Answer (EN)" />
            <textarea className="w-full p-2 border rounded h-24 text-xs" value={selectedFaq.answer_bn} onChange={e => setSelectedFaq({...selectedFaq, answer_bn: e.target.value})} placeholder="Answer (BN)" />
            
            <select className="w-full p-2 border rounded text-xs" value={selectedFaq.category} onChange={e => setSelectedFaq({...selectedFaq, category: e.target.value})}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold">
                <input type="checkbox" checked={!!selectedFaq.is_active} onChange={e => setSelectedFaq({...selectedFaq, is_active: e.target.checked ? 1 : 0})} />
                Active
              </label>
              <label className="flex items-center gap-2 text-xs font-bold">
                <input type="checkbox" checked={!!selectedFaq.is_published} onChange={e => setSelectedFaq({...selectedFaq, is_published: e.target.checked ? 1 : 0})} />
                Published
              </label>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            {status === 'success' && <p className="text-emerald-600 text-xs font-bold">Saved ✓</p>}
            {status === 'error' && <p className="text-red-600 text-xs font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Save Failed ✕</p>}
          </div>
        )}
      </div>
    </div>
  );
};
