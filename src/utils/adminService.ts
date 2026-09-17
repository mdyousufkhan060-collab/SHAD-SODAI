// Admin Service - Secure network gateway interfacing with server-side Express APIs

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  role_id: number;
  last_login_at: string | null;
}

export const adminService = {
  // Helper to construct authorization headers with fallback token
  getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = { ...customHeaders };
    const token = localStorage.getItem('admin_session_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Perform secure, server-side authenticated login
  async login(email: string, plaintext: string): Promise<{ success: boolean; error?: string; admin?: AdminUser }> {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password: plaintext })
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Invalid administrative credentials.'
        };
      }

      // Store non-sensitive session data in sessionStorage for UI state persistence
      sessionStorage.setItem('admin_profile_state', JSON.stringify(data.admin));
      
      // Store JWT token securely in localStorage for cross-refresh/cross-tab iframe robustness
      if (data.token) {
        localStorage.setItem('admin_session_token', data.token);
      }

      return {
        success: true,
        admin: data.admin
      };
    } catch (err) {
      console.error('[Admin API Login Error] ', err);
      return {
        success: false,
        error: 'Unable to establish secure connection to administration server.'
      };
    }
  },

  // Log out by clearing server-side session cookies & client sessionStorage & localStorage
  async logout(): Promise<void> {
    try {
      await fetch('/api/admin/logout', { 
        method: 'POST',
        headers: this.getHeaders()
      });
    } catch (err) {
      console.error('[Admin API Logout Error] ', err);
    } finally {
      sessionStorage.removeItem('admin_profile_state');
      localStorage.removeItem('admin_session_token');
    }
  },

  // Asynchronously query the current authenticated admin session from the server
  async checkSession(): Promise<AdminUser | null> {
    try {
      const response = await fetch('/api/admin/me', {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        sessionStorage.removeItem('admin_profile_state');
        localStorage.removeItem('admin_session_token');
        return null;
      }
      
      const data = await response.json();
      if (data.authenticated && data.admin) {
        sessionStorage.setItem('admin_profile_state', JSON.stringify(data.admin));
        return data.admin;
      }
      return null;
    } catch {
      return this.getLocalProfileState();
    }
  },

  // Fallback helper to query current cached UI profile details (non-authoritative)
  getLocalProfileState(): AdminUser | null {
    try {
      const data = sessionStorage.getItem('admin_profile_state');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // Authoritative check if the admin profile is present
  requireAdminAuth(): boolean {
    return this.getLocalProfileState() !== null || localStorage.getItem('admin_session_token') !== null;
  },
  
  // Reviews Management
  async getReviews(params: { status?: string; rating?: string; reported?: boolean; search?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.rating) queryParams.append('rating', params.rating);
    if (params.reported) queryParams.append('reported', 'true');
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`/api/admin/reviews?${queryParams.toString()}`, {
      headers: this.getHeaders()
    });
    return response.json();
  },

  async getReviewStats() {
    const response = await fetch('/api/admin/reviews/stats', {
      headers: this.getHeaders()
    });
    return response.json();
  },

  async updateReviewStatus(id: number, status: string) {
    const response = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  async bulkUpdateReviewStatus(ids: number[], status: string) {
    const response = await fetch('/api/admin/reviews/bulk-status', {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ids, status })
    });
    return response.json();
  },

  async replyToReview(id: number, reply: string) {
    const response = await fetch(`/api/admin/reviews/${id}/reply`, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ reply })
    });
    return response.json();
  },

  async deleteReview(id: number) {
    const response = await fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return response.json();
  }
};
