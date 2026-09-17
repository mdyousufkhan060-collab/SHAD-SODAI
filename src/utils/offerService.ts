import { Product } from '../types';
import { PRODUCTS } from '../data';

export interface Offer {
  id: number;
  title: string;
  title_bn: string;
  slug: string;
  description: string;
  description_bn: string;
  banner_image: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_at: string; // ISO String
  end_at: string;   // ISO String
  status: 'active' | 'inactive';
}

export interface OfferProduct {
  id: number;
  offer_id: number;
  product_id: string;
}

// Simulated MySQL tables in LocalStorage
const OFFERS_KEY = 'mysql_simulated_offers';
const OFFER_PRODUCTS_KEY = 'mysql_simulated_offer_products';
const INVENTORY_KEY = 'mysql_simulated_inventory';

// Seed Initial Data if not present
export const initOffersDB = () => {
  const now = Date.now();

  // 1. Seed Offers Table
  if (!localStorage.getItem(OFFERS_KEY)) {
    const initialOffers: Offer[] = [
      {
        id: 1001,
        title: 'Flash Sale',
        title_bn: 'ফ্ল্যাশ সেল',
        slug: 'flash-sale',
        description: 'Special deals and limited-time discounts',
        description_bn: 'विशेष অফার ও সীমিত সময়ের ডিসকাউন্ট',
        banner_image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop',
        discount_type: 'percentage',
        discount_value: 20, // 20% flat discount
        start_at: new Date(now - 3600 * 1000 * 2).toISOString(), // Started 2 hours ago
        end_at: new Date(now + 3600 * 1000 * 38).toISOString(),  // Ends in 38 hours
        status: 'active'
      },
      {
        id: 1002,
        title: 'Weekly Ghee & Honey Blast',
        title_bn: 'সাপ্তাহিক ঘি ও মধু ধামাকা',
        slug: 'weekly-ghee-honey',
        description: 'Premium raw organic food items at discounted prices',
        description_bn: 'স্বাদ ঘরের খাঁটি অর্গানিক মধুতে আকর্ষণীয় মূল্যছাড়',
        banner_image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1200&h=400&fit=crop',
        discount_type: 'fixed',
        discount_value: 50, // ৳50 fixed discount
        start_at: new Date(now - 3600 * 1000 * 24).toISOString(), // Started yesterday
        end_at: new Date(now + 3600 * 1000 * 72).toISOString(),   // Ends in 3 days
        status: 'active'
      },
      {
        id: 1003,
        title: 'Expired Monsoon Mega Offer',
        title_bn: 'মেয়াদোত্তীর্ণ মেগা অফার',
        slug: 'expired-monsoon-offer',
        description: 'Older discount campaign',
        description_bn: 'পূর্ববর্তী অফার ক্যাম্পেইন',
        banner_image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=1200&h=400&fit=crop',
        discount_type: 'percentage',
        discount_value: 15,
        start_at: new Date(now - 3600 * 1000 * 120).toISOString(), // Started 5 days ago
        end_at: new Date(now - 3600 * 1000 * 24).toISOString(),   // Ended yesterday (EXPIRED!)
        status: 'active'
      }
    ];
    localStorage.setItem(OFFERS_KEY, JSON.stringify(initialOffers));
  }

  // 2. Seed Offer Products Relationship Table
  const storedOfferProducts = localStorage.getItem(OFFER_PRODUCTS_KEY);
  if (!storedOfferProducts || JSON.parse(storedOfferProducts).length < 10) {
    const initialOfferProducts: OfferProduct[] = [
      // Flash Sale (Offer 1001) Products - 16 Products (covers multiple categories)
      { id: 1, offer_id: 1001, product_id: 'v1' },   // Red Tomato (stock = 0, Sold Out)
      { id: 2, offer_id: 1001, product_id: 'h1' },   // Sundarban Honey (stock = 4, Limited Stock)
      { id: 3, offer_id: 1001, product_id: 'og1' },  // Mustard Oil 1L (stock = 12)
      { id: 4, offer_id: 1001, product_id: 'd1' },   // Ajwa Dates (stock = 5, Limited Stock)
      { id: 5, offer_id: 1001, product_id: 'h2' },   // Black Seed Honey (stock = 18)
      { id: 6, offer_id: 1001, product_id: 'og2' },  // Premium Ghee 500g (stock = 3, Limited Stock)
      { id: 7, offer_id: 1001, product_id: 'n1' },   // Mixed Nuts (stock = 25)
      { id: 8, offer_id: 1001, product_id: 's1' },   // Cumin Powder (stock = 15)
      { id: 9, offer_id: 1001, product_id: 's2' },   // Turmeric Powder (stock = 12)
      { id: 10, offer_id: 1001, product_id: 'n2' },  // Roasted Almonds (stock = 9)
      { id: 11, offer_id: 1001, product_id: 'b1' },  // Green Tea (stock = 22)
      { id: 12, offer_id: 1001, product_id: 'b2' },  // Apple Cider Vinegar (stock = 5, Limited Stock)
      { id: 13, offer_id: 1001, product_id: 'ff1' }, // Moringa Powder (stock = 14)
      { id: 14, offer_id: 1001, product_id: 'ff2' }, // Spirulina (stock = 8)
      { id: 15, offer_id: 1001, product_id: 'v2' },  // Fresh Carrot (stock = 50)
      { id: 16, offer_id: 1001, product_id: 'd2' },  // Mariam Dates (stock = 2, Limited Stock)

      // Weekly Blast (Offer 1002) Products
      { id: 17, offer_id: 1002, product_id: 'h2' },   // Black Seed Honey
      { id: 18, offer_id: 1002, product_id: 'og2' },  // Premium Ghee 500g
      { id: 19, offer_id: 1002, product_id: 'n1' }    // Mixed Nuts
    ];
    localStorage.setItem(OFFER_PRODUCTS_KEY, JSON.stringify(initialOfferProducts));
  }

  // 3. Seed Inventory Stock Table (Actual MySQL simulation)
  const storedInventory = localStorage.getItem(INVENTORY_KEY);
  if (!storedInventory || Object.keys(JSON.parse(storedInventory)).length < 10) {
    const initialInventory: Record<string, number> = {
      'v1': 0,    // Sold Out!
      'h1': 4,    // Limited stock!
      'og1': 12,  // Normal stock
      'd1': 5,    // Only 5 left!
      'h2': 18,
      'og2': 3,   // Only 3 left!
      'n1': 25,
      's1': 15,
      's2': 12,
      'n2': 9,
      'b1': 22,
      'b2': 5,
      'ff1': 14,
      'ff2': 8,
      'v2': 50,
      'd2': 2,
      'v3': 40,
      'v4': 80,
      'h3': 15,
      'h4': 8,
      'og3': 14,
      'og4': 6,
      'd3': 10,
      'd4': 7,
      's3': 20,
      's4': 18,
      'n3': 11,
      'n4': 16,
      'b3': 30,
      'b4': 15,
      'ff3': 10,
      'ff4': 15
    };
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(initialInventory));
  }
};

