import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const AboutUsPage = () => {
  const { language } = useLanguage();
  const [data, setData] = useState<any>({ settings: [], sections: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/about')
      .then(res => res.json())
      .then(data => {
        setData({
          settings: data.settings.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {}),
          sections: data.sections
        });
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching about us:', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 animate-fade-in">
      <h1 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">
        {language === 'bn' ? (data.settings.title_bn || 'আমাদের সম্পর্কে') : (data.settings.title_en || 'About Us')}
      </h1>
      <div className="space-y-8">
        {data.sections.map((section: any) => (
          <div key={section.id} className="space-y-2">
            <h2 className="text-xl font-bold text-gray-800">{language === 'bn' ? section.title_bn : section.title_en}</h2>
            <p className="text-gray-600">{language === 'bn' ? section.description_bn : section.description_en}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
