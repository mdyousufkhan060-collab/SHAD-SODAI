import React, { useState, useEffect } from 'react';
import { ChevronRight, SlidersHorizontal, ArrowLeft, LayoutGrid, List } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslatedName } from '../utils/translations';
import { productService } from '../utils/productService';
import { tracking } from '../utils/tracking';
import { Breadcrumbs } from './Breadcrumbs';
import { ProductCard } from './ProductCard';
import { Product } from '../types';

export const BrandProductPage = () => {
  const { language, t } = useLanguage();
  const [brand, setBrand] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');

  const slug = window.location.hash.replace('#/brand/', '').split('?')[0];

  useEffect(() => {
    const fetchBrandData = async () => {
      setLoading(true);
      try {
        // Fetch brand details
        const brandRes = await fetch(`/api/brands/${slug}`);
        if (brandRes.ok) {
          const brandData = await brandRes.json();
          setBrand(brandData);
          
          // Fetch products for this brand
          const productsRes = await fetch(`/api/products?brand=${brandData.name}`);
          if (productsRes.ok) {
            const productsData = await productsRes.json();
            const mappedProducts = (productsData.products || []).map((p: any) => ({
              ...p,
              imageUrl: p.image_url || p.imageUrl,
              oldPrice: p.old_price || p.oldPrice
            }));
            setProducts(mappedProducts);
          }
        }
      } catch (err) {
        console.error('Failed to fetch brand products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandData();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">{language === 'bn' ? 'লোড হচ্ছে...' : 'Loading Brand Products...'}</p>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800">{language === 'bn' ? 'ব্র্যান্ডটি খুঁজে পাওয়া যায়নি' : 'Brand Not Found'}</h2>
        <button 
          onClick={() => window.location.hash = '#/'}
          className="mt-4 text-emerald-600 font-bold"
        >
          {language === 'bn' ? 'হোমপেজে ফিরে যান' : 'Back to Home'}
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 min-h-screen" id="brand-product-page">
      <Breadcrumbs 
        items={[
          { 
            label: language === 'bn' ? 'ব্র্যান্ড' : 'Brands', 
            link: '#/brands' 
          },
          { 
            label: brand.name, 
            active: true 
          }
        ]} 
      />

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
          {brand.name}
        </h1>
        {brand.description && (
          <p className="text-sm text-gray-600 max-w-3xl">
            {brand.description}
          </p>
        )}
      </header>

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-gray-500 ml-2">
              {products.length} {language === 'bn' ? 'টি পণ্য পাওয়া গেছে' : 'Products Found'}
            </span>
          </div>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
          >
            <option value="popular">{language === 'bn' ? 'জনপ্রিয়তা' : 'Popularity'}</option>
            <option value="newest">{language === 'bn' ? 'নতুন পণ্য' : 'Newest'}</option>
            <option value="price-low">{language === 'bn' ? 'মূল্য: কম থেকে বেশি' : 'Price: Low to High'}</option>
            <option value="price-high">{language === 'bn' ? 'মূল্য: বেশি থেকে কম' : 'Price: High to Low'}</option>
          </select>
        </div>

        {products.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4" 
            : "flex flex-col gap-3"
          }>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-gray-500 font-bold">
              {language === 'bn' ? 'এই ব্র্যান্ডের কোনো পণ্য পাওয়া যায়নি।' : 'No products found for this brand.'}
            </p>
          </div>
        )}
      </section>
    </main>
  );
};
