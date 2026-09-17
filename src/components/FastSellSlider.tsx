import React, { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const FastSellSlider = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFlashSales();
  }, []);

  const fetchFlashSales = async () => {
    try {
      const res = await fetch('/api/products?type=fast_sell&limit=10');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Fetch flash sales error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAll = () => {
    window.location.hash = 'flash-sale';
  };

  if (isLoading || products.length === 0) {
    return null; // Don't show if no flash sales
  }

  return (
    <section className="px-2 sm:px-4 py-4 mt-2 sm:mt-4 bg-white border-b border-gray-50 relative" id="fast-sell-section">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="flex items-center justify-between mb-3.5 px-1" id="fast-sell-header">
        <div className="flex items-center gap-2" id="fast-sell-title-group">
          <h2 className="text-sm sm:text-base font-extrabold text-gray-800 tracking-wide font-sans" id="fast-sell-title">
            {t('fastSell')}
          </h2>
          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide animate-pulse shadow-3xs" id="fast-sell-live-badge">
            {t('live')}
          </span>
        </div>
        <button 
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors focus:outline-none cursor-pointer"
          onClick={handleViewAll}
          id="fast-sell-view-all-btn"
        >
          {t('viewAll')}
        </button>
      </div>

      <div 
        className="flex items-stretch gap-2 sm:gap-3 overflow-x-auto pb-1 hide-scrollbar scroll-smooth"
        id="fast-sell-products-row"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} isSlider={true} />
        ))}
      </div>
    </section>
  );
};
