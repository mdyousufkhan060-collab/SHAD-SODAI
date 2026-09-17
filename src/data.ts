import { Product, Category, Banner } from './types';

export const BANNERS: Banner[] = [
  { 
    id: '1', 
    title: "প্রাকৃতিক মধু এখন SHAD GHOR-এ", 
    description: "১০০% খাঁটি ও প্রাকৃতিক সুন্দরবনের মধু সরাসরি আপনার টেবিলে।",
    imageUrl: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=1200&h=500&fit=crop", 
    buttonText: "সংগ্রহ করুন",
    buttonLink: "/category/honey",
    sortOrder: 1,
    status: 'active'
  },
  { 
    id: '2', 
    title: "খাঁটি ঘি — আপনার পরিবারের জন্য", 
    description: "ঐতিহ্যবাহী পদ্ধতিতে তৈরি সুগন্ধি ও স্বাস্থ্যকর প্রিমিয়াম ঘি।",
    imageUrl: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=1200&h=500&fit=crop", 
    buttonText: "ক্রয় করুন",
    buttonLink: "/category/ghee",
    sortOrder: 2,
    status: 'active'
  },
  { 
    id: '3', 
    title: "বিশুদ্ধ মসলা, প্রতিদিনের রান্নায়", 
    description: "বাছাইকৃত উপাদান থেকে প্রস্তুত শতভাগ আসল গুড়া মসলা।",
    imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821c058721?w=1200&h=500&fit=crop", 
    buttonText: "অর্ডার করুন",
    buttonLink: "/category/spices",
    sortOrder: 3,
    status: 'active'
  },
  { 
    id: '4', 
    title: "দেশি ও প্রাকৃতিক খাবার সরাসরি ঘরে", 
    description: "আপনার বিশ্বস্ত শপ SHAD GHOR থেকে সেরা পণ্যটি বেছে নিন।",
    imageUrl: "https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=1200&h=500&fit=crop", 
    buttonText: "মেনু দেখুন",
    buttonLink: "/shop",
    sortOrder: 4,
    status: 'active'
  },
];

