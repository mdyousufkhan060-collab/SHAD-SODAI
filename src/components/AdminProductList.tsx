import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Edit3, ChevronLeft, ChevronRight, 
  RotateCcw, AlertCircle, Plus, Copy, Trash2, 
  ExternalLink, CheckCircle2, XCircle, 
  RefreshCw, Package, AlertTriangle
} from 'lucide-react';
import { adminService } from '../utils/adminService';

interface Product {
  id: string;
  name: string;
  name_bn?: string;
  sku?: string;
  price: number;
  old_price?: number;
  cost_price?: number;
  buying_price?: number;
  image_url: string;
  category: string;
  brand?: string;
  rating?: number;
  badge?: string;
  stock_quantity: number;
  unit?: string;
  status: 'active' | 'inactive' | 'draft';
  created_at?: string;
  slug?: string;
  variants?: any;
}

interface AdminProductListProps {
  language: 'en' | 'bn';
  navigateTo: (hash: string, tab: string) => void;
}

// Robust Image Component with Fallback to prevent any broken / blank image issues
const ProductImageThumb: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);

  // Clean URL string and test validity
  const validUrl = src && typeof src === 'string' && src.trim().length > 0 ? src.trim() : null;

  if (!validUrl || hasError) {
    return (
      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-md bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400 shrink-0 select-none">
        <Package className="w-6 h-6 stroke-[1.5] text-gray-400" />
        <span className="text-[8px] font-bold text-gray-400 mt-0.5">No Image</span>
      </div>
    );
  }

  return (
    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-md bg-gray-50 border border-gray-200 overflow-hidden shrink-0 relative flex items-center justify-center">
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

// Helper to safely extract weight/size from product data
const getProductWeight = (prod: Product): string => {
  if (prod.unit && /\d/.test(prod.unit)) {
    return prod.unit;
  }
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
  if ((prod as any).specifications) {
    try {
      const specs = typeof (prod as any).specifications === 'string' ? JSON.parse((prod as any).specifications) : (prod as any).specifications;
      if (specs?.['Net Weight']) return String(specs['Net Weight']).trim();
      if (specs?.['Weight']) return String(specs['Weight']).trim();
    } catch (e) {
      // ignore
    }
  }
  const match = prod.name.match(/(\d+\s*(?:g|kg|gm|ml|l|liter|litre|pcs|piece|পিস|গ্রাম|কেজি|লিটার))/i);
  if (match) {
    return match[1].trim();
  }
  return prod.unit || '500g';
};

// Helper to resolve product image from various possible database fields
const getProductImageUrl = (prod: Product): string => {
  if (prod.image_url && typeof prod.image_url === 'string' && prod.image_url.trim()) return prod.image_url.trim();
  if ((prod as any).imageUrl && typeof (prod as any).imageUrl === 'string' && (prod as any).imageUrl.trim()) return (prod as any).imageUrl.trim();
  if ((prod as any).image && typeof (prod as any).image === 'string' && (prod as any).image.trim()) return (prod as any).image.trim();
  if ((prod as any).gallery) {
    try {
      const gal = typeof (prod as any).gallery === 'string' ? JSON.parse((prod as any).gallery) : (prod as any).gallery;
      if (Array.isArray(gal) && gal.length > 0 && typeof gal[0] === 'string' && gal[0].trim()) {
        return gal[0].trim();
      }
    } catch (e) {
      // ignore
    }
  }
  return '';
};

export const AdminProductList: React.FC<AdminProductListProps> = ({ language, navigateTo }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Deletion modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status toggle tracking
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchProducts = async (currentPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
        search: searchQuery,
        category: selectedCategory,
        brand: selectedBrand,
        stock_status: selectedStockStatus,
        status: selectedStatus
      });

      const response = await fetch(`/api/admin/products?${params.toString()}`, {
        headers: adminService.getHeaders()
      });

      if (!response.ok) {
        throw new Error(language === 'bn' 
          ? 'সার্ভার থেকে প্রোডাক্ট তালিকা লোড করতে ব্যর্থ হয়েছে।' 
          : 'Failed to fetch products from backend MySQL database.');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(data.page || 1);
      
      if (data.categories) {
        setCategories(Array.from(new Set((data.categories as string[]).map(c => String(c).trim()).filter(Boolean))));
      }
      if (data.brands) {
        setBrands(Array.from(new Set((data.brands as string[]).map(b => String(b).trim()).filter(Boolean))));
      }

    } catch (err: any) {
      console.error('[Admin Product List Error]', err);
      setError(err.message || 'Database connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [selectedCategory, selectedBrand, selectedStockStatus, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedStockStatus('all');
    setSelectedStatus('all');
  };

  // Quick Status Toggle (Live <-> Inactive)
  const handleToggleStatus = async (product: Product) => {
    const nextStatus = product.status === 'active' ? 'inactive' : 'active';
    setTogglingId(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...adminService.getHeaders()
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: nextStatus } : p));
        setActionFeedback(language === 'bn' ? `স্ট্যাটাস পরিবর্তিত হয়েছে (${nextStatus})` : `Status updated to ${nextStatus}`);
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Duplicate Product
  const handleDuplicate = async (product: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}/duplicate`, {
        method: 'POST',
        headers: adminService.getHeaders()
      });
      if (res.ok) {
        setActionFeedback(language === 'bn' ? 'প্রোডাক্টের কপি সফলভাবে তৈরি হয়েছে।' : 'Cloned product saved as draft.');
        setTimeout(() => setActionFeedback(null), 3000);
        fetchProducts(page);
      }
    } catch (err) {
      console.error('Failed to duplicate product', err);
    }
  };

  // Delete Product
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: adminService.getHeaders()
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
        setTotal(prev => Math.max(0, prev - 1));
        setActionFeedback(language === 'bn' ? 'প্রোডাক্ট ডাটাবেস থেকে মুছে ফেলা হয়েছে।' : 'Product deleted successfully.');
        setTimeout(() => setActionFeedback(null), 3000);
        setProductToDelete(null);
      } else {
        alert('Failed to delete product.');
      }
    } catch (err) {
      console.error('Delete product error', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto text-left font-sans pb-16 overflow-x-hidden" id="admin-product-management-root">
      
      {/* 1. Header & Primary Add Product Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div>
          <span className="text-[10px] text-emerald-700 font-bold tracking-widest uppercase block">
            {language === 'bn' ? 'প্রোডাক্ট ম্যানেজমেন্ট' : 'PRODUCT MANAGEMENT'}
          </span>
          <h1 className="text-xl font-black text-gray-900 leading-tight">
            {language === 'bn' ? 'প্রোডাক্ট' : 'Product'}
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            {language === 'bn' 
              ? `মোট ${total}টি প্রোডাক্ট ডাটাবেজে রয়েছে` 
              : `Total ${total} products loaded directly from live database.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchProducts(page)}
            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg border border-gray-200 cursor-pointer transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => navigateTo('#/admin/products/add', 'products-add')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন প্রোডাক্ট যোগ করুন' : 'Add New Product'}</span>
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 2. Compact Search & Filter Toolbar (No Horizontal Scroll) */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs space-y-2.5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'প্রোডাক্টের নাম, SKU বা কোড দিয়ে খুঁজুন...' : 'Search by product name, SKU code, or ID...'}
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

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full text-xs font-medium px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 cursor-pointer"
          >
            <option value="all">{language === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
            {Array.from(new Set(categories.map(c => String(c).trim()).filter(Boolean))).map((cat, idx) => (
              <option key={`cat-opt-${cat}-${idx}`} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full text-xs font-medium px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 cursor-pointer"
          >
            <option value="all">{language === 'bn' ? 'সব ব্র্যান্ড' : 'All Brands'}</option>
            {Array.from(new Set(brands.map(b => String(b).trim()).filter(Boolean))).map((brand, idx) => (
              <option key={`brand-opt-${brand}-${idx}`} value={brand}>{brand}</option>
            ))}
          </select>

          <select
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            className="w-full text-xs font-medium px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 cursor-pointer"
          >
            <option value="all">{language === 'bn' ? 'সব স্টক' : 'All Stock'}</option>
            <option value="in_stock">{language === 'bn' ? 'স্টক আছে (১৫+)' : 'In Stock (15+)'}</option>
            <option value="low_stock">{language === 'bn' ? 'অল্প স্টক (< ১৫)' : 'Low Stock (< 15)'}</option>
            <option value="out_of_stock">{language === 'bn' ? 'স্টক শেষ (০)' : 'Out of Stock (0)'}</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-xs font-medium px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 cursor-pointer"
          >
            <option value="all">{language === 'bn' ? 'সব স্ট্যাটাস' : 'All Status'}</option>
            <option value="active">{language === 'bn' ? 'সক্রিয় (Active)' : 'Active'}</option>
            <option value="inactive">{language === 'bn' ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive'}</option>
            <option value="draft">{language === 'bn' ? 'ড্রাফট (Draft)' : 'Draft'}</option>
          </select>
        </div>
      </div>

      {/* 3. Products Render Area: COMPACT VERTICAL CARD FEED (Zero Horizontal Scrolling) */}
      {isLoading ? (
        <div className="bg-white p-10 rounded-lg border border-gray-200 flex flex-col items-center justify-center space-y-2">
          <div className="w-7 h-7 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500">
            {language === 'bn' ? 'ডাটাবেস থেকে প্রোডাক্ট লোড হচ্ছে...' : 'Loading products from database...'}
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
          <p className="text-xs text-gray-500">
            {language === 'bn' ? 'অনুসন্ধান ফিল্টার পরিবর্তন করুন অথবা নতুন প্রোডাক্ট তৈরি করুন।' : 'Try clearing filters or add a new product.'}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 rounded-lg cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* VERTICAL COMPACT CARDS LIST */
        <div className="space-y-2.5 w-full">
          {products.map(prod => {
            const imgUrl = getProductImageUrl(prod);
            const weight = getProductWeight(prod);
            const skuDisplay = prod.sku ? `SKU: ${prod.sku}` : `SKU: SG-${prod.id.slice(-6).toUpperCase()}`;
            const isOutOfStock = Number(prod.stock_quantity) === 0;
            const isLowStock = Number(prod.stock_quantity) > 0 && Number(prod.stock_quantity) < 15;

            return (
              <div 
                key={prod.id}
                className="bg-white border border-gray-200 hover:border-emerald-300 rounded-lg p-2.5 sm:p-3 shadow-2xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 w-full"
              >
                {/* Left & Middle Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Product Image Thumbnail */}
                  <ProductImageThumb src={imgUrl} alt={prod.name} />

                  {/* Product Details */}
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

                    {/* Price • Weight/Size */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                      <span className="font-black text-gray-900 text-sm">
                        ৳{Number(prod.price).toLocaleString()}
                      </span>
                      {prod.old_price && prod.old_price > prod.price && (
                        <span className="text-[11px] text-gray-400 line-through font-normal">
                          ৳{Number(prod.old_price).toLocaleString()}
                        </span>
                      )}
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-700 font-medium">{weight}</span>
                    </div>

                    {/* SKU / Product Code */}
                    <div className="text-[11px] font-mono text-gray-500">
                      {skuDisplay}
                    </div>

                    {/* Stock & Status */}
                    <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                      {/* Stock Info */}
                      <span className="font-bold text-gray-800">
                        {language === 'bn' ? 'স্টক' : 'Stock'}:{' '}
                        <span className={`font-black ${
                          isOutOfStock 
                            ? 'text-rose-600' 
                            : isLowStock 
                              ? 'text-amber-600' 
                              : 'text-emerald-700'
                        }`}>
                          {prod.stock_quantity}
                        </span>
                      </span>

                      <span className="text-gray-300">•</span>

                      {/* Status pill (clickable to toggle active/inactive) */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(prod)}
                        disabled={togglingId === prod.id}
                        className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                          prod.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : prod.status === 'draft'
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          prod.status === 'active' ? 'bg-emerald-600' : prod.status === 'draft' ? 'bg-amber-500' : 'bg-gray-400'
                        }`} />
                        <span>{prod.status}</span>
                      </button>

                      {prod.category && (
                        <span className="hidden lg:inline text-[11px] text-gray-400 font-normal">
                          ({prod.category})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center justify-end gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                  {/* EDIT BUTTON (Green Primary) */}
                  <button
                    type="button"
                    onClick={() => navigateTo(`#/admin/products/${prod.id}/edit`, `products-${prod.id}-edit`)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'এডিট' : 'EDIT'}</span>
                  </button>

                  {/* DELETE BUTTON (Clear Destructive) */}
                  <button
                    type="button"
                    onClick={() => setProductToDelete(prod)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200 text-rose-600 hover:text-rose-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'মুছুন' : 'DELETE'}</span>
                  </button>

                  {/* View on Storefront PDP */}
                  <button
                    type="button"
                    onClick={() => window.location.hash = `#pdp-${prod.slug || prod.id}`}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                    title={language === 'bn' ? 'স্টোরে দেখুন' : 'View on Store'}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  {/* Clone / Duplicate */}
                  <button
                    type="button"
                    onClick={() => handleDuplicate(prod)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                    title={language === 'bn' ? 'কপি তৈরি করুন' : 'Clone Product'}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Pagination Bar */}
      {pages > 1 && (
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs flex items-center justify-between text-xs font-semibold text-gray-700">
          <div>
            Showing <strong>{page}</strong> of <strong>{pages}</strong> ({total} items)
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fetchProducts(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(pages, 5) }).map((_, i) => {
              const pNum = i + 1;
              return (
                <button
                  type="button"
                  key={pNum}
                  onClick={() => fetchProducts(pNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    page === pNum ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => fetchProducts(page + 1)}
              disabled={page >= pages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-gray-200 text-left">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">
                {language === 'bn' ? 'প্রোডাক্ট মুছে ফেলার নিশ্চয়তা' : 'Confirm Permanent Deletion'}
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {language === 'bn' 
                  ? `আপনি কি নিশ্চিত যে "${productToDelete.name}" প্রোডাক্টটি ডাটাবেস থেকে মুছে ফেলতে চান? এটি স্থায়ীভাবে মুছে যাবে।` 
                  : `Are you sure you want to permanently delete "${productToDelete.name}"? This action cannot be undone.`}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{language === 'bn' ? 'হ্যাঁ, মুছুন' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
