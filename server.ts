import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import sharp from 'sharp';
import { createServer as createViteServer } from 'vite';

const storage = multer.memoryStorage();
const upload = multer({ storage });
import { db, verifyPassword, hashPassword } from './src/db/mysql';
import { TRANSLATIONS } from './src/utils/translations';
import { successResponse, errorResponse } from './src/utils/apiResponse';
import { NotificationService } from './src/services/notificationService';
import adminProductRoutes from './src/routes/admin/products';
import adminOrderRoutes from './src/routes/admin/orders';
import adminCustomerRoutes from './src/routes/admin/customers';
import adminBannerRoutes from './src/routes/admin/banners';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'shadghor_ultra_secure_secret_2026_key_99';

// Middleware config
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// SEO: Add noindex and nofollow tag headers to administrative route and API access
app.use((req, res, next) => {
  if (req.path.startsWith('/admin') || req.path.startsWith('/api/admin')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

// Server-Side Brute Force Rate Limiting State Store
interface LoginAttempt {
  attempts: number;
  lastAttemptAt: number;
}
const loginRateLimiter = new Map<string, LoginAttempt>();
let SECURITY_CONFIG = {
  admin_login_limit: 5,
  admin_lockout_duration: 30, // minutes
  admin_session_timeout: 120, // minutes
  customer_registration_enabled: true,
  customer_email_verification: true,
  customer_phone_verification: false,
  otp_enabled: true,
  otp_expiry: 5,
  otp_max_attempts: 3,
  otp_resend_cooldown: 60,
  admin_2fa_enabled: false,
  customer_2fa_enabled: false,
  api_rate_limit: 100,
  cors_policy: 'strict',
  password_reset_expiry: 60,
  min_password_length: 8
};

// Seed products if empty on startup
async function ensurePlatonTableExists() {
  try {
    // Create table if not exists (MySQL)
    await db.executePrepared(`
      CREATE TABLE IF NOT EXISTS platon_payment_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        payment_key VARCHAR(50) UNIQUE NOT NULL,
        payment_name VARCHAR(100) NOT NULL,
        logo_url TEXT,
        display_order INT DEFAULT 0,
        is_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `, []);

    const [rows]: any = await db.executePrepared("SELECT COUNT(*) as count FROM platon_payment_methods", []);
    if (rows.count === 0) {
      console.log('[MySQL] Seeding Platon payment methods...');
      const defaultMethods = [
        ['visa', 'VISA', '/payment-logos/visa.svg', 1],
        ['mastercard', 'Mastercard', '/payment-logos/mastercard.svg', 2],
        ['amex', 'American Express', '/payment-logos/amex.svg', 3],
        ['bkash', 'bKash', '/payment-logos/bkash.svg', 4],
        ['nagad', 'Nagad', '/payment-logos/nagad.svg', 5],
        ['rocket', 'Rocket', '/payment-logos/rocket.png', 6]
      ];
      for (const m of defaultMethods) {
        await db.executePrepared(
          "INSERT INTO platon_payment_methods (payment_key, payment_name, logo_url, display_order) VALUES (?, ?, ?, ?)",
          m
        );
      }
    }
  } catch (err) {
    console.error('[MySQL] Platon table initialization error:', err);
  }
}

async function seedDataIfEmpty() {
  try {
    // 1. Categories Seeding
    const cRows = await db.executePrepared("SELECT COUNT(*) as count FROM categories", []);
    if (cRows[0].count <= 3) { // If only initial seed exists, or empty
      console.log('[MySQL] Seeding demo categories...');
      const demoCategories = [
        ['cat_spices', 'Pure Spices', 'খাঁটি মসলা', 'pure-spices', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=300&fit=crop', 'active', 1],
        ['cat_honey_oil', 'Honey & Oil', 'মধু ও তেল', 'honey-oil', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop', 'active', 2],
        ['cat_ghee', 'Ghee', 'ঘি', 'ghee', 'https://images.unsplash.com/photo-1631709497146-a239ef373cf1?w=300&h=300&fit=crop', 'active', 3],
        ['cat_salt', 'Salt', 'লবণ', 'salt', 'https://images.unsplash.com/photo-1615485242227-463270997c45?w=300&h=300&fit=crop', 'active', 4],
        ['cat_nuts_seeds', 'Nuts & Seeds', 'বাদাম ও বীজ', 'nuts-seeds', 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?w=300&h=300&fit=crop', 'active', 5],
        ['cat_dry_foods', 'Dry Foods', 'ড্রাই ফুডস', 'dry-foods', 'https://images.unsplash.com/photo-1628102476629-f813bc616892?w=300&h=300&fit=crop', 'active', 6]
      ];
      for (const c of demoCategories) {
        await db.executePrepared(
          "INSERT INTO categories (id, name, name_bn, slug, image_url, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), name_bn=VALUES(name_bn)",
          c
        );
      }
    }

    // 2. Products Seeding
    const pRows = await db.executePrepared("SELECT COUNT(*) as count FROM products", []);
    if (pRows[0].count <= 2) { // If only initial seed exists
      console.log('[MySQL] Seeding demo products...');
      const products = [
        // PURE SPICES
        ['p_1', 'Premium Turmeric Powder', 180, 200, 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500&h=500&fit=crop', 'Pure Spices', 5.0, 'Pure', 100, 'Shad Ghor', 'active', new Date().toISOString(), 'Premium turmeric powder for natural color and health.', 'প্রিমিয়াম হলুদ গুঁড়ো', '500g', 120, 15, 'premium-turmeric-500g', true],
        ['p_2', 'Red Chili Powder', 220, 250, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&h=500&fit=crop', 'Pure Spices', 4.8, 'Hot', 85, 'Shad Ghor', 'active', new Date().toISOString(), 'Selected red chilies powdered for intense heat and color.', 'লাল মরিচ গুঁড়ো', '500g', 95, 12, 'red-chili-powder-500g', true],
        ['p_3', 'Cumin Powder', 150, 180, 'https://images.unsplash.com/photo-1613554832607-58037a28a382?w=500&h=500&fit=crop', 'Pure Spices', 4.9, 'Aromatic', 120, 'Shad Ghor', 'active', new Date().toISOString(), 'Finely ground cumin seeds for rich aroma.', 'জিরা গুঁড়ো', '250g', 150, 22, 'cumin-powder-250g', true],
        ['p_4', 'Ginger Powder', 120, 140, 'https://images.unsplash.com/photo-1599307734110-d0124195156a?w=500&h=500&fit=crop', 'Pure Spices', 4.7, 'Natural', 50, 'Shad Ghor', 'active', new Date().toISOString(), 'Pure ginger root powder for health and cooking.', 'আদা গুঁড়ো', '200g', 80, 8, 'ginger-powder-200g', true],
        ['p_5', 'Garlic Powder', 130, 150, 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=500&h=500&fit=crop', 'Pure Spices', 4.6, 'Pure', 45, 'Shad Ghor', 'active', new Date().toISOString(), 'Premium garlic powder for instant flavor.', 'রসুন গুঁড়ো', '200g', 75, 10, 'garlic-powder-200g', true],
        ['p_6', 'Bay Leaf', 80, 100, 'https://images.unsplash.com/photo-1609131009311-66774e1d6700?w=500&h=500&fit=crop', 'Pure Spices', 4.5, 'Fresh', 200, 'Shad Ghor', 'active', new Date().toISOString(), 'Selected fresh bay leaves for rich cooking aroma.', 'তেজপাতা', '100g', 60, 5, 'bay-leaf-100g', true],
        ['p_7', 'Black Pepper', 160, 180, 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=500&h=500&fit=crop', 'Pure Spices', 4.9, 'Spicy', 150, 'Shad Ghor', 'active', new Date().toISOString(), 'Aromatic black pepper for intense flavor.', 'গোলমরিচ', '100g', 110, 18, 'black-pepper-100g', true],
        
        // HONEY & OIL
        ['p_8', 'Premium Natural Honey', 450, 500, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&h=500&fit=crop', 'Honey & Oil', 4.9, 'Pure', 100, 'Shad Ghor', 'active', new Date().toISOString(), '100% natural and organic honey from sundarbans.', 'প্রিমিয়াম প্রাকৃতিক মধু', '500g', 250, 45, 'natural-honey-500g', true],
        ['p_9', 'Pure Mustard Oil', 420, 480, 'https://images.unsplash.com/photo-1474979266404-7ea9bcd8203c?w=500&h=500&fit=crop', 'Honey & Oil', 4.8, 'Cold Pressed', 150, 'Shad Ghor', 'active', new Date().toISOString(), 'Traditional cold pressed mustard oil for authentic taste.', 'খাঁটি সরিষার তেল', '1L', 180, 32, 'mustard-oil-1l', true],
        
        // GHEE
        ['p_10', 'Premium Desi Ghee', 850, 950, 'https://images.unsplash.com/photo-1631709497146-a239ef373cf1?w=500&h=500&fit=crop', 'Ghee', 5.0, 'Premium', 80, 'Shad Ghor', 'active', new Date().toISOString(), 'Pure home-made desi ghee with authentic aroma.', 'প্রিমিয়াম দেশি ঘি', '500g', 320, 50, 'desi-ghee-500g', true],
        
        // SALT
        ['p_11', 'Himalayan Pink Salt', 180, 220, 'https://images.unsplash.com/photo-1615485242227-463270997c45?w=500&h=500&fit=crop', 'Salt', 4.8, 'Healthy', 200, 'Shad Ghor', 'active', new Date().toISOString(), 'Natural mineral rich pink salt for better health.', 'হিমালয়ান পিঙ্ক সল্ট', '1kg', 140, 25, 'pink-salt-1kg', true],
        
        // NUTS & SEEDS
        ['p_12', 'Premium Cashew Nuts', 350, 400, 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?w=500&h=500&fit=crop', 'Nuts & Seeds', 4.9, 'Premium', 120, 'Shad Ghor', 'active', new Date().toISOString(), 'High quality roasted cashew nuts.', 'প্রিমিয়াম কাজু বাদাম', '250g', 210, 38, 'cashew-nuts-250g', true],
        ['p_13', 'Almond Nuts', 320, 360, 'https://images.unsplash.com/photo-1508815121300-4b17a3a1d827?w=500&h=500&fit=crop', 'Nuts & Seeds', 4.8, 'Natural', 100, 'Shad Ghor', 'active', new Date().toISOString(), 'Premium quality almonds for healthy snack.', 'কাঠ বাদাম', '250g', 185, 24, 'almonds-250g', true],
        ['p_14', 'Premium Mixed Nuts', 650, 750, 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?w=500&h=500&fit=crop', 'Nuts & Seeds', 5.0, 'Best Mix', 60, 'Shad Ghor', 'active', new Date().toISOString(), 'A perfect mix of various premium nuts.', 'প্রিমিয়াম মিক্সড বাদাম', '500g', 310, 42, 'mixed-nuts-500g', true],
        
        // DRY FOODS
        ['p_15', 'Premium Dry Food Mix', 550, 600, 'https://images.unsplash.com/photo-1628102476629-f813bc616892?w=500&h=500&fit=crop', 'Dry Foods', 4.7, 'Healthy', 90, 'Shad Ghor', 'active', new Date().toISOString(), 'Healthy mix of dry fruits and seeds.', 'প্রিমিয়াম ড্রাই ফুড মিক্স', '500g', 245, 28, 'dry-food-mix-500g', true],
        ['p_16', 'Premium Dates', 400, 450, 'https://images.unsplash.com/photo-1596701062351-8a29e4d3f5f4?w=500&h=500&fit=crop', 'Dry Foods', 4.9, 'Pure', 110, 'Shad Ghor', 'active', new Date().toISOString(), 'Premium quality dates for energy and health.', 'প্রিমিয়াম খেজুর', '500g', 200, 35, 'premium-dates-500g', true],
      ];
      for (const p of products) {
        await db.executePrepared(
          "INSERT INTO products (id, name, price, old_price, image_url, category, rating, badge, stock_quantity, brand, status, created_at, description, short_description, unit, view_count, review_count, slug, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          p
        );
      }
    }

    // 3. Category Banners Seeding
    const bRows = await db.executePrepared("SELECT COUNT(*) as count FROM homepage_banners WHERE display_location = 'category_banner'", []);
    if (bRows[0].count <= 3) {
      console.log('[MySQL] Seeding category banners...');
      const categoryBanners = [
        ['Spices Banner', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&h=400&fit=crop', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=400&fit=crop', 'Fresh Spices', 'তাজা মসলা', 'Pure and aromatic', 'খাঁটি ও সুগন্ধি', 'Shop Now', 'কিনুন', '#/category/pure-spices', 'category_banner', 'active', 1, 'cat_spices'],
        ['Honey Oil Banner', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1200&h=400&fit=crop', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=400&fit=crop', 'Natural Honey', 'প্রাকৃতিক মধু', 'Pure Sundarban Honey', 'সুন্দরবনের খাঁটি মধু', 'Shop Now', 'কিনুন', '#/category/honey-oil', 'category_banner', 'active', 2, 'cat_honey_oil'],
        ['Ghee Banner', 'https://images.unsplash.com/photo-1631709497146-a239ef373cf1?w=1200&h=400&fit=crop', 'https://images.unsplash.com/photo-1631709497146-a239ef373cf1?w=600&h=400&fit=crop', 'Premium Ghee', 'প্রিমিয়াম ঘি', 'Traditional Desi Ghee', 'ঐতিহ্যবাহী দেশি ঘি', 'Shop Now', 'কিনুন', '#/category/ghee', 'category_banner', 'active', 3, 'cat_ghee'],
        ['Salt Banner', 'https://images.unsplash.com/photo-1615485242227-463270997c45?w=1200&h=400&fit=crop', 'https://images.unsplash.com/photo-1615485242227-463270997c45?w=600&h=400&fit=crop', 'Pink Salt', 'পিঙ্ক সল্ট', 'Himalayan Pink Salt', 'হিমালয়ান পিঙ্ক সল্ট', 'Shop Now', 'কিনুন', '#/category/salt', 'category_banner', 'active', 4, 'cat_salt'],
        ['Nuts Banner', 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?w=1200&h=400&fit=crop', 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?w=600&h=400&fit=crop', 'Healthy Nuts', 'স্বাস্থ্যকর বাদাম', 'Premium Cashew & Almond', 'কাজু ও কাঠ বাদাম', 'Shop Now', 'কিনুন', '#/category/nuts-seeds', 'category_banner', 'active', 5, 'cat_nuts_seeds'],
        ['Dry Foods Banner', 'https://images.unsplash.com/photo-1628102476629-f813bc616892?w=1200&h=400&fit=crop', 'https://images.unsplash.com/photo-1628102476629-f813bc616892?w=600&h=400&fit=crop', 'Dry Foods', 'ড্রাই ফুডস', 'Dates and Mixes', 'খেজুর এবং মিক্স', 'Shop Now', 'কিনুন', '#/category/dry-foods', 'category_banner', 'active', 6, 'cat_dry_foods']
      ];
      for (const b of categoryBanners) {
        await db.executePrepared(
          `INSERT INTO homepage_banners (name, image_url_desktop, image_url_mobile, heading_en, heading_bn, description_en, description_bn, button_text_en, button_text_bn, button_link, display_location, status, sort_order, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          b
        );
      }
    }

    // 4. Homepage Sections Seeding
    const sRows = await db.executePrepared("SELECT COUNT(*) as count FROM homepage_sections", []);
    if (sRows[0].count === 0) {
      console.log('[MySQL] Seeding homepage sections...');
      const defaultSections = [
        ['hero_slider', 'Hero Slider', 'হিরো স্লাইডার', 1, 1],
        ['category_banner', 'Category Banners', 'ক্যাটাগরি ব্যানার', 2, 1],
        ['categories', 'Categories', 'ক্যাটাগরি সমূহ', 3, 1],
        ['featured_products', 'Featured Products', 'নির্বাচিত পণ্য', 4, 1],
        ['new_arrivals', 'New Arrivals', 'নতুন পণ্য', 5, 1],
        ['best_sellers', 'Best Sellers', 'বেস্ট সেলার', 6, 1],
        ['category_products', 'Category Wise Products', 'ক্যাটাগরি ভিত্তিক পণ্য', 7, 1]
      ];
      for (const s of defaultSections) {
        await db.executePrepared(
          "INSERT INTO homepage_sections (section_key, title_en, title_bn, sort_order, enabled) VALUES (?, ?, ?, ?, ?)",
          s
        );
      }
    }

    // 5. Initial Banners (Hero & Auth)
    const heroRows = await db.executePrepared("SELECT COUNT(*) as count FROM homepage_banners WHERE display_location = 'homepage_hero'", []);
    if (heroRows[0].count === 0) {
      await db.executePrepared(
        `INSERT INTO homepage_banners (name, image_url_desktop, image_url_mobile, heading_en, heading_bn, description_en, description_bn, button_text_en, button_text_bn, button_link, display_location, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Main Hero Banner', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1920&h=700&fit=crop', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1080&h=1350&fit=crop', 'Quality Organic Food', 'গুনগত মানের অর্গানিক পণ্য', 'Pure and fresh from nature', 'প্রকৃতি থেকে আসা বিশুদ্ধ ও সতেজ', 'Explore Now', 'এখনই দেখুন', '/shop', 'homepage_hero', 'active', 1]
      );
    }

  } catch (err) {
    console.error('[MySQL] Seeding error:', err);
  }
}

// Ensure products are seeded after db setup
async function robustSeed() {
  let retries = 5;
  while (retries > 0) {
    try {
      await ensurePlatonTableExists();
      await seedDataIfEmpty();
      console.log('[MySQL] Seeding complete.');
      return;
    } catch (e) {
      console.warn(`[MySQL] Seeding failed, retrying... (${retries} left)`);
      retries--;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}
setTimeout(robustSeed, 2000);

// Sync Security Config from DB on startup and after updates
async function syncSecurityConfig() {
  try {
    const keys = Object.keys(SECURITY_CONFIG);
    for (const key of keys) {
      const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
      if (rows.length > 0) {
        const val = rows[0].config_value;
        if (val === 'true') (SECURITY_CONFIG as any)[key] = true;
        else if (val === 'false') (SECURITY_CONFIG as any)[key] = false;
        else if (!isNaN(Number(val))) (SECURITY_CONFIG as any)[key] = Number(val);
        else (SECURITY_CONFIG as any)[key] = val;
      }
    }
  } catch (err) {
    console.error('[Security Sync Error] ', err);
  }
}

function checkLoginRateLimit(ip: string): { blocked: boolean; remainingMs: number } {
  const record = loginRateLimiter.get(ip);
  if (!record) return { blocked: false, remainingMs: 0 };

  const now = Date.now();
  const lockoutMs = SECURITY_CONFIG.admin_lockout_duration * 60 * 1000;
  
  if (record.attempts >= SECURITY_CONFIG.admin_login_limit) {
    const elapsed = now - record.lastAttemptAt;
    if (elapsed < lockoutMs) {
      return { blocked: true, remainingMs: lockoutMs - elapsed };
    } else {
      loginRateLimiter.delete(ip);
    }
  }
  return { blocked: false, remainingMs: 0 };
}

function recordLoginAttempt(ip: string, success: boolean) {
  if (success) {
    loginRateLimiter.delete(ip);
    return;
  }

  const record = loginRateLimiter.get(ip);
  const now = Date.now();
  if (record) {
    record.attempts += 1;
    record.lastAttemptAt = now;
  } else {
    loginRateLimiter.set(ip, { attempts: 1, lastAttemptAt: now });
  }
}

// Admin Authentication Middleware with Bearer Token + HttpOnly Cookie fallback detection
interface AuthenticatedRequest extends express.Request {
  admin?: {
    id: number;
    name: string;
    email: string;
    role: string;
    role_id: number;
  };
}

const requireAdminAuth = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  let token = req.cookies.admin_session;
  
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    res.status(401).json({ error: 'Admin access required.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Validate database record still exists and is active using prepared query on admin_users table
    const rows = await db.executePrepared(
      "SELECT id, name, email, role, role_id, status FROM admin_users WHERE id = ? AND status = 'active' LIMIT 1",
      [decoded.id]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({ error: 'Admin access required.' });
      return;
    }

    req.admin = {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      role: rows[0].role,
      role_id: rows[0].role_id
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Admin access required.' });
  }
};

const requireCustomerAuth = async (
  req: any,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'customer') return res.status(401).json({ error: 'Unauthorized' });

    const rows = await db.executePrepared("SELECT id, full_name, email, phone FROM customers WHERE id = ? LIMIT 1", [decoded.id]);
    if (rows.length === 0) return res.status(401).json({ error: 'Unauthorized' });

    req.customer = rows[0];
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const checkPermission = (resource: string, action: string) => {
  return async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });
    
    // Super Admin and Admin roles have full system permissions
    if (
      req.admin.role === 'Super Admin' || 
      req.admin.role_id === 1 || 
      req.admin.role?.toLowerCase() === 'admin' || 
      req.admin.role_id === 2
    ) return next();

    try {
      const perms = await db.executePrepared(`
        SELECT p.resource, p.action 
        FROM role_permissions rp
        JOIN admin_permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `, [req.admin.role_id]);

      const hasPerm = perms.some((p: any) => p.resource === resource && p.action === action);
      if (!hasPerm) {
        return res.status(403).json({ error: `Forbidden: Missing permission ${action} on ${resource}` });
      }
      next();
    } catch (err) {
      console.error('[Permission Check Error] ', err);
      res.status(500).json({ error: 'Internal security validation failed.' });
    }
  };
};

const NotificationSystem = {
  trigger: async (event: string, data: any) => {
    console.log(`[Notification Triggered] Event: ${event}`, data);
  }
};

async function logAdminAction(admin: any, action: string, resource: string, resourceId?: string, details?: any) {
  try {
    await db.executePrepared(
      "INSERT INTO admin_audit_logs (admin_id, admin_name, action, resource, resource_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [admin.id, admin.name, action, resource, resourceId || null, details ? JSON.stringify(details) : null, new Date().toISOString()]
    );
  } catch (err) {
    console.error('[Audit Log Error] ', err);
  }
}

// ----------------- API ROUTES -----------------

// CUSTOMER: GET Contact Page
// MODULAR ROUTES
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/admin/banners', adminBannerRoutes);

app.get('/api/contact', async (req, res) => {
  try {
    const [settings] = await db.executePrepared("SELECT * FROM contact_page_settings WHERE is_published = 1 LIMIT 1", []);
    res.json(settings || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contact page.' });
  }
});

// CUSTOMER: POST Contact Form Submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message, customer_id, related_order_id } = req.body;
    
    // Validation
    if (!name || !email || !message) return res.status(400).json({ error: 'Missing required fields.' });
    
    // Insert into support_tickets (existing system)
    const ticketId = `T-${Date.now()}`;
    await db.executePrepared(
      "INSERT INTO support_tickets (ticket_id, customer_id, customer_name, customer_email, customer_phone, subject, category, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)",
      [ticketId, customer_id || 0, name, email, phone, subject, 'general', message, new Date(), new Date()]
    );
    
    res.json({ success: true, ticket_id: ticketId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit contact message.' });
  }
});

// ADMIN: GET About Page Configuration
app.get('/api/admin/about', requireAdminAuth, async (req, res) => {
  try {
    const settings = await db.executePrepared("SELECT * FROM about_page_settings", []);
    const sections = await db.executePrepared("SELECT * FROM about_sections ORDER BY sort_order ASC", []);
    res.json({ settings, sections });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch about page config.' });
  }
});

// ADMIN: GET Contact Page Settings
app.get('/api/admin/contact-settings', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM contact_page_settings LIMIT 1", []);
    res.json(rows.length > 0 ? rows[0] : null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contact settings.' });
  }
});

// ADMIN: POST Update Contact Page Settings
app.post('/api/admin/contact-settings', requireAdminAuth, async (req: any, res) => {
  try {
    const { title_en, title_bn, description_en, description_bn, banner_url, is_published } = req.body;
    await db.executePrepared(
      "INSERT INTO contact_page_settings (id, title_en, title_bn, description_en, description_bn, banner_url, is_published) VALUES (1, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title_en = ?, title_bn = ?, description_en = ?, description_bn = ?, banner_url = ?, is_published = ?",
      [title_en, title_bn, description_en, description_bn, banner_url, is_published, title_en, title_bn, description_en, description_bn, banner_url, is_published]
    );
    await logAdminAction(req.admin, 'UPDATE', 'ContactSettings', '1', { title_en });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update contact settings.' });
  }
});

app.post('/api/admin/about/settings', requireAdminAuth, async (req: any, res) => {
  try {
    const { key, value } = req.body;
    await db.executePrepared("INSERT INTO about_page_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?", [key, value, value]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update about settings.' });
  }
});

app.post('/api/admin/about/section', requireAdminAuth, async (req: any, res) => {
  try {
    const { id, section_type, title_en, title_bn, description_en, description_bn, image_url, sort_order, is_active } = req.body;
    if (id) {
        await db.executePrepared("UPDATE about_sections SET title_en = ?, title_bn = ?, description_en = ?, description_bn = ?, image_url = ?, sort_order = ?, is_active = ? WHERE id = ?", 
            [title_en, title_bn, description_en, description_bn, image_url, sort_order, is_active, id]);
    } else {
        await db.executePrepared("INSERT INTO about_sections (section_type, title_en, title_bn, description_en, description_bn, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
            [section_type, title_en, title_bn, description_en, description_bn, image_url, sort_order, is_active]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update about section.' });
  }
});


// ADMIN: GET Policies
app.get('/api/admin/policies', requireAdminAuth, async (req, res) => {
  try {
    const policies = await db.executePrepared("SELECT * FROM policies", []);
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch policies.' });
  }
});

// ADMIN: POST Update Policy
app.post('/api/admin/policies/:slug', requireAdminAuth, async (req: any, res) => {
  try {
    const { slug } = req.params;
    const { title_en, title_bn, content_en, content_bn, is_active, is_published } = req.body;
    
    await db.executePrepared(
      `INSERT INTO policies (slug, title_en, title_bn, content_en, content_bn, is_active, is_published) 
       VALUES (?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       title_en = ?, title_bn = ?, content_en = ?, content_bn = ?, is_active = ?, is_published = ?`,
      [slug, title_en, title_bn, content_en, content_bn, is_active, is_published,
       title_en, title_bn, content_en, content_bn, is_active, is_published]
    );
    await logAdminAction(req.admin, 'UPDATE', 'Policy', slug, { title_en });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update policy.' });
  }
});

// CUSTOMER: GET Policy by slug
app.get('/api/policies/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const rows = await db.executePrepared("SELECT * FROM policies WHERE slug = ? AND is_active = 1 AND is_published = 1 LIMIT 1", [slug]);
    res.json(rows.length > 0 ? rows[0] : null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch policy.' });
  }
});

// ADMIN: GET FAQs
app.get('/api/admin/faqs', requireAdminAuth, async (req, res) => {
  try {
    const faqs = await db.executePrepared("SELECT * FROM faqs ORDER BY display_order ASC, created_at DESC", []);
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch FAQs.' });
  }
});

// ADMIN: GET Comprehensive Sales Report
app.get('/api/admin/reports/sales', requireAdminAuth, async (req: any, res) => {
  try {
    const { start, end, status } = req.query;
    
    // Construct base WHERE clause
    let whereClause = "WHERE created_at BETWEEN ? AND ?";
    const params = [start, end];

    if (status) {
        whereClause += " AND status = ?";
        params.push(status);
    }

    // Query for total sales, orders, and average value
    const statsResult: any = await db.executePrepared(`
      SELECT 
        COUNT(id) as totalOrders,
        SUM(total_amount) as totalSales,
        AVG(total_amount) as avgOrderValue
      FROM orders 
      ${whereClause}`, params);
    const stats = statsResult[0] || { totalOrders: 0, totalSales: 0, avgOrderValue: 0 };
    
    // Query for orders breakdown by status
    const statuses: any = await db.executePrepared(`
      SELECT status, COUNT(*) as count
      FROM orders
      ${whereClause}
      GROUP BY status`, params);

    res.json({ 
        stats,
        statuses
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comprehensive sales report.' });
  }
});

// ADMIN: GET Order Report
app.get('/api/admin/reports/orders', requireAdminAuth, async (req: any, res) => {
  try {
    const { start, end, status, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereClause = "WHERE created_at BETWEEN ? AND ?";
    const params: any[] = [start, end];

    if (status) {
        whereClause += " AND status = ?";
        params.push(status);
    }
    if (search) {
        whereClause += " AND (id LIKE ? OR customer_name LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }

    const orders = await db.executePrepared(`
      SELECT id, customer_name, total_amount, status, created_at
      FROM orders 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`, [...params, Number(limit), offset]);
    
    const countRows: any = await db.executePrepared(`
      SELECT COUNT(*) as total FROM orders ${whereClause}`, params);
    const total = countRows[0]?.total || 0;
    
    res.json({ orders, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order report.' });
  }
});

// ADMIN: GET Product Report
app.get('/api/admin/reports/products', requireAdminAuth, async (req: any, res) => {
  try {
    const { start, end, category, brand, stockStatus, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    // Aggregation query for overview stats
    const statsQuery = `
      SELECT 
        COUNT(id) as totalProducts,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeProducts,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactiveProducts,
        SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END) as outOfStock,
        SUM(CASE WHEN stock > 0 AND stock <= low_stock_threshold THEN 1 ELSE 0 END) as lowStock
      FROM products`;
    const statsRows: any = await db.executePrepared(statsQuery, []);
    const stats = statsRows[0] || {};

    // Product performance query
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    if (search) {
      whereClause += " AND (name LIKE ? OR sku LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const products = await db.executePrepared(`
      SELECT p.id, p.name, p.image, p.sku, p.selling_price, p.cost_price, p.stock,
             c.name as category_name, b.name as brand_name,
             (SELECT SUM(oi.quantity) FROM order_items oi JOIN orders o ON oi.order_id = o.id ${start ? "WHERE o.created_at BETWEEN ? AND ?" : ""} AND oi.product_id = p.id) as unitsSold
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereClause}
      LIMIT ? OFFSET ?`, [...(start ? [start, end] : []), ...params, Number(limit), offset]);

    res.json({ stats, products });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product report.' });
  }
});

// ADMIN: GET Delivery Report
app.get('/api/admin/reports/delivery', requireAdminAuth, async (req: any, res) => {
  try {
    const { start, end, search, status, courier, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    // Overview stats
    const statsQuery = `
      SELECT 
        COUNT(id) as totalDeliveries,
        SUM(CASE WHEN delivery_status = 'pending' THEN 1 ELSE 0 END) as pendingDeliveries,
        SUM(CASE WHEN delivery_status = 'processing' THEN 1 ELSE 0 END) as processingDeliveries,
        SUM(CASE WHEN delivery_status = 'shipped' THEN 1 ELSE 0 END) as shippedDeliveries,
        SUM(CASE WHEN delivery_status = 'out_for_delivery' THEN 1 ELSE 0 END) as outForDelivery,
        SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) as deliveredDeliveries,
        SUM(CASE WHEN delivery_status = 'failed' THEN 1 ELSE 0 END) as failedDeliveries,
        SUM(CASE WHEN delivery_status = 'cancelled' THEN 1 ELSE 0 END) as cancelledDeliveries,
        SUM(CASE WHEN delivery_status = 'returned' THEN 1 ELSE 0 END) as returnedDeliveries
      FROM orders`;
    const statsRows: any = await db.executePrepared(statsQuery, []);
    const stats = statsRows[0] || {};

    // Transaction list
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    if (search) {
      whereClause += " AND (id LIKE ? OR customer_id IN (SELECT id FROM customers WHERE full_name LIKE ? OR phone LIKE ?))";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      whereClause += " AND delivery_status = ?";
      params.push(status);
    }
    
    const deliveries = await db.executePrepared(`
      SELECT o.id, o.customer_id, o.delivery_status, o.tracking_number, o.created_at, 
             c.full_name as customerName, c.phone as customerPhone, o.shipping_address as address
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?`, [...params, Number(limit), offset]);

    res.json({ stats: stats[0], deliveries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch delivery report.' });
  }
});

// ADMIN: GET Reports Overview
app.get('/api/admin/reports/overview', requireAdminAuth, async (req: any, res) => {
  try {
    // This is a simplified overview query. In production, this would be more complex.
    const overview = await db.executePrepared(`
      SELECT 
        (SELECT COUNT(*) FROM orders) as totalOrders,
        (SELECT COUNT(*) FROM customers) as totalCustomers,
        (SELECT COUNT(*) FROM products) as totalProducts,
        (SELECT SUM(total_amount) FROM orders WHERE payment_status = 'successful') as totalPayments,
        (SELECT SUM(total_amount - total_cost) FROM orders WHERE payment_status = 'successful') as totalProfit,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pendingOrders,
        (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completedOrders,
        (SELECT COUNT(*) FROM products WHERE stock_quantity < 10 AND stock_quantity > 0) as lowStockProducts,
        (SELECT COUNT(*) FROM products WHERE stock_quantity = 0) as outOfStockProducts
    `, []);

    res.json(overview[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports overview.' });
  }
});

// CUSTOMER: GET Public Settings for Checkout
app.get('/api/checkout/settings', async (req, res) => {
  try {
    const keys = [
      'store_phone', 'store_whatsapp',
      'payment_bkash_number', 'payment_nagad_number', 'payment_rocket_number',
      'delivery_charge_inside_dhaka', 'delivery_charge_outside_dhaka'
    ];
    
    const rows = await db.executePrepared(
      "SELECT config_key, config_value FROM site_settings WHERE config_key IN (" + keys.map(() => "?").join(",") + ")",
      keys
    );
    
    const settings: Record<string, string> = {};
    rows.forEach((row: any) => {
      settings[row.config_key] = row.config_value;
    });
    
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch checkout settings.' });
  }
});

// ----------------- FOOTER MANAGEMENT API -----------------

// CUSTOMER: GET Footer Configuration
app.get('/api/footer/config', async (req, res) => {
  try {
    const keys = [
      'footer_logo_url', 'footer_company_name_en', 'footer_company_name_bn', 
      'footer_description_en', 'footer_description_bn',
      'footer_tagline_en', 'footer_tagline_bn',
      'footer_contact_phone', 'footer_contact_email', 'footer_contact_address_en', 'footer_contact_address_bn',
      'footer_social_facebook', 'footer_social_twitter', 'footer_social_instagram', 'footer_social_youtube', 'footer_social_linkedin', 'footer_social_tiktok',
      'footer_app_store_url', 'footer_play_store_url', 
      'footer_app_download_title_en', 'footer_app_download_title_bn',
      'footer_payment_methods_json', 'footer_payment_methods_title_en', 'footer_payment_methods_title_bn',
      'platon_logo_visa', 'platon_logo_mastercard', 'platon_logo_amex', 'platon_logo_bkash', 'platon_logo_nagad', 'platon_logo_rocket',
      'footer_copyright_en', 'footer_copyright_bn',
      'footer_follow_us_title_en', 'footer_follow_us_title_bn',
      'store_address', 'store_area', 'store_city', 'store_district', 'store_country', 'store_post_code', 'maps_url', 'store_phone', 'store_email'
    ];
    
    const settingsRows = await db.executePrepared(
      "SELECT config_key, config_value FROM site_settings WHERE config_key IN (" + keys.map(() => "?").join(",") + ")",
      keys
    );
    
    const settings: Record<string, string> = {};
    settingsRows.forEach((row: any) => {
      settings[row.config_key] = row.config_value;
    });

    const columns = await db.executePrepared(
      "SELECT * FROM footer_columns WHERE status = 'active' ORDER BY sort_order ASC",
      []
    );

    const links = await db.executePrepared(
      "SELECT * FROM footer_links WHERE status = 'active' ORDER BY sort_order ASC",
      []
    );

    res.json({
      settings,
      columns,
      links
    });
  } catch (err) {
    console.error('[Get Footer Config Error] ', err);
    res.status(500).json({ error: 'Failed to fetch footer configuration.' });
  }
});

// ADMIN: GET Full Footer Management Data
app.get('/api/admin/footer/all', requireAdminAuth, async (req, res) => {
  try {
    const keys = [
      'footer_logo_url', 'footer_company_name_en', 'footer_company_name_bn', 
      'footer_description_en', 'footer_description_bn',
      'footer_tagline_en', 'footer_tagline_bn',
      'footer_contact_phone', 'footer_contact_email', 'footer_contact_address_en', 'footer_contact_address_bn',
      'footer_social_facebook', 'footer_social_twitter', 'footer_social_instagram', 'footer_social_youtube', 'footer_social_linkedin', 'footer_social_tiktok',
      'footer_app_store_url', 'footer_play_store_url', 
      'footer_app_download_title_en', 'footer_app_download_title_bn',
      'footer_payment_methods_json', 'footer_payment_methods_title_en', 'footer_payment_methods_title_bn',
      'platon_logo_visa', 'platon_logo_mastercard', 'platon_logo_amex', 'platon_logo_bkash', 'platon_logo_nagad', 'platon_logo_rocket',
      'footer_copyright_en', 'footer_copyright_bn',
      'footer_follow_us_title_en', 'footer_follow_us_title_bn',
      'store_address', 'store_address_line2', 'store_area', 'store_city', 'store_district', 'store_country', 'store_post_code', 'maps_url'
    ];
    
    const settingsRows = await db.executePrepared(
      "SELECT config_key, config_value FROM site_settings WHERE config_key IN (" + keys.map(() => "?").join(",") + ")",
      keys
    );
    
    const settings: Record<string, string> = {};
    settingsRows.forEach((row: any) => {
      settings[row.config_key] = row.config_value;
    });

    const columns = await db.executePrepared("SELECT * FROM footer_columns ORDER BY sort_order ASC", []);
    const links = await db.executePrepared("SELECT * FROM footer_links ORDER BY sort_order ASC", []);

    res.json({ settings, columns, links });
  } catch (err) {
    console.error('[Admin Get Footer All Error] ', err);
    res.status(500).json({ error: 'Failed to fetch footer management data.' });
  }
});

// Multer Config for Footer Logo
const footerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ADMIN: POST Upload Footer Logo
app.post('/api/admin/footer/upload-logo', requireAdminAuth, footerUpload.single('logo'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('No logo file uploaded.'));
    }

    const filename = `footer_logo_${Date.now()}.webp`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'footer');
    const absolutePath = path.join(uploadDir, filename);
    const relativePath = `/uploads/footer/${filename}`;

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Process and save as WebP
    await sharp(req.file.buffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toFile(absolutePath);

    res.json(successResponse({ url: relativePath }, 'Footer logo uploaded successfully.'));
  } catch (err: any) {
    console.error('[Admin Footer Logo Upload Error] ', err);
    res.status(500).json(errorResponse('Failed to upload footer logo: ' + err.message));
  }
});

// ADMIN: POST Update Footer Settings
app.post('/api/admin/footer/settings', requireAdminAuth, async (req: any, res) => {
  try {
    const settings = req.body; 
    const updatedAt = new Date().toISOString();
    
    for (const [key, value] of Object.entries(settings)) {
      await db.executePrepared(
        "INSERT INTO site_settings (config_key, config_value, updated_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE config_value = ?, updated_at = ?",
        [key, value as string, updatedAt, value as string, updatedAt]
      );
    }
    
    await logAdminAction(req.admin, 'UPDATE', 'FooterSettings', 'all', settings);
    res.json({ success: true });
  } catch (err) {
    console.error('[Save Footer Settings Error] ', err);
    res.status(500).json({ error: 'Failed to save footer settings.' });
  }
});

// ----------------- PLATON PAYMENT LOGO MANAGEMENT -----------------

// ADMIN: GET All Platon Payment Methods
app.get('/api/admin/platon', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM platon_payment_methods ORDER BY display_order ASC", []);
    res.json(successResponse(rows));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to fetch Platon payment methods.'));
  }
});

// ADMIN: POST Upload Platon Logo
app.post('/api/admin/platon/upload', requireAdminAuth, footerUpload.single('logo'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('No logo file uploaded.'));
    }

    const id = req.query.id;
    if (!id) {
      return res.status(400).json(errorResponse('Payment method ID is required.'));
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const isSvg = ext === '.svg';
    const timestamp = Date.now();
    const filename = `platon_${id}_${timestamp}${isSvg ? '.svg' : '.webp'}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'platon');
    const absolutePath = path.join(uploadDir, filename);
    const relativePath = `/uploads/platon/${filename}`;

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (isSvg) {
      fs.writeFileSync(absolutePath, req.file.buffer);
    } else {
      await sharp(req.file.buffer)
        .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90 })
        .toFile(absolutePath);
    }

    // Update database
    await db.executePrepared(
      "UPDATE platon_payment_methods SET logo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [relativePath, id]
    );

    res.json(successResponse({ url: relativePath }, 'Logo uploaded successfully.'));
  } catch (err: any) {
    console.error('[Admin Platon Upload Error] ', err);
    res.status(500).json(errorResponse('Failed to upload logo: ' + err.message));
  }
});

// ADMIN: PUT Update Platon Payment Method
app.put('/api/admin/platon/:id', requireAdminAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { is_enabled, display_order, payment_name } = req.body;

    await db.executePrepared(
      "UPDATE platon_payment_methods SET is_enabled = ?, display_order = ?, payment_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [is_enabled, display_order, payment_name, id]
    );

    res.json(successResponse(null, 'Payment method updated successfully.'));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to update payment method.'));
  }
});

// ADMIN: DELETE Platon Logo
app.delete('/api/admin/platon/logo/:id', requireAdminAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    await db.executePrepared(
      "UPDATE platon_payment_methods SET logo_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
    res.json(successResponse(null, 'Logo deleted successfully.'));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete logo.'));
  }
});

// ADMIN: POST Bulk Update Platon Order
app.post('/api/admin/platon/reorder', requireAdminAuth, async (req: any, res) => {
  try {
    const { orders } = req.body; // Array of { id, display_order }
    for (const item of orders) {
      await db.executePrepared(
        "UPDATE platon_payment_methods SET display_order = ? WHERE id = ?",
        [item.display_order, item.id]
      );
    }
    res.json(successResponse(null, 'Order updated successfully.'));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to update order.'));
  }
});

// ADMIN: POST Create Platon Payment Method
app.post('/api/admin/platon', requireAdminAuth, footerUpload.single('logo'), async (req: any, res) => {
  try {
    const { payment_name, is_enabled, display_order } = req.body;
    const payment_key = payment_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Insert initial row to get ID
    const result = await db.executePrepared(
      "INSERT INTO platon_payment_methods (payment_key, payment_name, is_enabled, display_order) VALUES (?, ?, ?, ?)",
      [payment_key, payment_name, is_enabled === 'true' || is_enabled === true ? 1 : 0, parseInt(display_order) || 0]
    );
    
    const newId = result.insertId;
    let logo_url = null;

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const isSvg = ext === '.svg';
      const timestamp = Date.now();
      const filename = `platon_${newId}_${timestamp}${isSvg ? '.svg' : '.webp'}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'platon');
      const absolutePath = path.join(uploadDir, filename);
      logo_url = `/uploads/platon/${filename}`;

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      if (isSvg) {
        fs.writeFileSync(absolutePath, req.file.buffer);
      } else {
        await sharp(req.file.buffer)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 90 })
          .toFile(absolutePath);
      }

      await db.executePrepared(
        "UPDATE platon_payment_methods SET logo_url = ? WHERE id = ?",
        [logo_url, newId]
      );
    }

    res.json(successResponse({ id: newId, logo_url }, 'Payment method created successfully.'));
  } catch (err: any) {
    console.error('[Admin Platon Create Error] ', err);
    res.status(500).json(errorResponse('Failed to create payment method: ' + err.message));
  }
});

// ADMIN: DELETE Platon Payment Method
app.delete('/api/admin/platon/:id', requireAdminAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    await db.executePrepared("DELETE FROM platon_payment_methods WHERE id = ?", [id]);
    res.json(successResponse(null, 'Payment method deleted successfully.'));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete payment method.'));
  }
});

// CUSTOMER: GET Active Platon Payment Methods
app.get('/api/platon/active', async (req, res) => {
  try {
    const rows = await db.executePrepared(
      "SELECT payment_name, logo_url FROM platon_payment_methods WHERE is_enabled = TRUE ORDER BY display_order ASC",
      []
    );
    res.json(successResponse(rows));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to fetch payment methods.'));
  }
});

// ADMIN: POST Bulk Update Footer Columns
app.post('/api/admin/footer/columns', requireAdminAuth, async (req: any, res) => {
  try {
    const { columns } = req.body; 
    
    for (const col of columns) {
      if (col._deleted && col.id) {
        await db.executePrepared("DELETE FROM footer_columns WHERE id = ?", [col.id]);
      } else if (col.id) {
        await db.executePrepared(
          "UPDATE footer_columns SET name_en = ?, name_bn = ?, sort_order = ?, status = ? WHERE id = ?",
          [col.name_en, col.name_bn, col.sort_order, col.status, col.id]
        );
      } else {
        await db.executePrepared(
          "INSERT INTO footer_columns (name_en, name_bn, sort_order, status) VALUES (?, ?, ?, ?)",
          [col.name_en, col.name_bn, col.sort_order, col.status]
        );
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('[Bulk Update Footer Columns Error] ', err);
    res.status(500).json({ error: 'Failed to update footer columns.' });
  }
});

// ADMIN: POST Bulk Update Footer Links
app.post('/api/admin/footer/links', requireAdminAuth, async (req: any, res) => {
  try {
    const { links } = req.body; 
    
    for (const link of links) {
      if (link._deleted && link.id) {
        await db.executePrepared("DELETE FROM footer_links WHERE id = ?", [link.id]);
      } else if (link.id) {
        await db.executePrepared(
          "UPDATE footer_links SET column_id = ?, name_en = ?, name_bn = ?, url = ?, sort_order = ?, status = ? WHERE id = ?",
          [link.column_id, link.name_en, link.name_bn, link.url, link.sort_order, link.status, link.id]
        );
      } else {
        await db.executePrepared(
          "INSERT INTO footer_links (column_id, name_en, name_bn, url, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)",
          [link.column_id, link.name_en, link.name_bn, link.url, link.sort_order, link.status]
        );
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('[Bulk Update Footer Links Error] ', err);
    res.status(500).json({ error: 'Failed to update footer links.' });
  }
});

// ADMIN: GET Customer Report
app.get('/api/admin/reports/customers', requireAdminAuth, async (req: any, res) => {
  try {
    const { start, end, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    // Overview stats
    const statsQuery = `
      SELECT 
        COUNT(id) as totalCustomers,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCustomers,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactiveCustomers
      FROM customers`;
    const statsRows: any = await db.executePrepared(statsQuery, []);
    const stats = statsRows[0] || {};

    // Detailed list
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    if (search) {
      whereClause += " AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const customers = await db.executePrepared(`
      SELECT c.id, c.full_name, c.email, c.phone, c.created_at, c.status,
             (SELECT COUNT(id) FROM orders WHERE customer_id = c.id) as totalOrders,
             (SELECT SUM(total_amount) FROM orders WHERE customer_id = c.id) as totalSpent
      FROM customers c
      ${whereClause}
      LIMIT ? OFFSET ?`, [...params, Number(limit), offset]);

    res.json({ stats, customers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer report.' });
  }
});

// ADMIN: GET Payment Report
app.get('/api/admin/reports/payments', requireAdminAuth, async (req: any, res) => {
  try {
    const { start, end, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    // Overview stats
    const statsQuery = `
      SELECT 
        COUNT(id) as totalPayments,
        SUM(CASE WHEN payment_status = 'successful' THEN 1 ELSE 0 END) as successfulPayments,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pendingPayments,
        SUM(CASE WHEN payment_status = 'failed' THEN 1 ELSE 0 END) as failedPayments,
        SUM(CASE WHEN payment_status = 'refunded' THEN 1 ELSE 0 END) as refundedPayments,
        SUM(CASE WHEN payment_status = 'successful' THEN total_amount ELSE 0 END) as totalPaidAmount
      FROM orders`;
    const statsRows: any = await db.executePrepared(statsQuery, []);
    const stats = statsRows[0] || {};

    // Transaction list
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    if (search) {
      whereClause += " AND (id LIKE ? OR payment_method LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const transactions = await db.executePrepared(`
      SELECT id, total_amount, payment_method, payment_status, created_at
      FROM orders 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`, [...params, Number(limit), offset]);

    res.json({ stats, transactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment report.' });
  }
});

// ADMIN: POST Save/Update FAQ
app.post('/api/admin/faqs', requireAdminAuth, async (req: any, res) => {
  try {
    const { id, question_en, question_bn, answer_en, answer_bn, category, is_active, is_published, display_order, is_featured } = req.body;
    
    if (id) {
        await db.executePrepared(
            "UPDATE faqs SET question_en = ?, question_bn = ?, answer_en = ?, answer_bn = ?, category = ?, is_active = ?, is_published = ?, display_order = ?, is_featured = ? WHERE id = ?",
            [question_en, question_bn, answer_en, answer_bn, category, is_active, is_published, display_order, is_featured, id]
        );
        await logAdminAction(req.admin, 'UPDATE', 'FAQ', id.toString(), { question_en });
    } else {
        await db.executePrepared(
            "INSERT INTO faqs (question_en, question_bn, answer_en, answer_bn, category, is_active, is_published, display_order, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [question_en, question_bn, answer_en, answer_bn, category, is_active, is_published, display_order, is_featured]
        );
        await logAdminAction(req.admin, 'CREATE', 'FAQ', 'new', { question_en });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save FAQ.' });
  }
});

// ADMIN: DELETE FAQ
app.delete('/api/admin/faqs/:id', requireAdminAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    await db.executePrepared("DELETE FROM faqs WHERE id = ?", [id]);
    await logAdminAction(req.admin, 'DELETE', 'FAQ', id, {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete FAQ.' });
  }
});

// CUSTOMER: GET Published FAQs
app.get('/api/faqs', async (req, res) => {
  try {
    const faqs = await db.executePrepared("SELECT * FROM faqs WHERE is_active = 1 AND is_published = 1 ORDER BY display_order ASC, created_at DESC", []);
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch FAQs.' });
  }
});

// Helper to get store information with defaults
const getStoreInformation = async () => {
  const keys = [
    'store_name', 'store_name_bn', 'store_logo', 'store_favicon', 'store_description',
    'store_phone', 'store_whatsapp', 'store_email', 'support_phone',
    'store_address', 'store_address_line2', 'store_area', 'store_city', 'store_district', 'store_country', 'store_post_code',
    'company_name', 'registration_number', 'vat_tin',
    'maps_url', 'latitude', 'longitude',
    'hours_sat', 'hours_sun', 'hours_mon', 'hours_tue', 'hours_wed', 'hours_thu', 'hours_fri',
    'facebook_url', 'instagram_url', 'tiktok_url', 'youtube_url', 'linkedin_url'
  ];
  
  const info: Record<string, any> = {};
  for (const key of keys) {
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
    info[key] = rows.length > 0 ? rows[0].config_value : '';
  }
  return info;
};

// GET Store Information
app.get('/api/admin/store-information', requireAdminAuth, async (req, res) => {
  try {
    const info = await getStoreInformation();
    res.json(info);
  } catch (err) {
    console.error('[Get Store Information Error] ', err);
    res.status(500).json({ error: 'Failed to retrieve store information.' });
  }
});

// POST Store Information
app.post('/api/admin/store-information', requireAdminAuth, async (req, res) => {
  try {
    const info = req.body;
    const updatedAt = new Date().toISOString();
    
    // Data isolation: Only update allowed keys for Store Information
    const allowedKeys = [
      'store_name', 'store_name_bn', 'store_logo', 'store_favicon', 'store_description',
      'store_phone', 'store_whatsapp', 'store_email', 'support_phone',
      'store_address', 'store_address_line2', 'store_area', 'store_city', 'store_district', 'store_country', 'store_post_code',
      'company_name', 'registration_number', 'vat_tin',
      'maps_url', 'latitude', 'longitude',
      'hours_sat', 'hours_sun', 'hours_mon', 'hours_tue', 'hours_wed', 'hours_thu', 'hours_fri',
      'facebook_url', 'instagram_url', 'tiktok_url', 'youtube_url', 'linkedin_url'
    ];

    for (const [key, value] of Object.entries(info)) {
      if (allowedKeys.includes(key)) {
        const rows = await db.executePrepared("SELECT id FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
        if (rows.length > 0) {
          await db.executePrepared("UPDATE site_settings SET config_value = ?, updated_at = ? WHERE config_key = ?", [value as string, updatedAt, key]);
        } else {
          await db.executePrepared("INSERT INTO site_settings (config_key, config_value, created_at) VALUES (?, ?, ?)", [key, value as string, updatedAt]);
        }
      }
    }
    
    res.json({ success: true, message: 'Store information saved successfully.' });
  } catch (err) {
    console.error('[Save Store Information Error] ', err);
    res.status(500).json({ error: 'Failed to save store information.' });
  }
});

// ----------------- CMS / HOMEPAGE CMS API -----------------

// CUSTOMER FACING: GET Homepage Sections
app.get('/api/homepage/sections', async (req, res) => {
  try {
    const rows = await db.executePrepared(
      "SELECT id, section_key, title_en, title_bn, config FROM homepage_sections WHERE enabled = 1 ORDER BY sort_order ASC",
      []
    );
    res.json(rows);
  } catch (err) {
    console.error('[Get Homepage Sections Error] ', err);
    res.status(500).json({ error: 'Failed to fetch homepage sections.' });
  }
});

// CUSTOMER FACING: GET Banners by Location
app.get('/api/homepage/banners', async (req, res) => {
  try {
    const { location = 'homepage_hero', category_id } = req.query;
    const now = new Date().toISOString();
    
    let query = `SELECT * FROM homepage_banners 
       WHERE status = 'active' 
       AND display_location = ?`;
    const params: any[] = [location];

    if (location === 'category_banner' && category_id) {
      query += ` AND category_id = ?`;
      params.push(category_id);
    }

    query += ` AND (start_date IS NULL OR start_date <= ?) 
       AND (end_date IS NULL OR end_date >= ?) 
       ORDER BY sort_order ASC`;
    params.push(now, now);

    const rows = await db.executePrepared(query, params);
    res.json(successResponse(rows));
  } catch (err) {
    console.error('[Get Banners Error] ', err);
    res.status(500).json({ error: 'Failed to fetch banners.' });
  }
});

// ADMIN: GET Homepage Sections
app.get('/api/admin/homepage/sections', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM homepage_sections ORDER BY sort_order ASC", []);
    res.json(rows);
  } catch (err) {
    console.error('[Admin Get Homepage Sections Error] ', err);
    res.status(500).json({ error: 'Failed to fetch sections.' });
  }
});

// ADMIN: POST Update Homepage Section
app.post('/api/admin/homepage/sections/:id', requireAdminAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { enabled, sort_order, title_en, title_bn, config } = req.body;
    
    await db.executePrepared(
      "UPDATE homepage_sections SET enabled = ?, sort_order = ?, title_en = ?, title_bn = ?, config = ? WHERE id = ?",
      [enabled ? 1 : 0, sort_order, title_en, title_bn, config ? JSON.stringify(config) : null, id]
    );

    await logAdminAction(req.admin, 'UPDATE', 'homepage_section', id, { title_en });
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin Update Section Error] ', err);
    res.status(500).json({ error: 'Failed to update section.' });
  }
});

// DEBUG: GET ALL Products
app.get('/api/debug-products', async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM products", []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch debug products.' });
  }
});

// Debug: Check product count
app.get('/api/debug/product-count', async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT COUNT(*) as count FROM products", []);
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to count products.' });
  }
});

// Debug: Check homepage sections
app.get('/api/debug/sections', async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM homepage_sections ORDER BY sort_order ASC", []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sections.' });
  }
});

// CUSTOMER: GET Products with Filters (Homepage Sections)
app.get('/api/products', async (req, res) => {
  try {
    const { category, brand, search, type, page = 1, limit = 8 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const selectedFields = "id, name, name_bn, slug, price, old_price, old_price as oldPrice, image_url, image_url as imageUrl, category, brand, rating, badge, stock_quantity, unit, featured, status, created_at";
    
    let baseQuery = "FROM products WHERE status = 'active'";
    let params: any[] = [];

    if (category) {
      baseQuery += " AND (category = ? OR category IN (SELECT name FROM categories WHERE slug = ?))";
      params.push(category, category);
    }

    if (brand) {
      baseQuery += " AND (brand = ? OR brand IN (SELECT name FROM brands WHERE slug = ?))";
      params.push(brand, brand);
    }

    if (search) {
      baseQuery += " AND (name LIKE ? OR name_bn LIKE ? OR description LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (type === 'featured') {
      baseQuery += " AND (featured = 1 OR (badge IS NOT NULL AND badge != ''))";
    }

    if (type === 'fast_sell') {
      baseQuery += " AND is_fast_sale = 1";
    }

    // Count total for pagination
    const countResult = await db.executePrepared(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const total = countResult[0].total;

    let query = `SELECT ${selectedFields} ${baseQuery}`;
    
    if (type === 'new_arrivals') {
      query += " ORDER BY created_at DESC";
    } else if (type === 'best_sellers') {
      query = `
        SELECT p.id, p.name, p.name_bn, p.slug, p.price, p.old_price, p.old_price as oldPrice, p.image_url, p.image_url as imageUrl, p.category, p.brand, p.rating, p.badge, p.stock_quantity, p.unit, p.featured, p.status, p.created_at, SUM(oi.quantity) as total_sold
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE p.status = 'active'
        ${category ? " AND (p.category = ? OR p.category IN (SELECT name FROM categories WHERE slug = ?))" : ""}
        ${brand ? " AND (p.brand = ? OR p.brand IN (SELECT name FROM brands WHERE slug = ?))" : ""}
        AND (o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) OR o.created_at IS NULL)
        GROUP BY p.id
        ORDER BY total_sold DESC, p.created_at DESC
      `;
      // If we use this complex query, params might need adjustment if category/brand are present
      // But for now let's keep it simple or use the base params if they align.
      // Re-calculating params for best_sellers to be safe
      const bsParams: any[] = [];
      if (category) bsParams.push(category, category);
      if (brand) bsParams.push(brand, brand);
      params = bsParams;
    } else {
      query += " ORDER BY created_at DESC";
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string), offset);
    
    const rows = await db.executePrepared(query, params);
    
    res.json({
      products: rows,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (err) {
    console.error('[Get Products Error] ', err);
    res.status(500).json({ error: 'Failed to fetch products.', details: err instanceof Error ? err.message : 'Unknown' });
  }
});

// CUSTOMER: GET Categories
app.get('/api/categories', async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM categories WHERE status = 'active' ORDER BY sort_order ASC", []);
    const normalized = (rows || []).map((row: any) => {
      const img = row.image_url || row.image || row.icon_image || row.iconImage || '';
      const order = Number(row.sort_order ?? row.displayOrder ?? 0);
      return {
        ...row,
        image_url: img,
        imageUrl: img,
        image: img,
        iconImage: img,
        icon_image: img,
        sort_order: order,
        sortOrder: order,
        displayOrder: order
      };
    });
    res.json(normalized);
  } catch (err) {
    console.error('[Get Categories Error] ', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// CUSTOMER: GET Category by Slug
app.get('/api/categories/:slug', async (req, res) => {
  try {
    const rawSlug = (req.params.slug || '').trim();
    let decoded = rawSlug;
    try {
      decoded = decodeURIComponent(rawSlug).trim();
    } catch (e) {}
    const cleanSlug = decoded.toLowerCase().replace(/\/+$/, '');

    const rows = await db.executePrepared(
      "SELECT * FROM categories WHERE LOWER(slug) = ? OR LOWER(id) = ? OR LOWER(name) = ? OR slug = ? OR id = ? OR name = ? LIMIT 1",
      [cleanSlug, cleanSlug, cleanSlug, rawSlug, rawSlug, rawSlug]
    );

    if (rows && rows.length > 0) {
      const row = rows[0];
      const img = row.image_url || row.image || row.icon_image || row.iconImage || '';
      const order = Number(row.sort_order ?? row.displayOrder ?? 0);
      res.json({
        ...row,
        image_url: img,
        imageUrl: img,
        image: img,
        iconImage: img,
        icon_image: img,
        sort_order: order,
        sortOrder: order,
        displayOrder: order
      });
    } else {
      res.status(404).json({ error: 'Category not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch category.' });
  }
});

// CUSTOMER: GET Products by Category Slug
app.get('/api/categories/:slug/products', async (req, res) => {
  try {
    const rawSlug = (req.params.slug || '').trim();
    let decoded = rawSlug;
    try {
      decoded = decodeURIComponent(rawSlug).trim();
    } catch (e) {}
    const cleanSlug = decoded.toLowerCase().replace(/\/+$/, '');

    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const selectedFields = "id, name, name_bn, slug, price, old_price, old_price as oldPrice, image_url, image_url as imageUrl, category, brand, rating, badge, stock_quantity, unit, featured, status, created_at";

    // Get category first to handle name/id/slug matches
    const catRows = await db.executePrepared(
      "SELECT id, name, name_bn, slug FROM categories WHERE LOWER(slug) = ? OR LOWER(id) = ? OR LOWER(name) = ? OR slug = ? OR id = ? OR name = ? LIMIT 1",
      [cleanSlug, cleanSlug, cleanSlug, rawSlug, rawSlug, rawSlug]
    );

    if (!catRows || catRows.length === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    const category = catRows[0];
    
    // Count total
    const countResult = await db.executePrepared(
      "SELECT COUNT(*) as total FROM products WHERE (category_id = ? OR category = ? OR category = ? OR category = ? OR category_id = ?) AND status = 'active'",
      [category.id, category.id, category.name, category.slug, category.name]
    );
    const total = countResult[0].total;

    // Fetch products
    const rows = await db.executePrepared(
      `SELECT ${selectedFields} FROM products WHERE (category_id = ? OR category = ? OR category = ? OR category = ? OR category_id = ?) AND status = 'active' ORDER BY created_at DESC LIMIT ? OFFSET ?`, 
      [category.id, category.id, category.name, category.slug, category.name, parseInt(limit as string), offset]
    );
    
    res.json({
      products: rows,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products for category.' });
  }
});

// CUSTOMER: GET Product by Slug or ID
app.get('/api/products/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    // Try slug first, then ID for backward compatibility
    let rows = await db.executePrepared("SELECT * FROM products WHERE slug = ? OR id = ? LIMIT 1", [slug, slug]);
    if ((!rows || rows.length === 0) && slug.includes('-')) {
      const potentialId = slug.substring(slug.lastIndexOf('-') + 1);
      rows = await db.executePrepared("SELECT * FROM products WHERE id = ? OR slug = ? LIMIT 1", [potentialId, potentialId]);
    }

    if (rows && rows.length > 0) {
      const prod = { ...rows[0] };
      prod.imageUrl = prod.image_url || prod.imageUrl || '';
      prod.image_url = prod.image_url || prod.imageUrl || '';
      prod.oldPrice = prod.old_price !== undefined ? prod.old_price : prod.oldPrice;
      prod.old_price = prod.old_price !== undefined ? prod.old_price : prod.oldPrice;
      prod.stock_quantity = prod.stock_quantity !== undefined ? prod.stock_quantity : 50;
      prod.slug = prod.slug || prod.id;

      // Never expose buying/cost price to customer
      delete prod.buying_price;
      delete prod.cost_price;

      // Parse JSON fields safely if they are strings
      if (typeof prod.gallery === 'string') {
        try { prod.gallery = JSON.parse(prod.gallery); } catch (e) { prod.gallery = []; }
      }
      if (typeof prod.images === 'string') {
        try { prod.images = JSON.parse(prod.images); } catch (e) { prod.images = []; }
      }
      if (!Array.isArray(prod.images) || prod.images.length === 0) {
        if (Array.isArray(prod.gallery) && prod.gallery.length > 0) {
          prod.images = prod.gallery;
        } else if (prod.image_url) {
          prod.images = [prod.image_url];
        } else {
          prod.images = [];
        }
      }

      if (typeof prod.variants === 'string') {
        try { prod.variants = JSON.parse(prod.variants); } catch (e) { prod.variants = []; }
      }
      if (typeof prod.key_features === 'string') {
        try { prod.key_features = JSON.parse(prod.key_features); } catch (e) { prod.key_features = []; }
      }
      if (typeof prod.specifications === 'string') {
        try { prod.specifications = JSON.parse(prod.specifications); } catch (e) { prod.specifications = {}; }
      }
      if (typeof prod.nutrition === 'string') {
        try { prod.nutrition = JSON.parse(prod.nutrition); } catch (e) { prod.nutrition = []; }
      }

      // Fetch real review stats from database
      try {
        const revRows = await db.executePrepared(
          "SELECT rating FROM product_reviews WHERE (product_id = ? OR product_id = ?) AND status = 'approved'",
          [prod.id, prod.slug]
        );
        if (revRows && revRows.length > 0) {
          const totalRev = revRows.length;
          const sumRev = revRows.reduce((acc: number, r: any) => acc + Number(r.rating || 5), 0);
          prod.rating = Number((sumRev / totalRev).toFixed(1));
          prod.review_count = totalRev;
        }
      } catch (revErr) {
        // use existing product rating
      }

      res.json(prod);
    } else {
      res.status(404).json({ error: 'Product not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

// CUSTOMER: GET Product Recommendations (Related Products)
// Strict Recommendation Algorithm:
// Current Product -> Same Category -> Related Category -> Other Active Products (Min 6, Max 10, Real DB only)
app.get('/api/products/:slugOrId/recommendations', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const currentRows = await db.executePrepared(
      "SELECT id, category, category_id, brand, slug FROM products WHERE slug = ? OR id = ? LIMIT 1",
      [slugOrId, slugOrId]
    );

    if (!currentRows || currentRows.length === 0) {
      return res.status(404).json({ error: 'Current product not found.' });
    }

    const current = currentRows[0];
    const currentId = current.id;
    const currentSlug = current.slug;
    const currentCat = current.category || '';
    const currentCatId = current.category_id || '';

    // Fetch all active products
    const allActiveRows = await db.executePrepared(
      "SELECT id, name, name_bn, slug, price, old_price, old_price as oldPrice, image_url, image_url as imageUrl, category, category_id, brand, rating, badge, stock_quantity, unit, featured, status, short_description FROM products WHERE status = 'active'",
      []
    );

    // Filter out current product
    const pool = (allActiveRows || []).filter((p: any) => p.id !== currentId && p.slug !== currentSlug);

    const recommendedList: any[] = [];
    const addedIds = new Set<string>();

    const addProduct = (p: any) => {
      if (!addedIds.has(p.id) && recommendedList.length < 10) {
        addedIds.add(p.id);
        recommendedList.push(p);
      }
    };

    // Priority 1: Same Category Products
    const sameCategory = pool.filter((p: any) => 
      (currentCatId && (p.category_id === currentCatId || p.category === currentCatId)) ||
      (currentCat && (p.category === currentCat || (p.category_id && p.category_id.toLowerCase() === currentCat.toLowerCase())))
    );
    for (const p of sameCategory) {
      addProduct(p);
    }

    // Priority 2: Related Category Products (Dry food / nuts / fruits / snacks or related categories)
    if (recommendedList.length < 10) {
      const isDryFood = currentCat.toLowerCase().includes('dry') || (currentCatId && currentCatId.toLowerCase().includes('dry'));
      const relatedKeywords = isDryFood 
        ? ['nut', 'fruit', 'snack', 'date', 'organic', 'honey', 'food'] 
        : ['organic', 'grocery', 'food', 'snack'];

      const relatedCategory = pool.filter((p: any) => {
        if (addedIds.has(p.id)) return false;
        const pCat = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        return relatedKeywords.some(kw => pCat.includes(kw) || pName.includes(kw));
      });

      for (const p of relatedCategory) {
        addProduct(p);
      }
    }

    // Priority 3: Other Active Products (fill up to 10 if needed)
    if (recommendedList.length < 10) {
      const otherActive = pool.filter((p: any) => !addedIds.has(p.id));
      for (const p of otherActive) {
        addProduct(p);
      }
    }

    const normalizedRecs = recommendedList.map((p: any) => ({
      ...p,
      imageUrl: p.image_url || p.imageUrl || '',
      image_url: p.image_url || p.imageUrl || '',
      oldPrice: p.old_price !== undefined ? p.old_price : p.oldPrice,
      old_price: p.old_price !== undefined ? p.old_price : p.oldPrice,
      stock_quantity: p.stock_quantity !== undefined ? p.stock_quantity : 50,
      slug: p.slug || p.id,
    }));

    res.json({
      success: true,
      currentProductId: currentId,
      total: normalizedRecs.length,
      products: normalizedRecs
    });
  } catch (err) {
    console.error('[Recommendations Error]', err);
    res.status(500).json({ error: 'Failed to fetch recommendations.' });
  }
});

// CUSTOMER: GET Reviews by Product ID or Slug
app.get('/api/products/:slugOrId/reviews', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    // Resolve product id
    const prods = await db.executePrepared(
      "SELECT id, slug, rating, review_count FROM products WHERE slug = ? OR id = ? LIMIT 1",
      [slugOrId, slugOrId]
    );
    const prodId = prods.length > 0 ? prods[0].id : slugOrId;
    const prodSlug = prods.length > 0 ? prods[0].slug : slugOrId;

    const reviews = await db.executePrepared(
      `SELECT * FROM product_reviews 
       WHERE (product_id = ? OR product_id = ?) AND status = 'approved' 
       ORDER BY created_at DESC`,
      [prodId, prodSlug]
    );

    const total = reviews.length;
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    for (const r of reviews) {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating || 5))));
      distribution[star] = (distribution[star] || 0) + 1;
      sum += Number(r.rating || 5);
    }

    const averageRating = total > 0 ? Number((sum / total).toFixed(1)) : (prods[0]?.rating || 5.0);

    res.json({
      success: true,
      total,
      averageRating,
      distribution,
      reviews
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve reviews.' });
  }
});

// CUSTOMER: GET Brands
app.get('/api/brands', async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM brands WHERE status = 'active' ORDER BY name ASC", []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brands.' });
  }
});

// CUSTOMER: GET Brand by Slug
app.get('/api/brands/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const rows = await db.executePrepared("SELECT * FROM brands WHERE slug = ? OR id = ? LIMIT 1", [slug, slug]);
    if (rows && rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Brand not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brand.' });
  }
});

// ADMIN: GET Categories List/Manage with Product and Subcategory counts
app.get('/api/admin/categories', requireAdminAuth, async (req, res) => {
  try {
    const fields = `
      id, name, name_bn, slug, image_url, banner_url, status, sort_order, parent_id,
      description, description_bn, seo_title, seo_description, seo_keywords,
      seo_slug, canonical_url, is_featured, show_on_homepage, show_in_main_menu, show_in_footer,
      created_at, updated_at
    `;
    const query = `
      SELECT ${fields},
        (SELECT COUNT(*) FROM products p WHERE p.category = c.id OR p.category = c.name) as product_count,
        (SELECT COUNT(*) FROM categories s WHERE s.parent_id = c.id) as subcategory_count
      FROM categories c
      ORDER BY c.sort_order ASC
    `;
    
    const categories = await db.executePrepared(query, []);
    res.json(categories);
  } catch (err) {
    console.error('[Admin Get Categories Error] ', err);
    res.status(500).json({ error: 'Failed to fetch admin categories.' });
  }
});

// ADMIN: CREATE Category
app.post('/api/admin/categories', requireAdminAuth, async (req, res) => {
  try {
    const {
      name,
      name_bn,
      slug,
      image_url,
      banner_url,
      status,
      sort_order,
      parent_id,
      description,
      description_bn,
      seo_title,
      seo_description,
      seo_keywords,
      seo_slug,
      canonical_url,
      is_featured,
      show_on_homepage,
      show_in_main_menu,
      show_in_footer
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category Name is required.' });
    }

    const cleanId = `cat_${Date.now()}`;
    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const cleanSeoSlug = seo_slug || cleanSlug;
    const targetImage = image_url || req.body.imageUrl || req.body.iconImage || req.body.icon_image || req.body.image || '';
    const targetSortOrder = Number(sort_order ?? req.body.displayOrder ?? req.body.sortOrder ?? 0);

    await db.executePrepared(
      `INSERT INTO categories (
        id, name, name_bn, slug, image_url, banner_url, status, sort_order, parent_id,
        description, description_bn, seo_title, seo_description, seo_keywords,
        seo_slug, canonical_url, is_featured, show_on_homepage, show_in_main_menu, show_in_footer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanId,
        name,
        name_bn || name,
        cleanSlug,
        targetImage,
        banner_url || '',
        status || 'active',
        targetSortOrder,
        parent_id || null,
        description || '',
        description_bn || '',
        seo_title || '',
        seo_description || '',
        seo_keywords || '',
        cleanSeoSlug,
        canonical_url || '',
        is_featured ? 1 : 0,
        show_on_homepage ? 1 : 0,
        show_in_main_menu ? 1 : 0,
        show_in_footer ? 1 : 0
      ]
    );

    res.json({ success: true, id: cleanId, message: 'Category created successfully.' });
  } catch (err: any) {
    console.error('[Admin Create Category Error] ', err);
    res.status(500).json({ error: 'Failed to create category.', details: err.message });
  }
});

// ADMIN: UPDATE Category
app.put('/api/admin/categories/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      name_bn,
      slug,
      image_url,
      banner_url,
      status,
      sort_order,
      parent_id,
      description,
      description_bn,
      seo_title,
      seo_description,
      seo_keywords,
      seo_slug,
      canonical_url,
      is_featured,
      show_on_homepage,
      show_in_main_menu,
      show_in_footer
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category Name is required.' });
    }

    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const targetImage = image_url || req.body.imageUrl || req.body.iconImage || req.body.icon_image || req.body.image || '';
    const targetSortOrder = Number(sort_order ?? req.body.displayOrder ?? req.body.sortOrder ?? 0);

    await db.executePrepared(
      `UPDATE categories SET 
        name = ?, name_bn = ?, slug = ?, image_url = ?, banner_url = ?, status = ?, sort_order = ?, parent_id = ?,
        description = ?, description_bn = ?, seo_title = ?, seo_description = ?, seo_keywords = ?,
        seo_slug = ?, canonical_url = ?, is_featured = ?, show_on_homepage = ?, show_in_main_menu = ?, show_in_footer = ?
      WHERE id = ?`,
      [
        name,
        name_bn || name,
        cleanSlug,
        targetImage,
        banner_url || '',
        status || 'active',
        targetSortOrder,
        parent_id || null,
        description || '',
        description_bn || '',
        seo_title || '',
        seo_description || '',
        seo_keywords || '',
        seo_slug || cleanSlug,
        canonical_url || '',
        is_featured ? 1 : 0,
        show_on_homepage ? 1 : 0,
        show_in_main_menu ? 1 : 0,
        show_in_footer ? 1 : 0,
        id
      ]
    );

    res.json({ success: true, message: 'Category updated successfully.' });
  } catch (err: any) {
    console.error('[Admin Update Category Error] ', err);
    res.status(500).json({ error: 'Failed to update category.', details: err.message });
  }
});

// ADMIN: GET Site Settings
app.get('/api/admin/site-settings', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM site_settings", []);
    const settings: Record<string, string> = {};
    rows.forEach((r: any) => {
      settings[r.config_key] = r.config_value;
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch site settings.' });
  }
});

// ADMIN: UPDATE Site Settings
app.post('/api/admin/site-settings', requireAdminAuth, async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await db.executePrepared(
        "INSERT INTO site_settings (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?",
        [key, value, value]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update site settings.' });
  }
});

// ADMIN: UPLOAD Company Logo
app.post('/api/admin/profile/upload-logo', requireAdminAuth, upload.single('logo'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    // In a real app, you'd upload to cloud storage. 
    // Here we'll return the base64 or a local path.
    const logoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    await db.executePrepared(
      "INSERT INTO site_settings (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?",
      ['company_logo', logoUrl, logoUrl]
    );
    
    // Also sync footer_logo_url for backward compatibility
    await db.executePrepared(
      "INSERT INTO site_settings (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?",
      ['footer_logo_url', logoUrl, logoUrl]
    );

    res.json({ logoUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// CUSTOMER: GET Active Payment Methods
app.get('/api/payment-methods/active', async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM payment_methods WHERE status = 1 ORDER BY sort_order ASC", []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active payment methods.' });
  }
});

// ADMIN: GET All Payment Methods
app.get('/api/admin/payment-methods', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM payment_methods ORDER BY sort_order ASC", []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment methods for admin.' });
  }
});

// ADMIN: CREATE Payment Method
app.post('/api/admin/payment-methods', requireAdminAuth, async (req, res) => {
  try {
    const { name, logo, alt_text, status, sort_order } = req.body;
    if (!name || !logo) {
      return res.status(400).json({ error: 'Name and Logo are required.' });
    }
    await db.executePrepared(
      "INSERT INTO payment_methods (name, logo, alt_text, status, sort_order) VALUES (?, ?, ?, ?, ?)",
      [name, logo, alt_text || name, status !== undefined ? status : 1, sort_order || 0]
    );
    res.json({ success: true, message: 'Payment method created.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payment method.' });
  }
});

// ADMIN: UPDATE Payment Method
app.put('/api/admin/payment-methods/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo, alt_text, status, sort_order } = req.body;
    await db.executePrepared(
      "UPDATE payment_methods SET name = ?, logo = ?, alt_text = ?, status = ?, sort_order = ? WHERE id = ?",
      [name, logo, alt_text, status, sort_order, id]
    );
    res.json({ success: true, message: 'Payment method updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment method.' });
  }
});

// ADMIN: DELETE Payment Method
app.delete('/api/admin/payment-methods/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.executePrepared("DELETE FROM payment_methods WHERE id = ?", [id]);
    res.json({ success: true, message: 'Payment method deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete payment method.' });
  }
});

// ADMIN: DELETE Category (with product warning safety block)
app.delete('/api/admin/categories/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get Category Name to match either Name or ID
    const [catRow]: any = await db.executePrepared("SELECT name FROM categories WHERE id = ? LIMIT 1", [id]);
    if (!catRow) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    const catName = catRow.name;

    // 2. Check for Products under this Category
    const [prodCountRow]: any = await db.executePrepared(
      "SELECT COUNT(*) as count FROM products WHERE category = ? OR category = ?",
      [id, catName]
    );

    const productCount = prodCountRow ? prodCountRow.count : 0;
    if (productCount > 0) {
      return res.status(400).json({
        error: 'HAS_PRODUCTS',
        productCount: productCount,
        message: `This category contains ${productCount} products. Please move the products to another category before deleting.`
      });
    }

    // 3. Delete category from database
    await db.executePrepared("DELETE FROM categories WHERE id = ?", [id]);
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err: any) {
    console.error('[Admin Delete Category Error] ', err);
    res.status(500).json({ error: 'Failed to delete category.', details: err.message });
  }
});

// ----------------- BRANDS API -----------------

// PUBLIC: Get active brands for Customer Panel
app.get('/api/brands', async (req, res) => {
  try {
    const brands = await db.executePrepared("SELECT * FROM brands WHERE status = 'active' ORDER BY display_order ASC, name ASC");
    res.json(brands);
  } catch (err: any) {
    console.error('[Public Get Brands Error] ', err);
    res.status(500).json({ error: 'Failed to fetch brands.', details: err.message });
  }
});

// PUBLIC: Get single brand by slug or ID
app.get('/api/brands/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const rows = await db.executePrepared("SELECT * FROM brands WHERE slug = ? OR id = ? LIMIT 1", [slug, slug]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found.' });
    }
    res.json(rows[0]);
  } catch (err: any) {
    console.error('[Public Get Brand by Slug Error] ', err);
    res.status(500).json({ error: 'Failed to fetch brand.', details: err.message });
  }
});

