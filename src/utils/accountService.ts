import { DIVISION_DISTRICTS } from './translations';

export interface Customer {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  address: string;
  division: string;
  district: string;
  gender: 'male' | 'female' | 'other';
  language: 'bn' | 'en';
  profile_image: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Order {
  id: string;
  customerId: number;
  date: string;
  products: string;
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentMethod?: string;
  paymentStatus?: string;
  transactionReference?: string;
}

const ORDERS_KEY = 'shadshodai_orders_secure_2026';
const LEGACY_ORDERS_KEY = 'shadghor_orders_secure_2026';

export const accountService = {
  async getLoggedInUser(): Promise<Customer | null> {
    const token = localStorage.getItem('customer_token');
    if (!token) return null;

    try {
      const res = await fetch('/api/customer/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.customer;
      }
      return null;
    } catch {
      return null;
    }
  },

  async loginWithEmail(email: string, passwordPlain: string): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    try {
      const res = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordPlain })
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        return { 
          success: false, 
          error: res.status === 404 
            ? 'সার্ভার API পাওয়া যায়নি (404)। হোস্টইঞ্জারে Node.js ব্যাকএন্ড চালু আছে কিনা চেক করুন।' 
            : `সার্ভার সংযোগ সমস্যা (${res.status})` 
        };
      }
      if (res.ok && data) {
        localStorage.setItem('customer_token', data.token);
        return { success: true, customer: data.customer };
      }
      return { success: false, error: data?.error || 'ভুল ইমেইল অথবা পাসওয়ার্ড দিয়েছেন।' };
    } catch (err: any) {
      return { success: false, error: 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। ইন্টারনেট সংযোগ ও সার্ভার চেক করুন।' };
    }
  },

  async register(data: any): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    try {
      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      let result: any = null;
      try {
        result = await res.json();
      } catch {
        return { 
          success: false, 
          error: res.status === 404 
            ? 'সার্ভার API পাওয়া যায়নি (404)।' 
            : `সার্ভার সংযোগ সমস্যা (${res.status})` 
        };
      }
      if (res.ok && result) {
        return { success: true };
      }
      return { success: false, error: result?.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।' };
    } catch {
      return { success: false, error: 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।' };
    }
  },

  async loginWithOTP(phone: string): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    // Currently simulated as backend OTP is pending
    return { success: false, error: 'OTP login currently unavailable. Please use email.' };
  },

  logout() {
    localStorage.removeItem('customer_token');
  },

  getHeaders() {
    const token = localStorage.getItem('customer_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  async getOrdersForCustomer(): Promise<Order[]> {
    const token = localStorage.getItem('customer_token');
    if (!token) return [];
    try {
      const res = await fetch('/api/customer/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
      return [];
    } catch {
      return [];
    }
  },

  createOrder(customerId: number, productsSummary: string, totalAmount: number, paymentMethod?: string, paymentStatus?: string, transactionReference?: string): Order {
    try {
      const stored = localStorage.getItem(ORDERS_KEY) || localStorage.getItem(LEGACY_ORDERS_KEY) || '[]';
      const allOrders: Order[] = JSON.parse(stored);
      const newOrder: Order = {
        id: `SS-${Math.floor(100000 + Math.random() * 900000)}`,
        customerId,
        date: new Date().toISOString(),
        products: productsSummary,
        totalAmount,
        status: 'Pending',
        paymentMethod,
        paymentStatus,
        transactionReference
      };
      allOrders.push(newOrder);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(allOrders));
      return newOrder;
    } catch {
      return {} as Order;
    }
  },

  // Wishlist still using localStorage for performance if desired, but ideally backend
  getWishlistForCustomer(userId: number): any[] {
    try {
      const wishlistKey = `wishlist_user_${userId}`;
      return JSON.parse(localStorage.getItem(wishlistKey) || '[]');
    } catch {
      return [];
    }
  },

  addToWishlist(userId: number, product: any) {
    const wishlistKey = `wishlist_user_${userId}`;
    const list = this.getWishlistForCustomer(userId);
    if (!list.some(p => p.id === product.id)) {
      list.push(product);
      localStorage.setItem(wishlistKey, JSON.stringify(list));
    }
  },

  removeFromWishlist(userId: number, productId: string) {
    const wishlistKey = `wishlist_user_${userId}`;
    const list = this.getWishlistForCustomer(userId);
    const updated = list.filter(p => p.id !== productId);
    localStorage.setItem(wishlistKey, JSON.stringify(updated));
  },

  async updateProfile(userId: number, data: any): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    const token = localStorage.getItem('customer_token');
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) return { success: true, customer: result.customer };
      return { success: false, error: result.error };
    } catch {
      return { success: false, error: 'Failed to update profile.' };
    }
  },

  async changePassword(userId: number, newPasswordPlain: string): Promise<boolean> {
    const token = localStorage.getItem('customer_token');
    try {
      const res = await fetch('/api/customer/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: newPasswordPlain })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
