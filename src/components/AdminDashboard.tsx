import React, { useState, useEffect, useRef } from 'react';
import { 
  Leaf, 
  Menu as MenuIcon, 
  X, 
  LayoutDashboard, 
  ShoppingBag, 
  ShoppingCart, 
  Users, 
  User,
  Gift, 
  Truck, 
  CreditCard, 
  ShieldCheck,
  BarChart3, 
  FileText, 
  MessageSquare, 
  Headset, 
  Image,
  Settings, 
  LogOut, 
  Bell, 
  ChevronDown, 
  ChevronUp,
  Globe, 
  Calendar,
  AlertCircle,
  PlusCircle,
  List,
  FolderTree,
  Boxes,
  FileSpreadsheet,
  Layers,
  Database,
  Lock,
  Percent,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  UserX,
  MapPin,
  Map,
  BadgePercent,
  HelpCircle,
  Zap
} from 'lucide-react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';
import { AdminSeoSettings } from './AdminSeoSettings';
import { AdminProductList } from './AdminProductList';
import { AdminCategories } from './AdminCategories';
import { AdminBrands } from './AdminBrands';
import { AdminStockManagement } from './AdminStockManagement';
import { ProductEditor } from './ProductEditor';
import { AdminTrackingOverview } from './AdminTrackingOverview';
import { AdminFacebookPixel } from './AdminFacebookPixel';
import { AdminTikTokPixel } from './AdminTikTokPixel';
import { AdminGoogleAnalytics } from './AdminGoogleAnalytics';
import { AdminWebsiteTracking } from './AdminWebsiteTracking';
import { AdminGeneralSettings } from './AdminGeneralSettings';
import { AdminStoreInformation } from './AdminStoreInformation';
import { AdminLanguageSettings } from './AdminLanguageSettings';
import { AdminNotificationSettings } from './AdminNotificationSettings';
import { AdminSecuritySettings } from './AdminSecuritySettings';
import { AdminRolesModule } from './AdminRolesModule';
import { AdminDatabaseBackup } from './AdminDatabaseBackup';
import { AdminCustomerMessages } from './AdminCustomerMessages';
import { AdminSupportTickets } from './AdminSupportTickets';
import { AdminReviews } from './AdminReviews';
import { AdminHomepageCMS } from './AdminHomepageCMS';
import { AdminAboutUs } from './AdminAboutUs';
import { AdminContactCMS } from './AdminContactCMS';
import { AdminPoliciesModule } from './AdminPoliciesModule';
import { AdminFAQModule } from './AdminFAQModule';
import { AdminFooterManagement } from './AdminFooterManagement';
import { AdminPlaton } from './AdminPlaton';
import { AdminSalesReport } from './AdminSalesReport';
import { AdminOrderReport } from './AdminOrderReport';
import { AdminProductReport } from './AdminProductReport';
import { AdminCustomerReport } from './AdminCustomerReport';
import { AdminPaymentReport } from './AdminPaymentReport';
import { AdminReportsDashboard } from './AdminReportsDashboard';
import { AdminDeliveryReport } from './AdminDeliveryReport';
import { AdminCustomers } from './AdminCustomers';
import { AdminOrders } from './AdminOrders';
import { AdminPaymentSettings } from './AdminPaymentSettings';
import { AdminPaymentMethods } from './AdminPaymentMethods';
import { AdminProfile } from './AdminProfile';
import AdminMainBanners from './AdminMainBanners';
import AdminCategoryBanners from './AdminCategoryBanners';
import AdminAuthBanners from './AdminAuthBanners';
import AdminPromoBanners from './AdminPromoBanners';
import AdminBannerEditor from './AdminBannerEditor';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface SubItem {
  id: string;
  labelEn: string;
  labelBn: string;
  icon: React.ComponentType<any>;
  path: string;
}