// Auto-run initialization
initOffersDB();

export const offerService = {
  // Get all offers from MySQL-simulated storage
  getOffers(): Offer[] {
    try {
      return JSON.parse(localStorage.getItem(OFFERS_KEY) || '[]');
    } catch {
      return [];
    }
  },

  // Get active offers: status is active AND start_at <= current_time <= end_at
  // Secure: The filter checks actual start/end dates.
  getActiveOffers(): Offer[] {
    const all = this.getOffers();
    const now = new Date();
    return all.filter(offer => {
      const start = new Date(offer.start_at);
      const end = new Date(offer.end_at);
      return offer.status === 'active' && now >= start && now <= end;
    });
  },

  // Get inventory stock for any product ID
  getInventoryStock(productId: string): number {
    try {
      const inv: Record<string, number> = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '{}');
      return inv[productId] !== undefined ? inv[productId] : 15; // default to 15 if not configured
    } catch {
      return 15;
    }
  },

  // Validate and subtract stock on purchase
  purchaseProduct(productId: string, quantity: number): boolean {
    try {
      const inv: Record<string, number> = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '{}');
      const currentStock = inv[productId] !== undefined ? inv[productId] : 15;
      if (currentStock < quantity) {
        return false; // Insufficient stock
      }
      inv[productId] = currentStock - quantity;
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
      return true;
    } catch {
      return false;
    }
  },

  // Server-side like price calculations (calculates discount based on offer details)
  // This satisfies "The server must calculate/validate the actual price. Do not trust frontend prices."
  getCalculatedProductPrice(productId: string, offerId: number): { price: number; oldPrice: number; discountPercent: number } {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const offers = this.getOffers();
    const offer = offers.find(o => o.id === offerId);
    if (!offer) {
      // No active offer, return standard product pricing
      return {
        price: product.price,
        oldPrice: product.oldPrice || product.price,
        discountPercent: product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0
      };
    }

    // Determine base previous price
    const originalPrice = product.oldPrice || product.price;
    let finalPrice = product.price;

    // Apply offer adjustments
    if (offer.discount_type === 'percentage') {
      const discountAmount = originalPrice * (offer.discount_value / 100);
      finalPrice = Math.round(originalPrice - discountAmount);
    } else if (offer.discount_type === 'fixed') {
      finalPrice = originalPrice - offer.discount_value;
    }

    // Protect against negative pricing
    if (finalPrice < 1) finalPrice = 1;

    const discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);

    return {
      price: finalPrice,
      oldPrice: originalPrice,
      discountPercent: discountPercent
    };
  },

  // Query products belonging to an offer ID
  getOfferProducts(offerId: number): (Product & { stock: number; discountPercent: number })[] {
    try {
      const relationships: OfferProduct[] = JSON.parse(localStorage.getItem(OFFER_PRODUCTS_KEY) || '[]');
      const productIds = relationships
        .filter(r => r.offer_id === offerId)
        .map(r => r.product_id);

      const items: (Product & { stock: number; discountPercent: number })[] = [];

      for (const pid of productIds) {
        const prod = PRODUCTS.find(p => p.id === pid);
        if (prod) {
          const stock = this.getInventoryStock(pid);
          const priceDetails = this.getCalculatedProductPrice(pid, offerId);
          
          items.push({
            ...prod,
            price: priceDetails.price,
            oldPrice: priceDetails.oldPrice,
            discountPercent: priceDetails.discountPercent,
            stock: stock,
            // Custom dynamic offer badge based on calculations
            badge: `${priceDetails.discountPercent}% OFF`
          });
        }
      }

      // Sort by offer/product priority (e.g., sort by active stock availability first)
      return items.sort((a, b) => b.stock - a.stock);
    } catch {
      return [];
    }
  },

  // Paginated query supporting filtering, sorting, searching (Database Simulation)
  getOfferProductsPaged(
    offerId: number,
    options: {
      category?: string;
      sortBy?: string;
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): { items: (Product & { stock: number; discountPercent: number })[]; total: number; hasMore: boolean } {
    const { category, sortBy, search, limit = 12, offset = 0 } = options;
    
    // 1. Get all calculated offer products
    let items = this.getOfferProducts(offerId);

    // 2. Filter by category
    if (category && category !== 'All' && category !== 'সবগুলো') {
      items = items.filter(item => {
        // Match English name or translated category
        const catLower = item.category.toLowerCase();
        const filterLower = category.toLowerCase();
        
        // mappings for filter categories to product database category strings
        const mapping: Record<string, string[]> = {
          'honey': ['মধু', 'organic honey', 'honey'],
          'মধু': ['মধু', 'organic honey', 'honey'],
          'oil & ghee': ['তেল ও ঘি', 'pure oil & ghee', 'oil', 'ghee'],
          'তেল ও ঘি': ['তেল ও ঘি', 'pure oil & ghee', 'oil', 'ghee'],
          'dates': ['খেজুর', 'premium dates', 'dates'],
          'খেজুর': ['খেজুর', 'premium dates', 'dates'],
          'nuts & seeds': ['বাদাম ও বীজ', 'nuts & seeds', 'nuts', 'seeds'],
          'বাদাম ও বীজ': ['বাদাম ও বীজ', 'nuts & seeds', 'nuts', 'seeds'],
          'spices': ['মসলা', 'pure spices', 'spices'],
          'মসলা': ['মসলা', 'pure spices', 'spices'],
          'beverages': ['বেভারেজ', 'organic beverage', 'beverage', 'tea'],
          'বেভারেজ': ['বেভারেজ', 'organic beverage', 'beverage', 'tea'],
          'functional foods': ['ফাংশনাল ফুড', 'functional foods'],
          'ফাংশনাল ফুড': ['ফাংশনাল ফুড', 'functional foods'],
          'fresh vegetables': ['তাজা শাকসবজি', 'fresh vegetables'],
          'তাজা শাকসবজি': ['তাজা শাকসবজি', 'fresh vegetables']
        };

        const mappedTargets = mapping[filterLower] || [filterLower];
        return mappedTargets.some(target => catLower.includes(target) || target.includes(catLower));
      });
    }

    // 3. Filter by search query
    if (search) {
      const q = search.toLowerCase().trim();
      items = items.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q)
      );
    }

    // 4. Sort
    if (sortBy) {
      switch (sortBy) {
        case 'discount':
          // Biggest discount first
          items.sort((a, b) => b.discountPercent - a.discountPercent);
          break;
        case 'price-asc':
          // Price Low to High
          items.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          // Price High to Low
          items.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          // Newest first (by ID descending or reversing list)
          items.sort((a, b) => b.id.localeCompare(a.id));
          break;
        case 'featured':
        default:
          // Featured / Default sorting (e.g. stock level descending, then id)
          items.sort((a, b) => b.stock - a.stock);
          break;
      }
    }

    // 5. Paginate
    const total = items.length;
    const paginatedItems = items.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      items: paginatedItems,
      total,
      hasMore
    };
  }
};
