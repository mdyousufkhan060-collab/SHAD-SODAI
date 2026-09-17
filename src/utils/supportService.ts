import { accountService } from './accountService';

export interface FAQCategory {
  id: number;
  name_en: string;
  name_bn: string;
  sort_order: number;
}

export interface FAQItem {
  id: number;
  category_id: number;
  question_en: string;
  question_bn: string;
  answer_en: string;
  answer_bn: string;
  sort_order: number;
}

export interface SupportTicket {
  id: number;
  ticket_id: string; 
  customer_id: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assigned_staff_id?: number | null;
  assigned_staff_name?: string | null;
  related_order_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: number;
  ticket_id: number;
  sender_type: 'customer' | 'admin';
  sender_id: number;
  sender_name: string;
  message_text: string;
  attachments?: string | null;
  created_at: string;
}

export interface ReturnRequest {
  id: number;
  user_id: number;
  order_id: string;
  product_id: string;
  reason: string;
  description: string;
  image_url?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Completed';
  created_at: string;
  updated_at: string;
}

export interface ContactConfig {
  phone: string;
  whatsapp: string;
  email: string;
}

// Keys for MySQL Simulation in LocalStorage
const TICKETS_KEY = 'mysql_simulated_support_tickets';
const MESSAGES_KEY = 'mysql_simulated_support_messages';
const RETURNS_KEY = 'mysql_simulated_return_requests';
const CONTACT_KEY = 'mysql_simulated_contact_config';

// 1. FAQ Categories according to guidelines
export const FAQ_CATEGORIES: FAQCategory[] = [
  { id: 1, name_en: 'Ordering', name_bn: 'অর্ডার প্রক্রিয়া', sort_order: 1 },
  { id: 2, name_en: 'Payment', name_bn: 'পেমেন্ট পদ্ধতি', sort_order: 2 },
  { id: 3, name_en: 'Delivery', name_bn: 'ডেলিভারি', sort_order: 3 },
  { id: 4, name_en: 'Returns', name_bn: 'রিটার্ন পলিসি', sort_order: 4 },
  { id: 5, name_en: 'Refund', name_bn: 'রিফান্ড পলিসি', sort_order: 5 },
  { id: 6, name_en: 'Account', name_bn: 'অ্যাকাউন্ট', sort_order: 6 },
  { id: 7, name_en: 'Products', name_bn: 'পণ্যসমূহ', sort_order: 7 },
];

