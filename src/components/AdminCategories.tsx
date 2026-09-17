import React, { useState, useEffect } from 'react';
import { 
  FolderTree, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Copy, 
  Eye, 
  ChevronDown, 
  ChevronRight, 
  Save, 
  Globe, 
  Image as ImageIcon, 
  AlertCircle, 
  X,
  Sparkles,
  Layers,
  ArrowLeft,
  Check,
  EyeOff
} from 'lucide-react';
import { adminService } from '../utils/adminService';

interface Category {
  id: string;
  name: string;
  name_bn: string;
  slug: string;
  image_url: string;
  banner_url?: string;
  status: 'active' | 'inactive';
  sort_order: number;
  parent_id: string | null;
  description?: string;
  description_bn?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  seo_slug?: string;
  canonical_url?: string;
  is_featured?: number;
  show_on_homepage?: number;
  show_in_main_menu?: number;
  show_in_footer?: number;
  product_count?: number;
  subcategory_count?: number;
}

interface AdminCategoriesProps {
  language: 'en' | 'bn';
}

// Category Image Component with error fallback
const CategoryImageThumb: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);
  const validUrl = src && typeof src === 'string' && src.trim().length > 0 ? src.trim() : null;

  if (!validUrl || hasError) {
    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400 shrink-0 select-none">
        <FolderTree className="w-5 h-5 stroke-[1.5] text-gray-400" />
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

export const AdminCategories: React.FC<AdminCategoriesProps> = ({ language }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'main' | 'sub'>('all');

  // Nested expanded categories state
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // View Category Modal state
  const [viewedCat, setViewedCat] = useState<Category | null>(null);

  // Add / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null); // Null means Add mode
  const [formData, setFormData] = useState({
    name: '',
    name_bn: '',
    slug: '',
    autoSlug: true,
    parent_id: '',
    image_url: '',
    banner_url: '',
    description: '',
    description_bn: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    seo_slug: '',
    canonical_url: '',
    status: 'active' as 'active' | 'inactive',
    is_featured: false,
    show_on_homepage: false,
    show_in_main_menu: false,
    show_in_footer: false,
    sort_order: 0
  });

  // Deletion Check Warning State
  const [deleteWarning, setDeleteWarning] = useState<{
    isOpen: boolean;
    catId: string;
    catName: string;
    productCount: number;
    message: string;
  } | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Fetch Categories
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/categories', {
        headers: adminService.getHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch categories.');
      }
      const data = await response.json();
      setCategories(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while loading categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Sync slug auto-generation
  useEffect(() => {
    if (formData.autoSlug && !editingCat) {
      const generated = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setFormData(prev => ({
        ...prev,
        slug: generated,
        seo_slug: generated
      }));
    }
  }, [formData.name, formData.autoSlug, editingCat]);

  // Expand / collapse helper
  const toggleExpand = (catId: string) => {
    setExpandedCats(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Status toggle handler
  const handleToggleStatus = async (cat: Category) => {
    try {
      const newStatus = cat.status === 'active' ? 'inactive' : 'active';
      const updatedCat = { ...cat, status: newStatus };
      
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: {
          ...adminService.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedCat)
      });

      if (!res.ok) {
        throw new Error('Failed to update category status.');
      }

      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, status: newStatus } : c));
    } catch (err: any) {
      alert(err.message || 'Error updating status.');
    }
  };

  // Open Add Form
  const handleOpenAddForm = () => {
    setEditingCat(null);
    setImageFile(null);
    setImagePreview('');
    setFormData({
      name: '',
      name_bn: '',
      slug: '',
      autoSlug: true,
      parent_id: '',
      image_url: '',
      banner_url: '',
      description: '',
      description_bn: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: '',
      seo_slug: '',
      canonical_url: '',
      status: 'active',
      is_featured: false,
      show_on_homepage: false,
      show_in_main_menu: false,
      show_in_footer: false,
      sort_order: categories.length + 1
    });
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEditForm = (cat: Category) => {
    setEditingCat(cat);
    setImageFile(null);
    const catImg = cat.image_url || (cat as any).imageUrl || (cat as any).iconImage || (cat as any).icon_image || (cat as any).image || '';
    const catOrder = cat.sort_order ?? (cat as any).displayOrder ?? (cat as any).sortOrder ?? 0;
    setImagePreview(catImg);
    setFormData({
      name: cat.name,
      name_bn: cat.name_bn || cat.name,
      slug: cat.slug,
      autoSlug: false,
      parent_id: cat.parent_id || '',
      image_url: catImg,
      banner_url: cat.banner_url || '',
      description: cat.description || '',
      description_bn: cat.description_bn || '',
      seo_title: cat.seo_title || '',
      seo_description: cat.seo_description || '',
      seo_keywords: cat.seo_keywords || '',
      seo_slug: cat.seo_slug || cat.slug,
      canonical_url: cat.canonical_url || '',
      status: cat.status,
      is_featured: cat.is_featured === 1,
      show_on_homepage: cat.show_on_homepage === 1,
      show_in_main_menu: cat.show_in_main_menu === 1,
      show_in_footer: cat.show_in_footer === 1,
      sort_order: catOrder
    });
    setIsFormOpen(true);
  };

  // Duplicate Category
  const handleDuplicateCategory = (cat: Category) => {
    setEditingCat(null); // Mode: Add (as duplicate)
    setImageFile(null);
    const catImg = cat.image_url || (cat as any).imageUrl || (cat as any).iconImage || (cat as any).icon_image || (cat as any).image || '';
    const catOrder = (cat.sort_order ?? (cat as any).displayOrder ?? (cat as any).sortOrder ?? 0) + 1;
    setImagePreview(catImg);
    setFormData({
      name: `${cat.name} Copy`,
      name_bn: `${cat.name_bn || cat.name} কপি`,
      slug: `${cat.slug}-copy`,
      autoSlug: true,
      parent_id: cat.parent_id || '',
      image_url: catImg,
      banner_url: cat.banner_url || '',
      description: cat.description || '',
      description_bn: cat.description_bn || '',
      seo_title: cat.seo_title ? `${cat.seo_title} - Copy` : '',
      seo_description: cat.seo_description || '',
      seo_keywords: cat.seo_keywords || '',
      seo_slug: cat.seo_slug ? `${cat.seo_slug}-copy` : '',
      canonical_url: cat.canonical_url || '',
      status: cat.status,
      is_featured: cat.is_featured === 1,
      show_on_homepage: cat.show_on_homepage === 1,
      show_in_main_menu: cat.show_in_main_menu === 1,
      show_in_footer: cat.show_in_footer === 1,
      sort_order: catOrder
    });
    setIsFormOpen(true);
  };

  // Handle Image Upload File Select
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData(prev => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Add or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCat 
        ? `/api/admin/categories/${editingCat.id}` 
        : '/api/admin/categories';
      const method = editingCat ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        is_featured: formData.is_featured ? 1 : 0,
        show_on_homepage: formData.show_on_homepage ? 1 : 0,
        show_in_main_menu: formData.show_in_main_menu ? 1 : 0,
        show_in_footer: formData.show_in_footer ? 1 : 0
      };

      const res = await fetch(url, {
        method,
        headers: {
          ...adminService.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save category.');
      }

      setIsFormOpen(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Error occurred during save operation.');
    }
  };

  // Handle Delete Confirmation Checks
  const handleDeleteCheck = async (cat: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'DELETE',
        headers: adminService.getHeaders()
      });

      if (!res.ok) {
        const errData = await res.json();
        if (errData.error === 'HAS_PRODUCTS') {
          setDeleteWarning({
            isOpen: true,
            catId: cat.id,
            catName: cat.name,
            productCount: errData.productCount,
            message: errData.message
          });
          return;
        }
        throw new Error(errData.error || 'Failed to delete category.');
      }

      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Error deleting category.');
    }
  };

  // Build Hierarchical Category Tree for displaying nested list
  const buildTree = (allCats: Category[]) => {
    // Filter by search query if present
    let filteredList = allCats;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredList = allCats.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.name_bn.toLowerCase().includes(q) || 
        c.slug.toLowerCase().includes(q)
      );
    }

    // Filter by status if not "all"
    if (statusFilter !== 'all') {
      filteredList = filteredList.filter(c => c.status === statusFilter);
    }

    // Map parent objects for quick lookups
    const map = new Map<string, Category & { children: any[] }>();
    filteredList.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });

    const roots: any[] = [];
    filteredList.forEach(cat => {
      const mapped = map.get(cat.id);
      if (mapped) {
        if (cat.parent_id && map.has(cat.parent_id)) {
          map.get(cat.parent_id)!.children.push(mapped);
        } else {
          // If level filter matches or if searching, keep it
          if (levelFilter === 'all') {
            roots.push(mapped);
          } else if (levelFilter === 'main' && !cat.parent_id) {
            roots.push(mapped);
          } else if (levelFilter === 'sub' && cat.parent_id) {
            roots.push(mapped);
          }
        }
      }
    });

    // If we have filters like search active, some orphans should become root nodes
    if (searchQuery && roots.length === 0 && map.size > 0) {
      return Array.from(map.values());
    }

    return roots;
  };

  const categoryTree = buildTree(categories);

  // Recursive Renderer for Category items as COMPACT VERTICAL CARDS (No horizontal scroll)
  const renderCategoryCard = (node: Category & { children: any[] }, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedCats[node.id] || false;
    const catImg = node.image_url || (node as any).imageUrl || (node as any).icon_image || '';

    return (
      <div key={node.id} className="w-full space-y-2">
        <div 
          className="bg-white border border-gray-200 hover:border-emerald-300 rounded-lg p-2.5 sm:p-3 shadow-2xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 w-full"
        >
          {/* Left & Middle Info */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            {/* Sub-category expand toggle if has children */}
            {hasChildren ? (
              <button 
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500 cursor-pointer shrink-0 transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand Sub-categories'}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-600" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>
            ) : depth > 0 ? (
              <span className="w-4 h-4 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </span>
            ) : null}

            {/* Category Image Thumbnail */}
            <CategoryImageThumb src={catImg} alt={node.name} />

            {/* Category Details */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <h3 
                  className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate" 
                  title={node.name}
                >
                  {node.name}
                </h3>
                {node.name_bn && node.name_bn !== node.name && (
                  <span className="hidden md:inline text-xs text-gray-400 truncate">
                    ({node.name_bn})
                  </span>
                )}
              </div>

              {/* Products count & Subcategories count */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-gray-600 font-medium">
                <span className="font-semibold text-gray-900">
                  {language === 'bn' ? 'প্রোডাক্ট' : 'Products'}: {node.product_count ?? 0}
                </span>
                {(node.subcategory_count || hasChildren) ? (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500">
                      {language === 'bn' ? 'সাব-ক্যাটাগরি' : 'Sub-categories'}: {node.subcategory_count || node.children?.length || 0}
                    </span>
                  </>
                ) : null}
                <span className="text-gray-300 hidden sm:inline">•</span>
                <span className="font-mono text-[11px] text-gray-400 hidden sm:inline">/{node.slug}</span>
              </div>

              {/* Status pill (clickable to toggle active/inactive) */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(node)}
                  className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                    node.status === 'active'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  }`}
                  title="Click to toggle status"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'active' ? 'bg-emerald-600' : 'bg-gray-400'}`} />
                  <span>{node.status === 'active' ? (language === 'bn' ? 'সক্রিয়' : 'Active') : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
            {/* EDIT BUTTON (Green Primary) */}
            <button
              type="button"
              onClick={() => handleOpenEditForm(node)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'এডিট' : 'EDIT'}</span>
            </button>

            {/* DELETE BUTTON (Clear Destructive) */}
            <button
              type="button"
              onClick={() => handleDeleteCheck(node)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200 text-rose-600 hover:text-rose-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'মুছুন' : 'DELETE'}</span>
            </button>

            {/* View Details */}
            <button
              type="button"
              onClick={() => setViewedCat(node)}
              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
              title={language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Duplicate */}
            <button
              type="button"
              onClick={() => handleDuplicateCategory(node)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              title={language === 'bn' ? 'ডুপ্লিকেট' : 'Duplicate'}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Children indented feed if expanded */}
        {hasChildren && isExpanded && (
          <div className="pl-4 sm:pl-6 border-l-2 border-emerald-400 space-y-2 mt-1.5">
            {node.children.map(child => renderCategoryCard(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3.5 animate-fade-in text-left max-w-7xl mx-auto overflow-x-hidden font-sans pb-16" id="admin-categories-root">
      
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div>
          <span className="text-[10px] text-emerald-700 font-bold tracking-widest uppercase block">
            {language === 'bn' ? 'ক্যাটাগরি ম্যানেজমেন্ট' : 'CATEGORY MANAGEMENT'}
          </span>
          <h1 className="text-xl font-black text-gray-900 leading-tight">
            {language === 'bn' ? 'ক্যাটাগরি সমূহ' : 'Category Listing'}
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            {language === 'bn' 
              ? `মোট ${categories.length}টি ক্যাটাগরি ডাটাবেজে রয়েছে` 
              : `Total ${categories.length} categories configured in database.`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddForm}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? 'নতুন ক্যাটাগরি যোগ করুন' : 'Add New Category'}</span>
        </button>
      </div>

      {/* 2. Filters Row */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'ক্যাটাগরি সার্চ করুন...' : 'Search category by name or slug...'}
            className="w-full text-xs font-semibold pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-900"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</span>
            <select 
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-gray-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">{language === 'bn' ? 'সব' : 'All'}</option>
              <option value="active">{language === 'bn' ? 'সক্রিয়' : 'Active'}</option>
              <option value="inactive">{language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
            </select>
          </div>

          {/* Level filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase">{language === 'bn' ? 'লেভেল' : 'Level'}</span>
            <select 
              value={levelFilter}
              onChange={(e: any) => setLevelFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-gray-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">{language === 'bn' ? 'সব লেভেল' : 'All Levels'}</option>
              <option value="main">{language === 'bn' ? 'মূল ক্যাটাগরি' : 'Main Category'}</option>
              <option value="sub">{language === 'bn' ? 'সাব-ক্যাটাগরি' : 'Sub-category'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Category Tree COMPACT VERTICAL CARDS (Zero Horizontal Scrolling) */}
      <div className="w-full">
        {loading ? (
          <div className="bg-white p-10 rounded-lg border border-gray-200 flex flex-col items-center justify-center space-y-2">
            <div className="w-7 h-7 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-gray-500">
              {language === 'bn' ? 'ক্যাটাগরি লোড হচ্ছে...' : 'Loading categories...'}
            </p>
          </div>
        ) : categoryTree.length === 0 ? (
          <div className="bg-white p-10 rounded-lg border border-gray-200 text-center space-y-3">
            <FolderTree className="w-9 h-9 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-800">
              {language === 'bn' ? 'কোনো ক্যাটাগরি পাওয়া যায়নি।' : 'No categories found matching filters.'}
            </h3>
          </div>
        ) : (
          <div className="space-y-2.5 w-full">
            {categoryTree.map(cat => renderCategoryCard(cat, 0))}
          </div>
        )}
      </div>

      {/* ================= ADD / EDIT MODAL FORM ================= */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h3 className="text-sm font-black text-gray-800">
                  {editingCat 
                    ? (language === 'bn' ? 'ক্যাটাগরি সম্পাদনা' : 'Edit Category') 
                    : (language === 'bn' ? 'নতুন ক্যাটাগরি যোগ করুন' : 'Add New Category')}
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold">
                  {language === 'bn' ? 'ক্যাটাগরির সব তথ্য পূরণ করুন' : 'Fill in the structured fields below'}
                </p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-gray-150 rounded-full transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="overflow-y-auto p-6 space-y-6 text-left">
              
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side: General Info */}
                <div className="space-y-4">
                  <div className="border-l-4 border-emerald-500 pl-3">
                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">
                      {language === 'bn' ? 'ক্যাটাগরি তথ্য' : 'Category Information'}
                    </h4>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      Category Name (English) *
                    </label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Men's Fashion"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      Category Name (Bangla)
                    </label>
                    <input 
                      type="text" 
                      value={formData.name_bn}
                      onChange={(e) => setFormData(prev => ({ ...prev, name_bn: e.target.value }))}
                      placeholder="যেমন: মেনস ফ্যাশন"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Category Slug
                      </label>
                      <input 
                        type="text" 
                        disabled={formData.autoSlug}
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="category-slug"
                        className={`w-full px-3.5 py-2.5 border rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800 ${
                          formData.autoSlug ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-gray-50 border-gray-200'
                        }`}
                      />
                    </div>

                    <div className="flex items-center mt-5">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-gray-600">
                        <input 
                          type="checkbox"
                          checked={formData.autoSlug}
                          onChange={(e) => setFormData(prev => ({ ...prev, autoSlug: e.target.checked }))}
                          className="w-4 h-4 accent-emerald-600 rounded border-gray-300"
                        />
                        <span>{language === 'bn' ? 'অটো-জেনারেট করুন' : 'Auto Generate'}</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      Parent Category
                    </label>
                    <select
                      value={formData.parent_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                    >
                      <option value="">No Parent Category</option>
                      {categories
                        .filter(c => c.id !== editingCat?.id) // Avoid self-referencing
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {language === 'bn' ? c.name_bn : c.name}
                          </option>
                        ))
                      }
                    </select>
                    <p className="text-[9px] text-gray-400">
                      Allows creation of: Main Category → Sub-category → Child Category structure.
                    </p>
                  </div>

                  {/* Status & Display Order */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Category Status
                      </label>
                      <div className="flex items-center gap-4 mt-2">
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, status: 'active' }))}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-black text-center cursor-pointer transition-all ${
                            formData.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-500' 
                              : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}
                        >
                          {language === 'bn' ? 'সক্রিয় (Active)' : 'Active'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, status: 'inactive' }))}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-black text-center cursor-pointer transition-all ${
                            formData.status === 'inactive' 
                              ? 'bg-rose-50 text-rose-700 border-rose-500' 
                              : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}
                        >
                          {language === 'bn' ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Display Order
                      </label>
                      <input 
                        type="number"
                        min="0"
                        value={formData.sort_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, sort_order: Number(e.target.value) }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                      />
                    </div>
                  </div>

                  {/* Featured & Settings */}
                  <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-150">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">Display & Featured Settings</span>
                    
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <span className="text-xs font-bold text-gray-700 block">Featured Category</span>
                        <span className="text-[10px] text-gray-400 block">Show in home featured sections</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.is_featured} 
                          onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="border-t border-gray-150 my-2"></div>

                    <div className="flex items-center justify-between py-1">
                      <div>
                        <span className="text-xs font-bold text-gray-700 block">Show on Homepage</span>
                        <span className="text-[10px] text-gray-400 block">Display this category on the frontend homepage</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.show_on_homepage} 
                          onChange={(e) => setFormData(prev => ({ ...prev, show_on_homepage: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="border-t border-gray-150 my-2"></div>

                    <div className="flex items-center justify-between py-1">
                      <div>
                        <span className="text-xs font-bold text-gray-700 block">Show in Main Menu</span>
                        <span className="text-[10px] text-gray-400 block">Include this category in the main navigation menu</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.show_in_main_menu} 
                          onChange={(e) => setFormData(prev => ({ ...prev, show_in_main_menu: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="border-t border-gray-150 my-2"></div>

                    <div className="flex items-center justify-between py-1">
                      <div>
                        <span className="text-xs font-bold text-gray-700 block">Show in Footer Links</span>
                        <span className="text-[10px] text-gray-400 block">Include in the store footer category links</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.show_in_footer} 
                          onChange={(e) => setFormData(prev => ({ ...prev, show_in_footer: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Side: Image Upload & SEO Settings */}
                <div className="space-y-4">
                  
                  {/* Category Image & Banner */}
                  <div className="space-y-3">
                    <div className="border-l-4 border-emerald-500 pl-3">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">
                        {language === 'bn' ? 'ক্যাটাগরি ছবি ও ব্যানার' : 'Category Media'}
                      </h4>
                    </div>

                    <div className="flex gap-4 items-center p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="w-20 h-20 bg-white border border-gray-150 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        )}
                      </div>
                      
                      <div className="space-y-1 flex-1">
                        <label className="block">
                          <span className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-[11px] rounded-lg cursor-pointer transition-colors block text-center shadow-3xs">
                            Upload Category Image
                          </span>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden" 
                          />
                        </label>
                        <span className="text-[9px] text-gray-400 block text-center">
                          JPG, JPEG, PNG, WebP format. Maximum 2MB.
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                        Category Banner Image URL
                      </label>
                      <input 
                        type="text" 
                        value={formData.banner_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, banner_url: e.target.value }))}
                        placeholder="e.g. https://images.unsplash.com/photo-..."
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                      />
                      <p className="text-[9px] text-gray-400">
                        Provide a landscape image URL to display as a category promotional banner.
                      </p>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="space-y-2">
                    <div className="border-l-4 border-emerald-500 pl-3">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">
                        {language === 'bn' ? 'ক্যাটাগরি বিবরণ' : 'Description'}
                      </h4>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Short Description
                      </label>
                      <textarea 
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        placeholder="Write a brief category summary..."
                        className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Full Description / Bangla Description
                      </label>
                      <textarea 
                        value={formData.description_bn}
                        onChange={(e) => setFormData(prev => ({ ...prev, description_bn: e.target.value }))}
                        rows={2}
                        placeholder="ক্যাটাগরির সম্পূর্ণ বিবরণ বাংলায় লিখুন..."
                        className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                      />
                    </div>
                  </div>

                  {/* SEO Settings */}
                  <div className="space-y-3 p-4 bg-emerald-50/30 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-1.5 border-b border-emerald-100/65 pb-2">
                      <Globe className="w-4 h-4 text-emerald-700" />
                      <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                        SEO Settings
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">SEO Title</label>
                        <input 
                          type="text" 
                          value={formData.seo_title}
                          onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                          placeholder="Meta title"
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-semibold text-gray-800 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Meta Keywords</label>
                        <input 
                          type="text" 
                          value={formData.seo_keywords}
                          onChange={(e) => setFormData(prev => ({ ...prev, seo_keywords: e.target.value }))}
                          placeholder="e.g. fashion, shirt"
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-semibold text-gray-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Meta Description</label>
                      <textarea 
                        value={formData.seo_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                        rows={2}
                        placeholder="Enter search engine snippet description..."
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-semibold text-gray-800 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">SEO Slug</label>
                        <input 
                          type="text" 
                          value={formData.seo_slug}
                          onChange={(e) => setFormData(prev => ({ ...prev, seo_slug: e.target.value }))}
                          placeholder="custom-seo-slug"
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-semibold text-gray-800 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Canonical URL</label>
                        <input 
                          type="text" 
                          value={formData.canonical_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, canonical_url: e.target.value }))}
                          placeholder="https://..."
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-semibold text-gray-800 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 bg-gray-50 px-6 -mx-6 -mb-6 rounded-b-2xl">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-black rounded-lg cursor-pointer transition-colors"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingCat ? (language === 'bn' ? 'হালনাগাদ করুন' : 'Update Category') : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Category')}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW CATEGORY OVERLAY MODAL ================= */}
      {viewedCat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-scale-up text-left">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                  {language === 'bn' ? 'ক্যাটাগরি বিস্তারিত' : 'Category Details'}
                </h3>
              </div>
              <button 
                onClick={() => setViewedCat(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden shrink-0">
                  <img src={viewedCat.image_url} alt={viewedCat.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-800">
                    {language === 'bn' ? viewedCat.name_bn : viewedCat.name}
                  </h4>
                  <span className="text-[11px] font-mono font-medium text-gray-400 block">
                    /{viewedCat.slug}
                  </span>
                  <div className="flex gap-1.5 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      viewedCat.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {viewedCat.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    {viewedCat.is_featured === 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-amber-50 text-amber-700 border-amber-100">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Blocks */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-150">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Sub-categories</span>
                    <span className="text-sm font-black text-gray-800">{viewedCat.subcategory_count || 0}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-150">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Total Products</span>
                    <span className="text-sm font-black text-gray-800">{viewedCat.product_count || 0}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Short Description</span>
                  <p className="text-xs text-gray-600 font-semibold bg-gray-50 p-3 rounded-xl border border-gray-150 leading-relaxed">
                    {viewedCat.description || 'No description provided.'}
                  </p>
                </div>

                {viewedCat.description_bn && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Bangla Description</span>
                    <p className="text-xs text-gray-600 font-semibold bg-gray-50 p-3 rounded-xl border border-gray-150 leading-relaxed">
                      {viewedCat.description_bn}
                    </p>
                  </div>
                )}

                {/* SEO Summary */}
                <div className="p-3 bg-emerald-50/20 rounded-xl border border-emerald-100/50 space-y-1 text-xs">
                  <span className="text-[10px] text-emerald-800 font-black block uppercase">SEO Settings Summary</span>
                  <div className="space-y-1 text-[11px] text-gray-600">
                    <div><span className="font-bold text-gray-400">SEO Title:</span> {viewedCat.seo_title || viewedCat.name}</div>
                    <div><span className="font-bold text-gray-400">Canonical URL:</span> {viewedCat.canonical_url || 'N/A'}</div>
                    <div><span className="font-bold text-gray-400">Keywords:</span> {viewedCat.seo_keywords || 'N/A'}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE WARNING MODAL ================= */}
      {deleteWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-rose-100 overflow-hidden animate-scale-up text-left">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-rose-50 bg-rose-50 text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <h3 className="text-xs font-black uppercase tracking-wide">
                {language === 'bn' ? 'অ্যাকশন অবরুদ্ধ!' : 'Deletion Blocked!'}
              </h3>
            </div>

            {/* Warning Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-black text-rose-950 block">
                    {language === 'bn' 
                      ? 'এই ক্যাটাগরিতে প্রোডাক্ট রয়েছে!' 
                      : 'This category contains registered products'}
                  </span>
                  <p className="text-[11px] text-rose-700 font-semibold mt-1 leading-relaxed">
                    {language === 'bn'
                      ? `"${deleteWarning.catName}" ক্যাটাগরিতে মোট ${deleteWarning.productCount}টি প্রোডাক্ট যুক্ত আছে। ক্যাটাগরি ডিলিট করার আগে প্রোডাক্টগুলোকে অন্য ক্যাটাগরিতে স্থানান্তর করুন।`
                      : `"${deleteWarning.catName}" category is linked with ${deleteWarning.productCount} products. Please update their categories first before deleting this category to avoid database orphans.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  onClick={() => setDeleteWarning(null)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-black rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'বুঝতে পেরেছি' : 'Okay, I understand'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
