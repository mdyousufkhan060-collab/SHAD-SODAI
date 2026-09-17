import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { DBBanner } from '../types';

interface PromotionalBannerProps {
  location: 'homepage_promo' | 'category_banner' | 'offer_banner';
  className?: string;
}

export const PromotionalBanner: React.FC<PromotionalBannerProps> = ({ location, className = "" }) => {
  const { language } = useLanguage();
  const [banners, setBanners] = useState<DBBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`/api/homepage/banners?location=${location}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setBanners(result.data || []);
          }
        }
      } catch (err) {
        console.error(`Fetch banners for ${location} error:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, [location]);

  if (isLoading || banners.length === 0) {
    if (isLoading) {
      return (
        <div className={`px-4 py-3 ${className}`}>
          <div className="h-40 w-full rounded-2xl bg-gray-100 animate-pulse" />
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`px-4 py-3 space-y-4 ${className}`} id={`promotional-banner-${location}`}>
      {banners.map((banner) => {
        const heading = language === 'bn' ? (banner.heading_bn || banner.heading_en) : banner.heading_en;
        const description = language === 'bn' ? (banner.description_bn || banner.description_en) : banner.description_en;
        const buttonText = language === 'bn' ? (banner.button_text_bn || banner.button_text_en) : banner.button_text_en;

        const handleClick = () => {
          if (banner.button_link) {
            window.location.hash = banner.button_link.startsWith('/') ? banner.button_link : `#/${banner.button_link}`;
          }
        };

        return (
          <div 
            key={banner.id}
            onClick={handleClick}
            className="group relative h-40 sm:h-52 w-full overflow-hidden rounded-2xl bg-emerald-900 cursor-pointer shadow-lg shadow-emerald-900/10"
            id={`banner-item-${banner.id}`}
          >
            {/* Background Image */}
            <picture className="absolute inset-0 w-full h-full">
              <source media="(max-width: 640px)" srcSet={banner.image_url_mobile} />
              <img 
                src={banner.image_url_desktop} 
                alt={banner.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop";
                }}
              />
            </picture>

            {/* Overlay */}
            <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/30 to-transparent flex flex-col justify-center px-6 sm:px-10 text-white">
              {heading && (
                <h3 className="text-lg sm:text-xl font-black max-w-[200px] sm:max-w-xs leading-tight drop-shadow-md">
                  {heading}
                </h3>
              )}
              {description && (
                <p className="text-[10px] sm:text-xs text-gray-200 mt-1 max-w-[180px] sm:max-w-xs line-clamp-2 drop-shadow-sm font-medium">
                  {description}
                </p>
              )}
              {buttonText && (
                <button 
                  className="mt-3 bg-white text-emerald-900 font-black text-[10px] sm:text-xs px-4 py-2 rounded-lg transition-all w-max shadow-lg active:scale-95"
                >
                  {buttonText}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
