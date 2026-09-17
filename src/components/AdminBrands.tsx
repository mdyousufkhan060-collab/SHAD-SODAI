import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  Check,
  X,
  Sparkles,
  Globe,
  Image as ImageIcon,
  AlertCircle,
  Package,
  Star,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';

interface Brand {
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
  status: 'active' | 'inactive' | 'draft';
  featured: boolean;
  seoTitle?: string;
  metaDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  logoAlt?: string;
  product_count?: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminBrandsProps {
  language: 'en' | 'bn';
}

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

  // Search, Filter, Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'featured' | 'has_products' | 'no_products'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Add / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null); // null means Add mode
  const [formData, setFormData] = useState({
    name: '',
    localName: '',
    slug: '',
    autoSlug: true,
    logo: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=150&h=150&fit=crop',
    banner: '',
    shortDescription: '',
    description: '',
    countryOfOrigin: 'Bangladesh',
    officialWebsite: '',
    status: 'active' as 'active' | 'inactive' | 'draft',
    featured: false,
    seoTitle: '',
    metaDescription: '',
    seoKeywords: '',
    canonicalUrl: '',
    logoAlt: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // View Brand Products Modal State
  const [viewingProductsBrand, setViewingProductsBrand] = useState<Brand | null>(null);
  const [brandProducts, setBrandProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Delete Safety Modal State
  const [deleteWarning, setDeleteWarning] = useState<{
    isOpen: boolean;
    brandId: string;
    brandName: string;
    productCount: number;
    message: string;
  }>({
    isOpen: false,
    brandId: '',
    brandName: '',
    productCount: 0,
    message: ''
  });

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('shad_admin_token');
      const res = await fetch('/api/admin/brands', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        setBrands(data.brands || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        setError(data.error || 'Failed to load brands.');
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
      logo: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=150&h=150&fit=crop',
      banner: '',
      shortDescription: '',
      description: '',
      countryOfOrigin: 'Bangladesh',
      officialWebsite: '',
      status: 'active',
      featured: false,
      seoTitle: '',
      metaDescription: '',
      seoKeywords: '',
      canonicalUrl: '',
      logoAlt: ''
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || '',
      localName: brand.localName || '',
      slug: brand.slug || '',
      autoSlug: false,
      logo: brand.logo || '',
      banner: brand.banner || '',
      shortDescription: brand.shortDescription || '',
      description: brand.description || '',
      countryOfOrigin: brand.countryOfOrigin || 'Bangladesh',
      officialWebsite: brand.officialWebsite || '',
      status: brand.status || 'active',
      featured: brand.featured || false,
      seoTitle: brand.seoTitle || '',
      metaDescription: brand.metaDescription || '',
      seoKeywords: brand.seoKeywords || '',
      canonicalUrl: brand.canonicalUrl || '',
      logoAlt: brand.logoAlt || ''
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: prev.autoSlug ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug,
      seoTitle: !prev.seoTitle || prev.seoTitle === prev.name ? val : prev.seoTitle,
      logoAlt: !prev.logoAlt || prev.logoAlt === prev.name ? `${val} Logo` : prev.logoAlt
    }));
  };

  const handleGenerateSeo = () => {
    setFormData(prev => ({
      ...prev,
      seoTitle: `${prev.name} - Buy Authentic Products Online`,
      metaDescription: prev.shortDescription || `Shop genuine products from ${prev.name} at SHAD SHODAI. Best prices and guaranteed authenticity.`,
      seoKeywords: `${prev.name.toLowerCase()}, ${prev.name.toLowerCase()} products, shad shodai brands`,
      canonicalUrl: `https://shadshodai.com/brands/${prev.slug || 'brand'}`
    }));
    showToast('SEO content generated successfully!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Brand Name is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const token = localStorage.getItem('shad_admin_token');
      const url = editingBrand ? `/api/admin/brands/${editingBrand.id}` : '/api/admin/brands';
      const method = editingBrand ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingBrand ? 'Brand updated successfully!' : 'Brand created successfully!');
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

  const handleDelete = async (brand: Brand) => {
    try {
      const token = localStorage.getItem('shad_admin_token');
      const res = await fetch(`/api/admin/brands/${brand.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Brand deleted successfully.');
        setDeleteWarning({ isOpen: false, brandId: '', brandName: '', productCount: 0, message: '' });
        fetchBrands();
      } else if (data.error === 'HAS_PRODUCTS') {
        setDeleteWarning({
          isOpen: true,
          brandId: brand.id,
          brandName: brand.name,
          productCount: data.productCount,
          message: data.message
        });
      } else {
        alert(data.error || 'Failed to delete brand.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting brand.');
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    const newStatus = brand.status === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('shad_admin_token');
      const res = await fetch(`/api/admin/brands/${brand.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...brand, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Brand marked as ${newStatus}.`);
        fetchBrands();
      }
    } catch (err) {
      alert('Failed to update brand status.');
    }
  };

  const handleViewProducts = async (brand: Brand) => {
    setViewingProductsBrand(brand);
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      const allProds = data.products || [];
      const matched = allProds.filter((p: any) => 
        p.brand && (p.brand.toLowerCase() === brand.name.toLowerCase() || p.brand.toLowerCase() === brand.slug.toLowerCase())
      );
      setBrandProducts(matched);
    } catch (err) {
      setBrandProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to apply '${action}' to ${selectedIds.length} brands?`)) return;

    try {
      const token = localStorage.getItem('shad_admin_token');
      const res = await fetch('/api/admin/brands/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action, brandIds: selectedIds })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Bulk action '${action}' successful.`);
        setSelectedIds([]);
        fetchBrands();
      } else {
        alert(data.error || 'Bulk action failed.');
      }
    } catch (err) {
      alert('Bulk action error.');
    }
  };

  // Filtered & Sorted Brands
  const filteredBrands = brands.filter(b => {
    const matchesSearch = 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.localName && b.localName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return b.status === 'active';
    if (statusFilter === 'inactive') return b.status === 'inactive';
    if (statusFilter === 'featured') return b.featured;
    if (statusFilter === 'has_products') return (b.product_count || 0) > 0;
    if (statusFilter === 'no_products') return (b.product_count || 0) === 0;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    if (sortBy === 'az') return a.name.localeCompare(b.name);
    if (sortBy === 'za') return b.name.localeCompare(a.name);
    return 0;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBrands.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBrands.map(b => b.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // =========================================================================
  // RENDER: ADD / EDIT FORM VIEW (FULL-WIDTH RECTANGULAR LAYOUT)
  // =========================================================================
  if (isFormOpen) {
    return (
      <div className="w-full space-y-5" id="admin-brand-form-page">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="h-9 w-9 flex items-center justify-center hover:bg-gray-100 rounded-md text-gray-600 transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                {editingBrand ? `Edit Brand: ${editingBrand.name}` : (language === 'bn' ? 'নতুন ব্র্যান্ড যোগ করুন' : 'Add New Brand')}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {language === 'bn' ? 'ব্র্যান্ডের তথ্য, মিডিয়া এবং এসইও পরিচালনা করুন' : 'Configure brand profiles, logos, banners, and search optimization.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="h-9 px-3.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {formError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-md flex items-center gap-2.5 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SECTION 1: BASIC INFORMATION */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-gray-200 space-y-4 shadow-xs">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>1. Basic Information</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 font-normal">
                Canonical identity, localized naming, and brand presentation details.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Aarong, Shad Ghor, Pran"
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-normal focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Bengali / Local Brand Name
                </label>
                <input
                  type="text"
                  value={formData.localName}
                  onChange={e => setFormData(prev => ({ ...prev, localName: e.target.value }))}
                  placeholder="যেমন: আড়ং, শাদ ঘর"
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-normal focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Brand Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value, autoSlug: false }))}
                    placeholder="brand-slug"
                    className="flex-1 h-10 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-mono focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, autoSlug: true, slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))}
                    className="h-10 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-xs font-medium cursor-pointer transition-colors"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1 md:pt-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={e => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Featured Brand</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Status:</span>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="h-10 px-3 bg-white border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={e => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="Brief summary of the brand..."
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-normal focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Full Description & Brand Story
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed brand background, values, and history..."
                  className="w-full p-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-normal focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: BRAND MEDIA */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-gray-200 space-y-4 shadow-xs">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>2. Brand Media</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 font-normal">
                Upload or link high-resolution logos and cover banners for storefront display.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Brand Logo */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Brand Logo <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-300 rounded-md flex items-center justify-center p-1 shrink-0">
                    {formData.logo ? (
                      <img src={formData.logo} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Tag className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="url"
                    required
                    value={formData.logo}
                    onChange={e => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 h-10 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-normal focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <input
                  type="text"
                  value={formData.logoAlt}
                  onChange={e => setFormData(prev => ({ ...prev, logoAlt: e.target.value }))}
                  placeholder="Logo ALT text for SEO (e.g. Aarong Logo)"
                  className="w-full h-9 px-3 text-xs bg-gray-50/50 border border-gray-300 rounded-md text-gray-700 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Brand Cover Banner */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Brand Cover / Banner
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="w-16 h-12 bg-gray-50 border border-gray-300 rounded-md flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                    {formData.banner ? (
                      <img src={formData.banner} alt="Banner Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">Banner</span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={formData.banner}
                    onChange={e => setFormData(prev => ({ ...prev, banner: e.target.value }))}
                    placeholder="https://example.com/banner.jpg"
                    className="flex-1 h-10 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-normal focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-gray-400 block">Recommended banner size: 1200x300px for collection headers.</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: ADDITIONAL INFORMATION */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-gray-200 space-y-4 shadow-xs">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>3. Additional Information</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 font-normal">
                Geographical origin and external verification links.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Country of Origin
                </label>
                <input
                  type="text"
                  value={formData.countryOfOrigin}
                  onChange={e => setFormData(prev => ({ ...prev, countryOfOrigin: e.target.value }))}
                  placeholder="e.g. Bangladesh, Saudi Arabia, Italy"
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-normal focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Official Website
                </label>
                <input
                  type="url"
                  value={formData.officialWebsite}
                  onChange={e => setFormData(prev => ({ ...prev, officialWebsite: e.target.value }))}
                  placeholder="https://brandwebsite.com"
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-normal focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: BRAND SEO SETTINGS */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-gray-200 space-y-4 shadow-xs">
            <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>4. Brand SEO Settings</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 font-normal">
                  Optimize search engine indexing, social snippet previews, and metadata tags.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateSeo}
                className="h-8 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>SEO Optimize</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={e => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="SEO Title tag"
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-normal focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Canonical URL
                </label>
                <input
                  type="url"
                  value={formData.canonicalUrl}
                  onChange={e => setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                  placeholder="https://shadshodai.com/brands/slug"
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-normal focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Meta Description
                </label>
                <textarea
                  rows={2}
                  value={formData.metaDescription}
                  onChange={e => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="SEO Meta Description (under 160 characters)"
                  className="w-full p-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-normal focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  SEO Keywords
                </label>
                <input
                  type="text"
                  value={formData.seoKeywords}
                  onChange={e => setFormData(prev => ({ ...prev, seoKeywords: e.target.value }))}
                  placeholder="keyword1, keyword2, keyword3"
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 font-normal focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="h-10 px-5 border border-gray-300 text-gray-700 rounded-md text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{editingBrand ? 'Update Brand' : 'Save Brand'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // =========================================================================
  // RENDER: MAIN BRANDS MANAGEMENT LIST VIEW (FULL-WIDTH RECTANGULAR LAYOUT)
  // =========================================================================
  return (
    <div className="w-full space-y-5" id="admin-brands-page">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2.5 text-xs sm:text-sm font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. PAGE HEADER & ADD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Brands Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-normal">
            Manage real brand entities integrated across Admin, Products, and Customer Panel.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-md shadow-xs flex items-center gap-2 cursor-pointer transition-colors self-start sm:self-auto shrink-0"
          id="btn-add-new-brand"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Brand</span>
        </button>
      </div>

      {/* 2. COMPACT RECTANGULAR STATISTICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" id="brands-stats-grid">
        <div className="bg-white p-3.5 rounded-md border border-gray-200 shadow-xs">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">Total Brands</span>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-gray-200 shadow-xs">
          <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block">Active</span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">{stats.active}</div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-gray-200 shadow-xs">
          <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider block">Featured</span>
          <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">{stats.featured}</div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-gray-200 shadow-xs">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">Inactive</span>
          <div className="text-xl sm:text-2xl font-bold text-gray-600 mt-1">{stats.inactive}</div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-gray-200 shadow-xs">
          <span className="text-[11px] font-medium text-blue-700 uppercase tracking-wider block">With Products</span>
          <div className="text-xl sm:text-2xl font-bold text-blue-700 mt-1">{stats.withProducts}</div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-gray-200 shadow-xs">
          <span className="text-[11px] font-medium text-purple-700 uppercase tracking-wider block">No Products</span>
          <div className="text-xl sm:text-2xl font-bold text-purple-700 mt-1">{stats.withoutProducts}</div>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS BAR */}
      <div className="bg-white p-3 rounded-md border border-gray-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" id="brands-filter-bar">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by brand name, local name, slug..."
            className="w-full h-10 pl-9 pr-3 bg-white border border-gray-300 rounded-md text-xs sm:text-sm text-gray-900 font-normal focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="h-10 px-3 bg-white border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
          >
            <option value="all">All Status / Filters</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="featured">Featured Only</option>
            <option value="has_products">Has Products</option>
            <option value="no_products">No Products</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="h-10 px-3 bg-white border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="az">A – Z Name</option>
            <option value="za">Z – A Name</option>
          </select>

          <button
            type="button"
            onClick={fetchBrands}
            className="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-medium text-emerald-900">
            {selectedIds.length} brand(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button onClick={() => handleBulkAction('activate')} className="h-8 px-2.5 bg-white text-emerald-800 text-xs font-semibold rounded-md border border-emerald-300 hover:bg-emerald-100 cursor-pointer">Activate</button>
            <button onClick={() => handleBulkAction('deactivate')} className="h-8 px-2.5 bg-white text-gray-700 text-xs font-semibold rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer">Deactivate</button>
            <button onClick={() => handleBulkAction('feature')} className="h-8 px-2.5 bg-white text-amber-800 text-xs font-semibold rounded-md border border-amber-300 hover:bg-amber-50 cursor-pointer">Mark Featured</button>
            <button onClick={() => handleBulkAction('unfeature')} className="h-8 px-2.5 bg-white text-gray-700 text-xs font-semibold rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer">Remove Featured</button>
            <button onClick={() => handleBulkAction('delete')} className="h-8 px-2.5 bg-rose-600 text-white text-xs font-semibold rounded-md hover:bg-rose-700 cursor-pointer">Delete Safe</button>
          </div>
        </div>
      )}

      {/* 5. BRANDS LIST / TABLE */}
      {loading ? (
        <div className="py-16 text-center bg-white border border-gray-200 rounded-md">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-gray-500 text-xs sm:text-sm font-normal">Loading brands from database...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-800 rounded-md border border-rose-200 text-center text-xs sm:text-sm">
          {error}
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center space-y-2">
          <Tag className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm sm:text-base font-bold text-gray-900">No brands found</h3>
          <p className="text-xs text-gray-500 font-normal">Try adjusting your search query or create a new brand.</p>
        </div>
      ) : (
        <div className="bg-white rounded-md border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredBrands.length && filteredBrands.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3.5">Brand Logo & Name</th>
                  <th className="py-3 px-3.5">Local Name</th>
                  <th className="py-3 px-3.5">Slug</th>
                  <th className="py-3 px-3.5">Products</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Featured</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs sm:text-sm">
                {filteredBrands.map(brand => (
                  <tr key={brand.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(brand.id)}
                        onChange={() => toggleSelectOne(brand.id)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={brand.logo || 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=150&h=150&fit=crop'}
                          alt={brand.name}
                          className="w-9 h-9 rounded-md object-contain bg-gray-50 border border-gray-200 p-0.5 shrink-0"
                        />
                        <div>
                          <span className="font-semibold text-gray-900 block text-xs sm:text-sm">{brand.name}</span>
                          <span className="text-[11px] text-gray-400 font-normal">{brand.countryOfOrigin || 'Global'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-gray-700 font-normal">{brand.localName || '—'}</td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-gray-500">{brand.slug}</td>
                    <td className="py-3 px-3.5">
                      <button
                        type="button"
                        onClick={() => handleViewProducts(brand)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md hover:bg-emerald-100 font-medium text-xs transition-colors cursor-pointer"
                      >
                        <Package className="w-3 h-3 text-emerald-600" />
                        <span>{brand.product_count || 0} Products</span>
                      </button>
                    </td>
                    <td className="py-3 px-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(brand)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          brand.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {brand.status === 'active' ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-gray-500" />}
                        <span>{brand.status.toUpperCase()}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3.5">
                      {brand.featured ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px] font-semibold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Featured
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-normal">Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleViewProducts(brand)}
                          className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 rounded-md transition-colors cursor-pointer"
                          title="View Products"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(brand)}
                          className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-md transition-colors cursor-pointer"
                          title="Edit Brand"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(brand)}
                          className="p-1.5 text-gray-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-md transition-colors cursor-pointer"
                          title="Delete Brand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. VIEW BRAND PRODUCTS MODAL */}
      {viewingProductsBrand && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-md border border-gray-200 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-lg overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <img src={viewingProductsBrand.logo} alt="" className="w-7 h-7 rounded-md object-contain bg-white border border-gray-200" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{viewingProductsBrand.name} — Products</h3>
                  <p className="text-[11px] text-gray-500 font-normal">Slug: {viewingProductsBrand.slug}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingProductsBrand(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {loadingProducts ? (
                <div className="text-center py-8 text-gray-500 text-xs sm:text-sm">Loading products...</div>
              ) : brandProducts.length === 0 ? (
                <div className="text-center py-10 text-gray-500 space-y-1">
                  <Package className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-xs sm:text-sm font-normal">No products currently linked to {viewingProductsBrand.name}.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {brandProducts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-md border border-gray-200 hover:bg-gray-50/70">
                      <div className="flex items-center gap-2.5">
                        <img src={p.image_url} alt="" className="w-10 h-10 rounded-md object-cover border border-gray-200" />
                        <div>
                          <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">{p.name}</h4>
                          <span className="text-xs text-gray-500 font-normal">৳{p.price} • Stock: {p.stock_quantity}</span>
                        </div>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${p.status === 'active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-700'}`}>
                        {p.status || 'active'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 text-right">
              <button
                type="button"
                onClick={() => setViewingProductsBrand(null)}
                className="h-9 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-md text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. DELETE WARNING MODAL (SAFE DELETION) */}
      {deleteWarning.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-md border border-gray-200 max-w-md w-full p-4 sm:p-5 space-y-4 shadow-lg">
            <div className="w-10 h-10 rounded-md bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900">Cannot Delete Brand</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
                {deleteWarning.message}
              </p>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-600 text-center font-normal">
              Brand: <strong className="text-gray-900 font-semibold">{deleteWarning.brandName}</strong> ({deleteWarning.productCount} linked products)
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const b = brands.find(x => x.id === deleteWarning.brandId);
                  if (b) handleToggleStatus(b);
                  setDeleteWarning({ isOpen: false, brandId: '', brandName: '', productCount: 0, message: '' });
                }}
                className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold cursor-pointer"
              >
                Deactivate Brand Instead
              </button>
              <button
                type="button"
                onClick={() => setDeleteWarning({ isOpen: false, brandId: '', brandName: '', productCount: 0, message: '' })}
                className="w-full h-9 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