// 2. Comprehensive FAQs supporting Bangla + English
export const FAQ_ITEMS: FAQItem[] = [
  // Ordering
  {
    id: 101,
    category_id: 1,
    question_en: 'How can I place an order?',
    question_bn: 'আমি কীভাবে একটি অর্ডার প্লেস করতে পারি?',
    answer_en: 'Select your preferred organic foods from our products list, add them to the shopping cart, go to checkout, enter your delivery address, and confirm your order!',
    answer_bn: 'আমাদের পণ্যের তালিকা থেকে আপনার পছন্দের অর্গানিক খাবার নির্বাচন করুন, কার্টে যোগ করুন, চেকআউট অপশনে যান, আপনার ডেলিভারি ঠিকানা দিন এবং অর্ডারটি নিশ্চিত করুন!',
    sort_order: 1
  },
  {
    id: 102,
    category_id: 1,
    question_en: 'Can I cancel an order after confirming?',
    question_bn: 'অর্ডার নিশ্চিত করার পর কি আমি তা বাতিল করতে পারি?',
    answer_en: 'Yes, you can cancel your order within 2 hours of placing it directly from your account page, or by submitting a cancel request through our support ticket system.',
    answer_bn: 'হ্যাঁ, অর্ডার করার ২ ঘণ্টার মধ্যে আপনি সরাসরি আপনার অ্যাকাউন্ট পেজ থেকে বা আমাদের সাপোর্ট টিকিট সিস্টেমে বাতিল করার অনুরোধ জমা দিয়ে অর্ডার বাতিল করতে পারেন।',
    sort_order: 2
  },
  // Payment
  {
    id: 201,
    category_id: 2,
    question_en: 'What payment methods do you support?',
    question_bn: 'আপনারা কী কী পেমেন্ট পদ্ধতি সমর্থন করেন?',
    answer_en: 'We accept Cash on Delivery (COD) across Bangladesh, along with secure mobile banking payments such as bKash, Nagad, Rocket, and major credit/debit cards.',
    answer_bn: 'আমরা সমগ্র বাংলাদেশে ক্যাশ অন ডেলিভারি (COD) গ্রহণ করি। এর পাশাপাশি বিকাশ, নগদ, রকেটের মতো মোবাইল ব্যাংকিং এবং ক্রেডিট/ডেবিট কার্ডের মাধ্যমেও পেমেন্ট করা যায়।',
    sort_order: 1
  },
  {
    id: 202,
    category_id: 2,
    question_en: 'Is my payment secure?',
    question_bn: 'আমার পেমেন্ট কি নিরাপদ?',
    answer_en: 'Absolutely. All our card and mobile payments are processed through secure, bank-grade SSL encrypted payment gateways. We never save your card details.',
    answer_bn: 'অবশ্যই। আমাদের কার্ড এবং মোবাইল পেমেন্টগুলো সুরক্ষিত, ব্যাংক-গ্রেড এসএসএল (SSL) এনক্রিপ্টেড পেমেন্ট গেটওয়ের মাধ্যমে সম্পন্ন হয়। আমরা কখনোই আপনার কার্ডের তথ্য সংরক্ষণ করি না।',
    sort_order: 2
  },
  // Delivery
  {
    id: 301,
    category_id: 3,
    question_en: 'How long does the delivery take?',
    question_bn: 'ডেলিভারি হতে কত সময় লাগে?',
    answer_en: 'For inside Dhaka, it takes 24 to 48 hours. For outside Dhaka, delivery takes 2 to 4 business days.',
    answer_bn: 'ঢাকা সিটির ভেতরে ২৪ থেকে ৪৮ ঘণ্টা সময় লাগে। ঢাকা সিটির বাইরে যেকোনো জেলায় ২ থেকে ৪ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়।',
    sort_order: 1
  },
  {
    id: 302,
    category_id: 3,
    question_en: 'What are the delivery charges?',
    question_bn: 'ডেলিভারি চার্জ কত?',
    answer_en: 'Our standard shipping fee is ৳60 inside Dhaka and ৳120 for deliveries outside Dhaka.',
    answer_bn: 'ঢাকা সিটির ভেতরে ডেলিভারি চার্জ ৬০ টাকা এবং ঢাকা সিটির বাইরে যেকোনো জেলায় ডেলিভারি চার্জ ১২০ টাকা।',
    sort_order: 2
  },
  // Returns
  {
    id: 401,
    category_id: 4,
    question_en: 'What is your return policy?',
    question_bn: 'আপনাদের রিটার্ন পলিসি বা পণ্য ফেরতের নিয়ম কী?',
    answer_en: 'If you receive damaged, defective, or incorrect organic food items, you can raise a Return Request within 7 days of receiving the package.',
    answer_bn: 'যদি আপনি কোনো নষ্ট, ভেজাল বা ভুল পণ্য পেয়ে থাকেন, তবে ডেলিভারি পাওয়ার ৭ দিনের মধ্যে আমাদের রিটার্ন রিকোয়েস্ট সিস্টেমে আবেদন করতে পারবেন।',
    sort_order: 1
  },
  // Refund
  {
    id: 501,
    category_id: 5,
    question_en: 'How do I get a refund?',
    question_bn: 'আমি কীভাবে রিফান্ড বা টাকা ফেরত পেতে পারি?',
    answer_en: 'Once your return request is approved and the product reaches our warehouse, we will initiate your refund to your original payment channel (or mobile wallet) within 3-5 working days.',
    answer_bn: 'আপনার রিটার্ন রিকোয়েস্ট অনুমোদিত হওয়ার পর পণ্যটি আমাদের কার্যালয়ে পৌঁছালে, ৩-৫ কার্যদিবসের মধ্যে আপনার মূল পেমেন্ট মাধ্যমে (বিকাশ/নগদ/ব্যাংক) টাকা ফেরত দেওয়া হবে।',
    sort_order: 1
  },
  // Account
  {
    id: 601,
    category_id: 6,
    question_en: 'How do I change my delivery address?',
    question_bn: 'আমি কীভাবে আমার ডেলিভারি ঠিকানা পরিবর্তন করব?',
    answer_en: 'Log in to your account, head over to the "My Profile" or "My Addresses" tab on your dashboard, make the necessary updates, and click "Save Changes".',
    answer_bn: 'আপনার অ্যাকাউন্টে লগইন করুন, ড্যাশবোর্ডের "আমার প্রোফাইল" অথবা "আমার ঠিকানা" ট্যাবে যান, প্রয়োজনীয় তথ্য আপডেট করুন এবং "পরিবর্তন সংরক্ষণ করুন" চাপুন।',
    sort_order: 1
  },
  // Products
  {
    id: 701,
    category_id: 7,
    question_en: 'Are your products 100% organic?',
    question_bn: 'আপনাদের পণ্যগুলো কি ১০০% অর্গানিক?',
    answer_en: 'Yes! All SHAD SHODAI foods are sourced directly from trusted farmers and certified producers. We ensure premium grade, 100% preservative-free, chemical-free raw quality.',
    answer_bn: 'হ্যাঁ! স্বাদ সদাইয়ের প্রতিটি পণ্য সরাসরি বিশ্বস্ত খামারি এবং প্রত্যয়িত উৎপাদকদের কাছ থেকে সংগ্রহ করা হয়। আমরা শতভাগ প্রিজারভেটিভমুক্ত ও কেমিক্যালমুক্ত খাঁটি মান নিশ্চিত করি।',
    sort_order: 1
  }
];

