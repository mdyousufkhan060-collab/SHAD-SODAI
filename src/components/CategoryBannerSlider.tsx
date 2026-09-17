import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { DBBanner } from '../types';

export const CategoryBannerSlider = () => {
  const { language } = useLanguage();
  const [banners, setBanners] = useState<DBBanner[]>([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
  const [isLoading, setIsLoading] = useState(true);
  const [intervalTime, setIntervalTime] = useState(3000);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBanners();
    fetchConfig();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/homepage/banners?location=category_banner');
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setBanners(result.data || []);
        }
      }
    } catch (err) {
      console.error('Fetch category banners error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/homepage/sections');
      if (res.ok) {
        const sections = await res.json();
        const catSection = sections.find((s: any) => s.section_key === 'category_banner');
        if (catSection?.config) {
          const config = typeof catSection.config === 'string' ? JSON.parse(catSection.config) : catSection.config;
          if (config.interval) setIntervalTime(config.interval * 1000);
        }
      }
    } catch (err) {
      console.error('Fetch category config error:', err);
    }
  };

  useEffect(() => {
    if (banners.length <= 1 || isDragging) return;
    
    const timer = setInterval(() => {
      setIndex((prev) => {
        let next = prev + direction;
        
        // Alternating logic (Ping-Pong)
        if (next >= banners.length) {
          setDirection(-1);
          return prev - 1;
        }
        if (next < 0) {
          setDirection(1);
          return prev + 1;
        }
        return next;
      });
    }, intervalTime);
    
    return () => clearInterval(timer);
  }, [banners.length, direction, intervalTime, isDragging]);

  if (isLoading || banners.length === 0) return null;

  const activeBanner = banners[index];
  const heading = language === 'bn' ? (activeBanner.heading_bn || activeBanner.heading_en) : activeBanner.heading_en;

  const handleDragEnd = (_: any, info: any) => {
    setIsDragging(false);
    const threshold = 50;
    if (info.offset.x < -threshold) {
      // Swiped Left -> Next
      if (index < banners.length - 1) {
        setIndex(index + 1);
        setDirection(1);
      }
    } else if (info.offset.x > threshold) {
      // Swiped Right -> Prev
      if (index > 0) {
        setIndex(index - 1);
        setDirection(-1);
      }
    }
  };

  return (
    <div className="px-4 py-3 bg-white" id="category-banner-slider">
      <div 
        ref={containerRef}
        className="relative h-24 sm:h-32 md:h-40 w-full overflow-hidden rounded-md bg-gray-50 border border-gray-100 shadow-sm"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 50 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            drag="x"
            dragConstraints={containerRef}
            dragElastic={0.1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
            onClick={() => { 
              if (!isDragging && activeBanner.button_link) {
                window.location.hash = activeBanner.button_link;
              }
            }}
          >
            <picture className="w-full h-full pointer-events-none">
              <source media="(max-width: 640px)" srcSet={activeBanner.image_url_mobile} />
              <img 
                src={activeBanner.image_url_desktop} 
                alt={heading || 'Category Banner'} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </picture>
            
            {heading && (
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center px-6 md:px-10 pointer-events-none">
                <h2 className="text-white text-sm md:text-xl font-bold max-w-[60%] leading-snug drop-shadow-lg">
                  {heading}
                </h2>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Compact Navigation Indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-2 right-4 flex gap-1 z-10">
            {banners.map((_, i) => (
              <button 
                key={i}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                className={`w-1.5 h-1.5 rounded-none transition-all ${i === index ? 'bg-white w-4' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
