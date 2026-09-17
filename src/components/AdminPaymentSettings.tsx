import React, { useState, useEffect } from 'react';
import { adminService } from '../utils/adminService';
import { 
  CreditCard, 
  Save, 
  Smartphone, 
  ShieldCheck, 
  Info,
  Smartphone as BkashIcon,
  Zap as NagadIcon,
  CircleDot as RocketIcon,
  CheckCircle2,
  AlertCircle,
  Truck
} from 'lucide-react';

interface AdminPaymentSettingsProps {
  language: 'en' | 'bn';
}

export const AdminPaymentSettings: React.FC<AdminPaymentSettingsProps> = ({ language }) => {
  const [settings, setSettings] = useState<any>({
    payment_bkash_number: '',
    payment_nagad_number: '',
    payment_rocket_number: '',
    delivery_charge_inside_dhaka: '60',
    delivery_charge_outside_dhaka: '120',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/footer/config'); // Reusing existing settings endpoint
      const data = await res.json();
      setSettings({
        payment_bkash_number: data.payment_bkash_number || '',
        payment_nagad_number: data.payment_nagad_number || '',
        payment_rocket_number: data.payment_rocket_number || '',
        delivery_charge_inside_dhaka: data.delivery_charge_inside_dhaka || '60',
        delivery_charge_outside_dhaka: data.delivery_charge_outside_dhaka || '120',
      });
    } catch (err) {
      console.error('Failed to fetch payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/footer/config', {
        method: 'POST',
        headers: adminService.getHeaders(),
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setStatus({
          type: 'success',
          message: language === 'bn' ? 'পেমেন্ট সেটিংস সফলভাবে আপডেট করা হয়েছে।' : 'Payment settings updated successfully.'
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: language === 'bn' ? 'আপডেট করতে সমস্যা হয়েছে।' : 'Failed to update settings.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-left">
      <div className="bg-white p-5 rounded-xl border border-gray-150 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[9px] text-emerald-700 font-black tracking-widest uppercase block">Financial Config</span>
          <h2 className="text-base font-black text-gray-800 leading-tight">Payment & Delivery Settings</h2>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {language === 'bn' ? 'সেভ করুন' : 'Save Changes'}
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-black animate-fade-in ${
          status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800">Mobile Banking Accounts</h3>
              <p className="text-[10px] text-gray-400 font-bold">These numbers will be shown to customers during checkout.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500 ml-1 flex items-center gap-1.5">
                <BkashIcon className="w-3.5 h-3.5 text-pink-500" />
                bKash Personal Number
              </label>
              <input 
                type="text" 
                value={settings.payment_bkash_number}
                onChange={(e) => setSettings({...settings, payment_bkash_number: e.target.value})}
                className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                placeholder="01XXXXXXXXX"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500 ml-1 flex items-center gap-1.5">
                <NagadIcon className="w-3.5 h-3.5 text-orange-500" />
                Nagad Personal Number
              </label>
              <input 
                type="text" 
                value={settings.payment_nagad_number}
                onChange={(e) => setSettings({...settings, payment_nagad_number: e.target.value})}
                className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                placeholder="01XXXXXXXXX"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500 ml-1 flex items-center gap-1.5">
                <RocketIcon className="w-3.5 h-3.5 text-purple-500" />
                Rocket Personal Number
              </label>
              <input 
                type="text" 
                value={settings.payment_rocket_number}
                onChange={(e) => setSettings({...settings, payment_rocket_number: e.target.value})}
                className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                placeholder="01XXXXXXXXX"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
              Customers will see these numbers only when they select the corresponding mobile banking method. For COD, no numbers are displayed.
            </p>
          </div>
        </div>

        {/* Delivery Charges */}
        <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800">Delivery Charges</h3>
              <p className="text-[10px] text-gray-400 font-bold">Configure flat rates for shipping based on location.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500 ml-1">Inside Dhaka (৳)</label>
              <input 
                type="number" 
                value={settings.delivery_charge_inside_dhaka}
                onChange={(e) => setSettings({...settings, delivery_charge_inside_dhaka: e.target.value})}
                className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500 ml-1">Outside Dhaka (৳)</label>
              <input 
                type="number" 
                value={settings.delivery_charge_outside_dhaka}
                onChange={(e) => setSettings({...settings, delivery_charge_outside_dhaka: e.target.value})}
                className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Pricing Logic</p>
            </div>
            <p className="text-[10px] text-emerald-700 font-bold leading-relaxed">
              Order Total = Sum(Product Price × Qty) + Delivery Charge. <br />
              The charge is automatically applied based on the customer's selected district.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
