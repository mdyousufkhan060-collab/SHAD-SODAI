import React, { useState, useEffect, useRef } from 'react';
import { Category } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getTranslatedCategoryName } from '../utils/translations';
import { useCategories, CategoryItem } from '../utils/categoryService';

interface CategoryCardProps {
  category: CategoryItem | Category;
  key?: string;
}

export const CategoryCard = ({ category }: CategoryCardProps) => {
  const { language } = useLanguage();
  const [imgError, setImgError] = useState(false);
  
  const handleCategoryClick = () => {
    window.location.hash = `#/category/${category.slug || category.id}`;
  };

  const name = language === 'bn' ? ((category as any).name_bn || category.name) : category.name;
  const image = (category as any).image_url || category.imageUrl || (category as any).iconImage || (category as any).icon_image || (category as any).image;

  return (
    <button
      onClick={handleCategoryClick}
      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none shrink-0 w-[78px] sm:w-[96px] md:w-[110px]"
      id={`category-card-btn-${category.id}`}
    >
      <div 
        className="w-full aspect-square rounded-[6px] overflow-hidden bg-gray-50 border border-gray-200/80 flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-xs"
        id={`category-img-container-${category.id}`}
        style={{ borderRadius: '6px' }}
      >
        {category.imageUrl && !imgError ? (
          <img 
            src={category.imageUrl} 
            alt=""
            aria-label={name} 
            className="w-full h-full object-cover select-none pointer-events-none"
            loading="lazy"
            id={`category-card-img-${category.id}`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 text-[10px] font-bold uppercase p-1 text-center">
            {name.slice(0, 10)}
          </div>
        )}
      </div>
      <span 
        className="text-[10px] sm:text-[11px] font-bold text-gray-700 text-center group-hover:text-emerald-600 transition-colors duration-200 whitespace-nowrap px-0.5 w-full truncate"
        id={`category-card-name-${category.id}`}
      >
        {name}
      </span>
    </button>
  );
};

interface CategoryListProps {
  layout?: 'default' | 'shortcuts' | 'cards';
  key?: any;
}

export const CategoryList = ({ layout = 'cards' }: CategoryListProps) => {
  const { language, t } = useLanguage();
  const { categories, loading: isLoading } = useCategories();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isCards = layout === 'cards';

  const handleViewAll = () => {
    window.location.hash = '#/categories';
  };

  const handleUserInteraction = () => {
    setIsInteracting(true);
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 4000);
  };

  useEffect(() => {
    if (categories.length === 0) return;
    const intervalTime = Math.floor(Math.random() * (4500 - 2000 + 1)) + 2000;
    const timer = setInterval(() => {
      const container = scrollContainerRef.current;
      if (!container || isInteracting) return;

      const currentScroll = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const step = container.clientWidth * 0.4;

      if (maxScroll <= 0) return;

      if (direction === 'right') {
        const nextScroll = currentScroll + step;
        if (nextScroll >= maxScroll - 15) {
          container.scrollTo({ left: maxScroll, behavior: 'smooth' });
          setDirection('left');
        } else {
          container.scrollTo({ left: nextScroll, behavior: 'smooth' });
        }
      } else {
        const nextScroll = currentScroll - step;
        if (nextScroll <= 15) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
          setDirection('right');
        } else {
          container.scrollTo({ left: nextScroll, behavior: 'smooth' });
        }
      }
    }, intervalTime);

    return () => {
      clearInterval(timer);
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, [direction, isInteracting, categories.length]);

  if (isLoading || categories.length === 0) {
    return (
      <section className="px-4 py-4 bg-white border-b border-gray-50 flex gap-4 overflow-hidden">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
            <div className="w-[85px] sm:w-[100px] aspect-square rounded-xl bg-gray-100" />
            <div className="w-12 h-2.5 bg-gray-50 rounded" />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="px-4 py-4 bg-white border-b border-gray-50 relative" id="popular-categories-section">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="flex items-center justify-between mb-4 px-0.5" id="categories-section-header">
        <h2 className="text-base sm:text-lg font-black text-gray-800 tracking-tight font-sans" id="categories-title">
          {language === 'bn' ? 'জনপ্রিয় ক্যাটাগরি' : 'Popular Categories'}
        </h2>
        <button 
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors focus:outline-none cursor-pointer flex items-center gap-1"
          onClick={handleViewAll}
          id="categories-view-all-btn"
        >
          {t('viewAll')}
          <span className="text-[10px]">▶</span>
        </button>
      </div>

      <div 
        ref={scrollContainerRef}
        onScroll={handleUserInteraction}
        onTouchStart={handleUserInteraction}
        onMouseDown={handleUserInteraction}
        className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 hide-scrollbar scroll-smooth"
        id="categories-scroll-container"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => window.location.hash = `#/category/${category.slug}`}
            className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none shrink-0"
            style={{ width: '85px' }}
            id={`cat-card-${category.id}`}
          >
            <div 
              className="w-full aspect-square rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-sm group-hover:border-emerald-200"
            >
              <img 
                src={category.imageUrl} 
                alt={getTranslatedCategoryName(category.name, language)} 
                className="w-full h-full object-cover select-none pointer-events-none"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            <span 
              className="text-[11px] sm:text-xs font-bold text-gray-700 text-center group-hover:text-emerald-600 transition-colors duration-200 line-clamp-1 px-0.5 w-full"
            >
              {getTranslatedCategoryName(category.name, language)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
