import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, RotateCcw, AlertCircle, RefreshCw, 
  Package, CheckCircle2, Save, Plus, Minus, Edit3, 
  AlertTriangle, X, ArrowUpDown
} from 'lucide-react';
import { adminService } from '../utils/adminService';

interface Product {
  id: string;
  name: string;
  name_bn?: string;
  sku?: string;
  price: number;
  old_price?: number;
  image_url: string;
  category: string;
  brand?: string;
  stock_quantity: number;
  unit?: string;
  status: 'active' | 'inactive' | 'draft';
  variants?: any;
}

interface AdminStockManagementProps {
  language: 'en' | 'bn';
}

// Fallback image component
const ProductImageThumb: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);
  const validUrl = src && typeof src === 'string' && src.trim().length > 0 ? src.trim() : null;

  if (!validUrl || hasError) {
    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400 shrink-0 select-none">
        <Package className="w-5 h-5 stroke-[1.5] text-gray-400" />
        <span className="text-[8px] font-bold text-gray-400 mt-0.5">No Image</span>
      </div>
    );
  }

  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md bg-gray-50 border border-gray-200 overflow-hidden shrink-0 relative flex items-center justify-center">
      <img
        src={validUrl}
        alt={alt}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

// Safe helper for weight/size
const getProductWeight = (prod: Product): string => {
  if (prod.unit && /\d/.test(prod.unit)) return prod.unit;
  if (prod.variants) {
    try {
      const vars = typeof prod.variants === 'string' ? JSON.parse(prod.variants) : prod.variants;
      if (Array.isArray(vars) && vars.length > 0) {
        const def = vars.find((v: any) => v.is_default) || vars[0];
        if (def?.weight && String(def.weight).trim()) return String(def.weight).trim();
        if (def?.name && /\d/.test(def.name)) return String(def.name).trim();
      }
    } catch (e) {
      // ignore
    }
  }
  const match = prod.name.match(/(\d+\s*(?:g|kg|gm|ml|l|liter|litre|pcs|piece|পিস|গ্রাম|কেজি|লিটার))/i);
  if (match) return match[1].trim();
  return prod.unit || '500g';
};

const getProductImageUrl = (prod: Product): string => {
  if (prod.image_url && typeof prod.image_url === 'string' && prod.image_url.trim()) return prod.image_url.trim();
  if ((prod as any).imageUrl && typeof (prod as any).imageUrl === 'string' && (prod as any).imageUrl.trim()) return (prod as any).imageUrl.trim();
  if ((prod as any).image && typeof (prod as any).image === 'string' && (prod as any).image.trim()) return (prod as any).image.trim();
  return '';
};

