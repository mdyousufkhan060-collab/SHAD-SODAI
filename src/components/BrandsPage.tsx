import React, { useState, useEffect } from 'react';
import { LayoutGrid, ChevronRight, Star } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Breadcrumbs } from './Breadcrumbs';

export const BrandsPage = () => {
  const { language } = useLanguage();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch('/api/brands');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.brands || []);
          setBrands(list.filter((b: any) => b.status === 'active'));
        }
      } catch (err) {
        console.error('Failed to fetch brands:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 min-h-screen" id="brands-page">
      <Breadcrumbs 
        items={[
          { 
            label: language === 'bn' ? 'সব ব্র্যান্ড' : 'All Brands', 
            active: true 
          }
        ]} 
      />

      <header className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
          {language === 'bn' ? 'আমাদের বিশ্বস্ত ব্র্যান্ডসমূহ' : 'Our Trusted Brands'}
        </h1>
        <p className="text-gray-500 font-medium">
          {language === 'bn' 
            ? 'খাঁটি ও প্রাকৃতিক পণ্যের সমাহার নিয়ে দেশসেরা সব ব্র্যান্ড এখন এক জায়গায়।' 
            : 'Premium organic brands from across the country, all in one place.'}
        </p>
      </header>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      ) : (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6" id="brands-grid">
          {brands.map((brand) => (
            <a 
              key={brand.id}
              href={`#/brand/${brand.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center transition-all hover:shadow-xl hover:shadow-emerald-600/5 hover:border-emerald-100"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-50 p-2 mb-4 overflow-hidden border border-gray-50 group-hover:scale-105 transition-transform flex items-center justify-center">
                {(brand.logo || brand.logoUrl) ? (
                  <img src={brand.logo || brand.logoUrl} alt={brand.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600 font-black text-xl">
                    {brand.name.substring(0, 1)}
                  </div>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-gray-800 group-hover:text-emerald-600 transition-colors">
                {brand.name}
              </h2>
              <div className="mt-2 flex items-center gap-1 text-amber-400">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'bn' ? 'ভেরিফাইড' : 'Verified'}</span>
              </div>
              <div className="mt-4 px-4 py-1.5 rounded-full bg-gray-50 group-hover:bg-emerald-600 group-hover:text-white text-[10px] font-black text-gray-500 uppercase tracking-wider transition-all">
                {language === 'bn' ? 'পণ্য দেখুন →' : 'View Products →'}
              </div>
            </a>
          ))}
        </section>
      )}
    </main>
  );
};
