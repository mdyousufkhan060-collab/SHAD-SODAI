import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpDown,
  Monitor,
  Smartphone,
  ExternalLink,
  Image as ImageIcon,
  Tag
} from 'lucide-react';
import { motion } from 'motion/react';
import { adminService } from '../utils/adminService';

interface Banner {
  id: number;
  name: string;
  image_url_desktop: string;
  image_url_mobile: string;
  heading_en: string | null;
  heading_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  button_text_en: string | null;
  button_text_bn: string | null;
  button_link: string | null;
  destination_type: 'internal' | 'external' | 'product' | 'category' | 'offer';
  display_location: string;
  status: 'active' | 'inactive';
  sort_order: number;
  category_id: number | null;
  category_name?: string;
  category_name_bn?: string;
  created_at: string;
  updated_at: string | null;
}

interface AdminCategoryBannersProps {
  language: 'en' | 'bn';
  onEdit: (banner?: Banner) => void;
}

const AdminCategoryBanners: React.FC<AdminCategoryBannersProps> = ({ language, onEdit }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/banners?location=category_banner', {
        headers: adminService.getHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setBanners(data.data);
      } else {
        setError(data.error || 'Failed to fetch banners');
      }
    } catch (err) {
      setError('An error occurred while fetching banners');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`/api/admin/banners/${id}/status`, {
        method: 'PATCH',
        headers: adminService.getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        setBanners(prev => prev.map(b => b.id === id ? { ...b, status: newStatus as any } : b));
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const deleteBanner = async (id: number) => {
    if (!window.confirm(language === 'bn' ? 'আপনি কি এই ব্যানারটি মুছে ফেলতে নিশ্চিত?' : 'Are you sure you want to delete this banner?')) return;
    
    try {
      const response = await fetch(`/api/admin/banners/${id}`, { 
        method: 'DELETE',
        headers: adminService.getHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setBanners(prev => prev.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete banner', err);
    }
  };

  const filteredBanners = banners.filter(b => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = b.name.toLowerCase().includes(searchLower) || 
                          (b.heading_en || '').toLowerCase().includes(searchLower) ||
                          (b.category_name || '').toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in text-left">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
              <Tag className="w-5 h-5" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              {language === 'bn' ? 'ক্যাটাগরি ব্যানার' : 'Category Banners'}
            </h1>
          </div>
          <p className="text-gray-500 text-sm font-semibold">
            {language === 'bn' ? 'নির্দিষ্ট ক্যাটাগরির জন্য ব্যানারগুলো ম্যানেজ করুন এবং প্রোমোশন সেটআপ করুন।' : 'Manage banners for specific product categories and set up category-level promotions.'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onEdit()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl text-xs font-black shadow-xl shadow-emerald-100 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>{language === 'bn' ? 'নতুন ক্যাটাগরি ব্যানার' : 'ADD CATEGORY BANNER'}</span>
          </button>
          <button 
            onClick={fetchBanners}
            className="p-3 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-2xl border border-gray-200 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex flex-col md:flex-row gap-6 items-center mb-12">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder={language === 'bn' ? 'ব্যানার বা ক্যাটাগরি নাম দিয়ে খুঁজুন...' : 'Search banners or categories...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-4 bg-gray-50 border-0 rounded-3xl text-sm font-semibold focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full md:w-56 px-6 py-4 bg-gray-50 border-0 rounded-3xl text-xs font-black uppercase tracking-wider focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all cursor-pointer appearance-none"
          >
            <option value="all">{language === 'bn' ? 'সব স্ট্যাটাস' : 'ALL STATUS'}</option>
            <option value="active">{language === 'bn' ? 'সক্রিয়' : 'ACTIVE'}</option>
            <option value="inactive">{language === 'bn' ? 'নিষ্ক্রিয়' : 'INACTIVE'}</option>
          </select>
        </div>
      </div>

      {/* 3. Content Area */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-50 border-t-emerald-600 animate-spin" />
            <p className="text-gray-400 text-xs font-black tracking-widest uppercase">{language === 'bn' ? 'লোড হচ্ছে...' : 'QUERYING DATABASE...'}</p>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="py-32 text-center space-y-6 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto text-gray-200 border border-gray-100 shadow-sm">
              <Tag className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-800">{language === 'bn' ? 'কোনো ক্যাটাগরি ব্যানার পাওয়া যায়নি' : 'No Category Banners'}</h3>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">
                {searchTerm || statusFilter !== 'all' 
                  ? (language === 'bn' ? 'আপনার ফিল্টার পরিবর্তন করে দেখুন।' : 'Try adjusting your search or filters.')
                  : (language === 'bn' ? 'নতুন ক্যাটাগরি ব্যানার যোগ করতে উপরের বোতামটি ক্লিক করুন।' : 'Start by adding your first category banner.')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredBanners.map((banner) => (
              <div 
                key={banner.id}
                className="group flex flex-col md:flex-row items-center gap-8 p-6 bg-white hover:bg-emerald-50/50 rounded-[32px] border border-gray-100 transition-all duration-500"
              >
                {/* Image Preview */}
                <div className="relative w-full md:w-64 aspect-video bg-gray-100 rounded-[24px] overflow-hidden border border-gray-150 shadow-sm group-hover:border-emerald-300 transition-all">
                  <img 
                    src={banner.image_url_desktop || 'https://placehold.co/1920x500?text=No+Image'} 
                    alt={banner.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    onError={(e) => { (e.target as any).src = 'https://placehold.co/1920x500?text=No+Image'; }}
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <div className={`p-2 rounded-xl backdrop-blur-md border ${banner.image_url_desktop ? 'bg-white/80 border-emerald-100 text-emerald-600' : 'bg-gray-100/80 border-gray-200 text-gray-300'}`}>
                      <Monitor className="w-3 h-3" />
                    </div>
                    <div className={`p-2 rounded-xl backdrop-blur-md border ${banner.image_url_mobile ? 'bg-white/80 border-emerald-100 text-emerald-600' : 'bg-gray-100/80 border-gray-200 text-gray-300'}`}>
                      <Smartphone className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Banner Details */}
                <div className="flex-1 space-y-3 text-center md:text-left w-full">
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{banner.name}</h3>
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full border border-gray-200">
                      ORD: {banner.sort_order}
                    </span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/50 shadow-4xs">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-gray-800 uppercase tracking-tight">
                      {language === 'bn' ? (banner.category_name_bn || banner.category_name) : banner.category_name}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest line-clamp-1">
                    {language === 'bn' ? banner.heading_bn : banner.heading_en}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-center">
                  <button 
                    onClick={() => toggleStatus(banner.id, banner.status)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer border ${
                      banner.status === 'active' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' 
                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${banner.status === 'active' ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                    {banner.status === 'active' ? (language === 'bn' ? 'সক্রিয়' : 'ACTIVE') : (language === 'bn' ? 'নিষ্ক্রিয়' : 'INACTIVE')}
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onEdit(banner)}
                      className="p-4 text-gray-400 hover:text-emerald-700 hover:bg-white rounded-2xl border border-transparent hover:border-emerald-100 hover:shadow-sm transition-all cursor-pointer active:scale-90"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => deleteBanner(banner.id)}
                      className="p-4 text-gray-400 hover:text-rose-600 hover:bg-white rounded-2xl border border-transparent hover:border-rose-100 hover:shadow-sm transition-all cursor-pointer active:scale-90"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategoryBanners;
