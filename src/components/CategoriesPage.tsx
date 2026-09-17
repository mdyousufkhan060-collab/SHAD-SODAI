import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, ChevronRight, Grid, RefreshCw, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { useCategories } from '../utils/categoryService';

interface DBCategory {
  id: string;
  name: string;
  name_bn?: string;
  slug: string;
  image?: string;
  image_url?: string;
  imageUrl?: string;
  iconImage?: string;
  icon_image?: string;
  description?: string;
  description_bn?: string;
  sort_order?: number;
  sortOrder?: number;
  displayOrder?: number;
  status: string;
  product_count?: number;
}

interface CategoryCardItemProps {
  category: DBCategory;
  language: string;
  onItemClick: (slug: string) => void;
}

const CategoryPageCard: React.FC<CategoryCardItemProps> = ({ category, language, onItemClick }) => {
  const [imgError, setImgError] = useState(false);
  const categoryName = language === 'bn' ? (category.name_bn || category.name) : category.name;
  const categoryImage = category.image_url || category.imageUrl || category.iconImage || category.icon_image || category.image;

  return (
    <motion.button
      onClick={() => onItemClick(category.slug)}
      className="group flex flex-col bg-white rounded-[6px] border border-gray-200 hover:border-emerald-600 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer text-left focus:outline-none"
      style={{ borderRadius: '6px' }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      id={`category-card-${category.slug}`}
    >
      {/* 1:1 Compact Square Image Box */}
      <div 
        className="w-full aspect-square bg-[#f9fafb] overflow-hidden relative border-b border-gray-100 flex items-center justify-center"
        style={{ aspectRatio: '1 / 1' }}
        id={`category-card-img-box-${category.id}`}
      >
        {categoryImage && !imgError ? (
          <img
            src={categoryImage}
            alt={categoryName}
            aria-label={categoryName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
            style={{ objectFit: 'cover', aspectRatio: '1 / 1' }}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            id={`category-card-img-${category.id}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300 p-4">
            <ShoppingBag className="w-8 h-8 text-gray-300 mb-1" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-[90%]">
              {categoryName}
            </span>
          </div>
        )}
      </div>

      {/* Category Name: Compact, clean, centered, uniform font */}
      <div className="py-2.5 px-2 flex flex-col items-center justify-center text-center flex-1 bg-white" id={`category-card-label-${category.id}`}>
        <h3 className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-emerald-700 transition-colors uppercase tracking-tight line-clamp-1">
          {categoryName}
        </h3>
        {category.product_count !== undefined && category.product_count > 0 && (
          <span className="text-[10px] text-gray-400 font-medium mt-0.5">
            {category.product_count} {language === 'bn' ? 'টি পণ্য' : 'products'}
          </span>
        )}
      </div>
    </motion.button>
  );
};

export const CategoriesPage = () => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const { categories, loading } = useCategories();

  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      (cat.name_bn && cat.name_bn.toLowerCase().includes(q))
    );
  });

  // Clicking a category navigates directly to its own product listing page
  const handleCategoryClick = (slug: string) => {
    window.location.hash = `#/category/${slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25 }}
      className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 min-h-screen"
      id="categories-page-container"
    >
      {/* 1. Header Section: Brand, Breadcrumb, Title & Subtitle */}
      <div className="mb-5 pb-4 border-b border-gray-100" id="categories-header-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {/* Store Name & Breadcrumbs: Home > All Categories */}
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1" id="categories-brand-label">
              SHAD GHOR
            </div>
            <nav className="text-xs text-gray-500 mb-2 flex items-center gap-1.5 font-medium" id="categories-breadcrumbs">
              <a href="#/" className="hover:text-emerald-600 transition-colors">Home</a>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-emerald-700 font-bold">
                {language === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories'}
              </span>
            </nav>

            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2" id="categories-main-title">
              <Grid className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              <span>{language === 'bn' ? 'পণ্য ক্যাটাগরি সমূহ' : 'Product Categories'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {language === 'bn' 
                ? 'আমাদের খাঁটি ও প্রাকৃতিক খাদ্য সামগ্রীর সংগ্রহ ব্রাউজ করুন...' 
                : 'Browse our collection of 100% pure, natural, and organic items...'}
            </p>
          </div>

          {/* Search Categories Input */}
          <div className="relative w-full sm:w-72 md:w-80 mt-1 sm:mt-0" id="categories-search-box">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'ক্যাটাগরি খুঁজুন...' : 'Search categories...'}
              className="w-full pl-9 pr-8 py-2.5 bg-gray-50/80 text-xs text-gray-800 rounded-[6px] border border-gray-200 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all placeholder-gray-400 shadow-3xs"
              style={{ borderRadius: '6px' }}
              id="categories-local-search-input"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-3 text-xs text-gray-400 hover:text-gray-600 focus:outline-none font-bold cursor-pointer"
                id="categories-clear-search-btn"
                aria-label="Clear Search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Category Cards Grid (NO promotional banners mixed in!) */}
      {loading ? (
        /* Symmetrical 2-column skeleton matching the target grid */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4" id="categories-loading-skeleton">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-[6px] border border-gray-150 overflow-hidden animate-pulse p-0"
              style={{ borderRadius: '6px' }}
            >
              <div className="aspect-square bg-gray-100 w-full" />
              <div className="p-2.5 flex flex-col items-center">
                <div className="h-3.5 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[6px] border border-gray-150 p-8" id="categories-empty-state" style={{ borderRadius: '6px' }}>
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-gray-700">
            {language === 'bn' ? 'কোনো ক্যাটাগরি পাওয়া যায়নি!' : 'No categories found!'}
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            {language === 'bn' 
              ? 'ভিন্ন বানানে চেষ্টা করুন।' 
              : 'Try searching with different keywords.'}
          </p>
          <button
            onClick={handleClearSearch}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-[6px] hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-3xs"
            id="categories-reset-btn"
            style={{ borderRadius: '6px' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'সব ক্যাটাগরি দেখুন' : 'Show All Categories'}</span>
          </button>
        </div>
      ) : (
        /* Exactly 2 cards per row on mobile: 1 → 2, 3 → 4, 5 → 6 in database sequence order */
        <div 
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4" 
          id="categories-cards-grid"
        >
          {filteredCategories.map((category) => (
            <CategoryPageCard
              key={category.id}
              category={category}
              language={language}
              onItemClick={handleCategoryClick}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

