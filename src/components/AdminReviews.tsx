import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  Trash2, 
  MessageCircle, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  User,
  ShoppingBag,
  ExternalLink,
  ThumbsUp,
  Image as ImageIcon,
  Calendar,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';
import { Review } from '../types';

interface AdminReviewsProps {
  initialView?: 'all' | 'pending' | 'reported';
}

export const AdminReviews: React.FC<AdminReviewsProps> = ({ initialView = 'all' }) => {
  const { language } = useLanguage();
  const t = (en: string, bn: string) => (language === 'bn' ? bn : en);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState(initialView);
  
  // Selection & Bulk
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialView === 'pending' ? 'pending' : (initialView === 'reported' ? '' : ''));
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Detail & Action States
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [adminReply, setAdminReply] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReviews();
    setSelectedIds([]); // Reset selection on filter change
  }, [view, statusFilter, ratingFilter, page]);

  // Sync state if initialView changes (e.g. from nav clicks)
  useEffect(() => {
    setView(initialView);
    setStatusFilter(initialView === 'pending' ? 'pending' : (initialView === 'reported' ? '' : ''));
    setPage(1);
  }, [initialView]);

  const fetchStats = async () => {
    try {
      const data = await adminService.getReviewStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch review stats', err);
    }
  };

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit,
        search: searchTerm,
        status: statusFilter,
        rating: ratingFilter,
        reported: view === 'reported'
      };

      // Force view specific filters if needed
      if (view === 'pending') params.status = 'pending';
      
      const data = await adminService.getReviews(params);
      if (data.reviews) {
        // Parse images JSON if it comes as a string
        const parsedReviews = data.reviews.map((r: any) => ({
          ...r,
          images: typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || [])
        }));
        setReviews(parsedReviews);
        setTotalPages(Math.ceil(data.total / limit));
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    setIsActionLoading(true);
    try {
      await adminService.updateReviewStatus(id, newStatus);
      await fetchReviews();
      await fetchStats();
      if (selectedReview?.id === id) {
        setSelectedReview({ ...selectedReview, status: newStatus as any });
      }
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(t(`Approve ${selectedIds.length} reviews?`, `${selectedIds.length}টি রিভিউ অনুমোদন করবেন?`))) return;

    setIsActionLoading(true);
    try {
      await adminService.bulkUpdateReviewStatus(selectedIds, newStatus);
      await fetchReviews();
      await fetchStats();
      setSelectedIds([]);
    } catch (err) {
      alert('Bulk action failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === reviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reviews.map(r => r.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const calculatePendingDuration = (date: string) => {
    const created = new Date(date).getTime();
    const now = new Date().getTime();
    const diff = now - created;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return t(`${days}d ${hours}h ago`, `${days} দিন ${hours} ঘণ্টা আগে`);
    if (hours > 0) return t(`${hours}h ago`, `${hours} ঘণ্টা আগে`);
    return t('Just now', 'এইমাত্র');
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || !adminReply.trim()) return;

    setIsActionLoading(true);
    try {
      await adminService.replyToReview(selectedReview.id, adminReply);
      await fetchReviews();
      setIsReplyModalOpen(false);
      setAdminReply('');
      // Update selected review state to show reply
      setSelectedReview({ 
        ...selectedReview, 
        admin_reply: adminReply, 
        admin_reply_at: new Date().toISOString() 
      });
    } catch (err) {
      alert('Failed to send reply');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('Are you sure you want to delete this review?', 'আপনি কি নিশ্চিত যে এই রিভিউটি মুছে ফেলতে চান?'))) return;

    setIsActionLoading(true);
    try {
      await adminService.deleteReview(id);
      await fetchReviews();
      await fetchStats();
      setIsDetailModalOpen(false);
    } catch (err) {
      alert('Failed to delete review');
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            className={`w-3 h-3 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} 
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> {t('Approved', 'অনুমোদিত')}</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {t('Pending', 'পেন্ডিং')}</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-100 flex items-center gap-1"><XCircle className="w-2.5 h-2.5" /> {t('Rejected', 'প্রত্যাখ্যাত')}</span>;
      case 'hidden':
        return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold border border-gray-200 flex items-center gap-1"><EyeOff className="w-2.5 h-2.5" /> {t('Hidden', 'লুকানো')}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Stats Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            {view === 'all' ? t('Product Reviews', 'প্রোডাক্ট রিভিউ') : 
             view === 'pending' ? t('Pending Reviews', 'পেন্ডিং রিভিউ') : 
             t('Reported Reviews', 'রিপোর্টেড রিভিউ')}
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            {t('Manage customer feedback & moderation', 'কাস্টমার ফিডব্যাক ও মডারেশন পরিচালনা করুন')}
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 w-full">
            {[
              { label: t('Total', 'মোট'), value: stats.total, color: 'text-gray-600', bg: 'bg-gray-50' },
              { label: t('Pending', 'পেন্ডিং'), value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: t('Approved', 'অনুমোদিত'), value: stats.approved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: t('Rejected', 'প্রত্যাখ্যাত'), value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50' },
              { label: t('Hidden', 'লুকানো'), value: stats.hidden, color: 'text-gray-500', bg: 'bg-gray-100' },
              { label: t('Reported', 'রিপোর্টেড'), value: stats.reported, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: t('Avg Rating', 'গড় রেটিং'), value: `${stats.averageRating} ★`, color: 'text-amber-600', bg: 'bg-amber-50' }
            ].map((stat, i) => (
              <div key={i} className={`${stat.bg} px-3 py-2 rounded-2xl border border-white/50 shadow-xs flex flex-col items-center min-w-0`}>
                <span className="text-[9px] font-black text-gray-400 uppercase truncate w-full text-center">{stat.label}</span>
                <span className={`text-xs font-black ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-col lg:flex-row gap-4 justify-between items-center bg-gray-50/30">
          <div className="flex p-1 bg-gray-100/50 rounded-xl overflow-x-auto w-full lg:w-auto custom-scrollbar">
            {[
              { id: 'all', label: t('All', 'সব'), icon: MessageCircle },
              { id: 'pending', label: t('Pending', 'পেন্ডিং'), icon: Clock },
              { id: 'reported', label: t('Reported', 'রিপোর্টেড'), icon: ShieldAlert }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setView(tab.id as any); setPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-2 shrink-0 ${
                  view === tab.id 
                    ? 'bg-white text-emerald-700 shadow-sm border border-gray-100' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input 
                type="text"
                placeholder={t('Search ID, Product, Customer...', 'আইডি, প্রোডাক্ট, কাস্টমার খুঁজুন...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchReviews()}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer h-9"
            >
              <option value="">{t('All Status', 'সব স্ট্যাটাস')}</option>
              <option value="pending">{t('Pending', 'পেন্ডিং')}</option>
              <option value="approved">{t('Approved', 'অনুমোদিত')}</option>
              <option value="rejected">{t('Rejected', 'প্রত্যাখ্যাত')}</option>
              <option value="hidden">{t('Hidden', 'লুকানো')}</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <div className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg">
                {selectedIds.length} {t('Selected', 'নির্বাচিত')}
              </div>
              <p className="text-[11px] font-bold text-emerald-800 hidden sm:block">
                {t('Apply bulk moderation actions', 'একসাথে মডারেশন অ্যাকশন প্রয়োগ করুন')}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkStatusChange('approved')}
                disabled={isActionLoading}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3 h-3" /> {t('Bulk Approve', 'একসাথে অনুমোদন')}
              </button>
              <button 
                onClick={() => handleBulkStatusChange('rejected')}
                disabled={isActionLoading}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-3 h-3" /> {t('Bulk Reject', 'একসাথে প্রত্যাখ্যান')}
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 bg-white text-gray-500 border border-gray-200 rounded-lg text-[10px] font-black hover:bg-gray-50 transition-all"
              >
                {t('Cancel', 'বাতিল')}
              </button>
            </div>
          </div>
        )}

        {/* Table / Cards View */}
        <div className="overflow-x-auto">
          {/* Desktop Table View */}
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox"
                    checked={selectedIds.length === reviews.length && reviews.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Review / Product', 'রিভিউ / প্রোডাক্ট')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Customer', 'কাস্টমার')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Rating', 'রেটিং')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Status', 'স্ট্যাটাস')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t('Actions', 'অ্যাকশন')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8">
                      <div className="h-4 bg-gray-100 rounded-full w-full" />
                    </td>
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-xs font-bold text-gray-400">{t('No reviews found.', 'কোনো রিভিউ পাওয়া যায়নি।')}</p>
                    </div>
                  </td>
                </tr>
              ) : reviews.map((review) => (
                <tr key={review.id} className={`hover:bg-gray-50/30 transition-colors ${selectedIds.includes(review.id) ? 'bg-emerald-50/20' : ''}`}>
                  <td className="px-6 py-5">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(review.id)}
                      onChange={() => toggleSelect(review.id)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-4">
                      {review.product_image ? (
                        <img 
                          src={review.product_image} 
                          alt="" 
                          className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                          <ShoppingBag className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black text-gray-400 font-mono">ID: #{review.id}</span>
                          <h4 className="text-[11px] font-black text-gray-800 truncate">{review.product_name}</h4>
                        </div>
                        <p className="text-[11px] text-gray-500 font-bold line-clamp-2 italic leading-relaxed">
                          "{review.comment}"
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-1">
                              <ImageIcon className="w-3 h-3 text-emerald-500" />
                              <span className="text-[9px] font-black text-emerald-600 uppercase">{review.images.length} {t('Photos', 'ছবি')}</span>
                            </div>
                          )}
                          {review.status === 'pending' && (
                            <div className="flex gap-1 items-center">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span className="text-[9px] font-black text-amber-600 uppercase">
                                {calculatePendingDuration(review.created_at)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                        {review.customer_avatar ? (
                          <img src={review.customer_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-gray-700">{review.customer_name}</span>
                        {review.is_verified_purchase && (
                          <span className="text-[9px] font-black text-emerald-600 flex items-center gap-0.5 mt-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {t('Verified Buyer', 'ভেরিফাইড কাস্টমার')}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      {renderStars(review.rating)}
                      <span className="text-[10px] font-black text-gray-400 uppercase">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(review.status)}
                      {review.report_status !== 'none' && (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[9px] font-black border border-red-100 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> {t('Reported', 'রিপোর্টেড')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => { setSelectedReview(review); setIsDetailModalOpen(true); }}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all cursor-pointer border border-gray-200/50"
                        title={t('View Detail', 'বিস্তারিত দেখুন')}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      
                      {review.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusChange(review.id, 'approved')}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all cursor-pointer border border-emerald-100"
                          title={t('Approve', 'অনুমোদন')}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {review.status === 'approved' && (
                        <button 
                          onClick={() => { setSelectedReview(review); setIsReplyModalOpen(true); }}
                          className={`p-2 rounded-xl transition-all cursor-pointer border ${review.admin_reply ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}
                          title={review.admin_reply ? t('Replied', 'উত্তর দেওয়া হয়েছে') : t('Reply', 'উত্তর দিন')}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="relative group">
                        <button className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-xl transition-all cursor-pointer border border-gray-200/50">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 hidden group-hover:block z-20">
                          {review.status !== 'approved' && (
                            <button 
                              onClick={() => handleStatusChange(review.id, 'approved')}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3" /> {t('Approve', 'অনুমোদন')}
                            </button>
                          )}
                          {review.status !== 'rejected' && (
                            <button 
                              onClick={() => handleStatusChange(review.id, 'rejected')}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 rounded-lg text-[10px] font-black transition-colors"
                            >
                              <XCircle className="w-3 h-3" /> {t('Reject', 'প্রত্যাখ্যান')}
                            </button>
                          )}
                          {review.status === 'hidden' ? (
                            <button 
                              onClick={() => handleStatusChange(review.id, 'approved')}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black transition-colors"
                            >
                              <Eye className="w-3 h-3" /> {t('Unhide', 'লুকানো থেকে সরান')}
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleStatusChange(review.id, 'hidden')}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-gray-500 rounded-lg text-[10px] font-black transition-colors"
                            >
                              <EyeOff className="w-3 h-3" /> {t('Hide', 'লুকান')}
                            </button>
                          )}
                          <div className="h-px bg-gray-50 my-1" />
                          <button 
                            onClick={() => handleDelete(review.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 rounded-lg text-[10px] font-black transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> {t('Delete', 'মুছে ফেলুন')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-gray-50 rounded-2xl animate-pulse" />
              ))
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs font-bold">
                {t('No reviews found.', 'কোনো রিভিউ পাওয়া যায়নি।')}
              </div>
            ) : reviews.map((review) => (
              <div key={review.id} className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3 transition-colors ${selectedIds.includes(review.id) ? 'bg-emerald-50/20 border-emerald-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(review.id)}
                      onChange={() => toggleSelect(review.id)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {review.customer_avatar ? (
                        <img src={review.customer_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-800">{review.customer_name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold">
                        {new Date(review.created_at).toLocaleDateString()}
                        {review.status === 'pending' && ` • ${calculatePendingDuration(review.created_at)}`}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(review.status)}
                </div>

                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                  {review.product_image && (
                    <img src={review.product_image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  )}
                  <span className="text-[10px] font-black text-gray-700 truncate flex-1">{review.product_name}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    {renderStars(review.rating)}
                    {review.is_verified_purchase && (
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">{t('Verified Purchase', 'ভেরিফাইড পারচেজ')}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600 font-bold italic leading-relaxed line-clamp-3">"{review.comment}"</p>
                </div>

                <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[9px] font-black text-gray-400 font-mono">ID: #{review.id}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setSelectedReview(review); setIsDetailModalOpen(true); }}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black"
                    >
                      {t('View', 'দেখুন')}
                    </button>
                    {review.status === 'pending' && (
                      <button 
                        onClick={() => handleStatusChange(review.id, 'approved')}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black"
                      >
                        {t('Approve', 'অনুমোদন')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
            <span className="text-[10px] font-bold text-gray-400">
              {t('Page', 'পৃষ্ঠা')} {page} {t('of', 'এর')} {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {isDetailModalOpen && selectedReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100 animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <Star className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-800">{t('Review Details', 'রিভিউ বিস্তারিত')}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: #{selectedReview.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Content */}
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t('Product Info', 'প্রোডাক্ট তথ্য')}</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      {selectedReview.product_image ? (
                        <img src={selectedReview.product_image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-gray-800 truncate">{selectedReview.product_name}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">ID: {selectedReview.product_id}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t('Rating & Date', 'রেটিং ও তারিখ')}</label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span className="text-sm font-black">{selectedReview.rating} / 5</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 font-bold text-[11px]">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(selectedReview.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t('Review Comment', 'রিভিউ মন্তব্য')}</label>
                    <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 text-xs font-bold text-gray-700 leading-relaxed italic">
                      {selectedReview.title && <h5 className="font-black mb-2 text-gray-800 not-italic">{selectedReview.title}</h5>}
                      "{selectedReview.comment}"
                    </div>
                  </div>

                  {selectedReview.images && selectedReview.images.length > 0 && (
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t('Review Photos', 'রিভিউ ছবি')}</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedReview.images.map((img, idx) => (
                          <a key={idx} href={img} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:scale-105 transition-transform">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Customer & Actions */}
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t('Customer Profile', 'কাস্টমার প্রোফাইল')}</label>
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-2 border-emerald-500 p-0.5 shrink-0">
                        <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {selectedReview.customer_avatar ? (
                            <img src={selectedReview.customer_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-800">{selectedReview.customer_name}</h4>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">Customer ID: {selectedReview.customer_id}</p>
                        {(selectedReview.customer_email || selectedReview.customer_phone) && (
                          <div className="mt-2 space-y-1">
                            {selectedReview.customer_email && (
                              <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                {selectedReview.customer_email}
                              </p>
                            )}
                            {selectedReview.customer_phone && (
                              <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                {selectedReview.customer_phone}
                              </p>
                            )}
                          </div>
                        )}
                        {selectedReview.is_verified_purchase && (
                          <div className="mt-2 flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 inline-flex">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span className="text-[8px] font-black uppercase tracking-tight">{t('Verified Purchase', 'ভেরিফাইড পারচেজ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedReview.order_id && (
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t('Related Order', 'সংশ্লিষ্ট অর্ডার')}</label>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[11px] font-black text-gray-600">{selectedReview.order_id}</span>
                        <a href={`#/admin/orders/${selectedReview.order_id}`} className="text-emerald-600 hover:text-emerald-700 font-black text-[10px] flex items-center gap-1">
                          {t('View Order', 'অর্ডার দেখুন')} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedReview.admin_reply && (
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t('Admin Response', 'অ্যাডমিন রেসপন্স')}</label>
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{t('Store Reply', 'স্টোর রিপ্লাই')}</span>
                          <span className="text-[9px] text-gray-400 font-bold ml-auto">{new Date(selectedReview.admin_reply_at || '').toLocaleDateString()}</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-700 leading-relaxed italic">"{selectedReview.admin_reply}"</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('Moderation Actions', 'মডারেশন অ্যাকশনস')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedReview.status !== 'approved' && (
                        <button 
                          onClick={() => handleStatusChange(selectedReview.id, 'approved')}
                          disabled={isActionLoading}
                          className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" /> {t('Approve', 'অনুমোদন')}
                        </button>
                      )}
                      {!selectedReview.admin_reply && selectedReview.status === 'approved' && (
                        <button 
                          onClick={() => { setIsReplyModalOpen(true); }}
                          className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-black transition-all shadow-lg shadow-blue-100 cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" /> {t('Reply', 'উত্তর দিন')}
                        </button>
                      )}
                      {selectedReview.status !== 'rejected' && (
                        <button 
                          onClick={() => handleStatusChange(selectedReview.id, 'rejected')}
                          disabled={isActionLoading}
                          className="flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[11px] font-black border border-red-100 disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" /> {t('Reject', 'প্রত্যাখ্যান')}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleStatusChange(selectedReview.id, selectedReview.status === 'hidden' ? 'approved' : 'hidden')}
                        disabled={isActionLoading}
                        className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-[11px] font-black border border-gray-200 disabled:opacity-50 cursor-pointer"
                      >
                        {selectedReview.status === 'hidden' ? <><Eye className="w-4 h-4" /> {t('Unhide', 'লুকানো থেকে সরান')}</> : <><EyeOff className="w-4 h-4" /> {t('Hide', 'লুকান')}</>}
                      </button>
                      <button 
                        onClick={() => handleDelete(selectedReview.id)}
                        disabled={isActionLoading}
                        className="flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl text-[11px] font-black border border-gray-200 hover:border-red-100 disabled:opacity-50 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-4 h-4" /> {t('Delete', 'মুছে ফেলুন')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {isReplyModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-blue-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  <MessageCircle className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-800">{t('Reply to Review', 'রিভিউতে উত্তর দিন')}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{t('Customer', 'কাস্টমার')}: {selectedReview?.customer_name}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReplyModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReply} className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 italic text-[11px] font-bold text-gray-500 leading-relaxed">
                "{selectedReview?.comment}"
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t('Your Response', 'আপনার উত্তর')}</label>
                <textarea 
                  required
                  rows={4}
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  placeholder={t('Write a professional response...', 'একটি পেশাদার উত্তর লিখুন...')}
                  className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none"
                />
                <p className="text-[10px] text-gray-400 font-bold mt-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {t('This reply will be publicly visible on the product page.', 'এই উত্তরটি প্রোডাক্ট পেজে প্রকাশ্যে দেখা যাবে।')}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsReplyModalOpen(false)}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl text-[11px] font-black transition-all cursor-pointer border border-gray-200"
                >
                  {t('Cancel', 'বাতিল')}
                </button>
                <button 
                  type="submit"
                  disabled={isActionLoading || !adminReply.trim()}
                  className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black transition-all shadow-lg shadow-blue-200 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  {t('Send Reply', 'রিপ্লাই পাঠান')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
