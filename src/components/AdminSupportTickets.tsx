import React, { useState, useEffect } from 'react';
import { 
  Headset, 
  Search, 
  Filter, 
  Clock, 
  User, 
  MessageSquare, 
  MoreHorizontal, 
  ChevronRight, 
  ArrowLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Send,
  PlusCircle,
  FileText,
  UserCheck,
  Shield,
  Phone,
  Mail,
  ExternalLink,
  Clipboard,
  StickyNote
} from 'lucide-react';
import { adminService } from '../utils/adminService';

interface AdminSupportTicketsProps {
  language: 'bn' | 'en';
}

export const AdminSupportTickets: React.FC<AdminSupportTicketsProps> = ({ language }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [replyMessage, setReplyMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(true); // Default to reply

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/support-tickets', {
        headers: adminService.getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketDetails = async (id: number) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/admin/support-tickets/${id}`, {
        headers: adminService.getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data);
      }
    } catch (err) {
      console.error('Failed to fetch ticket details:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateTicket = async (updates: any) => {
    if (!selectedTicket) return;
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/admin/support-tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: adminService.getHeaders(),
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        // Refresh details
        await fetchTicketDetails(selectedTicket.id);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/admin/support-tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: adminService.getHeaders(),
        body: JSON.stringify({ message_text: replyMessage })
      });
      if (response.ok) {
        setReplyMessage('');
        await fetchTicketDetails(selectedTicket.id);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddInternalNote = async () => {
    if (!selectedTicket || !internalNote.trim()) return;
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/admin/support-tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: adminService.getHeaders(),
        body: JSON.stringify({ 
          internal_notes: selectedTicket.internal_notes 
            ? `${selectedTicket.internal_notes}\n\n[${new Date().toLocaleString()}] ${internalNote}`
            : `[${new Date().toLocaleString()}] ${internalNote}`
        })
      });
      if (response.ok) {
        setInternalNote('');
        await fetchTicketDetails(selectedTicket.id);
      }
    } catch (err) {
      console.error('Failed to add internal note:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase border border-blue-100">Open</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase border border-amber-100">In Progress</span>;
      case 'waiting_for_customer':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-[10px] font-black uppercase border border-purple-100">Waiting for Customer</span>;
      case 'waiting_for_admin':
        return <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-[10px] font-black uppercase border border-orange-100">Waiting for Admin</span>;
      case 'resolved':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase border border-emerald-100">Resolved</span>;
      case 'closed':
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-full text-[10px] font-black uppercase border border-gray-100">Closed</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-full text-[10px] font-black uppercase">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-tight">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> Low
        </span>;
      case 'normal':
        return <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-tight">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Normal
        </span>;
      case 'high':
        return <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase tracking-tight">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div> High
        </span>;
      case 'urgent':
        return <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase tracking-tight">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div> Urgent
        </span>;
      default:
        return <span>{priority}</span>;
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-gray-500">Loading Support Tickets...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in" id="admin-support-tickets-module">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6" id="tickets-header">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <Headset className="w-6 h-6 text-emerald-600" />
            {language === 'bn' ? 'সাপোর্ট টিকিট ব্যবস্থাপনা' : 'Support Ticket Management'}
          </h2>
          <p className="text-xs font-bold text-gray-500 mt-1">
            {language === 'bn' ? 'গ্রাহকদের সহায়তা টিকিট দেখুন এবং উত্তর দিন' : 'Review and respond to customer support requests'}
          </p>
        </div>
        
        {selectedTicket && (
          <button 
            onClick={() => setSelectedTicket(null)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer self-start md:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'bn' ? 'টিকিট লিস্টে ফিরুন' : 'Back to Ticket List'}
          </button>
        )}
      </div>

      {!selectedTicket ? (
        <div className="space-y-6" id="tickets-list-view">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col lg:flex-row gap-4" id="tickets-filters">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder={language === 'bn' ? 'টিকিট আইডি, কাস্টমার বা বিষয় দিয়ে খুঁজুন...' : 'Search by Ticket ID, Customer, or Subject...'}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select 
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-black text-gray-700 focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">{language === 'bn' ? 'সব স্ট্যাটাস' : 'All Status'}</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_customer">Waiting for Customer</option>
                  <option value="waiting_for_admin">Waiting for Admin</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <select 
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-black text-gray-700 focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">{language === 'bn' ? 'সব প্রায়োরিটি' : 'All Priority'}</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden" id="tickets-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-150">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Update</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-gray-50 rounded-full">
                            <Headset className="w-6 h-6 text-gray-300" />
                          </div>
                          <p className="text-sm font-bold text-gray-400">No support tickets found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <tr 
                        key={ticket.id} 
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                        onClick={() => fetchTicketDetails(ticket.id)}
                      >
                        <td className="px-6 py-4">
                          <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {ticket.ticket_id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-600 border border-gray-200">
                              {ticket.customer_name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-gray-700 leading-none">{ticket.customer_name}</span>
                              <span className="text-[10px] text-gray-400 font-bold mt-1.5">{ticket.customer_email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-gray-700 truncate max-w-[200px]">{ticket.subject}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black text-gray-500">{ticket.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          {getPriorityBadge(ticket.priority)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">{new Date(ticket.updated_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            className="p-1.5 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-lg transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchTicketDetails(ticket.id);
                            }}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Ticket Details View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" id="ticket-details-view">
          
          {/* Main Conversation Pane */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Ticket Subject Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-700 tracking-widest uppercase">
                  {selectedTicket.category}
                </span>
                <div className="flex items-center gap-3">
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>
              <h1 className="text-lg font-black text-gray-800 leading-tight">
                {selectedTicket.subject}
              </h1>
              <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Created: {new Date(selectedTicket.created_at).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  Assigned: {selectedTicket.assigned_staff_name || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-4 border-b border-gray-150 bg-gray-50/50 flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Conversation Thread
                </h3>
                <span className="text-[10px] font-bold text-gray-400">{selectedTicket.replies?.length || 0} Messages</span>
              </div>

              <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[600px] bg-gray-50/20">
                {selectedTicket.replies?.map((reply: any) => (
                  <div key={reply.id} className={`flex ${reply.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] space-y-1.5 ${reply.sender_type === 'admin' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] font-black text-gray-500">{reply.sender_name}</span>
                        <span className="text-[9px] font-bold text-gray-300">{new Date(reply.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs ${
                        reply.sender_type === 'admin' 
                          ? 'bg-emerald-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-700 border border-gray-150 rounded-tl-none'
                      }`}>
                        {reply.message_text}
                      </div>
                      {reply.attachments && JSON.parse(reply.attachments).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {JSON.parse(reply.attachments).map((url: string, idx: number) => (
                            <a 
                              key={idx} 
                              href={url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-1.5 bg-white border border-gray-200 rounded-lg hover:border-emerald-500 transition-all shadow-xs"
                            >
                              <FileText className="w-4 h-4 text-emerald-600" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-gray-150 bg-white">
                <div className="flex items-center gap-4 mb-3">
                  <button 
                    onClick={() => setShowReplyBox(true)}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                      showReplyBox ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Reply to Customer
                  </button>
                  <button 
                    onClick={() => setShowReplyBox(false)}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                      !showReplyBox ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Internal Note
                  </button>
                </div>

                {showReplyBox ? (
                  <div className="space-y-3">
                    <textarea 
                      placeholder="Type your reply here..."
                      className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                    ></textarea>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-400 font-bold">
                        Your reply will be visible to the customer instantly.
                      </p>
                      <button 
                        onClick={handleSendReply}
                        disabled={isActionLoading || !replyMessage.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm"
                      >
                        {isActionLoading ? 'Sending...' : 'Send Reply'}
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea 
                      placeholder="Add an internal note (only visible to staff)..."
                      className="w-full h-32 p-4 bg-amber-50/30 border border-amber-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none"
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                    ></textarea>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-amber-600 font-bold">
                        Internal notes are <span className="underline">never</span> visible to the customer.
                      </p>
                      <button 
                        onClick={handleAddInternalNote}
                        disabled={isActionLoading || !internalNote.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm"
                      >
                        {isActionLoading ? 'Saving...' : 'Save Note'}
                        <StickyNote className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Internal Notes History (If any) */}
            {selectedTicket.internal_notes && (
              <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                  <Clipboard className="w-4 h-4" />
                  Internal Admin Notes
                </h3>
                <div className="p-4 bg-white rounded-xl border border-amber-100 text-xs font-semibold text-amber-900 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.internal_notes}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Customer & Ticket Info */}
          <div className="space-y-6">
            
            {/* Management Controls */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest border-b border-gray-100 pb-3">
                Manage Ticket
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Status</label>
                  <select 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateTicket({ status: e.target.value })}
                    disabled={isActionLoading}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_for_customer">Waiting for Customer</option>
                    <option value="waiting_for_admin">Waiting for Admin</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Priority</label>
                  <select 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={selectedTicket.priority}
                    onChange={(e) => handleUpdateTicket({ priority: e.target.value })}
                    disabled={isActionLoading}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assign Staff</label>
                  <select 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={selectedTicket.assigned_staff_id || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      const name = e.target.options[e.target.selectedIndex].text;
                      handleUpdateTicket({ assigned_staff_id: id || null, assigned_staff_name: id ? name : null });
                    }}
                    disabled={isActionLoading}
                  >
                    <option value="">Unassigned</option>
                    <option value="1">Super Admin</option>
                    <option value="2">Customer Care Agent</option>
                    <option value="3">Support Specialist</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customer Profile */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest border-b border-gray-100 pb-3">
                Customer Profile
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg font-black border border-emerald-100">
                  {selectedTicket.customer?.full_name?.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-800 leading-none">{selectedTicket.customer?.full_name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 mt-1.5">ID: #CUST-{selectedTicket.customer_id}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2.5 text-[11px] font-bold text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {selectedTicket.customer_email}
                </div>
                <div className="flex items-center gap-2.5 text-[11px] font-bold text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {selectedTicket.customer_phone}
                </div>
                <div className="flex items-center gap-2.5 text-[11px] font-bold text-gray-600">
                  <Shield className="w-4 h-4 text-gray-400" />
                  Account Status: 
                  <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                    selectedTicket.customer?.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {selectedTicket.customer?.status || 'Active'}
                  </span>
                </div>
              </div>

              <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-black rounded-xl border border-gray-200 transition-all active:scale-95">
                View Full History
              </button>
            </div>

            {/* Related Order */}
            {selectedTicket.related_order_id && (
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest border-b border-gray-100 pb-3">
                  Linked Order
                </h3>
                
                {selectedTicket.order ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order ID</p>
                        <p className="text-xs font-black text-gray-800">{selectedTicket.order.id}</p>
                      </div>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${
                        selectedTicket.order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {selectedTicket.order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</p>
                        <p className="text-xs font-black text-gray-800">৳{selectedTicket.order.total_amount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                        <p className="text-xs font-black text-gray-800">{new Date(selectedTicket.order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <a 
                      href={`#/admin/orders/${selectedTicket.order.id}`}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-black rounded-xl border border-emerald-100 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      View Order Details
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-[10px] font-bold text-red-700">Order ID {selectedTicket.related_order_id} not found in system.</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Audit Logs Preview */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-150 space-y-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Ticket Timeline
              </h3>
              <div className="space-y-3 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                <div className="relative pl-7 space-y-0.5">
                  <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                  <p className="text-[10px] font-black text-gray-700">Ticket Created</p>
                  <p className="text-[9px] font-bold text-gray-400">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
                {selectedTicket.first_response_at && (
                  <div className="relative pl-7 space-y-0.5">
                    <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                    <p className="text-[10px] font-black text-gray-700">First Staff Response</p>
                    <p className="text-[9px] font-bold text-gray-400">{new Date(selectedTicket.first_response_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedTicket.resolved_at && (
                  <div className="relative pl-7 space-y-0.5">
                    <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white shadow-sm"></div>
                    <p className="text-[10px] font-black text-gray-700">Ticket Resolved</p>
                    <p className="text-[9px] font-bold text-gray-400">{new Date(selectedTicket.resolved_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