// ADMIN: Get all brands with statistics
app.get('/api/admin/brands', requireAdminAuth, async (req, res) => {
  try {
    const brands = await db.executePrepared("SELECT * FROM brands ORDER BY display_order ASC, createdAt DESC");
    
    // Dynamically calculate accurate product_count for each brand
    for (const b of brands) {
      if (b.product_count === undefined) {
        const pRows = await db.executePrepared(
          "SELECT COUNT(*) as cnt FROM products WHERE brand_id = ? OR brand = ? OR brand = ?",
          [b.id, b.name, b.slug]
        );
        b.product_count = pRows && pRows.length > 0 ? (pRows[0].cnt || pRows[0].total || 0) : 0;
      }
    }

    const totalBrands = brands.length;
    const activeBrands = brands.filter((b: any) => b.status === 'active').length;
    const inactiveBrands = brands.filter((b: any) => b.status === 'inactive').length;
    const featuredBrands = brands.filter((b: any) => b.featured).length;
    const brandsWithProducts = brands.filter((b: any) => (b.product_count || 0) > 0).length;
    const brandsWithoutProducts = totalBrands - brandsWithProducts;

    res.json({
      success: true,
      brands,
      stats: {
        total: totalBrands,
        active: activeBrands,
        inactive: inactiveBrands,
        featured: featuredBrands,
        withProducts: brandsWithProducts,
        withoutProducts: brandsWithoutProducts
      }
    });
  } catch (err: any) {
    console.error('[Admin Get Brands Error] ', err);
    res.status(500).json({ error: 'Failed to fetch brands.', details: err.message });
  }
});

