import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  MessageCircle,
  Phone, 
  Mail, 
  Truck, 
  HelpCircle, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  ChevronLeft,
  Headset,
  Lock, 
  X,
  FileQuestion,
  UserCheck,
  CreditCard,
  ShoppingBag,
  Send,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { accountService, Customer, Order } from '../utils/accountService';
import { supportService, FAQCategory, FAQItem, SupportTicket, SupportMessage, ReturnRequest, FAQ_CATEGORIES, FAQ_ITEMS, ContactConfig } from '../utils/supportService';

export const SupportCenter = () => {
  const { language, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  
  // Navigation View State
  // 'main' | 'track' | 'tickets' | 'ticket-detail' | 'return' | 'quick-guide'
  const [activeView, setActiveView] = useState<'main' | 'track' | 'tickets' | 'ticket-detail' | 'return' | 'quick-guide' | 'chat'>('main');
  const [currentConversation, setCurrentConversation] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Sync hash routing for direct deep links like #/support/chat
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#/support/chat') {
        if (!currentUser) {
          localStorage.setItem('redirect_after_login', '#/support/chat');
          window.location.hash = '#/account';
        } else {
          setActiveView('chat');
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentUser]);

  const fetchChatData = async () => {
    if (activeView === 'chat' && currentUser) {
      const conv = await supportService.getConversation();
      if (conv) {
        setCurrentConversation(conv);
        const msgs = await supportService.getMessages(conv.id);
        setChatMessages(msgs);
      }
    }
  };

  useEffect(() => {
    fetchChatData();
    if (activeView === 'chat') {
      const interval = setInterval(fetchChatData, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [activeView, currentUser]);

  useEffect(() => {
    if (activeView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeView]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const success = await supportService.sendMessage(newMessage);
    if (success) {
      setNewMessage('');
      fetchChatData();
    }
    setIsSending(false);
  };
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFaqs, setFilteredFaqs] = useState<FAQItem[]>([]);
  
  // FAQ active category filter
  const [selectedFaqCat, setSelectedFaqCat] = useState<number | null>(null);
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);
  
  // Quick Guide details
  const [guideType, setGuideType] = useState<'payment' | 'delivery' | 'how-to-order' | 'account' | 'login' | 'cancel'>('payment');

  // Track Order state
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState('');
  
  // Ticket list / detail state
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  
  // Create ticket form
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Product Quality');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [newTicketAttachment, setNewTicketAttachment] = useState('');
  const [ticketFormOpen, setTicketFormOpen] = useState(false);
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState('');

  // Return request form
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnProductId, setReturnProductId] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnDesc, setReturnDesc] = useState('');
  const [returnImageUrl, setReturnImageUrl] = useState('');
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [submittedReturns, setSubmittedReturns] = useState<ReturnRequest[]>([]);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  // Authenticate user check
  useEffect(() => {
    accountService.getLoggedInUser().then(async user => {
      setCurrentUser(user);
      if (user) {
        // Pre-load user-specific support data
        const tickets = await supportService.getTicketsForUser();
        setUserTickets(tickets);
        accountService.getOrdersForCustomer().then(setUserOrders);
        setSubmittedReturns(supportService.getReturnRequests(user.id));
      }
    });
  }, [activeView]);

  // Sync ticket details if viewing detail
  useEffect(() => {
    const fetchDetails = async () => {
      if (selectedTicket && currentUser) {
        const data = await supportService.getTicketById(selectedTicket.id);
        if (data) {
          setTicketMessages(data.replies);
          setSelectedTicket(data.ticket);
        }
      }
    };
    fetchDetails();
  }, [selectedTicket]);

  // Poll for updates when viewing a ticket
  useEffect(() => {
    let timer: any;
    if (activeView === 'ticket-detail' && selectedTicket && currentUser) {
      timer = setInterval(async () => {
        const data = await supportService.getTicketById(selectedTicket.id);
        if (data && data.replies.length !== ticketMessages.length) {
          setTicketMessages(data.replies);
          setSelectedTicket(data.ticket);
        }
      }, 3000); // Poll every 3s for tickets
    }
    return () => clearInterval(timer);
  }, [activeView, selectedTicket, ticketMessages.length, currentUser]);

  // Search filter FAQ
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFaqs([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = FAQ_ITEMS.filter(f => 
      f.question_en.toLowerCase().includes(q) || 
      f.question_bn.toLowerCase().includes(q) ||
      f.answer_en.toLowerCase().includes(q) ||
      f.answer_bn.toLowerCase().includes(q)
    );
    setFilteredFaqs(matches);
  }, [searchQuery]);

  // Handle Order tracking search
  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    setTrackedOrder(null);

    if (!trackOrderId.trim()) {
      setTrackError(language === 'bn' ? 'দয়া করে অর্ডার আইডি দিন।' : 'Please enter an Order ID.');
      return;
    }

    if (!currentUser) {
      setTrackError(language === 'bn' ? 'অর্ডার ট্র্যাক করতে আগে আপনার অ্যাকাউন্টে লগইন করুন।' : 'Please login to track your orders.');
      return;
    }

    try {
      const order = supportService.getOrderById(trackOrderId.trim(), currentUser.id);
      if (order) {
        setTrackedOrder(order);
      } else {
        setTrackError(language === 'bn' ? 'কোনো অর্ডার পাওয়া যায়নি! সঠিক অর্ডার আইডি দিন (যেমন: SG-91544)' : 'No matching order found! Please enter a valid ID (e.g., SG-91544)');
      }
    } catch (err: any) {
      setTrackError(language === 'bn' ? 'নিরাপত্তা ত্রুটি: আপনি কেবল নিজের অর্ডার ট্র্যাক করতে পারবেন!' : 'Security violation: You can only track your own orders!');
    }
  };

  // Submit Ticket message
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser || !selectedTicket) return;

    try {
      const result = await supportService.addTicketMessage(selectedTicket.id, replyText);
      if (result) {
        const updated = await supportService.getTicketById(selectedTicket.id);
        if (updated) {
          setTicketMessages(updated.replies);
          setSelectedTicket(updated.ticket);
        }
        setReplyText('');
      }
    } catch (err) {
      alert('Failed to send message');
    }
  };

  // Create support ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim() || !currentUser) {
      alert(t('allFieldsRequired'));
      return;
    }

    try {
      const ticket = await supportService.createSupportTicket(
        newTicketSubject,
        newTicketCategory,
        newTicketMessage
      );

      if (ticket) {
        // Refresh tickets
        const tickets = await supportService.getTicketsForUser();
        setUserTickets(tickets);
        setTicketSuccessMsg(t('ticketSuccess'));
        setNewTicketSubject('');
        setNewTicketMessage('');
        setNewTicketAttachment('');
        
        setTimeout(() => {
          setTicketSuccessMsg('');
          setTicketFormOpen(false);
          setSelectedTicket(ticket);
          setActiveView('ticket-detail');
        }, 2000);
      }
    } catch (err) {
      alert('Error creating ticket');
    }
  };

  // Submit Return/Refund
  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrderId || !returnProductId || !returnReason.trim() || !returnDesc.trim() || !currentUser) {
      alert(t('allFieldsRequired'));
      return;
    }

    try {
      supportService.createReturnRequest(currentUser.id, {
        order_id: returnOrderId,
        product_id: returnProductId,
        reason: returnReason.trim(),
        description: returnDesc.trim(),
        image_url: returnImageUrl || undefined
      });

      setReturnSuccessMsg(t('returnSuccess'));
      setReturnOrderId('');
      setReturnProductId('');
      setReturnReason('');
      setReturnDesc('');
      setReturnImageUrl('');

      // Refresh returns
      setSubmittedReturns(supportService.getReturnRequests(currentUser.id));

      setTimeout(() => {
        setReturnSuccessMsg('');
      }, 4000);
    } catch (err: any) {
      alert(language === 'bn' ? 'ভুল অর্ডার আইডি অথবা অবৈধ পণ্য নির্বাচন!' : 'Invalid Order ID or product selection!');
    }
  };

  // Open Quick Guide detail view
  const openGuide = (type: 'payment' | 'delivery' | 'how-to-order' | 'account' | 'login' | 'cancel') => {
    setGuideType(type);
    setActiveView('quick-guide');
  };

  // Configurable Contact Options loaded from service
  const [contactInfo, setContactInfo] = useState<ContactConfig>({ phone: '+8801712345678', whatsapp: '+8801712345678', email: 'support@shadghor.com' });

  useEffect(() => {
    supportService.getContactConfig().then(setContactInfo);
  }, []);

  // Helper status badge translation
  const getTicketStatusBadge = (status: string) => {
    const mapping: Record<string, { bg: string, text: string, bn: string, en: string }> = {
      'open': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: 'emerald-700', bn: 'উন্মুক্ত', en: 'Open' },
      'in_progress': { bg: 'bg-amber-50 text-amber-700 border-amber-100', text: 'amber-700', bn: 'চলমান', en: 'In Progress' },
      'waiting_for_customer': { bg: 'bg-blue-50 text-blue-700 border-blue-100', text: 'blue-700', bn: 'গ্রাহকের অপেক্ষা', en: 'Awaiting Customer' },
      'waiting_for_admin': { bg: 'bg-orange-50 text-orange-700 border-orange-100', text: 'orange-700', bn: 'অ্যাডমিনের অপেক্ষা', en: 'Awaiting Admin' },
      'resolved': { bg: 'bg-gray-50 text-gray-700 border-gray-100', text: 'gray-700', bn: 'সমাধানকৃত', en: 'Resolved' },
      'closed': { bg: 'bg-red-50 text-red-700 border-red-100', text: 'red-700', bn: 'বন্ধ', en: 'Closed' }
    };
    const design = mapping[status.toLowerCase()] || { bg: 'bg-gray-50 text-gray-600 border-gray-100', text: 'gray-600', bn: status, en: status };
    return (
      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border ${design.bg}`}>
        {language === 'bn' ? design.bn : design.en}
      </span>
    );
  };

  const getReturnStatusBadge = (status: string) => {
    const mapping: Record<string, { bg: string, bn: string, en: string }> = {
      'Pending': { bg: 'bg-amber-50 text-amber-700 border-amber-100', bn: 'অপেক্ষমান', en: 'Pending' },
      'Approved': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', bn: 'অনুমোদিত', en: 'Approved' },
      'Rejected': { bg: 'bg-red-50 text-red-700 border-red-100', bn: 'প্রত্যাখ্যাত', en: 'Rejected' },
      'Processing': { bg: 'bg-blue-50 text-blue-700 border-blue-100', bn: 'প্রক্রিয়াধীন', en: 'Processing' },
      'Completed': { bg: 'bg-gray-50 text-gray-700 border-gray-100', bn: 'সম্পন্ন', en: 'Completed' }
    };
    const design = mapping[status] || { bg: 'bg-gray-50 text-gray-600 border-gray-100', bn: status, en: status };
    return (
      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border ${design.bg}`}>
        {language === 'bn' ? design.bn : design.en}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" id="support-center-wrapper">
      
      {/* Dynamic Header with back button */}
      {activeView !== 'main' && (
        <button 
          onClick={() => {
            if (activeView === 'ticket-detail') {
              setActiveView('tickets');
            } else {
              setActiveView('main');
            }
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-600 mb-5 cursor-pointer bg-white px-3 py-2 rounded-xl shadow-3xs border border-gray-100 w-fit transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToSupport')}</span>
        </button>
      )}

      {/* ==============================================
          VIEW 1: MAIN SUPPORT DASHBOARD
          ============================================== */}
      {activeView === 'main' && (
        <div className="space-y-8" id="support-main-view">
          
          {/* Header & Help Banner */}
          <div className="text-center bg-radial from-white via-white to-gray-50/20 py-8 rounded-2xl border border-gray-100/40">
            <h1 className="text-xl sm:text-2xl font-black text-gray-800 tracking-wide mb-2.5">
              {language === 'bn' ? 'আমরা কীভাবে আপনাকে সাহায্য করতে পারি?' : 'How can we help you today?'}
            </h1>
            <p className="text-xs text-gray-400 font-bold max-w-lg mx-auto leading-relaxed px-4">
              {t('supportSub')}
            </p>
            
            {/* Search Input */}
            <div className="max-w-md mx-auto mt-6 relative px-4" id="faq-search-box">
              <div className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-100 px-3.5 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                <Search className="w-4.5 h-4.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={language === 'bn' ? 'জিজ্ঞাসা খুঁজুন (যেমন: মধু, ডেলিভারি, রিফান্ড)...' : 'Search questions (e.g. honey, delivery, refund)...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 py-3 text-xs focus:outline-none font-bold text-gray-700"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Filter Search Results panel */}
          {searchQuery && (
            <div className="bg-white p-5 rounded-2xl border border-emerald-100/50 shadow-xs space-y-3.5" id="search-results">
              <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'bn' ? `খোঁজার ফলাফল (${filteredFaqs.length}টি মিলেছে)` : `Search Results (${filteredFaqs.length} matched)`}
                </span>
              </h3>
              {filteredFaqs.length === 0 ? (
                <p className="text-xs text-gray-400 font-bold">{language === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি! অন্য কিছু লিখে খুঁজুন।' : 'No matches found! Try different keywords.'}</p>
              ) : (
                <div className="space-y-2.5">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100/40">
                      <h4 className="font-extrabold text-xs text-gray-800 mb-1">{language === 'bn' ? faq.question_bn : faq.question_en}</h4>
                      <p className="text-[11px] text-gray-500 font-bold leading-relaxed">{language === 'bn' ? faq.answer_bn : faq.answer_en}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="support-quick-actions">
            {[
              { label: t('trackOrder'), icon: Truck, action: () => setActiveView('track'), bg: 'hover:bg-emerald-50/30' },
              { label: t('returnRefund'), icon: RefreshCw, action: () => setActiveView('return'), bg: 'hover:bg-blue-50/30' },
              { label: t('cancelOrder'), icon: X, action: () => openGuide('cancel'), bg: 'hover:bg-red-50/30' },
              { label: t('paymentHelp'), icon: CreditCard, action: () => openGuide('payment'), bg: 'hover:bg-amber-50/30' },
              { label: t('deliveryInfo'), icon: Truck, action: () => openGuide('delivery'), bg: 'hover:bg-indigo-50/30' },
              { label: t('howToOrder'), icon: ShoppingBag, action: () => openGuide('how-to-order'), bg: 'hover:bg-pink-50/30' },
              { label: t('accountHelp'), icon: UserCheck, action: () => openGuide('account'), bg: 'hover:bg-teal-50/30' },
              { label: t('loginHelp'), icon: Lock, action: () => openGuide('login'), bg: 'hover:bg-purple-50/30' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={item.action}
                  className={`bg-white p-4 rounded-2xl border border-gray-100/50 hover:border-emerald-500/20 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:shadow-2xs active:scale-[0.98] ${item.bg}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-2.5 text-emerald-600 transition-colors group-hover:bg-white border border-gray-100/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-gray-700 tracking-tight leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Support Chats / Tickets Gate & Configurable Contacts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="support-middle-layer">
            
            {/* Live Chat & Ticket System Access Card */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider">{t('chatWithSupport')}</h3>
                </div>
                <p className="text-xs text-gray-400 font-bold leading-relaxed mb-5">
                  {language === 'bn' 
                    ? 'আপনার অর্ডার সংক্রান্ত যেকোনো অভিযোগ, ত্রুটিপূর্ণ পণ্য বা সমস্যা জানাতে টিকিট খুলুন এবং সরাসরি চ্যাট করুন।' 
                    : 'Raise a support ticket or chat instantly with our support executive regarding order delays, quality complaints, or refund queries.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    if (!currentUser) {
                      window.location.hash = '#/account';
                    } else {
                      setActiveView('tickets');
                    }
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs uppercase tracking-wider"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('submitTicket')}</span>
                </button>
                <button
                  onClick={() => {
                    if (!currentUser) {
                      window.location.hash = '#/account';
                    } else {
                      setActiveView('chat');
                    }
                  }}
                  className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-3xs uppercase tracking-wider border border-emerald-100"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{language === 'bn' ? 'সরাসরি চ্যাট' : 'Live Chat'}</span>
                </button>
                <button
                  onClick={() => {
                    if (!currentUser) {
                      window.location.hash = '#/account';
                    } else {
                      setReturnOrderId('');
                      setActiveView('return');
                    }
                  }}
                  className="flex-1 border border-gray-200 hover:border-emerald-600 hover:bg-emerald-50/20 text-gray-700 hover:text-emerald-600 text-xs font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t('returnRefund')}</span>
                </button>
              </div>
            </div>

            {/* Configurable Contact Information Column */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100/50 space-y-4">
              <h3 className="font-extrabold text-sm text-gray-800 pb-2 border-b border-gray-50">{t('contactSupport')}</h3>
              
              <div className="space-y-3">
                <a 
                  href={`tel:${contactInfo.phone}`}
                  className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100/50 transition-colors">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('callUs')}</p>
                    <p className="text-xs font-black text-gray-700">{contactInfo.phone}</p>
                  </div>
                </a>

                <a 
                  href={`https://wa.me/${contactInfo.whatsapp.replace('+', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100/50 transition-colors">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">WhatsApp Chat</p>
                    <p className="text-xs font-black text-gray-700">{contactInfo.whatsapp}</p>
                  </div>
                </a>

                <a 
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100/50 transition-colors">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('emailUs')}</p>
                    <p className="text-xs font-black text-gray-700">{contactInfo.email}</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Accordion FAQ Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100/50 space-y-5" id="faq-accordions">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50 pb-4">
              <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <span>{t('faq')}</span>
              </h3>
              
              {/* Category tabs */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedFaqCat(null)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all cursor-pointer ${
                    selectedFaqCat === null ? 'bg-emerald-600 text-white shadow-3xs' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {language === 'bn' ? 'সবগুলো' : 'All'}
                </button>
                {FAQ_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedFaqCat(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all cursor-pointer ${
                      selectedFaqCat === cat.id ? 'bg-emerald-600 text-white shadow-3xs' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {language === 'bn' ? cat.name_bn : cat.name_en}
                  </button>
                ))}
              </div>
            </div>

            {/* Accordion List */}
            <div className="divide-y divide-gray-50">
              {FAQ_ITEMS.filter(f => selectedFaqCat === null || f.category_id === selectedFaqCat).map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id} className="py-3.5">
                    <button
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer group"
                    >
                      <span className="text-xs sm:text-xs font-black text-gray-700 group-hover:text-emerald-600 transition-colors">
                        {language === 'bn' ? faq.question_bn : faq.question_en}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="mt-2.5 text-[11px] text-gray-400 font-bold leading-relaxed pl-1 transition-all">
                        {language === 'bn' ? faq.answer_bn : faq.answer_en}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          VIEW 2: ORDER TRACKING PAGE
          ============================================== */}
      {activeView === 'track' && (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-gray-100/50 shadow-xs space-y-6" id="order-tracking-view">
          <div className="border-b border-gray-50 pb-4">
            <h2 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              <span>{t('trackOrder')}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">{language === 'bn' ? 'অর্ডার প্রস্তুত ও ডেলিভারি অগ্রগতি ট্র্যাক করুন।' : 'Track the package preparation and courier dispatch status.'}</p>
          </div>

          <form onSubmit={handleTrackOrder} className="flex gap-2">
            <input 
              type="text"
              placeholder={language === 'bn' ? 'অর্ডার নম্বর দিন (যেমন: SG-91544)...' : 'Order number (e.g. SG-91544)...'}
              value={trackOrderId}
              onChange={(e) => setTrackOrderId(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 px-3.5 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none uppercase"
            />
            <button 
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-6 py-3 rounded-xl transition-all cursor-pointer shadow-3xs uppercase tracking-wider"
            >
              {t('trackBtn')}
            </button>
          </form>

          {trackError && (
            <div className="p-3 bg-red-50 text-red-600 text-[11px] font-black rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>{trackError}</span>
            </div>
          )}

          {trackedOrder && (
            <div className="space-y-6 border-t border-gray-50 pt-5" id="tracking-results-panel">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50/50 p-3.5 rounded-xl text-[11px] font-bold text-gray-600 border border-gray-100/30">
                <div>
                  <span className="text-gray-400 uppercase text-[9px] tracking-wider block mb-0.5">{t('orderId')}</span>
                  <span className="font-black text-gray-700 text-xs">{trackedOrder.id}</span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[9px] tracking-wider block mb-0.5">{t('date')}</span>
                  <span className="font-black text-gray-700 text-xs">{trackedOrder.date}</span>
                </div>
                <div className="col-span-2 border-t border-gray-100 pt-2 mt-1">
                  <span className="text-gray-400 uppercase text-[9px] tracking-wider block mb-0.5">পণ্যসমূহ (Products)</span>
                  <p className="font-extrabold text-gray-700 text-[10px] leading-relaxed">{trackedOrder.products}</p>
                </div>
                <div className="col-span-2 border-t border-gray-100 pt-2 mt-1 flex justify-between">
                  <div>
                    <span className="text-gray-400 uppercase text-[9px] tracking-wider block mb-0.5">{t('totalAmount')}</span>
                    <span className="font-black text-emerald-600 text-xs">৳ {trackedOrder.totalAmount}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 uppercase text-[9px] tracking-wider block mb-0.5">ডেলিভারি জেলা</span>
                    <span className="font-black text-gray-700 text-[11px]">
                      {currentUser?.district || 'Dhaka'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stepper Tracking Visualizer placed -> confirmed -> processing -> shipped -> out for delivery -> delivered */}
              <div>
                <h3 className="font-extrabold text-xs text-gray-800 mb-4">{language === 'bn' ? 'ডেলিভারি অগ্রগতি চিত্র' : 'Live Stepper Status'}</h3>
                
                {/* Vertical Stepper timeline */}
                <div className="relative pl-6 space-y-6" id="tracking-timeline">
                  {/* Vertical stem bar */}
                  <div className="absolute left-2.5 top-2 bottom-2 w-[1px] bg-gray-100" />

                  {[
                    { key: 'Pending', bn: 'অর্ডার প্লেস করা হয়েছে', en: 'Order Placed', descBn: 'আমরা আপনার অর্ডারের তথ্য পেয়েছি।', descEn: 'Order received successfully.' },
                    { key: 'Confirmed', bn: 'অর্ডার নিশ্চিত হয়েছে', en: 'Order Confirmed', descBn: 'স্বাদ ঘর এজেন্ট অর্ডারটি ভেরিফাই করেছেন।', descEn: 'Verified and approved by team.' },
                    { key: 'Processing', bn: 'প্যাকেজিং চলছে', en: 'Processing & Packaging', descBn: 'প্রিমিয়াম প্যাকেট ও কার্টুন তৈরি করা হচ্ছে।', descEn: 'Quality check and packing.' },
                    { key: 'Shipped', bn: 'কুরিয়ারে পাঠানো হয়েছে', en: 'Shipped', descBn: 'আপনার এলাকায় পৌঁছানোর জন্য হস্তান্তর সম্পন্ন।', descEn: 'Handed over to courier service.' },
                    { key: 'OutForDelivery', bn: 'ডেলিভারি এজেন্ট পথে আছে', en: 'Out for Delivery', descBn: 'আজ আপনার ঠিকানায় ক্যাশ অন ডেলিভারি দেওয়া হবে।', descEn: 'Courier representative is arriving.' },
                    { key: 'Delivered', bn: 'ডেলিভারি সফল', en: 'Delivered Successfully', descBn: 'আপনার পণ্য সফলভাবে হস্তান্তর হয়েছে। ধন্যবাদ!', descEn: 'Package delivered.' }
                  ].map((step, idx, arr) => {
                    // Check logic status sequence:
                    const statusSequence = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'OutForDelivery', 'Delivered'];
                    const currentStatusIdx = statusSequence.indexOf(trackedOrder.status === 'Cancelled' ? 'Pending' : trackedOrder.status);
                    
                    // OutForDelivery can be simulated as part of Shipped/Delivered progression
                    let isCompleted = false;
                    let isActive = false;

                    const stepIdxInSeq = statusSequence.indexOf(step.key);

                    if (trackedOrder.status === 'Cancelled') {
                      isCompleted = step.key === 'Pending';
                      isActive = false;
                    } else {
                      isCompleted = stepIdxInSeq < currentStatusIdx;
                      isActive = stepIdxInSeq === currentStatusIdx || (trackedOrder.status === 'Delivered' && step.key === 'Delivered');
                      if (trackedOrder.status === 'Delivered') {
                        isCompleted = stepIdxInSeq < 5;
                      }
                    }

                    return (
                      <div key={step.key} className="relative flex gap-3">
                        {/* Bullet circle */}
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                          isCompleted 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : isActive 
                              ? 'bg-white border-emerald-600 text-emerald-600 scale-110' 
                              : 'bg-white border-gray-200 text-gray-300'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : isActive ? (
                            <Clock className="w-3 h-3 animate-spin" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                          )}
                        </div>

                        {/* Text */}
                        <div>
                          <h4 className={`text-xs font-black ${isActive ? 'text-emerald-700' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                            {language === 'bn' ? step.bn : step.en}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                            {language === 'bn' ? step.descBn : step.descEn}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==============================================
          VIEW 3: SUPPORT TICKETS & CHAT
          ============================================== */}
      {activeView === 'tickets' && (
        <div className="max-w-4xl mx-auto space-y-6" id="tickets-view">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100/50">
            <div>
              <h2 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <span>{t('myTickets')}</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">{language === 'bn' ? 'আপনার খোলা সাপোর্ট টিকিট ও চ্যাট কথোপকথন।' : 'Review and response to your raised support queries.'}</p>
            </div>
            <button
              onClick={() => setTicketFormOpen(!ticketFormOpen)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>{t('openTicketBtn')}</span>
            </button>
          </div>

          {/* Ticket Create Form Modal */}
          {ticketFormOpen && (
            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500/10 shadow-xs space-y-4" id="ticket-form-panel">
              <h3 className="font-extrabold text-sm text-gray-800 flex items-center justify-between">
                <span>{t('newTicketTitle')}</span>
                <button onClick={() => setTicketFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4.5 h-4.5" />
                </button>
              </h3>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t('subject')}</label>
                    <input 
                      type="text" 
                      required
                      placeholder={language === 'bn' ? 'যেমন: নষ্ট কালোজিরা মধু এসেছে' : 'e.g. Broken oil container delivered'}
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t('category')}</label>
                    <select
                      value={newTicketCategory}
                      onChange={(e) => setNewTicketCategory(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
                    >
                      <option value="Product Quality">{language === 'bn' ? 'পণ্যের গুণগত মান (Quality)' : 'Product Quality'}</option>
                      <option value="Delivery Delay">{language === 'bn' ? 'ডেলিভারিতে বিলম্ব (Delivery)' : 'Delivery Delay'}</option>
                      <option value="Payment Issue">{language === 'bn' ? 'পেমেন্ট জটিলতা (Payment)' : 'Payment Issue'}</option>
                      <option value="Refund Request">{language === 'bn' ? 'রিফান্ড ও ফেরত (Refund)' : 'Refund Request'}</option>
                      <option value="Account Access">{language === 'bn' ? 'অ্যাকাউন্ট অ্যাক্সেস (Account)' : 'Account Access'}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{language === 'bn' ? 'সমস্যার বিবরণ' : 'Problem Message'}</label>
                  <textarea 
                    rows={4}
                    required
                    placeholder={language === 'bn' ? 'দয়া করে বিস্তারিত লিখুন যাতে আমাদের প্রতিনিধি দ্রুত সমাধান করতে পারে...' : 'Write details of the issue here...'}
                    value={newTicketMessage}
                    onChange={(e) => setNewTicketMessage(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span>{t('attachment')}</span>
                  </label>
                  <input 
                    type="text"
                    placeholder={language === 'bn' ? 'সংযুক্ত করতে ইমেজের লিংক দিন (ঐচ্ছিক)...' : 'Attachment image URL link (optional)...'}
                    value={newTicketAttachment}
                    onChange={(e) => setNewTicketAttachment(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                {ticketSuccessMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-600 text-[11px] font-black rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                    <span>{ticketSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-6 py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider shadow-xs"
                >
                  {t('submitBtn')}
                </button>
              </form>
            </div>
          )}

          {/* Tickets List */}
          <div className="bg-white rounded-2xl border border-gray-100/50 overflow-hidden shadow-xs">
            {userTickets.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-bold space-y-2">
                <MessageSquare className="w-10 h-10 text-gray-200 mx-auto" />
                <p className="text-xs">{language === 'bn' ? 'আপনার কোনো সক্রিয় সাপোর্ট টিকিট নেই।' : 'You do not have any open support tickets.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4">{t('ticketNumber')}</th>
                      <th className="py-3 px-4">{t('subject')}</th>
                      <th className="py-3 px-4">{t('category')}</th>
                      <th className="py-3 px-4">{t('status')}</th>
                      <th className="py-3 px-4 text-right">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                    {userTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-black text-emerald-700">{ticket.ticket_id}</td>
                        <td className="py-3.5 px-4 truncate max-w-[150px]">{ticket.subject}</td>
                        <td className="py-3.5 px-4">{ticket.category}</td>
                        <td className="py-3.5 px-4">{getTicketStatusBadge(ticket.status)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setActiveView('ticket-detail');
                            }}
                            className="bg-gray-100 hover:bg-emerald-50 hover:text-emerald-600 text-gray-600 px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wide transition-all uppercase cursor-pointer"
                          >
                            {language === 'bn' ? 'চ্যাট খুলুন' : 'Open Chat'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 5: LIVE MESSENGER / CHAT */}
      {activeView === 'chat' && (
        <div className="max-w-xl mx-auto flex flex-col h-[calc(100vh-200px)] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden" id="customer-live-chat">
          <div className="bg-emerald-600 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveView('main')} className="p-1 hover:bg-white/10 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Headset className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">{language === 'bn' ? 'সরাসরি সহায়তা' : 'Live Support'}</h3>
                <span className="text-[10px] font-bold opacity-80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  {language === 'bn' ? 'অনলাইন' : 'Online'}
                </span>
              </div>
            </div>
            <button onClick={() => setActiveView('main')} className="p-1 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-gray-50/50">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <MessageCircle className="w-12 h-12 mb-4" />
                <p className="text-xs font-bold">{language === 'bn' ? 'এখনই চ্যাট শুরু করুন' : 'Start your conversation'}</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isAdmin = msg.sender_type === 'admin';
                return (
                  <div key={idx} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl shadow-3xs text-xs font-bold ${
                      isAdmin 
                        ? 'bg-white text-gray-800 rounded-tl-none border border-gray-100' 
                        : 'bg-emerald-600 text-white rounded-tr-none'
                    }`}>
                      <p>{msg.message_text}</p>
                      <span className={`text-[9px] block mt-1 opacity-60 ${isAdmin ? 'text-gray-400' : 'text-emerald-100'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text"
              placeholder={language === 'bn' ? 'বার্তা লিখুন...' : 'Type message...'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ==============================================
          VIEW 4: SUPPORT TICKET DETAILS & ACTIVE CHAT
          ============================================== */}
      {activeView === 'ticket-detail' && selectedTicket && (
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6" id="ticket-chat-panel">
          
          {/* Left Panel: Ticket info */}
          <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-gray-100/50 h-fit space-y-4">
            <div>
              <span className="text-[9px] text-gray-400 font-black tracking-widest uppercase block mb-1">Active Conversation</span>
              <h3 className="font-extrabold text-sm text-gray-800 tracking-tight">{selectedTicket.subject}</h3>
            </div>
            
            <div className="space-y-3.5 border-t border-gray-50 pt-3.5 text-[11px] font-bold text-gray-500">
              <div className="flex justify-between">
                <span>{t('ticketNumber')}:</span>
                <span className="font-black text-gray-700">{selectedTicket.ticket_id}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('category')}:</span>
                <span className="font-black text-gray-700">{selectedTicket.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t('status')}:</span>
                <span>{getTicketStatusBadge(selectedTicket.status)}</span>
              </div>
              <div className="flex justify-between">
                <span>তারিখ (Date):</span>
                <span className="font-black text-gray-700">{new Date(selectedTicket.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Chat interface */}
          <div className="md:col-span-8 bg-white rounded-2xl border border-gray-100/50 shadow-xs flex flex-col h-[480px]">
            {/* Chat header */}
            <div className="p-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/20">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h4 className="font-black text-xs text-gray-800">{t('chatHistory')}</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Shad Ghor Assistance Bot</p>
              </div>
            </div>

            {/* Chat Messages flow scroll area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/20" id="chat-messages-container">
              {ticketMessages.map((msg) => {
                const isAdmin = msg.sender_type === 'admin';
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs font-bold leading-relaxed shadow-3xs ${
                      isAdmin 
                        ? 'bg-white text-gray-700 border border-gray-100 rounded-tl-none' 
                        : 'bg-emerald-600 text-white rounded-tr-none'
                    }`}>
                      <p>{msg.message_text}</p>
                      
                      {msg.attachments && (
                        <div className="mt-2 space-y-2">
                          {JSON.parse(msg.attachments).map((url: string, idx: number) => (
                            <div key={idx} className="rounded-lg overflow-hidden border border-gray-100">
                              <img 
                                src={url} 
                                alt="Ticket upload payload" 
                                className="max-h-[140px] w-full object-cover shadow-3xs" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <span className={`block text-[8px] mt-1.5 text-right font-bold ${isAdmin ? 'text-gray-400' : 'text-emerald-100'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input message form */}
            <form onSubmit={handleSendReply} className="p-3 border-t border-gray-50 flex gap-2">
              <input 
                type="text"
                required
                disabled={selectedTicket.status === 'Closed'}
                placeholder={selectedTicket.status === 'Closed' ? 'This conversation is locked.' : t('typeMessage')}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-3.5 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={selectedTicket.status === 'Closed'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50 shadow-3xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================
          VIEW 5: RETURN & REFUND APPLICATION FORM
          ============================================== */}
      {activeView === 'return' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6" id="return-panel">
          
          {/* Left panel form */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100/50 shadow-xs space-y-5">
            <div className="border-b border-gray-50 pb-4">
              <h2 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-600" />
                <span>{t('returnFormTitle')}</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">{language === 'bn' ? 'ভেজাল বা নষ্ট পণ্য পরিবর্তনের জন্য আবেদনটি পূরণ করুন।' : 'Submit detailed details to initiate quality analysis.'}</p>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t('orderId')}</label>
                  <select
                    required
                    value={returnOrderId}
                    onChange={(e) => {
                      setReturnOrderId(e.target.value);
                      setReturnProductId(''); // reset product
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="">{language === 'bn' ? 'অর্ডার আইডি নির্বাচন করুন' : 'Select Order ID'}</option>
                    {userOrders.map((o) => (
                      <option key={o.id} value={o.id}>{o.id} (৳{o.totalAmount} - {o.date})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t('selectProduct')}</label>
                  <select
                    required
                    disabled={!returnOrderId}
                    value={returnProductId}
                    onChange={(e) => setReturnProductId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">{language === 'bn' ? 'পণ্য নির্বাচন করুন' : 'Select Product'}</option>
                    {returnOrderId && (
                      // Parse order products or list options dynamically
                      <>
                        <option value="mustard-oil-1l">{language === 'bn' ? 'খাঁটি সরিষার তেল' : 'Pure Mustard Oil'}</option>
                        <option value="honey-sundarban-500g">{language === 'bn' ? 'সুন্দরবনের প্রাকৃতিক মধু' : 'Sundarban Natural Honey'}</option>
                        <option value="ajwa-dates-500g">{language === 'bn' ? 'প্রিমিয়াম আজওয়া খেজুর' : 'Premium Ajwa Dates'}</option>
                        <option value="black-seed-honey-500g">{language === 'bn' ? 'কালোজিরা ফুলের মধু' : 'Black Seed Honey'}</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t('returnReason')}</label>
                <input 
                  type="text" 
                  required
                  placeholder={t('returnReasonPlaceholder')}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t('returnDesc')}</label>
                <textarea 
                  rows={3}
                  required
                  placeholder={language === 'bn' ? 'পণ্যটির কী সমস্যা দয়া করে বিস্তারিত লিখুন...' : 'Write detailed reasons for verification...'}
                  value={returnDesc}
                  onChange={(e) => setReturnDesc(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span>{t('uploadImage')}</span>
                </label>
                <input 
                  type="text"
                  placeholder={language === 'bn' ? 'পণ্যের নষ্ট অবস্থার ইমেজের লিংক দিন...' : 'Product damage photo URL link...'}
                  value={returnImageUrl}
                  onChange={(e) => setReturnImageUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              {returnSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-[11px] font-black rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                  <span>{returnSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-6 py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider shadow-xs"
              >
                {t('submitBtn')}
              </button>
            </form>
          </div>

          {/* Right panel return requests list */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100/50 space-y-4 h-fit">
            <h3 className="font-extrabold text-xs text-gray-800 pb-2.5 border-b border-gray-50 uppercase tracking-widest">
              {language === 'bn' ? 'পূর্ববর্তী রিটার্ন তালিকা' : 'My Return History'}
            </h3>

            {submittedReturns.length === 0 ? (
              <p className="text-xs text-gray-400 font-bold py-6 text-center">{language === 'bn' ? 'কোনো পূর্ববর্তী রিটার্ন আবেদন পাওয়া যায়নি।' : 'No return requests submitted yet.'}</p>
            ) : (
              <div className="space-y-3">
                {submittedReturns.map((item) => (
                  <div key={item.id} className="p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/30 text-[11px] font-bold text-gray-600 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-emerald-700 text-xs">{item.order_id}</span>
                      {getReturnStatusBadge(item.status)}
                    </div>
                    <p className="text-gray-800 text-[11px] font-extrabold">{item.reason}</p>
                    <p className="text-[10px] text-gray-400 leading-normal font-bold">{item.description}</p>
                    <span className="block text-[8px] text-gray-400 pt-1 text-right">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==============================================
          VIEW 6: QUICK HELP GUIDES MODALS / DETAILS
          ============================================== */}
      {activeView === 'quick-guide' && (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-gray-100/50 shadow-xs space-y-5" id="guide-panel">
          
          {guideType === 'payment' && (
            <>
              <div className="border-b border-gray-50 pb-4">
                <h3 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>{t('paymentHelp')}</span>
                </h3>
              </div>
              <div className="space-y-3.5 text-xs text-gray-600 font-bold leading-relaxed">
                <p>{language === 'bn' ? 'স্বাদ ঘর শপে খুব সহজেই পেমেন্ট করা যায়। আমরা ক্যাশ অন ডেলিভারি (Cash on Delivery) ছাড়াও একাধিক অনলাইন ব্যাংক পেমেন্ট সাপোর্ট করি:' : 'We accept simple bank or mobile wallet options for customer convenience:'}</p>
                <ul className="list-disc list-inside space-y-2 text-[11px] text-gray-400 font-bold">
                  <li><strong className="text-gray-600">bKash / Nagad / Rocket:</strong> {language === 'bn' ? 'অর্ডার পেমেন্ট গেটওয়ের মাধ্যমে ইনস্ট্যান্ট পেমেন্ট সুবিধা।' : 'Instant merchant payments via SSLCommerz gateway.'}</li>
                  <li><strong className="text-gray-600">Cards:</strong> {language === 'bn' ? 'যেকোনো ভিসা, মাস্টারকার্ড বা ডিবিবিএল নেক্সাস পে।' : 'Any local Visa, Mastercard, or Nexus Pay card.'}</li>
                  <li><strong className="text-gray-600">COD:</strong> {language === 'bn' ? 'পণ্য হাতে পেয়ে পেমেন্ট পরিশোধ করুন।' : 'Pay directly to delivery driver upon review.'}</li>
                </ul>
              </div>
            </>
          )}

          {guideType === 'delivery' && (
            <>
              <div className="border-b border-gray-50 pb-4">
                <h3 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <span>{t('deliveryInfo')}</span>
                </h3>
              </div>
              <div className="space-y-3.5 text-xs text-gray-600 font-bold leading-relaxed">
                <p>{language === 'bn' ? 'আমাদের নিজস্ব লজিস্টিকস ও কুরিয়ার পার্টনাররা দ্রুত সময়ে ডেলিভারি নিশ্চিত করেন:' : 'Our logistics network ensures pure quality safety throughout transit:'}</p>
                <ul className="list-disc list-inside space-y-2 text-[11px] text-gray-400 font-bold">
                  <li><strong className="text-gray-600">{language === 'bn' ? 'ডেলিভারি সময়:' : 'Delivery Lead Time:'}</strong> {language === 'bn' ? 'ঢাকার ভেতরে ১-২ দিন, ঢাকার বাইরে ২-৪ দিন।' : 'Inside Dhaka 24-48 hours. Outside Dhaka 3-4 days.'}</li>
                  <li><strong className="text-gray-600">{language === 'bn' ? 'ডেলিভারি রেট:' : 'Delivery Rate:'}</strong> {language === 'bn' ? 'ঢাকার ভেতরে ৬০ টাকা, ঢাকার বাইরে ১২০ টাকা।' : 'Inside Dhaka ৳60. Outside Dhaka ৳120.'}</li>
                  <li><strong className="text-gray-600">{language === 'bn' ? 'কুরিয়ার পার্টনার:' : 'Courier Partners:'}</strong> Pathao, Steadfast, RedX.</li>
                </ul>
              </div>
            </>
          )}

          {guideType === 'how-to-order' && (
            <>
              <div className="border-b border-gray-50 pb-4">
                <h3 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  <span>{t('howToOrder')}</span>
                </h3>
              </div>
              <div className="space-y-3.5 text-xs text-gray-600 font-bold leading-relaxed">
                <ol className="list-decimal list-inside space-y-2 text-[11px] text-gray-400 font-bold">
                  <li>{language === 'bn' ? 'আমাদের প্রোডাক্ট ক্যাটালগ থেকে খাঁটি পণ্য পছন্দ করুন।' : 'Find your desired organic honey, ghee, or oil items.'}</li>
                  <li>{language === 'bn' ? '"কার্টে যোগ করুন" বা "Buy Now" বাটন চাপুন।' : 'Click "Add to Cart" or "Buy Now" immediately.'}</li>
                  <li>{language === 'bn' ? 'কার্ট আইকন থেকে চেকআউটে প্রবেশ করুন।' : 'Go to checkout page and specify delivery details.'}</li>
                  <li>{language === 'bn' ? 'আপনার সচল মোবাইল নম্বর ও শিপিং এড্রেস লিখে কনফার্ম করুন!' : 'Select Payment mode and confirm order with OTP verification!'}</li>
                </ol>
              </div>
            </>
          )}

          {guideType === 'account' && (
            <>
              <div className="border-b border-gray-50 pb-4">
                <h3 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span>{t('accountHelp')}</span>
                </h3>
              </div>
              <p className="text-xs text-gray-600 font-bold leading-relaxed">
                {language === 'bn' 
                  ? 'আপনার অর্ডার ট্র্যাকিং হিস্ট্রি দেখতে, ঠিকানা সংশোধন করতে বা পাসওয়ার্ড পরিবর্তন করতে অ্যাকাউন্ট ড্যাশবোর্ডে লগইন করুন। আপনি যেকোনো সময় প্রোফাইলের ছবি এবং জেলা-বিভাগ সম্পাদনা করতে পারবেন।' 
                  : 'Maintain your addresses, password hashes, and profile badges directly under the Account tab securely. Contact support if you need manual user data corrections.'}
              </p>
            </>
          )}

          {guideType === 'login' && (
            <>
              <div className="border-b border-gray-50 pb-4">
                <h3 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-600" />
                  <span>{t('loginHelp')}</span>
                </h3>
              </div>
              <p className="text-xs text-gray-600 font-bold leading-relaxed">
                {language === 'bn' 
                  ? 'আমরা নিরাপদ ১-ক্লিক মোবাইল ওটিপি সাইন-ইন সমাধান এবং প্রথাগত ইমেইল-পাসওয়ার্ড লগইন সেবা প্রদান করি। ওটিপি না পেলে দয়া করে মোবাইল সিগন্যাল চেক করুন অথবা পুনরায় ওটিপি বাটন চাপুন।' 
                  : 'We offer secure OTP Verification login as well as traditional email. In case OTP SMS delivery delays, ensure clean local mobile operator signal or trigger resend.'}
              </p>
            </>
          )}

          {guideType === 'cancel' && (
            <>
              <div className="border-b border-gray-50 pb-4">
                <h3 className="font-extrabold text-base text-gray-800 font-sans flex items-center gap-2">
                  <X className="w-5 h-5 text-red-500" />
                  <span>{t('cancelOrder')}</span>
                </h3>
              </div>
              <p className="text-xs text-gray-600 font-bold leading-relaxed">
                {language === 'bn' 
                  ? 'অর্ডার প্লেস করার ২ ঘণ্টার মধ্যে আপনি সরাসরি সেটিংস থেকে বা চ্যাট টিকিটে গিয়ে ক্যানসেল রিকোয়েস্ট পাঠাতে পারেন। প্যাকেজ কুরিয়ারে হস্তান্তর করা হয়ে থাকলে অর্ডার বাতিল করা সম্ভব নয়।' 
                  : 'Orders can only be cancelled within 2 hours of verification. Once handed over to couriers, cancellations are not processed. Raise a Support Ticket for custom cancellations.'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
