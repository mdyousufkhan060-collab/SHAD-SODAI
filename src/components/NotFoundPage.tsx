import React from 'react';
import { Home, Search, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const NotFoundPage = () => {
  const { language } = useLanguage();

  return (
    <main className="max-w-7xl mx-auto px-4 py-20 min-h-[70vh] flex flex-col items-center justify-center text-center" id="not-found-page">
      <div className="relative mb-8">
        <h1 className="text-[120px] sm:text-[180px] font-black text-emerald-50 leading-none">404</h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full shadow-2xl flex items-center justify-center border border-gray-50">
            <Search className="w-10 h-10 sm:w-14 sm:h-14 text-emerald-600 animate-pulse" />
          </div>
        </div>
      </div>

      <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mb-4">
        {language === 'bn' ? 'দুঃখিত! এই পেজটি খুঁজে পাওয়া যায়নি' : 'Oops! Page Not Found'}
      </h2>
      <p className="text-gray-500 max-w-md mx-auto mb-10 font-medium">
        {language === 'bn' 
          ? 'আপনি যে লিঙ্কটি খুঁজছেন তা হয়তো ডিলিট করা হয়েছে অথবা ভুল ইউআরএল টাইপ করেছেন।' 
          : 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.'}
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        <button 
          onClick={() => window.location.hash = '#/'}
          className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <Home className="w-5 h-5" />
          {language === 'bn' ? 'হোমপেজে ফিরে যান' : 'Back to Home'}
        </button>
        <button 
          onClick={() => window.location.hash = '#/categories'}
          className="flex items-center gap-2 px-8 py-3.5 bg-white border-2 border-gray-100 hover:border-emerald-100 text-gray-700 hover:text-emerald-600 font-black rounded-xl transition-all active:scale-95"
        >
          <ShoppingBag className="w-5 h-5" />
          {language === 'bn' ? 'শপিং শুরু করুন' : 'Start Shopping'}
        </button>
      </div>
    </main>
  );
};
