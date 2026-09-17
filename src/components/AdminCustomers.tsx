import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus,
  Search, 
  Filter, 
  MoreVertical,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  ShoppingBag,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  LayoutGrid,
  List as ListIcon,
  Download,
  Trash2,
  ExternalLink,
  DollarSign,
  Package,
  AlertCircle,
  Info,
  Edit3
} from 'lucide-react';
import { adminService } from '../utils/adminService';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerStats {
  total: number;
  active: number;
  blocked: number;
  newToday: number;
  newMonth: number;
  activeNow?: number;
  newActiveToday?: number;
  activeThisMonth?: number;
  activeWithOrders?: number;
  blockedToday?: number;
  blockedMonth?: number;
  blockedWithOrders?: number;
}

interface Customer {
  id: number;
  full_name: string;
  full_name_bn?: string;
  email: string;
  phone: string;
  profile_image?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login_at?: string;
  last_order_date?: string;
  total_orders: number;
  total_spent: number;
  block_reason?: string;
  blocked_at?: string;
  blocked_by_name?: string;
}

interface CustomerDetails extends Customer {
  stats: {
    total_orders: number;
    delivered_orders: number;
    pending_orders: number;
    processing_orders: number;
    shipped_orders: number;
    cancelled_orders: number;
    returned_orders: number;
    total_spending: number;
  };
  recent_orders: any[];
}

