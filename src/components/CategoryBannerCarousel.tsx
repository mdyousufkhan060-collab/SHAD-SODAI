import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCategories, CategoryItem } from '../utils/categoryService';

interface CategoryItemProps {
  category: CategoryItem;
  onItemClick: (e: React.MouseEvent) => void;
}

const CategorySquareCard: React.FC<CategoryItemProps> = ({ category, onItemClick }) => {
  const { language } = useLanguage();
  const [imgError, setImgError] = useState(false);
  
  // Robust image mapping from database fields
  const categoryImage = category.image_url || category.imageUrl || category.iconImage || category.icon_image || category.image;
  const displayName = language === 'bn' ? (category.name_bn || category.name) : category.name;
  const catRoute = `#/category/${category.slug || category.id}`;

  return (
    <a
      href={catRoute}
      onClick={onItemClick}
      className="w-[92px] sm:w-[100px] md:w-[108px] shrink-0 cursor-pointer select-none group flex flex-col items-center focus:outline-none"
      id={`category-square-item-${category.id}`}
      title={displayName}
    >
      {/* 1:1 Small Square Image Container with 6px radius */}
      <div 
        className="w-full aspect-square bg-[#f9fafb] rounded-[6px] border border-gray-200/90 overflow-hidden flex items-center justify-center group-hover:border-emerald-600 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] group-hover:shadow-sm"
        style={{ aspectRatio: '1 / 1', borderRadius: '6px' }}
        id={`category-square-img-box-${category.id}`}
      >
        {categoryImage && !imgError ? (
          <img 
            src={categoryImage} 
            alt={displayName}
            aria-label={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
            style={{ objectFit: 'cover', aspectRatio: '1 / 1' }}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            id={`category-square-img-${category.id}`}
          />
        ) : (
          /* Clean, subtle fallback placeholder if no image exists or if broken */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300 p-2">
            <ShoppingBag className="w-5 h-5 text-gray-300 mb-1" />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-full">
              {displayName}
            </span>
          </div>
        )}
      </div>

      {/* Category Name: Directly below the image, clean uppercase text */}
      <div className="mt-1.5 px-0.5 text-center w-full">
        <span 
          className="text-[11px] sm:text-xs font-bold text-gray-800 uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors"
          id={`category-square-name-${category.id}`}
        >
          {displayName}
        </span>
      </div>
    </a>
  );
};

export const CategoryBannerCarousel: React.FC = () => {
  const { language } = useLanguage();
  const { categories, loading } = useCategories();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const scrollStartLeftRef = useRef(0);

  // Pause auto-scroll for 5 seconds upon user interaction
  const pauseAutoMovement = () => {
    isPausedRef.current = true;
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 5000);
  };

  // Continuous seamless loop movement: RIGHT -> LEFT
  useEffect(() => {
    if (categories.length < 2) return;

    let animId: number;
    let lastTime = performance.now();
    const speed = 26; // Smooth right-to-left glide
    const repeatCount = Math.max(3, Math.ceil(24 / Math.max(categories.length, 1)));

    const step = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (!isPausedRef.current && scrollRef.current && !isDraggingRef.current) {
        const el = scrollRef.current;
        const singleSetWidth = el.scrollWidth / repeatCount;

        if (singleSetWidth > 0) {
          el.scrollLeft += speed * delta;
          // When we pass the first set of items, seamlessly wrap back by singleSetWidth
          if (el.scrollLeft >= singleSetWidth * (repeatCount - 1)) {
            el.scrollLeft -= singleSetWidth;
          } else if (el.scrollLeft <= 0) {
            el.scrollLeft += singleSetWidth;
          }
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [categories.length]);

  // Mouse drag support with click threshold
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    pauseAutoMovement();
    if (!scrollRef.current) return;
    dragStartXRef.current = e.pageX - scrollRef.current.offsetLeft;
    dragDistanceRef.current = 0;
    scrollStartLeftRef.current = scrollRef.current.scrollLeft;
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current || dragStartXRef.current === 0) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const dist = Math.abs(x - dragStartXRef.current);
    dragDistanceRef.current = dist;

    // Only activate drag mode if movement is distinctly greater than 6px
    if (dist > 6) {
      isDraggingRef.current = true;
      pauseAutoMovement();
      const walk = (x - dragStartXRef.current) * 1.2;
      scrollRef.current.scrollLeft = scrollStartLeftRef.current - walk;
    }
  };

  const handleMouseUpOrLeave = () => {
    dragStartXRef.current = 0;
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  const handleCategoryClick = (cat: CategoryItem, e: React.MouseEvent) => {
    // If user actually dragged significantly, prevent navigation
    if (isDraggingRef.current || dragDistanceRef.current > 8) {
      e.preventDefault();
      return;
    }

    pauseAutoMovement();
    const slug = cat.slug || cat.id;
    window.location.hash = `#/category/${slug}`;
  };

  if (loading && categories.length === 0) {
    // Elegant localized skeleton placeholder instead of null or blank screen
    return (
      <section className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-white max-w-7xl mx-auto w-full border-b border-gray-100" id="homepage-category-section-skeleton">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <div className="h-4 w-36 bg-gray-200 animate-pulse rounded" />
          <div className="h-3 w-16 bg-gray-100 animate-pulse rounded" />
        </div>
        <div className="flex items-start gap-2 sm:gap-2.5 overflow-hidden py-0.5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="w-[92px] sm:w-[100px] shrink-0 flex flex-col items-center">
              <div className="w-full aspect-square bg-gray-100 animate-pulse rounded-[6px]" />
              <div className="w-16 h-2.5 bg-gray-100 animate-pulse rounded mt-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  // Duplicate items into 3+ sets so loop is endlessly seamless without sudden jump
  const repeatCount = Math.max(3, Math.ceil(24 / Math.max(categories.length, 1)));
  const displayCategories = Array.from({ length: repeatCount }).flatMap(() => categories);

  return (
    <section className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-white max-w-7xl mx-auto w-full border-b border-gray-100" id="homepage-category-section">
      {/* Header with Title and View All */}
      <div className="flex items-center justify-between mb-1.5 px-0.5" id="category-section-header">
        <h2 className="text-xs sm:text-sm font-extrabold text-gray-900 tracking-tight font-sans uppercase" id="category-section-title">
          {language === 'bn' ? 'ক্যাটাগরি অনুযায়ী কেনাকাটা' : 'Shop by Category'}
        </h2>
        <a
          href="#/categories"
          className="text-[11px] sm:text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors focus:outline-none cursor-pointer flex items-center gap-0.5"
          id="category-section-view-all"
        >
          <span>{language === 'bn' ? 'সবগুলো দেখুন' : 'View All'}</span>
          <span className="text-sm leading-none">›</span>
        </a>
      </div>

      {/* Auto-moving Horizontal Carousel with small square items (90px-110px) */}
      <div 
        ref={scrollRef}
        className="flex items-start gap-2 sm:gap-2.5 overflow-x-auto hide-scrollbar select-none py-0.5 cursor-grab active:cursor-grabbing"
        id="category-carousel-viewport"
        onMouseEnter={() => { isPausedRef.current = true; }}
        onMouseLeave={() => { isPausedRef.current = false; handleMouseUpOrLeave(); }}
        onTouchStart={pauseAutoMovement}
        onTouchMove={pauseAutoMovement}
        onTouchEnd={pauseAutoMovement}
        onWheel={pauseAutoMovement}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
      >
        {displayCategories.map((cat, idx) => (
          <CategorySquareCard
            key={`${cat.id}-${idx}`}
            category={cat}
            onItemClick={(e) => handleCategoryClick(cat, e)}
          />
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
