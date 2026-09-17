import { db } from './mysql';

async function seed() {
  console.log('--- Starting Food Demo Data Seeding V2 ---');

  // 1. CLEANUP
  console.log('Cleaning up existing data...');
  await db.executePrepared('DELETE FROM products');
  await db.executePrepared('DELETE FROM homepage_banners');
  await db.executePrepared('DELETE FROM categories');
  await db.executePrepared('DELETE FROM homepage_sections');

  // 1.5 SEED HOMEPAGE SECTIONS
  const sections = [
    { key: 'hero_slider', title_en: 'Hero Slider', title_bn: 'হিরো স্লাইডার', order: 1, config: null },
    { key: 'category_banner', title_en: 'Category Carousel', title_bn: 'ক্যাটাগরি ক্যারোজেল', order: 2, config: { interval: 3 } },
    { key: 'fast_sell', title_en: 'Flash Sale', title_bn: 'ফ্ল্যাশ সেল', order: 3, config: null },
    { key: 'category_products', title_en: 'Category Products', title_bn: 'ক্যাটাগরি পণ্য', order: 4, config: null }
  ];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    await db.executePrepared(
      'INSERT INTO homepage_sections (section_key, title_en, title_bn, enabled, sort_order, config) VALUES (?, ?, ?, ?, ?, ?)',
      [s.key, s.title_en, s.title_bn, 1, s.order, s.config ? JSON.stringify(s.config) : null]
    );
  }
  console.log(`Inserted ${sections.length} homepage sections.`);

  // 2. SEED CATEGORIES
  const categories = [
    { id: 'cat_dry_foods', name: 'Dry Foods', name_bn: 'শুকনো ফল', slug: 'dry-foods', img: 'https://images.unsplash.com/photo-1590005024862-6b67679a29fb?w=400&h=400&fit=crop' },
    { id: 'cat_kitchen_essentials', name: 'Kitchen Essentials', name_bn: 'রান্নাঘর সামগ্রী', slug: 'kitchen-essentials', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop' },
    { id: 'cat_grocery', name: 'Grocery', name_bn: 'মুদি বাজার', slug: 'grocery', img: 'https://images.unsplash.com/photo-1586201327693-86619addc25b?w=400&h=400&fit=crop' },
    { id: 'cat_home_kitchen', name: 'Home & Kitchen', name_bn: 'হোম ও কিচেন', slug: 'home-kitchen', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop' },
    { id: 'cat_beauty_personal', name: 'Beauty & Personal Care', name_bn: 'বিউটি ও কেয়ার', slug: 'beauty-personal-care', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop' }
  ];

  for (const c of categories) {
    await db.executePrepared(
      'INSERT INTO categories (id, name, name_bn, slug, image_url, status, sort_order, is_featured, show_on_homepage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [c.id, c.name, c.name_bn, c.slug, c.img, 'active', 0, 1, 1]
    );
  }
  console.log(`Inserted ${categories.length} categories.`);

  // 3. SEED BANNERS
  // Hero Banners
  const heroBanners = [
    { name: 'Pure Honey', head_en: '100% Organic Honey', head_bn: '১০০% অর্গানিক মধু', img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1200&h=400&fit=crop' },
    { name: 'Pure Spices', head_en: 'Authentic Spices', head_bn: 'খাঁটি মসলা সমাহার', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&h=400&fit=crop' }
  ];

  for (let i = 0; i < heroBanners.length; i++) {
    const b = heroBanners[i];
    await db.executePrepared(
      'INSERT INTO homepage_banners (name, image_url_desktop, image_url_mobile, heading_en, heading_bn, description_en, description_bn, alt_en, alt_bn, category_id, button_text_en, button_text_bn, button_link, destination_type, display_location, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [b.name, b.img, b.img, b.head_en, b.head_bn, 'Premium Quality', 'প্রিমিয়াম কোয়ালিটি', b.name, b.name, null, 'Shop Now', 'এখনই কিনুন', '#/categories', 'categories', 'homepage_hero', 'active', i + 1]
    );
  }

  // Category Banners
  const catBanners = categories.map((c, i) => ({
    name: `${c.name} Collection`,
    img_d: c.img.replace('w=400&h=400', 'w=1200&h=400'),
    img_m: c.img.replace('w=400&h=400', 'w=600&h=400'),
    head_en: c.name,
    head_bn: c.name_bn,
    cat_id: c.id
  }));

  for (let i = 0; i < catBanners.length; i++) {
    const b = catBanners[i];
    await db.executePrepared(
      'INSERT INTO homepage_banners (name, image_url_desktop, image_url_mobile, heading_en, heading_bn, description_en, description_bn, alt_en, alt_bn, category_id, button_text_en, button_text_bn, button_link, destination_type, display_location, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [b.name, b.img_d, b.img_m, b.head_en, b.head_bn, '', '', b.name, b.name, b.cat_id, 'Shop Now', 'এখনই কিনুন', `#/category/${categories.find(cat => cat.id === b.cat_id)?.slug}`, 'category', 'category_banner', 'active', i + 1]
    );
  }
  console.log(`Inserted ${heroBanners.length} hero banners and ${catBanners.length} category banners.`);

  // 4. SEED PRODUCTS
  const productTemplates = [
    // Dry Foods
    { name: 'Dry Mix', bn: 'ড্রাই মিক্স', cat: 'Dry Foods', price: 750, img: 'https://images.unsplash.com/photo-1590005024862-6b67679a29fb?w=600&h=600&fit=crop', badge: 'Natural' },
    { name: 'Dried Raisins', bn: 'কিশমিশ', cat: 'Dry Foods', price: 350, img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=600&fit=crop', badge: 'Fresh' },
    { name: 'Premium Dates', bn: 'আজওয়া খেজুর', cat: 'Dry Foods', price: 850, img: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=600&h=600&fit=crop', badge: 'Best Seller' },
    { name: 'Cashew Nuts', bn: 'কাজু বাদাম', cat: 'Dry Foods', price: 950, img: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&h=600&fit=crop', badge: 'Roasted' },
    { name: 'Almond', bn: 'কাঠ বাদাম', cat: 'Dry Foods', price: 850, img: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&h=600&fit=crop', badge: 'Premium' },
    { name: 'Pistachio', bn: 'পেস্তা বাদাম', cat: 'Dry Foods', price: 1200, img: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&h=600&fit=crop', badge: 'Special' },
    { name: 'Walnut', bn: 'আখরোট', cat: 'Dry Foods', price: 1100, img: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&h=600&fit=crop', badge: 'Healthy' },
    { name: 'Dry Fruits Mix', bn: 'ড্রাই ফ্রুট মিক্স', cat: 'Dry Foods', price: 1500, img: 'https://images.unsplash.com/photo-1590005024862-6b67679a29fb?w=600&h=600&fit=crop', badge: 'Value Pack' },

    // Kitchen Essentials
    { name: 'Pressure Cooker', bn: 'প্রেসার কুকার', cat: 'Kitchen Essentials', price: 2500, img: 'https://images.unsplash.com/photo-1584990344448-a5c174fc982c?w=600&h=600&fit=crop', badge: 'Durable' },
    { name: 'Frying Pan', bn: 'ফ্রাইং প্যান', cat: 'Kitchen Essentials', price: 1200, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=600&fit=crop', badge: 'Non-stick' },
    { name: 'Knife Set', bn: 'ছুরি সেট', cat: 'Kitchen Essentials', price: 850, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=600&fit=crop', badge: 'Sharp' },
    { name: 'Storage Container', bn: 'স্টোরেজ বক্স', cat: 'Kitchen Essentials', price: 450, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=600&fit=crop', badge: 'BPA Free' },
    { name: 'Kitchen Organizer', bn: 'কিচেন র‍্যাক', cat: 'Kitchen Essentials', price: 1500, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=600&fit=crop', badge: 'Save Space' },
    { name: 'Water Bottle', bn: 'পানির বোতল', cat: 'Kitchen Essentials', price: 250, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=600&fit=crop', badge: 'Premium' },

    // Grocery
    { name: 'Rice', bn: 'চাল', cat: 'Grocery', price: 85, img: 'https://images.unsplash.com/photo-1586201327693-86619addc25b?w=600&h=600&fit=crop', badge: 'Premium' },
    { name: 'Mustard Oil', bn: 'সরিষার তেল', cat: 'Grocery', price: 220, img: 'https://images.unsplash.com/photo-1474979266404-7ea9bcd8203c?w=600&h=600&fit=crop', badge: 'Cold Pressed' },
    { name: 'Honey', bn: 'মধু', cat: 'Grocery', price: 950, img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=600&fit=crop', badge: 'Sundarban' },
    { name: 'Ghee', bn: 'ঘি', cat: 'Grocery', price: 1650, img: 'https://images.unsplash.com/photo-1622484211148-197a70f2a4b1?w=600&h=600&fit=crop', badge: 'Pure' },
    { name: 'Lentils', bn: 'মসুর ডাল', cat: 'Grocery', price: 140, img: 'https://images.unsplash.com/photo-1586201327693-86619addc25b?w=600&h=600&fit=crop', badge: 'Native' },
    { name: 'Spices', bn: 'মসলা', cat: 'Grocery', price: 120, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=600&fit=crop', badge: 'Organic' }
  ];

  // Fill up to 60 products (12 per category)
  const allProducts = [];
  categories.forEach(cat => {
    const catTemplates = productTemplates.filter(t => t.cat === cat.name);
    for (let i = 0; i < 12; i++) {
      const base = catTemplates[i % catTemplates.length] || productTemplates[i % productTemplates.length];
      allProducts.push({
        ...base,
        cat: cat.name,
        name: i < catTemplates.length ? base.name : `${base.name} - Pack ${i}`,
        bn: i < catTemplates.length ? base.bn : `${base.bn} - প্যাক ${i}`,
        price: base.price + (Math.random() * 20)
      });
    }
  });

  for (let i = 0; i < allProducts.length; i++) {
    const t = allProducts[i];
    const id = `food_v2_${i + 1}`;
    const slug = t.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const rating = (4 + Math.random()).toFixed(1);
    const reviews = Math.floor(Math.random() * 50) + 5;
    const isFastSale = i % 5 === 0 ? 1 : 0;
    const isFeatured = i % 3 === 0 ? 1 : 0;
    
    await db.executePrepared(
      'INSERT INTO products (id, name, name_bn, price, old_price, image_url, category, brand, badge, stock_quantity, unit, status, featured, description, seo_title, seo_description, slug, rating, view_count, review_count, short_description, is_fast_sale, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, t.name, t.bn, t.price, t.price + 50, t.img, t.cat, 'Shad Ghor', t.badge || '100% Pure', 50, 'kg', 'active', isFeatured, 
        `${t.name} - High quality organic product from Shad Ghor. Naturally sourced and carefully packed.`, '', '', slug, rating, 100 + i, reviews, `${t.name} - Fresh & Pure.`, isFastSale, new Date().toISOString()
      ]
    );
  }
  console.log(`Inserted ${allProducts.length} food products.`);

  console.log('--- Seeding Complete ---');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
