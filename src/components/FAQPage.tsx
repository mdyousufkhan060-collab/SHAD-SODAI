import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

export const FAQPage = () => {
  const { language } = useLanguage();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/faqs')
      .then(res => res.json())
      .then(data => {
        setFaqs(data);
        setFilteredFaqs(data);
        const cats = Array.from(new Set(data.map((f: any) => f.category)));
        setCategories(['All', ...cats] as string[]);
      });
  }, []);

  useEffect(() => {
    let filtered = faqs;
    if (selectedCategory !== 'All') filtered = filtered.filter(f => f.category === selectedCategory);
    if (search) filtered = filtered.filter(f => 
        (language === 'bn' ? f.question_bn : f.question_en).toLowerCase().includes(search.toLowerCase()) ||
        (language === 'bn' ? f.answer_bn : f.answer_en).toLowerCase().includes(search.toLowerCase())
    );
    setFilteredFaqs(filtered);
  }, [selectedCategory, search, faqs, language]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-fade-in">
      <h1 className="text-3xl font-black text-gray-900 mb-6">{language === 'bn' ? 'সচরাচর জিজ্ঞাসিত প্রশ্ন' : 'Frequently Asked Questions'}</h1>
      
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(c => (
            <button key={c} onClick={() => setSelectedCategory(c)} className={`px-4 py-1 rounded-full text-xs font-bold ${selectedCategory === c ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>
                {c}
            </button>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input className="w-full pl-10 p-3 rounded-xl border border-gray-200" placeholder={language === 'bn' ? 'প্রশ্ন খুঁজুন...' : 'Search questions...'} onChange={e => setSearch(e.target.value)} />
      </div>
      
      <div className="space-y-4">
        {filteredFaqs.map(f => (
            <div key={f.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button onClick={() => setExpandedId(expandedId === f.id ? null : f.id)} className="w-full p-4 text-left flex justify-between items-center font-bold text-sm">
                    {language === 'bn' ? f.question_bn : f.question_en}
                    {expandedId === f.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedId === f.id && (
                    <div className="p-4 pt-0 text-xs text-gray-600 border-t border-gray-50 bg-gray-50">
                        {language === 'bn' ? f.answer_bn : f.answer_en}
                    </div>
                )}
            </div>
        ))}
      </div>
    </div>
  );
};
