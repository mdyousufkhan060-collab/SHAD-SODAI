import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { useLanguage } from '../context/LanguageContext';

interface ProductSectionProps {
  titleEn: string;
  titleBn: string;
  type?: 'new_arrivals' | 'best_sellers' | 'featured' | 'category';
  categoryName?: string;
  limit?: number;
  viewAllLink: string;
}

export const ProductSection: React.FC<ProductSectionProps> = ({ 
  titleEn, 
  titleBn, 
  type, 
  categoryName, 
  limit = 4,
  viewAllLink
}) => {
  const { language, t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [type, categoryName, limit]);

  const fetchProducts = async () => {
    setIsLoading(true);
    let url = `/api/products?limit=${limit}`;
    if (type) url += `&type=${type}`;
    if (categoryName) url += `&category=${encodeURIComponent(categoryName || '')}`;
    
    console.log('[ProductSection] Fetching products from:', url);
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        console.log('[ProductSection] Received products for url', url, ':', data);
        const rawProducts = Array.isArray(data) ? data : (data.products || []);
        const formatted = rawProducts.map((p: any) => ({
          ...p,
          imageUrl: p.image_url || p.imageUrl || '',
          image_url: p.image_url || p.imageUrl || '',
          oldPrice: p.old_price !== undefined ? p.old_price : p.oldPrice,
          old_price: p.old_price !== undefined ? p.old_price : p.oldPrice,
          stock_quantity: p.stock_quantity !== undefined ? p.stock_quantity : 50,
          slug: p.slug || p.id
        }));
        // Strictly limit to 4 for Home Page preview as per CRITICAL requirement
        setProducts(formatted.slice(0, 4));
      } else {
        console.error('[ProductSection] Fetch failed:', res.statusText);
      }
    } catch (err) {
      console.error('[Fetch products error]:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || products.length === 0) {
    if (isLoading) {
      return (
        <section className="px-2.5 sm:px-4 py-3 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-16 bg-gray-50 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-[4/5] bg-gray-100 rounded-[6px] animate-pulse" />
            ))}
          </div>
        </section>
      );
    }
    return null;
  }

  const handleViewAll = () => {
    // Ensure consistent hash routing for category pages
    const link = viewAllLink.startsWith('#/') ? viewAllLink : `#/${viewAllLink}`;
    window.location.hash = link;
  };

  return (
    <section className="px-2.5 sm:px-4 py-3.5 sm:py-5 bg-white border-b border-gray-100 last:border-0" id={`product-section-${type || categoryName}`}>
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight font-sans uppercase">
          {language === 'bn' ? titleBn : titleEn}
        </h2>
        <button
          onClick={handleViewAll}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors focus:outline-none cursor-pointer flex items-center gap-0.5"
        >
          <span>{language === 'bn' ? 'সব দেখুন' : 'View All'}</span>
          <span className="text-base leading-none">›</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
