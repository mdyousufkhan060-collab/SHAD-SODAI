import { Product } from '../types';
import { PRODUCTS } from '../data';

export interface ProductDetailsFAQ {
  q: string;
  q_bn: string;
  a: string;
  a_bn: string;
}

export interface ProductImageDBRow {
  id: number;
  product_id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PRODUCT_IMAGES: ProductImageDBRow[] = [
  // h1: Sundarban Honey (6 detailed, gorgeous images)
  {
    id: 1,
    product_id: 'h1',
    image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=600&fit=crop',
    alt_text: 'Sundarban Natural Honey pure organic wild honey glass jar',
    sort_order: 1,
    is_primary: true,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  },
  {
    id: 2,
    product_id: 'h1',
    image_url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&h=600&fit=crop',
    alt_text: 'Pure liquid amber honey pouring from custom wood dipper',
    sort_order: 2,
    is_primary: false,
    created_at: '2026-09-01T12:01:00Z',
    updated_at: '2026-09-01T12:01:00Z'
  },
  {
    id: 3,
    product_id: 'h1',
    image_url: 'https://images.unsplash.com/photo-1587049352851-8d4e89134292?w=600&h=600&fit=crop',
    alt_text: 'Harvesting organic Sundarban honeycomb in wild mangrove forest',
    sort_order: 3,
    is_primary: false,
    created_at: '2026-09-01T12:02:00Z',
    updated_at: '2026-09-01T12:02:00Z'
  },
  {
    id: 4,
    product_id: 'h1',
    image_url: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&h=600&fit=crop',
    alt_text: 'High viscosity raw honey droplet detail on rustic wood background',
    sort_order: 4,
    is_primary: false,
    created_at: '2026-09-01T12:03:00Z',
    updated_at: '2026-09-01T12:03:00Z'
  },
  {
    id: 5,
    product_id: 'h1',
    image_url: 'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=600&h=600&fit=crop',
    alt_text: 'Therapeutic and medicinal properties of unpasteurized honey jar',
    sort_order: 5,
    is_primary: false,
    created_at: '2026-09-01T12:04:00Z',
    updated_at: '2026-09-01T12:04:00Z'
  },
  {
    id: 6,
    product_id: 'h1',
    image_url: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=600&h=600&fit=crop',
    alt_text: 'Golden splash of organic certified honey essence',
    sort_order: 6,
    is_primary: false,
    created_at: '2026-09-01T12:05:00Z',
    updated_at: '2026-09-01T12:05:00Z'
  },

  // v1: Tomato
  {
    id: 7,
    product_id: 'v1',
    image_url: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&h=600&fit=crop',
    alt_text: 'Fresh organic red tomato farm harvest selection',
    sort_order: 1,
    is_primary: true,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  },
  {
    id: 8,
    product_id: 'v1',
    image_url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=600&h=600&fit=crop',
    alt_text: 'Fresh pesticide-free red tomatoes growing on organic vines',
    sort_order: 2,
    is_primary: false,
    created_at: '2026-09-01T12:01:00Z',
    updated_at: '2026-09-01T12:01:00Z'
  },
  {
    id: 9,
    product_id: 'v1',
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&h=600&fit=crop',
    alt_text: 'Assorted raw farm-fresh tomatoes and green peppers',
    sort_order: 3,
    is_primary: false,
    created_at: '2026-09-01T12:02:00Z',
    updated_at: '2026-09-01T12:02:00Z'
  },

  // og1: Mustard Oil
  {
    id: 10,
    product_id: 'og1',
    image_url: 'https://images.unsplash.com/photo-1474979266404-7ea9bcd8203c?w=600&h=600&fit=crop',
    alt_text: 'Pure Mustard Oil bottle prepared via traditional cold press',
    sort_order: 1,
    is_primary: true,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  },
  {
    id: 11,
    product_id: 'og1',
    image_url: 'https://images.unsplash.com/photo-1622484211148-197a70f2a4b1?w=600&h=600&fit=crop',
    alt_text: 'Wooden Ghani cold press extraction mechanism for mustard oil',
    sort_order: 2,
    is_primary: false,
    created_at: '2026-09-01T12:01:00Z',
    updated_at: '2026-09-01T12:01:00Z'
  },
  {
    id: 12,
    product_id: 'og1',
    image_url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&h=600&fit=crop',
    alt_text: 'Freshly harvested robust organic black mustard seeds',
    sort_order: 3,
    is_primary: false,
    created_at: '2026-09-01T12:02:00Z',
    updated_at: '2026-09-01T12:02:00Z'
  }
];

export interface ProductVariantDBRow {
  id: number;
  product_id: string;
  name: string;
  value: string;
  unit: string;
  weight_grams: number;
  price: number;
  original_price: number | null;
  stock_quantity: number;
  sku: string;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PRODUCT_VARIANTS: ProductVariantDBRow[] = [
  // h1: Sundarban Honey
  {
    id: 1,
    product_id: 'h1',
    name: '200g',
    value: '200',
    unit: 'g',
    weight_grams: 200,
    price: 180,
    original_price: 220,
    stock_quantity: 20,
    sku: 'SG-H1-200G',
    is_default: false,
    is_active: true,
    sort_order: 1,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  },
  {
    id: 2,
    product_id: 'h1',
    name: '250g',
    value: '250',
    unit: 'g',
    weight_grams: 250,
    price: 220,
    original_price: 260,
    stock_quantity: 15,
    sku: 'SG-H1-250G',
    is_default: false,
    is_active: true,
    sort_order: 2,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  },
  {
    id: 3,
    product_id: 'h1',
    name: '500g',
    value: '500',
    unit: 'g',
    weight_grams: 500,
    price: 400,
    original_price: 480,
    stock_quantity: 12,
    sku: 'SG-H1-500G',
    is_default: true,
    is_active: true,
    sort_order: 3,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  },
  {
    id: 4,
    product_id: 'h1',
    name: '1 KG',
    value: '1',
    unit: 'KG',
    weight_grams: 1000,
    price: 750,
    original_price: 900,
    stock_quantity: 8,
    sku: 'SG-H1-1KG',
    is_default: false,
    is_active: true,
    sort_order: 4,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  },
  {
    id: 5,
    product_id: 'h1',
    name: '2 KG',
    value: '2',
    unit: 'KG',
    weight_grams: 2000,
    price: 1400,
    original_price: 1650,
    stock_quantity: 5,
    sku: 'SG-H1-2KG',
    is_default: false,
    is_active: true,
    sort_order: 5,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  },
  {
    id: 6,
    product_id: 'h1',
    name: '3 KG',
    value: '3',
    unit: 'KG',
    weight_grams: 3000,
    price: 1950,
    original_price: 2300,
    stock_quantity: 3,
    sku: 'SG-H1-3KG',
    is_default: false,
    is_active: true,
    sort_order: 6,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  },
  // v4: Fresh Round Potato
  {
    id: 401,
    product_id: 'v4',
    name: '250g',
    value: '250',
    unit: 'g',
    weight_grams: 250,
    price: 30,
    original_price: 35,
    stock_quantity: 15,
    sku: 'SG-POTATO-250G',
    is_default: false,
    is_active: true,
    sort_order: 1,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  },
  {
    id: 402,
    product_id: 'v4',
    name: '500g',
    value: '500',
    unit: 'g',
    weight_grams: 500,
    price: 50,
    original_price: 60,
    stock_quantity: 30,
    sku: 'SG-POTATO-500G',
    is_default: true,
    is_active: true,
    sort_order: 2,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  },
  {
    id: 403,
    product_id: 'v4',
    name: '1 KG',
    value: '1',
    unit: 'KG',
    weight_grams: 1000,
    price: 95,
    original_price: 110,
    stock_quantity: 20,
    sku: 'SG-POTATO-1KG',
    is_default: false,
    is_active: true,
    sort_order: 3,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  },
  {
    id: 404,
    product_id: 'v4',
    name: '2 KG',
    value: '2',
    unit: 'KG',
    weight_grams: 2000,
    price: 180,
    original_price: 210,
    stock_quantity: 10,
    sku: 'SG-POTATO-2KG',
    is_default: false,
    is_active: true,
    sort_order: 4,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  },
  {
    id: 405,
    product_id: 'v4',
    name: '3 KG',
    value: '3',
    unit: 'KG',
    weight_grams: 3000,
    price: 260,
    original_price: 300,
    stock_quantity: 8,
    sku: 'SG-POTATO-3KG',
    is_default: false,
    is_active: true,
    sort_order: 5,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z'
  }
];

export interface ProductDetailsExtension {
  id: string;
  short_description: string;
  short_description_bn: string;
  description: string;
  description_bn: string;
  sku: string;
  unit: string;
  weight: string;
  brand: string;
  brand_bn: string;
  origin: string;
  origin_bn: string;
  shelf_life: string;
  shelf_life_bn: string;
  storage: string;
  storage_bn: string;
  ingredients: string;
  ingredients_bn: string;
  images: string[]; // secondary gallery images
  highlights?: string[];
  highlights_bn?: string[];
  faqs?: ProductDetailsFAQ[];
}

// Simulated SQL table for secondary product data
const PRODUCT_EXTENSIONS: Record<string, ProductDetailsExtension> = {
  'v4': {
    id: 'v4',
    short_description: 'Fresh premium-quality round potatoes selected for everyday cooking.',
    short_description_bn: 'দৈনন্দিন রান্নার জন্য চমৎকারভাবে বাছাইকৃত প্রিমিয়াম মানের তাজা গোল আলু।',
    description: `Fresh Round Potato is carefully selected from quality sources.
The potatoes are packed hygienically and handled carefully to maintain freshness.

Best suited for:
• Daily cooking
• Curry
• Fries
• Mashed potato

Storage:
Keep in a cool and dry place.`,
    description_bn: `তাজা গোল আলু চমৎকার মানসম্পন্ন উৎস থেকে সতর্কতার সাথে সংগ্রহ করা হয়েছে।
সতেজতা বজায় রাখতে আলুগুলো স্বাস্থ্যসম্মতভাবে প্যাকেটজাত করা হয়েছে এবং যত্নসহকারে পরিচালনা করা হয়েছে।

সেরা ব্যবহার:
• দৈনন্দিন রান্না
• তরকারি
• ফ্রাই
• ম্যাশড পটেটো

সংরক্ষণ:
ঠাণ্ডা এবং শুষ্ক স্থানে রাখুন।`,
    sku: 'SG-POTATO-500G',
    unit: '500g',
    weight: '500g',
    brand: 'SHAD SHODAI Premium',
    brand_bn: 'স্বাদ সদাই প্রিমিয়াম',
    origin: 'Munshiganj, Bangladesh',
    origin_bn: 'মুন্সীগঞ্জ, বাংলাদেশ',
    shelf_life: '1 Month',
    shelf_life_bn: '১ মাস',
    storage: 'Keep in a cool, dark, dry place with good ventilation.',
    storage_bn: 'ভালো বাতাস চলাচল করে এমন একটি ঠাণ্ডা, অন্ধকার ও শুষ্ক স্থানে রাখুন।',
    ingredients: 'Fresh Whole Potato',
    ingredients_bn: 'তাজা আস্ত আলু',
    images: [],
    highlights: ['Premium Quality', 'Fresh Product', 'Hygienically Packed', 'Carefully Selected', 'Fast Delivery'],
    highlights_bn: ['সেরা মান সম্পন্ন', 'শতভাগ তাজা পণ্য', 'স্বাস্থ্যসম্মত উপায়ে প্যাকেটজাত', 'সতর্কতার সাথে বাছাইকৃত', 'দ্রুত ডেলিভারি'],
    faqs: []
  },
  'v1': {
    id: 'v1',
    short_description: 'Pure organic red tomatoes harvested directly from chemical-free rustic gardens.',
    short_description_bn: 'রাসায়নিকমুক্ত নিজস্ব খামার থেকে সংগৃহীত শতভাগ তাজা ও লাল টমেটো।',
    description: 'Our organic red tomatoes are cultivated with premium organic fertilisers without using any industrial pesticides. Loaded with vitamins and rich lycopene, they add fresh taste and healthy nutrition to your daily salads and curries.',
    description_bn: 'আমাদের তাজা লাল টমেটো কোনো কীটনাশক ছাড়াই সম্পূর্ণ জৈব সার ব্যবহারে উৎপাদিত। এটি ভিটামিন সি ও লাইকোপেন সমৃদ্ধ, যা আপনার নিত্যদিনের রান্নায় বা সালাদে যোগ করবে অসাধারণ স্বাদ ও পুষ্টি।',
    sku: 'SG-VEG-01',
    unit: '1 kg',
    weight: '1000g',
    brand: 'SHAD SHODAI Agro',
    brand_bn: 'স্বাদ সদাই এগ্রো',
    origin: 'Bogura, Bangladesh',
    origin_bn: 'বগুড়া, বাংলাদেশ',
    shelf_life: '5-7 Days',
    shelf_life_bn: '৫-৭ দিন',
    storage: 'Keep in cool dry place or refrigerator.',
    storage_bn: 'শুষ্ক ঠাণ্ডা স্থানে বা রেফ্রিজারেটরে সংরক্ষণ করুন।',
    ingredients: 'Fresh Raw Tomato',
    ingredients_bn: 'তাজা কাঁচা টমেটো',
    images: [
      'https://images.unsplash.com/photo-1595855759920-86582396756a?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&h=600&fit=crop'
    ],
    highlights: ['Premium Quality', '100% Organic', 'Fresh Garden Harvest', 'Chemical Free'],
    highlights_bn: ['সেরা প্রিমিয়াম মান', '১০০% অর্গানিক', 'সরাসরি খামার থেকে সংগৃহীত', 'রাসায়নিক ও কীটনাশকমুক্ত'],
    faqs: [
      {
        q: "Are these tomatoes organic?",
        q_bn: "এই টমেটোগুলো কি সম্পূর্ণ অর্গানিক?",
        a: "Yes, our organic red tomatoes are cultivated with premium organic fertilizers without using any industrial pesticides.",
        a_bn: "হ্যাঁ, আমাদের সব টমেটো ক্ষতিকারক কেমিক্যাল বা কীটনাশক ছাড়া সম্পূর্ণ জৈব সার ব্যবহারে নিজস্ব খামারে চাষ করা হয়।"
      },
      {
        q: "How are they packaged?",
        q_bn: "টমেটোগুলো কীভাবে প্যাকেজিং করা হয়?",
        a: "We pack them hygienically in breathable vegetable pouches to keep them fresh during transit.",
        a_bn: "পরিবহনকালে পণ্য যেন তাজা থাকে, সেজন্য আমরা বায়ু চলাচল করতে পারে এমন ফুড-গ্রেড পাউচে স্বাস্থ্যকর উপায়ে প্যাকেজিং করি।"
      }
    ]
  },
  'h1': {
    id: 'h1',
    short_description: 'Raw, unpasteurized honey gathered from the deep mangrove forests of the Sundarbans.',
    short_description_bn: 'সুন্দরবনের গভীর গরান ও খলিশা ফুল থেকে মৌয়ালদের দ্বারা সংগৃহীত সম্পূর্ণ খাঁটি ও কাঁচা মধু।',
    description: 'Experience the premium floral aroma of the wild Sundarbans. This raw honey is unheated, unfiltered, and contains natural pollens and enzymes that boost digestion and provide rapid energy. Lab tested for pure food safety.',
    description_bn: 'সুন্দরবনের খলিশা ও গরান ফুলের নির্যাস সমৃদ্ধ এই মধু সম্পূর্ণ প্রাকৃতিক ও ফিল্টারবিহীন। এতে কোনো কৃত্রিম চিনি বা কেমিক্যাল নেই, যা রোগ প্রতিরোধ ক্ষমতা বাড়াতে ও দ্রুত শক্তি যোগাতে অত্যন্ত কার্যকরী।',
    sku: 'SG-HON-01',
    unit: '500g Bottle',
    weight: '500g',
    brand: 'SHAD SHODAI Premium',
    brand_bn: 'স্বাদ সদাই প্রিমিয়াম',
    origin: 'Sundarbans, Bangladesh',
    origin_bn: 'সুন্দরবন, বাংলাদেশ',
    shelf_life: '2 Years (Never expires)',
    shelf_life_bn: '২ বছর (নষ্ট হয় না)',
    storage: 'Store at room temperature. Do not refrigerate.',
    storage_bn: 'স্বাভাবিক তাপমাত্রায় রাখুন। রেফ্রিজারেটরে রাখার প্রয়োজন নেই।',
    ingredients: '100% Pure Forest Honey',
    ingredients_bn: '১০০% খাঁটি বনের মধু',
    images: [
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555555555555?w=600&h=600&fit=crop'
    ],
    highlights: ['100% Pure Raw Honey', 'Hygienically Filtered', 'No Added Sugar', 'Lab Tested Purity'],
    highlights_bn: ['১০০% খাঁটি কাঁচা মধু', 'স্বাস্থ্যকর উপায়ে ফিল্টারকৃত', 'অতিরিক্ত চিনিমুক্ত', 'ল্যাব সার্টিফাইড বিশুদ্ধতা'],
    faqs: [
      {
        q: "Is this honey original and unadulterated?",
        q_bn: "সুন্দরবনের এই মধু কি আসল ও খাঁটি?",
        a: "Absolutely. This is raw, unprocessed honey harvested by traditional Mouals from Sundarbans. We do not boil or add artificial sugar syrup.",
        a_bn: "শতভাগ খাঁটি। সুন্দরবনের ঐতিহ্যবাহী মৌয়ালদের দ্বারা সংগৃহীত কাঁচা ও প্রক্রিয়াজাতবিহীন মধু। এতে কোনো চিনি বা কৃত্রিম সিরাপ যুক্ত করা হয় না।"
      },
      {
        q: "Why does raw honey crystallize?",
        q_bn: "মধু জমে যায় কেন বা ক্রিস্টাল হয় কেন?",
        a: "Crystallization is a natural characteristic of pure raw honey, especially floral honeys. It is a sign of authenticity and does not spoil.",
        a_bn: "মধু জমে যাওয়া প্রাকৃতিক ও খাঁটি মধুর একটি স্বাভাবিক বৈশিষ্ট্য। বিশেষ করে শীতকালে খলিশা ও সরিষার মধু ক্রিস্টাল আকারে জমতে পারে, যা মধুর খাঁটি হওয়ার প্রমাণ।"
      }
    ]
  },
  'og1': {
    id: 'og1',
    short_description: 'First-press cold-extracted mustard oil prepared with premium handpicked seeds.',
    short_description_bn: 'কাঠের ঘানিতে ভাঙানো প্রথম চাপের শতভাগ খাঁটি ও ঝাঁঝালো সরিষার তেল।',
    description: 'Our mustard oil is wood-pressed (ঘানি ভাঙানো) at low temperatures to lock in optimal health benefits, rich pungent aroma, and fatty acids. It is ideal for pickling, traditional cooking, and body massage.',
    description_bn: 'দেশি লাল সরিষা বীজ থেকে কাঠের ঘানিতে ঠাণ্ডা চাপে প্রস্তুত আমাদের এই সরিষার তেল। এর ঝাঁঝ ও প্রাকৃতিক পুষ্টিগুণ অক্ষুণ্ণ রয়েছে, যা আচার তৈরি ও যেকোনো সুস্বাদু রান্নায় ঐতিহ্যবাহী স্বাদ এনে দেয়।',
    sku: 'SG-OIL-01',
    unit: '1 Liter Pet',
    weight: '1000ml',
    brand: 'SHAD SHODAI Organic',
    brand_bn: 'স্বাদ সদাই অর্গানিক',
    origin: 'Sirajganj, Bangladesh',
    origin_bn: 'সিরাজগঞ্জ, বাংলাদেশ',
    shelf_life: '1 Year',
    shelf_life_bn: '১ বছর',
    storage: 'Keep away from direct sunlight in an airtight jar.',
    storage_bn: 'সরাসরি সূর্যালোক থেকে দূরে বায়ুরোধী পাত্রে রাখুন।',
    ingredients: 'Pure Wood-Pressed Mustard Seed Extract',
    ingredients_bn: 'কাঠের ঘানি ভাঙানো লাল সরিষার নির্যাস',
    images: [
      'https://images.unsplash.com/photo-1474979266404-7ea9bcd8203c?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1622484211148-197a70f2a4b1?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&h=600&fit=crop'
    ],
    highlights: ['First Press Cold Extraction', 'Traditional Wood Pressed', 'Rich Pungent Aroma', 'Perfect for Pickles'],
    highlights_bn: ['প্রথম চাপের ঘানি ভাঙানো তেল', 'ঐতিহ্যবাহী কাঠের ঘানিতে প্রস্তুত', 'শতভাগ প্রাকৃতিক ঝাঁঝ', 'আচারের জন্য পারফেক্ট'],
    faqs: [
      {
        q: "How is this mustard oil extracted?",
        q_bn: "এই সরিষার তেল কীভাবে তৈরি করা হয়?",
        a: "We extract it using traditional wooden Ghani at low temperatures to retain its natural nutrients, pungent flavor, and rich aroma.",
        a_bn: "আমরা দেশি সরিষার দানা থেকে ঐতিহ্যবাহী কাঠের ঘানিতে ঠাণ্ডা চাপে এই তেল বের করি। ফলে এর ঝাঁঝালো সুবাস ও প্রাকৃতিক পুষ্টিগুণ পুরোপুরি অক্ষুণ্ণ থাকে।"
      },
      {
        q: "Can we use it for baby massage?",
        q_bn: "এটি কি বাচ্চাদের শরীরে মালিশ করা যাবে?",
        a: "Yes, because it is 100% pure, unfiltered, and free of mineral oils or synthetic chemicals, it is extremely safe for baby massage.",
        a_bn: "হ্যাঁ, এটি শতভাগ প্রাকৃতিক, ফিল্টারহীন এবং মিনারেল ওয়েল বা কেমিক্যালমুক্ত হওয়ায় নবজাতকের ত্বক ও চুলের জন্য অত্যন্ত উপকারী ও নিরাপদ।"
      }
    ]
  }
};

// Default extension fallback for other products to ensure there are no empty states
const createDefaultExtension = (id: string, name: string): ProductDetailsExtension => {
  return {
    id,
    short_description: `Premium selected quality ${name} sourced for you.`,
    short_description_bn: `বাছাইকৃত সেরা মানের ${name} সরাসরি আপনার জন্য সরবরাহকৃত।`,
    description: `Indulge in the finest selected premium organic grocery products from SHAD SHODAI. Our products are tested rigorously for chemical safety, purity and unadulterated taste.`,
    description_bn: `স্বাদ সদাইয়ের পক্ষ থেকে সংগৃহীত শতভাগ খাঁটি ও বিশুদ্ধ ${name}। এটি কেমিক্যাল ও ভেজালমুক্ত, যা আপনার সুস্বাস্থ্য বজায় রাখতে সাহায্য করবে।`,
    sku: `SG-GEN-${id.toUpperCase()}`,
    unit: 'Pack',
    weight: '500g',
    brand: 'SHAD SHODAI Premium',
    brand_bn: 'স্বাদ সদাই প্রিমিয়াম',
    origin: 'Bangladesh',
    origin_bn: 'বাংলাদেশ',
    shelf_life: '6 Months',
    shelf_life_bn: '৬ মাস',
    storage: 'Keep in a cool dry hygienic place.',
    storage_bn: 'শুষ্ক, ঠাণ্ডা ও হাইজেনিক স্থানে সংরক্ষণ করুন।',
    ingredients: 'Natural Food Item',
    ingredients_bn: 'প্রাকৃতিক খাদ্য উপাদান',
    images: [],
    highlights: ['Premium Quality', '100% Natural', 'Hygienically Packed', 'Fresh Product', 'Fast Delivery'],
    highlights_bn: ['সেরা প্রিমিয়াম মান', '১০০% প্রাকৃতিক', 'স্বাস্থ্যকর প্যাকেজিং', 'তাজা পণ্য', 'দ্রুত ডেলিভারি'],
    faqs: [
      {
        q: "Is this product chemical-free?",
        q_bn: "এই পণ্যটি কি কেমিক্যাল-মুক্ত?",
        a: "Yes, all products from SHAD SHODAI are collected from verified authentic sources and are fully chemical-free.",
        a_bn: "হ্যাঁ, স্বাদ সদাইয়ের প্রতিটি পণ্য পরীক্ষিত ও যাচাইকৃত উৎস থেকে সংগৃহীত এবং ক্ষতিকারক কেমিক্যালমুক্ত।"
      },
      {
        q: "How long does delivery take?",
        q_bn: "ডেলিভারি পেতে কত সময় লাগে?",
        a: "Typically 24-48 hours inside Dhaka and 3-5 days outside Dhaka.",
        a_bn: "সাধারণত ঢাকার ভিতরে ২৪-৪৮ ঘণ্টা এবং ঢাকার বাইরে ৩ থেকে ৫ কার্যদিবস সময় লাগে।"
      }
    ]
  };
};

export const productService = {
  // Generate a clean SEO-friendly slug
  getProductSlug(id: string, name: string): string {
    const cleanName = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // remove non-alphanumeric chars
      .trim()
      .replace(/\s+/g, '-') // spaces to -
      .replace(/-+/g, '-'); // collapse multiple -
    return `${cleanName}-${id}`;
  },

  // Parse ID from an SEO slug (e.g. "pure-mustard-oil-1l-og1" -> "og1")
  getIdFromSlug(slug: string): string {
    const parts = slug.split('-');
    return parts[parts.length - 1] || slug;
  },

  // Get dynamic database-driven extension fields
  getProductExtension(id: string, name: string): ProductDetailsExtension {
    return PRODUCT_EXTENSIONS[id] || createDefaultExtension(id, name);
  },

  // Find a product by slug or id securely
  findProductBySlugOrId(slugOrId: string): Product | null {
    const id = this.getIdFromSlug(slugOrId);
    return PRODUCTS.find(p => p.id === id) || null;
  },

  // Get Related products (same category first, then other products up to 10)
  getRelatedProducts(currentId: string, category: string): Product[] {
    const sameCategory = PRODUCTS.filter(p => p.category === category && p.id !== currentId);
    const otherProducts = PRODUCTS.filter(p => p.category !== category && p.id !== currentId);
    return [...sameCategory, ...otherProducts].slice(0, 10);
  },

  // Load simulated table from localStorage with fallback to default seed
  _getImagesTable(): ProductImageDBRow[] {
    const raw = localStorage.getItem('sg_product_images');
    if (!raw) {
      localStorage.setItem('sg_product_images', JSON.stringify(DEFAULT_PRODUCT_IMAGES));
      return DEFAULT_PRODUCT_IMAGES;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return DEFAULT_PRODUCT_IMAGES;
    }
  },

  _saveImagesTable(table: ProductImageDBRow[]): void {
    localStorage.setItem('sg_product_images', JSON.stringify(table));
  },

  // 11, 12, 13 & 15. Query images directly from MySQL simulation
  getProductImages(productId: string): ProductImageDBRow[] {
    const table = this._getImagesTable();
    const rows = table.filter(img => img.product_id === productId);
    
    // Sort by sort_order asc
    rows.sort((a, b) => a.sort_order - b.sort_order);

    // If empty, fallback to the product's default image from global PRODUCTS static collection
    if (rows.length === 0) {
      const prod = PRODUCTS.find(p => p.id === productId);
      if (prod) {
        return [{
          id: Math.floor(Math.random() * 1000000) + 10000,
          product_id: productId,
          image_url: prod.imageUrl,
          alt_text: `${prod.name} organic natural view`,
          sort_order: 1,
          is_primary: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }];
      }
    }
    return rows;
  },

  // 14. Admin Panel Support to add multiple images and manage their order
  addProductImage(productId: string, imageUrl: string, altText: string, sortOrder: number, isPrimary: boolean): ProductImageDBRow {
    const table = this._getImagesTable();
    const newId = table.length > 0 ? Math.max(...table.map(img => img.id)) + 1 : 1;
    
    // If setting as primary, demote other images for this product
    if (isPrimary) {
      table.forEach(img => {
        if (img.product_id === productId) {
          img.is_primary = false;
        }
      });
    }

    const newRow: ProductImageDBRow = {
      id: newId,
      product_id: productId,
      image_url: imageUrl,
      alt_text: altText || `${productId} product image`,
      sort_order: sortOrder,
      is_primary: isPrimary,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    table.push(newRow);
    this._saveImagesTable(table);
    return newRow;
  },

  // Update order or metadata
  updateImageSortOrder(id: number, newSortOrder: number): boolean {
    const table = this._getImagesTable();
    const idx = table.findIndex(img => img.id === id);
    if (idx !== -1) {
      table[idx].sort_order = newSortOrder;
      table[idx].updated_at = new Date().toISOString();
      this._saveImagesTable(table);
      return true;
    }
    return false;
  },

  // Change primary image
  setPrimaryProductImage(productId: string, id: number): boolean {
    const table = this._getImagesTable();
    let updated = false;
    table.forEach(img => {
      if (img.product_id === productId) {
        img.is_primary = (img.id === id);
        img.updated_at = new Date().toISOString();
        updated = true;
      }
    });
    if (updated) {
      this._saveImagesTable(table);
    }
    return updated;
  },

  // Remove product image
  removeProductImage(id: number): boolean {
    const table = this._getImagesTable();
    const filtered = table.filter(img => img.id !== id);
    if (filtered.length !== table.length) {
      this._saveImagesTable(filtered);
      return true;
    }
    return false;
  },

  // --- STEP 20B: PRODUCT VARIANT SYSTEM ---
  _getVariantsTable(): ProductVariantDBRow[] {
    const raw = localStorage.getItem('sg_product_variants');
    if (!raw) {
      localStorage.setItem('sg_product_variants', JSON.stringify(DEFAULT_PRODUCT_VARIANTS));
      return DEFAULT_PRODUCT_VARIANTS;
    }
    try {
      const parsed = JSON.parse(raw) as ProductVariantDBRow[];
      const h1_200g = parsed.find(v => v.product_id === 'h1' && v.name === '200g');
      const hasPotato = parsed.some(v => v.product_id === 'v4');
      if (!hasPotato || (h1_200g && (h1_200g.price === 280 || h1_200g.stock_quantity === 15))) {
        localStorage.setItem('sg_product_variants', JSON.stringify(DEFAULT_PRODUCT_VARIANTS));
        return DEFAULT_PRODUCT_VARIANTS;
      }
      return parsed;
    } catch (e) {
      return DEFAULT_PRODUCT_VARIANTS;
    }
  },

  _saveVariantsTable(table: ProductVariantDBRow[]): void {
    localStorage.setItem('sg_product_variants', JSON.stringify(table));
  },

  // Query product variants with smart automatic fallback generation for non-seeded products
  getProductVariants(productId: string): ProductVariantDBRow[] {
    const table = this._getVariantsTable();
    const rows = table.filter(v => v.product_id === productId);
    
    if (rows.length > 0) {
      return rows.sort((a, b) => a.sort_order - b.sort_order);
    }

    // Fallback automatic generation so all catalog products have beautiful, functional weight options (Rule 19)
    const product = PRODUCTS.find(p => p.id === productId);
    if (product) {
      const generated: ProductVariantDBRow[] = [
        {
          id: Math.floor(Math.random() * 10000) + 20000,
          product_id: productId,
          name: '250g',
          value: '250',
          unit: 'g',
          weight_grams: 250,
          price: Math.round(product.price * 0.55),
          original_price: product.oldPrice ? Math.round(product.oldPrice * 0.55) : null,
          stock_quantity: 40,
          sku: `SG-${productId.toUpperCase()}-250G`,
          is_default: false,
          is_active: true,
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: Math.floor(Math.random() * 10000) + 30000,
          product_id: productId,
          name: '500g',
          value: '500',
          unit: 'g',
          weight_grams: 500,
          price: product.price,
          original_price: product.oldPrice || null,
          stock_quantity: 50,
          sku: `SG-${productId.toUpperCase()}-500G`,
          is_default: true,
          is_active: true,
          sort_order: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: Math.floor(Math.random() * 10000) + 40000,
          product_id: productId,
          name: '1 KG',
          value: '1',
          unit: 'KG',
          weight_grams: 1000,
          price: Math.round(product.price * 1.8),
          original_price: product.oldPrice ? Math.round(product.oldPrice * 1.8) : null,
          stock_quantity: 12,
          sku: `SG-${productId.toUpperCase()}-1KG`,
          is_default: false,
          is_active: true,
          sort_order: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Save generated rows back into our simulated SQL database
      const currentTable = this._getVariantsTable();
      const updatedTable = [...currentTable, ...generated];
      this._saveVariantsTable(updatedTable);
      return generated;
    }

    return [];
  },

  getVariantById(id: number): ProductVariantDBRow | null {
    const table = this._getVariantsTable();
    return table.find(v => v.id === id) || null;
  },

  // Future Admin Panel Support
  addProductVariant(variantData: Omit<ProductVariantDBRow, 'id' | 'created_at' | 'updated_at'>): ProductVariantDBRow {
    const table = this._getVariantsTable();
    const newId = table.length > 0 ? Math.max(...table.map(v => v.id)) + 1 : 1;

    // If making default, demote others
    if (variantData.is_default) {
      table.forEach(v => {
        if (v.product_id === variantData.product_id) {
          v.is_default = false;
        }
      });
    }

    const newRow: ProductVariantDBRow = {
      ...variantData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    table.push(newRow);
    this._saveVariantsTable(table);
    return newRow;
  },

  updateProductVariant(id: number, updates: Partial<ProductVariantDBRow>): boolean {
    const table = this._getVariantsTable();
    const idx = table.findIndex(v => v.id === id);
    if (idx !== -1) {
      if (updates.is_default) {
        // Demote other variants for this product
        const productId = table[idx].product_id;
        table.forEach(v => {
          if (v.product_id === productId) {
            v.is_default = false;
          }
        });
      }

      table[idx] = {
        ...table[idx],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this._saveVariantsTable(table);
      return true;
    }
    return false;
  },

  removeProductVariant(id: number): boolean {
    const table = this._getVariantsTable();
    const filtered = table.filter(v => v.id !== id);
    if (filtered.length !== table.length) {
      this._saveVariantsTable(filtered);
      return true;
    }
    return false;
  }
};
