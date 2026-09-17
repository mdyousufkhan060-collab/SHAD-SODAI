import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Send, 
  Paperclip, 
  User, 
  Clock, 
  CheckCheck, 
  MoreVertical, 
  ChevronLeft,
  X,
  AlertCircle,
  CheckCircle2,
  Inbox,
  UserCheck,
  UserX,
  RefreshCw,
  Mail,
  Phone,
  ShoppingBag
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { adminSupportService, AdminConversation, AdminMessage } from '../utils/adminSupportService';
import { motion, AnimatePresence } from 'motion/react';

export const AdminCustomerMessages: React.FC = () => {
  const { language, t } = useLanguage();
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<AdminConversation | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'closed'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    setIsLoading(true);
    const data = await adminSupportService.getConversations();
    setConversations(data);
    setIsLoading(false);
  };

  const fetchMessages = async (convId: number) => {
    setIsMessagesLoading(true);
    const data = await adminSupportService.getMessages(convId);
    setMessages(data);
    setIsMessagesLoading(false);
    
    // Auto-update unread count in sidebar locally
    setConversations(prev => prev.map(c => 
      c.id === convId ? { ...c, unread_count: 0 } : c
    ));
  };

  useEffect(() => {
    fetchConversations();
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      // Poll for messages in active conversation every 10 seconds
      const interval = setInterval(() => fetchMessages(selectedConv.id), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedConv?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !replyText.trim()) return;

    const success = await adminSupportService.reply(selectedConv.id, replyText);
    if (success) {
      setReplyText('');
      fetchMessages(selectedConv.id);
      fetchConversations();
    }
  };

  const handleStatusChange = async (convId: number, status: 'open' | 'closed' | 'pending') => {
    const success = await adminSupportService.updateStatus(convId, status);
    if (success) {
      if (selectedConv?.id === convId) {
        setSelectedConv(prev => prev ? { ...prev, status } : null);
      }
      fetchConversations();
    }
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.customer_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50 rounded-2xl overflow-hidden border border-gray-200" id="admin-messages-module">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Inbox */}
        <div className={`w-full md:w-80 flex flex-col bg-white border-r border-gray-200 transition-all ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Inbox className="w-4 h-4 text-emerald-600" />
                {language === 'bn' ? 'ইনবক্স' : 'Inbox'}
              </h2>
              <button 
                onClick={fetchConversations}
                className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-emerald-600"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder={language === 'bn' ? 'গ্রাহক খুঁজুন...' : 'Search customers...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['all', 'open', 'pending', 'closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as any)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    statusFilter === s 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {s === 'all' ? (language === 'bn' ? 'সব' : 'All') : t(s)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {isLoading && conversations.length === 0 ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading Inbox...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                <p className="text-xs text-gray-400 font-bold">
                  {searchQuery ? (language === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found') : (language === 'bn' ? 'কোনো বার্তা নেই' : 'No messages yet')}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full p-4 flex gap-3 border-b border-gray-50 transition-all text-left hover:bg-gray-50/50 ${
                    selectedConv?.id === conv.id ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
                      {conv.customer_name.charAt(0)}
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-xs font-black text-gray-800 truncate">{conv.customer_name}</h3>
                      <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap">
                        {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-1 font-bold mb-1">
                      {conv.last_message || 'New conversation'}
                    </p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                      conv.status === 'open' ? 'bg-emerald-100 text-emerald-700' :
                      conv.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {conv.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Content: Conversation View */}
        <div className={`flex-1 flex flex-col bg-gray-50 transition-all ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="h-16 shrink-0 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-10 shadow-3xs">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedConv(null)}
                    className="md:hidden p-2 -ml-2 text-gray-400 hover:text-emerald-600"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs">
                    {selectedConv.customer_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-gray-800">{selectedConv.customer_name}</h2>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-gray-400 font-bold">{selectedConv.customer_email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex items-center gap-2 mr-4">
                    <select 
                      value={selectedConv.status}
                      onChange={(e) => handleStatusChange(selectedConv.id, e.target.value as any)}
                      className="text-[10px] font-black uppercase tracking-widest bg-gray-100 border-none rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer"
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-gray-50 transition-all">
                    <User className="w-4.5 h-4.5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-gray-50 transition-all">
                    <MoreVertical className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                <div className="flex flex-col items-center py-4 mb-4">
                  <div className="px-4 py-1.5 bg-white/80 backdrop-blur-xs rounded-full border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest shadow-3xs">
                    Conversation Started {new Date(selectedConv.created_at).toLocaleDateString()}
                  </div>
                </div>

                {isMessagesLoading && messages.length === 0 ? (
                  <div className="flex justify-center p-12">
                    <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender_type === 'admin';
                    return (
                      <div 
                        key={msg.id}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] md:max-w-[70%] space-y-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3.5 rounded-2xl shadow-3xs border ${
                            isAdmin 
                              ? 'bg-emerald-600 text-white border-emerald-500 rounded-tr-none' 
                              : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'
                          }`}>
                            <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
                            {msg.attachments && (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {JSON.parse(msg.attachments).map((url: string, idx: number) => (
                                  <img key={idx} src={url} className="w-full h-24 object-cover rounded-lg border border-white/20" alt="Attachment" />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center gap-1.5 px-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isAdmin && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSendReply} className="flex items-end gap-3 max-w-5xl mx-auto">
                  <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 p-2 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all flex flex-col">
                    <textarea 
                      rows={1}
                      placeholder={language === 'bn' ? 'একটি বার্তা লিখুন...' : 'Type a reply...'}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(e);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs font-bold bg-transparent outline-none resize-none min-h-[40px] max-h-[120px]"
                    />
                    <div className="flex items-center justify-between px-2 pb-1">
                      <div className="flex gap-1">
                        <button type="button" className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-white rounded-xl transition-all">
                          <Paperclip className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold">Press Enter to send</span>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={!replyText.trim()}
                    className="p-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:bg-gray-400 text-white rounded-2xl shadow-xs transition-all hover:scale-105 active:scale-95"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-60">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-2">
                {language === 'bn' ? 'একটি কথোপকথন নির্বাচন করুন' : 'Select a Conversation'}
              </h2>
              <p className="text-xs text-gray-400 font-bold max-w-xs mx-auto">
                {language === 'bn' ? 'বাম পাশের ইনবক্স থেকে গ্রাহকের সাথে কথা বলা শুরু করুন।' : 'Choose a conversation from the inbox on the left to start replying to your customers.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Info Modal (optional expansion) */}
      <AnimatePresence>
        {selectedConv && false && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-xs z-50 flex justify-end p-4">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-black text-gray-800 uppercase tracking-widest">Customer Insight</h3>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
