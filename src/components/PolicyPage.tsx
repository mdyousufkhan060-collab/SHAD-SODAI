import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const PolicyPage = ({ slug }: { slug: string }) => {
  const { language } = useLanguage();
  const [policy, setPolicy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/policies/${slug}`)
      .then(res => res.json())
      .then(data => {
        setPolicy(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching policy:', err);
        setIsLoading(false);
      });
  }, [slug]);

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading...</div>;
  if (!policy) return <div className="p-8 text-center text-red-600">Policy not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 animate-fade-in">
      <h1 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">
        {language === 'bn' ? policy.title_bn : policy.title_en}
      </h1>
      <div className="prose prose-sm max-w-none text-gray-700">
        {language === 'bn' ? policy.content_bn : policy.content_en}
      </div>
    </div>
  );
};
