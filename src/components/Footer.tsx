import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Facebook, Instagram, Youtube, Linkedin, Phone, Mail, MapPin, 
  ArrowUp, Leaf
} from 'lucide-react';

interface FooterSettings {
  [key: string]: string;
}

export const Footer = () => {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<FooterSettings>({});
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/footer/config')
      .then(res => res.json())
      .then(d => {
        setSettings(d.settings || {});
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    fetch('/api/payment-methods/active')
      .then(res => res.json())
      .then(setPaymentMethods)
      .catch(err => console.error('Failed to fetch active payment methods:', err));
  }, []);

  const getTranslation = (en: string, bn: string) => language === 'bn' ? bn : en;

  const storeName = settings.company_name || settings.store_name || 'SHAD SHODAI';
  const storeLogo = settings.company_logo || settings.footer_logo_url || 'https://shadshodai.com/wp-content/uploads/2023/11/Shad-Ghor-Logo-01.png';

  const socialLogos: Record<string, React.ReactNode> = {
    footer_social_facebook: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    footer_social_instagram: (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <defs>
          <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#f09433', stopOpacity: 1 }} />
            <stop offset="25%" style={{ stopColor: '#e6683c', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#dc2743', stopOpacity: 1 }} />
            <stop offset="75%" style={{ stopColor: '#cc2366', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#bc1888', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path fill="url(#instagram-gradient)" d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.012 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.012 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.012-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.58.016 4.85.071 1.17.054 1.81.248 2.23.414.56.216.96.474 1.38.894.42.42.678.82.894 1.38.164.42.36 1.06.413 2.23.058 1.27.07 1.647.07 4.85s-.015 3.58-.07 4.85c-.056 1.17-.25 1.81-.413 2.23-.216.56-.474.96-.894 1.38-.42.42-.82.678-1.38.894-.42.164-1.06.36-2.23.413-1.27.058-1.647.07-4.85.07s-3.58-.015-4.85-.07c-1.17-.056-1.81-.25-2.23-.413-.56-.216-.96-.474-1.38-.894-.42-.42-.678-.82-.894-1.38-.164-.42-.36-1.06-.413-2.23-.058-1.27-.07-1.647-.07-4.85s.016-3.58.071-4.85c.054-1.17.248-1.81.414-2.23.216-.56.474-.96.894-1.38.42-.42.82-.678 1.38-.894.42-.164 1.06-.36 2.23-.413 1.27-.058 1.647-.07 4.85-.07zm0 3.678c-3.405 0-6.162 2.757-6.162 6.162 0 3.405 2.757 6.162 6.162 6.162 3.405 0 6.162-2.757 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.645-1.44-1.44 0-.794.645-1.439 1.44-1.439.794 0 1.44.645 1.44 1.439z"/>
      </svg>
    ),
    footer_social_tiktok: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#000000">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.9-.39-2.81-.12-.62.18-1.16.55-1.55 1.05-.53.66-.73 1.52-.64 2.35.06.65.34 1.28.78 1.77.56.62 1.34 1.02 2.16 1.14 1.01.14 2.1-.11 2.91-.77.72-.56 1.15-1.44 1.24-2.35.12-2.58.05-5.17.06-7.76.01-4.03 0-8.05.01-12.08z"/>
      </svg>
    ),
    footer_social_youtube: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  };

  const socialLinks = [
    { key: 'footer_social_facebook', label: 'SHAD SHODAI Facebook', defaultUrl: 'https://facebook.com/shadshodai' },
    { key: 'footer_social_instagram', label: 'SHAD SHODAI Instagram', defaultUrl: 'https://instagram.com/shadshodai' },
    { key: 'footer_social_tiktok', label: 'SHAD SHODAI TikTok', defaultUrl: 'https://tiktok.com/@shadshodai' },
    { key: 'footer_social_youtube', label: 'SHAD SHODAI YouTube', defaultUrl: 'https://youtube.com/shadshodai' }
  ];

  const businessAddress = [
    settings.store_area,
    settings.store_city,
    settings.store_country
  ].filter(Boolean).join(', ');

  const displayAddress = businessAddress || 'Rampura, Dhaka, Bangladesh';

  const footerLinks = [
    {
      titleEn: 'INFORMATION', titleBn: 'তথ্য',
      links: [
        { name_en: 'About Us', name_bn: 'আমাদের সম্পর্কে', url: '#/about' },
        { name_en: 'Contact Us', name_bn: 'যোগাযোগ করুন', url: '#/contact' },
        { name_en: 'Company Information', name_bn: 'কোম্পানি তথ্য', url: '#/policy/company-info' },
        { name_en: 'SHAD GHOR Stories', name_bn: 'স্বাদ ঘর স্টোরিজ', url: '#/policy/stories' },
        { name_en: 'Terms & Conditions', name_bn: 'শর্তাবলী', url: '#/policy/terms-and-conditions' },
        { name_en: 'Privacy Policy', name_bn: 'গোপনীয়তা নীতি', url: '#/policy/privacy-policy' },
        { name_en: 'Careers', name_bn: 'ক্যারিয়ার', url: '#/policy/careers' },
      ]
    },
    {
      titleEn: 'SHOP BY', titleBn: 'শপ করুন',
      links: [
        { name_en: 'Oil & Ghee', name_bn: 'তেল ও ঘি', url: '#/category/oil-ghee' },
        { name_en: 'Honey', name_bn: 'মধু', url: '#/category/honey' },
        { name_en: 'Dates', name_bn: 'খেজুর', url: '#/category/dates' },
        { name_en: 'Spices', name_bn: 'মসলা', url: '#/category/spices' },
        { name_en: 'Nuts & Seeds', name_bn: 'বাদাম ও বীজ', url: '#/category/nuts-seeds' },
        { name_en: 'Beverage', name_bn: 'পানীয়', url: '#/category/beverage' },
        { name_en: 'Functional Foods', name_bn: 'ফাংশনাল ফুডস', url: '#/category/functional-foods' },
      ]
    },
    {
      titleEn: 'SUPPORT', titleBn: 'সাপোর্ট',
      links: [
        { name_en: 'Support Center', name_bn: 'সাপোর্ট সেন্টার', url: '#/support' },
        { name_en: 'How to Order', name_bn: 'কিভাবে অর্ডার করবেন', url: '#/faq' },
        { name_en: 'Order Tracking', name_bn: 'অর্ডার ট্র্যাকিং', url: '#/account' },
        { name_en: 'Payment', name_bn: 'পেমেন্ট', url: '#/faq' },
        { name_en: 'Shipping', name_bn: 'শিপিং', url: '#/faq' },
        { name_en: 'FAQ', name_bn: 'সাধারণ জিজ্ঞাসা', url: '#/faq' },
      ]
    },
    {
      titleEn: 'CONSUMER POLICY', titleBn: 'ভোক্তা নীতি',
      links: [
        { name_en: 'Happy Return', name_bn: 'হ্যাপি রিটার্ন', url: '#/policy/return-policy' },
        { name_en: 'Refund Policy', name_bn: 'রিফান্ড নীতি', url: '#/policy/refund-policy' },
        { name_en: 'Exchange', name_bn: 'এক্সচেঞ্জ', url: '#/policy/exchange-policy' },
        { name_en: 'Cancellation', name_bn: 'বাতিলকরণ', url: '#/policy/cancellation-policy' },
        { name_en: 'Pre-Order', name_bn: 'প্রি-অর্ডার', url: '#/policy/pre-order' },
        { name_en: 'Extra Discount', name_bn: 'অতিরিক্ত ছাড়', url: '#/offers' },
      ]
    }
  ];

  if (isLoading) return null;

  return (
    <footer className="bg-[#f0f9f4] pt-10 pb-6 border-t border-emerald-100 font-sans" id="shadshodai-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
          
          {/* Brand & Contact */}
          <div className="space-y-4 text-left lg:col-span-1">
            <div className="flex flex-col gap-2">
              <a href="#/" className="block">
                <img 
                  src="https://shadshodai.com/wp-content/uploads/2023/11/Shad-Ghor-Logo-01.png" 
                  alt="SHAD SHODAI" 
                  className="h-16 w-auto object-contain -ml-2" 
                />
              </a>
              <p className="text-slate-800 text-[10.5px] font-bold leading-snug max-w-[220px] mt-1">
                {getTranslation(settings.footer_description_en, settings.footer_description_bn) || 'Your trusted online grocery store. Fresh products, better health, happier life.'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900">
                <MapPin size={12} className="text-emerald-900 shrink-0" />
                <a 
                  href={settings.maps_url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10.5px] font-bold hover:text-emerald-950"
                >
                  {displayAddress}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-900">
                <Phone size={12} className="text-emerald-900 shrink-0" />
                <a href={`tel:${settings.store_phone || settings.footer_contact_phone || '+8809642922922'}`} className="text-[10.5px] font-bold hover:text-emerald-950">
                  {settings.store_phone || settings.footer_contact_phone || '+8809642922922'}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-900">
                <Mail size={12} className="text-emerald-900 shrink-0" />
                <a href={`mailto:${settings.store_email || settings.footer_contact_email || 'contact@shadshodai.com'}`} className="text-[10.5px] font-bold hover:text-emerald-950">
                  {settings.store_email || settings.footer_contact_email || 'contact@shadshodai.com'}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-0.5 flex-nowrap">
              {socialLinks.map(social => (
                <a 
                  key={social.key}
                  href={settings[social.key] || social.defaultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform hover:scale-110 active:scale-95 flex-shrink-0"
                  title={social.label}
                  aria-label={social.label}
                >
                  {socialLogos[social.key]}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links Grid (2 columns on mobile, 4 sections on desktop) */}
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4 text-left">
            {footerLinks.map((section, idx) => (
              <div key={idx} className="space-y-1.5">
                <h4 className="text-emerald-950 font-black text-[11px] uppercase tracking-[0.12em] border-b border-emerald-900/20 pb-0.5">
                  {getTranslation(section.titleEn, section.titleBn)}
                </h4>
                <ul className="space-y-0.5">
                  {section.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <a 
                        href={link.url} 
                        className="text-slate-800 hover:text-emerald-950 text-[11px] font-bold transition-colors block leading-tight py-0.5"
                      >
                        {getTranslation(link.name_en, link.name_bn)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* App Download & Payment Methods */}
        <div className="py-2 border-t border-emerald-900/15 flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-1 text-left">
            <h4 className="text-emerald-950 font-black text-[8.5px] uppercase tracking-[0.15em]">
              {getTranslation('DOWNLOAD APP ON MOBILE:', 'মোবাইল অ্যাপ ডাউনলোড করুন :')}
            </h4>
            <div className="flex items-center gap-2">
              <a href={settings.footer_play_store_url || '#'} className="h-6.5 hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-full" />
              </a>
              <a href={settings.footer_app_store_url || '#'} className="h-6.5 hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-full" />
              </a>
            </div>
          </div>

          <div className="w-full md:w-auto mt-2 pt-2 border-t border-[#dfe9e5] md:border-t-0 md:pt-0 md:mt-0 flex flex-col md:items-end justify-center">
            <h3 className="m-0 mb-1 text-[12px] font-black tracking-widest text-[#075c48] uppercase text-left md:text-right">
              {getTranslation('WE ACCEPT', 'আমরা গ্রহণ করি')}
            </h3>
            <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto md:overflow-visible md:justify-end no-scrollbar">
              {paymentMethods.map((method, i) => (
                <div 
                  key={i} 
                  className="w-[52px] h-[34px] bg-white border border-[#d9e4e0] rounded-[6px] flex items-center justify-center p-1 box-border shadow-xs hover:shadow-sm transition-all flex-shrink-0" 
                  title={method.name}
                >
                  <img 
                    src={method.logo} 
                    alt={method.alt_text || method.name} 
                    className="block max-w-full max-h-full w-auto h-auto object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright Divider */}
        <div className="pt-3 border-t border-emerald-900/15 flex flex-col md:flex-row items-center justify-between gap-3 text-center">
          <p className="text-slate-600 text-[10px] font-bold">
            {getTranslation(`© 2026 ${storeName}. All rights reserved.`, `© ২০২৬ ${storeName}। সর্বস্বত্ব সংরক্ষিত।`)}
          </p>
          
          <div className="flex items-center gap-5">
            <p className="text-gray-400 text-[10px] font-bold hidden sm:block">
              {getTranslation('Follow us for the latest updates.', 'সর্বশেষ আপডেটের জন্য আমাদের অনুসরণ করুন।')}
            </p>
            
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-all shadow-md active:scale-90"
              aria-label="Back to Top"
            >
              <ArrowUp size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation Buffer */}
      <div className="h-20 md:hidden"></div>
    </footer>
  );
};



