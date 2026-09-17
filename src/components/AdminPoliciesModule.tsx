import React, { useState, useEffect } from 'react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';
import { Save, AlertCircle } from 'lucide-react';

export const AdminPoliciesModule = () => {
  const { language } = useLanguage();
  const [policies, setPolicies] = useState<any[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/policies', { headers: adminService.getHeaders() });
      const data = await res.json();
      setPolicies(data);
    } catch (err) {
      console.error('Failed to fetch policies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus('idle');
    try {
      const res = await fetch(`/api/admin/policies/${selectedPolicy.slug}`, {
        method: 'POST',
        headers: { ...adminService.getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedPolicy)
      });
      if (res.ok) {
        setStatus('success');
        fetchPolicies();
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-black text-gray-900 mb-4">{language === 'bn' ? 'পলিসি ম্যানেজমেন্ট' : 'Policies Management'}</h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          {policies.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPolicy({...p})}
              className={`w-full text-left p-3 rounded-lg text-xs font-bold ${selectedPolicy?.id === p.id ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              {language === 'bn' ? p.title_bn : p.title_en}
            </button>
          ))}
        </div>
        
        {selectedPolicy && (
          <div className="md:col-span-2 space-y-4">
            <input className="w-full p-2 border rounded" value={selectedPolicy.title_en} onChange={e => setSelectedPolicy({...selectedPolicy, title_en: e.target.value})} placeholder="Title (EN)" />
            <input className="w-full p-2 border rounded" value={selectedPolicy.title_bn} onChange={e => setSelectedPolicy({...selectedPolicy, title_bn: e.target.value})} placeholder="Title (BN)" />
            <textarea className="w-full p-2 border rounded h-32" value={selectedPolicy.content_en} onChange={e => setSelectedPolicy({...selectedPolicy, content_en: e.target.value})} placeholder="Content (EN)" />
            <textarea className="w-full p-2 border rounded h-32" value={selectedPolicy.content_bn} onChange={e => setSelectedPolicy({...selectedPolicy, content_bn: e.target.value})} placeholder="Content (BN)" />
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold">
                <input type="checkbox" checked={!!selectedPolicy.is_active} onChange={e => setSelectedPolicy({...selectedPolicy, is_active: e.target.checked ? 1 : 0})} />
                Active
              </label>
              <label className="flex items-center gap-2 text-xs font-bold">
                <input type="checkbox" checked={!!selectedPolicy.is_published} onChange={e => setSelectedPolicy({...selectedPolicy, is_published: e.target.checked ? 1 : 0})} />
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
