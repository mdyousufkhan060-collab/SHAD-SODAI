import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  Edit3,
  Trash2,
  Check,
  X,
  Sparkles,
  Globe,
  Image as ImageIcon,
  AlertCircle,
  Package,
  Star,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Upload,
  Calendar,
  Layers,
  ArrowUpDown,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';
import { adminService } from '../utils/adminService';

export interface Brand {
  id: string;
  name: string;
  localName?: string;
  slug: string;
  logo: string;
  banner?: string;
  shortDescription?: string;
  description?: string;
  countryOfOrigin?: string;
  officialWebsite?: string;
  display_order?: number;
  status: 'active' | 'inactive' | 'draft';
  featured: boolean;
  seoTitle?: string;
  metaDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  logoAlt?: string;
  product_count?: number;
  createdAt: string;
  updatedAt?: string;
}

interface AdminBrandsProps {
  language: 'en' | 'bn';
}

const DEFAULT_BRAND_LOGO = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&h=150&fit=crop';

export const AdminBrands: React.FC<AdminBrandsProps> = ({ language }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    featured: 0,
    withProducts: 0,
    withoutProducts: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'order' | 'newest' | 'az' | 'products'>('order');

  // Add / Edit Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    localName: '',
    slug: '',
    autoSlug: true,
    logo: DEFAULT_BRAND_LOGO,
    banner: '',
    shortDescription: '',
    description: '',
    countryOfOrigin: 'Bangladesh',
    officialWebsite: '',
    display_order: 0,
    status: 'active' as 'active' | 'inactive',
    featured: false,
    seoTitle: '',
    metaDescription: '',
    seoKeywords: '',
    canonicalUrl: '',
    logoAlt: ''
  });
  const [showSeoFields, setShowSeoFields] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Brand Details & Connected Products Modal
  const [viewingBrand, setViewingBrand] = useState<Brand | null>(null);
  const [brandProducts, setBrandProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Delete Safety Modal
  const [deleteWarning, setDeleteWarning] = useState<{
    isOpen: boolean;
    brand: Brand | null;
    message: string;
  }>({
    isOpen: false,
    brand: null,
    message: ''
  });

  // Simple Delete Confirm for 0 products
  const [deleteConfirmBrand, setDeleteConfirmBrand] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/brands', {
        headers: adminService.getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setBrands(data.brands || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        setError(data.error || 'Failed to load brands from database.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      localName: '',
      slug: '',
      autoSlug: true,
      logo: DEFAULT_BRAND_LOGO,
      banner: '',
      shortDescription: '',
      description: '',
      countryOfOrigin: 'Bangladesh',
      officialWebsite: '',
      display_order: (brands.length + 1) * 1,
      status: 'active',
      featured: false,
      seoTitle: '',
      metaDescription: '',
      seoKeywords: '',
      canonicalUrl: '',
      logoAlt: ''
    });
    setFormError(null);
    setShowSeoFields(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      localName: brand.localName || '',
      slug: brand.slug,
      autoSlug: false,
      logo: brand.logo || DEFAULT_BRAND_LOGO,
      banner: brand.banner || '',
      shortDescription: brand.shortDescription || '',
      description: brand.description || '',
      countryOfOrigin: brand.countryOfOrigin || 'Bangladesh',
      officialWebsite: brand.officialWebsite || '',
      display_order: brand.display_order ?? 0,
      status: brand.status === 'inactive' ? 'inactive' : 'active',
      featured: Boolean(brand.featured),
      seoTitle: brand.seoTitle || '',
      metaDescription: brand.metaDescription || '',
      seoKeywords: brand.seoKeywords || '',
      canonicalUrl: brand.canonicalUrl || '',
      logoAlt: brand.logoAlt || ''
    });
    setFormError(null);
    setShowSeoFields(Boolean(brand.seoTitle || brand.metaDescription));
    setIsFormOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, name: val };
      if (prev.autoSlug) {
        updated.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      return updated;
    });
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError(language === 'bn' ? 'ব্র্যান্ডের নাম প্রদান করুন।' : 'Brand name is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const url = editingBrand ? `/api/admin/brands/${editingBrand.id}` : '/api/admin/brands';
      const method = editingBrand ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...adminService.getHeaders()
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(editingBrand 
          ? (language === 'bn' ? 'ব্র্যান্ড সফলভাবে আপডেট হয়েছে!' : 'Brand updated successfully!') 
          : (language === 'bn' ? 'নতুন ব্র্যান্ড তৈরি হয়েছে!' : 'Brand created successfully!')
        );
        setIsFormOpen(false);
        fetchBrands();
      } else {
        setFormError(data.error || 'Failed to save brand.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    const newStatus = brand.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin/brands/${brand.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...adminService.getHeaders()
        },
        body: JSON.stringify({ ...brand, status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(newStatus === 'active'
          ? (language === 'bn' ? `ব্র্যান্ড "${brand.name}" অ্যাক্টিভ করা হয়েছে` : `Brand "${brand.name}" activated`)
          : (language === 'bn' ? `ব্র্যান্ড "${brand.name}" ইনঅ্যাক্টিভ করা হয়েছে` : `Brand "${brand.name}" marked inactive`)
        );
        fetchBrands();
      }
    } catch (err) {
      showToast('Failed to update brand status.');
    }
  };

  const handleInitiateDelete = (brand: Brand) => {
    const pCount = Number(brand.product_count) || 0;
    if (pCount > 0) {
      // Block deletion and show clear warning modal (Requirement 10)
      setDeleteWarning({
        isOpen: true,
        brand,
        message: language === 'bn'
          ? `এই ব্র্যান্ডের অধীনে ${pCount} টি প্রোডাক্ট রয়েছে। ব্র্যান্ডটি ডিলিট করতে চাইলে প্রথমে প্রোডাক্টগুলোর ব্র্যান্ড পরিবর্তন করুন অথবা ব্র্যান্ডটি Inactive করুন।`
          : `Cannot delete brand "${brand.name}". There are currently ${pCount} product(s) connected to this brand. Please reassign those products or mark the brand as Inactive instead.`
      });
    } else {
      // Safe to delete, show confirmation modal
      setDeleteConfirmBrand(brand);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmBrand) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/brands/${deleteConfirmBrand.id}`, {
        method: 'DELETE',
        headers: adminService.getHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(language === 'bn' ? 'ব্র্যান্ড মুছে ফেলা হয়েছে।' : 'Brand deleted successfully.');
        setDeleteConfirmBrand(null);
        fetchBrands();
      } else if (data.error === 'HAS_PRODUCTS') {
        setDeleteConfirmBrand(null);
        setDeleteWarning({
          isOpen: true,
          brand: deleteConfirmBrand,
          message: data.message
        });
      } else {
        alert(data.error || 'Failed to delete brand.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting brand.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Brand Details & Connected Products View (Requirement 8)
  const handleViewBrandDetails = async (brand: Brand) => {
    setViewingBrand(brand);
    setLoadingProducts(true);
    setBrandProducts([]);
    try {
      const res = await fetch(`/api/admin/brands/${brand.id}/products`, {
        headers: adminService.getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setBrandProducts(data.products || []);
      } else {
        // Fallback: search products by brand
        const pRes = await fetch(`/api/admin/products?brand=${encodeURIComponent(brand.name)}&limit=50`, {
          headers: adminService.getHeaders()
        });
        const pData = await pRes.json();
        setBrandProducts(pData.products || []);
      }
    } catch (err) {
      console.error('Failed to load brand products', err);
      setBrandProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Format Date safely
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return '—';
    }
  };

  // Filter and Sort Brands
  const filteredBrands = brands.filter(b => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      b.name.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      (b.localName && b.localName.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'all' ||
      b.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'order') {
      const orderA = a.display_order !== undefined ? Number(a.display_order) : 999;
      const orderB = b.display_order !== undefined ? Number(b.display_order) : 999;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortBy === 'az') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'products') {
      return (b.product_count || 0) - (a.product_count || 0);
    }
    return 0;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-16 font-sans text-gray-900" id="admin-brands-view">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-gray-800 text-sm animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER ROW */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 inline-block mb-1">
              {language === 'bn' ? 'ব্র্যান্ড ম্যানেজমেন্ট' : 'Brand Management'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {language === 'bn' ? 'ব্র্যান্ড সমূহ' : 'Brands'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {language === 'bn' 
                ? 'আপনার ওয়েবসাইটের সমস্ত অফিসিয়াল ব্র্যান্ড ও প্রস্তুতকারকের তালিকা পরিচালনা করুন' 
                : 'Manage and connect verified product brands, manufacturers, and catalog mappings'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchBrands}
              className="p-2.5 text-gray-600 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200 rounded-xl transition-colors cursor-pointer"
              title={language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? '+ নতুন ব্র্যান্ড যোগ করুন' : '+ Add Brand'}</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block">
              {language === 'bn' ? 'মোট ব্র্যান্ড' : 'Total Brands'}
            </span>
            <div className="text-lg sm:text-xl font-black text-gray-900 mt-0.5">{stats.total}</div>
          </div>
          <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/60">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide block">
              {language === 'bn' ? 'অ্যাক্টিভ' : 'Active'}
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-800 mt-0.5">{stats.active}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block">
              {language === 'bn' ? 'ইনঅ্যাক্টিভ' : 'Inactive'}
            </span>
            <div className="text-lg sm:text-xl font-black text-gray-600 mt-0.5">{stats.inactive}</div>
          </div>
          <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/60">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide block">
              {language === 'bn' ? 'ফিচার্ড' : 'Featured'}
            </span>
            <div className="text-lg sm:text-xl font-black text-amber-800 mt-0.5">{stats.featured}</div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'ব্র্যান্ডের নাম বা স্ল্যাগ খুঁজুন...' : 'Search by name, local name, slug...'}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-hidden focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'bn' ? 'সব' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'bn' ? 'অ্যাক্টিভ' : 'Active'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-gray-800 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'bn' ? 'ইনঅ্যাক্টিভ' : 'Inactive'}
            </button>
          </div>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:bg-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
          >
            <option value="order">{language === 'bn' ? 'অর্ডার অনুযায়ী' : 'Display Order'}</option>
            <option value="newest">{language === 'bn' ? 'নতুন আগে' : 'Newest First'}</option>
            <option value="az">{language === 'bn' ? 'A থেকে Z' : 'Name: A – Z'}</option>
            <option value="products">{language === 'bn' ? 'প্রোডাক্ট সংখ্যা' : 'Most Products'}</option>
          </select>
        </div>
      </div>

      {/* BRAND LISTING: CLEAN COMPACT VERTICAL CARDS (ONE BELOW ANOTHER, NO HORIZONTAL SCROLL) */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          <p className="text-sm font-semibold text-gray-600">
            {language === 'bn' ? 'ডাটাবেস থেকে ব্র্যান্ড লোড হচ্ছে...' : 'Loading brands from database...'}
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-800 p-6 rounded-2xl border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 mx-auto text-rose-600" />
          <p className="text-sm font-bold">{error}</p>
          <button
            type="button"
            onClick={fetchBrands}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
          >
            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Try Again'}
          </button>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center space-y-3">
          <Tag className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">
            {language === 'bn' ? 'কোনো ব্র্যান্ড পাওয়া যায়নি' : 'No brands found'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchQuery 
              ? (language === 'bn' ? 'আপনার অনুসন্ধানের সাথে কোনো ব্র্যান্ড মিলছে না।' : 'Try adjusting your search criteria.')
              : (language === 'bn' ? 'এখনো কোনো ব্র্যান্ড তৈরি করা হয়নি। নতুন ব্র্যান্ড যোগ করুন।' : 'Get started by creating your first brand.')}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            {language === 'bn' ? 'ব্র্যান্ড যোগ করুন' : 'Add First Brand'}
          </button>
        </div>
      ) : (
        /* Vertical Cards Stack */
        <div className="space-y-3" id="brand-cards-container">
          {filteredBrands.map(brand => {
            const productCount = brand.product_count !== undefined ? Number(brand.product_count) : 0;
            const isActive = brand.status === 'active';

            return (
              <div
                key={brand.id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 p-3.5 sm:p-4 shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 group"
              >
                {/* Brand Logo & Core Identity */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  {/* Brand Logo with Fallback */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-50 border border-gray-200 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={brand.logo || DEFAULT_BRAND_LOGO}
                      alt={brand.logoAlt || brand.name}
                      onError={(e) => {
                        // Safe fallback on broken image
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = DEFAULT_BRAND_LOGO;
                      }}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>

                  {/* Name, Slug, Meta Badges */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight">
                        {brand.name}
                      </h3>
                      {brand.localName && (
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {brand.localName}
                        </span>
                      )}
                      {brand.featured && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Slug */}
                    <div className="font-mono text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="text-gray-400">slug:</span>
                      <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[11px] font-medium">
                        {brand.slug}
                      </span>
                    </div>

                    {/* Meta Row: Products Count, Status, Created Date */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Products Badge (Clickable to open Brand Details / Connected Products) */}
                      <button
                        type="button"
                        onClick={() => handleViewBrandDetails(brand)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title={language === 'bn' ? 'কানেক্টেড প্রোডাক্ট দেখুন' : 'View connected products'}
                      >
                        <Package className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{language === 'bn' ? `প্রোডাক্ট: ${productCount}` : `Products: ${productCount}`}</span>
                      </button>

                      {/* Status Toggle Badge */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(brand)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
                        }`}
                        title={language === 'bn' ? 'স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন' : 'Click to toggle status'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-gray-400'}`}></span>
                        <span>{isActive ? (language === 'bn' ? 'অ্যাক্টিভ' : 'Active') : (language === 'bn' ? 'ইনঅ্যাক্টিভ' : 'Inactive')}</span>
                      </button>

                      {/* Created Date */}
                      <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(brand.createdAt)}</span>
                      </div>

                      {/* Display Order */}
                      {brand.display_order !== undefined && (
                        <div className="text-[11px] text-gray-400 font-medium hidden sm:flex items-center gap-1">
                          <span>•</span>
                          <span>Order: #{brand.display_order}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right / Bottom Action Buttons (Green EDIT, Red DELETE) */}
                <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 justify-end flex-shrink-0">
                  {/* EDIT Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(brand)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'এডিট' : 'EDIT'}</span>
                  </button>

                  {/* DELETE Button */}
                  <button
                    type="button"
                    onClick={() => handleInitiateDelete(brand)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'ডিলিট' : 'DELETE'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT BRAND MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    {editingBrand 
                      ? (language === 'bn' ? 'ব্র্যান্ড এডিট করুন' : 'Edit Brand')
                      : (language === 'bn' ? '+ নতুন ব্র্যান্ড যোগ করুন' : '+ Add New Brand')}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {language === 'bn' ? 'ব্র্যান্ডের তথ্য ও ছবি পূরণ করুন' : 'Fill out brand details, logo and catalog information'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveBrand} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Brand Name * */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {language === 'bn' ? 'ব্র্যান্ডের নাম *' : 'Brand Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleNameChange}
                      placeholder="e.g. PAIDAGOR, Shad Ghor"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  {/* Local Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {language === 'bn' ? 'বাংলা নাম' : 'Local Name (Bengali)'}
                    </label>
                    <input
                      type="text"
                      value={formData.localName}
                      onChange={e => setFormData(prev => ({ ...prev, localName: e.target.value }))}
                      placeholder="e.g. পায়দাগোর, স্বাদ ঘর"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Slug */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">
                      {language === 'bn' ? 'স্ল্যাগ (URL Identifier) *' : 'Brand Slug *'}
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.autoSlug}
                        onChange={e => setFormData(prev => ({ ...prev, autoSlug: e.target.checked }))}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{language === 'bn' ? 'অটো-স্ল্যাগ' : 'Auto generate'}</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    disabled={formData.autoSlug}
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') }))}
                    placeholder="e.g. paidagor"
                    className="w-full px-3 py-2 font-mono text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 disabled:opacity-75 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* Brand Logo & Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Brand Logo */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {language === 'bn' ? 'ব্র্যান্ড লোগো (URL বা ইমেজ)' : 'Brand Logo URL'}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={formData.logo || DEFAULT_BRAND_LOGO}
                          alt="Preview"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = DEFAULT_BRAND_LOGO;
                          }}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.logo}
                        onChange={e => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Brand Banner */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {language === 'bn' ? 'ব্যানার / কভার ইমেজ (অপশনাল)' : 'Cover Banner URL (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={formData.banner}
                      onChange={e => setFormData(prev => ({ ...prev, banner: e.target.value }))}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Order & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Display Order */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {language === 'bn' ? 'ডিসপ্লে অর্ডার' : 'Display Order'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.display_order}
                      onChange={e => setFormData(prev => ({ ...prev, display_order: Number(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {language === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                    </label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="active">{language === 'bn' ? 'Active (সক্রিয়)' : 'Active'}</option>
                      <option value="inactive">{language === 'bn' ? 'Inactive (নিষ্ক্রিয়)' : 'Inactive'}</option>
                    </select>
                  </div>

                  {/* Featured */}
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={e => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>{language === 'bn' ? 'ফিচার্ড ব্র্যান্ড' : 'Mark as Featured'}</span>
                    </label>
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {language === 'bn' ? 'সংক্ষিপ্ত বিবরণ (Short Description)' : 'Short Description'}
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={e => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                    placeholder="e.g. 100% Pure & Organic Honey, Ghee and Natural Foods"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* Full Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {language === 'bn' ? 'সম্পূর্ণ বিবরণ ও ব্র্যান্ড স্টোরি' : 'Full Brand Story & Description'}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed brand background, quality guarantees, source of ingredients..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* Country & Website */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {language === 'bn' ? 'উৎস দেশ (Country of Origin)' : 'Country of Origin'}
                    </label>
                    <input
                      type="text"
                      value={formData.countryOfOrigin}
                      onChange={e => setFormData(prev => ({ ...prev, countryOfOrigin: e.target.value }))}
                      placeholder="Bangladesh, Saudi Arabia"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {language === 'bn' ? 'অফিসিয়াল ওয়েবসাইট' : 'Official Website URL'}
                    </label>
                    <input
                      type="url"
                      value={formData.officialWebsite}
                      onChange={e => setFormData(prev => ({ ...prev, officialWebsite: e.target.value }))}
                      placeholder="https://brandwebsite.com"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* SEO Accordion Toggle */}
                <div className="pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowSeoFields(!showSeoFields)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{showSeoFields ? 'Hide SEO Fields' : '+ Configure Brand SEO & Meta Tags'}</span>
                  </button>

                  {showSeoFields && (
                    <div className="grid grid-cols-1 gap-3 pt-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">SEO Title</label>
                        <input
                          type="text"
                          value={formData.seoTitle}
                          onChange={e => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                          placeholder="Brand Title for Google Search"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Meta Description</label>
                        <textarea
                          rows={2}
                          value={formData.metaDescription}
                          onChange={e => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                          placeholder="Search engine meta description..."
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingBrand ? (language === 'bn' ? 'আপডেট করুন' : 'Update Brand') : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Brand')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BRAND DETAILS & CONNECTED PRODUCTS MODAL (REQUIREMENT 8) */}
      {viewingBrand && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={viewingBrand.logo || DEFAULT_BRAND_LOGO}
                    alt={viewingBrand.name}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = DEFAULT_BRAND_LOGO;
                    }}
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                      {viewingBrand.name}
                    </h2>
                    {viewingBrand.localName && (
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {viewingBrand.localName}
                      </span>
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      viewingBrand.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {viewingBrand.status}
                    </span>
                  </div>

                  <div className="font-mono text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <span>slug: /{viewingBrand.slug}</span>
                    {viewingBrand.countryOfOrigin && (
                      <>
                        <span>•</span>
                        <span>{viewingBrand.countryOfOrigin}</span>
                      </>
                    )}
                  </div>

                  {viewingBrand.shortDescription && (
                    <p className="text-xs text-gray-600 mt-1 max-w-xl line-clamp-2">
                      {viewingBrand.shortDescription}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingBrand(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Connected Products Section */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'bn' ? 'কানেক্টেড প্রোডাক্ট তালিকা' : 'Connected Products'}</span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    {language === 'bn' 
                      ? `এই ব্র্যান্ডের সঙ্গে মোট ${brandProducts.length} টি প্রোডাক্ট ডাটাবেসে যুক্ত রয়েছে`
                      : `Total ${brandProducts.length} products currently mapped to this brand in database`}
                  </p>
                </div>

                <span className="text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  {brandProducts.length} {language === 'bn' ? 'টি প্রোডাক্ট' : 'Products'}
                </span>
              </div>

              {loadingProducts ? (
                <div className="py-12 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                  <p className="text-xs text-gray-500">{language === 'bn' ? 'প্রোডাক্ট লোড হচ্ছে...' : 'Loading connected products...'}</p>
                </div>
              ) : brandProducts.length === 0 ? (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                  <Package className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm font-bold text-gray-700">
                    {language === 'bn' ? 'এই ব্র্যান্ডের অধীনে কোনো প্রোডাক্ট নেই' : 'No products linked to this brand yet'}
                  </p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    {language === 'bn' 
                      ? 'প্রোডাক্ট এডমিন থেকে প্রোডাক্ট তৈরি বা এডিট করার সময় এই ব্র্যান্ডটি সিলেক্ট করুন।'
                      : 'When creating or editing products, select this brand in the brand dropdown to connect them.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {brandProducts.map(prod => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-300 bg-gray-50/50 hover:bg-white transition-all gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.image_url || DEFAULT_BRAND_LOGO}
                          alt={prod.name}
                          className="w-12 h-12 rounded-lg object-cover bg-white border border-gray-200 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                            {prod.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500">
                            <span className="font-semibold text-emerald-700">৳{Number(prod.price).toLocaleString()}</span>
                            {prod.sku && <span>• SKU: {prod.sku}</span>}
                            <span>• {language === 'bn' ? 'স্টক' : 'Stock'}: {prod.stock_quantity ?? 0}</span>
                            {prod.category && <span className="bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded text-[10px]">{prod.category}</span>}
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0 ${
                        prod.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {prod.status || 'active'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between rounded-b-2xl">
              <span className="text-xs text-gray-500 font-medium">
                {language === 'bn' ? 'ব্র্যান্ড ম্যানেজমেন্ট' : 'Brand Details View'}
              </span>
              <button
                type="button"
                onClick={() => setViewingBrand(null)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SAFETY MODAL: PREVENT DELETION IF PRODUCTS ARE CONNECTED (REQUIREMENT 10) */}
      {deleteWarning.isOpen && deleteWarning.brand && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-gray-900">
                {language === 'bn' ? 'ব্র্যান্ডটি ডিলিট করা সম্ভব নয়' : 'Cannot Delete Brand'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {deleteWarning.message}
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>{language === 'bn' ? 'ব্র্যান্ড:' : 'Brand:'}</span>
                <span className="font-black">{deleteWarning.brand.name}</span>
              </div>
              <div className="flex items-center justify-between text-amber-800">
                <span>{language === 'bn' ? 'কানেক্টেড প্রোডাক্ট:' : 'Linked Products:'}</span>
                <span className="font-black bg-white px-2 py-0.5 rounded border border-amber-200">
                  {deleteWarning.brand.product_count} {language === 'bn' ? 'টি' : 'items'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (deleteWarning.brand) {
                    handleToggleStatus(deleteWarning.brand);
                  }
                  setDeleteWarning({ isOpen: false, brand: null, message: '' });
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {language === 'bn' ? 'ব্র্যান্ডটি Inactive করুন (নিরাপদ)' : 'Deactivate Brand Instead (Safe)'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteWarning({ isOpen: false, brand: null, message: '' })}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL: ONLY FOR BRANDS WITH 0 PRODUCTS */}
      {deleteConfirmBrand && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900">
                {language === 'bn' ? 'ব্র্যান্ডটি মুছে ফেলতে চান?' : 'Delete Brand Permanently?'}
              </h3>
              <p className="text-xs text-gray-500">
                {language === 'bn'
                  ? `আপনি কি নিশ্চিত যে "${deleteConfirmBrand.name}" ব্র্যান্ডটি মুছে ফেলতে চান? এটি পুনরায় ফিরিয়ে আনা যাবে না।`
                  : `Are you sure you want to permanently remove "${deleteConfirmBrand.name}"? This action cannot be undone.`}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmBrand(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
