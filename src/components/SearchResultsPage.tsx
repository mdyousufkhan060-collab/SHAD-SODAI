import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, LayoutGrid, List, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ProductCard } from './ProductCard';
import { Breadcrumbs } from './Breadcrumbs';
import { Product } from '../types';

export const SearchResultsPage = () => {
  const { language, t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const getQuery = () => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    return params.get('q') || '';
  };
  
  const [query, setQuery] = useState(getQuery());

  useEffect(() => {
    const handleHashChange = () => {
      setQuery(getQuery());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          const mappedProducts = (data.products || []).map((p: any) => ({
            ...p,
            imageUrl: p.image_url || p.imageUrl,
            image_url: p.image_url || p.imageUrl,
            oldPrice: p.old_price !== undefined ? p.old_price : p.oldPrice,
            old_price: p.old_price !== undefined ? p.old_price : p.oldPrice,
            stock_quantity: p.stock_quantity !== undefined ? p.stock_quantity : 50,
            slug: p.slug || p.id
          }));
          setProducts(mappedProducts);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 min-h-screen" id="search-results-page">
      <Breadcrumbs 
        items={[
          { 
            label: language === 'bn' ? 'সার্চ রেজাল্ট' : 'Search Results', 
            active: true 
          }
        ]} 
      />

      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
              <Search className="w-8 h-8 text-emerald-600" />
              {language === 'bn' ? `"${query}" এর জন্য ফলাফল` : `Results for "${query}"`}
            </h1>
            <p className="text-sm text-gray-500 font-bold mt-1">
              {products.length} {language === 'bn' ? 'টি পণ্য পাওয়া গেছে' : 'Products found matching your search.'}
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm self-start">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 font-bold">{language === 'bn' ? 'খোঁজা হচ্ছে...' : 'Searching products...'}</p>
        </div>
      ) : products.length > 0 ? (
        <section className={viewMode === 'grid' 
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6" 
          : "flex flex-col gap-4"
        }>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      ) : (
        <section className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {language === 'bn' ? 'কিছু পাওয়া যায়নি!' : 'No results found!'}
          </h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            {language === 'bn' ? `দুঃখিত, "${query}" সংক্রান্ত কোনো পণ্য আমাদের স্টোরে নেই। ভিন্ন কোনো শব্দ দিয়ে চেষ্টা করুন।` : `Sorry, we couldn't find any products matching "${query}". Please try a different search term.`}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              onClick={() => window.location.hash = '#/'}
              className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl"
            >
              {language === 'bn' ? 'হোমপেজে ফিরে যান' : 'Back to Home'}
            </button>
            <button 
              onClick={() => window.location.hash = '#/categories'}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 text-xs font-black rounded-xl"
            >
              {language === 'bn' ? 'সব ক্যাটাগরি দেখুন' : 'View Categories'}
            </button>
          </div>
        </section>
      )}
    </main>
  );
};
