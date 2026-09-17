import React, { useState, useEffect, useRef } from 'react';
import { DBBanner, Category } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const CategoryBannerSection: React.FC = () => {
  const { language } = useLanguage();
  const [banners, setBanners] = useState<DBBanner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannersRes, categoriesRes] = await Promise.all([
          fetch('/api/homepage/banners?location=category_banner'),
          fetch('/api/categories')
        ]);
        
        if (bannersRes.ok && categoriesRes.ok) {
          const bannersData = await bannersRes.json();
          const categoriesData = await categoriesRes.json();
          
          setBanners(bannersData.filter((b: DBBanner) => b.status === 'active'));
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error('Failed to fetch category banners:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (isLoading || banners.length === 0) {
    if (isLoading) {
      return (
        <section className="px-4 py-4 bg-white flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="min-w-[140px] sm:min-w-[180px] aspect-[16/9] rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </section>
      );
    }
    return null;
  }

  const getCategorySlug = (categoryId: number | string | undefined) => {
    if (!categoryId) return '';
    const cat = categories.find(c => String(c.id) === String(categoryId));
    return cat ? cat.slug : '';
  };

  const handleBannerClick = (banner: DBBanner) => {
    if (banner.destination_type === 'category' && banner.category_id) {
      const slug = getCategorySlug(banner.category_id);
      if (slug) {
        window.location.hash = `#/category/${slug}`;
      }
    } else if (banner.button_link) {
      if (banner.button_link.startsWith('http')) {
        window.open(banner.button_link, '_blank');
      } else {
        window.location.hash = banner.button_link;
      }
    }
  };

  return (
    <section className="px-4 py-4 bg-white border-b border-gray-50 overflow-hidden" id="category-banner-section">
      <div 
        ref={scrollContainerRef}
        className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 hide-scrollbar scroll-smooth"
        id="category-banner-scroll"
      >
        {banners.map((banner) => (
          <button
            key={banner.id}
            onClick={() => handleBannerClick(banner)}
            className="flex-shrink-0 group cursor-pointer focus:outline-none transition-transform active:scale-95"
            style={{ width: 'auto' }}
            id={`cat-banner-${banner.id}`}
          >
            <div className="relative overflow-hidden rounded-xl border border-gray-150 shadow-xs group-hover:shadow-md transition-all duration-300">
              <img 
                src={banner.image_url_desktop} 
                alt={language === 'bn' ? banner.heading_bn : banner.heading_en} 
                className="h-20 sm:h-28 md:h-32 w-auto object-cover select-none pointer-events-none"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                <span className="text-[10px] font-black text-white uppercase tracking-wider truncate w-full">
                  {language === 'bn' ? banner.heading_bn : banner.heading_en}
                </span>
              </div>
            </div>
            <p className="mt-1.5 text-[10px] sm:text-[11px] font-black text-gray-700 text-center uppercase tracking-wide group-hover:text-emerald-600 transition-colors">
              {language === 'bn' ? banner.heading_bn : banner.heading_en}
            </p>
          </button>
        ))}
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};