// ADMIN: Get products connected to a specific brand
app.get('/api/admin/brands/:id/products', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const brandRows = await db.executePrepared("SELECT * FROM brands WHERE id = ? LIMIT 1", [id]);
    if (!brandRows || brandRows.length === 0) {
      return res.status(404).json({ error: 'Brand not found.' });
    }
    const brand = brandRows[0];
    const products = await db.executePrepared(
      "SELECT id, name, name_bn, sku, price, old_price, stock_quantity, unit, image_url, category, brand, status FROM products WHERE brand_id = ? OR brand = ? OR brand = ? ORDER BY created_at DESC",
      [id, brand.name, brand.slug]
    );
    res.json({ success: true, brand, products: products || [] });
  } catch (err: any) {
    console.error('[Admin Get Brand Products Error]', err);
    res.status(500).json({ error: 'Failed to fetch brand products.', details: err.message });
  }
});

// ADMIN: Create Brand
app.post('/api/admin/brands', requireAdminAuth, async (req, res) => {
  try {
    const {
      name, localName, slug, logo, banner, shortDescription, description,
      countryOfOrigin, officialWebsite, display_order, status, featured, seoTitle,
      metaDescription, seoKeywords, canonicalUrl, logoAlt
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Brand name is required.' });
    }

    const brandSlug = slug && slug.trim() ? slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const brandId = `brand_${Date.now()}`;

    const existing = await db.executePrepared("SELECT id FROM brands WHERE name = ? OR slug = ?", [name.trim(), brandSlug]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Brand with this name or slug already exists.' });
    }

    await db.executePrepared(
      `INSERT INTO brands (id, name, localName, slug, logo, banner, shortDescription, description, countryOfOrigin, officialWebsite, display_order, status, featured, seoTitle, metaDescription, seoKeywords, canonicalUrl, logoAlt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        brandId, name.trim(), localName || '', brandSlug, logo || 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=150&h=150&fit=crop',
        banner || '', shortDescription || '', description || '', countryOfOrigin || '', officialWebsite || '',
        display_order !== undefined ? Number(display_order) : 0, status || 'active', featured ? 1 : 0, seoTitle || name, metaDescription || shortDescription || '',
        seoKeywords || '', canonicalUrl || '', logoAlt || name
      ]
    );

    res.json({ success: true, message: 'Brand created successfully.', brandId });
  } catch (err: any) {
    console.error('[Admin Create Brand Error] ', err);
    res.status(500).json({ error: 'Failed to create brand.', details: err.message });
  }
});

// ADMIN: Update Brand
app.put('/api/admin/brands/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, localName, slug, logo, banner, shortDescription, description,
      countryOfOrigin, officialWebsite, display_order, status, featured, seoTitle,
      metaDescription, seoKeywords, canonicalUrl, logoAlt
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Brand name is required.' });
    }

    const brandSlug = slug && slug.trim() ? slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    await db.executePrepared(
      `UPDATE brands SET name = ?, localName = ?, slug = ?, logo = ?, banner = ?, shortDescription = ?, description = ?, countryOfOrigin = ?, officialWebsite = ?, display_order = ?, status = ?, featured = ?, seoTitle = ?, metaDescription = ?, seoKeywords = ?, canonicalUrl = ?, logoAlt = ? WHERE id = ?`,
      [
        name.trim(), localName || '', brandSlug, logo || '', banner || '', shortDescription || '', description || '',
        countryOfOrigin || '', officialWebsite || '', display_order !== undefined ? Number(display_order) : 0, status || 'active', featured ? 1 : 0,
        seoTitle || '', metaDescription || '', seoKeywords || '', canonicalUrl || '', logoAlt || '', id
      ]
    );

    res.json({ success: true, message: 'Brand updated successfully.' });
  } catch (err: any) {
    console.error('[Admin Update Brand Error] ', err);
    res.status(500).json({ error: 'Failed to update brand.', details: err.message });
  }
});

// ADMIN: Delete Brand (with product count safety check)
app.delete('/api/admin/brands/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [brand]: any = await db.executePrepared("SELECT * FROM brands WHERE id = ? LIMIT 1", [id]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found.' });
    }
    const brandName = brand.name;
    const brandSlug = brand.slug;

    const products = await db.executePrepared("SELECT id FROM products WHERE brand_id = ? OR brand = ? OR brand = ?", [id, brandName, brandSlug]);
    const productCount = products ? products.length : 0;

    if (productCount > 0) {
      return res.status(400).json({
        error: 'HAS_PRODUCTS',
        productCount,
        message: `This brand is currently connected to ${productCount} products. Please deactivate the brand or reassign its products before deleting.`
      });
    }

    await db.executePrepared("DELETE FROM brands WHERE id = ?", [id]);
    res.json({ success: true, message: 'Brand deleted successfully.' });
  } catch (err: any) {
    console.error('[Admin Delete Brand Error] ', err);
    res.status(500).json({ error: 'Failed to delete brand.', details: err.message });
  }
});

// ADMIN: Bulk Brand Actions
app.post('/api/admin/brands/bulk', requireAdminAuth, async (req, res) => {
  try {
    const { action, brandIds } = req.body;
    if (!Array.isArray(brandIds) || brandIds.length === 0) {
      return res.status(400).json({ error: 'No brands selected.' });
    }

    if (action === 'activate') {
      for (const id of brandIds) {
        await db.executePrepared("UPDATE brands SET status = 'active' WHERE id = ?", [id]);
      }
    } else if (action === 'deactivate') {
      for (const id of brandIds) {
        await db.executePrepared("UPDATE brands SET status = 'inactive' WHERE id = ?", [id]);
      }
    } else if (action === 'feature') {
      for (const id of brandIds) {
        await db.executePrepared("UPDATE brands SET featured = 1 WHERE id = ?", [id]);
      }
    } else if (action === 'unfeature') {
      for (const id of brandIds) {
        await db.executePrepared("UPDATE brands SET featured = 0 WHERE id = ?", [id]);
      }
    } else if (action === 'delete') {
      for (const id of brandIds) {
        const [brand]: any = await db.executePrepared("SELECT name FROM brands WHERE id = ? LIMIT 1", [id]);
        if (brand) {
          const prods = await db.executePrepared("SELECT id FROM products WHERE brand = ? OR brand = ?", [id, brand.name]);
          if (!prods || prods.length === 0) {
            await db.executePrepared("DELETE FROM brands WHERE id = ?", [id]);
          }
        }
      }
    } else {
      return res.status(400).json({ error: 'Invalid bulk action.' });
    }

    res.json({ success: true, message: `Bulk action '${action}' completed successfully.` });
  } catch (err: any) {
    console.error('[Admin Bulk Brand Action Error] ', err);
    res.status(500).json({ error: 'Failed to perform bulk action.', details: err.message });
  }
});

// ----------------- GENERAL SETTINGS API (MySQL PERSISTENCE) -----------------

// Helper to get site settings with defaults
const getSiteSettings = async () => {
  const keys = [
    'store_status', 'maintenance_mode', 'maintenance_message',
    'store_name', 'store_name_bn', 'store_logo', 'store_favicon', 'store_description',
    'store_phone', 'store_whatsapp', 'store_email', 'store_address',
    'currency', 'currency_symbol', 'timezone', 'date_format',
    'customer_registration', 'guest_checkout', 'email_verification', 'phone_verification',
    'min_order_amount', 'order_confirmation', 'order_cancellation',
    'seo_title', 'seo_description', 'seo_keywords', 'canonical_url', 'robots_setting', 'og_title', 'og_description', 'og_image'
  ];
  
  const settings: Record<string, any> = {};
  for (const key of keys) {
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
    settings[key] = rows.length > 0 ? rows[0].config_value : '';
  }
  return settings;
};

// GET General Settings
app.get('/api/admin/general-settings', requireAdminAuth, async (req, res) => {
  try {
    const settings = await getSiteSettings();
    res.json(settings);
  } catch (err) {
    console.error('[Get General Settings Error] ', err);
    res.status(500).json({ error: 'Failed to retrieve general settings.' });
  }
});

// POST General Settings
app.post('/api/admin/general-settings', requireAdminAuth, async (req, res) => {
  try {
    const settings = req.body;
    const updatedAt = new Date().toISOString();
    
    // Data isolation: Only update allowed keys
    const allowedKeys = [
      'store_status', 'maintenance_mode', 'maintenance_message',
      'store_name', 'store_name_bn', 'store_logo', 'store_favicon', 'store_description',
      'store_phone', 'store_whatsapp', 'store_email', 'store_address',
      'currency', 'currency_symbol', 'timezone', 'date_format',
      'customer_registration', 'guest_checkout', 'email_verification', 'phone_verification',
      'min_order_amount', 'order_confirmation', 'order_cancellation',
      'seo_title', 'seo_description', 'seo_keywords', 'canonical_url', 'robots_setting', 'og_title', 'og_description', 'og_image'
    ];

    for (const [key, value] of Object.entries(settings)) {
      if (allowedKeys.includes(key)) {
        const rows = await db.executePrepared("SELECT id FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
        if (rows.length > 0) {
          await db.executePrepared("UPDATE site_settings SET config_value = ?, updated_at = ? WHERE config_key = ?", [value as string, updatedAt, key]);
        } else {
          await db.executePrepared("INSERT INTO site_settings (config_key, config_value, created_at) VALUES (?, ?, ?)", [key, value as string, updatedAt]);
        }
      }
    }
    
    res.json({ success: true, message: 'General settings saved successfully.' });
  } catch (err) {
    console.error('[Save General Settings Error] ', err);
    res.status(500).json({ error: 'Failed to save general settings.' });
  }
});

// --- PUBLIC SETTINGS API (Customer Frontend) ---
app.get('/api/settings', async (req, res) => {
  try {
    const keys = [
      'store_status', 'maintenance_mode', 'maintenance_message',
      'store_name', 'store_name_bn', 'store_logo', 'store_favicon', 'store_description',
      'store_phone', 'store_whatsapp', 'store_email', 'support_phone',
      'store_address', 'store_area', 'store_city', 'store_district', 'store_country',
      'company_name', 'registration_number', 'vat_tin',
      'maps_url', 'latitude', 'longitude',
      'hours_sat', 'hours_sun', 'hours_mon', 'hours_tue', 'hours_wed', 'hours_thu', 'hours_fri',
      'facebook_url', 'instagram_url', 'tiktok_url', 'youtube_url',
      'currency', 'currency_symbol', 'timezone', 'date_format',
      'seo_title', 'seo_description', 'seo_keywords', 'seo_canonical', 'seo_index', 'seo_follow',
      'og_title', 'og_description', 'og_image',
      'twitter_card', 'twitter_title', 'twitter_description', 'twitter_image',
      'default_language', 'language_en_enabled', 'language_bn_enabled', 'customer_language_switcher_enabled'
    ];
    
    const settings: Record<string, any> = {};
    for (const key of keys) {
      const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
      settings[key] = rows.length > 0 ? rows[0].config_value : '';
    }
    res.json(settings);
  } catch (err) {
    console.error('[Public Settings Error] ', err);
    res.status(500).json({ error: 'Failed to retrieve site settings.' });
  }
});

// ----------------- SEO & BOTs API -----------------

app.get('/robots.txt', async (req, res) => {
  try {
    const settings = await getSiteSettings();
    const robots = settings.robots_setting || `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: ${process.env.APP_URL || req.protocol + '://' + req.get('host')}/sitemap.xml`;
    
    res.type('text/plain');
    res.send(robots);
  } catch (err) {
    res.type('text/plain');
    res.send("User-agent: *\nAllow: /");
  }
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.APP_URL || req.protocol + '://' + req.get('host');
    const now = new Date().toISOString();
    
    // Static routes
    const staticPages = [
      '',
      '/about',
      '/contact',
      '/products',
      '/categories',
      '/brands',
      '/offers'
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    staticPages.forEach(page => {
      sitemap += `  <url>
    <loc>${baseUrl}/#${page}</loc>
    <lastmod>${now.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>
`;
    });

    // Add dynamic products
    const products = await db.executePrepared("SELECT slug, updated_at FROM products WHERE status = 'active'");
    products.forEach((p: any) => {
      sitemap += `  <url>
    <loc>${baseUrl}/#/product/${p.slug}</loc>
    <lastmod>${(p.updated_at || now).split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });

    // Add categories
    const categories = await db.executePrepared("SELECT slug FROM categories");
    categories.forEach((c: any) => {
      sitemap += `  <url>
    <loc>${baseUrl}/#/category/${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    });

    // Add brands
    const brands = await db.executePrepared("SELECT slug FROM brands WHERE status = 'active'");
    brands.forEach((b: any) => {
      sitemap += `  <url>
    <loc>${baseUrl}/#/brand/${b.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    });

    sitemap += '</urlset>';
    
    res.type('application/xml');
    res.send(sitemap);
  } catch (err) {
    console.error('[Sitemap Error] ', err);
    res.status(500).send('Error generating sitemap');
  }
});

// GET specific setting by key
app.get('/api/site-settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
    if (rows.length > 0) {
      res.json({ success: true, data: rows[0].config_value });
    } else {
      res.json({ success: false, message: 'Setting not found.' });
    }
  } catch (err) {
    console.error('[Get Site Setting Error] ', err);
    res.status(500).json({ error: 'Failed to retrieve setting.' });
  }
});

// Admin Log In Endpoint
app.post('/api/admin/login', async (req, res) => {
  const ip = req.ip || '127.0.0.1';
  const { email, password } = req.body;

  // 1. Validate Input
  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ error: 'Invalid admin email or password.' });
    return;
  }
  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid admin email or password.' });
    return;
  }

  // 2. Check Rate Limit
  const rateLimit = checkLoginRateLimit(ip);
  if (rateLimit.blocked) {
    const remainingSecs = Math.ceil(rateLimit.remainingMs / 1000);
    res.status(429).json({ 
      error: `Too many failed attempts. Suspended. Please try again in ${remainingSecs} seconds.` 
    });
    return;
  }

  try {
    // 3. Query User record using Prepared Statements to prevent SQL injection
    const rows = await db.executePrepared(
      "SELECT * FROM admin_users WHERE email = ? AND status = 'active' LIMIT 1",
      [email.trim().toLowerCase()]
    );

    if (!rows || rows.length === 0) {
      recordLoginAttempt(ip, false);
      res.status(401).json({ error: 'Invalid admin email or password.' });
      return;
    }

    const admin = rows[0];

    // 4. Cryptographically verify password using bcryptjs
    const isPasswordValid = verifyPassword(password, admin.password_hash);
    if (!isPasswordValid) {
      recordLoginAttempt(ip, false);
      res.status(401).json({ error: 'Invalid admin email or password.' });
      return;
    }

    // 5. Success: Reset rate limit & update last login timestamp
    recordLoginAttempt(ip, true);
    await db.executePrepared(
      "UPDATE admin_users SET last_login_at = ? WHERE id = ?",
      [new Date().toISOString(), admin.id]
    );

    // 6. Sign JWT Session Token
    const sessionToken = jwt.sign(
      {
        id: admin.id,
        name: admin.name,
        role: admin.role,
        role_id: admin.role_id,
        email: admin.email
      },
      JWT_SECRET,
      { expiresIn: '2h' } // 2-hour sliding session expiry
    );

    // 7. Store in Secure HttpOnly Cookie
    res.cookie('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });

    // Log the successful login
    await AuditLogger.log({
      user_id: admin.id,
      user_type: 'admin',
      event_type: 'LOGIN_SUCCESS',
      description: `Administrator ${admin.name} logged in successfully`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      success: true,
      token: sessionToken, // Token fallback returned for client storage (crucial inside iframe previews)
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        role_id: admin.role_id,
        last_login_at: admin.last_login_at
      }
    });

  } catch (err) {
    console.error('[API Login Error] ', err);
    res.status(500).json({ error: 'Invalid admin email or password.' });
  }
});