interface AdminCustomersProps {
  language: 'en' | 'bn';
  initialStatus?: string;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({ language, initialStatus = 'all' }) => {
  const [view, setView] = useState<'list' | 'details'>('list');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [sortBy, setSortBy] = useState('newest');
  const [orderFilter, setOrderFilter] = useState('all');
  const [blockReasonFilter, setBlockReasonFilter] = useState('all');
  
  // Advanced Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minOrders, setMinOrders] = useState('');
  const [minSpent, setMinSpent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/customers/stats', {
        headers: adminService.getHeaders()
      });
      if (response.status === 401) {
        setError(language === 'bn' ? 'সেশন শেষ হয়ে গেছে। দয়া করে আবার লগইন করুন।' : 'Session expired. Please log in again.');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const fetchCustomers = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search,
        status: statusFilter,
        sortBy,
        hasOrders: orderFilter,
        block_reason: blockReasonFilter,
        min_orders: minOrders,
        min_spent: minSpent,
        start_date: startDate,
        end_date: endDate
      });

      const response = await fetch(`/api/admin/customers?${query.toString()}`, {
        headers: adminService.getHeaders()
      });
      
      if (response.status === 401) {
        setError(language === 'bn' ? 'সেশন শেষ হয়ে গেছে। দয়া করে আবার লগইন করুন।' : 'Session expired. Please log in again.');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setCustomers(data.data.customers);
        setPagination(data.data.pagination);
      } else {
        setError(data.error || 'Failed to load customers');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, sortBy, orderFilter, pagination.limit, minOrders, minSpent, startDate, endDate]);

  const fetchCustomerDetails = async (id: number) => {
    setIsDetailsLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/${id}`, {
        headers: adminService.getHeaders()
      });

      if (response.status === 401) {
        alert(language === 'bn' ? 'সেশন শেষ হয়ে গেছে। দয়া করে আবার লগইন করুন।' : 'Session expired. Please log in again.');
        window.location.reload();
        return;
      }

      const data = await response.json();
      if (data.success) {
        setCustomerDetails(data.data);
        setView('details');
      } else {
        alert(data.error || 'Failed to load customer details');
      }
    } catch (err) {
      alert('Error connecting to server');
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const query = new URLSearchParams({
        search,
        status: statusFilter
      });
      const response = await fetch(`/api/admin/customers/export/csv?${query.toString()}`, {
        headers: adminService.getHeaders()
      });
      
      if (response.status === 401) {
        alert(language === 'bn' ? 'সেশন শেষ হয়ে গেছে। দয়া করে আবার লগইন করুন।' : 'Session expired. Please log in again.');
        window.location.reload();
        return;
      }

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_export_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Export failed');
      }
    } catch (err) {
      alert('Error exporting customers');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    let reason = '';
    if (newStatus === 'suspended') {
      reason = prompt(language === 'bn' ? 'ব্লক করার কারণ লিখুন:' : 'Enter reason for blocking:', 'Violation of terms of service') || '';
      if (!reason) return; // Cancel if no reason provided
    } else {
      if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি এই কাস্টমারকে আনব্লক করতে চান?' : 'Are you sure you want to unblock this customer?')) return;
    }
    
    try {
      const response = await fetch(`/api/admin/customers/${id}/status`, {
        method: 'PUT',
        headers: {
          ...adminService.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, reason })
      });
      const data = await response.json();
      if (data.success) {
        if (view === 'details' && customerDetails) {
          setCustomerDetails({ ...customerDetails, status: newStatus as any });
        }
        fetchCustomers(pagination.page);
        fetchStats();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCustomerId) return;

    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    try {
      const response = await fetch(`/api/admin/customers/${selectedCustomerId}/upload-image`, {
        method: 'POST',
        headers: adminService.getHeaders(),
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        if (customerDetails) {
          setCustomerDetails({ ...customerDetails, profile_image: data.data.imageUrl });
        }
        fetchCustomers(pagination.page);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const getThumbnail = (url: string | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return url.replace('.webp', '_thumb.webp');
  };

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    full_name_bn: '',
    phone: '',
    address: ''
  });

  const handleUpdateInfo = async () => {
    if (!selectedCustomerId) return;
    try {
      const response = await fetch(`/api/admin/customers/${selectedCustomerId}`, {
        method: 'PUT',
        headers: {
          ...adminService.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      const data = await response.json();
      if (data.success) {
        if (customerDetails) {
          setCustomerDetails({ ...customerDetails, ...editForm });
        }
        setIsEditingInfo(false);
        fetchCustomers(pagination.page);
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (err) {
      alert('Error updating information');
    }
  };

  useEffect(() => {
    if (customerDetails) {
      setEditForm({
        full_name: customerDetails.full_name,
        full_name_bn: customerDetails.full_name_bn || '',
        phone: customerDetails.phone,
        address: customerDetails.address || ''
      });
    }
  }, [customerDetails]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, statusFilter, sortBy, orderFilter]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (view === 'details' && customerDetails) {
    return (
      <div className="space-y-6 animate-fade-in text-left max-w-6xl mx-auto pb-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('list')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-800">
              {language === 'bn' ? 'কাস্টমার ডিটেইলস' : 'Customer Details'}
            </h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              ID: {customerDetails.id} · {formatDate(customerDetails.created_at)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Profile */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm overflow-hidden relative">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <img 
                    src={customerDetails.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(customerDetails.full_name)}&background=random`} 
                    alt={customerDetails.full_name}
                    className="w-24 h-24 rounded-full border-4 border-emerald-50 object-cover shadow-sm group-hover:opacity-75 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/40 rounded-full p-2">
                      <RefreshCcw className={`w-5 h-5 text-white ${isUploading ? 'animate-spin' : ''}`} />
                    </div>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                    customerDetails.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                    {customerDetails.status === 'active' ? <CheckCircle className="w-3 h-3 text-white" /> : <Ban className="w-3 h-3 text-white" />}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                </div>
                
                <div>
                  {isEditingInfo ? (
                    <div className="space-y-2 max-w-[200px] mx-auto">
                      <input 
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                        placeholder="Full Name"
                        className="w-full px-2 py-1 bg-gray-50 border border-gray-100 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <input 
                        type="text"
                        value={editForm.full_name_bn}
                        onChange={(e) => setEditForm({...editForm, full_name_bn: e.target.value})}
                        placeholder="বাংলা নাম"
                        className="w-full px-2 py-1 bg-gray-50 border border-gray-100 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 Bengali-font"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-lg font-black text-gray-800">{customerDetails.full_name}</h2>
                      {customerDetails.full_name_bn && (
                        <p className="text-sm font-bold text-gray-500 Bengali-font">{customerDetails.full_name_bn}</p>
                      )}
                    </>
                  )}
                  <p className="text-xs font-bold text-gray-400 tracking-tight">{customerDetails.email}</p>
                </div>

                <div className="w-full pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    {isEditingInfo ? (
                      <input 
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="flex-1 px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    ) : (
                      <span className="font-bold text-gray-700">{customerDetails.phone}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    {isEditingInfo ? (
                      <textarea 
                        value={editForm.address}
                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                        rows={2}
                        className="flex-1 px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                      />
                    ) : (
                      <span className="font-bold text-gray-700">{customerDetails.address || (language === 'bn' ? 'ঠিকানা দেয়া হয়নি' : 'No address provided')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-700">
                      {language === 'bn' ? 'সর্বশেষ অ্যাক্টিভিটি: ' : 'Last activity: '}
                      {customerDetails.last_login_at ? formatDate(customerDetails.last_login_at) : (language === 'bn' ? 'নেই' : 'N/A')}
                    </span>
                  </div>
                </div>

                <div className="w-full pt-4 space-y-2">
                  {isEditingInfo ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleUpdateInfo}
                        className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all"
                      >
                        {language === 'bn' ? 'সংরক্ষণ' : 'Save'}
                      </button>
                      <button 
                        onClick={() => setIsEditingInfo(false)}
                        className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all border border-gray-100"
                      >
                        {language === 'bn' ? 'বাতিল' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsEditingInfo(true)}
                      className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-100 mb-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      {language === 'bn' ? 'প্রোফাইল সম্পাদনা' : 'Edit Profile'}
                    </button>
                  )}
                  
                  {customerDetails.status === 'suspended' ? (
                    <button 
                      onClick={() => handleStatusChange(customerDetails.id, 'active')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      {language === 'bn' ? 'অ্যাকাউন্ট আনব্লক করুন' : 'Unblock Account'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStatusChange(customerDetails.id, 'suspended')}
                      className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      {language === 'bn' ? 'অ্যাকাউন্ট ব্লক করুন' : 'Block Account'}
                    </button>
                  )}
                  <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-100">
                    <Mail className="w-4 h-4" />
                    {language === 'bn' ? 'বার্তা পাঠান' : 'Send Message'}
                  </button>
                </div>
              </div>
            </div>

            {/* Account Info Card */}
            <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                {language === 'bn' ? 'অ্যাকাউন্ট তথ্য' : 'Account Information'}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-bold">{language === 'bn' ? 'নিবন্ধন তারিখ' : 'Registration Date'}</span>
                  <span className="text-gray-700 font-bold">{formatDate(customerDetails.created_at)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-bold">{language === 'bn' ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                    customerDetails.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {customerDetails.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-bold">{language === 'bn' ? 'ভাষা' : 'Language'}</span>
                  <span className="text-gray-700 font-bold uppercase">{customerDetails.language || 'BN'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Stats & Orders */}
          <div className="lg:col-span-2 space-y-6 text-left">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{language === 'bn' ? 'মোট অর্ডার' : 'Total Orders'}</span>
                <p className="text-xl font-black text-gray-800">{customerDetails.stats.total_orders}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{language === 'bn' ? 'ডেলিভারড' : 'Delivered'}</span>
                <p className="text-xl font-black text-emerald-600">{customerDetails.stats.delivered_orders}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{language === 'bn' ? 'মোট ব্যয়' : 'Total Spent'}</span>
                <p className="text-xl font-black text-gray-800">৳{customerDetails.stats.total_spending.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{language === 'bn' ? 'বাতিল' : 'Cancelled'}</span>
                <p className="text-xl font-black text-red-600">{customerDetails.stats.cancelled_orders}</p>
              </div>
            </div>

            {/* Order Summary Detailed */}
            <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                  {language === 'bn' ? 'সাম্প্রতিক অর্ডারসমূহ' : 'Recent Orders'}
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] uppercase tracking-wider text-gray-400 font-black border-b border-gray-100">
                      <th className="px-4 py-3">{language === 'bn' ? 'অর্ডার আইডি' : 'Order ID'}</th>
                      <th className="px-4 py-3">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                      <th className="px-4 py-3">{language === 'bn' ? 'টোটাল' : 'Total'}</th>
                      <th className="px-4 py-3">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                      <th className="px-4 py-3 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customerDetails.recent_orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-xs text-gray-400 font-bold">
                          {language === 'bn' ? 'কোনো অর্ডার পাওয়া যায়নি' : 'No orders found for this customer.'}
                        </td>
                      </tr>
                    ) : (
                      customerDetails.recent_orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-800 text-xs">{order.id}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-medium">{formatDate(order.created_at)}</td>
                          <td className="px-4 py-3 font-bold text-gray-800 text-xs">৳{Number(order.total_amount).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' :
                              order.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => window.location.hash = `#/admin/orders/${order.id}`}
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-emerald-600 transition-all active:scale-95"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left max-w-7xl mx-auto pb-10" id="admin-customers-root">
      {/* 1. Page Title & Top Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 leading-tight">
            {statusFilter === 'active' 
              ? (language === 'bn' ? 'সক্রিয় কাস্টমার' : 'Active Customers')
              : (language === 'bn' ? 'সব কাস্টমার' : 'All Customers')
            }
          </h1>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-1">
            {statusFilter === 'active'
              ? (language === 'bn' ? 'বর্তমানে সক্রিয় অ্যাকাউন্টধারী গ্রাহক' : 'Customers with currently active accounts')
              : (language === 'bn' ? 'গ্রাহক ব্যবস্থাপনা এবং ইনসাইটস' : 'Customer Management & Insights')
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { fetchStats(); fetchCustomers(1); }}
            className="p-2.5 bg-white border border-gray-150 text-gray-600 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-xs"
            title="Refresh"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all active:scale-95 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            {language === 'bn' ? 'এক্সপোর্ট' : 'Export List'}
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3" id="admin-customers-stats-grid">
        {statusFilter === 'active' ? (
          // Active Specific Stats
          [
            { id: 'total-active', labelEn: 'Total Active', labelBn: 'মোট সক্রিয়', value: stats?.active, icon: Users, color: 'text-gray-800', bg: 'bg-white' },
            { id: 'active-now', labelEn: 'Active Now', labelBn: 'বর্তমানে সক্রিয়', value: stats?.activeNow, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-white' },
            { id: 'active-today', labelEn: 'New Active Today', labelBn: 'আজকের সক্রিয়', value: stats?.newActiveToday, icon: UserPlus, color: 'text-blue-600', bg: 'bg-white' },
            { id: 'active-month', labelEn: 'Active This Month', labelBn: 'এই মাসের সক্রিয়', value: stats?.activeThisMonth, icon: Calendar, color: 'text-purple-600', bg: 'bg-white' },
            { id: 'active-orders', labelEn: 'With Orders', labelBn: 'অর্ডারসহ গ্রাহক', value: stats?.activeWithOrders, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-white' },
          ].map((stat, idx) => (
            <div key={idx} id={`admin-customers-stat-${stat.id}`} className={`${stat.bg} p-4 rounded-2xl border border-gray-150 shadow-sm space-y-1 relative overflow-hidden group`}>
              <div className={`absolute top-0 right-0 w-12 h-12 ${stat.color} opacity-5 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-full h-full -rotate-12 translate-x-3 -translate-y-3" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                {language === 'bn' ? stat.labelBn : stat.labelEn}
              </span>
              <p className={`text-xl font-black ${stat.color}`}>
                {stat.value !== undefined ? stat.value.toLocaleString() : '...'}
              </p>
            </div>
          ))
        ) : statusFilter === 'blocked' ? (
          // Blocked Specific Stats
          [
            { id: 'total-blocked', labelEn: 'Total Blocked', labelBn: 'মোট ব্লকড', value: stats?.blocked, icon: UserX, color: 'text-red-700', bg: 'bg-white' },
            { id: 'blocked-today', labelEn: 'Blocked Today', labelBn: 'আজ ব্লকড', value: stats?.blockedToday, icon: Ban, color: 'text-red-600', bg: 'bg-white' },
            { id: 'blocked-month', labelEn: 'Blocked Month', labelBn: 'এই মাসে ব্লকড', value: stats?.blockedMonth, icon: Calendar, color: 'text-red-500', bg: 'bg-white' },
            { id: 'blocked-orders', labelEn: 'Had Orders', labelBn: 'অর্ডার ছিল', value: stats?.blockedWithOrders, icon: ShoppingBag, color: 'text-gray-600', bg: 'bg-white' },
            { id: 'total-customers', labelEn: 'Total Records', labelBn: 'মোট কাস্টমার', value: stats?.total, icon: Users, color: 'text-gray-400', bg: 'bg-white' },
          ].map((stat, idx) => (
            <div key={idx} id={`admin-customers-stat-${stat.id}`} className={`${stat.bg} p-4 rounded-2xl border border-gray-150 shadow-sm space-y-1 relative overflow-hidden group`}>
              <div className={`absolute top-0 right-0 w-12 h-12 ${stat.color} opacity-5 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-full h-full -rotate-12 translate-x-3 -translate-y-3" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                {language === 'bn' ? stat.labelBn : stat.labelEn}
              </span>
              <p className={`text-xl font-black ${stat.color}`}>
                {stat.value !== undefined ? stat.value.toLocaleString() : '...'}
              </p>
            </div>
          ))
        ) : (
          // All Customers Stats
          [
            { id: 'total', labelEn: 'Total Customers', labelBn: 'মোট কাস্টমার', value: stats?.total, icon: Users, color: 'text-gray-800', bg: 'bg-white' },
            { id: 'active', labelEn: 'Active Now', labelBn: 'সক্রিয় কাস্টমার', value: stats?.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-white' },
            { id: 'blocked', labelEn: 'Blocked Accounts', labelBn: 'ব্লকড কাস্টমার', value: stats?.blocked, icon: UserX, color: 'text-red-600', bg: 'bg-white' },
            { id: 'today', labelEn: 'New Today', labelBn: 'আজকের নতুন', value: stats?.newToday, icon: UserPlus, color: 'text-blue-600', bg: 'bg-white' },
            { id: 'month', labelEn: 'This Month', labelBn: 'এই মাসে নতুন', value: stats?.newMonth, icon: Calendar, color: 'text-purple-600', bg: 'bg-white' },
          ].map((stat, idx) => (
            <div key={idx} id={`admin-customers-stat-${stat.id}`} className={`${stat.bg} p-4 rounded-2xl border border-gray-150 shadow-sm space-y-1 relative overflow-hidden group`}>
              <div className={`absolute top-0 right-0 w-12 h-12 ${stat.color} opacity-5 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-full h-full -rotate-12 translate-x-3 -translate-y-3" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                {language === 'bn' ? stat.labelBn : stat.labelEn}
              </span>
              <p className={`text-xl font-black ${stat.color}`}>
                {stat.value !== undefined ? stat.value.toLocaleString() : '...'}
              </p>
            </div>
          ))
        )}
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm space-y-4" id="admin-customers-filter-bar">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative" id="admin-customers-search-container">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              id="admin-customers-search-input"
              type="text" 
              placeholder={language === 'bn' ? 'নাম, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন...' : 'Search by name, email, phone or ID...'}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2" id="admin-customers-filter-actions">
            <button 
              id="admin-customers-advanced-filter-toggle"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                showAdvancedFilters ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              {language === 'bn' ? 'ফিল্টার' : 'Filters'}
            </button>
            <select 
              id="admin-customers-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">{language === 'bn' ? 'সব স্ট্যাটাস' : 'All Status'}</option>
              <option value="active">{language === 'bn' ? 'সক্রিয়' : 'Active'}</option>
              <option value="blocked">{language === 'bn' ? 'ব্লকড' : 'Blocked'}</option>
            </select>
            <select 
              id="admin-customers-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="newest">{language === 'bn' ? 'নতুন আগে' : 'Newest First'}</option>
              <option value="oldest">{language === 'bn' ? 'পুরানো আগে' : 'Oldest First'}</option>
              <option value="name_az">{language === 'bn' ? 'নাম (A-Z)' : 'Name (A-Z)'}</option>
              <option value="name_za">{language === 'bn' ? 'নাম (Z-A)' : 'Name (Z-A)'}</option>
              <option value="highest_spending">{language === 'bn' ? 'সর্বোচ্চ ব্যয়' : 'Highest Spending'}</option>
              <option value="most_orders">{language === 'bn' ? 'সর্বোচ্চ অর্ডার' : 'Most Orders'}</option>
              <option value="recently_active">{language === 'bn' ? 'সম্প্রতি সক্রিয়' : 'Recently Active'}</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-50">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'bn' ? 'অর্ডার ফিল্টার' : 'Order Filter'}</label>
                  <select 
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-600 outline-none"
                  >
                    <option value="all">{language === 'bn' ? 'সব' : 'All'}</option>
                    <option value="yes">{language === 'bn' ? 'অর্ডার করেছে' : 'With Orders'}</option>
                    <option value="no">{language === 'bn' ? 'অর্ডার নেই' : 'No Orders'}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'bn' ? 'ন্যূনতম অর্ডার' : 'Min Orders'}</label>
                  <input 
                    type="number"
                    value={minOrders}
                    onChange={(e) => setMinOrders(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-600 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'bn' ? 'ন্যূনতম ব্যয় (৳)' : 'Min Spent (৳)'}</label>
                  <input 
                    type="number"
                    value={minSpent}
                    onChange={(e) => setMinSpent(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-600 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'bn' ? 'নিবন্ধন শুরু' : 'Reg Start'}</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-600 outline-none"
                  />
                </div>
                {statusFilter === 'blocked' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'bn' ? 'ব্লক করার কারণ' : 'Block Reason'}</label>
                    <select 
                      value={blockReasonFilter}
                      onChange={(e) => setBlockReasonFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-600 outline-none"
                    >
                      <option value="all">{language === 'bn' ? 'সব' : 'All Reasons'}</option>
                      <option value="Violation of terms of service">{language === 'bn' ? 'পলিসি ভায়োলেশন' : 'Policy Violation'}</option>
                      <option value="Fraudulent activity">{language === 'bn' ? 'প্রতারণা' : 'Fraud'}</option>
                      <option value="Spamming">{language === 'bn' ? 'স্প্যামিং' : 'Spam'}</option>
                    </select>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Customer List Table/Cards */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-gray-400">{language === 'bn' ? 'কাস্টমার তালিকা লোড হচ্ছে...' : 'Loading customer directory...'}</p>
          </div>
        ) : error ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-800">{error}</p>
            <button 
              onClick={() => fetchCustomers(1)}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black transition-all"
            >
              {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again'}
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto border border-gray-100">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-800">
                {statusFilter === 'active' 
                  ? (language === 'bn' ? 'কোনো সক্রিয় কাস্টমার পাওয়া যায়নি' : 'No active customers found')
                  : statusFilter === 'blocked'
                  ? (language === 'bn' ? 'কোনো ব্লকড কাস্টমার পাওয়া যায়নি' : 'No blocked customers found')
                  : (language === 'bn' ? 'কোনো কাস্টমার পাওয়া যায়নি' : 'No customers matched your search')
                }
              </p>
              <p className="text-xs text-gray-400 font-bold mt-1">
                {statusFilter === 'active'
                  ? (language === 'bn' ? 'বর্তমানে কোনো সক্রিয় কাস্টমার নেই অথবা ফিল্টার পরিবর্তন করুন।' : 'There are no active customers at the moment or try adjusting your filters.')
                  : statusFilter === 'blocked'
                  ? (language === 'bn' ? 'বর্তমানে কোনো ব্লকড কাস্টমার নেই অথবা ফিল্টার পরিবর্তন করুন।' : 'There are no blocked customers at the moment or try adjusting your filters.')
                  : (language === 'bn' ? 'সার্চ কুয়েরি পরিবর্তন করে দেখুন।' : 'Try adjusting your search or filters.')
                }
              </p>
            </div>
            <button 
              onClick={() => { setSearch(''); setStatusFilter(initialStatus); setOrderFilter('all'); setSortBy('newest'); }}
              className="px-6 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-100 transition-all"
            >
              {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset All Filters'}
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] uppercase tracking-wider text-gray-400 font-black border-b border-gray-100">
                    <th className="px-5 py-4">{language === 'bn' ? 'কাস্টমার প্রোফাইল' : 'Customer Profile'}</th>
                    {statusFilter === 'blocked' ? (
                      <>
                        <th className="px-5 py-4">{language === 'bn' ? 'ব্লক ইনফো' : 'Block Info'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'অর্ডার ইনসাইটস' : 'Order Insights'}</th>
                      </>
                    ) : (
                      <>
                        <th className="px-5 py-4">{language === 'bn' ? 'অর্ডার ইনসাইটস' : 'Order Insights'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                      </>
                    )}
                    <th className="px-5 py-4">{language === 'bn' ? 'নিবন্ধন' : 'Registration'}</th>
                    <th className="px-5 py-4 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={getThumbnail(cust.profile_image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.full_name)}&background=random`} 
                            alt={cust.full_name}
                            className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-xs"
                            loading="lazy"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-[12px] font-black text-gray-800 leading-tight group-hover:text-emerald-700 transition-colors">{cust.full_name}</p>
                              {cust.full_name_bn && (
                                <span className="text-[10px] text-gray-400 font-bold">({cust.full_name_bn})</span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">{cust.email} · {cust.phone}</p>
                          </div>
                        </div>
                      </td>
                      {statusFilter === 'blocked' ? (
                        <>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md w-fit">
                                {cust.block_reason || (language === 'bn' ? 'অনির্ধারিত কারণ' : 'Unspecified Reason')}
                              </span>
                              {cust.blocked_at && (
                                <span className="text-[9px] font-bold text-gray-400">
                                  {language === 'bn' ? 'ব্লকড:' : 'Blocked:'} {new Date(cust.blocked_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                              {cust.blocked_by_name && (
                                <span className="text-[9px] font-bold text-gray-300 italic">
                                  By: {cust.blocked_by_name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-tight">{language === 'bn' ? 'অর্ডার' : 'Orders'}</span>
                                  <span className="text-[12px] font-black text-gray-800">{cust.total_orders}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-tight">{language === 'bn' ? 'ব্যয়' : 'Spent'}</span>
                                  <span className="text-[12px] font-black text-emerald-700">৳{Number(cust.total_spent).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-tight">{language === 'bn' ? 'অর্ডার' : 'Orders'}</span>
                                  <span className="text-[12px] font-black text-gray-800">{cust.total_orders}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-tight">{language === 'bn' ? 'ব্যয়' : 'Spent'}</span>
                                  <span className="text-[12px] font-black text-emerald-700">৳{Number(cust.total_spent).toLocaleString()}</span>
                                </div>
                              </div>
                              {cust.last_order_date && (
                                <span className="text-[9px] font-bold text-gray-400 italic">
                                  {language === 'bn' ? 'শেষ অর্ডার:' : 'Last Order:'} {new Date(cust.last_order_date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${
                                cust.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                              }`}>
                                {cust.status === 'suspended' ? 'Blocked' : cust.status}
                              </span>
                              {cust.last_login_at && (
                                <span className="text-[9px] font-bold text-gray-400">
                                  {language === 'bn' ? 'সক্রিয়:' : 'Active:'} {new Date(cust.last_login_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                      <td className="px-5 py-4">
                        <span className="text-[11px] font-bold text-gray-500">{formatDate(cust.created_at)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => fetchCustomerDetails(cust.id)}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(cust.id, cust.status === 'suspended' ? 'active' : 'suspended')}
                            className={`p-1.5 rounded-lg transition-all ${
                              cust.status === 'suspended' ? 'hover:bg-emerald-50 text-emerald-600' : 'hover:bg-red-50 text-red-500'
                            }`}
                            title={cust.status === 'suspended' ? 'Unblock' : 'Block'}
                          >
                            {cust.status === 'suspended' ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-50">
              {customers.map((cust) => (
                <div key={cust.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-left">
                      <img 
                        src={getThumbnail(cust.profile_image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.full_name)}&background=random`} 
                        alt={cust.full_name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-xs"
                        loading="lazy"
                      />
                      <div>
                        <p className="text-xs font-black text-gray-800 leading-tight">{cust.full_name}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{cust.email}</p>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      cust.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {cust.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                    <div className="text-center flex-1 border-r border-gray-100">
                      <span className="text-[9px] text-gray-400 font-black uppercase block tracking-tight">{language === 'bn' ? 'অর্ডার' : 'Orders'}</span>
                      <span className="text-xs font-black text-gray-800">{cust.total_orders}</span>
                    </div>
                    <div className="text-center flex-1">
                      <span className="text-[9px] text-gray-400 font-black uppercase block tracking-tight">{language === 'bn' ? 'মোট ব্যয়' : 'Total Spent'}</span>
                      <span className="text-xs font-black text-emerald-700">৳{Number(cust.total_spent).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button 
                      onClick={() => fetchCustomerDetails(cust.id)}
                      className="flex-1 py-2 bg-white border border-gray-150 text-gray-700 rounded-xl text-[10px] font-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {language === 'bn' ? 'প্রোফাইল' : 'View Profile'}
                    </button>
                    <button 
                      onClick={() => handleStatusChange(cust.id, cust.status === 'suspended' ? 'active' : 'suspended')}
                      className={`flex-1 py-2 border rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${
                        cust.status === 'suspended' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'
                      }`}
                    >
                      {cust.status === 'suspended' ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                      {cust.status === 'suspended' ? (language === 'bn' ? 'আনব্লক' : 'Unblock') : (language === 'bn' ? 'ব্লক করুন' : 'Block')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 4. Pagination */}
      {!isLoading && customers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            {language === 'bn' 
              ? `পেজ ${pagination.page} / ${pagination.totalPages} (${pagination.total} জন কাস্টমার)` 
              : `Showing Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} Customers)`}
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={pagination.page === 1}
              onClick={() => fetchCustomers(pagination.page - 1)}
              className="p-2.5 bg-white border border-gray-150 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Simple Page Numbers */}
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => fetchCustomers(p)}
                    className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all active:scale-95 shadow-xs ${
                      pagination.page === p ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white border border-gray-150 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              {pagination.totalPages > 5 && <span className="px-1 text-gray-300 font-black">...</span>}
            </div>

            <button 
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchCustomers(pagination.page + 1)}
              className="p-2.5 bg-white border border-gray-150 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