// Initialize support structures if they don't exist
export const initSupportDB = () => {
  if (!localStorage.getItem(CONTACT_KEY)) {
    const defaultConfig: ContactConfig = {
      phone: '+8801712345678',
      whatsapp: '+8801712345678',
      email: 'support@shadshodai.com'
    };
    localStorage.setItem(CONTACT_KEY, JSON.stringify(defaultConfig));
  }

  if (!localStorage.getItem(TICKETS_KEY)) {
    const initialTickets: SupportTicket[] = [
      {
        id: 10001,
        ticket_id: 'GB-2026-000001',
        customer_id: 101, // default customer "Arif Rahman"
        subject: 'Need help with honey delivery',
        category: 'Delivery',
        priority: 'normal',
        status: 'open',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ];
    localStorage.setItem(TICKETS_KEY, JSON.stringify(initialTickets));
  }

  if (!localStorage.getItem(MESSAGES_KEY)) {
    const initialMessages: SupportMessage[] = [
      {
        id: 20001,
        ticket_id: 10001,
        sender_type: 'customer',
        sender_id: 101,
        sender_name: 'Arif Rahman',
        message_text: 'Hello, I ordered Natural Honey but haven\'t received it yet inside Dhaka. Can you verify?',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 20002,
        ticket_id: 10001,
        sender_type: 'admin',
        sender_id: 1, // 1 = Admin/Agent reply representation
        sender_name: 'Support Agent',
        message_text: 'Hello Arif! We are processing your honey pack right now. It is scheduled to ship today. You will receive an SMS tracking link.',
        created_at: new Date(Date.now() - 3600000 * 23).toISOString()
      }
    ];
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(initialMessages));
  }

  if (!localStorage.getItem(RETURNS_KEY)) {
    const initialReturns: ReturnRequest[] = [
      {
        id: 30001,
        user_id: 101,
        order_id: 'SG-90812',
        product_id: 'mustard-oil-1l',
        reason: 'Damaged item / ভাঙা বোতল',
        description: 'The mustard oil bottle got leaked during home delivery transit. Requesting a clean replacement bottle.',
        image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop',
        status: 'Completed',
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];
    localStorage.setItem(RETURNS_KEY, JSON.stringify(initialReturns));
  }
};

// Run initialization instantly
initSupportDB();

export const supportService = {
  // Configurable Contact options
  async getContactConfig(): Promise<ContactConfig> {
    try {
      const res = await fetch('/api/contact-settings');
      if (!res.ok) throw new Error('Failed to fetch contact settings');
      return await res.json();
    } catch {
      return { phone: '+8801712345678', whatsapp: '+8801712345678', email: 'support@shadshodai.com' };
    }
  },

  updateContactConfig(config: ContactConfig) {
    localStorage.setItem(CONTACT_KEY, JSON.stringify(config));
  },

  // GET PRIVATE ORDER BY ID AND USER ID
  // Secure: authenticated_user_id == order.user_id check
  getOrderById(orderId: string, authenticatedUserId: number) {
    const allOrders = JSON.parse(localStorage.getItem('mysql_simulated_orders') || '[]');
    const order = allOrders.find((o: any) => o.id === orderId.trim());
    if (!order) return null;
    
    if (order.customerId !== authenticatedUserId) {
      console.warn(`SECURITY WARNING: User ${authenticatedUserId} attempted to access Order ${orderId} owned by customer ${order.customerId}`);
      throw new Error('Access Denied: You can only view your own orders.');
    }
    return order;
  },

  // TICKETS - REAL BACKEND API
  async getTicketsForUser(): Promise<SupportTicket[]> {
    const token = localStorage.getItem('customer_token');
    if (!token) return [];
    try {
      const res = await fetch('/api/customer/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  async getTicketById(ticketId: number): Promise<{ ticket: any; replies: any[] } | null> {
    const token = localStorage.getItem('customer_token');
    if (!token) return null;
    try {
      const res = await fetch(`/api/customer/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async createSupportTicket(subject: string, category: string, firstMessage: string, orderId?: string): Promise<any> {
    const token = localStorage.getItem('customer_token');
    if (!token) throw new Error('Authentication required');
    
    try {
      const res = await fetch('/api/customer/tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          subject, 
          category, 
          message_text: firstMessage,
          related_order_id: orderId 
        })
      });
      return res.ok ? await res.json() : null;
    } catch (err) {
      console.error('Failed to create ticket:', err);
      return null;
    }
  },

  async addTicketMessage(ticketId: number, text: string): Promise<any> {
    const token = localStorage.getItem('customer_token');
    if (!token) throw new Error('Authentication required');

    try {
      const res = await fetch(`/api/customer/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ message_text: text })
      });
      return res.ok ? await res.json() : null;
    } catch (err) {
      console.error('Failed to add message:', err);
      return null;
    }
  },

  // RETURNS - PRIVATE USER AREA
  getReturnRequests(authenticatedUserId: number): ReturnRequest[] {
    try {
      const returns: ReturnRequest[] = JSON.parse(localStorage.getItem(RETURNS_KEY) || '[]');
      // Secure verification: strictly user requests
      return returns.filter(r => r.user_id === authenticatedUserId);
    } catch {
      return [];
    }
  },

  createReturnRequest(authenticatedUserId: number, data: Omit<ReturnRequest, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>): ReturnRequest {
    const returns: ReturnRequest[] = JSON.parse(localStorage.getItem(RETURNS_KEY) || '[]');
    
    // Confirm order belongs to user first
    this.getOrderById(data.order_id, authenticatedUserId);

    const newRequest: ReturnRequest = {
      ...data,
      id: Math.floor(Math.random() * 900000) + 100000,
      user_id: authenticatedUserId,
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    returns.push(newRequest);
    localStorage.setItem(RETURNS_KEY, JSON.stringify(returns));
    return newRequest;
  },

  // --- REAL-TIME MESSAGING (MySQL BACKEND) ---
  // Connects Customer Messenger directly to the Admin Panel
  
  async getConversation(): Promise<any> {
    const token = localStorage.getItem('customer_token');
    if (!token) return null;
    try {
      const res = await fetch('/api/customer/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getMessages(conversationId: number): Promise<any[]> {
    const token = localStorage.getItem('customer_token');
    if (!token) return [];
    try {
      const res = await fetch(`/api/customer/messages/${conversationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  async sendMessage(messageText: string, attachments: string[] = []): Promise<boolean> {
    const token = localStorage.getItem('customer_token');
    if (!token) return false;
    try {
      const res = await fetch('/api/customer/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ message_text: messageText, attachments })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