export const CATEGORIES: Category[] = [
  { id: '1', name: 'মধু', slug: 'honey', imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop', status: 'active', sortOrder: 1 },
  { id: '2', name: 'তেল ও ঘি', slug: 'oil-ghee', imageUrl: 'https://images.unsplash.com/photo-1622484211148-197a70f2a4b1?w=300&h=300&fit=crop', status: 'active', sortOrder: 2 },
  { id: '3', name: 'খেজুর', slug: 'dates', imageUrl: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=300&h=300&fit=crop', status: 'active', sortOrder: 3 },
  { id: '4', name: 'বাদাম ও বীজ', slug: 'nuts-seeds', imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=300&h=300&fit=crop', status: 'active', sortOrder: 4 },
  { id: '5', name: 'মসলা', slug: 'spices', imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821c058721?w=300&h=300&fit=crop', status: 'active', sortOrder: 5 },
  { id: '6', name: 'বেভারেজ', slug: 'beverages', imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=300&fit=crop', status: 'active', sortOrder: 6 },
  { id: '7', name: 'শুকনো ফল', slug: 'dry-fruits', imageUrl: 'https://images.unsplash.com/photo-1595124253363-c596eed14e1a?w=300&h=300&fit=crop', status: 'active', sortOrder: 7 },
  { id: '8', name: 'প্রাকৃতিক খাদ্য', slug: 'natural-foods', imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=300&fit=crop', status: 'active', sortOrder: 8 },
  { id: '9', name: 'ফাংশনাল ফুড', slug: 'functional-foods', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop', status: 'active', sortOrder: 9 },
  { id: '10', name: 'স্ন্যাকস', slug: 'snacks', imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bb087?w=300&h=300&fit=crop', status: 'active', sortOrder: 10 },
  { id: '11', name: 'চাল ও শস্য', slug: 'rice-grains', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop', status: 'active', sortOrder: 11 },
  { id: '12', name: 'অর্গানিক পণ্য', slug: 'organic-products', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop', status: 'active', sortOrder: 12 },
  { id: '13', name: 'আচার', slug: 'pickles', imageUrl: 'https://images.unsplash.com/photo-1589135799752-6dc6df187b9b?w=300&h=300&fit=crop', status: 'active', sortOrder: 13 },
  { id: '14', name: 'চা ও কফি', slug: 'tea-coffee', imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=300&fit=crop', status: 'active', sortOrder: 14 },
  { id: '15', name: 'বেকারি', slug: 'bakery', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop', status: 'active', sortOrder: 15 },
  { id: '16', name: 'মুদি সামগ্রী', slug: 'grocery', imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&h=300&fit=crop', status: 'active', sortOrder: 16 },
  { id: '17', name: 'তাজা শাকসবজি', slug: 'fresh-vegetables', imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=300&h=300&fit=crop', status: 'active', sortOrder: 17 }
];

export const PRODUCTS: Product[] = [
  // 1. Fresh Vegetables
  { id: 'v1', name: 'Organic Red Tomato (তাজা লাল টমেটো)', price: 80, oldPrice: 100, imageUrl: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&h=400&fit=crop', category: 'তাজা শাকসবজি', rating: 4.8, badge: '20% OFF', flashSale: true },
  { id: 'v2', name: 'Fresh Carrot Premium (তাজা গাজর)', price: 120, oldPrice: 140, imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop', category: 'তাজা শাকসবজি', rating: 4.7, badge: 'Best Selling' },
  { id: 'v3', name: 'Fresh Green Chili (কাঁচা মরিচ)', price: 160, imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop', category: 'তাজা শাকসবজি', rating: 4.6 },
  { id: 'v4', name: 'Fresh Round Potato (তাজা গোল আলু)', price: 50, oldPrice: 60, imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=400&fit=crop', category: 'তাজা শাকসবজি', rating: 4.5, badge: 'Daily Essential' },

  // 2. Honey
  { id: 'h1', name: 'Sundarban Natural Honey (সুন্দরবন প্রাকৃতিক মধু)', price: 650, oldPrice: 800, imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop', category: 'মধু', rating: 4.9, badge: '18% OFF', flashSale: true },
  { id: 'h2', name: 'Black Seed Honey (কালিজিরা ফুলের মধু)', price: 850, oldPrice: 1000, imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop', category: 'মধু', rating: 4.8, badge: 'Best Selling', flashSale: true },
  { id: 'h3', name: 'Raw Litchi Flower Honey (লিচু ফুলের মধু)', price: 550, imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop', category: 'মধু', rating: 4.6 },
  { id: 'h4', name: 'Premium Mustard Flower Honey (সরিষা ফুলের মধু)', price: 500, oldPrice: 600, imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop', category: 'মধু', rating: 4.7, badge: 'New' },

  // 3. Oil & Ghee
  { id: 'og1', name: 'Pure Mustard Oil 1L (খাঁটি সরিষার তেল)', price: 480, oldPrice: 520, imageUrl: 'https://images.unsplash.com/photo-1474979266404-7ea9bcd8203c?w=400&h=400&fit=crop', category: 'তেল ও ঘি', rating: 4.7, badge: '8% OFF', flashSale: true },
  { id: 'og2', name: 'Premium Pure Ghee 500g (প্রিমিয়াম খাঁটি ঘি)', price: 850, oldPrice: 950, imageUrl: 'https://images.unsplash.com/photo-1622484211148-197a70f2a4b1?w=400&h=400&fit=crop', category: 'তেল ও ঘি', rating: 4.9, badge: '10% OFF', flashSale: true },
  { id: 'og3', name: 'Cold Pressed Coconut Oil (নারিকেল তেল)', price: 380, imageUrl: 'https://images.unsplash.com/photo-1622484211148-197a70f2a4b1?w=400&h=400&fit=crop', category: 'তেল ও ঘি', rating: 4.5 },
  { id: 'og4', name: 'Extra Virgin Olive Oil (অলিভ অয়েল)', price: 1200, oldPrice: 1350, imageUrl: 'https://images.unsplash.com/photo-1474979266404-7ea9bcd8203c?w=400&h=400&fit=crop', category: 'তেল ও ঘি', rating: 4.8, badge: 'Imported' },

  // 4. Dates
  { id: 'd1', name: 'Ajwa Dates Premium (আজওয়া খেজুর)', price: 750, oldPrice: 900, imageUrl: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=400&h=400&fit=crop', category: 'খেজুর', rating: 4.9, badge: '16% OFF', flashSale: true },
  { id: 'd2', name: 'Premium Mariam Dates (মরিয়ম খেজুর)', price: 850, imageUrl: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=400&h=400&fit=crop', category: 'খেজুর', rating: 4.8, badge: 'Best Seller' },
  { id: 'd3', name: 'Medjool Dates Royal (মেডজুল খেজুর)', price: 1200, oldPrice: 1400, imageUrl: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=400&h=400&fit=crop', category: 'খেজুর', rating: 4.9, badge: 'Royal Quality' },
  { id: 'd4', name: 'Safawi Dates Handpicked (সাফাওয়ী খেজুর)', price: 650, imageUrl: 'https://images.unsplash.com/photo-1627972230090-3b0271a3952f?w=400&h=400&fit=crop', category: 'খেজুর', rating: 4.6 },

  // 5. Spices
  { id: 's1', name: 'Premium Cumin Powder (জিরার গুড়া)', price: 280, oldPrice: 320, imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821c058721?w=400&h=400&fit=crop', category: 'মসলা', rating: 4.6, badge: '12% OFF', flashSale: true },
  { id: 's2', name: 'Natural Turmeric Powder (হলুদের গুড়া)', price: 220, oldPrice: 250, imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=400&fit=crop', category: 'মসলা', rating: 4.7, badge: 'Organic' },
  { id: 's3', name: 'Premium Red Chili Powder (মরিচের গুড়া)', price: 260, imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821c058721?w=400&h=400&fit=crop', category: 'মসলা', rating: 4.5 },
  { id: 's4', name: 'Organic Coriander Powder (ধনিয়ার গুড়া)', price: 180, imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821c058721?w=400&h=400&fit=crop', category: 'মসলা', rating: 4.4 },

  // 6. Nuts & Seeds
  { id: 'n1', name: 'Premium Mixed Nuts (মিক্সড বাদাম)', price: 950, oldPrice: 1100, imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&h=400&fit=crop', category: 'বাদাম ও বীজ', rating: 4.8, badge: '13% OFF', flashSale: true },
  { id: 'n2', name: 'Roasted Almonds Extra (কাঠবাদাম)', price: 850, imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&h=400&fit=crop', category: 'বাদাম ও বীজ', rating: 4.7, badge: 'Best Selling' },
  { id: 'n3', name: 'Salted Cashew Nuts Premium (কাজুবাদাম)', price: 900, oldPrice: 980, imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&h=400&fit=crop', category: 'বাদাম ও বীজ', rating: 4.8, badge: 'Roasted' },
  { id: 'n4', name: 'Premium Chia Seeds (চিয়া সিডস)', price: 450, imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&h=400&fit=crop', category: 'বাদাম ও বীজ', rating: 4.6 },

  // 7. Beverages
  { id: 'b1', name: 'Premium Green Tea Leaves (গ্রিন টি)', price: 350, imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=400&fit=crop', category: 'বেভারেজ', rating: 4.8 },
  { id: 'b2', name: 'Apple Cider Vinegar (এসিভি)', price: 650, oldPrice: 750, imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=400&fit=crop', category: 'বেভারেজ', rating: 4.7, badge: 'Organic' },
  { id: 'b3', name: 'Natural Lemon Juice Extract (লেবুর রস)', price: 180, imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=400&fit=crop', category: 'বেভারেজ', rating: 4.4 },
  { id: 'b4', name: 'Organic Hibiscus Herbal Tea (জবা ফুলের চা)', price: 280, imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=400&fit=crop', category: 'বেভারেজ', rating: 4.6 },

  // 8. Functional Foods
  { id: 'ff1', name: 'Moringa Powder Premium (সজিনা পাতা)', price: 320, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop', category: 'ফাংশনাল ফুড', rating: 4.8, badge: 'Superfood' },
  { id: 'ff2', name: 'Organic Spirulina Powder (স্পিরুলিনা)', price: 850, oldPrice: 950, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop', category: 'ফাংশনাল ফুড', rating: 4.7 },
  { id: 'ff3', name: 'Natural Barley Powder (বার্লি বা যব)', price: 250, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop', category: 'ফাংশনাল ফুড', rating: 4.5 },
  { id: 'ff4', name: 'Premium Himalayan Pink Salt (পিঙ্ক সল্ট)', price: 180, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop', category: 'ফাংশনাল ফুড', rating: 4.8, badge: 'Pure' },
];