export const AdminStockManagement: React.FC<AdminStockManagementProps> = ({ language }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  // Editing state
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockInputVal, setStockInputVal] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Quick stats summary
  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchProducts = async (pageToFetch: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', pageToFetch.toString());
      params.set('limit', limit.toString());
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedStockStatus !== 'all') params.set('stock_status', selectedStockStatus);

      const res = await fetch(`/api/admin/products?${params.toString()}`, {
        headers: adminService.getHeaders()
      });

      if (!res.ok) {
        throw new Error('Failed to load products from database');
      }

      const data = await res.json();
      const prodsList: Product[] = data.products || [];
      setProducts(prodsList);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / limit) || 1);
      setPage(data.page || pageToFetch);

      // Extract unique categories
      const distinctCats = Array.from(new Set(prodsList.map(p => p.category).filter(Boolean)));
      setCategories(prev => Array.from(new Set([...prev, ...distinctCats])));
    } catch (err: any) {
      console.error('[Stock Management Fetch Error]', err);
      setError(err.message || 'Failed to connect to database.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch overall stock stats
  const fetchStockStats = async () => {
    try {
      const res = await fetch('/api/admin/products?page=1&limit=500', {
        headers: adminService.getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const allProds: Product[] = data.products || [];
        let inStk = 0;
        let lowStk = 0;
        let outStk = 0;
        allProds.forEach(p => {
          const qty = Number(p.stock_quantity) || 0;
          if (qty === 0) outStk++;
          else if (qty < 15) lowStk++;
          else inStk++;
        });
        setStats({
          total: data.total || allProds.length,
          inStock: inStk,
          lowStock: lowStk,
          outOfStock: outStk
        });
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchProducts(1);
    fetchStockStats();
  }, [selectedCategory, selectedStockStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStockStatus('all');
    setPage(1);
  };

  // Save stock change directly to database
  const handleSaveStock = async (product: Product, newQuantity: number) => {
    const finalQty = Math.max(0, Math.floor(newQuantity));
    setIsUpdating(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/stock`, {
        method: 'PATCH',
        headers: {
          ...adminService.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stock_quantity: finalQty })
      });

      if (!res.ok) {
        throw new Error('Failed to update stock in database');
      }

      // Update state locally
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: finalQty } : p));
      setEditingStockId(null);
      showFeedback(language === 'bn' 
        ? `"${product.name}" এর স্টক সফলভাবে ${finalQty} ইউনিটে আপডেট হয়েছে` 
        : `Stock for "${product.name}" successfully updated to ${finalQty} units`);
      
      fetchStockStats();
    } catch (err: any) {
      alert(err.message || 'Error updating stock');
    } finally {
      setIsUpdating(null);
    }
  };

  const startEditStock = (product: Product) => {
    setEditingStockId(product.id);
    setStockInputVal(Number(product.stock_quantity) || 0);
  };

  return (
    <div className="space-y-3.5 animate-fade-in text-left max-w-7xl mx-auto overflow-x-hidden font-sans pb-16" id="admin-stock-management-root">
      
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div>
          <span className="text-[10px] text-emerald-700 font-bold tracking-widest uppercase block">
            {language === 'bn' ? 'ইনভেন্টরি নিয়ন্ত্রণ' : 'INVENTORY CONTROL'}
          </span>
          <h1 className="text-xl font-black text-gray-900 leading-tight">
            {language === 'bn' ? 'স্টক ম্যানেজমেন্ট' : 'Stock Management'}
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            {language === 'bn' 
              ? 'প্রোডাক্টের স্টক পরিমাণ পরিচালনা ও রিয়েল-টাইম আপডেট করুন' 
              : 'Monitor inventory levels, update stock quantities in real time.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchProducts(page);
              fetchStockStats();
            }}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Refresh Stock List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Stock Metrics Quick Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase block">
            {language === 'bn' ? 'মোট প্রোডাক্ট' : 'Total Products'}
          </span>
          <span className="text-lg font-black text-gray-900 mt-0.5 block">
            {stats.total || total}
          </span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase block">
            {language === 'bn' ? 'পর্যাপ্ত স্টক (১৫+)' : 'In Stock (15+)'}
          </span>
          <span className="text-lg font-black text-emerald-700 mt-0.5 block">
            {stats.inStock}
          </span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-amber-100 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase block">
            {language === 'bn' ? 'স্বল্প স্টক (< ১৫)' : 'Low Stock (< 15)'}
          </span>
          <span className="text-lg font-black text-amber-700 mt-0.5 block">
            {stats.lowStock}
          </span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase block">
            {language === 'bn' ? 'স্টক শেষ (০)' : 'Out of Stock (0)'}
          </span>
          <span className="text-lg font-black text-rose-700 mt-0.5 block">
            {stats.outOfStock}
          </span>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {feedback && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs space-y-2.5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'প্রোডাক্টের নাম বা SKU দিয়ে খুঁজুন...' : 'Search by product name or SKU...'}
              className="w-full text-xs font-semibold pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-900"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            {language === 'bn' ? 'খুঁজুন' : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'bn' ? 'রিসেট' : 'Reset'}</span>
          </button>
        </form>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs font-medium px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 cursor-pointer"
          >
            <option value="all">{language === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
            {categories.map((cat, idx) => (
              <option key={`stock-cat-${cat}-${idx}`} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedStockStatus}
            onChange={(e) => {
              setSelectedStockStatus(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs font-medium px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 cursor-pointer"
          >
            <option value="all">{language === 'bn' ? 'সব স্টক স্ট্যাটাস' : 'All Stock Status'}</option>
            <option value="in_stock">{language === 'bn' ? 'পর্যাপ্ত স্টক (১৫+)' : 'In Stock (15+)'}</option>
            <option value="low_stock">{language === 'bn' ? 'স্বল্প স্টক (< ১৫)' : 'Low Stock (< 15)'}</option>
            <option value="out_of_stock">{language === 'bn' ? 'স্টক শেষ (০)' : 'Out of Stock (0)'}</option>
          </select>
        </div>
      </div>

      {/* 4. Products Stock Listing: COMPACT VERTICAL CARDS (No Horizontal Scroll) */}
      {isLoading ? (
        <div className="bg-white p-10 rounded-lg border border-gray-200 flex flex-col items-center justify-center space-y-2">
          <div className="w-7 h-7 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500">
            {language === 'bn' ? 'স্টক তালিকা লোড হচ্ছে...' : 'Loading stock inventory...'}
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 p-6 rounded-lg border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
          <h3 className="text-xs font-bold text-rose-900">{error}</h3>
          <button 
            type="button"
            onClick={() => fetchProducts(page)}
            className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white p-10 rounded-lg border border-gray-200 text-center space-y-3">
          <Package className="w-9 h-9 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">
            {language === 'bn' ? 'কোনো প্রোডাক্ট পাওয়া যায়নি' : 'No products found'}
          </h3>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 rounded-lg cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 w-full">
          {products.map(prod => {
            const imgUrl = getProductImageUrl(prod);
            const weight = getProductWeight(prod);
            const skuDisplay = prod.sku ? `SKU: ${prod.sku}` : `SKU: SG-${prod.id.slice(-6).toUpperCase()}`;
            const currentStock = Number(prod.stock_quantity) || 0;
            const isOutOfStock = currentStock === 0;
            const isLowStock = currentStock > 0 && currentStock < 15;
            const isEditing = editingStockId === prod.id;
            const isSaving = isUpdating === prod.id;

            return (
              <div 
                key={prod.id}
                className="bg-white border border-gray-200 hover:border-emerald-300 rounded-lg p-2.5 sm:p-3 shadow-2xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 w-full"
              >
                {/* Left & Center: Thumbnail + Details */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <ProductImageThumb src={imgUrl} alt={prod.name} />

                  <div className="min-w-0 flex-1 space-y-0.5">
                    {/* Product Name */}
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <h3 
                        className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate" 
                        title={prod.name}
                      >
                        {prod.name}
                      </h3>
                      {prod.name_bn && prod.name_bn !== prod.name && (
                        <span className="hidden md:inline text-xs text-gray-400 truncate">
                          ({prod.name_bn})
                        </span>
                      )}
                    </div>

                    {/* Meta: Weight / Size, SKU, Category */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-600 font-medium">
                      <span className="font-semibold text-gray-900">{skuDisplay}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-600">{weight}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500">{prod.category}</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-bold text-gray-800">৳{prod.price}</span>
                    </div>

                    {/* Stock Status Badge */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-0.5 rounded border ${
                        isOutOfStock 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : isLowStock 
                          ? 'bg-amber-50 text-amber-800 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isOutOfStock ? 'bg-rose-600' : isLowStock ? 'bg-amber-500' : 'bg-emerald-600'
                        }`} />
                        <span>
                          {isOutOfStock 
                            ? (language === 'bn' ? 'স্টক শেষ' : 'Out of Stock') 
                            : isLowStock 
                            ? (language === 'bn' ? 'স্বল্প স্টক' : 'Low Stock') 
                            : (language === 'bn' ? 'পর্যাপ্ত স্টক' : 'In Stock')}
                        </span>
                      </span>

                      <span className="text-xs font-bold text-gray-700">
                        {language === 'bn' ? 'বর্তমান স্টক' : 'Current Stock'}: <span className="font-black text-gray-900">{currentStock}</span> {language === 'bn' ? 'পিস' : 'units'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Stock Update / Edit Option */}
                <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setStockInputVal(prev => Math.max(0, prev - 1))}
                        className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-200 rounded text-gray-700 flex items-center justify-center cursor-pointer transition-colors"
                        title="-1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={stockInputVal}
                        onChange={(e) => setStockInputVal(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-16 text-center text-xs font-black py-1 bg-white border border-gray-300 rounded focus:outline-hidden focus:border-emerald-500 text-gray-900"
                        autoFocus
                      />

                      <button
                        type="button"
                        onClick={() => setStockInputVal(prev => prev + 1)}
                        className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-200 rounded text-gray-700 flex items-center justify-center cursor-pointer transition-colors"
                        title="+1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveStock(prod, stockInputVal)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'সেভ' : 'SAVE'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingStockId(null)}
                        className="p-1 hover:bg-gray-200 text-gray-500 rounded cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {/* Quick stock badge display with Edit button */}
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Stock Qty</span>
                        <span className="text-sm font-black text-gray-900 block leading-none">{currentStock}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => startEditStock(prod)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'স্টক আপডেট' : 'UPDATE STOCK'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200 text-xs font-medium">
          <div className="text-gray-500 text-[11px] font-bold">
            {language === 'bn' 
              ? `পৃষ্ঠা ${page} / ${totalPages} (মোট ${total} প্রোডাক্ট)` 
              : `Showing page ${page} of ${totalPages} (${total} total products)`}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => {
                const nextP = Math.max(1, page - 1);
                setPage(nextP);
                fetchProducts(nextP);
              }}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-md font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {language === 'bn' ? 'পূর্ববর্তী' : 'Previous'}
            </button>

            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-black rounded-md">
              {page}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => {
                const nextP = Math.min(totalPages, page + 1);
                setPage(nextP);
                fetchProducts(nextP);
              }}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-md font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {language === 'bn' ? 'পরবর্তী' : 'Next'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
