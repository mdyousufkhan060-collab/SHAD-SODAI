import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DBBanner } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const HeroSlider: React.FC = () => {
  const { language } = useLanguage();
  const [banners, setBanners] = useState<DBBanner[]>([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [intervalTime, setIntervalTime] = useState(5000);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannersRes, sectionsRes] = await Promise.all([
          fetch('/api/homepage/banners?location=homepage_hero'),
          fetch('/api/homepage/sections')
        ]);
        
        if (bannersRes.ok) {
          const json = await bannersRes.json();
          const bannerData = json.success ? json.data : json;
          if (Array.isArray(bannerData)) {
            setBanners(bannerData.filter((b: DBBanner) => b.status === 'active').sort((a: any, b: any) => a.sort_order - b.sort_order));
          }
        }

        if (sectionsRes.ok) {
          const sections = await sectionsRes.json();
          const heroSection = sections.find((s: any) => s.section_key === 'hero_slider');
          if (heroSection?.config) {
            const config = typeof heroSection.config === 'string' ? JSON.parse(heroSection.config) : heroSection.config;
            if (config.interval) setIntervalTime(config.interval * 1000);
          }
        }
      } catch (err) {
        console.error('Failed to fetch hero slider:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (banners.length <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % banners.length);
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, intervalTime, isHovered]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setDirection(1);
        setIndex((prev) => (prev + 1) % banners.length);
      } else {
        setDirection(-1);
        setIndex((prev) => (prev - 1 + banners.length) % banners.length);
      }
    }
    touchStartX.current = null;
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.45, ease: 'easeOut' }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      transition: { duration: 0.45, ease: 'easeIn' }
    })
  };

  if (isLoading) {
    return (
      <div className="px-2.5 sm:px-3 pt-0.5 pb-2 bg-white max-w-7xl mx-auto w-full">
        <div 
          className="w-full aspect-[16/9] max-h-[380px] overflow-hidden rounded-[6px] bg-gray-100 animate-pulse border border-gray-200/80 shadow-xs" 
          style={{ aspectRatio: '16 / 9', borderRadius: '6px' }}
        />
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const activeBanner = banners[index];
  const heading = activeBanner.heading_en || activeBanner.heading_bn || '';
  const description = activeBanner.description_en || activeBanner.description_bn || '';
  const buttonText = activeBanner.button_text_en || activeBanner.button_text_bn || 'Shop Now';

  return (
    <div 
      className="px-2.5 sm:px-3 pt-0.5 pb-2 bg-white max-w-7xl mx-auto w-full" 
      id="hero-slider-section"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="relative w-full aspect-[16/9] max-h-[380px] overflow-hidden rounded-[6px] bg-gray-50 border border-gray-200/80 shadow-xs"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        id="hero-slider-viewport"
        style={{ aspectRatio: '16 / 9', borderRadius: '6px' }}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full flex items-center justify-center"
            id={`hero-slide-container-${activeBanner.id}`}
          >
            {/* Background Image - 16:9 format with object-fit: cover */}
            <picture className="w-full h-full">
              <source media="(max-width: 640px)" srcSet={activeBanner.image_url_mobile || activeBanner.image_url_desktop} />
              <img 
                src={activeBanner.image_url_desktop || activeBanner.image_url_mobile} 
                alt=""
                aria-label={heading}
                className="w-full h-full object-cover select-none pointer-events-none"
                style={{ objectFit: 'cover' }}
                loading={index === 0 ? "eager" : "lazy"}
                id={`hero-slide-img-${activeBanner.id}`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&h=900&fit=crop";
                }}
              />
            </picture>

            {/* Content Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent flex flex-col justify-center px-4 sm:px-10 text-white" id="hero-slide-overlay">
              {heading && (
                <h2 className="text-base sm:text-2xl md:text-3xl font-extrabold max-w-xs sm:max-w-md leading-tight drop-shadow-md" id="hero-slide-title">
                  {heading}
                </h2>
              )}
              {description && (
                <p className="hidden sm:block text-xs md:text-sm text-gray-200 mt-1.5 max-w-xs sm:max-w-md line-clamp-2 drop-shadow-sm font-medium" id="hero-slide-desc">
                  {description}
                </p>
              )}
              {buttonText && (
                <button 
                  onClick={() => { if (activeBanner.button_link) window.location.hash = activeBanner.button_link; }}
                  className="mt-2.5 sm:mt-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-xs px-4 py-1.5 sm:px-5 sm:py-2 rounded-[4px] transition-all w-max cursor-pointer active:scale-95 shadow-sm"
                  id="hero-slide-cta-btn"
                  style={{ borderRadius: '4px' }}
                >
                  {buttonText}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Indicator dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10" id="hero-slide-dots">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