interface NavItem {
  id: string;
  labelEn: string;
  labelBn: string;
  icon: React.ComponentType<any>;
  path: string;
  subItems?: SubItem[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { language, changeLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bannerViewMode, setBannerViewMode] = useState<'list' | 'edit'>('list');
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(adminService.getLocalProfileState());
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    products: false,
    orders: false,
    customers: false,
    coupons: false,
    shipping: false,
    payments: false,
    reports: false,
    cms: false,
    banners: false,
    reviews: false,
    support: false,
    settings: false,
  });
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [analyticsFilter, setAnalyticsFilter] = useState<'today' | '7days' | '30days' | 'year'>('7days');

  // Dynamic statistics states
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    todayOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    todaySales: 0,
    totalSales: 0,
    newCustomers: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Sync session and enforce SEO bots blocking tags on mount
  useEffect(() => {
    adminService.checkSession().then(user => {
      if (user) {
        setSessionUser(user);
      }
    });

    let robotsMeta = document.querySelector('meta[name="robots"]');
    const wasExisted = !!robotsMeta;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow, noarchive');

    return () => {
      if (robotsMeta) {
        if (wasExisted) {
          robotsMeta.setAttribute('content', 'index, follow');
        } else {
          robotsMeta.remove();
        }
      }
    };
  }, []);

  // Sync hash routing with side navigation
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/admin')) {
        const path = hash.replace('#/admin', '');
        if (!path || path === '/' || path === '/dashboard') {
          setActiveTab('dashboard');
        } else {
          const cleanPath = path.startsWith('/') ? path.substring(1) : path;
          let calculatedTab = cleanPath.replace(/\//g, '-');
          if (calculatedTab === 'platon') {
            calculatedTab = 'payments-platon';
          } else if (calculatedTab === 'products') {
            calculatedTab = 'products-all';
          } else if (calculatedTab === 'categories') {
            calculatedTab = 'products-categories';
          } else if (calculatedTab === 'brands') {
            calculatedTab = 'products-brands';
          } else if (calculatedTab === 'stock' || calculatedTab === 'inventory') {
            calculatedTab = 'products-stock';
          } else if (calculatedTab === 'reviews') {
            calculatedTab = 'reviews-products';
          }
          setActiveTab(calculatedTab);
        }
      }
    };
    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, []);

  // Click outside hooks for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Implement body scroll lock & ESC key listener for mobile side-drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Load and calculate dynamic statistics from MySQL
  const refreshStatistics = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/dashboard-details', {
        headers: adminService.getHeaders()
      });

      if (!res.ok) {
        throw new Error(language === 'bn' 
          ? 'সার্ভার থেকে ড্যাশবোর্ড ডাটা লোড করতে ব্যর্থ হয়েছে।' 
          : 'Failed to retrieve analytical metrics from the server.');
      }

      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
      }
      setRecentOrders(data.recentOrders || []);
      setRecentCustomers(data.recentCustomers || []);
      setTopProducts(data.topProducts || []);
      setChartData(data.chartData || []);
    } catch (err: any) {
      console.error('[Admin Dashboard Refresh Error] ', err);
      setErrorMessage(err.message || 'An unexpected error occurred while loading metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      refreshStatistics();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await adminService.logout();
    onLogout();
  };

  // Hierarchy of exactly 12 sidebar menu navigation links, matching requested blueprint exactly
  const navigationStructure: NavItem[] = [
    { 
      id: 'dashboard', 
      labelEn: 'Dashboard', 
      labelBn: 'ড্যাশবোর্ড', 
      icon: LayoutDashboard, 
      path: '#/admin/dashboard' 
    },
    { 
      id: 'platon', 
      labelEn: 'PLATON', 
      labelBn: 'প্লাটন', 
      icon: ShieldCheck, 
      path: '#/admin/platon' 
    },
    { 
      id: 'profile', 
      labelEn: 'My Profile', 
      labelBn: 'আমার প্রোফাইল', 
      icon: User, 
      path: '#/admin/profile' 
    },
    { 
      id: 'products', 
      labelEn: 'Product Management', 
      labelBn: 'প্রোডাক্ট ম্যানেজমেন্ট', 
      icon: ShoppingBag, 
      path: '#/admin/products',
      subItems: [
        { id: 'products-all', labelEn: 'Product', labelBn: 'প্রোডাক্ট', icon: List, path: '#/admin/products' },
        { id: 'products-categories', labelEn: 'Categories', labelBn: 'ক্যাটাগরি সমূহ', icon: FolderTree, path: '#/admin/categories' },
        { id: 'products-stock', labelEn: 'Stock Management', labelBn: 'স্টক ম্যানেজমেন্ট', icon: Boxes, path: '#/admin/stock' }
      ]
    },
    {
      id: 'products-brands',
      labelEn: 'Brands',
      labelBn: 'ব্র্যান্ড সমূহ',
      icon: Layers,
      path: '#/admin/brands'
    },
    { 
      id: 'orders', 
      labelEn: 'Orders', 
      labelBn: 'অর্ডার সমূহ', 
      icon: ShoppingCart, 
      path: '#/admin/orders',
      subItems: [
        { id: 'orders-all', labelEn: 'All Orders', labelBn: 'সব অর্ডার', icon: FileText, path: '#/admin/orders' },
        { id: 'orders-pending', labelEn: 'Pending Orders', labelBn: 'পেন্ডিং অর্ডার', icon: Clock, path: '#/admin/orders/pending' },
        { id: 'orders-processing', labelEn: 'Processing', labelBn: 'প্রসেসিং', icon: Boxes, path: '#/admin/orders/processing' },
        { id: 'orders-shipped', labelEn: 'Shipped', labelBn: 'শিপড', icon: Truck, path: '#/admin/orders/shipped' },
        { id: 'orders-delivered', labelEn: 'Delivered', labelBn: 'ডেলিভারড', icon: CheckCircle2, path: '#/admin/orders/delivered' },
        { id: 'orders-delivery-report', labelEn: 'Delivery Report', labelBn: 'ডেলিভারি রিপোর্ট', icon: Truck, path: '#/admin/orders/delivery-report' },
        { id: 'orders-cancelled', labelEn: 'Cancelled', labelBn: 'বাতিলকৃত', icon: X, path: '#/admin/orders/cancelled' },
        { id: 'orders-returned', labelEn: 'Returned / Refunded', labelBn: 'ফেরত / রিফান্ড', icon: ShieldAlert, path: '#/admin/orders/returned' }
      ]
    },
    { 
      id: 'customers', 
      labelEn: 'Customers', 
      labelBn: 'কাস্টমারস', 
      icon: Users, 
      path: '#/admin/customers',
      subItems: [
        { id: 'customers-all', labelEn: 'All Customers', labelBn: 'সব কাস্টমার', icon: Users, path: '#/admin/customers' },
        { id: 'customers-active', labelEn: 'Active Customers', labelBn: 'সক্রিয় কাস্টমার', icon: UserCheck, path: '#/admin/customers/active' },
        { id: 'customers-blocked', labelEn: 'Blocked Customers', labelBn: 'ব্লকড কাস্টমার', icon: UserX, path: '#/admin/customers/blocked' }
      ]
    },
    { 
      id: 'coupons', 
      labelEn: 'Coupons & Offers', 
      labelBn: 'কুপন ও অফার', 
      icon: Gift, 
      path: '#/admin/coupons',
      subItems: [
        { id: 'coupons-all', labelEn: 'Coupons', labelBn: 'কুপন সমূহ', icon: Percent, path: '#/admin/coupons' },
        { id: 'coupons-flash', labelEn: 'Flash Sale', labelBn: 'ফ্ল্যাশ সেল', icon: BadgePercent, path: '#/admin/flash-sale' },
        { id: 'coupons-offers', labelEn: 'Offers', labelBn: 'অফার সমূহ', icon: Gift, path: '#/admin/offers' }
      ]
    },
    { 
      id: 'shipping', 
      labelEn: 'Delivery / Shipping', 
      labelBn: 'ডেলিভারি / শিপিং', 
      icon: Truck, 
      path: '#/admin/shipping',
      subItems: [
        { id: 'shipping-areas', labelEn: 'Delivery Areas', labelBn: 'ডেলিভারি এলাকা', icon: MapPin, path: '#/admin/shipping/areas' },
        { id: 'shipping-charges', labelEn: 'Delivery Charges', labelBn: 'ডেলিভারি চার্জ', icon: CreditCard, path: '#/admin/shipping/charges' },
        { id: 'shipping-couriers', labelEn: 'Couriers', labelBn: 'কুরিয়ার তালিকা', icon: Truck, path: '#/admin/shipping/couriers' },
        { id: 'shipping-settings', labelEn: 'Shipping Settings', labelBn: 'শিপিং সেটিংস', icon: Settings, path: '#/admin/shipping/settings' }
      ]
    },
    { 
      id: 'payments', 
      labelEn: 'Payments', 
      labelBn: 'পেমেন্টস', 
      icon: CreditCard, 
      path: '#/admin/payments',
      subItems: [
        { id: 'payments-platon', labelEn: 'Platon Branding', labelBn: 'প্লাটন ব্র্যান্ডিং', icon: ShieldCheck, path: '#/admin/platon' },
        { id: 'payments-methods', labelEn: 'Payment Methods', labelBn: 'পেমেন্ট পদ্ধতি', icon: CreditCard, path: '#/admin/payments' },
        { id: 'payments-bkash', labelEn: 'bKash', labelBn: 'বিকাশ', icon: CreditCard, path: '#/admin/payments/bkash' },
        { id: 'payments-nagad', labelEn: 'Nagad', labelBn: 'নগদ', icon: CreditCard, path: '#/admin/payments/nagad' },
        { id: 'payments-rocket', labelEn: 'Rocket', labelBn: 'রকেট', icon: CreditCard, path: '#/admin/payments/rocket' },
        { id: 'payments-bank', labelEn: 'Bank Transfer', labelBn: 'ব্যাংক ট্রান্সফার', icon: CreditCard, path: '#/admin/payments/bank' },
        { id: 'payments-credit', labelEn: 'Credit Card', labelBn: 'ক্রেডিট কার্ড', icon: CreditCard, path: '#/admin/payments/credit' },
        { id: 'payments-debit', labelEn: 'Debit Card', labelBn: 'ডেবিট কার্ড', icon: CreditCard, path: '#/admin/payments/debit' },
        { id: 'payments-settings', labelEn: 'Payment Settings', labelBn: 'পেমেন্ট সেটিংস', icon: Settings, path: '#/admin/payments/settings' }
      ]
    },
    { 
      id: 'reports', 
      labelEn: 'Reports & Analytics', 
      labelBn: 'রিপোর্ট ও অ্যানালিটিক্স', 
      icon: BarChart3, 
      path: '#/admin/reports',
      subItems: [
        { id: 'reports-sales', labelEn: 'Sales Report', labelBn: 'বিক্রয় রিপোর্ট', icon: FileSpreadsheet, path: '#/admin/reports/sales' },
        { id: 'reports-orders', labelEn: 'Order Report', labelBn: 'অর্ডার রিপোর্ট', icon: FileSpreadsheet, path: '#/admin/reports/orders' },
        { id: 'reports-product', labelEn: 'Product Report', labelBn: 'প্রোডাক্ট রিপোর্ট', icon: FileSpreadsheet, path: '#/admin/reports/products' },
        { id: 'reports-customers', labelEn: 'Customer Report', labelBn: 'কাস্টমার রিপোর্ট', icon: FileSpreadsheet, path: '#/admin/reports/customers' },
        { id: 'reports-payment', labelEn: 'Payment Report', labelBn: 'পেমেন্ট রিপোর্ট', icon: FileSpreadsheet, path: '#/admin/reports/payment' },
        { id: 'reports-inventory', labelEn: 'Inventory Report', labelBn: 'ইনভেন্টরি রিপোর্ট', icon: FileSpreadsheet, path: '#/admin/reports/inventory' }
      ]
    },
    { 
      id: 'cms', 
      labelEn: 'CMS / Pages', 
      labelBn: 'সিএমএস / পেজেস', 
      icon: FileText, 
      path: '#/admin/cms',
      subItems: [
        { id: 'cms-homepage', labelEn: 'Homepage', labelBn: 'হোমপেজ এডিটর', icon: FileText, path: '#/admin/cms/homepage' },
        { id: 'cms-platon', labelEn: 'Platon / Payment Logos', labelBn: 'প্লাটন / পেমেন্ট লোগো', icon: ShieldCheck, path: '#/admin/platon' },
        { id: 'cms-footer', labelEn: 'Footer Management', labelBn: 'ফুটার ম্যানেজমেন্ট', icon: FileText, path: '#/admin/cms/footer' },
        { id: 'cms-about', labelEn: 'About', labelBn: 'আমাদের সম্পর্কে', icon: FileText, path: '#/admin/cms/about' },
        { id: 'cms-contact', labelEn: 'Contact', labelBn: 'যোগাযোগ পেজ', icon: FileText, path: '#/admin/cms/contact' },
        { id: 'cms-policies', labelEn: 'Policies', labelBn: 'পলিসি পেইজসমূহ', icon: FileText, path: '#/admin/cms/policies' },
        { id: 'cms-faq', labelEn: 'FAQ', labelBn: 'এফএকিউ', icon: FileText, path: '#/admin/cms/faq' }
      ]
    },
    {
      id: 'banners',
      labelEn: 'Banner Management',
      labelBn: 'ব্যানার ম্যানেজমেন্ট',
      icon: Image,
      path: '#/admin/banners',
      subItems: [
        { id: 'banners-main', labelEn: 'Main / Home Banners', labelBn: 'মূল / হোম ব্যানার', icon: Image, path: '#/admin/banners/main' },
        { id: 'banners-promo', labelEn: 'Promotional Banners', labelBn: 'প্রোমোশনাল ব্যানার', icon: Zap, path: '#/admin/banners/promo' },
        { id: 'banners-category', labelEn: 'Category Banners', labelBn: 'ক্যাটাগরি ব্যানার', icon: Image, path: '#/admin/banners/category' },
        { id: 'banners-auth', labelEn: 'Login / Account Banners', labelBn: 'লগইন / অ্যাকাউন্ট ব্যানার', icon: Image, path: '#/admin/banners/auth' }
      ]
    },
    { 
      id: 'reviews', 
      labelEn: 'Reviews', 
      labelBn: 'রিভিউ সমূহ', 
      icon: MessageSquare, 
      path: '#/admin/reviews',
      subItems: [
        { id: 'reviews-products', labelEn: 'Product Reviews', labelBn: 'প্রোডাক্ট রিভিউ', icon: MessageSquare, path: '#/admin/reviews' },
        { id: 'reviews-pending', labelEn: 'Pending Reviews', labelBn: 'পেন্ডিং রিভিউ', icon: Clock, path: '#/admin/reviews/pending' },
        { id: 'reviews-reported', labelEn: 'Reported Reviews', labelBn: 'রিপোর্টেড রিভিউ', icon: ShieldAlert, path: '#/admin/reviews/reported' }
      ]
    },
    { 
      id: 'support', 
      labelEn: 'Support', 
      labelBn: 'সাপোর্ট সেন্টার', 
      icon: Headset, 
      path: '#/admin/support',
      subItems: [
        { id: 'support-messages', labelEn: 'Customer Messages', labelBn: 'গ্রাহক বার্তা', icon: MessageSquare, path: '#/admin/support/messages' },
        { id: 'support-tickets', labelEn: 'Support Tickets', labelBn: 'সাপোর্ট টিকিট', icon: Headset, path: '#/admin/support/tickets' }
      ]
    },
    { 
      id: 'settings', 
      labelEn: 'Settings', 
      labelBn: 'সেটিংস', 
      icon: Settings, 
      path: '#/admin/settings',
      subItems: [
        { id: 'settings-general', labelEn: 'General Settings', labelBn: 'সাধারণ সেটিংস', icon: Settings, path: '#/admin/settings/general' },
        { id: 'settings-store', labelEn: 'Store Information', labelBn: 'স্টোর তথ্য', icon: FileText, path: '#/admin/settings/store' },
        { id: 'settings-seo', labelEn: 'SEO Settings', labelBn: 'এসইও সেটিংস', icon: Globe, path: '#/admin/settings/seo' },
        { id: 'settings-language', labelEn: 'Language Settings', labelBn: 'ভাষা সেটিংস', icon: Globe, path: '#/admin/settings/language' },
        { id: 'settings-notifications', labelEn: 'Notification Settings', labelBn: 'বিজ্ঞপ্তি সেটিংস', icon: Bell, path: '#/admin/settings/notifications' },
        { id: 'settings-security', labelEn: 'Security Settings', labelBn: 'নিরাপত্তা সেটিংস', icon: Lock, path: '#/admin/settings/security' },
        { id: 'settings-roles', labelEn: 'Admin Users / Roles', labelBn: 'অ্যাডমিন রোলস', icon: Users, path: '#/admin/settings/roles' },
        { id: 'settings-backup', labelEn: 'Database / Backup', labelBn: 'ডাটাবেস ব্যাকআপ', icon: Database, path: '#/admin/settings/backup' }
      ]
    },
    {
      id: 'tracking-analytics',
      labelEn: 'Tracking & Analytics',
      labelBn: 'ট্র্যাকিং ও অ্যানালিটিক্স',
      icon: BarChart3,
      path: '#/admin/tracking-analytics',
      subItems: [
        { id: 'tracking-facebook', labelEn: 'Facebook Pixel', labelBn: 'ফেসবুক পিক্সেল', icon: LayoutDashboard, path: '#/admin/tracking/facebook' },
        { id: 'tracking-tiktok', labelEn: 'TikTok Pixel', labelBn: 'টিকটক পিক্সেল', icon: LayoutDashboard, path: '#/admin/tracking/tiktok' },
        { id: 'tracking-google', labelEn: 'Google Analytics', labelBn: 'গুগল অ্যানালিটিক্স', icon: LayoutDashboard, path: '#/admin/tracking/google' },
        { id: 'tracking-website', labelEn: 'Website Tracking', labelBn: 'ওয়েবসাইট ট্র্যাকিং', icon: LayoutDashboard, path: '#/admin/tracking/website' }
      ]
    }
  ];

  const toggleGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const navigateTo = (path: string, tabId: string) => {
    window.location.hash = path;
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    
    // Reset banner editing state when switching to list-based banner tabs
    if (tabId.startsWith('banners-')) {
      setBannerViewMode('list');
      setEditingBanner(null);
    }
  };

  // Quick actions array
  const quickActions = [
    { labelEn: 'Add Product', labelBn: 'নতুন প্রোডাক্ট', tabId: 'products-add', path: '#/admin/products/add', icon: PlusCircle },
    { labelEn: 'View Orders', labelBn: 'অর্ডার দেখুন', tabId: 'orders-all', path: '#/admin/orders', icon: ShoppingCart },
    { labelEn: 'Manage Customers', labelBn: 'কাস্টমার পরিচালনা', tabId: 'customers-all', path: '#/admin/customers', icon: Users },
    { labelEn: 'Create Offer', labelBn: 'অফার তৈরি করুন', tabId: 'coupons-offers', path: '#/admin/offers', icon: Gift },
    { labelEn: 'Manage Stock', labelBn: 'স্টক ম্যানেজ করুন', tabId: 'products-stock', path: '#/admin/inventory', icon: Boxes },
    { labelEn: 'Reports', labelBn: 'রিপোর্ট সমূহ', tabId: 'reports-sales', path: '#/admin/reports/sales', icon: BarChart3 },
    { labelEn: 'Settings', labelBn: 'সেটিংস', tabId: 'settings-general', path: '#/admin/settings/general', icon: Settings },
    { labelEn: 'Backup', labelBn: 'ডাটা ব্যাকআপ', tabId: 'settings-backup', path: '#/admin/settings/backup', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-gray-800 antialiased select-none" id="admin-dashboard-root">
      
      {/* ----------------- 1. ADMIN HEADER (Compact, Premium & Clean) ----------------- */}
      <header className="sticky top-0 bg-white h-14 border-b border-gray-150/70 px-4 md:px-6 flex items-center justify-between z-40 shadow-xs" id="admin-header">
        
        {/* Left segment: Hamburger, Logo, text title and admin subtitle */}
        <div className="flex items-center gap-3" id="admin-header-left">
          {/* Hamburger Menu (visible to toggle sidebar on desktop, slide menu on mobile) */}
          <button
            onClick={() => {
              if (window.innerWidth >= 768) {
                setIsSidebarCollapsed(!isSidebarCollapsed);
              } else {
                setIsMobileMenuOpen(true);
              }
            }}
            className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 cursor-pointer transition-colors active:scale-95"
            aria-label="Toggle Navigation Sidebar"
            id="admin-mobile-menu-trigger"
          >
            <MenuIcon className="w-5.5 h-5.5 text-gray-600" />
          </button>

          {/* Core Brand Header details */}
          <div className="flex items-center gap-2 cursor-pointer animate-fade-in" onClick={() => navigateTo('#/admin/dashboard', 'dashboard')} id="admin-brand-logo-panel">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/50">
              <Leaf className="w-4.5 h-4.5 fill-emerald-600/10 text-emerald-600" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black text-xs tracking-widest text-emerald-800 leading-none font-sans">
                SHAD GHOR
              </span>
              <span className="text-[8px] font-black text-gray-400 tracking-wider uppercase mt-1">
                {language === 'bn' ? 'অ্যাডমিন প্যানেল' : 'ADMIN PANEL'}
              </span>
            </div>
          </div>
        </div>

        {/* Middle segment: Global Search bar (Premium design) */}
        <div className="hidden md:flex flex-1 max-w-xs mx-8 relative" id="admin-header-search">
          <input 
            type="text" 
            placeholder={language === 'bn' ? 'প্যানেল অনুসন্ধান করুন...' : 'Search dashboard...'}
            className="w-full text-xs font-semibold px-3 py-1.5 bg-gray-50 border border-gray-150 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all"
          />
        </div>

        {/* Right segment: Language switcher, Notification bell, Admin profile icon */}
        <div className="flex items-center gap-3" id="admin-header-right">
          
          {/* 🌐 Premium Floating Language Switcher */}
          <button
            onClick={() => changeLanguage(language === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-700 text-[9px] font-black rounded-md transition-all cursor-pointer border border-emerald-100/40"
            title="Switch Dashboard Language"
            id="admin-lang-switcher"
          >
            <Globe className="w-3 h-3" />
            <span>{language === 'bn' ? 'ENGLISH' : 'বাংলা'}</span>
          </button>

          {/* Quick Notification Dropdown */}
          <div className="relative" ref={notificationsRef} id="admin-notification-center">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-1.5 hover:bg-gray-50 text-gray-500 hover:text-emerald-700 rounded-lg relative cursor-pointer"
              id="admin-notification-bell"
            >
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2.5 w-60 bg-white border border-gray-150 rounded-xl shadow-lg py-1.5 text-left z-50 animate-fade-in" id="admin-notification-dropdown">
                <div className="px-3 py-1 border-b border-gray-50 flex items-center justify-between">
                  <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase">{language === 'bn' ? 'সাম্প্রতিক নোটিফিকেশন' : 'Notifications'}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  <div className="p-2.5 text-[11px] hover:bg-gray-50 cursor-pointer">
                    <p className="font-bold text-gray-700">{language === 'bn' ? 'সিস্টেম ফাউন্ডেশন সম্পূর্ণ' : 'Admin Panel Foundation Live'}</p>
                    <span className="text-[8px] text-gray-400 block mt-0.5">Just now</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-gray-150" />

          {/* Admin Profile dropdown triggering element */}
          <div className="relative" ref={profileRef} id="admin-user-profile-widget">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
              id="admin-profile-dropdown-trigger"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0">
                {sessionUser?.name?.charAt(0) || 'A'}
              </div>
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-150 rounded-xl shadow-lg py-1.5 z-50 animate-fade-in text-left" id="admin-profile-dropdown">
                <div className="px-3.5 py-1.5 border-b border-gray-50">
                  <p className="text-xs font-black text-gray-700">{sessionUser?.name || 'Admin'}</p>
                  <p className="text-[9px] text-gray-400 font-bold truncate mt-0.5">{sessionUser?.email || 'admin@shadghor.com'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3.5 py-1.5 text-xs text-red-600 hover:bg-red-50 font-bold flex items-center gap-2 cursor-pointer border-t border-gray-100"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'লগআউট' : 'Sign Out'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ----------------- Core Dashboard Layout Body ----------------- */}
      <div className="flex-1 flex" id="admin-body-container">
        
        {/* Pristine White Collapsible Sidebar for Desktop/Tablet */}
        <aside 
          className={`hidden md:flex flex-col bg-white text-gray-700 border-r border-gray-150 shrink-0 text-left justify-between transition-all duration-300 ${
            isSidebarCollapsed ? 'w-16' : 'w-60'
          }`}
          id="admin-desktop-sidebar"
        >
          <div className="flex-1 flex flex-col justify-between" id="admin-sidebar-menu-wrapper">
            
            {/* Scrollable menu body */}
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-8rem)] px-2.5 py-3.5 space-y-1 custom-scrollbar" id="admin-sidebar-menu">
              
              {navigationStructure.map((item) => {
                const ItemIcon = item.icon;
                const isGroup = !!item.subItems;
                const isSelected = activeTab === item.id || (isGroup && item.subItems?.some(s => activeTab === s.id));
                const isGroupExpanded = expandedGroups[item.id];

                return (
                  <div key={item.id} className="space-y-0.5" id={`admin-menu-group-${item.id}`}>
                    <button
                      onClick={(e) => {
                        if (isGroup) {
                          toggleGroup(item.id, e);
                        } else {
                          navigateTo(item.path, item.id);
                        }
                      }}
                      className={`w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50 text-emerald-800 border-l-3 border-emerald-600 rounded-r-lg' 
                          : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50/40'
                      } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                      title={language === 'bn' ? item.labelBn : item.labelEn}
                      id={`admin-nav-${item.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <ItemIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                        {!isSidebarCollapsed && <span className="tracking-wide">{language === 'bn' ? item.labelBn : item.labelEn}</span>}
                      </div>

                      {/* Dropdown arrows for collapsible groups */}
                      {isGroup && !isSidebarCollapsed && (
                        <div>
                          {isGroupExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                        </div>
                      )}
                    </button>

                    {/* Collapsible Sub Items container */}
                    {isGroup && isGroupExpanded && !isSidebarCollapsed && (
                      <div className="pl-4.5 space-y-0.5 border-l border-gray-150 ml-4.5 mt-0.5" id={`admin-submenu-group-${item.id}`}>
                        {item.subItems?.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubSelected = activeTab === sub.id;

                          return (
                            <button
                              key={sub.id}
                              onClick={() => navigateTo(sub.path, sub.id)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                isSubSelected 
                                  ? 'text-emerald-800 bg-emerald-50 border-l-2 border-emerald-600 rounded-r-md' 
                                  : 'text-gray-500 hover:text-emerald-700 hover:bg-gray-50'
                              }`}
                              id={`admin-nav-${sub.id}`}
                            >
                              <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                              <span>{language === 'bn' ? sub.labelBn : sub.labelEn}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sidebar bottom footer */}
            <div className="p-3 border-t border-gray-150 bg-gray-50/50" id="admin-sidebar-controls-lower">
              {!isSidebarCollapsed ? (
                <div className="text-[9px] text-gray-400 font-extrabold" id="admin-sidebar-build-info">
                  <p className="text-gray-500 font-black">SHAD GHOR CONTROL v2.0</p>
                  <p className="font-bold text-emerald-700 mt-0.5">MySQL Server Active</p>
                </div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-emerald-600 mx-auto animate-pulse" title="MySQL Connected" />
              )}
            </div>

          </div>
        </aside>

        {/* ----------------- Right Content Canvas ----------------- */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-white" id="admin-main-canvas">
          {activeTab === 'dashboard' ? (
            isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 max-w-6xl mx-auto" id="dashboard-loading-state">
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-50 border-t-emerald-600 animate-spin" />
                  <Leaf className="w-5 h-5 text-emerald-600 absolute animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-gray-700">
                    {language === 'bn' ? 'ডাটাবেস থেকে রিয়েল-টাইম ডাটা লোড হচ্ছে...' : 'Loading real-time metrics from MySQL...'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">
                    {language === 'bn' ? 'দয়া করে অপেক্ষা করুন' : 'Querying secure gateway...'}
                  </p>
                </div>
              </div>
            ) : errorMessage ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-white border border-gray-150 rounded-xl max-w-xl mx-auto space-y-4 text-center" id="dashboard-error-state">
                <div className="w-12 h-12 bg-red-50 text-red-600 border border-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-gray-800">
                    {language === 'bn' ? 'ডাটা লোড করতে সমস্যা হয়েছে' : 'Failed to retrieve dashboard metrics'}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-semibold max-w-md">
                    {errorMessage}
                  </p>
                </div>
                <button
                  onClick={() => refreshStatistics()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
                </button>
              </div>
            ) : (
              <div className="space-y-5 max-w-6xl mx-auto animate-fade-in" id="admin-dashboard-homepage">
                
                {/* Top welcome area */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-150/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left" id="admin-greetings-box">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-black text-emerald-950 leading-tight">
                      {language === 'bn' ? 'স্বাগতম, সুপার অ্যাডমিনিস্ট্রেটর!' : 'Welcome back, Super Administrator!'}
                    </h2>
                    <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">
                      {language === 'bn' ? 'আজকের ব্যবসার ড্যাশবোর্ড ও রিয়েল-টাইম ওভারভিউ' : 'E-commerce Management Dashboard — SHAD GHOR'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-white border border-gray-150 px-2.5 py-1 rounded-lg shadow-4xs">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-sans text-[11px] font-black">
                      {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* ----------------- 2. COMPACT STATISTICS GRID (8 KPI Cards) ----------------- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" id="admin-metrics-row">
                  
                  {/* KPI 1: Total Orders */}
                  <div className="bg-white p-4 rounded-xl border border-gray-150 hover:border-emerald-600/30 transition-all duration-200 text-left relative" id="kpi-total-orders">
                    <span className="text-[10px] text-gray-400 font-black tracking-wider uppercase block">
                      {language === 'bn' ? 'মোট অর্ডার' : 'Total Orders'}
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-black text-gray-800">
                        {language === 'bn' ? stats.totalOrders.toLocaleString('bn-BD') : stats.totalOrders}
                      </span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {language === 'bn' ? 'ডাটাবেস' : 'MySQL'}
                      </span>
                    </div>
                  </div>

                  {/* KPI 2: Total Customers */}
                  <div className="bg-white p-4 rounded-xl border border-gray-150 hover:border-emerald-600/30 transition-all duration-200 text-left relative" id="kpi-total-customers">
                    <span className="text-[10px] text-gray-400 font-black tracking-wider uppercase block">
                      {language === 'bn' ? 'মোট কাস্টমার' : 'Total Customers'}
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-black text-gray-800">
                        {language === 'bn' ? stats.totalCustomers.toLocaleString('bn-BD') : stats.totalCustomers}
                      </span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {language === 'bn' ? 'সক্রিয়' : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* KPI 3: Total Products */}
                  <div className="bg-white p-4 rounded-xl border border-gray-150 hover:border-emerald-600/30 transition-all duration-200 text-left relative" id="kpi-total-products">
                    <span className="text-[10px] text-gray-400 font-black tracking-wider uppercase block">
                      {language === 'bn' ? 'মোট প্রোডাক্ট' : 'Total Products'}
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-black text-gray-800">
                        {language === 'bn' ? stats.totalProducts.toLocaleString('bn-BD') : stats.totalProducts}
                      </span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {language === 'bn' ? 'লাইভ' : 'Live'}
                      </span>
                    </div>
                  </div>

                  {/* KPI 4: Total Revenue */}
                  <div className="bg-white p-4 rounded-xl border border-gray-150 hover:border-emerald-600/30 transition-all duration-200 text-left relative" id="kpi-total-revenue">
                    <span className="text-[10px] text-gray-400 font-black tracking-wider uppercase block">
                      {language === 'bn' ? 'মোট রেভেনিউ' : 'Total Revenue'}
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-black text-emerald-700">
                        ৳{language === 'bn' ? stats.totalSales.toLocaleString('bn-BD') : stats.totalSales.toLocaleString('en-US')}
                      </span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        +14%
                      </span>
                    </div>
                  </div>

                  {/* KPI 5: Pending Orders */}
                  <div className={`bg-white p-4 rounded-xl border border-gray-150 hover:border-amber-500/20 transition-all duration-200 text-left relative ${stats.pendingOrders > 0 ? 'bg-amber-50/15 border-amber-200' : ''}`} id="kpi-pending-orders">
                    <span className={`text-[10px] font-black tracking-wider uppercase block ${stats.pendingOrders > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                      {language === 'bn' ? 'পেন্ডিং অর্ডার' : 'Pending Orders'}
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className={`text-xl font-black ${stats.pendingOrders > 0 ? 'text-amber-800' : 'text-gray-800'}`}>
                        {language === 'bn' ? stats.pendingOrders.toLocaleString('bn-BD') : stats.pendingOrders}
                      </span>
                      {stats.pendingOrders > 0 && (
                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          {language === 'bn' ? 'অ্যাকশন' : 'Review'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KPI 6: Today's Sales */}
                  <div className="bg-white p-4 rounded-xl border border-gray-150 hover:border-emerald-600/30 transition-all duration-200 text-left relative" id="kpi-todays-sales">
                    <span className="text-[10px] text-gray-400 font-black tracking-wider uppercase block">
                      {language === 'bn' ? 'আজকের বিক্রি' : "Today's Sales"}
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-black text-gray-800">
                        ৳{language === 'bn' ? stats.todaySales.toLocaleString('bn-BD') : stats.todaySales.toLocaleString('en-US')}
                      </span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {language === 'bn' ? 'রিয়েলটাইম' : 'Real-time'}
                      </span>
                    </div>
                  </div>

                  {/* KPI 7: Low Stock Products */}
                  <div className={`bg-white p-4 rounded-xl border border-gray-150 hover:border-red-500/20 transition-all duration-200 text-left relative ${stats.lowStockProducts > 0 ? 'bg-red-50/10 border-red-200' : ''}`} id="kpi-low-stock-products">
                    <span className={`text-[10px] font-black tracking-wider uppercase block ${stats.lowStockProducts > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                      {language === 'bn' ? 'কম স্টক প্রোডাক্ট' : 'Low Stock Products'}
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className={`text-xl font-black ${stats.lowStockProducts > 0 ? 'text-red-800' : 'text-gray-800'}`}>
                        {language === 'bn' ? stats.lowStockProducts.toLocaleString('bn-BD') : stats.lowStockProducts}
                      </span>
                      {stats.lowStockProducts > 0 && (
                        <span className="text-[9px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          {language === 'bn' ? 'রিফিল করুন' : 'Refill'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KPI 8: New Customers */}
                  <div className="bg-white p-4 rounded-xl border border-gray-150 hover:border-emerald-600/30 transition-all duration-200 text-left relative" id="kpi-new-customers">
                    <span className="text-[10px] text-gray-400 font-black tracking-wider uppercase block">
                      {language === 'bn' ? 'নতুন কাস্টমার' : 'New Customers'}
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-black text-gray-800">
                        +{language === 'bn' ? stats.newCustomers.toLocaleString('bn-BD') : stats.newCustomers}
                      </span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {language === 'bn' ? 'আজ' : 'Today'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* ----------------- TWO COLUMN DASHBOARD SUB-GRID ----------------- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" id="dashboard-lower-grid">
                  
                  {/* LEFT 2 COLS: Sales overview chart + Recent Orders Table */}
                  <div className="lg:col-span-2 space-y-5 text-left" id="dashboard-grid-left">
                    
                    {/* Sales Overview Chart Block */}
                    <div className="bg-white p-5 rounded-xl border border-gray-150 space-y-4" id="dashboard-chart-card">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-3">
                        <div>
                          <h3 className="text-xs font-black tracking-wider text-emerald-950 uppercase">
                            {language === 'bn' ? 'সেলস ওভারভিউ চার্ট' : 'Sales Overview Chart'}
                          </h3>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                            {language === 'bn' ? 'সাপ্তাহিক কর্মক্ষমতা এবং আয় বিশ্লেষণ' : 'Weekly revenue growth and business trajectory'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-150" id="chart-filter-pills">
                          {(['today', '7days', '30days', 'year'] as const).map((filter) => {
                            const labelsEn = { today: 'Today', '7days': '7 Days', '30days': '30 Days', year: 'This Year' };
                            const labelsBn = { today: 'আজ', '7days': '৭ দিন', '30days': '৩০ দিন', year: 'এই বছর' };
                            const isSelected = analyticsFilter === filter;
                            return (
                              <button
                                key={filter}
                                onClick={() => setAnalyticsFilter(filter)}
                                className={`px-2.5 py-1 text-[9px] font-extrabold rounded-md transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-white text-emerald-800 shadow-5xs border border-gray-200/50' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                {language === 'bn' ? labelsBn[filter] : labelsEn[filter]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Premium SVG/HTML Bar Chart representing weekly/monthly trend derived directly from MySQL */}
                      <div className="h-44 flex items-end justify-between gap-2.5 pt-6 px-4 bg-gray-50/30 rounded-lg border border-gray-100 relative">
                        {(() => {
                          const get7DaysData = (dbData: any[]) => {
                            const days = [];
                            const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            const daysBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
                            for (let i = 6; i >= 0; i--) {
                              const d = new Date();
                              d.setDate(d.getDate() - i);
                              const dateStr = d.toISOString().split('T')[0];
                              const dayIndex = d.getDay();
                              const match = dbData.find(item => item.date === dateStr);
                              const amount = match ? Number(match.amount) : 0;
                              days.push({ label: daysEn[dayIndex], bn: daysBn[dayIndex], amount, value: amount });
                            }
                            return days;
                          };

                          const get30DaysData = (dbData: any[]) => {
                            const points = [];
                            for (let i = 5; i >= 0; i--) {
                              const d = new Date();
                              d.setDate(d.getDate() - i * 5);
                              const label = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                              let sum = 0;
                              for (let j = 0; j < 5; j++) {
                                const tc = new Date(d);
                                tc.setDate(tc.getDate() - j);
                                const tcStr = tc.toISOString().split('T')[0];
                                const match = dbData.find(item => item.date === tcStr);
                                if (match) sum += Number(match.amount);
                              }
                              points.push({ label, bn: label, amount: sum, value: sum });
                            }
                            return points;
                          };

                          const getYearlyData = (dbData: any[]) => {
                            const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const monthsBn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
                            const points = [];
                            const currentYear = new Date().getFullYear();
                            for (let m = 0; m < 12; m++) {
                              const prefix = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
                              const sum = dbData
                                .filter(item => item.date && item.date.startsWith(prefix))
                                .reduce((acc, cur) => acc + Number(cur.amount), 0);
                              points.push({ label: monthsEn[m], bn: monthsBn[m], amount: sum, value: sum });
                            }
                            return points;
                          };

                          const getTodayData = (dbData: any[]) => {
                            const slices = [
                              { label: 'Morning', bn: 'সকাল', distribution: 0.15 },
                              { label: 'Noon', bn: 'দুপুর', distribution: 0.45 },
                              { label: 'Afternoon', bn: 'বিকাল', distribution: 0.25 },
                              { label: 'Night', bn: 'রাত', distribution: 0.15 }
                            ];
                            const todayStr = new Date().toISOString().split('T')[0];
                            const todaySum = dbData
                              .filter(item => item.date === todayStr)
                              .reduce((acc, cur) => acc + Number(cur.amount), 0) || stats.todaySales;

                            return slices.map(s => ({
                              label: s.label,
                              bn: s.bn,
                              amount: Math.round(todaySum * s.distribution),
                              value: Math.round(todaySum * s.distribution)
                            }));
                          };

                          const activeChartPoints = analyticsFilter === 'today' ? getTodayData(chartData) 
                                                 : analyticsFilter === '7days' ? get7DaysData(chartData) 
                                                 : analyticsFilter === '30days' ? get30DaysData(chartData) 
                                                 : getYearlyData(chartData);

                          const maxAmount = Math.max(...activeChartPoints.map(p => p.amount), 1000);

                          return activeChartPoints.map((point, idx) => {
                            const barHeightPercent = Math.min(Math.max((point.amount / maxAmount) * 100, 5), 100);
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                <span className="text-[8px] font-black text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity absolute mb-14 bg-white px-1.5 py-0.5 rounded shadow-5xs border border-gray-100">
                                  ৳{point.amount.toLocaleString()}
                                </span>
                                <div className="w-full bg-emerald-50 hover:bg-emerald-100 rounded-md transition-all duration-200 relative flex items-end overflow-hidden h-full">
                                  <div className="w-full bg-emerald-600 rounded-md group-hover:bg-emerald-700 transition-all" style={{ height: `${barHeightPercent}%` }} />
                                </div>
                                <span className="text-[9px] text-gray-400 font-bold tracking-wider">{language === 'bn' ? point.bn : point.label}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Recent Orders Table Block */}
                    <div className="bg-white p-5 rounded-xl border border-gray-150 space-y-3" id="dashboard-orders-card">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                          <h3 className="text-xs font-black tracking-wider text-emerald-950 uppercase">
                            {language === 'bn' ? 'সাম্প্রতিক অর্ডারের তালিকা' : 'Recent Orders Table'}
                          </h3>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                            {language === 'bn' ? 'রিয়েল-টাইম ডাটাবেস এন্ট্রি' : 'Latest purchases queried from Hostinger MySQL'}
                          </p>
                        </div>
                        <button 
                          onClick={() => navigateTo('#/admin/orders', 'orders-all')}
                          className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 uppercase flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>{language === 'bn' ? 'সব অর্ডার' : 'View All'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="overflow-x-auto" id="recent-orders-table-wrapper">
                        <table className="w-full text-left text-xs text-gray-600 font-sans min-w-[500px]">
                          <thead>
                            <tr className="bg-gray-50 text-[10px] text-gray-400 font-black tracking-wider uppercase border-b border-gray-150">
                              <th className="py-2.5 px-3">Order ID</th>
                              <th className="py-2.5 px-3">Customer</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Amount</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-semibold">
                            {recentOrders.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-xs font-bold text-gray-400">
                                  {language === 'bn' ? 'কোনো সাম্প্রতিক অর্ডার পাওয়া যায়নি।' : 'No recent orders found.'}
                                </td>
                              </tr>
                            ) : (
                              recentOrders.map((order) => {
                                const dateFormatted = new Date(order.created_at).toISOString().split('T')[0];
                                return (
                                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-3 px-3 font-bold text-gray-800">{order.id}</td>
                                    <td className="py-3 px-3">{order.customer_name}</td>
                                    <td className="py-3 px-3 font-mono text-[10px]">{dateFormatted}</td>
                                    <td className="py-3 px-3 text-gray-800 font-bold">৳{Number(order.total_amount).toLocaleString()}</td>
                                    <td className="py-3 px-3">
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full inline-block ${
                                        order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' :
                                        order.status === 'Processing' ? 'bg-blue-50 text-blue-700' :
                                        order.status === 'Shipped' ? 'bg-purple-50 text-purple-700' :
                                        order.status === 'Cancelled' ? 'bg-red-50 text-red-700' :
                                        'bg-amber-50 text-amber-700'
                                      }`}>
                                        {order.status}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <button 
                                        onClick={() => navigateTo('#/admin/orders', 'orders-all')}
                                        className="text-[10px] font-black text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded transition-colors cursor-pointer"
                                      >
                                        Manage
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                  {/* RIGHT 1 COL: Quick actions, alerts, accepted payments, top products */}
                  <div className="space-y-5 text-left" id="dashboard-grid-right">
                    
                    {/* Quick Actions Grid Block */}
                    <div className="bg-white p-5 rounded-xl border border-gray-150 space-y-3.5" id="dashboard-actions-card">
                      <div>
                        <h3 className="text-xs font-black tracking-wider text-emerald-950 uppercase">
                          {language === 'bn' ? 'কুইক অ্যাকশনস' : 'Quick Actions'}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                          {language === 'bn' ? 'সহজ শর্টকাট নেভিগেশন' : 'Instant panel utility links'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2" id="quick-actions-grid">
                        {quickActions.map((action, idx) => {
                          const ActionIcon = action.icon;
                          return (
                            <button
                              key={idx}
                              onClick={() => navigateTo(action.path, action.tabId)}
                              className="flex flex-col items-center justify-center p-3.5 bg-gray-50/50 hover:bg-emerald-50/35 border border-gray-150 rounded-xl hover:border-emerald-500/20 text-center transition-all cursor-pointer group"
                            >
                              <ActionIcon className="w-5 h-5 text-emerald-700 mb-1.5 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-black text-gray-700 leading-tight">
                                {language === 'bn' ? action.labelBn : action.labelEn}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Important Alerts Block */}
                    <div className="bg-white p-5 rounded-xl border border-gray-150 space-y-3" id="dashboard-alerts-card">
                      <h4 className="text-xs font-black tracking-wider text-emerald-950 uppercase">
                        {language === 'bn' ? 'গুরুত্বপূর্ণ নোটিফিকেশন / অ্যালার্ট' : 'Important Alerts'}
                      </h4>
                      
                      <div className="space-y-2.5">
                        {stats.lowStockProducts > 0 && (
                          <div className="flex gap-2.5 p-3 rounded-xl bg-red-50 text-red-800 border border-red-100 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 animate-pulse" />
                            <div className="space-y-0.5">
                              <p className="font-bold">{language === 'bn' ? 'কম স্টক অ্যালার্ট' : 'Low Stock Warning'}</p>
                              <p className="text-[10px] text-red-700 font-medium leading-relaxed">
                                {language === 'bn' ? `${stats.lowStockProducts}টি প্রোডাক্টের স্টক ফুরিয়ে যাচ্ছে!` : `${stats.lowStockProducts} products are running critically low on stock.`}
                              </p>
                            </div>
                          </div>
                        )}

                        {stats.pendingOrders > 0 && (
                          <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 text-xs">
                            <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                            <div className="space-y-0.5">
                              <p className="font-bold">{language === 'bn' ? 'অর্ডার যাচাইকরণ মুলতুবি' : 'Verification Needed'}</p>
                              <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                                {language === 'bn' ? `${stats.pendingOrders}টি অর্ডার পেন্ডিং অবস্থায় আছে।` : `${stats.pendingOrders} new orders are waiting for verification.`}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Top Selling Products Block */}
                    <div className="bg-white p-5 rounded-xl border border-gray-150 space-y-3" id="dashboard-top-products-card">
                      <h4 className="text-xs font-black tracking-wider text-emerald-950 uppercase">
                        {language === 'bn' ? 'শীর্ষ বিক্রিত প্রোডাক্ট' : 'Top Selling Products'}
                      </h4>
                      
                      <div className="space-y-3" id="top-products-list">
                        {topProducts.length === 0 ? (
                          <p className="text-[10px] text-gray-400 font-bold p-2 text-center bg-gray-50 rounded-lg border border-gray-100">
                            {language === 'bn' ? 'কোনো ডাটা নেই' : 'No data available'}
                          </p>
                        ) : (
                          topProducts.map((prod, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 p-2 bg-gray-50/50 rounded-lg border border-gray-100">
                              <img 
                                src={prod.image_url} 
                                alt={prod.name} 
                                className="w-8 h-8 rounded object-cover border border-gray-250" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">{prod.name}</p>
                                <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
                                  {language === 'bn' ? `${prod.sold_qty}টি বিক্রিত` : `${prod.sold_qty} sold`} · ৳{Number(prod.sales_amount).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Customer Overview Block */}
                    <div className="bg-white p-5 rounded-xl border border-gray-150 space-y-3" id="dashboard-customers-card">
                      <h4 className="text-xs font-black tracking-wider text-emerald-950 uppercase">
                        {language === 'bn' ? 'কাস্টমার ওভারভিউ' : 'Customer Overview'}
                      </h4>
                      
                      <div className="space-y-3" id="customer-list-preview">
                        {recentCustomers.length === 0 ? (
                          <p className="text-[10px] text-gray-400 font-bold p-2 text-center bg-gray-50 rounded-lg border border-gray-100">
                            {language === 'bn' ? 'কোনো নতুন কাস্টমার নিবন্ধিত হয়নি।' : 'No recent customer signups.'}
                          </p>
                        ) : (
                          recentCustomers.map((cust, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50/50 rounded-lg border border-gray-100">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-800 leading-none">{cust.full_name}</span>
                                <span className="text-[9px] text-gray-400 font-semibold mt-1">{cust.email}</span>
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                cust.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {cust.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Accepted Payment Methods Block */}
                    <div className="bg-white p-5 rounded-xl border border-gray-150 space-y-3" id="dashboard-payments-card">
                      <h4 className="text-xs font-black tracking-wider text-emerald-950 uppercase">
                        {language === 'bn' ? 'পেমেন্ট গেটওয়েসমূহ' : 'Accepted Payments'}
                      </h4>
                      
                      <div className="flex flex-wrap gap-1.5" id="payment-gateways-pills">
                        {['bKash', 'Nagad', 'Rocket', 'Bank Transfer', 'Credit Card', 'Debit Card'].map((gateway) => (
                          <span key={gateway} className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/50">
                            {gateway}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )
          ) : activeTab === 'products-categories' || activeTab === 'categories' ? (
            <AdminCategories language={language} />
          ) : activeTab === 'products-brands' || activeTab === 'brands' ? (
            <AdminBrands language={language} />
          ) : activeTab === 'products-stock' || activeTab === 'stock' || activeTab === 'inventory' ? (
            <AdminStockManagement language={language} />
          ) : activeTab === 'customers-all' || activeTab === 'customers' || activeTab === 'customers-active' ? (
            <AdminCustomers 
              language={language} 
              initialStatus={activeTab === 'customers-active' ? 'active' : 'all'}
            />
          ) : activeTab === 'products-all' || activeTab === 'products' ? (
            <AdminProductList language={language} navigateTo={navigateTo} />
          ) : activeTab.startsWith('products-add') || activeTab.includes('edit') ? (
            <ProductEditor 
              language={language} 
              productId={activeTab.includes('edit') ? activeTab.split('-')[1] : undefined}
              onBack={() => navigateTo('#/admin/products', 'products-all')}
            />
          ) : activeTab === 'settings-seo' ? (
            <AdminSeoSettings language={language} />
          ) : activeTab === 'tracking-analytics' ? (
            <AdminTrackingOverview language={language} />
          ) : activeTab === 'tracking-facebook' ? (
            <AdminFacebookPixel language={language} />
          ) : activeTab === 'tracking-tiktok' ? (
            <AdminTikTokPixel language={language} />
          ) : activeTab === 'tracking-google' ? (
            <AdminGoogleAnalytics language={language} />
          ) : activeTab === 'tracking-website' ? (
            <AdminWebsiteTracking language={language} />
          ) : activeTab === 'settings-general' ? (
            <AdminGeneralSettings language={language} />
          ) : activeTab === 'settings-store' ? (
            <AdminStoreInformation language={language} />
          ) : activeTab === 'settings-language' ? (
            <AdminLanguageSettings language={language} />
          ) : activeTab === 'settings-notifications' ? (
            <AdminNotificationSettings language={language} />
          ) : activeTab === 'settings-security' ? (
            <AdminSecuritySettings language={language} />
          ) : activeTab === 'orders-all' || activeTab === 'orders' || activeTab.startsWith('orders-') ? (
            <AdminOrders language={language} />
          ) : activeTab === 'payments-settings' || activeTab === 'payments' ? (
            <AdminPaymentSettings language={language} />
          ) : activeTab === 'settings-roles' ? (
            <AdminRolesModule language={language} />
          ) : activeTab === 'settings-backup' ? (
            <AdminDatabaseBackup language={language} />
          ) : activeTab === 'support-messages' ? (
            <AdminCustomerMessages />
          ) : activeTab === 'support-tickets' ? (
            <AdminSupportTickets language={language} />
          ) : activeTab === 'reviews-products' ? (
            <AdminReviews initialView="all" />
          ) : activeTab === 'reviews-pending' ? (
            <AdminReviews initialView="pending" />
          ) : activeTab === 'reviews-reported' ? (
            <AdminReviews initialView="reported" />
          ) : activeTab === 'orders-delivery-report' ? (
            <AdminDeliveryReport />
          ) : activeTab === 'cms-homepage' ? (
            <AdminHomepageCMS language={language} />
          ) : activeTab === 'cms-footer' ? (
            <AdminFooterManagement language={language} />
          ) : activeTab === 'payments-methods' || activeTab === 'payments' ? (
            <AdminPaymentMethods />
          ) : activeTab === 'profile' ? (
            <AdminProfile />
          ) : activeTab === 'platon' || activeTab === 'cms-platon' || activeTab === 'payments-platon' ? (
            <AdminPlaton language={language} />
          ) : activeTab === 'banners-main' ? (
            bannerViewMode === 'list' ? (
              <AdminMainBanners 
                language={language} 
                onEdit={(banner) => {
                  setEditingBanner(banner);
                  setBannerViewMode('edit');
                }} 
              />
            ) : (
              <AdminBannerEditor 
                language={language} 
                banner={editingBanner}
                defaultLocation="homepage_hero"
                onBack={() => setBannerViewMode('list')}
                onSave={() => {
                  setBannerViewMode('list');
                  setEditingBanner(null);
                }}
              />
            )
          ) : activeTab === 'banners-promo' ? (
            bannerViewMode === 'list' ? (
              <AdminPromoBanners 
                language={language} 
                onEdit={(banner) => {
                  setEditingBanner(banner);
                  setBannerViewMode('edit');
                }} 
              />
            ) : (
              <AdminBannerEditor 
                language={language} 
                banner={editingBanner}
                defaultLocation="homepage_promo"
                onBack={() => setBannerViewMode('list')}
                onSave={() => {
                  setBannerViewMode('list');
                  setEditingBanner(null);
                }}
              />
            )
          ) : activeTab === 'banners-category' ? (
            bannerViewMode === 'list' ? (
              <AdminCategoryBanners 
                language={language} 
                onEdit={(banner) => {
                  setEditingBanner(banner);
                  setBannerViewMode('edit');
                }} 
              />
            ) : (
              <AdminBannerEditor 
                language={language} 
                banner={editingBanner}
                defaultLocation="category_banner"
                onBack={() => setBannerViewMode('list')}
                onSave={() => {
                  setBannerViewMode('list');
                  setEditingBanner(null);
                }}
              />
            )
          ) : activeTab === 'banners-auth' ? (
            bannerViewMode === 'list' ? (
              <AdminAuthBanners 
                language={language} 
                onEdit={(banner) => {
                  setEditingBanner(banner);
                  setBannerViewMode('edit');
                }} 
              />
            ) : (
              <AdminBannerEditor 
                language={language} 
                banner={editingBanner}
                defaultLocation="auth_banner"
                onBack={() => setBannerViewMode('list')}
                onSave={() => {
                  setBannerViewMode('list');
                  setEditingBanner(null);
                }}
              />
            )
          ) : activeTab === 'cms-about' ? (
            <AdminAboutUs />
          ) : activeTab === 'cms-contact' ? (
            <AdminContactCMS />
          ) : activeTab === 'cms-policies' ? (
            <AdminPoliciesModule />
          ) : activeTab === 'cms-faq' ? (
            <AdminFAQModule />
          ) : activeTab === 'reports' ? (
            <AdminReportsDashboard />
          ) : activeTab === 'reports-sales' ? (
            <AdminSalesReport />
          ) : activeTab === 'reports-orders' ? (
            <AdminOrderReport />
          ) : activeTab === 'reports-product' ? (
            <AdminProductReport />
          ) : activeTab === 'reports-customers' ? (
            <AdminCustomerReport />
          ) : activeTab === 'reports-payment' ? (
            <AdminPaymentReport />
          ) : (
            /* Clean, professional fallback for unfinished modules */
            <div className="max-w-6xl mx-auto space-y-4 animate-fade-in text-left" id="admin-module-clean-views">
              
              <div className="bg-white p-5 rounded-xl border border-gray-150 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[9px] text-emerald-700 font-black tracking-widest uppercase block">
                    {language === 'bn' ? 'অ্যাডমিন মডিউল' : 'ADMINISTRATION MODULE'}
                  </span>
                  <h2 className="text-base font-black text-gray-800 capitalize leading-tight">
                    {language === 'bn' 
                      ? (navigationStructure.find(n => n.id === activeTab || n.subItems?.some(s => s.id === activeTab))?.labelBn || 'ব্যবস্থাপনা মডিউল')
                      : (navigationStructure.find(n => n.id === activeTab || n.subItems?.some(s => s.id === activeTab))?.labelEn || 'Management Module')
                    }
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 font-mono">/admin/{activeTab.replace(/-/g, '/')}</span>
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1 inline-block border border-emerald-100">
                    {language === 'bn' ? 'সক্রিয় ' : 'Active System'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border border-gray-150 text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                  <Settings className="w-5 h-5 animate-spin" style={{ animationDuration: '12s' }} />
                </div>
                
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="text-sm font-black text-gray-800">
                    {language === 'bn' ? 'মডিউল কনফিগারেশন' : 'Module Configuration'}
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    {language === 'bn'
                      ? 'এই মডিউলের জন্য ডেডিকেটেড ইন্টারফেস শীঘ্রই আসছে। আপনি আপাতত ড্যাশবোর্ড থেকে অন্য ফিচারগুলো ব্যবহার করতে পারেন।'
                      : 'The dedicated interface for this administrative module is under final optimization. Please utilize other active features from the dashboard navigation.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-center gap-2">
                  <button 
                    onClick={() => navigateTo('#/admin/dashboard', 'dashboard')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
                  >
                    {language === 'bn' ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}
                  </button>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>

      {/* ----------------- MOBILE SLIDE-OUT DRAWER ----------------- */}
      <div 
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        id="admin-mobile-drawer-backdrop"
      >
        <div 
          className={`fixed top-0 bottom-0 left-0 bg-white text-gray-700 h-full w-[85%] max-w-[320px] shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out p-4 text-left ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
          id="admin-mobile-side-drawer"
        >
          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-6.5rem)] custom-scrollbar pr-1" id="admin-mobile-drawer-upper">
            
            {/* Drawer Brand Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-150" id="admin-mobile-drawer-header">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-600" />
                <span className="font-black text-xs tracking-wider text-emerald-800">
                  SHAD GHOR ADMIN
                </span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-gray-400 hover:text-emerald-700 cursor-pointer"
                id="admin-mobile-drawer-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of 12 navigation links */}
            <nav className="space-y-1" id="admin-mobile-navigation">
              {navigationStructure.map((item) => {
                const ItemIcon = item.icon;
                const isSelected = activeTab === item.id || item.subItems?.some(s => activeTab === s.id);
                const isGroup = !!item.subItems;
                const isGroupExpanded = expandedGroups[`m-${item.id}`];

                return (
                  <div key={item.id} className="space-y-0.5" id={`admin-mobile-menu-group-${item.id}`}>
                    <button
                      onClick={(e) => {
                        if (isGroup) {
                          setExpandedGroups(prev => ({
                            ...prev,
                            [`m-${item.id}`]: !prev[`m-${item.id}`]
                          }));
                        } else {
                          navigateTo(item.path, item.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50 text-emerald-800 border-l-3 border-emerald-600 rounded-r-lg' 
                          : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50/45'
                      }`}
                      id={`admin-mobile-nav-${item.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <ItemIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span>{language === 'bn' ? item.labelBn : item.labelEn}</span>
                      </div>
                      {isGroup && (
                        <div>
                          {isGroupExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                        </div>
                      )}
                    </button>

                    {isGroup && isGroupExpanded && (
                      <div className="pl-5 space-y-0.5 border-l border-gray-150 ml-5 mt-1" id={`admin-mobile-submenu-group-${item.id}`}>
                        {item.subItems?.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubSelected = activeTab === sub.id;

                          return (
                            <button
                              key={sub.id}
                              onClick={() => navigateTo(sub.path, sub.id)}
                              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                isSubSelected 
                                  ? 'text-emerald-800 bg-emerald-50 border-l-2 border-emerald-600 rounded-r-md' 
                                  : 'text-gray-500 hover:text-emerald-700 hover:bg-gray-50'
                              }`}
                              id={`admin-mobile-nav-${sub.id}`}
                            >
                              <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                              <span>{language === 'bn' ? sub.labelBn : sub.labelEn}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Drawer Profile footer */}
          <div className="space-y-3 pt-3.5 border-t border-gray-150 bg-gray-50/50" id="admin-mobile-drawer-footer">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold border border-emerald-100">
                {sessionUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-gray-700 leading-none">
                  {sessionUser?.name || 'Super Administrator'}
                </span>
                <span className="text-[10px] text-gray-400 font-bold mt-1">
                  {sessionUser?.email || 'superadmin@shadghor.com'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors animate-fade-in"
              id="admin-mobile-logout-btn"
            >
              <LogOut className="w-4 h-4 shrink-0 text-red-500" />
              <span>{language === 'bn' ? 'লগআউট করুন' : 'Sign Out'}</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