// Admin Log Out Endpoint
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_session');
  res.json({ success: true });
});

// Get Current Authenticated Administrator Profile
app.get('/api/admin/me', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    authenticated: true,
    admin: req.admin
  });
});

// Admin Dashboard Stat Summary Widget Metrics Endpoint (Simulating real MySQL counts)
app.get('/api/admin/stats', requireAdminAuth, async (req, res) => {
  try {
    const totalOrdersResult = await db.executePrepared("SELECT COUNT(*) AS count FROM orders");
    const totalOrders = totalOrdersResult[0]?.count || 0;

    const totalSalesResult = await db.executePrepared("SELECT SUM(total_amount) AS total FROM orders WHERE status != 'Cancelled'");
    const totalSales = Number(totalSalesResult[0]?.total || 0);

    const totalCustomersResult = await db.executePrepared("SELECT COUNT(*) AS count FROM customers");
    const totalCustomers = totalCustomersResult[0]?.count || 0;

    const totalProductsResult = await db.executePrepared("SELECT COUNT(*) AS count FROM products");
    const totalProducts = totalProductsResult[0]?.count || 0;

    const pendingOrdersResult = await db.executePrepared("SELECT COUNT(*) AS count FROM orders WHERE status = 'Pending' OR status = 'Processing'");
    const pendingOrders = pendingOrdersResult[0]?.count || 0;

    const todaySalesResult = await db.executePrepared("SELECT SUM(total_amount) AS total FROM orders WHERE DATE(created_at) = CURRENT_DATE() AND status != 'Cancelled'");
    const todaySales = Number(todaySalesResult[0]?.total || 0);

    const lowStockResult = await db.executePrepared("SELECT COUNT(*) AS count FROM products WHERE stock_quantity < 15");
    const lowStockProducts = lowStockResult[0]?.count || 0;

    const newCustomersResult = await db.executePrepared("SELECT COUNT(*) AS count FROM customers WHERE DATE(created_at) = CURRENT_DATE()");
    const newCustomers = newCustomersResult[0]?.count || 0;

    res.json({
      totalOrders,
      totalSales,
      totalCustomers,
      totalProducts,
      pendingOrders,
      todaySales,
      lowStockProducts,
      newCustomers
    });
  } catch (err) {
    console.error('[Admin Stats API Error] ', err);
    res.status(500).json({ error: 'Failed to retrieve administrative statistics.' });
  }
});

