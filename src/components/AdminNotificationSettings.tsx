import React, { useState, useEffect } from 'react';
import { Bell, Save, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Settings, Mail, Smartphone, MessageSquare, Globe, Info, Layout, Layers } from 'lucide-react';
import { adminService } from '../utils/adminService';

interface NotificationConfig {
  notifications_master_enabled: string;
  customer_notifications_enabled: string;
  admin_notifications_enabled: string;
  channel_in_app_enabled: string;
  channel_email_enabled: string;
  channel_sms_enabled: string;
  channel_whatsapp_enabled: string;
  channel_push_enabled: string;
}

interface NotificationTemplate {
  id: number;
  event_key: string;
  title_en: string;
  message_en: string;
  title_bn: string;
  message_bn: string;
  enabled: number;
  channels: string;
}

interface AdminNotificationSettingsProps {
  language: 'en' | 'bn';
}

export const AdminNotificationSettings: React.FC<AdminNotificationSettingsProps> = ({ language }) => {
  const [config, setConfig] = useState<NotificationConfig>({
    notifications_master_enabled: 'true',
    customer_notifications_enabled: 'true',
    admin_notifications_enabled: 'true',
    channel_in_app_enabled: 'true',
    channel_email_enabled: 'false',
    channel_sms_enabled: 'false',
    channel_whatsapp_enabled: 'false',
    channel_push_enabled: 'false'
  });
  const [originalConfig, setOriginalConfig] = useState<NotificationConfig | null>(null);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (originalConfig) {
      const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setIsDirty(hasChanges);
    }
  }, [config, originalConfig]);

  const fetchData = async () => {
    try {
      const [configRes, templatesRes] = await Promise.all([
        fetch('/api/admin/notifications/config', { headers: adminService.getHeaders() }),
        fetch('/api/admin/notifications/templates', { headers: adminService.getHeaders() })
      ]);

      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(data);
        setOriginalConfig(data);
      }
      if (templatesRes.ok) {
        setTemplates(await templatesRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch notification data:', err);
    }
  };

  const handleConfigChange = (key: keyof NotificationConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/notifications/config', {
        method: 'POST',
        headers: adminService.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(config)
      });

      if (res.ok) {
        setOriginalConfig(config);
        setIsDirty(false);
        setStatus({ type: 'success', message: language === 'bn' ? 'বিজ্ঞপ্তি কনফিগারেশন সংরক্ষিত হয়েছে ✓' : 'Notification configuration saved ✓' });
        setTimeout(() => setStatus(null), 3000);
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      setStatus({ type: 'error', message: language === 'bn' ? 'সেভ ব্যর্থ হয়েছে ✕' : 'SAVE FAILED ✕' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    try {
      const res = await fetch('/api/admin/notifications/templates', {
        method: 'POST',
        headers: adminService.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(editingTemplate)
      });
      if (res.ok) {
        setEditingTemplate(null);
        fetchData();
        setStatus({ type: 'success', message: language === 'bn' ? 'টেমপ্লেট সংরক্ষিত হয়েছে ✓' : 'Template saved ✓' });
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save template:', err);
    }
  };

  const channels = [
    { id: 'channel_in_app_enabled', labelEn: 'In-App Notifications', labelBn: 'ইন-অ্যাপ বিজ্ঞপ্তি', icon: Bell, configured: true },
    { id: 'channel_email_enabled', labelEn: 'Email Notifications', labelBn: 'ইমেইল বিজ্ঞপ্তি', icon: Mail, configured: false },
    { id: 'channel_sms_enabled', labelEn: 'SMS Notifications', labelBn: 'এসএমএস বিজ্ঞপ্তি', icon: Smartphone, configured: false },
    { id: 'channel_whatsapp_enabled', labelEn: 'WhatsApp Notifications', labelBn: 'হোয়াটসঅ্যাপ বিজ্ঞপ্তি', icon: MessageSquare, configured: false },
    { id: 'channel_push_enabled', labelEn: 'Web Push Notifications', labelBn: 'ওয়েব পুশ বিজ্ঞপ্তি', icon: Globe, configured: false }
  ];

  const toggleMaster = (key: keyof NotificationConfig) => {
    handleConfigChange(key, config[key] === 'true' ? 'false' : 'true');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in text-left pb-20" id="admin-notification-settings">
      
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-800 leading-tight">
              {language === 'bn' ? 'বিজ্ঞপ্তি সেটিংস' : 'Notification Settings'}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {language === 'bn' ? 'সিস্টেম বিজ্ঞপ্তি ও টেমপ্লেট ব্যবস্থাপনা' : 'Manage system notifications and templates'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isDirty && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span className="text-[9px] font-black text-amber-700 uppercase tracking-tight">Unsaved Changes</span>
            </div>
          )}
          <button 
            onClick={handleSaveConfig}
            disabled={isSaving || !isDirty}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-sm shadow-emerald-200"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? '...' : (language === 'bn' ? 'সেভ করুন' : 'Save Changes')}</span>
          </button>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-xs font-bold">{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Master Controls & Channels */}
        <div className="space-y-6">
          
          {/* Master Controls */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-5">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" />
              {language === 'bn' ? 'মাস্টার কন্ট্রোল' : 'Master Controls'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between group">
                <div>
                  <span className="text-xs font-bold text-gray-700 block">{language === 'bn' ? 'সব বিজ্ঞপ্তি সক্রিয়' : 'Global Notifications'}</span>
                  <p className="text-[9px] text-gray-400 font-medium">{language === 'bn' ? 'সিস্টেমের সব বিজ্ঞপ্তি অন/অফ করুন' : 'Enable/Disable all system alerts'}</p>
                </div>
                <button 
                  onClick={() => toggleMaster('notifications_master_enabled')}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${config.notifications_master_enabled === 'true' ? 'bg-emerald-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.notifications_master_enabled === 'true' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between group pt-3 border-t border-gray-50">
                <span className="text-xs font-bold text-gray-700">{language === 'bn' ? 'কাস্টমার বিজ্ঞপ্তি' : 'Customer Notifications'}</span>
                <button 
                  onClick={() => toggleMaster('customer_notifications_enabled')}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${config.customer_notifications_enabled === 'true' ? 'bg-emerald-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.customer_notifications_enabled === 'true' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between group pt-3 border-t border-gray-50">
                <span className="text-xs font-bold text-gray-700">{language === 'bn' ? 'অ্যাডমিন বিজ্ঞপ্তি' : 'Admin Notifications'}</span>
                <button 
                  onClick={() => toggleMaster('admin_notifications_enabled')}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${config.admin_notifications_enabled === 'true' ? 'bg-emerald-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.admin_notifications_enabled === 'true' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Channels */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-5">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              {language === 'bn' ? 'ডেলিভারি চ্যানেল' : 'Delivery Channels'}
            </h3>
            
            <div className="space-y-4">
              {channels.map(channel => (
                <div key={channel.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config[channel.id as keyof NotificationConfig] === 'true' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                      <channel.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-700 block">{language === 'bn' ? channel.labelBn : channel.labelEn}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${channel.configured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {channel.configured ? (language === 'bn' ? 'কনফিগার করা আছে ✓' : 'CONFIGURED ✓') : (language === 'bn' ? 'কনফিগার করা নেই' : 'NOT CONFIGURED')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    disabled={!channel.configured}
                    onClick={() => handleConfigChange(channel.id as keyof NotificationConfig, config[channel.id as keyof NotificationConfig] === 'true' ? 'false' : 'true')}
                    className={`w-10 h-5 rounded-full relative transition-all duration-300 disabled:opacity-30 ${config[channel.id as keyof NotificationConfig] === 'true' ? 'bg-emerald-600' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config[channel.id as keyof NotificationConfig] === 'true' ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-2.5 items-start">
              <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[9px] font-bold text-blue-700 leading-relaxed uppercase tracking-tight">
                {language === 'bn' ? 'ইমেইল এবং এসএমএস সেটিংস কনফিগার করতে সিস্টেম সেটিংসে যান।' : 'Visit system settings to configure SMTP and SMS gateway credentials.'}
              </p>
            </div>
          </div>

          {/* Test Notifications Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-5">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {language === 'bn' ? 'টেস্ট সিস্টেম' : 'Test System'}
            </h3>
            
            <div className="space-y-3">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed">
                {language === 'bn' ? 'সিস্টেমের নোটিফিকেশন চেক করার জন্য নিচের ইভেন্টগুলো ট্রিগার করুন' : 'Trigger events to verify notification delivery flows'}
              </p>
              
              <button 
                onClick={async () => {
                  const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ customer_name: 'Test User', customer_email: 'test@example.com', total_amount: 1500, items: [] })
                  });
                  if (res.ok) setStatus({ type: 'success', message: 'Order Placed & Admin Notified!' });
                }}
                className="w-full py-2.5 bg-gray-50 hover:bg-emerald-50 border border-gray-150 hover:border-emerald-200 text-[10px] font-black text-gray-700 hover:text-emerald-700 rounded-xl transition-all uppercase tracking-wider"
              >
                Trigger New Order Event
              </button>

              <button 
                onClick={async () => {
                  const res = await fetch('/api/admin/orders/ORD-TEST/status', {
                    method: 'PUT',
                    headers: adminService.getHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ status: 'Shipped' })
                  });
                  if (res.ok) setStatus({ type: 'success', message: 'Order Shipped notification triggered!' });
                  else setStatus({ type: 'error', message: 'Test failed - Create an order first' });
                }}
                className="w-full py-2.5 bg-gray-50 hover:bg-blue-50 border border-gray-150 hover:border-blue-200 text-[10px] font-black text-gray-700 hover:text-blue-700 rounded-xl transition-all uppercase tracking-wider"
              >
                Trigger Order Shipped
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Template Manager */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Layout className="w-3.5 h-3.5" />
                {language === 'bn' ? 'বিজ্ঞপ্তি টেমপ্লেট' : 'Notification Templates'}
              </h3>
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-lg">
                <Layers className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] font-black text-gray-500">{templates.length} Templates</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
                <div 
                  key={template.id} 
                  className={`p-4 rounded-2xl border transition-all hover:shadow-xs group cursor-pointer ${template.enabled ? 'bg-white border-gray-100 hover:border-emerald-200' : 'bg-gray-50 border-gray-100 opacity-70 hover:opacity-100'}`}
                  onClick={() => setEditingTemplate(template)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm uppercase tracking-tight inline-block w-fit mb-1">
                        {template.event_key.replace(/_/g, ' ')}
                      </span>
                      <h4 className="text-xs font-bold text-gray-800">
                        {language === 'bn' ? (template.title_bn || template.title_en) : template.title_en}
                      </h4>
                    </div>
                    <div 
                      className={`w-2 h-2 rounded-full ${template.enabled ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-gray-300'}`}
                    />
                  </div>

                  <p className="text-[10px] text-gray-400 font-medium line-clamp-2 leading-relaxed h-8">
                    {language === 'bn' ? (template.message_bn || template.message_en) : template.message_en}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1">
                        <div className="w-5 h-5 bg-emerald-50 border border-white rounded-full flex items-center justify-center text-emerald-600">
                          <Bell className="w-2.5 h-2.5" />
                        </div>
                        <div className="w-5 h-5 bg-gray-50 border border-white rounded-full flex items-center justify-center text-gray-400 opacity-40">
                          <Mail className="w-2.5 h-2.5" />
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">In-App Only</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">Edit Template →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Template Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-150 overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-800">
                    {language === 'bn' ? 'টেমপ্লেট এডিট করুন' : 'Edit Notification Template'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{editingTemplate.event_key}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingTemplate(null)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">{language === 'bn' ? 'টেমপ্লেট সক্রিয়' : 'Template Active'}</span>
                </div>
                <button 
                  onClick={() => setEditingTemplate({ ...editingTemplate, enabled: editingTemplate.enabled ? 0 : 1 })}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${editingTemplate.enabled ? 'bg-emerald-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${editingTemplate.enabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* English Section */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">English Title</label>
                    <input 
                      type="text" 
                      value={editingTemplate.title_en}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, title_en: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-150 rounded-xl text-xs font-bold focus:border-emerald-500 transition-all outline-hidden"
                      placeholder="Order Confirmed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">English Message</label>
                    <textarea 
                      rows={4}
                      value={editingTemplate.message_en}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, message_en: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-150 rounded-xl text-xs font-bold focus:border-emerald-500 transition-all outline-hidden resize-none"
                      placeholder="Hi {{customer_name}}, your order #{{order_id}}..."
                    />
                  </div>
                </div>

                {/* Bengali Section */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Bengali Title (বাংলা)</label>
                    <input 
                      type="text" 
                      value={editingTemplate.title_bn}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, title_bn: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-150 rounded-xl text-xs font-bold focus:border-emerald-500 transition-all outline-hidden"
                      placeholder="অর্ডার নিশ্চিত করা হয়েছে"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Bengali Message (বাংলা)</label>
                    <textarea 
                      rows={4}
                      value={editingTemplate.message_bn}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, message_bn: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-150 rounded-xl text-xs font-bold focus:border-emerald-500 transition-all outline-hidden resize-none"
                      placeholder="সুপ্রিয় {{customer_name}}, আপনার অর্ডার #{{order_id}}..."
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-black text-amber-700 uppercase">{language === 'bn' ? 'ব্যবহারযোগ্য ভেরিয়েবল' : 'Available Variables'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['customer_name', 'order_id', 'order_total', 'currency', 'tracking_number', 'product_name', 'status'].map(v => (
                    <code key={v} className="text-[9px] font-mono font-black text-amber-800 bg-amber-200/50 px-1.5 py-0.5 rounded cursor-copy hover:bg-amber-300/50 transition-colors" title="Click to copy" onClick={() => navigator.clipboard.writeText(`{{${v}}}`)}>
                      {`{{${v}}}`}
                    </code>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setEditingTemplate(null)}
                className="px-5 py-2 text-[10px] font-black text-gray-500 hover:text-gray-700 uppercase tracking-wider"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button 
                onClick={handleSaveTemplate}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black shadow-sm shadow-emerald-200 uppercase tracking-wider"
              >
                {language === 'bn' ? 'টেমপ্লেট সেভ করুন' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
