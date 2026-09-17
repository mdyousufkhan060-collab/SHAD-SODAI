import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { getTranslatedCategoryName } from '../utils/translations';

interface Props {
  categoryName: string;
  products: Product[];
  viewAllLink: string;
  key?: string;
}

export const CategoryProductSection = ({ categoryName, products, viewAllLink }: Props) => {
  const { language, t } = useLanguage();
  // Show exactly 4 products initially
  const displayProducts = products.slice(0, 4);

  const handleViewAll = () => {
    window.location.hash = viewAllLink;
    console.log(`Navigating to ${viewAllLink}`);
  };

  return (
    <section className="px-2.5 sm:px-4 py-3 bg-white" id={`category-section-${categoryName}`}>
      {/* Header with Title and View All */}
      <div className="flex items-center justify-between mb-2.5 px-0.5" id={`category-header-${categoryName}`}>
        <h2 className="text-sm sm:text-base font-extrabold text-gray-800 tracking-wide font-sans">
          {getTranslatedCategoryName(categoryName, language)}
        </h2>
        <button
          onClick={handleViewAll}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors focus:outline-none cursor-pointer"
          id={`category-view-all-${categoryName}`}
        >
          {t('viewAll')}
        </button>
      </div>

      {/* Grid: Exactly 2 columns on mobile (no double card look, very small gaps) */}
      <div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1.5 gap-y-2.5 sm:gap-4 justify-items-center"
        id={`category-grid-${categoryName}`}
      >
        {displayProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