// Admin Dashboard Advanced Live Details (Recent lists, top sales, chart records)
app.get('/api/admin/dashboard-details', requireAdminAuth, async (req, res) => {
  try {
    // 1. Core summary KPIs
    const totalOrdersResult = await db.executePrepared("SELECT COUNT(*) AS count FROM orders");
    const totalOrders = totalOrdersResult[0]?.count || 0;

    const totalSalesResult = await db.executePrepared("SELECT SUM(total_amount) AS total FROM orders WHERE status != 'Cancelled'");
    const totalSales = Number(totalSalesResult[0]?.total || 0);

    const totalCustomersResult = await db.executePrepared("SELECT COUNT(*) AS count FROM customers");
    const totalCustomers = totalCustomersResult[0]?.count || 0;

    const totalProductsResult = await db.executePrepared("SELECT COUNT(*) AS count FROM products");
    const totalProducts = totalProductsResult[0]?.count || 0;

    const pendingOrdersResult = await db.executePrepared("SELECT COUNT(*) AS count FROM orders WHERE status = 'Pending' OR status = 'Processing'");
    const pendingOrders = pendingOrdersResult[0]?.count || 0;

    const todaySalesResult = await db.executePrepared("SELECT SUM(total_amount) AS total FROM orders WHERE DATE(created_at) = CURRENT_DATE() AND status != 'Cancelled'");
    const todaySales = Number(todaySalesResult[0]?.total || 0);

    const lowStockResult = await db.executePrepared("SELECT COUNT(*) AS count FROM products WHERE stock_quantity < 15");
    const lowStockProducts = lowStockResult[0]?.count || 0;

    const newCustomersResult = await db.executePrepared("SELECT COUNT(*) AS count FROM customers WHERE DATE(created_at) = CURRENT_DATE()");
    const newCustomers = newCustomersResult[0]?.count || 0;

    const stats = {
      totalOrders,
      totalSales,
      totalCustomers,
      totalProducts,
      pendingOrders,
      todaySales,
      lowStockProducts,
      newCustomers
    };

    // 2. Recent 10 Orders
    const recentOrders = await db.executePrepared("SELECT * FROM orders ORDER BY created_at DESC LIMIT 10");

    // 3. Recent 5 Customers
    const recentCustomers = await db.executePrepared("SELECT * FROM customers ORDER BY created_at DESC LIMIT 5");

    // 4. Top Selling Products (Aggregated sum sold and income)
    const topProducts = await db.executePrepared(`
      SELECT oi.product_id, p.name, p.image_url, SUM(oi.quantity) AS sold_qty, SUM(oi.price * oi.quantity) AS sales_amount 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      GROUP BY oi.product_id 
      ORDER BY sold_qty DESC 
      LIMIT 5
    `);

    // 5. Chart Trend (Last 30 days sales per calendar date)
    const chartData = await db.executePrepared("SELECT DATE(created_at) AS date, SUM(total_amount) AS amount FROM orders WHERE status != 'Cancelled' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at)");

    res.json({
      stats,
      recentOrders,
      recentCustomers,
      topProducts,
      chartData
    });
  } catch (err) {
    console.error('[Admin Dashboard Details Error] ', err);
    res.status(500).json({ error: 'Failed to retrieve administrative dashboard details.' });
  }
});

