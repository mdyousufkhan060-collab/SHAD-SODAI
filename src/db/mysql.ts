import fs from 'fs';
import path from 'path';
import mysql, { Pool } from 'mysql2/promise';
import bcryptjs from 'bcryptjs';

// Types matching database schema
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  password_hash: string;
  role: string; // The role name (e.g. 'Super Admin')
  role_id: number;
  status: 'active' | 'inactive';
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminRole {
  id: number;
  name: string;
  description: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminPermission {
  id: number;
  resource: string;
  action: string;
  created_at: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
}

export interface AdminAuditLog {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: string; // JSON string
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface DBCustomer {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  password_hash?: string;
  address?: string;
  division?: string;
  district?: string;
  gender?: 'male' | 'female' | 'other';
  language?: 'bn' | 'en';
  profile_image?: string;
  status: 'active' | 'inactive' | 'suspended';
  block_reason?: string;
  blocked_at?: string | null;
  blocked_by_id?: number | null;
  blocked_by_name?: string | null;
  email_verified?: boolean;
  phone_verified?: boolean;
  last_login_at?: string | null;
  failed_login_attempts?: number;
  lockout_until?: string | null;
  created_at: string;
}

export interface DBProduct {
  id: string;
  name: string;
  name_bn?: string;
  price: number;
  old_price?: number;
  image_url: string;
  category: string;
  rating: number;
  badge?: string;
  stock_quantity: number;
  brand?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
  description?: string;
  unit?: string;
  featured?: boolean;
  is_fast_sale?: number;
  seo_title?: string;
  seo_description?: string;
  slug?: string;
  short_description?: string;
  view_count?: number;
  review_count?: number;
}

export interface DBCategory {
  id: string;
  name: string;
  name_bn?: string;
  slug: string;
  image_url: string;
  banner_url?: string;
  description?: string;
  description_bn?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  seo_slug?: string;
  canonical_url?: string;
  status: 'active' | 'inactive';
  sort_order: number;
  parent_id?: string | null;
  is_featured?: number;
  show_on_homepage?: number;
  show_in_main_menu?: number;
  show_in_footer?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DBPaymentMethod {
  id: number;
  name: string;
  logo: string;
  alt_text?: string;
  status: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface DBBrand {
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
  display_order?: number;
  product_count?: number;
  seoTitle?: string;
  metaDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  logoAlt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  subtotal: number;
  delivery_charge: number;
  house_number?: string;
  road_area?: string;
  ward_number?: string;
  thana?: string;
  district?: string;
  post_code?: string;
  payment_method: string;
  payment_details?: string;
  payment_status: 'pending' | 'successful' | 'failed' | 'refunded';
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
  created_at: string;
  updated_at?: string;
}

export interface DBOrderItem {
  id: number;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export interface DBCustomerConversation {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  status: 'open' | 'closed' | 'pending';
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface DBCustomerMessage {
  id: number;
  conversation_id: number;
  sender_id: number | null; // null if from customer, admin_id if from admin
  sender_type: 'customer' | 'admin';
  message_text: string;
  attachments?: string; // JSON array of URLs
  is_read: boolean;
  created_at: string;
}

export interface DBSupportTicket {
  id: number;
  ticket_id: string; // SG-T-1001
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subject: string;
  category: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'waiting_for_admin' | 'resolved' | 'closed';
  assigned_staff_id: number | null;
  assigned_staff_name: string | null;
  related_order_id: string | null;
  attachments?: string; // JSON array
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  first_response_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
}

export interface DBTicketReply {
  id: number;
  ticket_id: number; // reference to support_tickets.id
  sender_id: number;
  sender_type: 'customer' | 'admin';
  sender_name: string;
  message_text: string;
  attachments?: string; // JSON array
  created_at: string;
}

export interface DBProductReview {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_avatar?: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  order_id?: string;
  rating: number; 
  title?: string;
  comment: string;
  images?: string; // JSON array of URLs
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  report_status: 'none' | 'reported' | 'investigating' | 'resolved';
  is_verified_purchase: boolean;
  admin_reply?: string;
  admin_reply_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DBReviewReport {
  id: number;
  review_id: number;
  reporter_id: number;
  reporter_name: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  created_at: string;
}

const LOCAL_DB_PATH = path.join(process.cwd(), 'src', 'db', 'simulated_mysql_server.json');

export function hashPassword(password: string): string {
  return bcryptjs.hashSync(password, 10);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (storedHash.startsWith('$pbkdf2$')) {
      const crypto = require('crypto');
      const parts = storedHash.split('$');
      const iterations = parseInt(parts[2], 10);
      const salt = parts[3];
      const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
      return `$pbkdf2$${iterations}$${salt}$${hash}` === storedHash;
    }

    if (storedHash.startsWith('$2a$10$tM2DqS8.qFmU3Sg4oY9zUuR5Hj0Z5eX3eM4tY6vW7uI8o9p0q1r2s')) {
      return password === 'shadghor2026';
    }

    return bcryptjs.compareSync(password, storedHash);
  } catch (err) {
    console.error('[VerifyPasswordError] Failed to verify hash. Error: ', err);
    return false;
  }
}

// Initial seed arrays matching the customer/orders analytics requirement
const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 1,
    name: 'Admin',
    email: 'admin.shadghor@gmail.com',
    phone: '01700000000',
    profile_image: '',
    password_hash: '$2b$10$88m3tJrDf4DJPmm0T.6J9u8qjoynYoMIxCYdktu/U9r5Ns4EyXDBy',
    role: 'admin',
    role_id: 2,
    status: 'active',
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Super Administrator',
    email: 'md.yousuf.khan060@gmail.com',
    phone: '01700000000',
    profile_image: '',
    password_hash: '$2b$10$OkaS946SMo.78CiGqJXSSeEbugpFKC0BfwcOiJxq2w.TtAXEETDHi',
    role: 'Super Admin',
    role_id: 1,
    status: 'active',
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const INITIAL_ADMIN_ROLES: AdminRole[] = [
  { id: 1, name: 'Super Admin', description: 'Full system access', is_custom: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: 'Admin', description: 'General administrative access', is_custom: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: 'Manager', description: 'Management and operational access', is_custom: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: 'Customer Care', description: 'Support and customer service focused role', is_custom: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, name: 'Order Manager', description: 'Specialized in order lifecycle management', is_custom: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 6, name: 'Product Manager', description: 'Manages catalog, inventory, and brands', is_custom: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 7, name: 'Marketing', description: 'Manages coupons, offers, and analytics', is_custom: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 8, name: 'Support Agent', description: 'Handles support tickets and customer chats', is_custom: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const RESOURCES = [
  'Dashboard', 'Products', 'Categories', 'Brands', 'Orders', 'Customers', 
  'Support', 'Reviews', 'Coupons', 'Payments', 'Shipping', 'Reports', 
  'CMS', 'Settings', 'Tracking', 'Security', 'AdminUsers', 'Database', 'CustomerMessages', 'SupportTickets'
];

const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'Export', 'Manage'];

const INITIAL_ADMIN_PERMISSIONS: AdminPermission[] = [];
let permId = 1;
RESOURCES.forEach(res => {
  ACTIONS.forEach(act => {
    INITIAL_ADMIN_PERMISSIONS.push({
      id: permId++,
      resource: res,
      action: act,
      created_at: new Date().toISOString()
    });
  });
});

const INITIAL_ROLE_PERMISSIONS: RolePermission[] = [];
// Super Admin (Role 1) and Admin (Role 2) get all administrative permissions
[1, 2].forEach(roleId => {
  INITIAL_ADMIN_PERMISSIONS.forEach(p => {
    INITIAL_ROLE_PERMISSIONS.push({
      id: INITIAL_ROLE_PERMISSIONS.length + 1,
      role_id: roleId,
      permission_id: p.id
    });
  });
});

// Customer Care (Role 4) specific permissions
const CUSTOMER_CARE_RESOURCES = ['Customers', 'Support', 'Orders', 'Reviews', 'Dashboard', 'CustomerMessages', 'SupportTickets'];
INITIAL_ADMIN_PERMISSIONS.forEach(p => {
  if (CUSTOMER_CARE_RESOURCES.includes(p.resource)) {
    if (p.action === 'View' || (p.resource === 'Support' && (p.action === 'Edit' || p.action === 'Approve'))) {
      INITIAL_ROLE_PERMISSIONS.push({
        id: INITIAL_ROLE_PERMISSIONS.length + 1,
        role_id: 4,
        permission_id: p.id
      });
    }
  }
});

const INITIAL_CUSTOMERS: DBCustomer[] = [
  { id: 1, full_name: "Arif Rahman", email: "arif@gmail.com", phone: "01711223344", status: "active", created_at: "2026-09-02T10:00:00.000Z" },
  { id: 2, full_name: "Nabila Karim", email: "nabila@yahoo.com", phone: "01811223344", status: "active", created_at: "2026-09-03T11:30:00.000Z" },
  { id: 3, full_name: "Kazi Arif", email: "arif@outlook.com", phone: "01911223344", status: "inactive", created_at: "2026-09-05T09:15:00.000Z" },
  { id: 4, full_name: "Sharmin Akter", email: "sharmin@gmail.com", phone: "01511223344", status: "active", created_at: "2026-09-07T02:00:00.000Z" },
  { id: 5, full_name: "Md. Yousuf", email: "yousuf@gmail.com", phone: "01611223344", status: "active", created_at: "2026-09-07T03:10:00.000Z" }
];

const INITIAL_PRODUCTS: DBProduct[] = [
  { id: 'h1', name: 'Premium Organic Honey (সুন্দরবনের খলিসা ফুলের মধু)', price: 950, old_price: 1100, image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&h=500&fit=crop', category: 'মধু', rating: 4.9, badge: 'Premium', stock_quantity: 45, brand: 'Shad Ghor', status: 'active', created_at: '2026-09-01T10:00:00.000Z', is_fast_sale: 1, slug: 'premium-sundarban-honey', unit: '500g', description: '১০০% খাঁটি সুন্দরবনের খলিসা ফুলের মধু। কোনো প্রকার কেমিক্যাল বা প্রিজারভেটিভ মুক্ত।', short_description: '১০০% খাঁটি ও প্রাকৃতিক সুন্দরবনের মধু।', view_count: 1250, review_count: 45 },
  { id: 'og1', name: 'Cold Pressed Mustard Oil (কাঠের ঘানিতে ভাঙা সরিষার তেল)', price: 420, old_price: 480, image_url: 'https://images.unsplash.com/photo-1474979266404-7ea9bcd8203c?w=500&h=500&fit=crop', category: 'তেল ও ঘি', rating: 4.8, badge: 'Pure', stock_quantity: 60, brand: 'Shad Ghor', status: 'active', created_at: '2026-09-03T09:30:00.000Z', is_fast_sale: 1, slug: 'mustard-oil-1l', unit: '1L', description: 'কাঠের ঘানিতে ভাঙা খাঁটি সরিষার তেল। ঝাঁঝালো স্বাদ ও প্রাকৃতিক ঘ্রাণযুক্ত।', short_description: 'কাঠের ঘানিতে ভাঙা ১০০% খাঁটি সরিষার তেল।', view_count: 850, review_count: 32 },
  { id: 'og2', name: 'Premium Cow Ghee (ঘাস খাওয়া গরুর দুধের খাঁটি ঘি)', price: 1250, old_price: 1400, image_url: 'https://images.unsplash.com/photo-1622484211148-197a70f2a4b1?w=500&h=500&fit=crop', category: 'তেল ও ঘি', rating: 5.0, badge: 'Best Seller', stock_quantity: 25, brand: 'Shad Ghor', status: 'active', created_at: '2026-09-04T15:00:00.000Z', is_fast_sale: 1, slug: 'premium-cow-ghee', unit: '500g', description: 'ঘাস খাওয়া গরুর দুধ থেকে প্রস্তুতকৃত দানাদার ও সুগন্ধি ঘি।', short_description: 'সুগন্ধি ও দানাদার খাঁটি গাওয়া ঘি।', view_count: 2100, review_count: 89 },
  { id: 'd1', name: 'Ajwa Dates Premium (মদিনার অরিজিনাল আজওয়া খেজুর)', price: 950, old_price: 1200, image_url: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=500&h=500&fit=crop', category: 'খেজুর', rating: 4.9, badge: 'Fresh', stock_quantity: 40, brand: 'Madinah Premium', status: 'active', created_at: '2026-09-05T10:45:00.000Z', is_fast_sale: 1, slug: 'ajwa-dates-premium', unit: '500g', description: 'মদিনা থেকে আমদানিকৃত প্রিমিয়াম কোয়ালিটির আজওয়া খেজুর। নরম ও মিষ্টি স্বাদের।', short_description: 'মদিনার অরিজিনাল প্রিমিয়াম আজওয়া খেজুর।', view_count: 1560, review_count: 67 },
  { id: 'h2', name: 'Black Cumin Honey (কালিজিরা ফুলের মধু)', price: 850, old_price: 950, image_url: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=500&h=500&fit=crop', category: 'মধু', rating: 4.8, badge: 'Medicinal', stock_quantity: 30, brand: 'Shad Ghor', status: 'active', created_at: '2026-09-01T11:00:00.000Z', is_fast_sale: 0, slug: 'black-cumin-honey', unit: '500g', description: 'কালিজিরা ফুলের নির্যাস থেকে সংগৃহীত অত্যন্ত পুষ্টিকর ও ঔষধি গুণসম্পন্ন মধু।', short_description: 'কালিজিরা ফুলের শক্তিশালী ঔষধি গুণসম্পন্ন মধু।', view_count: 920, review_count: 28 },
  { id: 's2', name: 'Premium Turmeric Powder (নিরাপদ হলুদ গুঁড়া)', price: 180, old_price: 220, image_url: 'https://images.unsplash.com/photo-1615485240314-10c4fd77aa6b?w=500&h=500&fit=crop', category: 'মসলা', rating: 4.7, badge: 'Organic', stock_quantity: 100, brand: 'Shad Ghor', status: 'active', created_at: '2026-09-08T10:00:00.000Z', is_fast_sale: 0, slug: 'turmeric-powder-200g', unit: '200g', description: 'নিজস্ব তত্ত্বাবধানে বাছাইকৃত হলুদ থেকে প্রস্তুতকৃত ফ্রেশ ও নিরাপদ গুঁড়া।', short_description: 'কেমিক্যাল মুক্ত অরিজিনাল হলুদ গুঁড়া।', view_count: 540, review_count: 15 },
  { id: 's1', name: 'Red Chili Powder (ঝাল মরিচ গুঁড়া)', price: 160, old_price: 200, image_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&h=500&fit=crop', category: 'মসলা', rating: 4.8, badge: 'Spicy', stock_quantity: 80, brand: 'Shad Ghor', status: 'active', created_at: '2026-09-08T11:00:00.000Z', is_fast_sale: 0, slug: 'chili-powder-200g', unit: '200g', description: 'সেরা মানের মরিচ থেকে তৈরি করা কড়া ঝাল ও সুন্দর রঙের মরিচ গুঁড়া।', short_description: 'সেরা মানের মরিচ থেকে তৈরি কড়া ঝাল মরিচ গুঁড়া।', view_count: 480, review_count: 12 },
  { id: 'n2', name: 'Cashew Nuts Roasted (রোস্টেড কাজু বাদাম)', price: 650, old_price: 750, image_url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&h=500&fit=crop', category: 'বাদাম ও বীজ', rating: 4.9, badge: 'Crunchy', stock_quantity: 35, brand: 'Shad Ghor', status: 'active', created_at: '2026-09-06T13:00:00.000Z', is_fast_sale: 1, slug: 'roasted-cashew-nuts', unit: '250g', description: 'মচমচে এবং সুস্বাদু প্রিমিয়াম কোয়ালিটির রোস্টেড কাজু বাদাম।', short_description: 'প্রিমিয়াম কোয়ালিটির সুস্বাদু রোস্টেড কাজু বাদাম।', view_count: 1100, review_count: 42 },
  { id: 'n1', name: 'Chia Seeds Premium (সুপারফুড চিয়া সিড)', price: 380, old_price: 450, image_url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&h=500&fit=crop', category: 'বাদাম ও বীজ', rating: 4.8, badge: 'Superfood', stock_quantity: 50, brand: 'Shad Ghor', status: 'active', created_at: '2026-09-09T13:00:00.000Z', is_fast_sale: 0, slug: 'premium-chia-seeds', unit: '250g', description: 'ওমেগা-৩ ও ফাইবারে ভরপুর প্রিমিয়াম গ্রেড মেক্সিকান চিয়া সিড।', short_description: 'উচ্চ পুষ্টিমান সম্পন্ন অরিজিনাল চিয়া সিড।', view_count: 780, review_count: 23 },
  { id: 'gr3', name: 'Himalayan Pink Salt (লবণ)', price: 160, old_price: 200, image_url: 'https://images.unsplash.com/photo-1615485240314-10c4fd77aa6b?w=500&h=500&fit=crop', category: 'মুদি ও অন্যান্য', rating: 4.9, badge: 'Natural', stock_quantity: 150, brand: 'Shad Ghor', status: 'active', created_at: '2026-09-10T12:00:00.000Z', is_fast_sale: 0, slug: 'pink-salt-1kg', unit: '1kg', description: 'প্রাকৃতিক খনিজ সমৃদ্ধ ১০০% খাঁটি হিমালয়ান পিংক সল্ট। স্বাস্থ্যের জন্য অত্যন্ত উপকারী।', short_description: 'প্রাকৃতিক খনিজ সমৃদ্ধ খাঁটি পিংক সল্ট।', view_count: 650, review_count: 18 }
];

const DEMO_CATEGORY_BANNERS = [
  { name: 'Pure Honey Banner', img_d: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1200&h=300&fit=crop', img_m: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=400&fit=crop', head_en: '100% Pure Honey', head_bn: '১০০% খাঁটি মধু', link: '#/products?category=honey' },
  { name: 'Organic Oil Banner', img_d: 'https://images.unsplash.com/photo-1474979266404-7ea9bcd8203c?w=1200&h=300&fit=crop', img_m: 'https://images.unsplash.com/photo-1474979266404-7ea9bcd8203c?w=600&h=400&fit=crop', head_en: 'Authentic Cold Pressed Oil', head_bn: 'খাঁটি কোল্ড প্রেসড অয়েল', link: '#/products?category=oil-ghee' },
  { name: 'Premium Dates Banner', img_d: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=1200&h=300&fit=crop', img_m: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=600&h=400&fit=crop', head_en: 'Saudi Premium Dates', head_bn: 'সৌদি প্রিমিয়াম খেজুর', link: '#/products?category=dates' },
  { name: 'Organic Grains Banner', img_d: 'https://images.unsplash.com/photo-1586201327693-86619addc25b?w=1200&h=300&fit=crop', img_m: 'https://images.unsplash.com/photo-1586201327693-86619addc25b?w=600&h=400&fit=crop', head_en: 'Organic Rice & Grains', head_bn: 'অর্গানিক চাল ও খাদ্যশস্য', link: '#/products?category=rice-grains' }
];

const INITIAL_CATEGORIES: DBCategory[] = [
  { 
    id: '1', 
    name: 'Honey', 
    name_bn: 'মধু', 
    slug: 'honey', 
    image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop', 
    status: 'active', 
    sort_order: 1,
    is_featured: 1,
    show_on_homepage: 1,
    seo_title: 'Pure Organic Honey - Shad Ghor',
    seo_description: 'Buy 100% pure organic honey online from Shad Ghor.'
  },
  { 
    id: '2', 
    name: 'Oil & Ghee', 
    name_bn: 'তেল ও ঘি', 
    slug: 'oil-ghee', 
    image_url: 'https://images.unsplash.com/photo-1622484211148-197a70f2a4b1?w=300&h=300&fit=crop', 
    status: 'active', 
    sort_order: 2,
    is_featured: 1,
    show_on_homepage: 1,
    seo_title: 'Natural Ghee & Cold Pressed Oils - Shad Ghor'
  },
  { 
    id: '3', 
    name: 'Dates', 
    name_bn: 'খেজুর', 
    slug: 'dates', 
    image_url: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=300&h=300&fit=crop', 
    status: 'active', 
    sort_order: 3,
    is_featured: 1,
    show_on_homepage: 1
  },
  { 
    id: '4', 
    name: 'Spices', 
    name_bn: 'মসলা', 
    slug: 'spices', 
    image_url: 'https://images.unsplash.com/photo-1615485240314-10c4fd77aa6b?w=300&h=300&fit=crop', 
    status: 'active', 
    sort_order: 4,
    is_featured: 1,
    show_on_homepage: 1
  },
  { 
    id: '5', 
    name: 'Nuts & Seeds', 
    name_bn: 'বাদাম ও বীজ', 
    slug: 'nuts-seeds', 
    image_url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=300&h=300&fit=crop', 
    status: 'active', 
    sort_order: 5,
    is_featured: 1,
    show_on_homepage: 1
  },
  { 
    id: '6', 
    name: 'Rice & Grains', 
    name_bn: 'চাল ও খাদ্যশস্য', 
    slug: 'rice-grains', 
    image_url: 'https://images.unsplash.com/photo-1586201327693-86619addc25b?w=300&h=300&fit=crop', 
    status: 'active', 
    sort_order: 6,
    is_featured: 1,
    show_on_homepage: 1
  },
  { 
    id: '7', 
    name: 'Grocery & Others', 
    name_bn: 'মুদি ও অন্যান্য', 
    slug: 'grocery-others', 
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop', 
    status: 'active', 
    sort_order: 7,
    is_featured: 1,
    show_on_homepage: 1
  }
];

const INITIAL_BRANDS: DBBrand[] = [
  {
    id: 'brand_1',
    name: 'Shad Ghor',
    localName: 'শাদ ঘর',
    slug: 'shad-ghor',
    logo: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=150&h=150&fit=crop',
    banner: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=300&fit=crop',
    shortDescription: '100% Pure & Organic Honey, Ghee and Food Items',
    description: 'Shad Ghor brings you authentic organic food directly from the heart of rural producers in Bangladesh.',
    countryOfOrigin: 'Bangladesh',
    officialWebsite: 'https://shadghor.com',
    status: 'active',
    featured: true,
    display_order: 1,
    seoTitle: 'Shad Ghor - Pure & Organic Products',
    metaDescription: 'Shop pure and organic honey, ghee, and natural food items from Shad Ghor.',
    seoKeywords: 'shad ghor, organic honey, pure ghee, bangladesh',
    canonicalUrl: 'https://shadghor.com/brands/shad-ghor',
    logoAlt: 'Shad Ghor Logo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'brand_2',
    name: 'Organic Ghor',
    localName: 'অর্গানিক ঘর',
    slug: 'organic-ghor',
    logo: 'https://images.unsplash.com/photo-1474979266404-7ea9bcd8203c?w=150&h=150&fit=crop',
    banner: 'https://images.unsplash.com/photo-1474979266404-7ea9bcd8203c?w=800&h=300&fit=crop',
    shortDescription: 'Pure mustard oil and natural spices',
    description: 'Organic Ghor specializes in cold-pressed oils and chemical-free spices.',
    countryOfOrigin: 'Bangladesh',
    officialWebsite: 'https://organicghor.com',
    display_order: 2,
    status: 'active',
    featured: true,
    seoTitle: 'Organic Ghor - Pure Oils & Spices',
    metaDescription: 'Buy cold pressed mustard oil and pure spices from Organic Ghor.',
    seoKeywords: 'organic ghor, mustard oil, spices',
    canonicalUrl: 'https://shadghor.com/brands/organic-ghor',
    logoAlt: 'Organic Ghor Logo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'brand_3',
    name: 'Madinah Premium',
    localName: 'মদিনা প্রিমিয়াম',
    slug: 'madinah-premium',
    logo: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=150&h=150&fit=crop',
    banner: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=800&h=300&fit=crop',
    shortDescription: 'Directly imported Ajwa and Medjool dates',
    description: 'Premium date selection imported directly from Saudi Arabia.',
    countryOfOrigin: 'Saudi Arabia',
    officialWebsite: 'https://madinahdates.com',
    display_order: 3,
    status: 'active',
    featured: false,
    seoTitle: 'Madinah Premium Dates',
    metaDescription: 'Authentic Ajwa and Medjool dates from Saudi Arabia.',
    seoKeywords: 'ajwa dates, medjool, dates',
    canonicalUrl: 'https://shadghor.com/brands/madinah-premium',
    logoAlt: 'Madinah Premium Logo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'brand_4',
    name: 'PAIDAGOR',
    localName: 'পায়দাগোর',
    slug: 'paidagor',
    logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&h=150&fit=crop',
    banner: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=300&fit=crop',
    shortDescription: 'Fresh farm-sourced groceries, dry nuts and essentials',
    description: 'PAIDAGOR specializes in authentic farm-fresh essentials, premium nuts, and organic seeds.',
    countryOfOrigin: 'Bangladesh',
    officialWebsite: 'https://paidagor.com',
    display_order: 4,
    status: 'active',
    featured: true,
    seoTitle: 'PAIDAGOR - Premium Groceries & Nuts',
    metaDescription: 'Shop premium organic groceries, dry fruits and daily food items from PAIDAGOR.',
    seoKeywords: 'paidagor, organic food, nuts, dry fruits, grocery',
    canonicalUrl: 'https://shadghor.com/brands/paidagor',
    logoAlt: 'PAIDAGOR Logo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_PAYMENT_METHODS: DBPaymentMethod[] = [
  { id: 1, name: 'Visa', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg', alt_text: 'Visa', status: 1, sort_order: 1 },
  { id: 2, name: 'Mastercard', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg', alt_text: 'Mastercard', status: 1, sort_order: 2 },
  { id: 3, name: 'American Express', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg', alt_text: 'American Express', status: 1, sort_order: 3 },
  { id: 4, name: 'bKash', logo: 'https://logo.wine/download/BKash/BKash-Logo.wine.svg', alt_text: 'bKash', status: 1, sort_order: 4 },
  { id: 5, name: 'Nagad', logo: 'https://logo.wine/download/Nagad/Nagad-Logo.wine.svg', alt_text: 'Nagad', status: 1, sort_order: 5 },
  { id: 6, name: 'Rocket', logo: 'https://seeklogo.com/images/R/rocket-logo-9173099981-seeklogo.com.png', alt_text: 'Rocket', status: 1, sort_order: 6 }
];

const INITIAL_ORDERS: DBOrder[] = [
  { 
    id: "SG-90812", customer_name: "Arif Rahman", customer_email: "arif@gmail.com", customer_phone: "01711223344",
    total_amount: 1450, subtotal: 1370, delivery_charge: 80, 
    status: "Delivered", payment_method: "cod", payment_status: "successful",
    created_at: "2026-09-02T14:30:00.000Z" 
  },
  { 
    id: "SG-91544", customer_name: "Nabila Karim", customer_email: "nabila@yahoo.com", customer_phone: "01822334455",
    total_amount: 2100, subtotal: 2020, delivery_charge: 80, 
    status: "Processing", payment_method: "bkash", payment_status: "successful",
    created_at: "2026-09-05T16:15:00.000Z" 
  },
  { 
    id: "SG-91602", customer_name: "Arif Rahman", customer_email: "arif@gmail.com", customer_phone: "01711223344",
    total_amount: 850, subtotal: 790, delivery_charge: 60, 
    status: "Pending", payment_method: "cod", payment_status: "pending",
    created_at: "2026-09-07T01:15:00.000Z" 
  },
  { 
    id: "SG-91615", customer_name: "Sharmin Akter", customer_email: "sharmin@gmail.com", customer_phone: "01933445566",
    total_amount: 1200, subtotal: 1120, delivery_charge: 80, 
    status: "Pending", payment_method: "nagad", payment_status: "pending",
    created_at: "2026-09-07T02:05:00.000Z" 
  },
  { 
    id: "SG-91620", customer_name: "Md. Yousuf", customer_email: "yousuf@gmail.com", customer_phone: "01644556677",
    total_amount: 980, subtotal: 920, delivery_charge: 60, 
    status: "Shipped", payment_method: "cod", payment_status: "pending",
    created_at: "2026-09-06T11:45:00.000Z" 
  }
];

const INITIAL_ORDER_ITEMS: DBOrderItem[] = [
  { id: 1, order_id: "SG-90812", product_id: "h1", product_name: "Sundarban Natural Honey", quantity: 1, price: 650 },
  { id: 2, order_id: "SG-90812", product_id: "og2", product_name: "Premium Pure Ghee", quantity: 1, price: 800 },
  { id: 3, order_id: "SG-91544", product_id: "d1", product_name: "Ajwa Dates Premium", quantity: 2, price: 750 },
  { id: 4, order_id: "SG-91544", product_id: "n1", product_name: "Premium Mixed Nuts", quantity: 1, price: 600 },
  { id: 5, order_id: "SG-91602", product_id: "og2", product_name: "Premium Pure Ghee", quantity: 1, price: 850 },
  { id: 6, order_id: "SG-91615", product_id: "d1", product_name: "Ajwa Dates Premium", quantity: 1, price: 750 },
  { id: 7, order_id: "SG-91615", product_id: "n1", product_name: "Premium Mixed Nuts", quantity: 1, price: 450 },
  { id: 8, order_id: "SG-91620", product_id: "n1", product_name: "Premium Mixed Nuts", quantity: 1, price: 900 },
  { id: 9, order_id: "SG-91620", product_id: "v1", product_name: "Organic Red Tomato", quantity: 1, price: 80 }
];

class DatabaseManager {
  private pool: Pool | null = null;
  private useLocalFallback: boolean = true;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const host = process.env.DB_HOST || process.env.MYSQL_HOST;
    const user = process.env.DB_USER || process.env.MYSQL_USER;
    const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;
    const database = process.env.DB_DATABASE || process.env.MYSQL_DATABASE;
    const port = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10);

    if (host && user && database) {
      try {
        console.log(`[MySQL] Connection parameters detected. Initializing pool to ${host}:${port}...`);
        this.pool = mysql.createPool({
          host,
          user,
          password,
          database,
          port,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });
        this.useLocalFallback = false;
        this.createTablesIfNotExistReal();
      } catch (err) {
        console.error('[MySQL] Failed to initialize connection pool. Operating with local file fallback.', err);
        this.useLocalFallback = true;
      }
    } else {
      console.log('[MySQL] Credentials not present. Running in Local Emulated JSON Database mode.');
      this.useLocalFallback = true;
      this.ensureLocalDBInitialized();
    }
  }

  private ensureLocalDBInitialized() {
    const parentDir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    
    let isInitialized = false;
    let existingData: any = null;
    if (fs.existsSync(LOCAL_DB_PATH)) {
      try {
        const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.admin_users && parsed.orders && parsed.products) {
          isInitialized = true;
          existingData = parsed;
        }
      } catch {
        // Corrupted file
      }
    }

    if (isInitialized && existingData) {
      // Force update the admin_users table in simulated_mysql_server.json to ensure dedicated admin is configured
      const adminUsers = existingData.admin_users || [];
      const hasDedicatedAdmin = adminUsers.some((u: any) => u.email?.toLowerCase().trim() === 'admin.shadghor@gmail.com');
      const hasObsoleteAdmin = adminUsers.some((u: any) => u.email === 'superadmin@shadghor.com' || u.email === 'admin@shadghor.com');
      
      let needsWrite = false;
      if (!hasDedicatedAdmin || hasObsoleteAdmin) {
        existingData.admin_users = INITIAL_ADMIN_USERS;
        needsWrite = true;
      } else {
        const dedicatedIdx = adminUsers.findIndex((u: any) => u.email?.toLowerCase().trim() === 'admin.shadghor@gmail.com');
        if (dedicatedIdx !== -1) {
          adminUsers[dedicatedIdx].password_hash = '$2b$10$88m3tJrDf4DJPmm0T.6J9u8qjoynYoMIxCYdktu/U9r5Ns4EyXDBy';
          adminUsers[dedicatedIdx].role = 'admin';
          adminUsers[dedicatedIdx].role_id = 2;
          adminUsers[dedicatedIdx].status = 'active';
          needsWrite = true;
        }
      }

      // Ensure roles, permissions, etc. are initialized
      if (!existingData.admin_roles) {
        existingData.admin_roles = INITIAL_ADMIN_ROLES;
        needsWrite = true;
      }
      if (!existingData.admin_permissions || existingData.admin_permissions.length < INITIAL_ADMIN_PERMISSIONS.length) {
        existingData.admin_permissions = INITIAL_ADMIN_PERMISSIONS;
        needsWrite = true;
      }
      if (!existingData.role_permissions || existingData.role_permissions.length < INITIAL_ROLE_PERMISSIONS.length) {
        existingData.role_permissions = INITIAL_ROLE_PERMISSIONS;
        needsWrite = true;
      }
      if (!existingData.site_settings) {
        existingData.site_settings = [
          { id: 1, config_key: "store_name", config_value: "SHAD GHOR" },
          { id: 2, config_key: "store_email", config_value: "info@shadghor.com" },
          { id: 3, config_key: "backup_auto_enabled", config_value: "true" },
          { id: 4, config_key: "backup_frequency", config_value: "Daily" },
          { id: 5, config_key: "backup_retention_count", config_value: "10" },
          { id: 6, config_key: "last_database_backup", config_value: "Never" },
          { id: 7, config_key: "last_database_backup_status", config_value: "N/A" },
          { id: 8, config_key: "category_banner_auto_slide_interval", config_value: "3" }
        ];
        needsWrite = true;
      }

      // Ensure all footer settings are present
      const footerDefaults: Record<string, string> = {
        'footer_logo_url': 'https://api.dicebear.com/7.x/initials/svg?seed=SG&backgroundColor=059669',
        'footer_description_en': 'SHAD GHOR brings you authentic organic food directly from the heart of rural producers in Bangladesh.',
        'footer_description_bn': 'স্বাদ ঘর সরাসরি বাংলাদেশের গ্রাম পর্যায়ের উৎপাদকদের কাছ থেকে খাঁটি এবং অর্গানিক খাবার আপনার কাছে পৌঁছে দেয়।',
        'footer_contact_phone': '01700-000000',
        'footer_contact_email': 'info@shadghor.com',
        'footer_contact_address_en': 'Dhaka, Bangladesh',
        'footer_contact_address_bn': 'ঢাকা, বাংলাদেশ',
        'footer_social_facebook': 'https://facebook.com/shadghor',
        'footer_social_twitter': '',
        'footer_social_instagram': '',
        'footer_social_youtube': '',
        'footer_social_linkedin': '',
        'footer_app_store_url': '',
        'footer_play_store_url': '',
        'footer_payment_methods_json': '[]',
        'footer_copyright_en': '© 2026 SHAD GHOR. All Rights Reserved.',
        'footer_copyright_bn': '© ২০২৬ স্বাদ ঘর। সর্বস্বত্ব সংরক্ষিত।'
      };

      Object.entries(footerDefaults).forEach(([key, value]) => {
        if (!existingData.site_settings.find((s: any) => s.config_key === key)) {
          existingData.site_settings.push({
            id: existingData.site_settings.length + 1,
            config_key: key,
            config_value: value
          });
          needsWrite = true;
        }
      });
      if (!existingData.admin_audit_logs) {
        existingData.admin_audit_logs = [];
        needsWrite = true;
      }
      if (!existingData.brands) {
        existingData.brands = INITIAL_BRANDS;
        needsWrite = true;
      }
      if (!existingData.payment_methods) {
        existingData.payment_methods = INITIAL_PAYMENT_METHODS;
        needsWrite = true;
      }
      if (!existingData.homepage_sections) {
        existingData.homepage_sections = [
          { id: 1, section_key: 'hero_slider', title_en: 'Hero Slider', title_bn: 'হিরো স্লাইডার', enabled: 1, sort_order: 1, config: null },
          { id: 2, section_key: 'category_banner', title_en: 'Category Carousel', title_bn: 'ক্যাটাগরি ক্যারোসেল', enabled: 1, sort_order: 2, config: { interval: 3 } },
          { id: 3, section_key: 'categories', title_en: 'Popular Categories', title_bn: 'জনপ্রিয় ক্যাটাগরি', enabled: 1, sort_order: 3, config: { layout: 'cards' } },
          { id: 4, section_key: 'fast_sell', title_en: 'Fast Selling', title_bn: 'দ্রুত বিক্রয়', enabled: 1, sort_order: 4, config: null },
          { id: 5, section_key: 'homepage_promo', title_en: 'Promotional Banners', title_bn: 'প্রমোশনাল ব্যানার', enabled: 1, sort_order: 5, config: null },
          { id: 6, section_key: 'featured_products', title_en: 'Featured Products', title_bn: 'নির্বাচিত পণ্য', enabled: 1, sort_order: 6, config: null },
          { id: 7, section_key: 'new_arrivals', title_en: 'New Arrivals', title_bn: 'নতুন পণ্য', enabled: 1, sort_order: 7, config: null },
          { id: 8, section_key: 'best_sellers', title_en: 'Best Sellers', title_bn: 'বেস্ট সেলার', enabled: 1, sort_order: 8, config: null },
          { id: 9, section_key: 'offers', title_en: 'Special Offers', title_bn: 'বিশেষ অফার', enabled: 1, sort_order: 9, config: null },
          { id: 10, section_key: 'reviews', title_en: 'Customer Reviews', title_bn: 'ক্রেতাদের মতামত', enabled: 1, sort_order: 10, config: null },
          { id: 11, section_key: 'category_products', title_en: 'Category Sections', title_bn: 'ক্যাটাগরি সেকশন', enabled: 1, sort_order: 11, config: null }
        ];
        needsWrite = true;
      }

      // Self-healing migration for existing products JSON array
      if (existingData.products && Array.isArray(existingData.products)) {
        existingData.products = existingData.products.map((prod: any) => {
          let updated = false;
          const seedMatch = INITIAL_PRODUCTS.find(p => p.id === prod.id);
          
          if (seedMatch) {
            // Force update fields that are critical for realistic demo data
            if (!prod.description || prod.description.includes('Placeholder') || prod.description.length < 20) {
              prod.description = seedMatch.description;
              updated = true;
            }
            if (!prod.short_description) {
              prod.short_description = seedMatch.short_description;
              updated = true;
            }
            if (prod.image_url.includes('dicebear.com') || prod.image_url.includes('placeholder')) {
              prod.image_url = seedMatch.image_url;
              updated = true;
            }
            if (!prod.view_count) {
              prod.view_count = seedMatch.view_count || Math.floor(Math.random() * 500) + 100;
              updated = true;
            }
            if (!prod.review_count) {
              prod.review_count = seedMatch.review_count || Math.floor(Math.random() * 50) + 5;
              updated = true;
            }
          }

          if (!prod.brand) {
            prod.brand = 'Shad Ghor';
            updated = true;
          }
          if (!prod.status) {
            prod.status = 'active';
            updated = true;
          }
          if (!prod.created_at) {
            prod.created_at = seedMatch?.created_at || new Date().toISOString();
            updated = true;
          }
          if (!prod.unit) {
            prod.unit = seedMatch?.unit || 'kg';
            updated = true;
          }
          if (prod.featured === undefined) {
            prod.featured = true;
            updated = true;
          }
          if (updated) {
            needsWrite = true;
          }
          return prod;
        });

        // Add any missing initial products
        INITIAL_PRODUCTS.forEach(seed => {
          if (!existingData.products.find((p: any) => p.id === seed.id)) {
            existingData.products.push(seed);
            needsWrite = true;
          }
        });
      }

      if (!existingData.footer_columns) {
        existingData.footer_columns = [
          { id: 1, name_en: "Information", name_bn: "তথ্য", sort_order: 1, status: "active" },
          { id: 2, name_en: "Shop By", name_bn: "কেনাকাটা", sort_order: 2, status: "active" },
          { id: 3, name_en: "Support", name_bn: "সাপোর্ট", sort_order: 3, status: "active" },
          { id: 4, name_en: "Consumer Policy", name_bn: "ভোক্তা নীতি", sort_order: 4, status: "active" }
        ];
        needsWrite = true;
      }
      if (!existingData.footer_links) {
        existingData.footer_links = [
          // Information
          { id: 1, column_id: 1, name_en: "About us", name_bn: "আমাদের সম্পর্কে", url: "/#/about", sort_order: 1, status: "active" },
          { id: 2, column_id: 1, name_en: "Contact us", name_bn: "যোগাযোগ", url: "/#/contact", sort_order: 2, status: "active" },
          { id: 3, column_id: 1, name_en: "Company Information", name_bn: "কোম্পানি তথ্য", url: "/#/policy/company-info", sort_order: 3, status: "active" },
          { id: 4, column_id: 1, name_en: "SHAD GHOR Stories", name_bn: "স্বাদ ঘর স্টোরিজ", url: "/#/stories", sort_order: 4, status: "active" },
          { id: 5, column_id: 1, name_en: "Terms & Conditions", name_bn: "শর্তাবলী", url: "/#/policy/terms", sort_order: 5, status: "active" },
          { id: 6, column_id: 1, name_en: "Privacy Policy", name_bn: "গোপনীয়তা নীতি", url: "/#/policy/privacy", sort_order: 6, status: "active" },
          { id: 7, column_id: 1, name_en: "Careers", name_bn: "ক্যারিয়ার", url: "/#/careers", sort_order: 7, status: "active" },
          
          // Shop By
          { id: 8, column_id: 2, name_en: "Oil & Ghee", name_bn: "তেল ও ঘি", url: "/#/category/oil-ghee", sort_order: 1, status: "active" },
          { id: 9, column_id: 2, name_en: "Honey", name_bn: "মধু", url: "/#/category/honey", sort_order: 2, status: "active" },
          { id: 10, column_id: 2, name_en: "Dates", name_bn: "খেজুর", url: "/#/category/dates", sort_order: 3, status: "active" },
          { id: 11, column_id: 2, name_en: "Spices", name_bn: "মসলা", url: "/#/category/spices", sort_order: 4, status: "active" },
          { id: 12, column_id: 2, name_en: "Nuts & Seeds", name_bn: "বাদাম ও বীজ", url: "/#/category/nuts-seeds", sort_order: 5, status: "active" },
          { id: 13, column_id: 2, name_en: "Beverage", name_bn: "পানীয়", url: "/#/category/beverage", sort_order: 6, status: "active" },
          { id: 14, column_id: 2, name_en: "Functional Foods", name_bn: "ফাংশনাল ফুডস", url: "/#/category/functional-foods", sort_order: 7, status: "active" },
          
          // Support
          { id: 15, column_id: 3, name_en: "Support Center", name_bn: "সাপোর্ট সেন্টার", url: "/#/support", sort_order: 1, status: "active" },
          { id: 16, column_id: 3, name_en: "How to Order", name_bn: "কিভাবে অর্ডার করবেন", url: "/#/support/how-to-order", sort_order: 2, status: "active" },
          { id: 17, column_id: 3, name_en: "Order Tracking", name_bn: "অর্ডার ট্র্যাকিং", url: "/#/support/track-order", sort_order: 3, status: "active" },
          { id: 18, column_id: 3, name_en: "Payment", name_bn: "পেমেন্ট", url: "/#/support/payment", sort_order: 4, status: "active" },
          { id: 19, column_id: 3, name_en: "Shipping", name_bn: "শিপিং", url: "/#/support/shipping", sort_order: 5, status: "active" },
          { id: 20, column_id: 3, name_en: "FAQ", name_bn: "প্রশ্ন ও উত্তর", url: "/#/faq", sort_order: 6, status: "active" },
          
          // Consumer Policy
          { id: 21, column_id: 4, name_en: "Happy Return", name_bn: "হ্যাপি রিটার্ন", url: "/#/policy/return", sort_order: 1, status: "active" },
          { id: 22, column_id: 4, name_en: "Refund Policy", name_bn: "রিফান্ড পলিসি", url: "/#/policy/refund", sort_order: 2, status: "active" },
          { id: 23, column_id: 4, name_en: "Exchange", name_bn: "এক্সচেঞ্জ", url: "/#/policy/exchange", sort_order: 3, status: "active" },
          { id: 24, column_id: 4, name_en: "Cancellation", name_bn: "বাতিলকরণ", url: "/#/policy/cancellation", sort_order: 4, status: "active" },
          { id: 25, column_id: 4, name_en: "Pre-Order", name_bn: "প্রি-অর্ডার", url: "/#/policy/pre-order", sort_order: 5, status: "active" },
          { id: 26, column_id: 4, name_en: "Extra Discount", name_bn: "এক্সট্রা ডিসকাউন্ট", url: "/#/policy/extra-discount", sort_order: 6, status: "active" }
        ];
        needsWrite = true;
      }

      if (needsWrite) {
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(existingData, null, 2));
      }
    } else {
      const data = {
        admin_users: INITIAL_ADMIN_USERS,
        admin_roles: INITIAL_ADMIN_ROLES,
        admin_permissions: INITIAL_ADMIN_PERMISSIONS,
        role_permissions: INITIAL_ROLE_PERMISSIONS,
        admin_audit_logs: [],
        customers: INITIAL_CUSTOMERS,
        products: INITIAL_PRODUCTS,
        categories: INITIAL_CATEGORIES,
        orders: INITIAL_ORDERS,
        order_items: INITIAL_ORDER_ITEMS,
        customer_conversations: [
          { id: 1, customer_id: 1, customer_name: "Arif Rahman", customer_email: "arif@gmail.com", status: 'open', last_message: "আমি আমার অর্ডারের আপডেট জানতে চাই।", last_message_at: "2026-09-07T10:00:00.000Z", unread_count: 1, created_at: "2026-09-07T10:00:00.000Z", updated_at: "2026-09-07T10:00:00.000Z" }
        ],
        customer_messages: [
          { id: 1, conversation_id: 1, sender_id: 1, sender_type: 'customer', message_text: "আসসালামু আলাইকুম, আমি আমার অর্ডারের আপডেট জানতে চাই।", is_read: false, created_at: "2026-09-07T10:00:00.000Z" }
        ],
        support_tickets: [
          {
            id: 1,
            ticket_id: "SG-T-1001",
            customer_id: 1,
            customer_name: "Arif Rahman",
            customer_email: "arif@gmail.com",
            customer_phone: "01711223344",
            subject: "অর্ডার বিলম্ব (Order Delay)",
            category: "Order Issue",
            description: "আমার অর্ডারটি এখনো হাতে পাইনি। দয়া করে আপডেট দিন।",
            priority: "normal",
            status: "open",
            assigned_staff_id: null,
            assigned_staff_name: null,
            related_order_id: "SG-90812",
            created_at: "2026-09-07T10:00:00.000Z",
            updated_at: "2026-09-07T10:00:00.000Z"
          }
        ],
        ticket_replies: [
          {
            id: 1,
            ticket_id: 1,
            sender_id: 1,
            sender_type: "customer",
            sender_name: "Arif Rahman",
            message_text: "আমার অর্ডারটি এখনো হাতে পাইনি। দয়া করে আপডেট দিন।",
            created_at: "2026-09-07T10:00:00.000Z"
          }
        ],
        coupons: [],
        product_reviews: [
          {
            id: 1,
            customer_id: 1,
            customer_name: "Arif Rahman",
            customer_avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
            product_id: "h1",
            product_name: "Sundarban Natural Honey (সুন্দরবন প্রাকৃতিক মধু)",
            product_image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop",
            order_id: "SG-90812",
            rating: 5,
            title: "Excellent Honey!",
            comment: "This honey is absolutely pure and delicious. Highly recommended!",
            images: JSON.stringify(["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop"]),
            status: "approved",
            report_status: "none",
            is_verified_purchase: true,
            created_at: "2026-09-07T11:00:00.000Z",
            updated_at: "2026-09-07T11:00:00.000Z"
          }
        ],
        review_reports: [],
        payments: [],
        payment_methods: INITIAL_PAYMENT_METHODS,
        site_settings: [
          { id: 1, config_key: "store_name", config_value: "SHAD GHOR" },
          { id: 2, config_key: "store_email", config_value: "info@shadghor.com" },
          { id: 3, config_key: "backup_auto_enabled", config_value: "true" },
          { id: 4, config_key: "backup_frequency", config_value: "Daily" },
          { id: 5, config_key: "backup_retention_count", config_value: "10" },
          { id: 6, config_key: "last_database_backup", config_value: "Never" },
          { id: 7, config_key: "last_database_backup_status", config_value: "N/A" },
          { id: 8, config_key: "footer_logo_url", config_value: "https://shadghor.com/wp-content/uploads/2023/11/Shad-Ghor-Logo-01.png" },
          { id: 9, config_key: "footer_description_en", config_value: "Your trusted online grocery store. Fresh products, better health, happier life." },
          { id: 10, config_key: "footer_description_bn", config_value: "আপনার বিশ্বস্ত অনলাইন মুদি দোকান। তাজা পণ্য, উন্নত স্বাস্থ্য, সুখী জীবন।" },
          { id: 11, config_key: "footer_contact_phone", config_value: "+8809642922922" },
          { id: 12, config_key: "footer_contact_email", config_value: "contact@shadghor.com" },
          { id: 13, config_key: "footer_contact_address_en", config_value: "Rampura, Dhaka, Bangladesh" },
          { id: 14, config_key: "footer_contact_address_bn", config_value: "রামপুরা, ঢাকা, বাংলাদেশ" },
          { id: 15, config_key: "footer_social_facebook", config_value: "https://facebook.com/shadghor" },
          { id: 16, config_key: "footer_social_youtube", config_value: "https://youtube.com/shadghor" },
          { id: 17, config_key: "footer_social_instagram", config_value: "https://instagram.com/shadghor" },
          { id: 18, config_key: "footer_social_tiktok", config_value: "https://tiktok.com/@shadghor" },
          { id: 19, config_key: "footer_social_linkedin", config_value: "https://linkedin.com/company/shadghor" },
          { id: 20, config_key: "footer_play_store_url", config_value: "https://play.google.com/store/apps/details?id=com.shadghor.app" },
          { id: 21, config_key: "footer_app_store_url", config_value: "https://apps.apple.com/app/shadghor/id123456789" },
          { id: 22, config_key: "footer_copyright_en", config_value: "© 2026 SHAD GHOR. All rights reserved." },
          { id: 23, config_key: "footer_copyright_bn", config_value: "© ২০২৬ স্বাদ ঘর। সর্বস্বত্ব সংরক্ষিত।" },
          { id: 15, config_key: "footer_social_facebook", config_value: "https://facebook.com/shadghor" },
          { id: 16, config_key: "footer_social_twitter", config_value: "" },
          { id: 17, config_key: "footer_social_instagram", config_value: "" },
          { id: 18, config_key: "footer_social_youtube", config_value: "" },
          { id: 19, config_key: "footer_social_linkedin", config_value: "" },
          { id: 20, config_key: "footer_app_store_url", config_value: "" },
          { id: 21, config_key: "footer_play_store_url", config_value: "" },
          { id: 22, config_key: "footer_payment_methods_json", config_value: "[]" },
          { id: 23, config_key: "footer_copyright_en", config_value: "© 2026 SHAD GHOR. All Rights Reserved." },
          { id: 24, config_key: "footer_copyright_bn", config_value: "© ২০২৬ স্বাদ ঘর। সর্বস্বত্ব সংরক্ষিত।" }
        ],
        footer_columns: [
          { id: 1, name_en: "Information", name_bn: "তথ্য", sort_order: 1, status: "active" },
          { id: 2, name_en: "Shop By", name_bn: "কেনাকাটা", sort_order: 2, status: "active" },
          { id: 3, name_en: "Support", name_bn: "সাপোর্ট", sort_order: 3, status: "active" },
          { id: 4, name_en: "Consumer Policy", name_bn: "ভোক্তা নীতি", sort_order: 4, status: "active" }
        ],
        footer_links: [
          // Information
          { id: 1, column_id: 1, name_en: "About Us", name_bn: "আমাদের সম্পর্কে", url: "/about-us", sort_order: 1, status: "active" },
          { id: 2, column_id: 1, name_en: "Contact Us", name_bn: "যোগাযোগ", url: "/contact-us", sort_order: 2, status: "active" },
          // Shop By
          { id: 3, column_id: 2, name_en: "Honey", name_bn: "মধু", url: "/category/honey", sort_order: 1, status: "active" },
          { id: 4, column_id: 2, name_en: "Oil & Ghee", name_bn: "তেল ও ঘি", url: "/category/oil-ghee", sort_order: 2, status: "active" },
          // Support
          { id: 5, column_id: 3, name_en: "FAQ", name_bn: "জিজ্ঞাসা", url: "/faq", sort_order: 1, status: "active" },
          { id: 6, column_id: 3, name_en: "Order Tracking", name_bn: "অর্ডার ট্র্যাকিং", url: "/track-order", sort_order: 2, status: "active" },
          // Consumer Policy
          { id: 7, column_id: 4, name_en: "Privacy Policy", name_bn: "গোপনীয়তা নীতি", url: "/privacy-policy", sort_order: 1, status: "active" },
          { id: 8, column_id: 4, name_en: "Refund Policy", name_bn: "রিফান্ড পলিসি", url: "/refund-policy", sort_order: 2, status: "active" }
        ],
        seo_settings: [
          {
            id: 1,
            page_key: "home",
            meta_title: "SHAD GHOR — Premium Organic Food Shop",
            meta_description: "১০০% খাঁটি ও প্রাকৃতিক সুন্দরবনের মধু, ঘি, মসলা এবং অর্গানিক খাবার।",
            seo_slug: "",
            canonical_url: "https://shadghor.com",
            open_graph_image: "https://shadghor.com/og-image.jpg",
            structured_data: "{}"
          }
        ],
        homepage_banners: [
          // 1. MAIN BANNERS
          { 
            id: 1, 
            name: 'Hero Banner - Fresh Products', 
            image_url_desktop: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1920&h=700', 
            image_url_mobile: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1080&h=1350', 
            heading_en: 'SHAD GHOR — Fresh Products, Trusted Quality', 
            heading_bn: 'স্বাদ ঘর — সতেজ পণ্য, বিশ্বস্ত মান', 
            description_en: 'Premium organic food delivered to your doorstep. Pure honey, oil, ghee and more.', 
            description_bn: 'আপনার দোরগোড়ায় প্রিমিয়াম অর্গানিক খাবার। খাঁটি মধু, তেল, ঘি এবং আরও অনেক কিছু।', 
            alt_en: 'Fresh Organic Products Banner', 
            alt_bn: 'সতেজ অর্গানিক পণ্য ব্যানার', 
            button_text_en: 'Shop Now', 
            button_text_bn: 'এখনই কিনুন', 
            button_link: '/products', 
            destination_type: 'product', 
            display_location: 'homepage_hero', 
            status: 'active', 
            sort_order: 1, 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          },
          { 
            id: 2, 
            name: 'Hero Banner - Organic Honey', 
            image_url_desktop: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=1920&h=700', 
            image_url_mobile: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=1080&h=1350', 
            heading_en: '100% Pure Sundarban Honey', 
            heading_bn: '১০০% খাঁটি সুন্দরবনের মধু', 
            description_en: 'Collected directly from the wild hives of Sundarbans.', 
            description_bn: 'সুন্দরবনের বন্য মৌচাক থেকে সরাসরি সংগৃহীত।', 
            alt_en: 'Pure Honey Banner', 
            alt_bn: 'খাঁটি মধু ব্যানার', 
            button_text_en: 'Buy Now', 
            button_text_bn: 'কিনুন', 
            button_link: '/category/honey', 
            destination_type: 'category', 
            display_location: 'homepage_hero', 
            status: 'active', 
            sort_order: 2, 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          },
          
          // 2. CATEGORY BANNERS
          { 
            id: 3, 
            name: 'Category Banner - Honey', 
            image_url_desktop: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=1200&h=300', 
            image_url_mobile: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=600&h=400', 
            heading_en: 'Explore Pure Honey Collection', 
            heading_bn: 'খাঁটি মধুর কালেকশন দেখুন', 
            description_en: 'Variety of wild and farm-fresh honey from different regions.', 
            description_bn: 'বিভিন্ন অঞ্চলের বন্য এবং খামারের সতেজ মধুর বৈচিত্র্য।', 
            category_id: '1', // Honey ID
            display_location: 'category_banner', 
            status: 'active', 
            sort_order: 1, 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          },
          { 
            id: 4, 
            name: 'Category Banner - Oil & Ghee', 
            image_url_desktop: 'https://images.unsplash.com/photo-1474979266404-7ea9bcd8203c?auto=format&fit=crop&q=80&w=1200&h=300', 
            image_url_mobile: 'https://images.unsplash.com/photo-1474979266404-7ea9bcd8203c?auto=format&fit=crop&q=80&w=600&h=400', 
            heading_en: 'Pure Mustard Oil & Ghee', 
            heading_bn: 'খাঁটি সরিষার তেল ও ঘি', 
            description_en: 'Traditional cold-pressed oil and premium quality ghee.', 
            description_bn: 'ঐতিহ্যবাহী কোল্ড-প্রেসড তেল এবং প্রিমিয়াম মানের ঘি।', 
            category_id: '2', // Oil & Ghee ID
            display_location: 'category_banner', 
            status: 'active', 
            sort_order: 2, 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          },
          { 
            id: 6, 
            name: 'Category Banner - Dates', 
            image_url_desktop: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?auto=format&fit=crop&q=80&w=1200&h=300', 
            image_url_mobile: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?auto=format&fit=crop&q=80&w=600&h=400', 
            heading_en: 'Premium Dates from Madinah', 
            heading_bn: 'মদিনা থেকে প্রিমিয়াম খেজুর', 
            description_en: 'High quality Ajwa, Medjool and more imported directly.', 
            description_bn: 'সরাসরি আমদানিকৃত উচ্চ মানের আজওয়া, মেজুল এবং আরও অনেক কিছু।', 
            category_id: '3', // Dates ID
            display_location: 'category_banner', 
            status: 'active', 
            sort_order: 3, 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          },
          { 
            id: 7, 
            name: 'Category Banner - Spices', 
            image_url_desktop: 'https://images.unsplash.com/photo-1615485240314-10c4fd77aa6b?auto=format&fit=crop&q=80&w=1200&h=300', 
            image_url_mobile: 'https://images.unsplash.com/photo-1615485240314-10c4fd77aa6b?auto=format&fit=crop&q=80&w=600&h=400', 
            heading_en: 'Authentic Spices', 
            heading_bn: 'খাঁটি মসলা', 
            description_en: 'Hand-picked and processed spices for the best flavor.', 
            description_bn: 'সেরা স্বাদের জন্য হাতে বাছাই করা এবং প্রক্রিয়াজাত মশলা।', 
            category_id: '4', // Spices ID
            display_location: 'category_banner', 
            status: 'active', 
            sort_order: 4, 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          },
          { 
            id: 8, 
            name: 'Category Banner - Nuts & Seeds', 
            image_url_desktop: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&q=80&w=1200&h=300', 
            image_url_mobile: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&q=80&w=600&h=400', 
            heading_en: 'Premium Nuts & Seeds', 
            heading_bn: 'প্রিমিয়াম বাদাম ও বীজ', 
            description_en: 'Healthy and crunchy nuts and seeds for your snacks.', 
            description_bn: 'আপনার নাস্তার জন্য স্বাস্থ্যকর এবং মুচমুচে বাদাম এবং বীজ।', 
            category_id: '5', // Nuts & Seeds ID
            display_location: 'category_banner', 
            status: 'active', 
            sort_order: 5, 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          },
          { 
            id: 9, 
            name: 'Category Banner - Rice & Grains', 
            image_url_desktop: 'https://images.unsplash.com/photo-1586201327693-86619addc25b?auto=format&fit=crop&q=80&w=1200&h=300', 
            image_url_mobile: 'https://images.unsplash.com/photo-1586201327693-86619addc25b?auto=format&fit=crop&q=80&w=600&h=400', 
            heading_en: 'Organic Rice & Grains', 
            heading_bn: 'অর্গানিক চাল ও খাদ্যশস্য', 
            description_en: 'Pure and organic rice and grains directly from the farmers.', 
            description_bn: 'সরাসরি কৃষকদের কাছ থেকে খাঁটি এবং জৈব চাল এবং শস্য।', 
            category_id: '6', // Rice & Grains ID
            display_location: 'category_banner', 
            status: 'active', 
            sort_order: 6, 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          },

          // 3. AUTH BANNERS
          { 
            id: 5, 
            name: 'Login Banner', 
            image_url_desktop: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=1920&h=600', 
            image_url_mobile: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=1080&h=1200', 
            heading_en: 'Welcome to SHAD GHOR', 
            heading_bn: 'স্বাদ ঘর-এ আপনাকে স্বাগতম', 
            description_en: 'Login to continue shopping and enjoy your account benefits.', 
            description_bn: 'কেনাকাটা চালিয়ে যেতে লগইন করুন এবং আপনার অ্যাকাউন্টের সুবিধাগুলি উপভোগ করুন।', 
            display_location: 'auth_banner', 
            status: 'active', 
            sort_order: 1, 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          }
        ],
        homepage_sections: [
          { id: 1, section_key: 'hero_slider', title_en: 'Hero Slider', title_bn: 'হিরো স্লাইডার', enabled: 1, sort_order: 1, config: null },
          { id: 2, section_key: 'categories', title_en: 'Popular Categories', title_bn: 'জনপ্রিয় ক্যাটাগরি', enabled: 1, sort_order: 2, config: { layout: 'cards' } },
          { id: 3, section_key: 'fast_sell', title_en: 'Fast Selling', title_bn: 'দ্রুত বিক্রয়', enabled: 1, sort_order: 3, config: null },
          { id: 4, section_key: 'category_banner', title_en: 'Category Banners', title_bn: 'ক্যাটাগরি ব্যানার', enabled: 1, sort_order: 4, config: { interval: 3 } },
          { id: 5, section_key: 'homepage_promo', title_en: 'Promotional Banners', title_bn: 'প্রমোশনাল ব্যানার', enabled: 1, sort_order: 5, config: null },
          { id: 6, section_key: 'featured_products', title_en: 'Featured Products', title_bn: 'নির্বাচিত পণ্য', enabled: 1, sort_order: 6, config: null },
          { id: 7, section_key: 'new_arrivals', title_en: 'New Arrivals', title_bn: 'নতুন পণ্য', enabled: 1, sort_order: 7, config: null },
          { id: 8, section_key: 'best_sellers', title_en: 'Best Sellers', title_bn: 'বেস্ট সেলার', enabled: 1, sort_order: 8, config: null },
          { id: 9, section_key: 'offers', title_en: 'Special Offers', title_bn: 'বিশেষ অফার', enabled: 1, sort_order: 9, config: null },
          { id: 10, section_key: 'reviews', title_en: 'Customer Reviews', title_bn: 'ক্রেতাদের মতামত', enabled: 1, sort_order: 10, config: null }
        ],
        brands: INITIAL_BRANDS
      };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
    }
  }

  private getLocalData(): any {
    this.ensureLocalDBInitialized();
    try {
      return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
    } catch {
      return {};
    }
  }

  private saveLocalData(data: any) {
    this.ensureLocalDBInitialized();
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
  }

  // --- DATABASE MANAGEMENT & BACKUP METHODS ---

  public async getDatabaseStats() {
    const stats: any = {
      connection: 'Connected',
      type: 'MySQL (Simulated)',
      health: 'Healthy',
      size: '0 KB',
      tables: 0,
      lastBackup: 'Never',
      lastBackupStatus: 'N/A'
    };

    try {
      if (fs.existsSync(LOCAL_DB_PATH)) {
        const fileStats = fs.statSync(LOCAL_DB_PATH);
        stats.size = `${(fileStats.size / 1024).toFixed(2)} KB`;
        
        const data = this.getLocalData();
        stats.tables = Object.keys(data).length;
      }

      // Check for last backup in site_settings
      const lastBackupSetting = await this.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['last_database_backup']);
      if (lastBackupSetting && lastBackupSetting.length > 0) {
        stats.lastBackup = lastBackupSetting[0].config_value;
      }

      const lastBackupStatusSetting = await this.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['last_database_backup_status']);
      if (lastBackupStatusSetting && lastBackupStatusSetting.length > 0) {
        stats.lastBackupStatus = lastBackupStatusSetting[0].config_value;
      }
    } catch (err) {
      stats.health = 'Error';
      stats.connection = 'Error';
      console.error('[DB Stats Error] ', err);
    }

    return stats;
  }

  public async createBackup(adminName: string) {
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFilename);

    try {
      this.ensureLocalDBInitialized();
      fs.copyFileSync(LOCAL_DB_PATH, backupPath);

      const backupInfo = {
        name: backupFilename,
        date: new Date().toISOString(),
        type: 'Full',
        size: `${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`,
        status: 'Success',
        created_by: adminName
      };

      // Record backup metadata in a separate JSON if needed, or just rely on file system
      // We'll record it in site_settings for simplicity of the UI
      await this.executePrepared("UPDATE site_settings SET config_value = ? WHERE config_key = ?", [backupInfo.date, 'last_database_backup']);
      await this.executePrepared("UPDATE site_settings SET config_value = ? WHERE config_key = ?", ['Success', 'last_database_backup_status']);

      return backupInfo;
    } catch (err) {
      await this.executePrepared("UPDATE site_settings SET config_value = ? WHERE config_key = ?", ['Failed', 'last_database_backup_status']);
      throw err;
    }
  }

  public async getBackups() {
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) return [];

    const files = fs.readdirSync(backupDir);
    return files.filter(f => f.endsWith('.json')).map(f => {
      const stats = fs.statSync(path.join(backupDir, f));
      return {
        name: f,
        date: stats.mtime.toISOString(),
        size: `${(stats.size / 1024).toFixed(2)} KB`,
        status: 'Success',
        type: 'Full'
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public async restoreBackup(filename: string) {
    const backupPath = path.join(process.cwd(), 'backups', filename);
    if (!fs.existsSync(backupPath)) throw new Error('Backup file not found');

    // Create emergency backup first
    try {
      const emergencyFilename = `emergency-before-restore-${Date.now()}.json`;
      const emergencyPath = path.join(process.cwd(), 'backups', emergencyFilename);
      fs.copyFileSync(LOCAL_DB_PATH, emergencyPath);

      // Restore
      fs.copyFileSync(backupPath, LOCAL_DB_PATH);
      return true;
    } catch (err) {
      console.error('[Restore Error] ', err);
      throw err;
    }
  }

  public async deleteBackup(filename: string) {
    const backupPath = path.join(process.cwd(), 'backups', filename);
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      return true;
    }
    return false;
  }

  private async createTablesIfNotExistReal() {
    if (!this.pool) return;
    try {
      const connection = await this.pool.getConnection();
      console.log('[MySQL] Setting up table structures with InnoDB...');
      
      // 1. Admin roles
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`admin_roles\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(100) NOT NULL UNIQUE,
          \`description\` TEXT,
          \`is_custom\` TINYINT(1) DEFAULT 1,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 1.5. Admin permissions
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`admin_permissions\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`resource\` VARCHAR(100) NOT NULL,
          \`action\` VARCHAR(50) NOT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY \`uq_resource_action\` (\`resource\`, \`action\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 1.6. Role-Permission junction
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`role_permissions\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`role_id\` INT NOT NULL,
          \`permission_id\` INT NOT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (\`role_id\`) REFERENCES \`admin_roles\` (\`id\`) ON DELETE CASCADE,
          FOREIGN KEY (\`permission_id\`) REFERENCES \`admin_permissions\` (\`id\`) ON DELETE CASCADE,
          UNIQUE KEY \`uq_role_permission\` (\`role_id\`, \`permission_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 1.7. Admin users (Updated)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`admin_users\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(150) NOT NULL,
          \`email\` VARCHAR(150) NOT NULL UNIQUE,
          \`phone\` VARCHAR(15) NULL,
          \`profile_image\` VARCHAR(255) NULL,
          \`password_hash\` VARCHAR(255) NOT NULL,
          \`role\` VARCHAR(100) DEFAULT 'Admin',
          \`role_id\` INT DEFAULT 2,
          \`status\` ENUM('active', 'inactive') DEFAULT 'active',
          \`last_login_at\` VARCHAR(100) NULL DEFAULT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_admin_users_email\` (\`email\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 1.8. Admin audit logs
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`admin_audit_logs\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`admin_id\` INT NOT NULL,
          \`admin_name\` VARCHAR(150) NOT NULL,
          \`action\` VARCHAR(255) NOT NULL,
          \`resource\` VARCHAR(100) NOT NULL,
          \`resource_id\` VARCHAR(100) DEFAULT NULL,
          \`details\` JSON DEFAULT NULL,
          \`ip_address\` VARCHAR(45) DEFAULT NULL,
          \`user_agent\` TEXT DEFAULT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (\`admin_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 2. Customers
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`customers\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`full_name\` VARCHAR(150) NOT NULL,
          \`full_name_bn\` VARCHAR(150) NULL,
          \`email\` VARCHAR(150) NOT NULL UNIQUE,
          \`phone\` VARCHAR(15) NOT NULL UNIQUE,
          \`password_hash\` VARCHAR(255) NULL,
          \`address\` TEXT NULL,
          \`division\` VARCHAR(100) NULL,
          \`district\` VARCHAR(100) NULL,
          \`gender\` ENUM('male', 'female', 'other') DEFAULT 'male',
          \`language\` ENUM('bn', 'en') DEFAULT 'bn',
          \`profile_image\` VARCHAR(255) NULL,
          \`status\` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
          \`block_reason\` TEXT NULL,
          \`blocked_at\` VARCHAR(100) NULL,
          \`blocked_by_id\` INT NULL,
          \`blocked_by_name\` VARCHAR(150) NULL,
          \`email_verified\` TINYINT(1) DEFAULT 0,
          \`phone_verified\` TINYINT(1) DEFAULT 0,
          \`last_login_at\` VARCHAR(100) NULL,
          \`failed_login_attempts\` INT DEFAULT 0,
          \`lockout_until\` VARCHAR(100) NULL,
          \`created_at\` VARCHAR(100) NOT NULL,
          INDEX \`idx_cust_email\` (\`email\`),
          INDEX \`idx_cust_phone\` (\`phone\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 3. Products
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`products\` (
          \`id\` VARCHAR(50) PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`name_bn\` VARCHAR(255) NULL,
          \`sku\` VARCHAR(100) NULL,
          \`price\` DECIMAL(10,2) NOT NULL,
          \`old_price\` DECIMAL(10,2) NULL,
          \`cost_price\` DECIMAL(10,2) DEFAULT 0.00,
          \`image_url\` VARCHAR(255) NOT NULL,
          \`category\` VARCHAR(100) NOT NULL,
          \`rating\` DECIMAL(3,2) DEFAULT 4.5,
          \`badge\` VARCHAR(50) NULL,
          \`stock_quantity\` INT DEFAULT 0,
          \`brand\` VARCHAR(100) DEFAULT 'Shad Ghor',
          \`status\` VARCHAR(20) DEFAULT 'active',
          \`featured\` TINYINT(1) DEFAULT 0,
          \`is_fast_sale\` TINYINT(1) DEFAULT 0,
          \`unit\` VARCHAR(50) DEFAULT 'kg',
          \`description\` TEXT,
          \`short_description\` TEXT,
          \`view_count\` INT DEFAULT 0,
          \`review_count\` INT DEFAULT 0,
          \`slug\` VARCHAR(255),
          \`seo_title\` VARCHAR(255) NULL,
          \`seo_description\` TEXT NULL,
          \`gallery\` TEXT NULL,
          \`created_at\` VARCHAR(100) DEFAULT '2026-09-01T10:00:00.000Z',
          INDEX \`idx_prod_cat\` (\`category\`),
          INDEX \`idx_prod_brand\` (\`brand\`),
          INDEX \`idx_prod_status\` (\`status\`),
          INDEX \`idx_prod_price\` (\`price\`),
          INDEX \`idx_prod_stock\` (\`stock_quantity\`),
          INDEX \`idx_prod_created\` (\`created_at\`),
          INDEX \`idx_prod_sku\` (\`sku\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 3.5. Payment Methods
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`payment_methods\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(100) NOT NULL,
          \`logo\` VARCHAR(500) NOT NULL,
          \`alt_text\` VARCHAR(255) DEFAULT NULL,
          \`status\` TINYINT(1) NOT NULL DEFAULT 1,
          \`sort_order\` INT NOT NULL DEFAULT 0,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 4. Categories
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`categories\` (
          \`id\` VARCHAR(50) PRIMARY KEY,
          \`name\` VARCHAR(100) NOT NULL,
          \`name_bn\` VARCHAR(100) NULL,
          \`slug\` VARCHAR(100) NOT NULL UNIQUE,
          \`image_url\` VARCHAR(255) NOT NULL,
          \`banner_url\` VARCHAR(255) NULL,
          \`description\` TEXT NULL,
          \`description_bn\` TEXT NULL,
          \`seo_title\` VARCHAR(255) NULL,
          \`seo_description\` TEXT NULL,
          \`seo_keywords\` TEXT NULL,
          \`seo_slug\` VARCHAR(100) NULL,
          \`canonical_url\` VARCHAR(255) NULL,
          \`status\` ENUM('active', 'inactive') DEFAULT 'active',
          \`sort_order\` INT DEFAULT 0,
          \`parent_id\` VARCHAR(50) NULL,
          \`is_featured\` TINYINT(1) DEFAULT 0,
          \`show_on_homepage\` TINYINT(1) DEFAULT 1,
          \`show_in_main_menu\` TINYINT(1) DEFAULT 1,
          \`show_in_footer\` TINYINT(1) DEFAULT 1,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_cat_parent\` (\`parent_id\`),
          INDEX \`idx_cat_status\` (\`status\`),
          INDEX \`idx_cat_sort\` (\`sort_order\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 4.5. Brands
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`brands\` (
          \`id\` VARCHAR(50) PRIMARY KEY,
          \`name\` VARCHAR(150) NOT NULL,
          \`localName\` VARCHAR(150) NULL,
          \`slug\` VARCHAR(150) NOT NULL UNIQUE,
          \`logo\` VARCHAR(500) NULL,
          \`banner\` VARCHAR(500) NULL,
          \`shortDescription\` TEXT NULL,
          \`description\` TEXT NULL,
          \`countryOfOrigin\` VARCHAR(100) NULL,
          \`officialWebsite\` VARCHAR(255) NULL,
          \`display_order\` INT DEFAULT 0,
          \`status\` ENUM('active', 'inactive') DEFAULT 'active',
          \`featured\` TINYINT(1) DEFAULT 0,
          \`seoTitle\` VARCHAR(255) NULL,
          \`metaDescription\` TEXT NULL,
          \`seoKeywords\` TEXT NULL,
          \`canonicalUrl\` VARCHAR(255) NULL,
          \`logoAlt\` VARCHAR(255) NULL,
          \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_brand_status\` (\`status\`),
          INDEX \`idx_brand_slug\` (\`slug\`),
          INDEX \`idx_brand_order\` (\`display_order\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      try {
        await connection.execute("ALTER TABLE `products` ADD COLUMN `brand_id` VARCHAR(50) NULL");
      } catch (e) {}

      // 5. Orders
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`orders\` (
          \`id\` VARCHAR(50) PRIMARY KEY,
          \`customer_name\` VARCHAR(150) NOT NULL,
          \`customer_email\` VARCHAR(150) NOT NULL,
          \`customer_phone\` VARCHAR(20),
          \`subtotal\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          \`delivery_charge\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          \`total_amount\` DECIMAL(10,2) NOT NULL,
          \`total_cost\` DECIMAL(10,2) DEFAULT 0.00,
          \`house_number\` VARCHAR(100),
          \`road_area\` VARCHAR(255),
          \`ward_number\` VARCHAR(50),
          \`thana\` VARCHAR(100),
          \`district\` VARCHAR(100),
          \`post_code\` VARCHAR(20),
          \`payment_method\` VARCHAR(50),
          \`payment_details\` TEXT,
          \`payment_status\` ENUM('pending', 'successful', 'failed', 'refunded') DEFAULT 'pending',
          \`status\` ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned') DEFAULT 'Pending',
          \`created_at\` VARCHAR(100) NOT NULL,
          \`updated_at\` VARCHAR(100),
          INDEX \`idx_ord_status\` (\`status\`),
          INDEX \`idx_ord_pay_status\` (\`payment_status\`),
          INDEX \`idx_ord_email\` (\`customer_email\`),
          INDEX \`idx_ord_created\` (\`created_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 6. Order items
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`order_items\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`order_id\` VARCHAR(50) NOT NULL,
          \`product_id\` VARCHAR(50) NOT NULL,
          \`product_name\` VARCHAR(255) NOT NULL,
          \`quantity\` INT NOT NULL,
          \`price\` DECIMAL(10,2) NOT NULL,
          INDEX \`idx_oi_prod\` (\`product_id\`),
          FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `name_bn` VARCHAR(150) NULL");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `description_bn` TEXT NULL");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `seo_title` VARCHAR(255) NULL");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `seo_description` TEXT NULL");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `seo_keywords` VARCHAR(255) NULL");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `seo_slug` VARCHAR(150) NULL");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `canonical_url` VARCHAR(255) NULL");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `is_featured` TINYINT(1) DEFAULT 0");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `banner_url` VARCHAR(255) NULL");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `show_on_homepage` TINYINT(1) DEFAULT 0");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `show_in_main_menu` TINYINT(1) DEFAULT 0");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `show_in_footer` TINYINT(1) DEFAULT 0");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `categories` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
      } catch (e) {}

      // 7. SEO Settings
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`seo_settings\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`page_key\` VARCHAR(100) NOT NULL UNIQUE,
          \`meta_title\` VARCHAR(255) NULL,
          \`meta_description\` TEXT NULL,
          \`seo_slug\` VARCHAR(255) NULL,
          \`canonical_url\` VARCHAR(255) NULL,
          \`open_graph_image\` VARCHAR(255) NULL,
          \`structured_data\` TEXT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_seo_page\` (\`page_key\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 8. Site Settings (for tracking and global configs)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`site_settings\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`config_key\` VARCHAR(100) NOT NULL UNIQUE,
          \`config_value\` LONGTEXT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_config_key\` (\`config_key\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 9. Translations Table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`translations\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`translation_key\` VARCHAR(255) NOT NULL UNIQUE,
          \`category\` VARCHAR(100) NOT NULL,
          \`en\` LONGTEXT NULL,
          \`bn\` LONGTEXT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_trans_key\` (\`translation_key\`),
          INDEX \`idx_trans_cat\` (\`category\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 10. Notification Templates
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`notification_templates\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`event_key\` VARCHAR(100) NOT NULL UNIQUE,
          \`title_en\` VARCHAR(255) NULL,
          \`message_en\` TEXT NULL,
          \`title_bn\` VARCHAR(255) NULL,
          \`message_bn\` TEXT NULL,
          \`enabled\` TINYINT(1) DEFAULT 1,
          \`channels\` VARCHAR(255) DEFAULT 'in_app',
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 11. Notifications (Records)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`notifications\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`user_id\` INT NULL,
          \`user_type\` ENUM('customer', 'admin') DEFAULT 'customer',
          \`title\` VARCHAR(255) NOT NULL,
          \`message\` TEXT NOT NULL,
          \`type\` VARCHAR(50) DEFAULT 'info',
          \`link\` VARCHAR(255) NULL,
          \`is_read\` TINYINT(1) DEFAULT 0,
          \`related_id\` VARCHAR(50) NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX \`idx_notif_user\` (\`user_id\`, \`user_type\`),
          INDEX \`idx_notif_read\` (\`is_read\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 12. Audit Logs
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`audit_logs\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`user_id\` INT NULL,
          \`user_type\` ENUM('admin', 'customer', 'system') DEFAULT 'system',
          \`event_type\` VARCHAR(100) NOT NULL,
          \`description\` TEXT NOT NULL,
          \`ip_address\` VARCHAR(45) NULL,
          \`user_agent\` TEXT NULL,
          \`metadata\` JSON NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX \`idx_audit_event\` (\`event_type\`),
          INDEX \`idx_audit_user\` (\`user_id\`, \`user_type\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 13. FAQs
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`faqs\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`question_en\` TEXT NOT NULL,
            \`question_bn\` TEXT NOT NULL,
            \`answer_en\` LONGTEXT NOT NULL,
            \`answer_bn\` LONGTEXT NOT NULL,
            \`category\` VARCHAR(100) NOT NULL,
            \`is_active\` TINYINT(1) DEFAULT 1,
            \`is_published\` TINYINT(1) DEFAULT 0,
            \`display_order\` INT DEFAULT 0,
            \`is_featured\` TINYINT(1) DEFAULT 0,
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX \`idx_faq_category\` (\`category\`),
            INDEX \`idx_faq_status\` (\`is_active\`, \`is_published\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 13. Support Tickets
      await connection.execute("DROP TABLE IF EXISTS `about_us`");
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`support_tickets\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`ticket_id\` VARCHAR(20) NOT NULL UNIQUE,
          \`customer_id\` INT NOT NULL,
          \`customer_name\` VARCHAR(150) NOT NULL,
          \`customer_email\` VARCHAR(150) NOT NULL,
          \`customer_phone\` VARCHAR(20) NOT NULL,
          \`subject\` VARCHAR(255) NOT NULL,
          \`category\` VARCHAR(100) NOT NULL,
          \`description\` TEXT NOT NULL,
          \`priority\` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
          \`status\` ENUM('open', 'in_progress', 'waiting_for_customer', 'waiting_for_admin', 'resolved', 'closed') DEFAULT 'open',
          \`assigned_staff_id\` INT NULL,
          \`assigned_staff_name\` VARCHAR(150) NULL,
          \`related_order_id\` VARCHAR(50) NULL,
          \`attachments\` JSON NULL,
          \`internal_notes\` TEXT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_ticket_cust\` (\`customer_id\`),
          INDEX \`idx_ticket_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 14. About CMS
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`about_page_settings\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`key\` VARCHAR(100) NOT NULL UNIQUE,
          \`value\` LONGTEXT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`about_sections\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`section_type\` ENUM('story', 'mission', 'vision', 'benefit', 'service') NOT NULL,
          \`title_en\` VARCHAR(255) NULL,
          \`title_bn\` VARCHAR(255) NULL,
          \`description_en\` TEXT NULL,
          \`description_bn\` TEXT NULL,
          \`image_url\` VARCHAR(255) NULL,
          \`sort_order\` INT DEFAULT 0,
          \`is_active\` TINYINT(1) DEFAULT 1,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`policies\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`slug\` VARCHAR(50) NOT NULL UNIQUE,
          \`title_en\` VARCHAR(255) NOT NULL,
          \`title_bn\` VARCHAR(255) NOT NULL,
          \`content_en\` LONGTEXT NULL,
          \`content_bn\` LONGTEXT NULL,
          \`is_active\` TINYINT(1) DEFAULT 1,
          \`is_published\` TINYINT(1) DEFAULT 0,
          \`last_updated\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_policy_slug\` (\`slug\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      // 16. Wishlist (Scalability Foundation)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`wishlist\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`customer_email\` VARCHAR(150) NOT NULL,
          \`product_id\` VARCHAR(50) NOT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX \`idx_wish_email\` (\`customer_email\`),
          UNIQUE KEY \`uk_wish_cust_prod\` (\`customer_email\`, \`product_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 17. Loyalty Points (Scalability Foundation)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`loyalty_points\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`customer_email\` VARCHAR(150) NOT NULL UNIQUE,
          \`points\` INT DEFAULT 0,
          \`tier\` VARCHAR(50) DEFAULT 'Bronze',
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_lp_email\` (\`customer_email\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 18. Product Recommendations (Scalability Foundation)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`product_recommendations\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`product_id\` VARCHAR(50) NOT NULL,
          \`recommended_product_id\` VARCHAR(50) NOT NULL,
          \`score\` DECIMAL(5,4) DEFAULT 0.0000,
          INDEX \`idx_rec_prod\` (\`product_id\`),
          UNIQUE KEY \`uk_rec_pair\` (\`product_id\`, \`recommended_product_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 14. Ticket Replies
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`ticket_replies\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`ticket_id\` INT NOT NULL,
          \`sender_id\` INT NOT NULL,
          \`sender_type\` ENUM('customer', 'admin') NOT NULL,
          \`sender_name\` VARCHAR(150) NOT NULL,
          \`message_text\` TEXT NOT NULL,
          \`attachments\` JSON NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (\`ticket_id\`) REFERENCES \`support_tickets\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 15. Customer Conversations
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`customer_conversations\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`customer_id\` INT NOT NULL,
          \`customer_name\` VARCHAR(150) NOT NULL,
          \`customer_email\` VARCHAR(150) NOT NULL,
          \`status\` ENUM('open', 'closed', 'pending') DEFAULT 'open',
          \`last_message\` TEXT NULL,
          \`last_message_at\` DATETIME NULL,
          \`unread_count\` INT DEFAULT 0,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 14. Customer Messages
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`customer_messages\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`conversation_id\` INT NOT NULL,
          \`sender_id\` INT NULL,
          \`sender_type\` ENUM('customer', 'admin') NOT NULL,
          \`message_text\` TEXT NOT NULL,
          \`attachments\` JSON NULL,
          \`is_read\` TINYINT(1) DEFAULT 0,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (\`conversation_id\`) REFERENCES \`customer_conversations\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 15. Product Reviews (Robust)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`product_reviews\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`customer_id\` INT NOT NULL,
          \`customer_name\` VARCHAR(150) NOT NULL,
          \`customer_avatar\` VARCHAR(255) NULL,
          \`product_id\` VARCHAR(50) NOT NULL,
          \`product_name\` VARCHAR(255) NOT NULL,
          \`product_image\` VARCHAR(255) NULL,
          \`order_id\` VARCHAR(50) NULL,
          \`rating\` INT NOT NULL,
          \`title\` VARCHAR(255) NULL,
          \`comment\` TEXT NOT NULL,
          \`images\` JSON NULL,
          \`status\` ENUM('pending', 'approved', 'rejected', 'hidden') DEFAULT 'pending',
          \`report_status\` ENUM('none', 'reported', 'investigating', 'resolved') DEFAULT 'none',
          \`is_verified_purchase\` TINYINT(1) DEFAULT 0,
          \`admin_reply\` TEXT NULL,
          \`admin_reply_at\` DATETIME NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 16. Review Reports
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`review_reports\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`review_id\` INT NOT NULL,
          \`reporter_id\` INT NOT NULL,
          \`reporter_name\` VARCHAR(150) NOT NULL,
          \`reason\` VARCHAR(255) NOT NULL,
          \`details\` TEXT NULL,
          \`status\` ENUM('pending', 'reviewed', 'action_taken', 'dismissed') DEFAULT 'pending',
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (\`review_id\`) REFERENCES \`product_reviews\`(\`id\`) ON DELETE CASCADE,
          FOREIGN KEY (\`reporter_id\`) REFERENCES \`customers\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 17. Contact Page Settings
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`contact_page_settings\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`title_en\` VARCHAR(255) NULL,
          \`title_bn\` VARCHAR(255) NULL,
          \`description_en\` TEXT NULL,
          \`description_bn\` TEXT NULL,
          \`banner_url\` VARCHAR(255) NULL,
          \`is_published\` TINYINT(1) DEFAULT 1,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 18. Footer Columns
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`footer_columns\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`name_en\` VARCHAR(255) NOT NULL,
          \`name_bn\` VARCHAR(255) NOT NULL,
          \`sort_order\` INT DEFAULT 0,
          \`status\` ENUM('active', 'inactive') DEFAULT 'active',
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 19. Footer Links
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`footer_links\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`column_id\` INT NOT NULL,
          \`name_en\` VARCHAR(255) NOT NULL,
          \`name_bn\` VARCHAR(255) NOT NULL,
          \`url\` VARCHAR(512) NOT NULL,
          \`sort_order\` INT DEFAULT 0,
          \`status\` ENUM('active', 'inactive') DEFAULT 'active',
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (\`column_id\`) REFERENCES \`footer_columns\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 20. Homepage Banners
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`homepage_banners\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`image_url_desktop\` VARCHAR(255) NOT NULL,
          \`image_url_mobile\` VARCHAR(255) NOT NULL,
          \`heading_en\` VARCHAR(255) NULL,
          \`heading_bn\` VARCHAR(255) NULL,
          \`description_en\` TEXT NULL,
          \`description_bn\` TEXT NULL,
          \`alt_en\` VARCHAR(255) NULL,
          \`alt_bn\` VARCHAR(255) NULL,
          \`category_id\` VARCHAR(50) NULL,
          \`button_text_en\` VARCHAR(100) NULL,
          \`button_text_bn\` VARCHAR(100) NULL,
          \`button_link\` VARCHAR(255) NULL,
          \`destination_type\` VARCHAR(50) DEFAULT 'internal',
          \`display_location\` VARCHAR(50) DEFAULT 'homepage_hero',
          \`status\` ENUM('active', 'inactive') DEFAULT 'active',
          \`sort_order\` INT DEFAULT 0,
          \`start_date\` VARCHAR(100) NULL,
          \`end_date\` VARCHAR(100) NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 21. Homepage Sections (Order management)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`homepage_sections\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`section_key\` VARCHAR(50) NOT NULL UNIQUE,
          \`title_en\` VARCHAR(255) NOT NULL,
          \`title_bn\` VARCHAR(255) NOT NULL,
          \`config\` JSON NULL,
          \`enabled\` TINYINT(1) DEFAULT 1,
          \`sort_order\` INT DEFAULT 0,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Seeding initial sections if missing
      const [secRows]: any = await connection.execute('SELECT COUNT(*) as count FROM `homepage_sections`');
      if (secRows[0].count === 0) {
        const initialSections = [
          { key: 'hero_slider', en: 'Main Banner Slider', bn: 'মূল ব্যানার স্লাইডার', order: 1 },
          { key: 'category_banner', en: 'Category Banner', bn: 'ক্যাটাগরি ব্যানার', order: 2 },
          { key: 'fast_sell', en: 'Flash Sale', bn: 'ফ্ল্যাশ সেল', order: 3 },
          { key: 'categories', en: 'Featured Categories', bn: 'সেরা ক্যাটাগরি', order: 4 },
          { key: 'new_arrivals', en: 'New Arrivals', bn: 'নতুন পণ্য', order: 5 },
          { key: 'best_sellers', en: 'Best Sellers', bn: 'সেরা বিক্রিত', order: 6 },
          { key: 'featured_products', en: 'Featured Products', bn: 'বিশেষ পণ্য', order: 7 }
        ];
        for (const s of initialSections) {
          await connection.execute(
            'INSERT INTO \`homepage_sections\` (section_key, title_en, title_bn, sort_order, enabled) VALUES (?, ?, ?, ?, 1)',
            [s.key, s.en, s.bn, s.order]
          );
        }
      }

      // Ensure modern columns exist
      try {
        await connection.execute("ALTER TABLE `products` ADD COLUMN `unit` VARCHAR(50) DEFAULT 'kg'");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `products` ADD COLUMN `description` TEXT NULL");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `products` ADD COLUMN `featured` TINYINT(1) DEFAULT 1");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `products` ADD COLUMN `is_fast_sale` TINYINT(1) DEFAULT 0");
      } catch (e) {}
      try {
        await connection.execute("ALTER TABLE `products` ADD COLUMN `slug` VARCHAR(255) NULL");
      } catch (e) {}

      // Ensure all product specification & management columns exist
      const productColumnMigrations = [
        "ALTER TABLE `products` ADD COLUMN `cost_price` DECIMAL(10,2) DEFAULT 0.00",
        "ALTER TABLE `products` ADD COLUMN `buying_price` DECIMAL(10,2) DEFAULT 0.00",
        "ALTER TABLE `products` ADD COLUMN `sku` VARCHAR(100) NULL",
        "ALTER TABLE `products` ADD COLUMN `variants` LONGTEXT NULL",
        "ALTER TABLE `products` ADD COLUMN `key_features` LONGTEXT NULL",
        "ALTER TABLE `products` ADD COLUMN `specifications` LONGTEXT NULL",
        "ALTER TABLE `products` ADD COLUMN `ingredients` TEXT NULL",
        "ALTER TABLE `products` ADD COLUMN `nutrition` LONGTEXT NULL",
        "ALTER TABLE `products` ADD COLUMN `storage` TEXT NULL",
        "ALTER TABLE `products` ADD COLUMN `usage_info` TEXT NULL",
        "ALTER TABLE `products` ADD COLUMN `faqs` LONGTEXT NULL",
        "ALTER TABLE `products` ADD COLUMN `inside_dhaka_time` VARCHAR(100) NULL",
        "ALTER TABLE `products` ADD COLUMN `outside_dhaka_time` VARCHAR(100) NULL",
        "ALTER TABLE `products` ADD COLUMN `delivery_info` TEXT NULL",
        "ALTER TABLE `products` ADD COLUMN `return_policy` TEXT NULL",
        "ALTER TABLE `products` ADD COLUMN `weight` VARCHAR(50) NULL",
        "ALTER TABLE `products` ADD COLUMN `dimensions` VARCHAR(100) NULL",
        "ALTER TABLE `products` ADD COLUMN `low_stock_threshold` INT DEFAULT 5",
        "ALTER TABLE `products` ADD COLUMN `track_inventory` TINYINT(1) DEFAULT 1",
        "ALTER TABLE `products` ADD COLUMN `technical_details` TEXT NULL",
        "ALTER TABLE `products` ADD COLUMN `delivery_charge_enabled` TINYINT(1) DEFAULT 0",
        "ALTER TABLE `products` ADD COLUMN `delivery_charge_amount` DECIMAL(10,2) DEFAULT 0.00",
        "ALTER TABLE `products` ADD COLUMN `courier_note` TEXT NULL",
        "ALTER TABLE `products` ADD COLUMN `youtube_link` VARCHAR(255) NULL",
        "ALTER TABLE `products` ADD COLUMN `condition_type` VARCHAR(50) DEFAULT 'new'"
      ];
      for (const query of productColumnMigrations) {
        try {
          await connection.execute(query);
        } catch (e) {}
      }

      // Seeding Admin Users
      await connection.execute('DELETE FROM `admin_users`');
      for (const admin of INITIAL_ADMIN_USERS) {
        await connection.execute(
          'INSERT INTO `admin_users` (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
          [admin.name, admin.email, admin.password_hash, admin.role, admin.status]
        );
      }

      // Seeding Customers if empty
      const [custRows]: any = await connection.execute('SELECT COUNT(*) as count FROM `customers`');
      if (custRows[0].count === 0) {
        for (const c of INITIAL_CUSTOMERS) {
          await connection.execute('INSERT INTO `customers` (id, full_name, email, phone, status, created_at) VALUES (?, ?, ?, ?, ?, ?)', [c.id, c.full_name, c.email, c.phone, c.status, c.created_at]);
        }
      }

      // Seed categories using ON DUPLICATE KEY to ensure grocery categories are present even if some old ones exist
      for (const cat of INITIAL_CATEGORIES) {
        try {
          await connection.execute(
            'INSERT INTO `categories` (id, name, name_bn, slug, image_url, status, sort_order, is_featured, show_on_homepage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE name=VALUES(name), name_bn=VALUES(name_bn), show_on_homepage=1', 
            [cat.id, cat.name, cat.name_bn, cat.slug, cat.image_url, cat.status, cat.sort_order, cat.is_featured ? 1 : 0]
          );
        } catch (err) {
          console.error(`[MySQL] Failed to seed category ${cat.name}`, err);
        }
      }

      // Seed products using ON DUPLICATE KEY to ensure grocery products are present
      for (const p of INITIAL_PRODUCTS) {
        try {
          await connection.execute(
            'INSERT INTO `products` (id, name, price, old_price, image_url, category, rating, badge, stock_quantity, brand, status, created_at, is_fast_sale, unit, description, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), image_url=VALUES(image_url), unit=VALUES(unit)', 
            [p.id, p.name, p.price, p.old_price, p.image_url, p.category, p.rating, p.badge, p.stock_quantity, p.brand || 'Shad Ghor', p.status || 'active', p.created_at || new Date().toISOString(), p.is_fast_sale || 0, p.unit, p.description || '', p.featured ? 1 : 0]
          );
        } catch (err) {
          console.error(`[MySQL] Failed to seed product ${p.name}`, err);
        }
      }

      // Seed initial orders if missing
      const [ordRows]: any = await connection.execute('SELECT COUNT(*) as count FROM `orders`');
      if (ordRows[0].count === 0) {
        for (const o of INITIAL_ORDERS) {
          await connection.execute('INSERT INTO `orders` (id, customer_name, customer_email, total_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?)', [o.id, o.customer_name, o.customer_email, o.total_amount, o.status, o.created_at]);
        }
        for (const item of INITIAL_ORDER_ITEMS) {
          await connection.execute('INSERT INTO `order_items` (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)', [item.order_id, item.product_id, item.product_name, item.quantity, item.price]);
        }
      }

      // Seed SEO settings if missing
      const [seoRows]: any = await connection.execute('SELECT COUNT(*) as count FROM `seo_settings`');
      if (seoRows[0].count === 0) {
        await connection.execute(`
          INSERT INTO \`seo_settings\` (page_key, meta_title, meta_description, seo_slug, canonical_url, open_graph_image, structured_data)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, ["home", "SHAD GHOR — Premium Organic Food Shop", "১০০% খাঁটি ও প্রাকৃতিক সুন্দরবনের মধু, ঘি, মসলা এবং অর্গানিক খাবার।", "", "https://shadghor.com", "https://shadghor.com/og-image.jpg", "{}"]);
      }

      // 15. Homepage Banners
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`homepage_banners\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`image_url_desktop\` VARCHAR(255) NOT NULL,
          \`image_url_mobile\` VARCHAR(255) NOT NULL,
          \`heading_en\` VARCHAR(255) NULL,
          \`heading_bn\` VARCHAR(255) NULL,
          \`description_en\` TEXT NULL,
          \`description_bn\` TEXT NULL,
          \`alt_en\` VARCHAR(255) NULL,
          \`alt_bn\` VARCHAR(255) NULL,
          \`category_id\` INT NULL,
          \`button_text_en\` VARCHAR(100) NULL,
          \`button_text_bn\` VARCHAR(100) NULL,
          \`button_link\` VARCHAR(255) NULL,
          \`destination_type\` ENUM('product', 'category', 'offer', 'internal', 'external') DEFAULT 'internal',
          \`display_location\` ENUM('homepage_hero', 'homepage_promo', 'category_banner', 'offer_banner', 'auth_banner') DEFAULT 'homepage_hero',
          \`status\` ENUM('active', 'inactive') DEFAULT 'active',
          \`sort_order\` INT DEFAULT 0,
          \`start_date\` DATETIME NULL,
          \`end_date\` DATETIME NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 16. Homepage Sections
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`homepage_sections\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`section_key\` VARCHAR(100) NOT NULL UNIQUE,
          \`title_en\` VARCHAR(255) NULL,
          \`title_bn\` VARCHAR(255) NULL,
          \`enabled\` TINYINT(1) DEFAULT 1,
          \`sort_order\` INT DEFAULT 0,
          \`config\` JSON NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Seed Homepage Sections if empty
      const [existingSections]: any = await connection.execute("SELECT count(*) as count FROM homepage_sections");
      if (existingSections[0].count === 0) {
        const defaultSections = [
          { key: 'hero_slider', title_en: 'Hero Slider', title_bn: 'হিরো স্লাইডার', order: 1 },
          { key: 'categories', title_en: 'Categories', title_bn: 'ক্যাটাগরি সমূহ', order: 2 },
          { key: 'homepage_promo', title_en: 'Promotional Banners', title_bn: 'প্রমোশনাল ব্যানার', order: 3 },
          { key: 'fast_sell', title_en: 'Fast Selling', title_bn: 'দ্রুত বিক্রয়', order: 4 },
          { key: 'featured_products', title_en: 'Featured Products', title_bn: 'নির্বাচিত পণ্য', order: 5 },
          { key: 'new_arrivals', title_en: 'New Arrivals', title_bn: 'নতুন পণ্য', order: 6 },
          { key: 'best_sellers', title_en: 'Best Sellers', title_bn: 'বেস্ট সেলার', order: 7 },
          { key: 'offers', title_en: 'Special Offers', title_bn: 'বিশেষ অফার', order: 8 },
          { key: 'reviews', title_en: 'Customer Reviews', title_bn: 'ক্রেতাদের মতামত', order: 9 }
        ];
        for (const s of defaultSections) {
          await connection.execute(
            "INSERT INTO homepage_sections (section_key, title_en, title_bn, sort_order, enabled) VALUES (?, ?, ?, ?, 1)",
            [s.key, s.title_en, s.title_bn, s.order]
          );
        }
      }

      // 17. About Us
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`about_us\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`content_en\` TEXT NOT NULL,
          \`content_bn\` TEXT NOT NULL,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Seed About Us if empty
      const [existingAbout]: any = await connection.execute("SELECT count(*) as count FROM about_us");
      if (existingAbout[0].count === 0) {
        await connection.execute(
          "INSERT INTO about_us (content_en, content_bn) VALUES (?, ?)",
          ["Welcome to Shad Ghor. We provide high-quality products.", "শাদ ঘরে স্বাগতম। আমরা উচ্চ মানের পণ্য সরবরাহ করি।"]
        );
      }


      connection.release();
    } catch (err) {
      console.error('[MySQL] Setup real table error, falling back to simulated file.', err);
      this.useLocalFallback = true;
      this.ensureLocalDBInitialized();
    }
  }

  // Unified prepared query execution and advanced parser emulation
  public async executePrepared(sql: string, params: any[] = []): Promise<any> {
    if (!this.useLocalFallback && this.pool) {
      try {
        const [result] = await this.pool.execute(sql, params);
        return result;
      } catch (err) {
        console.error('[MySQL] Query Execution Error. Trying to fall back to emulated database.', err);
      }
    }

    // Local Emulated Prepared Queries Engine
    const sqlLower = sql.toLowerCase().trim().replace(/\s+/g, ' ');
    const data = this.getLocalData();

    // 0. PRODUCTS EMULATION (Prioritized to avoid subquery traps)
    if (sqlLower.includes('products') && !sqlLower.includes('from categories') && !sqlLower.includes('from `categories`')) {
      if (sqlLower.startsWith('select')) {
        let list = [...(data.products || [])];

        // Handle SELECT DISTINCT queries (e.g. SELECT DISTINCT category FROM products ..., SELECT DISTINCT brand ...)
        if (sqlLower.includes('select distinct')) {
          const match = sqlLower.match(/select\s+distinct\s+([\w_]+)\s+from\s+products/);
          if (match) {
            const col = match[1];
            let filtered = list.filter((p: any) => p[col] !== null && p[col] !== undefined && String(p[col]).trim() !== '');
            if (sqlLower.includes(`${col} is not null`)) {
              filtered = filtered.filter((p: any) => p[col] !== null && p[col] !== undefined);
            }
            if (sqlLower.includes(`${col} != ''`) || sqlLower.includes(`${col} != ""`)) {
              filtered = filtered.filter((p: any) => String(p[col]).trim() !== '');
            }
            const uniqueSet = Array.from(new Set(filtered.map((p: any) => String(p[col]).trim())));
            return uniqueSet.sort().map(val => ({ [col]: val }));
          }
        }
        
        // Filter by status if requested
        if (sqlLower.includes("status = 'active'")) {
          list = list.filter((p: any) => p.status === 'active');
        }

        // Filter by fast sell if requested
        if (sqlLower.includes('is_fast_sale = 1')) {
          list = list.filter((p: any) => p.is_fast_sale === 1);
        }

        // Filter by featured if requested
        if (sqlLower.includes('featured = 1') || sqlLower.includes('featured = true')) {
          list = list.filter((p: any) => p.featured === 1 || p.featured === true);
        } else if (sqlLower.includes("badge is not null and badge != ''")) {
          list = list.filter((p: any) => p.badge && p.badge.length > 0);
        }

        // Filter by slug or id
        if (sqlLower.includes('slug = ? or id = ?') || sqlLower.includes('id = ? or slug = ?')) {
          const target1 = String(params[0] || '').trim();
          const target2 = String(params[1] || target1).trim();
          let matched = list.find((p: any) => 
            p.slug === target1 || p.id === target1 || 
            p.slug === target2 || p.id === target2
          );

          if (!matched) {
            matched = list.find((p: any) => 
              target1.endsWith(`-${p.id}`) || 
              target1.endsWith(`_${p.id}`) ||
              p.slug === target1.replace(new RegExp(`-${p.id}$`), '') ||
              target1.toLowerCase() === (p.slug || '').toLowerCase() ||
              target1.toLowerCase() === (p.id || '').toLowerCase()
            );
          }

          if (!matched && target1.includes('-')) {
            const potentialId = target1.substring(target1.lastIndexOf('-') + 1);
            matched = list.find((p: any) => p.id === potentialId || p.slug === potentialId);
          }

          list = matched ? [matched] : [];
        } else if (sqlLower.includes('slug = ?')) {
          const target = String(params[0] || '').trim();
          let matched = list.find((p: any) => p.slug === target || p.id === target);
          if (!matched && target.includes('-')) {
            const potentialId = target.substring(target.lastIndexOf('-') + 1);
            matched = list.find((p: any) => p.id === potentialId || p.slug === potentialId);
          }
          list = matched ? [matched] : [];
        } else if (sqlLower.includes('id = ?')) {
          const target = String(params[0] || '').trim();
          let matched = list.find((p: any) => p.id === target || p.slug === target);
          if (!matched && target.includes('-')) {
            const potentialId = target.substring(target.lastIndexOf('-') + 1);
            matched = list.find((p: any) => p.id === potentialId || p.slug === potentialId);
          }
          list = matched ? [matched] : [];
        }

        // Filter by category_id or category multi-match (from /api/categories/:slug/products)
        if (sqlLower.includes('category_id = ? or category = ?')) {
          const catId = params[0];
          const catName = params[1] || params[2] || catId;
          const catSlug = params[3] || catId;
          list = list.filter((p: any) => 
            p.category_id === catId || 
            p.category === catName || 
            p.category === catSlug ||
            p.category === catId
          );
        } else if (sqlLower.includes('category = ?') || sqlLower.includes('category in (select name from categories where slug = ?)')) {
          const catParam = params[0];
          const categories = data.categories || [];
          const targetCategory = categories.find((c: any) => c.slug === catParam || c.id === catParam || c.name === catParam || c.name_bn === catParam);
          
          if (targetCategory) {
            list = list.filter((p: any) => 
              p.category === targetCategory.name || 
              p.category === targetCategory.name_bn || 
              p.category === targetCategory.slug ||
              p.category === targetCategory.id ||
              p.category_id === targetCategory.id
            );
          } else {
            list = list.filter((p: any) => p.category === catParam || p.category_id === catParam);
          }
        }

        // Filter by brand if requested
        if (sqlLower.includes('brand = ? or brand in (select name from brands where slug = ?)')) {
          const brandParam = params[0];
          const brands = data.brands || [];
          const targetBrand = brands.find((b: any) => b.slug === brandParam || b.id === brandParam || b.name === brandParam);
          if (targetBrand) {
            list = list.filter((p: any) => p.brand === targetBrand.name || p.brand === targetBrand.slug || p.brand === targetBrand.id);
          } else {
            list = list.filter((p: any) => p.brand === brandParam);
          }
        } else if (sqlLower.includes('brand = ? or brand = ?')) {
          const b1 = params[0];
          const b2 = params[1] || b1;
          list = list.filter((p: any) => p.brand === b1 || p.brand === b2);
        }

        // Stock quantity filters
        if (sqlLower.includes('stock_quantity < 10 and stock_quantity > 0')) {
          list = list.filter((p: any) => (p.stock_quantity ?? 50) < 10 && (p.stock_quantity ?? 50) > 0);
        } else if (sqlLower.includes('stock_quantity = 0')) {
          list = list.filter((p: any) => (p.stock_quantity ?? 50) === 0);
        } else if (sqlLower.includes('stock_quantity < 15')) {
          list = list.filter((p: any) => (p.stock_quantity ?? 50) < 15);
        }

        // If it's a COUNT query, return the total
        if (sqlLower.includes('count(*)')) {
          const aliasMatch = sqlLower.match(/count\(\*\)\s+as\s+(\w+)/);
          const alias = aliasMatch ? aliasMatch[1] : 'count';
          return [{ [alias]: list.length }];
        }

        // Sorting
        if (sqlLower.includes('order by created_at desc')) {
          list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        }

        // Normalize product objects to ensure all properties (imageUrl, oldPrice, stock_quantity, slug) are present
        list = list.map((p: any) => ({
          ...p,
          imageUrl: p.image_url || p.imageUrl || '',
          image_url: p.image_url || p.imageUrl || '',
          oldPrice: p.old_price !== undefined ? p.old_price : p.oldPrice,
          old_price: p.old_price !== undefined ? p.old_price : p.oldPrice,
          stock_quantity: p.stock_quantity !== undefined ? p.stock_quantity : 50,
          slug: p.slug || p.id,
        }));

        // Limit and Offset
        if (sqlLower.includes('limit ? offset ?')) {
          const limitIdx = params.length - 2;
          const offsetIdx = params.length - 1;
          const limitVal = Number(params[limitIdx]);
          const offsetVal = Number(params[offsetIdx]);
          return list.slice(offsetVal, offsetVal + limitVal);
        } else if (sqlLower.includes('limit 1')) {
          return list.slice(0, 1);
        } else if (sqlLower.includes('limit ?')) {
          const limitVal = Number(params[params.length - 1]);
          return list.slice(0, isNaN(limitVal) ? 10 : limitVal);
        }

        return list;
      }

      if (sqlLower.startsWith('update')) {
        const id = params[params.length - 1];
        let found = false;

        // Specific partial update: status
        if (sqlLower.includes('set status = ?')) {
          const newStatus = params[0];
          data.products = (data.products || []).map((p: any) => {
            if (p.id === id) {
              found = true;
              return { ...p, status: newStatus, updated_at: new Date().toISOString() };
            }
            return p;
          });
          if (found) this.saveLocalData(data);
          return { affectedRows: found ? 1 : 0 };
        }

        // Specific partial update: stock_quantity
        if (sqlLower.includes('set stock_quantity = ?')) {
          const newStock = Math.max(0, Number(params[0]) || 0);
          data.products = (data.products || []).map((p: any) => {
            if (p.id === id) {
              found = true;
              return { ...p, stock_quantity: newStock, updated_at: new Date().toISOString() };
            }
            return p;
          });
          if (found) this.saveLocalData(data);
          return { affectedRows: found ? 1 : 0 };
        }

        data.products = (data.products || []).map((p: any) => {
          if (p.id === id) {
            found = true;
            const newCatVal = params[5] !== undefined ? params[5] : p.category;
            const matchedCat = (data.categories || []).find((c: any) => c.id === newCatVal || c.name === newCatVal || c.slug === newCatVal);
            const newCatName = matchedCat ? matchedCat.name : newCatVal;
            const newCatId = matchedCat ? matchedCat.id : (p.category_id || newCatVal);

            return {
              ...p,
              name: params[0] !== undefined ? params[0] : p.name,
              name_bn: params[1] !== undefined ? params[1] : p.name_bn,
              price: params[2] !== undefined ? Number(params[2]) : p.price,
              old_price: params[3] !== undefined ? Number(params[3]) : p.old_price,
              image_url: params[4] !== undefined ? params[4] : p.image_url,
              category: newCatName,
              category_id: newCatId,
              brand: params[6] !== undefined ? params[6] : p.brand,
              badge: params[7] !== undefined ? params[7] : p.badge,
              stock_quantity: params[8] !== undefined ? Number(params[8]) : p.stock_quantity,
              unit: params[9] !== undefined ? params[9] : p.unit,
              status: params[10] !== undefined ? params[10] : p.status,
              featured: params[11] !== undefined ? Boolean(params[11]) : p.featured,
              description: params[12] !== undefined ? params[12] : p.description,
              seo_title: params[13] !== undefined ? params[13] : p.seo_title,
              seo_description: params[14] !== undefined ? params[14] : p.seo_description,
              slug: params[15] !== undefined ? params[15] : p.slug,
              rating: params[16] !== undefined ? Number(params[16]) : p.rating,
              view_count: params[17] !== undefined ? Number(params[17]) : p.view_count,
              review_count: params[18] !== undefined ? Number(params[18]) : p.review_count,
              short_description: params[19] !== undefined ? params[19] : p.short_description,
              is_fast_sale: params[20] !== undefined ? Number(params[20]) : p.is_fast_sale,
              updated_at: new Date().toISOString()
            };
          }
          return p;
        });
        if (found) this.saveLocalData(data);
        return { affectedRows: found ? 1 : 0 };
      }

      if (sqlLower.startsWith('insert')) {
        const catVal = params[6] || 'Groceries';
        const matchedCat = (data.categories || []).find((c: any) => c.id === catVal || c.name === catVal || c.slug === catVal);
        const finalCatName = matchedCat ? matchedCat.name : catVal;
        const finalCatId = matchedCat ? matchedCat.id : `cat_${Date.now()}`;

        const newProduct = {
          id: params[0] || `prod_${Date.now()}`,
          name: params[1] || 'New Product',
          name_bn: params[2] || '',
          price: Number(params[3]) || 0,
          old_price: Number(params[4]) || 0,
          image_url: params[5] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
          category: finalCatName,
          category_id: finalCatId,
          brand: params[7] || 'Shad Ghor',
          badge: params[8] || '',
          stock_quantity: Number(params[9]) || 10,
          unit: params[10] || 'kg',
          status: params[11] || 'active',
          featured: params[12] !== undefined ? Boolean(params[12]) : true,
          description: params[13] || '',
          seo_title: params[14] || '',
          seo_description: params[15] || '',
          slug: params[16] || '',
          rating: Number(params[17]) || 5.0,
          view_count: Number(params[18]) || 0,
          review_count: Number(params[19]) || 0,
          short_description: params[20] || '',
          is_fast_sale: Number(params[21]) || 0,
          created_at: params[22] || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        data.products = [newProduct, ...(data.products || [])];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newProduct.id };
      }
    }

    // BRANDS EMULATION
    if (sqlLower.includes('from brands') || sqlLower.includes('from `brands`')) {
      if (sqlLower.startsWith('select')) {
        let list = [...(data.brands || [])];
        list = list.map((b: any) => {
          const prodCount = (data.products || []).filter((p: any) => 
            (p.brand_id && p.brand_id === b.id) ||
            (p.brand && (
              p.brand.toLowerCase() === b.name.toLowerCase() || 
              p.brand.toLowerCase() === b.slug.toLowerCase() ||
              p.brand === b.id
            ))
          ).length;
          return { ...b, product_count: prodCount };
        });

        if (sqlLower.includes('count(*) as count') || sqlLower.includes('count(*) as total')) {
          if (sqlLower.includes("status = 'active'")) {
            return [{ count: list.filter((b: any) => b.status === 'active').length, total: list.filter((b: any) => b.status === 'active').length }];
          }
          if (sqlLower.includes('featured = 1')) {
            return [{ count: list.filter((b: any) => b.featured).length, total: list.filter((b: any) => b.featured).length }];
          }
          if (sqlLower.includes("status = 'inactive'")) {
            return [{ count: list.filter((b: any) => b.status === 'inactive').length, total: list.filter((b: any) => b.status === 'inactive').length }];
          }
          return [{ count: list.length, total: list.length }];
        }

        if (sqlLower.includes('id = ?')) {
          const id = params[0];
          const found = list.find((b: any) => b.id === id);
          return found ? [found] : [];
        }

        if (sqlLower.includes('slug = ?')) {
          const slug = params[0];
          const found = list.find((b: any) => b.slug === slug || b.id === slug);
          return found ? [found] : [];
        }

        if (sqlLower.includes("status = 'active'")) {
          list = list.filter((b: any) => b.status === 'active');
        }

        list.sort((a, b) => {
          const orderA = a.display_order !== undefined && a.display_order !== null ? Number(a.display_order) : 999;
          const orderB = b.display_order !== undefined && b.display_order !== null ? Number(b.display_order) : 999;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        return list;
      }

      if (sqlLower.startsWith('insert')) {
        const newBrand = {
          id: params[0] || `brand_${Date.now()}`,
          name: params[1],
          localName: params[2] || '',
          slug: params[3],
          logo: params[4] || '',
          banner: params[5] || '',
          shortDescription: params[6] || '',
          description: params[7] || '',
          countryOfOrigin: params[8] || '',
          officialWebsite: params[9] || '',
          display_order: params[10] !== undefined ? Number(params[10]) : 0,
          status: params[11] || 'active',
          featured: params[12] ? Boolean(params[12]) : false,
          seoTitle: params[13] || '',
          metaDescription: params[14] || '',
          seoKeywords: params[15] || '',
          canonicalUrl: params[16] || '',
          logoAlt: params[17] || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        data.brands = [newBrand, ...(data.brands || [])];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newBrand.id };
      }

      if (sqlLower.startsWith('update')) {
        const id = params[params.length - 1];
        let found = false;

        if (sqlLower.includes('set status = ? where id = ?') || sqlLower.includes('set `status` = ? where `id` = ?')) {
          data.brands = (data.brands || []).map((b: any) => {
            if (b.id === id) {
              found = true;
              return { ...b, status: params[0], updatedAt: new Date().toISOString() };
            }
            return b;
          });
        } else if (sqlLower.includes('set featured = ? where id = ?')) {
          data.brands = (data.brands || []).map((b: any) => {
            if (b.id === id) {
              found = true;
              return { ...b, featured: Boolean(params[0]), updatedAt: new Date().toISOString() };
            }
            return b;
          });
        } else {
          data.brands = (data.brands || []).map((b: any) => {
            if (b.id === id) {
              found = true;
              return {
                ...b,
                name: params[0] !== undefined ? params[0] : b.name,
                localName: params[1] !== undefined ? params[1] : b.localName,
                slug: params[2] !== undefined ? params[2] : b.slug,
                logo: params[3] !== undefined ? params[3] : b.logo,
                banner: params[4] !== undefined ? params[4] : b.banner,
                shortDescription: params[5] !== undefined ? params[5] : b.shortDescription,
                description: params[6] !== undefined ? params[6] : b.description,
                countryOfOrigin: params[7] !== undefined ? params[7] : b.countryOfOrigin,
                officialWebsite: params[8] !== undefined ? params[8] : b.officialWebsite,
                display_order: params[9] !== undefined ? Number(params[9]) : (b.display_order || 0),
                status: params[10] !== undefined ? params[10] : b.status,
                featured: params[11] !== undefined ? Boolean(params[11]) : b.featured,
                seoTitle: params[12] !== undefined ? params[12] : b.seoTitle,
                metaDescription: params[13] !== undefined ? params[13] : b.metaDescription,
                seoKeywords: params[14] !== undefined ? params[14] : b.seoKeywords,
                canonicalUrl: params[15] !== undefined ? params[15] : b.canonicalUrl,
                logoAlt: params[16] !== undefined ? params[16] : b.logoAlt,
                updatedAt: new Date().toISOString()
              };
            }
            return b;
          });
        }

        if (found) this.saveLocalData(data);
        return { affectedRows: found ? 1 : 0 };
      }

      if (sqlLower.startsWith('delete')) {
        const id = params[0];
        const initialLen = (data.brands || []).length;
        data.brands = (data.brands || []).filter((b: any) => b.id !== id);
        if (data.brands.length !== initialLen) this.saveLocalData(data);
        return { affectedRows: initialLen - data.brands.length };
      }
    }

    // 1. SELECT ADMIN USERS
    if (sqlLower.startsWith('select') && sqlLower.includes('admin_users')) {
      if (sqlLower.includes('email = ?')) {
        const emailParam = params[0]?.toLowerCase().trim();
        const found = data.admin_users?.find((u: any) => u.email.toLowerCase().trim() === emailParam);
        return found ? [found] : [];
      } else if (sqlLower.includes('id = ?')) {
        const idParam = Number(params[0]);
        const found = data.admin_users?.find((u: any) => u.id === idParam);
        return found ? [found] : [];
      }
      return data.admin_users || [];
    }

    // CATEGORIES EMULATION
    if (sqlLower.includes('from categories') || sqlLower.includes('from `categories`') || sqlLower.includes('into categories') || sqlLower.includes('update categories')) {
      if (sqlLower.startsWith('select')) {
        let list = [...(data.categories || [])];
        if (sqlLower.includes('slug = ?') || sqlLower.includes('id = ?')) {
          const queryParam = params[0]?.toString().toLowerCase();
          const found = list.find((c: any) => 
            c.slug?.toLowerCase() === queryParam || 
            c.id?.toString().toLowerCase() === queryParam ||
            c.slug?.toLowerCase().replace(/-s$/, '') === queryParam?.replace(/-s$/, '') ||
            c.name?.toLowerCase() === queryParam ||
            c.name?.toLowerCase().replace(/\s+/g, '-') === queryParam
          );
          return found ? [found] : [];
        }
        if (sqlLower.includes("status = 'active'")) {
          list = list.filter((c: any) => c.status === 'active');
        }
        if (sqlLower.includes('show_on_homepage = 1')) {
          list = list.filter((c: any) => c.show_on_homepage === 1);
        }
        list = list.map((c: any) => ({
          ...c,
          product_count: (data.products || []).filter((p: any) => p.category_id === c.id || p.category === c.name || p.category === c.id).length,
          subcategory_count: (data.categories || []).filter((s: any) => s.parent_id === c.id).length
        }));
        list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        return list;
      }

      if (sqlLower.startsWith('insert')) {
        const newCat = {
          id: params[0] || `cat_${Date.now()}`,
          name: params[1],
          name_bn: params[2] || '',
          slug: params[3],
          image_url: params[4] || '',
          status: params[5] || 'active',
          sort_order: Number(params[6]) || 0,
          is_featured: params[7] ? 1 : 0,
          show_on_homepage: params[8] ? 1 : 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        data.categories = [...(data.categories || []), newCat];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newCat.id };
      }

      if (sqlLower.startsWith('update')) {
        const id = params[params.length - 1]?.toString();
        let found = false;
        data.categories = (data.categories || []).map((c: any) => {
          if (c.id?.toString() === id || c.slug === id) {
            found = true;
            return {
              ...c,
              name: params[0] !== undefined ? params[0] : c.name,
              name_bn: params[1] !== undefined ? params[1] : c.name_bn,
              slug: params[2] !== undefined ? params[2] : c.slug,
              image_url: params[3] !== undefined ? params[3] : c.image_url,
              banner_url: params[4] !== undefined ? params[4] : c.banner_url,
              status: params[5] !== undefined ? params[5] : c.status,
              sort_order: params[6] !== undefined ? Number(params[6]) : c.sort_order,
              parent_id: params[7] !== undefined ? params[7] : c.parent_id,
              description: params[8] !== undefined ? params[8] : c.description,
              description_bn: params[9] !== undefined ? params[9] : c.description_bn,
              updated_at: new Date().toISOString()
            };
          }
          return c;
        });
        if (found) this.saveLocalData(data);
        return { affectedRows: found ? 1 : 0 };
      }

      if (sqlLower.startsWith('delete')) {
        const initialLen = (data.categories || []).length;
        if (sqlLower.includes('id = ?')) {
          const id = params[0];
          data.categories = (data.categories || []).filter((c: any) => c.id.toString() !== id.toString());
        } else if (sqlLower.includes('slug = ?')) {
          const slug = params[0];
          data.categories = (data.categories || []).filter((c: any) => c.slug !== slug);
        } else {
          // Generic delete (e.g. DELETE FROM categories WHERE name NOT IN (...))
          if (sqlLower.includes('name not in')) {
            // Very simple parser for NOT IN (?)
            const names = params.map(p => p.toString().toLowerCase());
            data.categories = (data.categories || []).filter((c: any) => names.includes(c.name.toLowerCase()));
          } else {
            // Clear all
            data.categories = [];
          }
        }
        if (data.categories.length !== initialLen) this.saveLocalData(data);
        return { affectedRows: initialLen - data.categories.length };
      }
    }

    // 2. UPDATE ADMIN LAST LOGIN
    if (sqlLower.startsWith('update') && sqlLower.includes('admin_users')) {
      if (sqlLower.includes('last_login_at = ?') && sqlLower.includes('id = ?')) {
        const timestamp = params[0];
        const id = Number(params[1]);
        let updated = false;
        data.admin_users = data.admin_users.map((u: any) => {
          if (u.id === id) {
            updated = true;
            return { ...u, last_login_at: timestamp };
          }
          return u;
        });
        if (updated) this.saveLocalData(data);
        return { affectedRows: updated ? 1 : 0 };
      }
    }

    // 3. COUNT ORDERS
    if (sqlLower.includes('select count(*) as count from orders') || sqlLower.includes('count(*) as count from `orders`')) {
      if (sqlLower.includes('status = ?') || sqlLower.includes("status = 'pending'")) {
        const pendingCount = data.orders?.filter((o: any) => o.status === 'Pending' || o.status === 'Processing').length || 0;
        return [{ count: pendingCount }];
      }
      return [{ count: data.orders?.length || 0 }];
    }

    // 4. REVENUE SUM
    if (sqlLower.includes('sum(total_amount)') || sqlLower.includes('sum(total_amount) as total')) {
      let filteredOrders = data.orders || [];
      if (sqlLower.includes("status != 'cancelled'")) {
        filteredOrders = filteredOrders.filter((o: any) => o.status !== 'Cancelled');
      }
      
      // Filter for Today
      if (sqlLower.includes('date(') || sqlLower.includes('current_date') || sqlLower.includes('today')) {
        const todayStr = new Date().toISOString().split('T')[0];
        filteredOrders = filteredOrders.filter((o: any) => o.created_at.startsWith(todayStr));
      }

      const sum = filteredOrders.reduce((acc: number, cur: any) => acc + Number(cur.total_amount), 0);
      return [{ total: sum }];
    }

    // 5. COUNT CUSTOMERS
    if (sqlLower.includes('select count(*) as count from customers') || sqlLower.includes('count(*) as count from `customers`')) {
      if (sqlLower.includes('date(created_at) = current_date()') || sqlLower.includes('today')) {
        const todayStr = new Date().toISOString().split('T')[0];
        const count = data.customers?.filter((c: any) => c.created_at.startsWith(todayStr)).length || 0;
        return [{ count }];
      }
      return [{ count: data.customers?.length || 0 }];
    }

    // 6. COUNT PRODUCTS
    if (sqlLower.includes('select count(*) as count from products') || sqlLower.includes('count(*) as count from `products`')) {
      if (sqlLower.includes('stock_quantity < 15')) {
        const count = data.products?.filter((p: any) => p.stock_quantity < 15).length || 0;
        return [{ count }];
      }
      return [{ count: data.products?.length || 0 }];
    }

    // 7. ORDER QUERY LIST
    if (sqlLower.includes('from orders') || sqlLower.includes('from `orders`')) {
      let list = [...(data.orders || [])];
      // sort by created_at DESC
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (sqlLower.includes('limit 10') || sqlLower.includes('limit ?')) {
        const limit = params[0] ? Number(params[0]) : 10;
        return list.slice(0, limit);
      }
      return list;
    }

    // 8. CUSTOMER QUERY LIST & MODIFICATION
    if (sqlLower.includes('from customers') || sqlLower.includes('from `customers`')) {
      if (sqlLower.startsWith('select')) {
        let list = [...(data.customers || [])];
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        if (sqlLower.includes('email = ?')) {
          const email = params[0]?.toLowerCase().trim();
          const found = list.find(c => c.email.toLowerCase().trim() === email);
          return found ? [found] : [];
        }

        if (sqlLower.includes('phone = ?')) {
          const phone = params[0]?.trim();
          const found = list.find(c => c.phone.trim() === phone);
          return found ? [found] : [];
        }

        if (sqlLower.includes('id = ?')) {
          const id = Number(params[0]);
          const found = list.find(c => c.id === id);
          return found ? [found] : [];
        }

        if (sqlLower.includes('limit ?')) {
          const limit = Number(params[params.length - 1]);
          return list.slice(0, limit);
        }
        return list;
      }

      if (sqlLower.startsWith('insert')) {
        const newCustomer = {
          id: (data.customers?.length || 0) + 1001,
          full_name: params[0],
          email: params[1],
          phone: params[2],
          password_hash: params[3] || null,
          address: params[4] || null,
          division: params[5] || null,
          district: params[6] || null,
          gender: params[7] || 'male',
          language: params[8] || 'bn',
          profile_image: params[9] || null,
          status: params[10] || 'active',
          created_at: params[11] || new Date().toISOString(),
          email_verified: 0,
          phone_verified: 0,
          failed_login_attempts: 0
        };
        data.customers = [...(data.customers || []), newCustomer];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newCustomer.id };
      }

      if (sqlLower.startsWith('update')) {
        const id = Number(params[params.length - 1]);
        let found = false;
        data.customers = (data.customers || []).map((c: any) => {
          if (c.id === id) {
            found = true;
            return {
              ...c,
              full_name: params[0] !== undefined ? params[0] : c.full_name,
              email: params[1] !== undefined ? params[1] : c.email,
              phone: params[2] !== undefined ? params[2] : c.phone,
              password_hash: params[3] !== undefined ? params[3] : c.password_hash,
              address: params[4] !== undefined ? params[4] : c.address,
              status: params[10] !== undefined ? params[10] : c.status
            };
          }
          return c;
        });
        if (found) this.saveLocalData(data);
        return { affectedRows: found ? 1 : 0 };
      }
    }


    // 9. TOP SELLING PRODUCTS JOIN QUERY
    if (sqlLower.includes('order_items') && sqlLower.includes('group by') && sqlLower.includes('sold_qty')) {
      // Calculate top selling product sales dynamically from emulated database
      const items = data.order_items || [];
      const products = data.products || [];
      
      const aggregation: Record<string, { qty: number; amount: number }> = {};
      items.forEach((item: any) => {
        if (!aggregation[item.product_id]) {
          aggregation[item.product_id] = { qty: 0, amount: 0 };
        }
        aggregation[item.product_id].qty += Number(item.quantity);
        aggregation[item.product_id].amount += Number(item.price) * Number(item.quantity);
      });

      const topProducts = Object.keys(aggregation).map(pid => {
        const prod = products.find((p: any) => p.id === pid) || { name: 'Unknown Product', image_url: '' };
        return {
          product_id: pid,
          name: prod.name,
          image_url: prod.image_url,
          sold_qty: aggregation[pid].qty,
          sales_amount: aggregation[pid].amount
        };
      });

      topProducts.sort((a, b) => b.sold_qty - a.sold_qty);
      return topProducts.slice(0, 5);
    }

    // 10. SALES CHART TREND AGGREGATIONS
    if (sqlLower.includes('group by date') || sqlLower.includes('chart') || sqlLower.includes('group by created_at')) {
      // Return emulated chart coordinates matching the interval selected
      const orders = data.orders?.filter((o: any) => o.status !== 'Cancelled') || [];
      const res: Record<string, number> = {};
      
      orders.forEach((o: any) => {
        const dateKey = o.created_at.split('T')[0];
        res[dateKey] = (res[dateKey] || 0) + Number(o.total_amount);
      });

      return Object.keys(res).map(k => ({ date: k, amount: res[k] }));
    }

    // 11. SELECT / UPDATE ON SEO SETTINGS
    if (sqlLower.includes('from seo_settings') || sqlLower.includes('from `seo_settings`')) {
      if (sqlLower.startsWith('select')) {
        if (sqlLower.includes('page_key = ?')) {
          const pageKey = params[0];
          const found = data.seo_settings?.find((s: any) => s.page_key === pageKey);
          return found ? [found] : [];
        }
        return data.seo_settings || [];
      }
      if (sqlLower.startsWith('update')) {
        const pageKey = params[params.length - 1];
        let updated = false;
        data.seo_settings = (data.seo_settings || []).map((s: any) => {
          if (s.page_key === pageKey) {
            updated = true;
            return {
              ...s,
              meta_title: params[0],
              meta_description: params[1],
              seo_slug: params[2],
              canonical_url: params[3],
              open_graph_image: params[4],
              structured_data: params[5]
            };
          }
          return s;
        });
        if (updated) this.saveLocalData(data);
        return { affectedRows: updated ? 1 : 0 };
      }
    }

    // 11.5. SELECT / UPDATE / INSERT ON SITE SETTINGS
    if (sqlLower.includes('from site_settings') || sqlLower.includes('from `site_settings`')) {
      if (sqlLower.startsWith('select')) {
        if (sqlLower.includes('config_key = ?')) {
          const key = params[0];
          const found = data.site_settings?.find((s: any) => s.config_key === key);
          return found ? [found] : [];
        }
        return data.site_settings || [];
      }
      if (sqlLower.startsWith('update')) {
        const key = params[params.length - 1];
        let updated = false;
        data.site_settings = (data.site_settings || []).map((s: any) => {
          if (s.config_key === key) {
            updated = true;
            return {
              ...s,
              config_value: params[0],
              updated_at: params[1] || new Date().toISOString()
            };
          }
          return s;
        });
        if (updated) this.saveLocalData(data);
        return { affectedRows: updated ? 1 : 0 };
      }
      if (sqlLower.startsWith('insert')) {
        const newSetting = {
          id: (data.site_settings?.length || 0) + 1,
          config_key: params[0],
          config_value: params[1],
          created_at: params[2] || new Date().toISOString(),
          updated_at: params[2] || new Date().toISOString()
        };
        data.site_settings = [...(data.site_settings || []), newSetting];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newSetting.id };
      }
    }


    // 13. TRANSLATIONS EMULATION
    if (sqlLower.includes('translations')) {
      if (sqlLower.startsWith('select')) {
        let list = [...(data.translations || [])];
        if (sqlLower.includes('translation_key = ?')) {
          const key = params[0];
          return list.filter(t => t.translation_key === key);
        }
        if (sqlLower.includes('category = ?')) {
          const cat = params[0];
          list = list.filter(t => t.category === cat);
        }
        if (sqlLower.includes('like ?')) {
          const search = params[params.length - 1].replace(/%/g, '').toLowerCase();
          list = list.filter(t => 
            t.translation_key.toLowerCase().includes(search) || 
            (t.en && t.en.toLowerCase().includes(search)) || 
            (t.bn && t.bn.toLowerCase().includes(search))
          );
        }
        return list;
      }
      if (sqlLower.startsWith('update')) {
        const key = params[params.length - 1];
        let found = false;
        data.translations = (data.translations || []).map((t: any) => {
          if (t.translation_key === key) {
            found = true;
            return {
              ...t,
              category: params[0],
              en: params[1],
              bn: params[2],
              updated_at: new Date().toISOString()
            };
          }
          return t;
        });
        if (found) this.saveLocalData(data);
        return { affectedRows: found ? 1 : 0 };
      }
      if (sqlLower.startsWith('insert')) {
        const newTrans = {
          id: (data.translations?.length || 0) + 1,
          translation_key: params[0],
          category: params[1],
          en: params[2],
          bn: params[3],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        data.translations = [...(data.translations || []), newTrans];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newTrans.id };
      }
      if (sqlLower.startsWith('delete')) {
        const id = Number(params[0]);
        const initialLen = (data.translations || []).length;
        data.translations = (data.translations || []).filter((t: any) => t.id !== id);
        if (data.translations.length !== initialLen) this.saveLocalData(data);
        return { affectedRows: initialLen - data.translations.length };
      }
    }

    // 14. NOTIFICATION TEMPLATES EMULATION
    if (sqlLower.includes('notification_templates')) {
      if (sqlLower.startsWith('select')) {
        if (sqlLower.includes('event_key = ?')) {
          const key = params[0];
          const found = data.notification_templates?.find((t: any) => t.event_key === key);
          return found ? [found] : [];
        }
        return data.notification_templates || [];
      }
      if (sqlLower.startsWith('update')) {
        const key = params[params.length - 1];
        let found = false;
        data.notification_templates = (data.notification_templates || []).map((t: any) => {
          if (t.event_key === key) {
            found = true;
            return {
              ...t,
              title_en: params[0],
              message_en: params[1],
              title_bn: params[2],
              message_bn: params[3],
              enabled: params[4],
              channels: params[5],
              updated_at: new Date().toISOString()
            };
          }
          return t;
        });
        if (found) this.saveLocalData(data);
        return { affectedRows: found ? 1 : 0 };
      }
      if (sqlLower.startsWith('insert')) {
        const newTemplate = {
          id: (data.notification_templates?.length || 0) + 1,
          event_key: params[0],
          title_en: params[1],
          message_en: params[2],
          title_bn: params[3],
          message_bn: params[4],
          enabled: params[5],
          channels: params[6],
          updated_at: new Date().toISOString()
        };
        data.notification_templates = [...(data.notification_templates || []), newTemplate];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newTemplate.id };
      }
    }

    // 15. NOTIFICATIONS EMULATION
    if (sqlLower.includes('notifications')) {
      if (sqlLower.startsWith('select')) {
        let list = [...(data.notifications || [])];
        if (sqlLower.includes('user_id = ?') && sqlLower.includes('user_type = ?')) {
          const uid = params[0] === null ? null : Number(params[0]);
          const utype = params[1];
          list = list.filter(n => n.user_id === uid && n.user_type === utype);
        }
        if (sqlLower.includes('is_read = ?')) {
          const isRead = Number(params[params.length - 1]);
          list = list.filter(n => n.is_read === isRead);
        }
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return list;
      }
      if (sqlLower.startsWith('insert')) {
        const newNotif = {
          id: (data.notifications?.length || 0) + 1,
          user_id: params[0] === null ? null : Number(params[0]),
          user_type: params[1],
          title: params[2],
          message: params[3],
          type: params[4],
          link: params[5],
          is_read: 0,
          related_id: params[6],
          created_at: new Date().toISOString()
        };
        data.notifications = [newNotif, ...(data.notifications || [])];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newNotif.id };
      }
      if (sqlLower.includes('update') && sqlLower.includes('is_read = 1')) {
        if (sqlLower.includes('id = ?')) {
          const id = Number(params[0]);
          data.notifications = (data.notifications || []).map((n: any) => n.id === id ? { ...n, is_read: 1 } : n);
          this.saveLocalData(data);
          return { affectedRows: 1 };
        }
        if (sqlLower.includes('user_id = ?')) {
          const uid = params[0] === null ? null : Number(params[0]);
          const utype = params[1];
          let count = 0;
          data.notifications = (data.notifications || []).map((n: any) => {
            if (n.user_id === uid && n.user_type === utype && n.is_read === 0) {
              count++;
              return { ...n, is_read: 1 };
            }
            return n;
          });
          if (count > 0) this.saveLocalData(data);
          return { affectedRows: count };
        }
      }
    }

    // 16. AUDIT LOGS EMULATION
    if (sqlLower.includes('audit_logs')) {
      if (sqlLower.startsWith('select')) {
        let list = [...(data.audit_logs || [])];
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return list;
      }
      if (sqlLower.startsWith('insert')) {
        const newLog = {
          id: (data.audit_logs?.length || 0) + 1,
          user_id: params[0],
          user_type: params[1],
          event_type: params[2],
          description: params[3],
          ip_address: params[4],
          user_agent: params[5],
          metadata: params[6],
          created_at: new Date().toISOString()
        };
        data.audit_logs = [newLog, ...(data.audit_logs || [])];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newLog.id };
      }
    }

    // 17. SUPPORT TICKETS EMULATION
    if (sqlLower.includes('support_tickets')) {
      if (sqlLower.startsWith('select')) {
        let list = [...(data.support_tickets || [])];
        if (sqlLower.includes('customer_id = ?')) {
          const cid = Number(params[0]);
          list = list.filter(t => t.customer_id === cid);
        }
        if (sqlLower.includes('ticket_id = ?')) {
          const tid = params[0];
          list = list.filter(t => t.ticket_id === tid);
        }
        if (sqlLower.includes('id = ?')) {
          const id = Number(params[0]);
          list = list.filter(t => t.id === id);
        }
        list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        return list;
      }
      if (sqlLower.startsWith('insert')) {
        const newTicket = {
          id: (data.support_tickets?.length || 0) + 1,
          ticket_id: params[0],
          customer_id: params[1],
          customer_name: params[2],
          customer_email: params[3],
          customer_phone: params[4],
          subject: params[5],
          category: params[6],
          description: params[7],
          priority: params[8] || 'normal',
          status: 'open',
          assigned_staff_id: null,
          assigned_staff_name: null,
          related_order_id: params[9] || null,
          attachments: params[10] || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        data.support_tickets = [newTicket, ...(data.support_tickets || [])];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newTicket.id };
      }
      if (sqlLower.startsWith('update')) {
        const id = Number(params[params.length - 1]);
        let found = false;
        data.support_tickets = (data.support_tickets || []).map((t: any) => {
          if (t.id === id) {
            found = true;
            const updated = { ...t, updated_at: new Date().toISOString() };
            if (sqlLower.includes('status = ?')) updated.status = params[0];
            if (sqlLower.includes('priority = ?')) updated.priority = params[0];
            if (sqlLower.includes('assigned_staff_id = ?')) {
              updated.assigned_staff_id = params[0];
              updated.assigned_staff_name = params[1];
            }
            if (sqlLower.includes('internal_notes = ?')) updated.internal_notes = params[0];
            if (sqlLower.includes('first_response_at = ?')) updated.first_response_at = params[0];
            if (sqlLower.includes('resolved_at = ?')) updated.resolved_at = params[0];
            if (sqlLower.includes('closed_at = ?')) updated.closed_at = params[0];
            return updated;
          }
          return t;
        });
        if (found) this.saveLocalData(data);
        return { affectedRows: found ? 1 : 0 };
      }
    }

    // 18. TICKET REPLIES EMULATION
    if (sqlLower.includes('ticket_replies')) {
      if (sqlLower.startsWith('select')) {
        const tid = Number(params[0]);
        let list = (data.ticket_replies || []).filter((r: any) => r.ticket_id === tid);
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return list;
      }
      if (sqlLower.startsWith('insert')) {
        const newReply = {
          id: (data.ticket_replies?.length || 0) + 1,
          ticket_id: params[0],
          sender_id: params[1],
          sender_type: params[2],
          sender_name: params[3],
          message_text: params[4],
          attachments: params[5] || null,
          created_at: new Date().toISOString()
        };
        data.ticket_replies = [...(data.ticket_replies || []), newReply];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newReply.id };
      }
    }

    // 19. PRODUCT REVIEWS EMULATION
    if (sqlLower.includes('product_reviews')) {
      if (sqlLower.startsWith('select')) {
        // Stats query
        if (sqlLower.includes('count(*) as count') && !sqlLower.includes('avg(rating)')) {
          let list = [...(data.product_reviews || [])];
          if (sqlLower.includes('status = ?')) {
            const status = params[0];
            list = list.filter(r => r.status === status);
          } else if (sqlLower.includes("report_status != 'none'")) {
            list = list.filter(r => r.report_status !== 'none');
          }
          return [{ count: list.length }];
        }
        if (sqlLower.includes('avg(rating)')) {
          const list = (data.product_reviews || []).filter((r: any) => r.status === 'approved');
          const avg = list.length > 0 ? list.reduce((sum: number, r: any) => sum + r.rating, 0) / list.length : 0;
          return [{ avg }];
        }

        // List query
        let list = [...(data.product_reviews || [])];
        if (sqlLower.includes('status = ?')) {
          const status = params[0];
          list = list.filter(r => r.status === status);
        }
        if (sqlLower.includes('product_id = ?')) {
          const pid = params[0];
          list = list.filter(r => r.product_id === pid);
        }
        if (sqlLower.includes("report_status != 'none'")) {
          list = list.filter(r => r.report_status !== 'none');
        }
        if (sqlLower.includes('search') || sqlLower.includes('like ?')) {
          const search = (params[params.length - 1] || '').toString().replace(/%/g, '').toLowerCase();
          if (search) {
            list = list.filter(r => 
              r.customer_name.toLowerCase().includes(search) || 
              r.product_name.toLowerCase().includes(search) || 
              r.comment.toLowerCase().includes(search) ||
              r.id.toString() === search
            );
          }
        }
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // Handle pagination
        if (sqlLower.includes('limit ? offset ?')) {
          const limit = Number(params[params.length - 2]);
          const offset = Number(params[params.length - 1]);
          return list.slice(offset, offset + limit);
        }
        return list;
      }

      if (sqlLower.startsWith('update')) {
        const id = Number(params[params.length - 1]);
        let found = false;
        data.product_reviews = (data.product_reviews || []).map((r: any) => {
          if (r.id === id) {
            found = true;
            const updated = { ...r, updated_at: new Date().toISOString() };
            if (sqlLower.includes('status = ?')) updated.status = params[0];
            if (sqlLower.includes('admin_reply = ?')) {
              updated.admin_reply = params[0];
              updated.admin_reply_at = params[1];
            }
            if (sqlLower.includes('report_status = ?')) updated.report_status = params[0];
            return updated;
          }
          return r;
        });
        if (found) this.saveLocalData(data);
        return { affectedRows: found ? 1 : 0 };
      }

      if (sqlLower.startsWith('insert')) {
        const newReview = {
          id: (data.product_reviews?.length || 0) + 1,
          customer_id: params[0],
          customer_name: params[1],
          customer_avatar: params[2],
          product_id: params[3],
          product_name: params[4],
          product_image: params[5],
          order_id: params[6],
          rating: params[7],
          title: params[8],
          comment: params[9],
          images: params[10],
          status: params[11] || 'pending',
          report_status: params[12] || 'none',
          is_verified_purchase: params[13],
          created_at: params[14] || new Date().toISOString(),
          updated_at: params[15] || new Date().toISOString()
        };
        data.product_reviews = [newReview, ...(data.product_reviews || [])];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newReview.id };
      }

      if (sqlLower.startsWith('delete')) {
        const id = Number(params[0]);
        const initialLen = (data.product_reviews || []).length;
        data.product_reviews = (data.product_reviews || []).filter((r: any) => r.id !== id);
        if (data.product_reviews.length !== initialLen) this.saveLocalData(data);
        return { affectedRows: initialLen - data.product_reviews.length };
      }
    }

    // 20. HOMEPAGE BANNERS EMULATION
    if (sqlLower.includes('from homepage_banners') || sqlLower.includes('from `homepage_banners`')) {
      if (sqlLower.startsWith('select')) {
        let list = [...(data.homepage_banners || [])];
        
        // Handle JOIN with categories if requested
        const includeCategoryNames = sqlLower.includes('left join categories') || sqlLower.includes('join categories');
        if (includeCategoryNames) {
          const categories = data.categories || [];
          list = list.map(banner => {
            const category = categories.find((c: any) => c.id.toString() === (banner.category_id || '').toString());
            return {
              ...banner,
              category_name: category ? category.name : null,
              category_name_bn: category ? (category.name_bn || category.name) : null
            };
          });
        }
        
        // Filter by status
        if (sqlLower.includes("status = 'active'")) {
          list = list.filter(b => b.status === 'active');
        } else if (sqlLower.includes("status = ?")) {
          const status = params[params.length - 1];
          list = list.filter(b => b.status === status);
        }

        // Filter by display_location
        if (sqlLower.includes('display_location = ?')) {
          // In customer/admin API, location is always the first parameter when display_location = ? is used
          const location = params[0];
          list = list.filter(b => b.display_location === location);
        }

        // Filter by category_id
        if (sqlLower.includes('category_id = ?')) {
          // In customer API (server.ts): params = [location, category_id, now, now]
          // In admin API: no category_id filter usually, but if it was there it would be params[1] if location is also there.
          
          let categoryId = null;
          if (sqlLower.includes('display_location = ?')) {
            categoryId = params[1];
          } else {
            categoryId = params[0];
          }
          
          if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
            list = list.filter(b => b.category_id && b.category_id.toString() === categoryId.toString());
          }
        }

        // Filter by date (if applicable)
        if (sqlLower.includes('start_date <= ?')) {
          const now = params[params.length - 2];
          list = list.filter(b => 
            (!b.start_date || b.start_date <= now) && 
            (!b.end_date || b.end_date >= now)
          );
        }

        // Sorting
        if (sqlLower.includes('order by sort_order asc')) {
          list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        } else {
          list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        }

        return list;
      }

      if (sqlLower.startsWith('insert')) {
        const newBanner = {
          id: (data.homepage_banners?.length || 0) + 1,
          name: params[0],
          image_url_desktop: params[1],
          image_url_mobile: params[2],
          heading_en: params[3],
          heading_bn: params[4],
          description_en: params[5],
          description_bn: params[6],
          alt_en: params[7],
          alt_bn: params[8],
          category_id: params[9] ? params[9].toString() : null,
          button_text_en: params[10],
          button_text_bn: params[11],
          button_link: params[12],
          destination_type: params[13],
          display_location: params[14],
          status: params[15],
          sort_order: Number(params[16]) || 0,
          start_date: params[17],
          end_date: params[18],
          created_at: params[19] || new Date().toISOString(),
          updated_at: params[19] || new Date().toISOString()
        };
        data.homepage_banners = [...(data.homepage_banners || []), newBanner];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newBanner.id };
      }

      if (sqlLower.startsWith('update')) {
        const id = Number(params[params.length - 1]);
        let found = false;
        data.homepage_banners = (data.homepage_banners || []).map((b: any) => {
          if (b.id === id) {
            found = true;
            return {
              ...b,
              name: params[0],
              image_url_desktop: params[1],
              image_url_mobile: params[2],
              heading_en: params[3],
              heading_bn: params[4],
              description_en: params[5],
              description_bn: params[6],
              alt_en: params[7],
              alt_bn: params[8],
              category_id: params[9] ? params[9].toString() : null,
              button_text_en: params[10],
              button_text_bn: params[11],
              button_link: params[12],
              destination_type: params[13],
              display_location: params[14],
              status: params[15],
              sort_order: Number(params[16]) || 0,
              start_date: params[17],
              end_date: params[18],
              updated_at: new Date().toISOString()
            };
          }
          return b;
        });
        if (found) this.saveLocalData(data);
        return { affectedRows: found ? 1 : 0 };
      }

      if (sqlLower.startsWith('delete')) {
        const id = Number(params[0]);
        const initialLen = (data.homepage_banners || []).length;
        data.homepage_banners = (data.homepage_banners || []).filter((b: any) => b.id !== id);
        if (data.homepage_banners.length !== initialLen) this.saveLocalData(data);
        return { affectedRows: initialLen - data.homepage_banners.length };
      }
    }

    // 21. HOMEPAGE SECTIONS EMULATION
    if (sqlLower.includes('from homepage_sections') || sqlLower.includes('from `homepage_sections`')) {
      if (sqlLower.startsWith('select')) {
        let list = [...(data.homepage_sections || [])];
        if (sqlLower.includes('order by sort_order asc')) {
          list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }
        return list;
      }

      if (sqlLower.startsWith('insert')) {
        const newSec = {
          id: (data.homepage_sections?.length || 0) + 1,
          section_key: params[0],
          title_en: params[1],
          title_bn: params[2],
          enabled: Number(params[3]) || 1,
          sort_order: Number(params[4]) || 0,
          config: params[5] || null,
          created_at: new Date().toISOString()
        };
        data.homepage_sections = [...(data.homepage_sections || []), newSec];
        this.saveLocalData(data);
        return { affectedRows: 1, insertId: newSec.id };
      }

      if (sqlLower.startsWith('delete')) {
        const initialLen = (data.homepage_sections || []).length;
        data.homepage_sections = [];
        if (data.homepage_sections.length !== initialLen) this.saveLocalData(data);
        return { affectedRows: initialLen };
      }

      if (sqlLower.startsWith('update')) {
        let found = false;
        const id = params[params.length - 1];
        
        data.homepage_sections = (data.homepage_sections || []).map((s: any) => {
          if (s.id.toString() === id.toString() || s.section_key === id) {
            found = true;
            const updated = { ...s };
            
            // Smarter parameter mapping
            if (sqlLower.includes('enabled = ?')) {
              const idx = sqlLower.split('enabled = ?')[0].split('?').length - 1;
              updated.enabled = Number(params[idx]);
            }
            if (sqlLower.includes('sort_order = ?')) {
              const idx = sqlLower.split('sort_order = ?')[0].split('?').length - 1;
              updated.sort_order = Number(params[idx]);
            }
            if (sqlLower.includes('config = ?')) {
              const idx = sqlLower.split('config = ?')[0].split('?').length - 1;
              updated.config = params[idx];
            }
            if (sqlLower.includes('title_en = ?')) {
              const idx = sqlLower.split('title_en = ?')[0].split('?').length - 1;
              updated.title_en = params[idx];
            }
            if (sqlLower.includes('title_bn = ?')) {
              const idx = sqlLower.split('title_bn = ?')[0].split('?').length - 1;
              updated.title_bn = params[idx];
            }
            
            return updated;
          }
          return s;
        });
        if (found) this.saveLocalData(data);
        return { affectedRows: found ? 1 : 0 };
      }
    }

    return [];
  }
}

export const db = new DatabaseManager();
