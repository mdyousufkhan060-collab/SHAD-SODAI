import { adminService } from './adminService';

export interface AdminConversation {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  status: 'open' | 'closed' | 'pending';
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminMessage {
  id: number;
  conversation_id: number;
  sender_id: number | null;
  sender_type: 'customer' | 'admin';
  message_text: string;
  attachments?: string;
  is_read: boolean;
  created_at: string;
}

export const adminSupportService = {
  async getConversations(): Promise<AdminConversation[]> {
    try {
      const res = await fetch('/api/admin/customer-messages/conversations', {
        headers: adminService.getHeaders()
      });
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  async getMessages(conversationId: number): Promise<AdminMessage[]> {
    try {
      const res = await fetch(`/api/admin/customer-messages/messages/${conversationId}`, {
        headers: adminService.getHeaders()
      });
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  async reply(conversationId: number, messageText: string, attachments: string[] = []): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/customer-messages/reply', {
        method: 'POST',
        headers: adminService.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ conversation_id: conversationId, message_text: messageText, attachments })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateStatus(conversationId: number, status: 'open' | 'closed' | 'pending'): Promise<boolean> {
    try {
      const res = await fetch(`/api/admin/customer-messages/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: adminService.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
