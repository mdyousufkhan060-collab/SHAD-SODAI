const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'src', 'db', 'simulated_mysql_server.json');

const DEMO_PRODUCTS = [
  {
    id: "shad_df_01",
    name: "Premium Medjool Dates Jumbo",
    name_bn: "প্রিমিয়াম মেদজুল খেজুর জাম্বো",
    slug: "premium-medjool-dates-jumbo",
    category: "Dry Food",
    category_id: "cat_dry_foods",
    brand: "SHAD GHOR",
    price: 850,
    old_price: 980,
    stock_quantity: 65,
    unit: "500g",
    badge: "Best Seller",
    status: "active",
    featured: true,
    is_fast_sale: 1,
    rating: 4.9,
    review_count: 58,
    view_count: 840,
    sku: "SG-MD-500",
    image_url: "https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=800&h=800&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800&h=800&fit=crop"
    ]),
    short_description: "১০০% খাঁটি ও রসালো জাম্বো সাইজ প্রিমিয়াম মেদজুল খেজুর, প্রাকৃতিক শক্তিবর্ধক।",
    description: "স্বাদ ঘর সরাসরি মধ্যপ্রাচ্যের বিশ্বস্ত বাগান থেকে বাছাইকৃত প্রিমিয়াম মেদজুল খেজুর সংগ্রহ করে। নরম, রসালো ও কোনো ধরনের কৃত্রিম চিনি বা রাসায়নিক প্রিজারভেটিভ ছাড়া নিখুঁতভাবে প্যাকিং করা। প্রতিদিনের স্বাস্থ্যকর পুষ্টির জন্য অতুলনীয়।",
    key_features: JSON.stringify([
      "১০০% প্রাকৃতিকভাবে রোদে শুকানো জর্ডানি মেদজুল খেজুর",
      "উচ্চ পটাশিয়াম ও ডায়েটরি ফাইবার সমৃদ্ধ",
      "কোনো রাসায়নিক মোম বা কৃত্রিম মিষ্টি নেই",
      "প্রতিদিনের স্বাস্থ্যকর নাশতা ও তাৎক্ষণিক শক্তিবর্ধক"
    ]),
    specifications: JSON.stringify({
      "Product Type": "Dry Food / Dates",
      "Brand": "SHAD GHOR",
      "Net Weight": "500g",
      "Origin": "Jordan / Middle East",
      "Shelf Life": "12 Months",
      "Storage": "Cool & dry airtight container"
    }),
    ingredients: "100% Pure Natural Medjool Dates",
    variants: JSON.stringify([
      { name: "250g", weight: "250g", price: 450, old_price: 520, stock: 40, sku: "SG-MD-250" },
      { name: "500g", weight: "500g", price: 850, old_price: 980, stock: 65, sku: "SG-MD-500", is_default: true },
      { name: "1kg", weight: "1kg", price: 1650, old_price: 1900, stock: 25, sku: "SG-MD-1000" }
    ]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "shad_df_02",
    name: "Royal Roasted Salted Cashews",
    name_bn: "রয়েল রোস্টেড সল্টেড কাজুবাদাম",
    slug: "royal-roasted-salted-cashews",
    category: "Dry Food",
    category_id: "cat_dry_foods",
    brand: "SHAD GHOR",
    price: 620,
    old_price: 720,
    stock_quantity: 45,
    unit: "250g",
    badge: "Popular",
    status: "active",
    featured: true,
    is_fast_sale: 1,
    rating: 4.8,
    review_count: 42,
    view_count: 670,
    sku: "SG-CS-250",
    image_url: "https://images.unsplash.com/photo-1536591375315-1b8368157762?w=800&h=800&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1536591375315-1b8368157762?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=800&h=800&fit=crop"
    ]),
    short_description: "মুচমুচে হালকা লবণাক্ত রোস্টেড বড় দানার সেরা কাজুবাদাম।",
    description: "স্বাদ ঘরের বিশেষ তাওয়ায় হালকা আঁচে ভাজা ডাব্লিউ-২৪০ গ্রেডের বড় দানার প্রিমিয়াম কাজুবাদাম। হালকা পিঙ্ক সল্ট দিয়ে সুস্বাদু ক্রাঞ্চি ফ্লেভার তৈরি করা, যা মুখে দিলেই অসাধারণ স্বাদ পাওয়া যায়।",
    key_features: JSON.stringify([
      "বড় দানার গোটা কাজুবাদাম (W240 Grade)",
      "হিমালয়ান পিঙ্ক সল্ট দিয়ে হালকা রোস্ট করা",
      "স্বাস্থ্যকর ফ্যাট ও প্রোটিনের সেরা উৎস",
      "বিকেলের নাস্তায় সেরা পুষ্টিকর ক্রাঞ্চি স্ন্যাক্স"
    ]),
    specifications: JSON.stringify({
      "Product Type": "Dry Food / Nuts",
      "Brand": "SHAD GHOR",
      "Net Weight": "250g",
      "Origin": "Vietnam / Premium Import",
      "Shelf Life": "9 Months"
    }),
    ingredients: "Whole Cashew Nuts, Pink Rock Salt",
    variants: JSON.stringify([
      { name: "250g", weight: "250g", price: 620, old_price: 720, stock: 45, sku: "SG-CS-250", is_default: true },
      { name: "500g", weight: "500g", price: 1200, old_price: 1400, stock: 30, sku: "SG-CS-500" },
      { name: "1kg", weight: "1kg", price: 2350, old_price: 2700, stock: 15, sku: "SG-CS-1000" }
    ]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "shad_df_03",
    name: "California Roasted Almonds",
    name_bn: "ক্যালিফোর্নিয়া রোস্টেড কাঠবাদাম",
    slug: "california-roasted-almonds",
    category: "Dry Food",
    category_id: "cat_dry_foods",
    brand: "SHAD GHOR",
    price: 540,
    old_price: 640,
    stock_quantity: 80,
    unit: "250g",
    badge: "Heart Healthy",
    status: "active",
    featured: true,
    is_fast_sale: 0,
    rating: 4.9,
    review_count: 64,
    view_count: 910,
    sku: "SG-AL-250",
    image_url: "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=800&h=800&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1536591375315-1b8368157762?w=800&h=800&fit=crop"
    ]),
    short_description: "ক্যালিফোর্নিয়ার এ-গ্রেড মিষ্টি ও ক্রাঞ্চি রোস্টেড কাঠবাদাম।",
    description: "ক্যালিফোর্নিয়া থেকে সরাসরি আমদানিকৃত সেরা মানের কাঠবাদাম। তেল ছাড়া শুকনো তাওয়ায় হালকা রোস্ট করে প্যাকেজিং করা, যাতে প্রাকৃতিক ভিটামিন ও খনিজ পুরোপুরি অটুট থাকে।",
    key_features: JSON.stringify([
      "ভিটামিন-ই ও ম্যাগনেসিয়াম সমৃদ্ধ",
      "স্মৃতিশক্তি ও হার্টের সুরক্ষায় অত্যন্ত উপকারী",
      "জিরো কোলেস্টেরল ও নো অ্যাডেড অয়েল",
      "এয়ারটাইট হাইজেনিক প্যাক"
    ]),
    specifications: JSON.stringify({
      "Product Type": "Dry Food / Nuts",
      "Brand": "SHAD GHOR",
      "Net Weight": "250g",
      "Origin": "California, USA",
      "Shelf Life": "12 Months"
    }),
    ingredients: "100% California Whole Almonds",
    variants: JSON.stringify([
      { name: "250g", weight: "250g", price: 540, old_price: 640, stock: 80, sku: "SG-AL-250", is_default: true },
      { name: "500g", weight: "500g", price: 1050, old_price: 1250, stock: 50, sku: "SG-AL-500" },
      { name: "1kg", weight: "1kg", price: 2050, old_price: 2400, stock: 20, sku: "SG-AL-1000" }
    ]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "shad_df_04",
    name: "Super Energy Dry Fruit & Nut Medley",
    name_bn: "সুপার এনার্জি ড্রাই ফ্রুট ও নাট মিক্স",
    slug: "super-energy-dry-fruit-nut-medley",
    category: "Dry Food",
    category_id: "cat_dry_foods",
    brand: "SHAD GHOR",
    price: 680,
    old_price: 800,
    stock_quantity: 55,
    unit: "500g",
    badge: "Super Food",
    status: "active",
    featured: true,
    is_fast_sale: 1,
    rating: 5.0,
    review_count: 82,
    view_count: 1200,
    sku: "SG-MIX-500",
    image_url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&h=800&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800&h=800&fit=crop"
    ]),
    short_description: "কাঠবাদাম, কাজুবাদাম, পেস্তা, কিসমিস ও শুকনো ফলের রাজকীয় মিশ্রণ।",
    description: "স্বাদ ঘরের স্পেশাল ব্লেন্ড যা প্রতিদিনের কর্মব্যস্ত জীবনে তাৎক্ষণিক শক্তি জোগায়। এতে রয়েছে কাঠবাদাম, কাজু, পেস্তা, আখরোট, গোল্ডেন কিসমিস, কালো কিসমিস, ড্রাই ম্যাঙ্গো ও আলুবোখারা।",
    key_features: JSON.stringify([
      "৮টি প্রিমিয়াম ড্রাই ফ্রুটস ও বাদামের সুষম মিশ্রণ",
      "প্রাকৃতিক অ্যান্টিঅক্সিডেন্ট ও উদ্ভিজ্জ প্রোটিনে ভরপুর",
      "শিশুদের টিফিন ও বড়দের পুষ্টিকর নাস্তায় সেরা",
      "১০০% প্রাকৃতিক ও কেমিক্যালমুক্ত"
    ]),
    specifications: JSON.stringify({
      "Product Type": "Mixed Dry Fruits",
      "Brand": "SHAD GHOR",
      "Net Weight": "500g",
      "Origin": "Multi-Origin Premium",
      "Shelf Life": "9 Months"
    }),
    ingredients: "Almonds, Cashews, Pistachios, Walnuts, Raisins, Dried Mango, Dried Dates",
    variants: JSON.stringify([
      { name: "250g", weight: "250g", price: 360, old_price: 420, stock: 40, sku: "SG-MIX-250" },
      { name: "500g", weight: "500g", price: 680, old_price: 800, stock: 55, sku: "SG-MIX-500", is_default: true },
      { name: "1kg", weight: "1kg", price: 1320, old_price: 1550, stock: 25, sku: "SG-MIX-1000" }
    ]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "shad_df_05",
    name: "Iranian Roasted Pistachios (Akbari)",
    name_bn: "ইরানি রোস্টেড পেস্তাবাদাম (আকবরী)",
    slug: "iranian-roasted-pistachios-akbari",
    category: "Dry Food",
    category_id: "cat_dry_foods",
    brand: "SHAD GHOR",
    price: 750,
    old_price: 890,
    stock_quantity: 35,
    unit: "250g",
    badge: "Premium",
    status: "active",
    featured: true,
    is_fast_sale: 1,
    rating: 4.9,
    review_count: 38,
    view_count: 530,
    sku: "SG-PIS-250",
    image_url: "https://images.unsplash.com/photo-1525904097878-94fb15835963?w=800&h=800&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1525904097878-94fb15835963?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1536591375315-1b8368157762?w=800&h=800&fit=crop"
    ]),
    short_description: "ইরানের বিশ্বখ্যাত লম্বা দানার আকবরী রোস্টেড পেস্তাবাদাম।",
    description: "ইরানের বিশ্বখ্যাত প্রাকৃতিক খোলামুখ আকবরী পেস্তাবাদাম। নিখুঁতভাবে রোস্ট করা, যা সহজে খোসা ছাড়ানো যায় এবং মুখে চমৎকার সুঘ্রাণযুক্ত কুড়মুড়ে ফ্লেভার উপহার দেয়।",
    key_features: JSON.stringify([
      "বড় দানার অরিজিনাল ইরানি খোলামুখ পেস্তা",
      "লবণাক্ত হালকা রোস্ট ও সহজে খোসা ছাড়ানো যায়",
      "ভিটামিন বি৬, পটাসিয়াম ও অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ",
      "নো আর্টিফিশিয়াল কালার বা ফ্লেভার"
    ]),
    specifications: JSON.stringify({
      "Product Type": "Dry Food / Nuts",
      "Brand": "SHAD GHOR",
      "Net Weight": "250g",
      "Origin": "Iran",
      "Shelf Life": "12 Months"
    }),
    ingredients: "Iranian Pistachios in Shell, Light Himalayan Salt",
    variants: JSON.stringify([
      { name: "250g", weight: "250g", price: 750, old_price: 890, stock: 35, sku: "SG-PIS-250", is_default: true },
      { name: "500g", weight: "500g", price: 1450, old_price: 1700, stock: 20, sku: "SG-PIS-500" }
    ]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "shad_df_06",
    name: "Crispy Vacuum-Dried Jackfruit",
    name_bn: "মুচমুচে ভ্যাকুয়াম-ড্রাইড কাঁঠাল",
    slug: "crispy-vacuum-dried-jackfruit",
    category: "Dry Food",
    category_id: "cat_dry_foods",
    brand: "SHAD GHOR",
    price: 380,
    old_price: 450,
    stock_quantity: 40,
    unit: "200g",
    badge: "100% Natural",
    status: "active",
    featured: true,
    is_fast_sale: 0,
    rating: 4.8,
    review_count: 29,
    view_count: 420,
    sku: "SG-JK-200",
    image_url: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&h=800&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&h=800&fit=crop"
    ]),
    short_description: "গাজীপুরের পাকা মিষ্টি কাঁঠালের কুড়মুড়ে তেলমুক্ত ড্রাই চিপস।",
    description: "ভ্যাকুয়াম ফ্রিজ ড্রায়ার প্রযুক্তিতে তৈরি খাঁটি দেশি পাকা কাঁঠালের ক্রাঞ্চি চিপস। কোনো তেল ছাড়াই প্রস্তুত করায় কাঁঠালের আসল পুষ্টি, ঘ্রাণ ও প্রাকৃতিকভাবে মিষ্টি স্বাদ শতভাগ বজায় থাকে।",
    key_features: JSON.stringify([
      "তেলমুক্ত ও কুড়মুড়ে ক্রাঞ্চি টেক্সচার",
      "খাঁটি দেশি পাকা কাঁঠালের আসল সুবাস",
      "ভিটামিন সি ও প্রাকৃতিক খাদ্যআঁশ সমৃদ্ধ",
      "কোনো কৃত্রিম রং, ফ্লেভার বা চিনি নেই"
    ]),
    specifications: JSON.stringify({
      "Product Type": "Dried Fruit",
      "Brand": "SHAD GHOR",
      "Net Weight": "200g",
      "Origin": "Gazipur, Bangladesh",
      "Shelf Life": "8 Months"
    }),
    ingredients: "100% Ripe Bangladeshi Jackfruit",
    variants: JSON.stringify([
      { name: "100g", weight: "100g", price: 200, old_price: 240, stock: 50, sku: "SG-JK-100" },
      { name: "200g", weight: "200g", price: 380, old_price: 450, stock: 40, sku: "SG-JK-200", is_default: true }
    ]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "shad_df_07",
    name: "Dried Golden Mango Slices",
    name_bn: "ড্রাইড গোল্ডেন আম স্লাইস",
    slug: "dried-golden-mango-slices",
    category: "Dry Food",
    category_id: "cat_dry_foods",
    brand: "SHAD GHOR",
    price: 390,
    old_price: 480,
    stock_quantity: 45,
    unit: "200g",
    badge: "Sweet & Chewy",
    status: "active",
    featured: true,
    is_fast_sale: 1,
    rating: 4.9,
    review_count: 33,
    view_count: 510,
    sku: "SG-MG-200",
    image_url: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&h=800&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&h=800&fit=crop"
    ]),
    short_description: "রাজশাহীর পাকা মিষ্টি আমের প্রাকৃতিক ড্রাই স্লাইস।",
    description: "গাছে পাকা মিষ্টি আমের স্লাইস আধুনিক ড্রায়ারে স্বাস্থ্যসম্মত উপায়ে শুকিয়ে প্রস্তুত। কোনো বাড়তি চিনি বা প্রিজারভেটিভ ছাড়াই বছরজুড়ে আমের অতুলনীয় আসল স্বাদ উপভোগ করুন।",
    key_features: JSON.stringify([
      "১০০% রাজশাহী ও চাঁপাইনবাবগঞ্জের পাকা আম",
      "নরম ও মিষ্টি চিউই টেক্সচার",
      "অতিরিক্ত চিনি ও কৃত্রিম গন্ধমুক্ত",
      "স্বাস্থ্যকর ফলের নাস্তা ও ডেজার্ট উপাদান"
    ]),
    specifications: JSON.stringify({
      "Product Type": "Dried Fruit",
      "Brand": "SHAD GHOR",
      "Net Weight": "200g",
      "Origin": "Rajshahi, Bangladesh",
      "Shelf Life": "9 Months"
    }),
    ingredients: "Selected Sweet Ripe Mango Slices",
    variants: JSON.stringify([
      { name: "200g", weight: "200g", price: 390, old_price: 480, stock: 45, sku: "SG-MG-200", is_default: true },
      { name: "500g", weight: "500g", price: 920, old_price: 1100, stock: 25, sku: "SG-MG-500" }
    ]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "shad_df_08",
    name: "Afghan Golden Long Raisins (Kishmish)",
    name_bn: "আফগান গোল্ডেন লম্বা কিসমিস",
    slug: "afghan-golden-long-raisins-kishmish",
    category: "Dry Food",
    category_id: "cat_dry_foods",
    brand: "SHAD GHOR",
    price: 290,
    old_price: 360,
    stock_quantity: 70,
    unit: "250g",
    badge: "Premium Grade",
    status: "active",
    featured: true,
    is_fast_sale: 0,
    rating: 4.8,
    review_count: 45,
    view_count: 610,
    sku: "SG-RS-250",
    image_url: "https://images.unsplash.com/photo-1584990344448-a5c174fc982c?w=800&h=800&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1584990344448-a5c174fc982c?w=800&h=800&fit=crop"
    ]),
    short_description: "আফগানিস্তানের মিষ্টি ও রসালো লম্বা দানার গোল্ডেন কিসমিস।",
    description: "আফগানিস্তানের বিশ্বমানের সুমিষ্ট সবুজ ও সোনালী আঙ্গুর থেকে উৎপাদিত লম্বা দানার কিসমিস। পায়েস, সেমাই, পোলাও বা প্রতিদিনের স্ন্যাক্সে এনে দেয় চমৎকার মিষ্টতা ও পুষ্টি।",
    key_features: JSON.stringify([
      "বড় ও লম্বা দানার অরিজিনাল আফগান কিসমিস",
      "প্রাকৃতিক ফ্রুক্টোজ সমৃদ্ধ এনার্জি বুস্টার",
      "হজম প্রক্রিয়া ও রক্তস্বল্পতা দূর করতে সহায়ক",
      "ধুলোবালি ও সালফার কেমিক্যাল মুক্ত"
    ]),
    specifications: JSON.stringify({
      "Product Type": "Dry Food",
      "Brand": "SHAD GHOR",
      "Net Weight": "250g",
      "Origin": "Kandahar, Afghanistan",
      "Shelf Life": "12 Months"
    }),
    ingredients: "100% Afghan Golden Sun-Dried Raisins",
    variants: JSON.stringify([
      { name: "250g", weight: "250g", price: 290, old_price: 360, stock: 70, sku: "SG-RS-250", is_default: true },
      { name: "500g", weight: "500g", price: 550, old_price: 680, stock: 45, sku: "SG-RS-500" },
      { name: "1kg", weight: "1kg", price: 1050, old_price: 1300, stock: 25, sku: "SG-RS-1000" }
    ]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "shad_df_09",
    name: "Turkish Sun-Dried Figs (Anjeer)",
    name_bn: "তুর্কি সান-ড্রাইড ডুমুর (আঞ্জির)",
    slug: "turkish-sun-dried-figs-anjeer",
    category: "Dry Food",
    category_id: "cat_dry_foods",
    brand: "SHAD GHOR",
    price: 580,
    old_price: 690,
    stock_quantity: 40,
    unit: "250g",
    badge: "High Fiber",
    status: "active",
    featured: true,
    is_fast_sale: 1,
    rating: 4.9,
    review_count: 36,
    view_count: 570,
    sku: "SG-FIG-250",
    image_url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&h=800&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&h=800&fit=crop"
    ]),
    short_description: "তুরস্কের নরম ও মিষ্টি আঁশযুক্ত প্রিমিয়াম সান-ড্রাইড আঞ্জির।",
    description: "উচ্চ ক্যালসিয়াম, আয়রন ও ফাইবার সমৃদ্ধ আসল তুর্কি আঞ্জির। রাতে দুধ বা পানিতে ভিজিয়ে সকালে খেলে পেট পরিষ্কার রাখে, হাড় মজবুত করে ও দুর্বলতা দূর করে।",
    key_features: JSON.stringify([
      "তুর্কি এ-গ্রেড বড় আকারের নরম ডুমুর",
      "প্রচুর ডায়েটরি ফাইবার, আয়রন ও ক্যালসিয়াম",
      "হৃদরোগ ও রক্তচাপ নিয়ন্ত্রণে অত্যন্ত কার্যকর",
      "কোনো কৃত্রিম রং বা ক্ষতিকর প্রিজারভেটিভ নেই"
    ]),
    specifications: JSON.stringify({
      "Product Type": "Dry Food",
      "Brand": "SHAD GHOR",
      "Net Weight": "250g",
      "Origin": "Izmir, Turkey",
      "Shelf Life": "10 Months"
    }),
    ingredients: "100% Natural Turkish Dried Figs",
    variants: JSON.stringify([
      { name: "250g", weight: "250g", price: 580, old_price: 690, stock: 40, sku: "SG-FIG-250", is_default: true },
      { name: "500g", weight: "500g", price: 1120, old_price: 1320, stock: 25, sku: "SG-FIG-500" }
    ]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "shad_df_10",
    name: "Organic Raw Chia Seeds",
    name_bn: "অর্গানিক কাঁচা চিয়া সিড",
    slug: "organic-raw-chia-seeds",
    category: "Dry Food",
    category_id: "cat_dry_foods",
    brand: "SHAD GHOR",
    price: 340,
    old_price: 420,
    stock_quantity: 90,
    unit: "250g",
    badge: "Weight Loss",
    status: "active",
    featured: true,
    is_fast_sale: 1,
    rating: 4.9,
    review_count: 52,
    view_count: 780,
    sku: "SG-CHIA-250",
    image_url: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800&h=800&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800&h=800&fit=crop"
    ]),
    short_description: "ওমেগা-৩ ও ডায়েটরি ফাইবারে ভরপুর প্রিমিয়াম অর্গানিক চিয়া সিড।",
    description: "দক্ষিণ আমেরিকা থেকে সংগৃহীত কালো ও সাদা দানার পরিচ্ছন্ন ওমেগা-৩ রিচ চিয়া সিড। দ্রুত ওজন নিয়ন্ত্রণে, সারাদিন এনার্জি ধরে রাখতে ও হার্ট সুস্থ রাখতে পানির সাথে মিশিয়ে পান করুন।",
    key_features: JSON.stringify([
      "১০০% খাঁটি ও পরিষ্কার দানার চিয়া সিড",
      "ওমেগা-৩ ফ্যাটি এসিড ও ফাইবার সমৃদ্ধ",
      "পানিতে ভিজিয়ে খাওয়ার উপযোগী",
      "ওজন নিয়ন্ত্রণে পরীক্ষিত পুষ্টিকর সুপারফুড"
    ]),
    specifications: JSON.stringify({
      "Product Type": "Super Food / Seeds",
      "Brand": "SHAD GHOR",
      "Net Weight": "250g",
      "Origin": "Mexico / South America",
      "Shelf Life": "18 Months"
    }),
    ingredients: "100% Organic Raw Chia Seeds",
    variants: JSON.stringify([
      { name: "250g", weight: "250g", price: 340, old_price: 420, stock: 90, sku: "SG-CHIA-250", is_default: true },
      { name: "500g", weight: "500g", price: 640, old_price: 800, stock: 60, sku: "SG-CHIA-500" },
      { name: "1kg", weight: "1kg", price: 1200, old_price: 1500, stock: 30, sku: "SG-CHIA-1000" }
    ]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

function seed() {
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (!dbData.products) dbData.products = [];

  // Remove any existing ones with these IDs so we can prepend freshly
  const demoIds = new Set(DEMO_PRODUCTS.map(p => p.id));
  dbData.products = dbData.products.filter(p => !demoIds.has(p.id));

  // Prepend demo products at the front
  dbData.products.unshift(...DEMO_PRODUCTS);

  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
  console.log(`Successfully seeded ${DEMO_PRODUCTS.length} realistic SHAD GHOR dry-food demo products!`);
  console.log(`Total products now in DB: ${dbData.products.length}`);
}

seed();
