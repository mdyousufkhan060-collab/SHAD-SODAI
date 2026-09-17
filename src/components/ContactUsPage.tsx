import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { supportService, ContactConfig } from '../utils/supportService';

export const ContactUsPage = () => {
  const { language, t } = useLanguage();
  const [contactInfo, setContactInfo] = useState<ContactConfig>({ phone: '+8801712345678', whatsapp: '+8801712345678', email: 'support@shadghor.com' });
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    supportService.getContactConfig().then(setContactInfo);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 animate-fade-in">
      <h1 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">
        {language === 'bn' ? 'যোগাযোগ করুন' : 'Contact Us'}
      </h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Details */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <Phone className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="font-bold text-gray-700">{contactInfo.phone}</p>
              <p className="text-xs text-gray-500">{language === 'bn' ? 'আমাদের কল করুন' : 'Call us'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <Mail className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="font-bold text-gray-700">{contactInfo.email}</p>
              <p className="text-xs text-gray-500">{language === 'bn' ? 'আমাদের ইমেইল করুন' : 'Email us'}</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder={language === 'bn' ? 'আপনার নাম' : 'Your Name'}
            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
          <input 
            type="email" 
            placeholder={language === 'bn' ? 'আপনার ইমেইল' : 'Your Email'}
            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            required
          />
          <input 
            type="text" 
            placeholder={language === 'bn' ? 'বিষয়' : 'Subject'}
            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold"
            value={formData.subject}
            onChange={e => setFormData({...formData, subject: e.target.value})}
            required
          />
          <textarea 
            rows={4}
            placeholder={language === 'bn' ? 'আপনার বার্তা' : 'Your Message'}
            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold"
            value={formData.message}
            onChange={e => setFormData({...formData, message: e.target.value})}
            required
          />
          <button 
            type="submit"
            disabled={status === 'submitting'}
            className="w-full p-3 bg-emerald-600 text-white font-black rounded-xl cursor-pointer hover:bg-emerald-700 disabled:opacity-50"
          >
            {status === 'submitting' ? (language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') : (language === 'bn' ? 'বার্তা পাঠান' : 'Send Message')}
          </button>
          
          {status === 'success' && <p className="text-xs text-emerald-600 font-bold">{language === 'bn' ? 'বার্তা পাঠানো হয়েছে!' : 'Message sent!'}</p>}
          {status === 'error' && <p className="text-xs text-red-600 font-bold">{language === 'bn' ? 'ত্রুটি হয়েছে, আবার চেষ্টা করুন।' : 'Error, try again.'}</p>}
        </form>
      </div>
    </div>
  );
};
