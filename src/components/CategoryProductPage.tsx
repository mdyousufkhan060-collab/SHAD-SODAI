import React, { useState, useEffect, useCallback } from 'react';
import { ProductCard } from './ProductCard';
import { ShoppingBag, ChevronRight, LayoutGrid } from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { categoryService, CategoryItem } from '../utils/categoryService';

interface CategoryProductPageProps {
  categorySlug?: string;
}

const getSlugFromUrl = (): string => {
  const hash = window.location.hash || '';
  if (hash.startsWith('#/category/')) {
    return decodeURIComponent(hash.substring('#/category/'.length).split('?')[0].replace(/\/+$/, '')).trim();
  }
  if (hash.startsWith('#/categories/')) {
    return decodeURIComponent(hash.substring('#/categories/'.length).split('?')[0].replace(/\/+$/, '')).trim();
  }
  const path = window.location.pathname || '';
  if (path.startsWith('/category/')) {
    return decodeURIComponent(path.substring('/category/'.length).split('?')[0].replace(/\/+$/, '')).trim();
  }
  if (path.startsWith('/categories/')) {
    return decodeURIComponent(path.substring('/categories/'.length).split('?')[0].replace(/\/+$/, '')).trim();
  }
  return '';
};

export const CategoryProductPage: React.FC<CategoryProductPageProps> = ({ categorySlug }) => {
  const { language } = useLanguage();
  const [slug, setSlug] = useState<string>(() => {
    return categorySlug ? decodeURIComponent(categorySlug).trim() : getSlugFromUrl();
  });

  // Check synchronous cache immediately to avoid blank flash
  const [category, setCategory] = useState<CategoryItem | null>(() => {
    const targetSlug = (categorySlug ? decodeURIComponent(categorySlug).trim() : getSlugFromUrl()).toLowerCase();
    if (!targetSlug) return null;
    return categoryService.getCachedCategories().find(c => 
      c.slug.toLowerCase() === targetSlug || 
      c.id.toLowerCase() === targetSlug ||
      c.name.toLowerCase() === targetSlug
    ) || null;
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [imgError, setImgError] = useState(false);

  // Sync slug on route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const current = categorySlug ? decodeURIComponent(categorySlug).trim() : getSlugFromUrl();
      if (current && current !== slug) {
        setSlug(current);
      }
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [categorySlug, slug]);

  // Main data fetching: Loads both Category metadata & Category Products
  const loadCategoryAndProducts = useCallback(async (targetSlug: string) => {
    if (!targetSlug) return;
    setLoading(true);

    try {
      // 1. Resolve Category Metadata
      let foundCategory = category;

      // If not yet available from cache, fetch it
      if (!foundCategory) {
        foundCategory = await categoryService.getCategoryBySlugOrId(targetSlug);
      }

      // If still not found via specific endpoint, try general category list
      if (!foundCategory) {
        const allCats = await categoryService.fetchCategories();
        const clean = targetSlug.toLowerCase();
        foundCategory = allCats.find(c => 
          c.slug.toLowerCase() === clean || 
          c.id.toLowerCase() === clean || 
          c.name.toLowerCase() === clean
        ) || null;
      }

      if (foundCategory) {
        setCategory(foundCategory);
        document.title = `${foundCategory.name || 'Category'} | SHAD GHOR`;
      }

      // 2. Fetch Products for this Category
      const cleanSlug = foundCategory?.slug || targetSlug;
      let fetchedProducts: Product[] = [];

      try {
        const prodRes = await fetch(`/api/categories/${encodeURIComponent(cleanSlug)}/products?limit=100`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const rawProducts = Array.isArray(prodData) ? prodData : (prodData.products || []);
          fetchedProducts = rawProducts;
        }
      } catch (e) {
        console.warn('Error from /api/categories/:slug/products, trying fallback:', e);
      }

      // Fallback: If 0 products or error, query /api/products directly with category name
      if (fetchedProducts.length === 0 && foundCategory) {
        try {
          const fallbackRes = await fetch(`/api/products?category=${encodeURIComponent(foundCategory.name)}&limit=100`);
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            const rawFallback = Array.isArray(fallbackData) ? fallbackData : (fallbackData.products || []);
            if (rawFallback.length > 0) {
              fetchedProducts = rawFallback;
            }
          }
        } catch (err) {
          console.warn('Fallback product fetch error:', err);
        }
      }

      // Normalize products
      const formattedProducts = fetchedProducts.map((p: any) => ({
        ...p,
        imageUrl: p.image_url || p.imageUrl || '',
        image_url: p.image_url || p.imageUrl || '',
        oldPrice: p.old_price !== undefined ? p.old_price : p.oldPrice,
        old_price: p.old_price !== undefined ? p.old_price : p.oldPrice,
        stock_quantity: p.stock_quantity !== undefined ? p.stock_quantity : 50,
        slug: p.slug || p.id
      }));

      setProducts(formattedProducts);
    } catch (err) {
      console.error('Failed to load category view system:', err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (slug) {
      loadCategoryAndProducts(slug);
    }
  }, [slug, loadCategoryAndProducts]);

  // Image and Name extraction
  const categoryImage = category?.image_url || category?.imageUrl || category?.iconImage || category?.icon_image || category?.image;
  const categoryName = language === 'bn' ? (category?.name_bn || category?.name || '') : (category?.name || '');
  const categoryDesc = language === 'bn' ? (category?.description_bn || category?.description || '') : (category?.description || '');

  // 1. Loading Skeleton (Only shown during initial fetch if category is not in cache)
  if (loading && !category) {
    return (
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-3 sm:py-4 min-h-[60vh]" id="category-loading-skeleton">
        <div className="h-4 w-44 bg-gray-200 animate-pulse rounded mb-4" />
        <div 
          className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 mx-auto aspect-square bg-gray-100 rounded-[6px] animate-pulse mb-3" 
          style={{ aspectRatio: '1 / 1', borderRadius: '6px' }}
        />
        <div className="h-6 w-44 bg-gray-200 rounded mx-auto animate-pulse mb-4" />
        <div className="flex justify-between items-center border-t border-gray-100 pt-3 mb-3 px-1">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className="aspect-[3/4] bg-white border border-gray-100 rounded-[6px] animate-pulse p-2 flex flex-col justify-between" 
              style={{ borderRadius: '6px' }}
            >
              <div className="aspect-square bg-gray-100 rounded-[4px] w-full" />
              <div className="space-y-1.5 mt-2">
                <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Not Found Fallback (If invalid category slug after loading completed)
  if (!category && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center" id="category-not-found">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
          <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h2 className="text-base font-bold text-gray-800 uppercase tracking-tight">
          {language === 'bn' ? 'ক্যাটাগরি পাওয়া যায়নি' : 'Category Not Found'}
        </h2>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
          {language === 'bn' 
            ? 'অনুরোধকৃত ক্যাটাগরি পাওয়া যায়নি অথবা এটি নিষ্ক্রিয় রয়েছে।' 
            : 'The requested category could not be found or is no longer active.'}
        </p>
        <a
          href="#/categories"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-[6px] hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
          id="category-back-btn"
          style={{ borderRadius: '6px' }}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'সকল ক্যাটাগরি দেখুন' : 'View All Categories'}</span>
        </a>
      </div>
    );
  }

  // 3. Category View System Page
  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2.5 sm:py-4 min-h-[70vh]" id="category-details-page">
      
      {/* Breadcrumb Navigation: Home > All Categories > [Category Name] */}
      <nav className="text-xs text-gray-500 mb-3 flex items-center gap-1.5 font-medium select-none" id="category-breadcrumbs">
        <a href="#/" className="hover:text-emerald-600 transition-colors">
          {language === 'bn' ? 'হোম' : 'Home'}
        </a>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <a href="#/categories" className="hover:text-emerald-600 transition-colors">
          {language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}
        </a>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-emerald-800 font-bold truncate max-w-[200px]" id="breadcrumb-current-category">
          {categoryName}
        </span>
      </nav>

      {/* 1. CATEGORY PAGE TOP: 1:1 Compact Square Image */}
      <div 
        className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 mx-auto aspect-square bg-gray-50 rounded-[6px] border border-gray-200/90 overflow-hidden flex items-center justify-center shadow-xs"
        style={{ aspectRatio: '1 / 1', borderRadius: '6px' }}
        id="category-top-image-box"
      >
        {categoryImage && !imgError ? (
          <img 
            src={categoryImage} 
            alt={categoryName}
            aria-label={categoryName}
            className="w-full h-full object-cover select-none pointer-events-none"
            style={{ objectFit: 'cover', aspectRatio: '1 / 1' }}
            onError={() => setImgError(true)}
            id="category-top-image"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-4">
            <ShoppingBag className="w-8 h-8 stroke-[1.25] text-gray-300 mb-1" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{categoryName}</span>
          </div>
        )}
      </div>

      {/* 2. CATEGORY NAME: Bold 700, Center aligned */}
      <div className="mt-2.5 text-center px-2">
        <h1 
          className="text-gray-900 uppercase tracking-tight text-center leading-tight" 
          style={{ fontSize: '24px', fontWeight: 700 }}
          id="category-top-name"
        >
          {categoryName}
        </h1>

        {/* 3. OPTIONAL CATEGORY DESCRIPTION */}
        {categoryDesc !== '' && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto leading-relaxed" id="category-top-desc">
            {categoryDesc}
          </p>
        )}
      </div>

      {/* 4. PRODUCTS SECTION HEADER */}
      <div className="mt-3.5 sm:mt-4 mb-2.5 border-t border-gray-100 pt-2.5 flex items-center justify-between px-1" id="category-products-header">
        <h2 
          className="text-xs sm:text-sm text-gray-800 uppercase tracking-wider font-bold" 
          style={{ fontWeight: 700 }}
          id="category-products-title"
        >
          {language === 'bn' ? 'পণ্যসমূহ' : 'PRODUCTS'}
        </h2>
        <span className="text-xs text-gray-400 font-semibold" id="category-products-count">
          {products.length} {products.length === 1 ? (language === 'bn' ? 'টি পণ্য' : 'item') : (language === 'bn' ? 'টি পণ্য' : 'items')}
        </span>
      </div>

      {/* 5. PRODUCT GRID: Exactly two products per row on mobile, real database products */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5" id="category-products-loading">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className="aspect-[3/4] bg-white border border-gray-100 rounded-[6px] animate-pulse p-2 flex flex-col justify-between" 
              style={{ borderRadius: '6px' }}
            >
              <div className="aspect-square bg-gray-100 rounded-[4px] w-full" />
              <div className="space-y-1.5 mt-2">
                <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* PROPER NO PRODUCTS FOUND STATE */
        <div 
          className="text-center py-12 px-4 bg-white rounded-[6px] border border-gray-150 my-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]" 
          id="category-products-empty"
          style={{ borderRadius: '6px' }}
        >
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
          </div>
          <p className="text-sm sm:text-base font-bold text-gray-800" id="empty-category-title">
            {language === 'bn' ? `${categoryName}-এ কোনো পণ্য পাওয়া যায়নি` : `No products found in ${categoryName}`}
          </p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto" id="empty-category-subtitle">
            {language === 'bn' 
              ? 'খুব শীঘ্রই এই ক্যাটাগরিতে নতুন তাজা পণ্য যুক্ত করা হবে।'
              : 'Fresh items will be added to this category soon. Please explore our other categories.'}
          </p>
          <a
            href="#/categories"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-[6px] hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
            id="empty-category-explore-btn"
          >
            <span>{language === 'bn' ? 'অন্যান্য ক্যাটাগরি দেখুন' : 'Explore All Categories'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      ) : (
        <div 
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5" 
          id="category-products-grid"
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};