// ADMIN: GET All Orders (with filters & search)
app.get('/api/admin/orders', requireAdminAuth, async (req, res) => {
  try {
    const { status, search, page = '1', limit = '10' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let query = "SELECT * FROM orders WHERE 1=1";
    const params: any[] = [];
    
    if (status && status !== 'all') {
      query += " AND status = ?";
      params.push(status);
    }
    
    if (search) {
      query += " AND (id LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit as string), offset);
    
    const orders = await db.executePrepared(query, params);
    
    // Get total for pagination
    let countQuery = "SELECT COUNT(*) as total FROM orders WHERE 1=1";
    const countParams: any[] = [];
    if (status && status !== 'all') {
      countQuery += " AND status = ?";
      countParams.push(status);
    }
    if (search) {
      countQuery += " AND (id LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)";
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }
    const countResult = await db.executePrepared(countQuery, countParams);
    const totalCount = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit as string));
    
    res.json({ orders, totalPages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ADMIN: GET Order Details
app.get('/api/admin/orders/:id', requireAdminAuth, async (req, res) => {
  try {
    const orderRows = await db.executePrepared("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    if (orderRows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = orderRows[0];
    
    // Parse payment_details if it's a string
    if (typeof order.payment_details === 'string') {
      try {
        order.payment_details = JSON.parse(order.payment_details);
      } catch (e) {
        order.payment_details = {};
      }
    }
    
    const items = await db.executePrepared("SELECT * FROM order_items WHERE order_id = ?", [req.params.id]);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// ADMIN: Update Order Status
app.put('/api/admin/orders/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await db.executePrepared("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ----------------- SEO SETTINGS API (MySQL PERSISTENCE) -----------------

// Helper to get global SEO settings with defaults
const getGlobalSeoSettings = async () => {
  const keys = [
    'seo_title', 'seo_description', 'seo_keywords', 'seo_canonical', 'seo_index', 'seo_follow',
    'og_title', 'og_description', 'og_image',
    'twitter_card', 'twitter_title', 'twitter_description', 'twitter_image',
    'seo_auto_title', 'seo_auto_description', 'seo_auto_products', 'seo_auto_categories',
    'about_seo_title', 'about_seo_description'
  ];
  
  const settings: Record<string, any> = {};
  for (const key of keys) {
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
    settings[key] = rows.length > 0 ? rows[0].config_value : '';
  }
  return settings;
};

// GET Global SEO Settings
app.get('/api/admin/seo-global', requireAdminAuth, async (req, res) => {
  try {
    const settings = await getGlobalSeoSettings();
    res.json(settings);
  } catch (err) {
    console.error('[Get Global SEO Error] ', err);
    res.status(500).json({ error: 'Failed to retrieve global SEO settings.' });
  }
});

// GET Dynamic Page SEO (Public)
app.get('/api/seo/page', async (req, res) => {
  try {
    const { path, slug } = req.query;
    const globalSettings = await getGlobalSeoSettings();
    
    let pageSeo = { ...globalSettings };

    if (path === 'product' && slug) {
      const [product]: any = await db.executePrepared("SELECT name, name_bn, description, image_url, seo_title, seo_description, slug FROM products WHERE slug = ?", [slug]);
      if (product) {
        pageSeo.seo_title = product.seo_title || product.name;
        pageSeo.seo_description = product.seo_description || product.description?.substring(0, 160);
        pageSeo.og_title = pageSeo.seo_title;
        pageSeo.og_description = pageSeo.seo_description;
        pageSeo.og_image = product.image_url;
        pageSeo.seo_canonical = `${globalSettings.seo_canonical}/#/product/${product.slug}`;
      }
    } else if (path === 'category' && slug) {
      const [category]: any = await db.executePrepared("SELECT name, name_bn, description, seo_title, seo_description, slug FROM categories WHERE slug = ?", [slug]);
      if (category) {
        pageSeo.seo_title = category.seo_title || category.name;
        pageSeo.seo_description = category.seo_description || category.description?.substring(0, 160);
        pageSeo.og_title = pageSeo.seo_title;
        pageSeo.og_description = pageSeo.seo_description;
        pageSeo.seo_canonical = `${globalSettings.seo_canonical}/#/category/${category.slug}`;
      }
    } else if (path === 'brand' && slug) {
      const [brand]: any = await db.executePrepared("SELECT name, description, seo_title, seo_description, slug FROM brands WHERE slug = ?", [slug]);
      if (brand) {
        pageSeo.seo_title = brand.seo_title || brand.name;
        pageSeo.seo_description = brand.seo_description || brand.description?.substring(0, 160);
        pageSeo.og_title = pageSeo.seo_title;
        pageSeo.og_description = pageSeo.seo_description;
        pageSeo.seo_canonical = `${globalSettings.seo_canonical}/#/brand/${brand.slug}`;
      }
    } else if (path === 'about') {
      pageSeo.seo_title = globalSettings.about_seo_title || `About Us | ${globalSettings.seo_title}`;
      pageSeo.seo_description = globalSettings.about_seo_description || globalSettings.seo_description;
      pageSeo.seo_canonical = `${globalSettings.seo_canonical}/#/about`;
    } else if (path === 'contact') {
      pageSeo.seo_title = `Contact Us | ${globalSettings.seo_title}`;
      pageSeo.seo_canonical = `${globalSettings.seo_canonical}/#/contact`;
    }

    res.json(pageSeo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch page SEO' });
  }
});

// POST Global SEO Settings
app.post('/api/admin/seo-global', requireAdminAuth, async (req, res) => {
  try {
    const settings = req.body;
    const updatedAt = new Date().toISOString();
    
    const allowedKeys = [
      'seo_title', 'seo_description', 'seo_keywords', 'seo_canonical', 'seo_index', 'seo_follow',
      'og_title', 'og_description', 'og_image',
      'twitter_card', 'twitter_title', 'twitter_description', 'twitter_image',
      'seo_auto_title', 'seo_auto_description', 'seo_auto_products', 'seo_auto_categories',
      'about_seo_title', 'about_seo_description'
    ];

    for (const [key, value] of Object.entries(settings)) {
      if (allowedKeys.includes(key)) {
        const rows = await db.executePrepared("SELECT id FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
        if (rows.length > 0) {
          await db.executePrepared("UPDATE site_settings SET config_value = ?, updated_at = ? WHERE config_key = ?", [value as string, updatedAt, key]);
        } else {
          await db.executePrepared("INSERT INTO site_settings (config_key, config_value, created_at) VALUES (?, ?, ?)", [key, value as string, updatedAt]);
        }
      }
    }
    
    res.json({ success: true, message: 'Global SEO settings saved successfully.' });
  } catch (err) {
    console.error('[Save Global SEO Error] ', err);
    res.status(500).json({ error: 'Failed to save global SEO settings.' });
  }
});

// GET Sitemap & Robots Status
app.get('/api/admin/seo-status', requireAdminAuth, async (req, res) => {
  try {
    // Simulating file status for now as they are dynamically served or handled by middleware
    res.json({
      sitemap_status: 'Active',
      sitemap_url: '/sitemap.xml',
      robots_status: 'Active',
      last_updated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve SEO status.' });
  }
});

// POST Regenerate Sitemap
app.post('/api/admin/seo-regenerate-sitemap', requireAdminAuth, async (req, res) => {
  try {
    // Logic to regenerate sitemap would go here
    res.json({ success: true, message: 'Sitemap regeneration triggered successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to regenerate sitemap.' });
  }
});

// Get SEO settings for a specific page key
app.get('/api/admin/seo-settings/:page_key', requireAdminAuth, async (req, res) => {
  try {
    const pageKey = req.params.page_key;
    const rows = await db.executePrepared("SELECT * FROM seo_settings WHERE page_key = ? LIMIT 1", [pageKey]);
    if (rows && rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json({
        page_key: pageKey,
        meta_title: "",
        meta_description: "",
        seo_slug: "",
        canonical_url: "",
        open_graph_image: "",
        structured_data: "{}"
      });
    }
  } catch (err) {
    console.error('[API Get SEO Settings Error] ', err);
    res.status(500).json({ error: 'Failed to retrieve SEO settings.' });
  }
});

// Update or insert SEO settings for a specific page key
app.post('/api/admin/seo-settings/:page_key', requireAdminAuth, async (req, res) => {
  try {
    const pageKey = req.params.page_key;
    const { meta_title, meta_description, seo_slug, canonical_url, open_graph_image, structured_data } = req.body;

    const rows = await db.executePrepared("SELECT id FROM seo_settings WHERE page_key = ? LIMIT 1", [pageKey]);
    
    if (rows && rows.length > 0) {
      await db.executePrepared(
        "UPDATE seo_settings SET meta_title = ?, meta_description = ?, seo_slug = ?, canonical_url = ?, open_graph_image = ?, structured_data = ? WHERE page_key = ?",
        [meta_title || "", meta_description || "", seo_slug || "", canonical_url || "", open_graph_image || "", structured_data || "{}", pageKey]
      );
    } else {
      await db.executePrepared(
        "INSERT INTO seo_settings (page_key, meta_title, meta_description, seo_slug, canonical_url, open_graph_image, structured_data) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [pageKey, meta_title || "", meta_description || "", seo_slug || "", canonical_url || "", open_graph_image || "", structured_data || "{}"]
      );
    }

    res.json({ success: true, message: 'SEO settings saved successfully.' });
  } catch (err) {
    console.error('[API Update SEO Settings Error] ', err);
    res.status(500).json({ error: 'Failed to save SEO settings.' });
  }
});

// ----------------- LANGUAGE & TRANSLATION API (SHAD GHOR) -----------------

// Helper to get language config
const getLanguageConfig = async () => {
  const keys = [
    'default_language', 
    'language_en_enabled', 
    'language_bn_enabled', 
    'customer_language_switcher_enabled',
    'admin_panel_language'
  ];
  
  const config: Record<string, any> = {};
  for (const key of keys) {
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
    config[key] = rows.length > 0 ? rows[0].config_value : (key === 'default_language' || key === 'admin_panel_language' ? 'bn' : 'true');
  }
  return config;
};

// GET Language Config
app.get('/api/admin/languages/config', requireAdminAuth, async (req, res) => {
  try {
    const config = await getLanguageConfig();
    res.json(config);
  } catch (err) {
    console.error('[Get Language Config Error] ', err);
    res.status(500).json({ error: 'Failed to retrieve language configuration.' });
  }
});

// POST Language Config
app.post('/api/admin/languages/config', requireAdminAuth, async (req, res) => {
  try {
    const config = req.body;
    const updatedAt = new Date().toISOString();
    const allowedKeys = [
      'default_language', 
      'language_en_enabled', 
      'language_bn_enabled', 
      'customer_language_switcher_enabled',
      'admin_panel_language'
    ];

    for (const [key, value] of Object.entries(config)) {
      if (allowedKeys.includes(key)) {
        const rows = await db.executePrepared("SELECT id FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
        if (rows.length > 0) {
          await db.executePrepared("UPDATE site_settings SET config_value = ?, updated_at = ? WHERE config_key = ?", [String(value), updatedAt, key]);
        } else {
          await db.executePrepared("INSERT INTO site_settings (config_key, config_value, created_at) VALUES (?, ?, ?)", [key, String(value), updatedAt]);
        }
      }
    }
    
    res.json({ success: true, message: 'Language configuration saved successfully.' });
  } catch (err) {
    console.error('[Save Language Config Error] ', err);
    res.status(500).json({ error: 'Failed to save language configuration.' });
  }
});

// GET Translations
app.get('/api/admin/languages/translations', requireAdminAuth, async (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = "SELECT * FROM translations WHERE 1=1";
    const params: any[] = [];

    if (category && category !== 'all') {
      sql += " AND category = ?";
      params.push(category);
    }

    if (search) {
      sql += " AND (translation_key LIKE ? OR en LIKE ? OR bn LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += " ORDER BY translation_key ASC";
    const translations = await db.executePrepared(sql, params);
    res.json(translations);
  } catch (err) {
    console.error('[Get Translations Error] ', err);
    res.status(500).json({ error: 'Failed to retrieve translations.' });
  }
});

// POST/PUT Translation
app.post('/api/admin/languages/translations', requireAdminAuth, async (req, res) => {
  try {
    const { translation_key, category, en, bn } = req.body;
    if (!translation_key || !category) {
      return res.status(400).json({ error: 'Translation key and category are required.' });
    }

    const updatedAt = new Date().toISOString();
    const existing = await db.executePrepared("SELECT id FROM translations WHERE translation_key = ? LIMIT 1", [translation_key]);

    if (existing.length > 0) {
      await db.executePrepared(
        "UPDATE translations SET category = ?, en = ?, bn = ?, updated_at = ? WHERE translation_key = ?",
        [category, en, bn, updatedAt, translation_key]
      );
    } else {
      await db.executePrepared(
        "INSERT INTO translations (translation_key, category, en, bn, created_at) VALUES (?, ?, ?, ?, ?)",
        [translation_key, category, en, bn, updatedAt]
      );
    }

    res.json({ success: true, message: 'Translation saved successfully.' });
  } catch (err) {
    console.error('[Save Translation Error] ', err);
    res.status(500).json({ error: 'Failed to save translation.' });
  }
});

// DELETE Translation
app.delete('/api/admin/languages/translations/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.executePrepared("DELETE FROM translations WHERE id = ?", [id]);
    res.json({ success: true, message: 'Translation deleted successfully.' });
  } catch (err) {
    console.error('[Delete Translation Error] ', err);
    res.status(500).json({ error: 'Failed to delete translation.' });
  }
});

// PUBLIC API: GET Translations for Customer Panel
app.get('/api/languages/translations', async (req, res) => {
  try {
    const lang = (req.query.lang as string) === 'bn' ? 'bn' : 'en';
    const translations = await db.executePrepared("SELECT translation_key, en, bn FROM translations");
    
    // Format into a key-value object for easy use on frontend
    const staticDict = (TRANSLATIONS[lang] || TRANSLATIONS.en) as Record<string, string>;
    const result: Record<string, string> = { ...staticDict };

    translations.forEach((t: any) => {
      const val = lang === 'bn' ? (t.bn || t.en) : (t.en || t.bn);
      if (val && val.trim() && val !== t.translation_key) {
        result[t.translation_key] = val;
      }
    });

    res.json(result);
  } catch (err) {
    console.error('[Public Get Translations Error] ', err);
    res.status(500).json({ error: 'Failed to retrieve translations.' });
  }
});

// ----------------- NOTIFICATION API & SERVICE (SHAD GHOR) -----------------

// Notification Service Helper MOVED to src/services/notificationService.ts


// GET Notification Config
app.get('/api/admin/notifications/config', requireAdminAuth, async (req, res) => {
  try {
    const keys = [
      'notifications_master_enabled',
      'customer_notifications_enabled',
      'admin_notifications_enabled',
      'channel_in_app_enabled',
      'channel_email_enabled',
      'channel_sms_enabled',
      'channel_whatsapp_enabled',
      'channel_push_enabled'
    ];
    const config: Record<string, any> = {};
    for (const key of keys) {
      const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
      config[key] = rows.length > 0 ? rows[0].config_value : 'true';
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve notification config.' });
  }
});

// POST Notification Config
app.post('/api/admin/notifications/config', requireAdminAuth, async (req, res) => {
  try {
    const config = req.body;
    const updatedAt = new Date().toISOString();
    for (const [key, value] of Object.entries(config)) {
      const rows = await db.executePrepared("SELECT id FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
      if (rows.length > 0) {
        await db.executePrepared("UPDATE site_settings SET config_value = ?, updated_at = ? WHERE config_key = ?", [String(value), updatedAt, key]);
      } else {
        await db.executePrepared("INSERT INTO site_settings (config_key, config_value, created_at) VALUES (?, ?, ?)", [key, String(value), updatedAt]);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save notification config.' });
  }
});

// GET Notification Templates
app.get('/api/admin/notifications/templates', requireAdminAuth, async (req, res) => {
  try {
    const templates = await db.executePrepared("SELECT * FROM notification_templates ORDER BY event_key ASC");
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve templates.' });
  }
});

// POST Notification Template
app.post('/api/admin/notifications/templates', requireAdminAuth, async (req, res) => {
  try {
    const { event_key, title_en, message_en, title_bn, message_bn, enabled, channels } = req.body;
    const existing = await db.executePrepared("SELECT id FROM notification_templates WHERE event_key = ? LIMIT 1", [event_key]);
    if (existing.length > 0) {
      await db.executePrepared(
        "UPDATE notification_templates SET title_en = ?, message_en = ?, title_bn = ?, message_bn = ?, enabled = ?, channels = ? WHERE event_key = ?",
        [title_en, message_en, title_bn, message_bn, enabled ? 1 : 0, channels || 'in_app', event_key]
      );
    } else {
      await db.executePrepared(
        "INSERT INTO notification_templates (event_key, title_en, message_en, title_bn, message_bn, enabled, channels) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [event_key, title_en, message_en, title_bn, message_bn, enabled ? 1 : 0, channels || 'in_app']
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save template.' });
  }
});

// CUSTOMER API: Get My Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const customerId = req.query.customer_id; // Simulating session/auth for now
    if (!customerId) return res.json([]);
    const notifications = await db.executePrepared("SELECT * FROM notifications WHERE user_id = ? AND user_type = 'customer'", [customerId]);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// CUSTOMER API: Mark Read
app.post('/api/notifications/read', async (req, res) => {
  try {
    const { id, customer_id, all } = req.body;
    if (all) {
      await db.executePrepared("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND user_type = 'customer' AND is_read = 0", [customer_id]);
    } else {
      await db.executePrepared("UPDATE notifications SET is_read = 1 WHERE id = ?", [id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification status.' });
  }
});

// ADMIN API: Get Admin Notifications
app.get('/api/admin/notifications', requireAdminAuth, async (req, res) => {
  try {
    const notifications = await db.executePrepared("SELECT * FROM notifications WHERE user_type = 'admin'");
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve admin notifications.' });
  }
});

// ----------------- SECURITY & AUDIT API (SHAD GHOR) -----------------

// Audit Logger Helper
const AuditLogger = {
  async log(event: {
    user_id?: number | null,
    user_type?: 'admin' | 'customer' | 'system',
    event_type: string,
    description: string,
    ip_address?: string,
    user_agent?: string,
    metadata?: any
  }) {
    try {
      await db.executePrepared(
        "INSERT INTO audit_logs (user_id, user_type, event_type, description, ip_address, user_agent, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          event.user_id || null,
          event.user_type || 'system',
          event.event_type,
          event.description,
          event.ip_address || null,
          event.user_agent || null,
          event.metadata ? JSON.stringify(event.metadata) : null
        ]
      );
    } catch (err) {
      console.error('[Audit Log Error] ', err);
    }
  }
};

// GET Security Config
app.get('/api/admin/security/config', requireAdminAuth, async (req, res) => {
  try {
    const keys = [
      'admin_login_limit',
      'admin_lockout_duration',
      'admin_session_timeout',
      'customer_registration_enabled',
      'customer_email_verification',
      'customer_phone_verification',
      'otp_enabled',
      'otp_expiry',
      'otp_max_attempts',
      'otp_resend_cooldown',
      'admin_2fa_enabled',
      'customer_2fa_enabled',
      'api_rate_limit',
      'cors_policy',
      'password_reset_expiry',
      'min_password_length'
    ];
    const config: Record<string, any> = {};
    for (const key of keys) {
      const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
      if (rows.length > 0) {
        config[key] = rows[0].config_value;
      } else {
        // Defaults
        const defaults: Record<string, string> = {
          admin_login_limit: '5',
          admin_lockout_duration: '30',
          admin_session_timeout: '120',
          customer_registration_enabled: 'true',
          customer_email_verification: 'true',
          customer_phone_verification: 'false',
          otp_enabled: 'true',
          otp_expiry: '5',
          otp_max_attempts: '3',
          otp_resend_cooldown: '60',
          admin_2fa_enabled: 'false',
          customer_2fa_enabled: 'false',
          api_rate_limit: '100',
          cors_policy: 'strict',
          password_reset_expiry: '60',
          min_password_length: '8'
        };
        config[key] = defaults[key] || '';
      }
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve security config.' });
  }
});

// POST Security Config
app.post('/api/admin/security/config', requireAdminAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const config = req.body;
    const updatedAt = new Date().toISOString();
    
    for (const [key, value] of Object.entries(config)) {
      const rows = await db.executePrepared("SELECT id FROM site_settings WHERE config_key = ? LIMIT 1", [key]);
      if (rows.length > 0) {
        await db.executePrepared("UPDATE site_settings SET config_value = ?, updated_at = ? WHERE config_key = ?", [String(value), updatedAt, key]);
      } else {
        await db.executePrepared("INSERT INTO site_settings (config_key, config_value, created_at) VALUES (?, ?, ?)", [key, String(value), updatedAt]);
      }
    }
    
    // Refresh local cache immediately
    await syncSecurityConfig();

    // Log the action
    await AuditLogger.log({
      user_id: req.admin?.id,
      user_type: 'admin',
      event_type: 'SECURITY_CONFIG_UPDATE',
      description: `Security settings updated by ${req.admin?.name}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      metadata: config
    });

    // Notify Admins about security changes
    await NotificationService.trigger('admin_security_alert', {
      type: 'security',
      message: `Security settings were updated by ${req.admin?.name}. Please review the changes in Audit Logs.`,
      link: '#/admin/settings/security'
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save security settings.' });
  }
});

// GET Audit Logs
app.get('/api/admin/security/audit-logs', requireAdminAuth, async (req, res) => {
  try {
    const logs = await db.executePrepared("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100");
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

// ----------------- CUSTOMER AUTH & SECURITY API (SHAD GHOR) -----------------

// Customer Registration
app.post('/api/customer/register', async (req, res) => {
  try {
    if (!SECURITY_CONFIG.customer_registration_enabled) {
      return res.status(403).json({ error: 'Registration is currently disabled for security reasons.' });
    }

    const { full_name, email, phone, password } = req.body;
    
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password.length < SECURITY_CONFIG.min_password_length) {
      return res.status(400).json({ error: `Password must be at least ${SECURITY_CONFIG.min_password_length} characters.` });
    }

    // Check existing
    const existingEmail = await db.executePrepared("SELECT id FROM customers WHERE email = ? LIMIT 1", [email]);
    if (existingEmail.length > 0) return res.status(400).json({ error: 'Email already registered.' });

    const existingPhone = await db.executePrepared("SELECT id FROM customers WHERE phone = ? LIMIT 1", [phone]);
    if (existingPhone.length > 0) return res.status(400).json({ error: 'Phone number already registered.' });

    const passwordHash = hashPassword(password);
    const createdAt = new Date().toISOString();

    const result = await db.executePrepared(
      "INSERT INTO customers (full_name, email, phone, password_hash, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [full_name, email, phone, passwordHash, 'active', createdAt]
    );

    const customerId = result.insertId;

    await AuditLogger.log({
      user_id: customerId,
      user_type: 'customer',
      event_type: 'CUSTOMER_REGISTER',
      description: `New customer registered: ${full_name} (${email})`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Registration successful. Please login.' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// Customer Login
app.post('/api/customer/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || 'unknown';

    const rows = await db.executePrepared("SELECT * FROM customers WHERE email = ? LIMIT 1", [email]);
    if (rows.length === 0) {
      await AuditLogger.log({
        event_type: 'CUSTOMER_LOGIN_FAILED',
        description: `Failed login attempt (email not found): ${email}`,
        ip_address: ip
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const customer = rows[0];

    // Check lockout
    if (customer.lockout_until && new Date(customer.lockout_until) > new Date()) {
      return res.status(403).json({ error: 'Account temporarily locked due to multiple failed attempts.' });
    }

    const isValid = verifyPassword(password, customer.password_hash);
    if (!isValid) {
      const attempts = (customer.failed_login_attempts || 0) + 1;
      let lockoutUntil = null;
      if (attempts >= SECURITY_CONFIG.otp_max_attempts) { // Using otp_max_attempts or similar for customers
        lockoutUntil = new Date(Date.now() + SECURITY_CONFIG.otp_expiry * 60 * 1000).toISOString();
      }
      
      await db.executePrepared(
        "UPDATE customers SET failed_login_attempts = ?, lockout_until = ? WHERE id = ?",
        [attempts, lockoutUntil, customer.id]
      );

      await AuditLogger.log({
        user_id: customer.id,
        user_type: 'customer',
        event_type: 'CUSTOMER_LOGIN_FAILED',
        description: `Failed login attempt for ${email}. Attempt: ${attempts}`,
        ip_address: ip
      });

      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Success
    await db.executePrepared(
      "UPDATE customers SET failed_login_attempts = 0, lockout_until = NULL, last_login_at = ? WHERE id = ?",
      [new Date().toISOString(), customer.id]
    );

    const token = jwt.sign({ id: customer.id, type: 'customer' }, JWT_SECRET, { expiresIn: '7d' });

    await AuditLogger.log({
      user_id: customer.id,
      user_type: 'customer',
      event_type: 'CUSTOMER_LOGIN_SUCCESS',
      description: `Customer ${customer.full_name} logged in`,
      ip_address: ip,
      user_agent: req.headers['user-agent']
    });

    // Notify Customer about login
    await NotificationService.trigger('security_alert', {
      user_id: customer.id,
      title: 'New Login Detected',
      message: `A new login was detected for your account at ${new Date().toLocaleString()}. If this wasn't you, please change your password immediately.`,
      type: 'security'
    });

    res.json({ success: true, token, customer });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Customer Profile
app.get('/api/customer/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'customer') return res.status(401).json({ error: 'Unauthorized' });

    const rows = await db.executePrepared("SELECT id, full_name, email, phone, status, created_at FROM customers WHERE id = ? LIMIT 1", [decoded.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, customer: rows[0] });
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Customer Messaging APIs
app.get('/api/customer/conversations', requireCustomerAuth, async (req: any, res) => {
  try {
    const customer = req.customer;
    let rows = await db.executePrepared(
      "SELECT * FROM customer_conversations WHERE customer_id = ? LIMIT 1",
      [customer.id]
    );

    if (rows.length === 0) {
      // Create a new conversation if it doesn't exist
      await db.executePrepared(
        "INSERT INTO customer_conversations (customer_id, customer_name, customer_email) VALUES (?, ?, ?)",
        [customer.id, customer.full_name, customer.email]
      );
      rows = await db.executePrepared(
        "SELECT * FROM customer_conversations WHERE customer_id = ? LIMIT 1",
        [customer.id]
      );
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve conversation.' });
  }
});

app.get('/api/customer/messages/:conversationId', requireCustomerAuth, async (req: any, res) => {
  try {
    const { conversationId } = req.params;
    const customer = req.customer;

    // Verify conversation ownership
    const convRows = await db.executePrepared(
      "SELECT id FROM customer_conversations WHERE id = ? AND customer_id = ? LIMIT 1",
      [conversationId, customer.id]
    );

    if (convRows.length === 0) return res.status(403).json({ error: 'Access denied.' });

    const messages = await db.executePrepared(
      "SELECT * FROM customer_messages WHERE conversation_id = ? ORDER BY created_at ASC",
      [conversationId]
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

app.post('/api/customer/messages', requireCustomerAuth, async (req: any, res) => {
  try {
    const { message_text, attachments } = req.body;
    const customer = req.customer;

    if (!message_text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message text or attachment is required.' });
    }

    // Get or create conversation
    let convRows = await db.executePrepared(
      "SELECT id FROM customer_conversations WHERE customer_id = ? LIMIT 1",
      [customer.id]
    );

    let conversationId;
    if (convRows.length === 0) {
      const result = await db.executePrepared(
        "INSERT INTO customer_conversations (customer_id, customer_name, customer_email) VALUES (?, ?, ?)",
        [customer.id, customer.full_name, customer.email]
      );
      conversationId = result.insertId;
    } else {
      conversationId = convRows[0].id;
    }

    // Insert message
    await db.executePrepared(
      "INSERT INTO customer_messages (conversation_id, sender_id, sender_type, message_text, attachments, is_read) VALUES (?, ?, ?, ?, ?, ?)",
      [conversationId, customer.id, 'customer', message_text, attachments ? JSON.stringify(attachments) : null, 0]
    );

    // Update conversation metadata
    await db.executePrepared(
      "UPDATE customer_conversations SET last_message = ?, last_message_at = ?, updated_at = ? WHERE id = ?",
      [message_text || 'Sent an attachment', new Date().toISOString(), new Date().toISOString(), conversationId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// ----------------- REVIEWS API (SHAD GHOR) -----------------

// Public: Get reviews for a product
app.get('/api/customer/reviews/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Resolve product ID and slug
    const prods = await db.executePrepared("SELECT id, slug FROM products WHERE slug = ? OR id = ? LIMIT 1", [productId, productId]);
    const prodId = prods.length > 0 ? prods[0].id : productId;
    const prodSlug = prods.length > 0 ? prods[0].slug : productId;

    const reviews = await db.executePrepared(
      `SELECT * FROM product_reviews 
       WHERE (product_id = ? OR product_id = ?) AND status = 'approved' 
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [prodId, prodSlug, limit, offset]
    );

    const total = await db.executePrepared(
      "SELECT COUNT(*) as count FROM product_reviews WHERE (product_id = ? OR product_id = ?) AND status = 'approved'",
      [prodId, prodSlug]
    );

    res.json({
      success: true,
      reviews,
      total: total.length > 0 ? total[0].count : 0,
      page,
      limit
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve reviews.' });
  }
});

// Customer: Submit a review
app.post('/api/customer/reviews', requireCustomerAuth, async (req: any, res) => {
  try {
    const customer = req.customer;
    const { product_id, product_name, product_image, order_id, rating, title, comment, images } = req.body;

    if (!product_id || !rating || !comment) {
      return res.status(400).json({ error: 'Product ID, rating, and comment are required.' });
    }

    // Check for duplicate review
    const existing = await db.executePrepared(
      "SELECT id FROM product_reviews WHERE customer_id = ? AND product_id = ? LIMIT 1",
      [customer.id, product_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this product.' });
    }

    // Check if verified purchase
    let isVerified = false;
    if (order_id) {
      const order = await db.executePrepared(
        "SELECT status FROM orders WHERE id = ? AND customer_email = ? LIMIT 1",
        [order_id, customer.email]
      );
      if (order.length > 0 && order[0].status === 'Delivered') {
        isVerified = true;
      }
    } else {
      // Automatic verified check based on product in any delivered order
      const orders = await db.executePrepared(
        `SELECT o.id FROM orders o 
         JOIN order_items oi ON o.id = oi.order_id 
         WHERE o.customer_email = ? AND oi.product_id = ? AND o.status = 'Delivered' 
         LIMIT 1`,
        [customer.email, product_id]
      );
      if (orders.length > 0) isVerified = true;
    }

    const now = new Date().toISOString();
    const result = await db.executePrepared(
      `INSERT INTO product_reviews 
       (customer_id, customer_name, customer_avatar, product_id, product_name, product_image, order_id, rating, title, comment, images, status, report_status, is_verified_purchase, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.id, customer.full_name, customer.profile_image || '', 
        product_id, product_name, product_image, order_id || null, 
        rating, title || '', comment, JSON.stringify(images || []), 
        'pending', 'none', isVerified, now, now
      ]
    );

    await AuditLogger.log({
      user_id: customer.id,
      user_type: 'customer',
      event_type: 'REVIEW_SUBMITTED',
      description: `Customer ${customer.full_name} submitted a review for ${product_name}`,
      metadata: { review_id: result.insertId, product_id },
      ip_address: req.ip
    });

    res.json({ success: true, reviewId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// Admin: Get all reviews (with filters)
app.get('/api/admin/reviews', requireAdminAuth, async (req, res) => {
  try {
    const { status, rating, reported, search, page = '1', limit = '20' } = req.query as any;
    const p = parseInt(page);
    const l = parseInt(limit);
    const offset = (p - 1) * l;

    let query = `
      SELECT r.*, c.email as customer_email, c.phone as customer_phone 
      FROM product_reviews r 
      LEFT JOIN customers c ON r.customer_id = c.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += " AND r.status = ?";
      params.push(status);
    }
    if (rating) {
      query += " AND r.rating = ?";
      params.push(parseInt(rating));
    }
    if (reported === 'true') {
      query += " AND r.report_status != 'none'";
    }
    if (search) {
      query += " AND (r.customer_name LIKE ? OR r.product_name LIKE ? OR r.comment LIKE ? OR r.id = ?)";
      const searchVal = `%${search}%`;
      params.push(searchVal, searchVal, searchVal, search);
    }

    query += " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";
    params.push(l, offset);

    const reviews = await db.executePrepared(query, params);
    
    // Count total for pagination
    let countQuery = "SELECT COUNT(*) as count FROM product_reviews WHERE 1=1";
    const countParams: any[] = [];
    if (status) {
      countQuery += " AND status = ?";
      countParams.push(status);
    }
    if (rating) {
      countQuery += " AND rating = ?";
      countParams.push(parseInt(rating));
    }
    if (reported === 'true') {
      countQuery += " AND report_status != 'none'";
    }
    if (search) {
      countQuery += " AND (customer_name LIKE ? OR product_name LIKE ? OR comment LIKE ? OR id = ?)";
      const searchVal = `%${search}%`;
      countParams.push(searchVal, searchVal, searchVal, search);
    }
    const totalCount = await db.executePrepared(countQuery, countParams);

    res.json({
      reviews,
      total: totalCount[0].count,
      page: p,
      limit: l
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve reviews.' });
  }
});

// Admin: Review Stats
app.get('/api/admin/reviews/stats', requireAdminAuth, async (req, res) => {
  try {
    const total = await db.executePrepared("SELECT COUNT(*) as count FROM product_reviews");
    const pending = await db.executePrepared("SELECT COUNT(*) as count FROM product_reviews WHERE status = 'pending'");
    const approved = await db.executePrepared("SELECT COUNT(*) as count FROM product_reviews WHERE status = 'approved'");
    const rejected = await db.executePrepared("SELECT COUNT(*) as count FROM product_reviews WHERE status = 'rejected'");
    const hidden = await db.executePrepared("SELECT COUNT(*) as count FROM product_reviews WHERE status = 'hidden'");
    const reported = await db.executePrepared("SELECT COUNT(*) as count FROM product_reviews WHERE report_status != 'none'");
    const avgRating = await db.executePrepared("SELECT AVG(rating) as avg FROM product_reviews WHERE status = 'approved'");

    res.json({
      total: total[0].count,
      pending: pending[0].count,
      approved: approved[0].count,
      rejected: rejected[0].count,
      hidden: hidden[0].count,
      reported: reported[0].count,
      averageRating: parseFloat(avgRating[0].avg || 0).toFixed(1)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve review statistics.' });
  }
});

// Admin: Bulk update review status
app.post('/api/admin/reviews/bulk-status', requireAdminAuth, async (req: any, res) => {
  try {
    const { ids, status } = req.body;
    const admin = req.admin;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Review IDs are required.' });
    }

    if (!['approved', 'rejected', 'hidden'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const placeholders = ids.map(() => '?').join(',');
    await db.executePrepared(
      `UPDATE product_reviews SET status = ?, updated_at = ? WHERE id IN (${placeholders})`,
      [status, new Date().toISOString(), ...ids]
    );

    // Notifications & Auditing
    for (const id of ids) {
      const review = await db.executePrepared("SELECT customer_id, product_name FROM product_reviews WHERE id = ? LIMIT 1", [id]);
      if (review.length > 0) {
        const eventKey = status === 'approved' ? 'review_approved' : (status === 'rejected' ? 'review_rejected' : null);
        if (eventKey) {
          await NotificationSystem.trigger(eventKey, {
            user_id: review[0].customer_id,
            product_name: review[0].product_name
          });
        }
      }
    }

    await AuditLogger.log({
      user_id: admin.id,
      user_type: 'admin',
      event_type: 'REVIEW_BULK_STATUS_UPDATE',
      description: `Admin bulk updated ${ids.length} reviews to ${status}`,
      metadata: { ids, status }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[Bulk Review Error]', err);
    res.status(500).json({ error: 'Failed to bulk update reviews.' });
  }
});

// Admin: Update review status
app.patch('/api/admin/reviews/:id', requireAdminAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const admin = req.admin;

    if (!['approved', 'rejected', 'hidden'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    await db.executePrepared(
      "UPDATE product_reviews SET status = ?, updated_at = ? WHERE id = ?",
      [status, new Date().toISOString(), id]
    );

    // Notification logic
    const review = await db.executePrepared("SELECT customer_id, product_name FROM product_reviews WHERE id = ? LIMIT 1", [id]);
    if (review.length > 0) {
      const eventKey = status === 'approved' ? 'review_approved' : (status === 'rejected' ? 'review_rejected' : null);
      if (eventKey) {
        await NotificationSystem.trigger(eventKey, {
          user_id: review[0].customer_id,
          product_name: review[0].product_name
        });
      }
    }

    await AuditLogger.log({
      user_id: admin.id,
      user_type: 'admin',
      event_type: 'REVIEW_STATUS_UPDATE',
      description: `Admin updated review #${id} status to ${status}`,
      metadata: { review_id: id, status }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update review status.' });
  }
});

// Admin: Reply to review
app.post('/api/admin/reviews/:id/reply', requireAdminAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const admin = req.admin;

    await db.executePrepared(
      "UPDATE product_reviews SET admin_reply = ?, admin_reply_at = ?, updated_at = ? WHERE id = ?",
      [reply, new Date().toISOString(), new Date().toISOString(), id]
    );

    await AuditLogger.log({
      user_id: admin.id,
      user_type: 'admin',
      event_type: 'REVIEW_REPLY',
      description: `Admin replied to review #${id}`,
      metadata: { review_id: id }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reply to review.' });
  }
});

// Admin: Delete Review
app.delete('/api/admin/reviews/:id', requireAdminAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const admin = req.admin;

    await db.executePrepared("DELETE FROM product_reviews WHERE id = ?", [id]);
    await db.executePrepared("DELETE FROM review_reports WHERE review_id = ?", [id]);

    await AuditLogger.log({
      user_id: admin.id,
      user_type: 'admin',
      event_type: 'REVIEW_DELETE',
      description: `Admin deleted review #${id}`,
      metadata: { review_id: id }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review.' });
  }
});

// Customer: Report a review
app.post('/api/customer/reviews/report', requireCustomerAuth, async (req: any, res) => {
  try {
    const customer = req.customer;
    const { review_id, reason, details } = req.body;

    if (!review_id || !reason) {
      return res.status(400).json({ error: 'Review ID and reason are required.' });
    }

    await db.executePrepared(
      "INSERT INTO review_reports (review_id, reporter_id, reporter_name, reason, details, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [review_id, customer.id, customer.full_name, reason, details || '', 'pending', new Date().toISOString()]
    );

    await db.executePrepared(
      "UPDATE product_reviews SET report_status = 'reported' WHERE id = ?",
      [review_id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to report review.' });
  }
});

// Admin Customer Messages APIs
app.get('/api/admin/customer-messages/conversations', requireAdminAuth, checkPermission('CustomerMessages', 'View'), async (req, res) => {
  try {
    const conversations = await db.executePrepared(
      "SELECT * FROM customer_conversations ORDER BY updated_at DESC"
    );
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve conversations.' });
  }
});

app.get('/api/admin/customer-messages/messages/:conversationId', requireAdminAuth, checkPermission('CustomerMessages', 'View'), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await db.executePrepared(
      "SELECT * FROM customer_messages WHERE conversation_id = ? ORDER BY created_at ASC",
      [conversationId]
    );

    // Mark as read when admin views
    await db.executePrepared(
      "UPDATE customer_messages SET is_read = 1 WHERE conversation_id = ? AND sender_type = 'customer'",
      [conversationId]
    );
    
    await db.executePrepared(
      "UPDATE customer_conversations SET unread_count = 0 WHERE id = ?",
      [conversationId]
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

app.post('/api/admin/customer-messages/reply', requireAdminAuth, checkPermission('CustomerMessages', 'Edit'), async (req: AuthenticatedRequest, res) => {
  try {
    const { conversation_id, message_text, attachments } = req.body;
    const admin = req.admin!;

    if (!message_text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message text or attachment is required.' });
    }

    await db.executePrepared(
      "INSERT INTO customer_messages (conversation_id, sender_id, sender_type, message_text, attachments, is_read) VALUES (?, ?, ?, ?, ?, ?)",
      [conversation_id, admin.id, 'admin', message_text, attachments ? JSON.stringify(attachments) : null, 0]
    );

    await db.executePrepared(
      "UPDATE customer_conversations SET last_message = ?, last_message_at = ?, updated_at = ? WHERE id = ?",
      [message_text || 'Sent an attachment', new Date().toISOString(), new Date().toISOString(), conversation_id]
    );

    await logAdminAction(admin, 'REPLY_CUSTOMER_MESSAGE', 'CustomerMessages', conversation_id, { message_text });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reply.' });
  }
});

app.patch('/api/admin/customer-messages/conversations/:id/status', requireAdminAuth, checkPermission('CustomerMessages', 'Edit'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const admin = req.admin!;

    await db.executePrepared(
      "UPDATE customer_conversations SET status = ? WHERE id = ?",
      [status, id]
    );

    await logAdminAction(admin, 'UPDATE_CONVERSATION_STATUS', 'CustomerMessages', id, { status });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// Customer Orders
app.get('/api/customer/orders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'customer') return res.status(401).json({ error: 'Unauthorized' });

    // Fetch orders belonging ONLY to this customer
    const rows = await db.executePrepared(
      "SELECT * FROM orders WHERE customer_email = (SELECT email FROM customers WHERE id = ?) ORDER BY created_at DESC", 
      [decoded.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// MODULAR ROUTES MOVED TO src/routes/admin/products.ts

// ----------------- ADMIN USERS & ROLES API (GRANULAR RBAC) -----------------

// Get all admin users
app.get('/api/admin/users', requireAdminAuth, checkPermission('AdminUsers', 'View'), async (req: AuthenticatedRequest, res) => {
  try {
    const rows = await db.executePrepared("SELECT id, name, email, phone, role, role_id, status, last_login_at, created_at FROM admin_users ORDER BY created_at DESC", []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

// Create new admin user
app.post('/api/admin/users', requireAdminAuth, checkPermission('AdminUsers', 'Create'), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, email, phone, role, role_id, password, status } = req.body;
    const passwordHash = hashPassword(password);
    
    const result = await db.executePrepared(
      "INSERT INTO admin_users (name, email, phone, password_hash, role, role_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, email, phone, passwordHash, role, role_id, status || 'active', new Date().toISOString(), new Date().toISOString()]
    );

    const newAdmin = { id: (result as any).insertId, name, email, role };
    await logAdminAction(req.admin, 'CREATE', 'AdminUsers', newAdmin.id.toString(), { name, email, role });

    res.json({ success: true, admin: newAdmin });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Update admin user
app.put('/api/admin/users/:id', requireAdminAuth, checkPermission('AdminUsers', 'Edit'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, role_id, status } = req.body;

    await db.executePrepared(
      "UPDATE admin_users SET name = ?, email = ?, phone = ?, role = ?, role_id = ?, status = ?, updated_at = ? WHERE id = ?",
      [name, email, phone, role, role_id, status, new Date().toISOString(), id]
    );

    await logAdminAction(req.admin, 'UPDATE', 'AdminUsers', id, { name, email, role, status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update admin user' });
  }
});

// Delete admin user
app.delete('/api/admin/users/:id', requireAdminAuth, checkPermission('AdminUsers', 'Delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.admin?.id) return res.status(400).json({ error: 'Cannot delete yourself' });

    await db.executePrepared("DELETE FROM admin_users WHERE id = ?", [id]);
    await logAdminAction(req.admin, 'DELETE', 'AdminUsers', id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete admin user' });
  }
});

// Get all roles
app.get('/api/admin/roles', requireAdminAuth, checkPermission('AdminUsers', 'View'), async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM admin_roles ORDER BY id ASC", []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Get role permissions
app.get('/api/admin/roles/:id/permissions', requireAdminAuth, checkPermission('AdminUsers', 'View'), async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.executePrepared(`
      SELECT p.id, p.resource, p.action 
      FROM role_permissions rp
      JOIN admin_permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `, [id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

// Update role permissions
app.put('/api/admin/roles/:id/permissions', requireAdminAuth, checkPermission('AdminUsers', 'Edit'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { permission_ids } = req.body; // Array of IDs

    // Use a transaction or sequential delete/insert
    await db.executePrepared("DELETE FROM role_permissions WHERE role_id = ?", [id]);
    
    for (const pid of permission_ids) {
      await db.executePrepared("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [id, pid]);
    }

    await logAdminAction(req.admin, 'UPDATE_PERMISSIONS', 'Roles', id, { permission_count: permission_ids.length });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
});

// Get all permissions
app.get('/api/admin/permissions', requireAdminAuth, checkPermission('AdminUsers', 'View'), async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM admin_permissions ORDER BY resource, action", []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Get Audit Logs
app.get('/api/admin/audit-logs', requireAdminAuth, checkPermission('Security', 'View'), async (req: AuthenticatedRequest, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 100", []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ----------------- DATABASE & BACKUP API -----------------

// Get database status
app.get('/api/admin/database/status', requireAdminAuth, checkPermission('Database', 'View'), async (req, res) => {
  try {
    const stats = await db.getDatabaseStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch database status' });
  }
});

// Get backup list
app.get('/api/admin/database/backups', requireAdminAuth, checkPermission('Database', 'View'), async (req, res) => {
  try {
    const backups = await db.getBackups();
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
});

// Create manual backup
app.post('/api/admin/database/backup', requireAdminAuth, checkPermission('Database', 'Create'), async (req: AuthenticatedRequest, res) => {
  try {
    const backup = await db.createBackup(req.admin?.name || 'Admin');
    await logAdminAction(req.admin, 'CREATE_BACKUP', 'Database', backup.name);
    res.json({ success: true, backup });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Download backup
app.get('/api/admin/database/backups/:filename/download', requireAdminAuth, checkPermission('Database', 'Export'), async (req: AuthenticatedRequest, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(process.cwd(), 'backups', filename);
    if (!fs.existsSync(backupPath)) return res.status(404).json({ error: 'Backup file not found' });
    
    await logAdminAction(req.admin, 'DOWNLOAD_BACKUP', 'Database', filename);
    res.download(backupPath);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download backup' });
  }
});

// Restore backup
app.post('/api/admin/database/backups/:filename/restore', requireAdminAuth, checkPermission('Database', 'Manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const { filename } = req.params;
    await db.restoreBackup(filename);
    await logAdminAction(req.admin, 'RESTORE_BACKUP', 'Database', filename);
    res.json({ success: true, message: 'Database restored successfully. Server will reload data.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore database' });
  }
});

// Delete backup
app.delete('/api/admin/database/backups/:filename', requireAdminAuth, checkPermission('Database', 'Delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const { filename } = req.params;
    await db.deleteBackup(filename);
    await logAdminAction(req.admin, 'DELETE_BACKUP', 'Database', filename);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// ----------------- AUTOMATED DATABASE BACKUP SCHEDULER -----------------
const runAutoBackup = async () => {
  try {
    const settingsRows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['backup_auto_enabled']);
    if (!settingsRows || settingsRows.length === 0 || settingsRows[0].config_value !== 'true') return;

    const frequencyRows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['backup_frequency']);
    const frequency = frequencyRows[0]?.config_value || 'Daily';

    const lastAutoBackupRows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['last_auto_backup_at']);
    const lastBackup = lastAutoBackupRows[0]?.config_value ? new Date(lastAutoBackupRows[0].config_value) : new Date(0);
    
    const now = new Date();
    let shouldBackup = false;

    if (frequency === 'Daily') {
      shouldBackup = (now.getTime() - lastBackup.getTime()) > 24 * 60 * 60 * 1000;
    } else if (frequency === 'Weekly') {
      shouldBackup = (now.getTime() - lastBackup.getTime()) > 7 * 24 * 60 * 60 * 1000;
    } else if (frequency === 'Monthly') {
      shouldBackup = (now.getTime() - lastBackup.getTime()) > 30 * 24 * 60 * 60 * 1000;
    }

    if (shouldBackup) {
      console.log(`[Auto Backup] Starting ${frequency} backup...`);
      await db.createBackup('SYSTEM');
      await db.executePrepared("UPDATE site_settings SET config_value = ? WHERE config_key = ?", [now.toISOString(), 'last_auto_backup_at']);
      await AuditLogger.log({
        event_type: 'BACKUP_AUTO_SUCCESS',
        description: `Automatic ${frequency} backup completed successfully by System`,
        user_type: 'system'
      });
    }
  } catch (err) {
    console.error('[Auto Backup Error] ', err);
  }
};

// Check every hour
setInterval(runAutoBackup, 60 * 60 * 1000);
// Admin Order Status Update MOVED


// Mock Checkout API for Testing Notifications
app.post('/api/checkout', async (req, res) => {
  try {
    const { 
      customer_name, customer_email, customer_phone,
      house_number, road_area, ward_number, thana, district, post_code,
      payment_method, payment_details,
      subtotal, delivery_charge, total_amount, items 
    } = req.body;
    
    const orderId = `ORD-${Date.now()}`;
    const createdAt = new Date().toISOString();

    await db.executePrepared(
      `INSERT INTO orders (
        id, customer_name, customer_email, customer_phone, 
        house_number, road_area, ward_number, thana, district, post_code,
        payment_method, payment_details,
        subtotal, delivery_charge, total_amount, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, customer_name, customer_email, customer_phone,
        house_number, road_area, ward_number, thana, district, post_code,
        payment_method, JSON.stringify(payment_details || {}),
        subtotal, delivery_charge, total_amount, 'Pending', createdAt
      ]
    );

    // Save order items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await db.executePrepared(
          "INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)",
          [orderId, item.id, item.name, item.quantity, item.price]
        );
      }
    }

    // 1. Notify Customer
    await NotificationService.trigger('order_placed', {
      user_id: 1, // Mock
      customer_name: customer_name,
      order_id: orderId,
      order_total: total_amount,
      link: `#/account/orders/${orderId}`
    });

    // 2. Notify Admin
    await NotificationService.trigger('admin_new_order', {
      order_id: orderId,
      order_total: total_amount,
      link: `#/admin/orders`
    });

    res.json({ success: true, orderId });
  } catch (err) {
    console.error('[Checkout API Error] ', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Admin Create Product MOVED

// Admin Tracking Configuration: Facebook Pixel
app.get('/api/admin/tracking/facebook', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['facebook_pixel']);
    if (rows && rows.length > 0) {
      const config = JSON.parse(rows[0].config_value);
      // Mask access token for security
      if (config.accessToken) {
        config.accessToken = config.accessToken.substring(0, 8) + '****************' + config.accessToken.substring(config.accessToken.length - 8);
      }
      res.json({ facebook: config });
    } else {
      res.json({ 
        facebook: {
          enabled: false,
          pixelId: '',
          accessToken: '',
          testEventCode: '',
          verified: false,
          events: {
            pageView: true,
            viewContent: true,
            search: true,
            addToCart: true,
            initiateCheckout: true,
            addPaymentInfo: true,
            purchase: true
          }
        } 
      });
    }
  } catch (err) {
    console.error('[API Get FB Pixel Config Error] ', err);
    res.status(500).json({ error: 'Failed to retrieve tracking configuration.' });
  }
});

app.put('/api/admin/tracking/facebook', requireAdminAuth, async (req, res) => {
  try {
    const { facebook } = req.body;
    if (!facebook) return res.status(400).json({ error: 'Missing configuration payload.' });

    // Handle masked token preservation
    if (facebook.accessToken && facebook.accessToken.includes('****************')) {
      const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['facebook_pixel']);
      if (rows && rows.length > 0) {
        const oldConfig = JSON.parse(rows[0].config_value);
        facebook.accessToken = oldConfig.accessToken;
      }
    }

    // Backend Validation
    if (facebook.enabled) {
      if (!facebook.pixelId || !/^\d+$/.test(facebook.pixelId)) {
        return res.status(400).json({ error: 'Valid Numeric Meta Pixel ID is required.' });
      }
      if (!facebook.accessToken || facebook.accessToken.length < 15) {
        return res.status(400).json({ error: 'Valid Conversions API Access Token is required.' });
      }
    }

    // Reset verified status if credentials change
    const existingRows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['facebook_pixel']);
    if (existingRows && existingRows.length > 0) {
      const oldConfig = JSON.parse(existingRows[0].config_value);
      if (oldConfig.pixelId !== facebook.pixelId || oldConfig.accessToken !== facebook.accessToken) {
        facebook.verified = false;
      }
    }

    if (!facebook.enabled) {
      facebook.verified = false;
    }

    const configValue = JSON.stringify(facebook);
    const rows = await db.executePrepared("SELECT id FROM site_settings WHERE config_key = ? LIMIT 1", ['facebook_pixel']);
    
    if (rows && rows.length > 0) {
      await db.executePrepared(
        "UPDATE site_settings SET config_value = ?, updated_at = ? WHERE config_key = ?",
        [configValue, new Date().toISOString(), 'facebook_pixel']
      );
    } else {
      await db.executePrepared(
        "INSERT INTO site_settings (config_key, config_value, created_at) VALUES (?, ?, ?)",
        ['facebook_pixel', configValue, new Date().toISOString()]
      );
    }

    res.json({ success: true, message: 'Facebook Pixel configuration saved successfully.' });
  } catch (err) {
    console.error('[API Update FB Pixel Config Error] ', err);
    res.status(500).json({ error: 'Failed to save tracking configuration.' });
  }
});

// TikTok Pixel Configuration Endpoints
app.get('/api/admin/tracking/tiktok', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['tiktok_pixel']);
    if (rows && rows.length > 0) {
      const config = JSON.parse(rows[0].config_value);
      if (config.accessToken) {
        config.accessToken = config.accessToken.substring(0, 8) + '****************' + config.accessToken.substring(config.accessToken.length - 8);
      }
      res.json({ tiktok: config });
    } else {
      res.json({ 
        tiktok: {
          enabled: false,
          pixelId: '',
          accessToken: '',
          testEventCode: '',
          verified: false,
          events: {
            pageView: true,
            viewContent: true,
            search: true,
            addToCart: true,
            initiateCheckout: true,
            addPaymentInfo: true,
            completePayment: true
          }
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch TikTok config' });
  }
});

app.put('/api/admin/tracking/tiktok', requireAdminAuth, async (req, res) => {
  try {
    const { tiktok } = req.body;
    if (!tiktok) return res.status(400).json({ error: 'Missing configuration payload.' });

    if (tiktok.accessToken && tiktok.accessToken.includes('****************')) {
      const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['tiktok_pixel']);
      if (rows && rows.length > 0) {
        const oldConfig = JSON.parse(rows[0].config_value);
        tiktok.accessToken = oldConfig.accessToken;
      }
    }

    if (tiktok.enabled) {
      if (!tiktok.pixelId || tiktok.pixelId.length < 5) {
        return res.status(400).json({ error: 'Valid TikTok Pixel ID is required.' });
      }
      if (!tiktok.accessToken || tiktok.accessToken.length < 15) {
        return res.status(400).json({ error: 'Access Token is required for TikTok API integration.' });
      }
    }

    const existingRows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['tiktok_pixel']);
    if (existingRows && existingRows.length > 0) {
      const oldConfig = JSON.parse(existingRows[0].config_value);
      if (oldConfig.pixelId !== tiktok.pixelId || oldConfig.accessToken !== tiktok.accessToken) {
        tiktok.verified = false;
      }
    }

    if (!tiktok.enabled) {
      tiktok.verified = false;
    }

    const configValue = JSON.stringify(tiktok);
    const rows = await db.executePrepared("SELECT id FROM site_settings WHERE config_key = ? LIMIT 1", ['tiktok_pixel']);
    
    if (rows && rows.length > 0) {
      await db.executePrepared("UPDATE site_settings SET config_value = ? WHERE config_key = ?", [configValue, 'tiktok_pixel']);
    } else {
      await db.executePrepared("INSERT INTO site_settings (config_key, config_value) VALUES (?, ?)", ['tiktok_pixel', configValue]);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update TikTok config' });
  }
});


// Google Analytics Configuration Endpoints
app.get('/api/admin/tracking/google', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['google_analytics']);
    if (rows && rows.length > 0) {
      res.json({ google: JSON.parse(rows[0].config_value) });
    } else {
      res.json({ 
        google: {
          enabled: false,
          measurementId: '',
          verified: false
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Google config' });
  }
});

app.put('/api/admin/tracking/google', requireAdminAuth, async (req, res) => {
  try {
    const { google } = req.body;
    if (!google) return res.status(400).json({ error: 'Missing configuration payload.' });

    // Backend Validation
    if (google.enabled) {
      if (!google.measurementId || !/^G-[A-Z0-9]+$/i.test(google.measurementId)) {
        return res.status(400).json({ error: 'Valid GA4 Measurement ID (G-XXXXXXXXXX) is required.' });
      }
    }

    const configValue = JSON.stringify(google);
    const rows = await db.executePrepared("SELECT id FROM site_settings WHERE config_key = ? LIMIT 1", ['google_analytics']);
    
    if (rows && rows.length > 0) {
      await db.executePrepared("UPDATE site_settings SET config_value = ? WHERE config_key = ?", [configValue, 'google_analytics']);
    } else {
      await db.executePrepared("INSERT INTO site_settings (config_key, config_value) VALUES (?, ?)", ['google_analytics', configValue]);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update Google config' });
  }
});

// Website Tracking Configuration Endpoints
app.get('/api/admin/tracking/website', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['website_tracking']);
    if (rows && rows.length > 0) {
      res.json({ website: JSON.parse(rows[0].config_value) });
    } else {
      res.json({ 
        website: {
          enabled: false,
          gtmId: '',
          headScript: '',
          bodyScript: '',
          footerScript: '',
          verified: false
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Website tracking config' });
  }
});

app.put('/api/admin/tracking/website', requireAdminAuth, async (req, res) => {
  try {
    const { website } = req.body;
    if (!website) return res.status(400).json({ error: 'Missing configuration payload.' });

    // Backend Validation
    if (website.enabled && website.gtmId) {
      if (!/^GTM-[A-Z0-9]+$/i.test(website.gtmId)) {
        return res.status(400).json({ error: 'Invalid GTM Container ID format (GTM-XXXXXXX).' });
      }
    }

    const configValue = JSON.stringify(website);
    const rows = await db.executePrepared("SELECT id FROM site_settings WHERE config_key = ? LIMIT 1", ['website_tracking']);
    
    if (rows && rows.length > 0) {
      await db.executePrepared("UPDATE site_settings SET config_value = ? WHERE config_key = ?", [configValue, 'website_tracking']);
    } else {
      await db.executePrepared("INSERT INTO site_settings (config_key, config_value) VALUES (?, ?)", ['website_tracking', configValue]);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update Website tracking config' });
  }
});


// Admin Tracking Verification: Facebook
app.post('/api/admin/tracking/facebook/verify', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['facebook_pixel']);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Config not found.' });

    const config = JSON.parse(rows[0].config_value);
    if (!config.pixelId || !config.accessToken) return res.status(400).json({ error: 'Incomplete configuration.' });

    // Real check: Try to fetch pixel info from Meta Graph API
    const response = await fetch(`https://graph.facebook.com/v17.0/${config.pixelId}?access_token=${config.accessToken}`);
    const data = await response.json();

    if (response.ok && data.id) {
      // Mark as verified in DB
      config.verified = true;
      await db.executePrepared("UPDATE site_settings SET config_value = ? WHERE config_key = ?", [JSON.stringify(config), 'facebook_pixel']);
      res.json({ success: true, message: 'Facebook Pixel verified successfully.' });
    } else {
      res.status(400).json({ success: false, error: data.error?.message || 'Invalid Pixel ID or Access Token.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// Admin Tracking Verification: TikTok
app.post('/api/admin/tracking/tiktok/verify', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['tiktok_pixel']);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Config not found.' });

    const config = JSON.parse(rows[0].config_value);
    if (!config.pixelId || !config.accessToken) return res.status(400).json({ error: 'Incomplete configuration.' });

    // Real check: Ping TikTok Business API
    const response = await fetch(`https://business-api.tiktok.com/open_api/v1.3/pixel/info/?pixel_code=${config.pixelId}`, {
      headers: { 'Access-Token': config.accessToken }
    });
    const data = await response.json();

    if (response.ok && data.code === 0) {
      config.verified = true;
      await db.executePrepared("UPDATE site_settings SET config_value = ? WHERE config_key = ?", [JSON.stringify(config), 'tiktok_pixel']);
      res.json({ success: true, message: 'TikTok Pixel verified successfully.' });
    } else {
      res.status(400).json({ success: false, error: data.message || 'Invalid TikTok credentials.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// Admin Tracking Verification: Google
app.post('/api/admin/tracking/google/verify', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['google_analytics']);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Config not found.' });

    const config = JSON.parse(rows[0].config_value);
    if (!config.measurementId) return res.status(400).json({ error: 'Missing Measurement ID.' });

    // Simple check: Verify if the GTAG script is accessible for this ID
    const response = await fetch(`https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`);
    
    if (response.ok) {
      config.verified = true;
      await db.executePrepared("UPDATE site_settings SET config_value = ? WHERE config_key = ?", [JSON.stringify(config), 'google_analytics']);
      res.json({ success: true, message: 'Google Analytics 4 verified successfully.' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid Measurement ID.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// Admin Tracking Verification: Website
app.post('/api/admin/tracking/website/verify', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['website_tracking']);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Config not found.' });

    const config = JSON.parse(rows[0].config_value);
    
    // Website tracking is "verified" if scripts are saved and optionally GTM is valid
    if (config.gtmId) {
      const response = await fetch(`https://www.googletagmanager.com/gtm.js?id=${config.gtmId}`);
      if (!response.ok) return res.status(400).json({ error: 'Invalid GTM ID.' });
    }

    config.verified = true;
    await db.executePrepared("UPDATE site_settings SET config_value = ? WHERE config_key = ?", [JSON.stringify(config), 'website_tracking']);
    res.json({ success: true, message: 'Website Tracking verified.' });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// Public Tracking Endpoints
app.get('/api/tracking/config', async (req, res) => {
  try {
    const fbRows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['facebook_pixel']);
    const ttRows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['tiktok_pixel']);
    const gaRows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['google_analytics']);
    const wsRows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['website_tracking']);
    
    const response: any = {};
    
    if (fbRows && fbRows.length > 0) {
      const fbConfig = JSON.parse(fbRows[0].config_value);
      response.facebook = {
        enabled: fbConfig.enabled,
        pixelId: fbConfig.pixelId,
        testEventCode: fbConfig.testEventCode,
        events: fbConfig.events
      };
    }

    if (ttRows && ttRows.length > 0) {
      const ttConfig = JSON.parse(ttRows[0].config_value);
      response.tiktok = {
        enabled: ttConfig.enabled,
        pixelId: ttConfig.pixelId,
        testEventCode: ttConfig.testEventCode,
        events: ttConfig.events
      };
    }

    if (gaRows && gaRows.length > 0) {
      const gaConfig = JSON.parse(gaRows[0].config_value);
      response.google = {
        enabled: gaConfig.enabled,
        measurementId: gaConfig.measurementId,
        verified: gaConfig.verified || false
      };
    }

    if (wsRows && wsRows.length > 0) {
      const wsConfig = JSON.parse(wsRows[0].config_value);
      response.website = {
        enabled: wsConfig.enabled,
        gtmId: wsConfig.gtmId,
        headScript: wsConfig.headScript,
        bodyScript: wsConfig.bodyScript,
        footerScript: wsConfig.footerScript
      };
    }

    res.json(response);
  } catch (err) {
    res.json({ error: 'Failed to load tracking config' });
  }
});

// Facebook Conversions API (CAPI) Proxy
app.post('/api/tracking/capi', async (req, res) => {
  const { eventName, eventData, url, userAgent, eventId } = req.body;
  const ip = req.ip || '127.0.0.1';

  try {
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['facebook_pixel']);
    if (!rows || rows.length === 0) return res.end();

    const config = JSON.parse(rows[0].config_value);
    if (!config.enabled || !config.pixelId || !config.accessToken) return res.end();

    const payload = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: url,
        action_source: 'website',
        user_data: {
          client_user_agent: userAgent,
          client_ip_address: ip
        },
        custom_data: {
          ...eventData,
          test_event_code: config.testEventCode || undefined
        }
      }]
    };

    await fetch(`https://graph.facebook.com/v17.0/${config.pixelId}/events?access_token=${config.accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).end();
  }
});

// TikTok Events API Proxy
app.post('/api/tracking/tiktok-events', async (req, res) => {
  try {
    const { eventName, eventData, url, userAgent, eventId } = req.body;
    const ip = req.ip || '127.0.0.1';
    
    const rows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['tiktok_pixel']);
    if (rows && rows.length > 0) {
      const config = JSON.parse(rows[0].config_value);
      if (config.enabled && config.accessToken && config.pixelId) {
        const ttEventName = eventName === 'Purchase' ? 'CompletePayment' : eventName;
        
        const payload = {
          pixel_code: config.pixelId,
          event: ttEventName,
          event_id: eventId,
          timestamp: new Date().toISOString(),
          context: {
            page: { url: url },
            user_agent: userAgent,
            ip: ip
          },
          properties: {
            ...eventData
          }
        };

        if (config.testEventCode) {
          (payload as any).test_event_code = config.testEventCode;
        }

        const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
          method: 'POST',
          headers: {
            'Access-Token': config.accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        return res.json({ success: true, tiktok: result });
      }
    }
    res.json({ success: false, message: 'TikTok integration not active' });
  } catch (err) {
    res.json({ success: false, error: 'Failed to trigger TikTok Events API' });
  }
});

// Support Tickets APIs

// CUSTOMER ROUTES
app.get('/api/customer/tickets', requireCustomerAuth, async (req: any, res) => {
  try {
    const tickets = await db.executePrepared(
      "SELECT * FROM support_tickets WHERE customer_id = ? ORDER BY updated_at DESC",
      [req.customer.id]
    );
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

app.post('/api/customer/tickets', requireCustomerAuth, async (req: any, res) => {
  try {
    const { subject, category, description, priority, related_order_id, attachments } = req.body;
    const ticket_id = `SG-T-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const result = await db.executePrepared(
      "INSERT INTO support_tickets (ticket_id, customer_id, customer_name, customer_email, customer_phone, subject, category, description, priority, related_order_id, attachments, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)",
      [
        ticket_id,
        req.customer.id,
        req.customer.full_name,
        req.customer.email,
        req.customer.phone,
        subject,
        category,
        description,
        priority || 'normal',
        related_order_id || null,
        attachments ? JSON.stringify(attachments) : null,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    const ticketId = result.insertId;

    // Create first reply from customer
    await db.executePrepared(
      "INSERT INTO ticket_replies (ticket_id, sender_id, sender_type, sender_name, message_text, attachments, created_at) VALUES (?, ?, 'customer', ?, ?, ?, ?)",
      [ticketId, req.customer.id, req.customer.full_name, description, attachments ? JSON.stringify(attachments) : null, new Date().toISOString()]
    );

    // Notify admins
    await db.executePrepared(
      "INSERT INTO notifications (user_id, user_type, title, message, type, link, related_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [null, 'admin', 'New Support Ticket', `Customer ${req.customer.full_name} created a new ticket: ${subject}`, 'info', `#/admin/support/tickets/${ticketId}`, ticketId.toString()]
    );

    res.json({ success: true, ticket_id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

app.get('/api/customer/tickets/:id', requireCustomerAuth, async (req: any, res) => {
  try {
    const ticketId = Number(req.params.id);
    const tickets = await db.executePrepared(
      "SELECT * FROM support_tickets WHERE id = ? AND customer_id = ? LIMIT 1",
      [ticketId, req.customer.id]
    );

    if (tickets.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    const replies = await db.executePrepared(
      "SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC",
      [ticketId]
    );

    res.json({ ...tickets[0], replies });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ticket details' });
  }
});

app.post('/api/customer/tickets/:id/reply', requireCustomerAuth, async (req: any, res) => {
  try {
    const ticketId = Number(req.params.id);
    const { message_text, attachments } = req.body;

    const tickets = await db.executePrepared("SELECT id FROM support_tickets WHERE id = ? AND customer_id = ? LIMIT 1", [ticketId, req.customer.id]);
    if (tickets.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    await db.executePrepared(
      "INSERT INTO ticket_replies (ticket_id, sender_id, sender_type, sender_name, message_text, attachments, created_at) VALUES (?, ?, 'customer', ?, ?, ?, ?)",
      [ticketId, req.customer.id, req.customer.full_name, message_text, attachments ? JSON.stringify(attachments) : null, new Date().toISOString()]
    );

    await db.executePrepared(
      "UPDATE support_tickets SET status = 'waiting_for_admin', updated_at = ? WHERE id = ?",
      [new Date().toISOString(), ticketId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// ADMIN ROUTES
app.get('/api/admin/support-tickets', requireAdminAuth, checkPermission('SupportTickets', 'View'), async (req, res) => {
  try {
    const tickets = await db.executePrepared("SELECT * FROM support_tickets ORDER BY updated_at DESC");
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

app.get('/api/admin/support-tickets/:id', requireAdminAuth, checkPermission('SupportTickets', 'View'), async (req: any, res) => {
  try {
    const ticketId = Number(req.params.id);
    const tickets = await db.executePrepared("SELECT * FROM support_tickets WHERE id = ? LIMIT 1", [ticketId]);
    if (tickets.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    const replies = await db.executePrepared("SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC", [ticketId]);
    const customers = await db.executePrepared("SELECT id, full_name, email, phone, status, created_at FROM customers WHERE id = ? LIMIT 1", [tickets[0].customer_id]);

    let order = null;
    if (tickets[0].related_order_id) {
      const orders = await db.executePrepared("SELECT * FROM orders WHERE id = ? LIMIT 1", [tickets[0].related_order_id]);
      if (orders.length > 0) order = orders[0];
    }

    res.json({ ...tickets[0], replies, customer: customers[0], order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ticket details' });
  }
});

app.patch('/api/admin/support-tickets/:id', requireAdminAuth, checkPermission('SupportTickets', 'Edit'), async (req: any, res) => {
  try {
    const ticketId = Number(req.params.id);
    const { status, priority, assigned_staff_id, assigned_staff_name, internal_notes } = req.body;

    let updateFields = [];
    let params = [];

    if (status) {
      updateFields.push("status = ?");
      params.push(status);
      if (status === 'resolved') {
        updateFields.push("resolved_at = ?");
        params.push(new Date().toISOString());
      } else if (status === 'closed') {
        updateFields.push("closed_at = ?");
        params.push(new Date().toISOString());
      }
    }
    if (priority) {
      updateFields.push("priority = ?");
      params.push(priority);
    }
    if (assigned_staff_id !== undefined) {
      updateFields.push("assigned_staff_id = ?");
      params.push(assigned_staff_id);
      updateFields.push("assigned_staff_name = ?");
      params.push(assigned_staff_name);
    }
    if (internal_notes !== undefined) {
      updateFields.push("internal_notes = ?");
      params.push(internal_notes);
    }

    if (updateFields.length === 0) return res.json({ success: true });

    await db.executePrepared(
      `UPDATE support_tickets SET ${updateFields.join(', ')}, updated_at = ? WHERE id = ?`,
      [...params, new Date().toISOString(), ticketId]
    );

    // Log action
    // @ts-ignore
    await logAdminAction(req.admin, 'UPDATE_TICKET', 'SupportTickets', ticketId.toString(), req.body);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

app.post('/api/admin/support-tickets/:id/reply', requireAdminAuth, checkPermission('SupportTickets', 'Edit'), async (req: any, res) => {
  try {
    const ticketId = Number(req.params.id);
    const { message_text, attachments } = req.body;

    const tickets = await db.executePrepared("SELECT * FROM support_tickets WHERE id = ? LIMIT 1", [ticketId]);
    if (tickets.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    await db.executePrepared(
      "INSERT INTO ticket_replies (ticket_id, sender_id, sender_type, sender_name, message_text, attachments, created_at) VALUES (?, ?, 'admin', ?, ?, ?, ?)",
      [ticketId, req.admin.id, req.admin.name, message_text, attachments ? JSON.stringify(attachments) : null, new Date().toISOString()]
    );

    await db.executePrepared(
      "UPDATE support_tickets SET status = 'waiting_for_customer', updated_at = ?, first_response_at = COALESCE(first_response_at, ?) WHERE id = ?",
      [new Date().toISOString(), new Date().toISOString(), ticketId]
    );

    // Notify customer
    await db.executePrepared(
      "INSERT INTO notifications (user_id, user_type, title, message, type, link, related_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [tickets[0].customer_id, 'customer', 'New Support Ticket Reply', `Agent ${req.admin.name} replied to your ticket: ${tickets[0].subject}`, 'info', `#/support/tickets/${ticketId}`, ticketId.toString()]
    );

    // Log action
    // @ts-ignore
    await logAdminAction(req.admin, 'REPLY_TICKET', 'SupportTickets', ticketId.toString(), { message_text });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// ----------------- CLIENT SERVING -----------------

// Helper to seed translations
const seedTranslations = async () => {
  try {
    const bn = TRANSLATIONS.bn as Record<string, string>;
    const en = TRANSLATIONS.en as Record<string, string>;
    const keys = Object.keys({ ...en, ...bn });
    
    for (const key of keys) {
      let category = 'General';
      if (key.toLowerCase().includes('login') || key.toLowerCase().includes('register') || key.toLowerCase().includes('otp') || key.toLowerCase().includes('account') || key.toLowerCase().includes('password') || key.toLowerCase().includes('name') || key.toLowerCase().includes('phone') || key.toLowerCase().includes('gender')) {
        category = 'Customer Account';
      } else if (key.toLowerCase().includes('order')) category = 'Orders';
      else if (key.toLowerCase().includes('cart')) category = 'Cart';
      else if (key.toLowerCase().includes('support') || key.toLowerCase().includes('ticket') || key.toLowerCase().includes('chat')) category = 'Support';
      else if (key.toLowerCase().includes('policy') || key.toLowerCase().includes('terms')) category = 'Navigation';
      else if (key === 'home' || key === 'categories' || key === 'offers') category = 'Navigation';

      const enVal = en[key] || '';
      const bnVal = bn[key] || '';

      await db.executePrepared(
        `INSERT INTO translations (translation_key, category, en, bn, created_at) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE en = VALUES(en), bn = VALUES(bn)`,
        [key, category, enVal, bnVal, new Date().toISOString()]
      );
    }
    console.log('[Seed] Translations synced successfully.');
  } catch (err) {
    console.error('[Seed Translations Error] ', err);
  }
};

// Helper to seed notification templates
const seedNotificationTemplates = async () => {
  try {
    const rows = await db.executePrepared("SELECT COUNT(*) as count FROM notification_templates");
    if (rows[0].count === 0) {
      console.log('[Seed] Seeding notification templates...');
      const templates = [
        { key: 'order_placed', t_en: 'Order Placed', m_en: 'Your order #{{order_id}} has been placed successfully.', t_bn: 'অর্ডার প্লেস করা হয়েছে', m_bn: 'আপনার অর্ডার #{{order_id}} সফলভাবে সম্পন্ন হয়েছে।' },
        { key: 'order_confirmed', t_en: 'Order Confirmed', m_en: 'Your order #{{order_id}} has been confirmed.', t_bn: 'অর্ডার নিশ্চিত করা হয়েছে', m_bn: 'আপনার অর্ডার #{{order_id}} নিশ্চিত করা হয়েছে।' },
        { key: 'order_shipped', t_en: 'Order Shipped', m_en: 'Your order #{{order_id}} is on the way!', t_bn: 'অর্ডার পাঠানো হয়েছে', m_bn: 'আপনার অর্ডার #{{order_id}} পাঠানো হয়েছে!' },
        { key: 'order_delivered', t_en: 'Order Delivered', m_en: 'Your order #{{order_id}} has been delivered.', t_bn: 'অর্ডার ডেলিভারি হয়েছে', m_bn: 'আপনার অর্ডার #{{order_id}} ডেলিভারি সম্পন্ন হয়েছে।' },
        { key: 'admin_new_order', t_en: 'New Order Received', m_en: 'New order #{{order_id}} worth {{currency}}{{order_total}}.', t_bn: 'নতুন অর্ডার পাওয়া গেছে', m_bn: 'নতুন অর্ডার #{{order_id}}, মূল্য {{currency}}{{order_total}}।' },
        { key: 'admin_low_stock', t_en: 'Low Stock Alert', m_en: '{{product_name}} is running low on stock.', t_bn: 'লো-স্টক অ্যালার্ট', m_bn: '{{product_name}}-এর স্টক কমে গেছে।' },
        { key: 'review_approved', t_en: 'Review Approved', m_en: 'Your review for {{product_name}} has been approved! Thank you.', t_bn: 'রিভিউ অনুমোদিত হয়েছে', m_bn: '{{product_name}}-এর জন্য আপনার রিভিউ অনুমোদিত হয়েছে! ধন্যবাদ।' },
        { key: 'review_rejected', t_en: 'Review Rejected', m_en: 'Your review for {{product_name}} was not approved.', t_bn: 'রিভিউ প্রত্যাখ্যাত হয়েছে', m_bn: '{{product_name}}-এর জন্য আপনার রিভিউটি অনুমোদিত হয়নি।' }
      ];
      for (const t of templates) {
        await db.executePrepared(
          "INSERT INTO notification_templates (event_key, title_en, message_en, title_bn, message_bn, enabled, channels) VALUES (?, ?, ?, ?, ?, 1, 'in_app')",
          [t.key, t.t_en, t.m_en, t.t_bn, t.m_bn]
        );
      }
      console.log('[Seed] Notification templates seeded.');
    }
  } catch (err) {
    console.error('[Seed Notification Templates Error] ', err);
  }
};

async function startServer() {
  // Seed database
  await ensurePlatonTableExists();
  await seedTranslations();
  await seedNotificationTemplates();
  await syncSecurityConfig();

  // Static Serving for Uploads (Media/Avatars/Products)
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  if (process.env.NODE_ENV !== 'production') {
    // Development Mode: Mount Vite's HMR and Asset Serving middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode: Static file hosting and fallback route resolution
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Shad Ghor Server] Ready and listening on port ${PORT}`);
  });
}

startServer();
