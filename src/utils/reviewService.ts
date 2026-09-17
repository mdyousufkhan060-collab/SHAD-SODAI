import { accountService } from './accountService';

export interface Review {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_avatar?: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  order_id?: string;
  rating: number; 
  title?: string;
  comment: string;
  images?: string[]; 
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  report_status: 'none' | 'reported' | 'investigating' | 'resolved';
  is_verified_purchase: boolean;
  admin_reply?: string;
  admin_reply_at?: string;
  created_at: string;
  updated_at: string;
}

export const reviewService = {
  // Legacy/Compatibility method - should be avoided in favor of async methods
  getRawReviews(): any[] {
    console.warn('reviewService.getRawReviews() is deprecated. Use async getReviewsForProduct instead.');
    return [];
  },

  // Public: Get reviews for a product
  async getReviewsForProduct(productId: string, page: number = 1, limit: number = 10) {
    try {
      const response = await fetch(`/api/customer/reviews/${productId}?page=${page}&limit=${limit}`);
      const data = await response.json();
      if (data.success) {
        return {
          reviews: data.reviews.map((r: any) => ({
            ...r,
            images: typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || [])
          })),
          hasMore: (page * limit) < data.total,
          totalCount: data.total
        };
      }
      return { reviews: [], hasMore: false, totalCount: 0 };
    } catch (err) {
      console.error('Failed to fetch reviews', err);
      return { reviews: [], hasMore: false, totalCount: 0 };
    }
  },

  // Compute stats for a product based on Approved Reviews
  async getProductRatingStats(productId: string) {
    try {
      const response = await fetch(`/api/customer/reviews/${productId}?limit=1000`);
      const data = await response.json();
      
      if (!data.success || data.reviews.length === 0) {
        return {
          averageRating: 0,
          totalCount: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
      }

      const reviews = data.reviews;
      const totalCount = data.total;
      const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
      const averageRating = parseFloat((sum / totalCount).toFixed(1));

      const distribution: any = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach((r: any) => {
        const rate = Math.round(r.rating);
        if (distribution[rate] !== undefined) {
          distribution[rate]++;
        }
      });

      const percentages = {
        5: Math.round((distribution[5] / totalCount) * 100),
        4: Math.round((distribution[4] / totalCount) * 100),
        3: Math.round((distribution[3] / totalCount) * 100),
        2: Math.round((distribution[2] / totalCount) * 100),
        1: Math.round((distribution[1] / totalCount) * 100)
      };

      return {
        averageRating,
        totalCount,
        distribution,
        percentages
      };
    } catch (err) {
      return {
        averageRating: 0,
        totalCount: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
  },

  // Submit a review securely
  async submitReview(params: {
    product_id: string;
    product_name: string;
    product_image: string;
    rating: number;
    title?: string;
    comment: string;
    images: string[];
    order_id?: string;
  }): Promise<{ success: boolean; message: string; review?: any }> {
    try {
      const response = await fetch('/api/customer/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...accountService.getHeaders()
        },
        body: JSON.stringify(params)
      });
      
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: 'Review submitted successfully!', review: data };
      } else {
        return { success: false, message: data.error || 'Failed to submit review.' };
      }
    } catch (err) {
      return { success: false, message: 'Network error occurred.' };
    }
  },

  // Report a review
  async reportReview(reviewId: number, reason: string, details: string) {
    try {
      const response = await fetch('/api/customer/reviews/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...accountService.getHeaders()
        },
        body: JSON.stringify({ review_id: reviewId, reason, details })
      });
      return response.json();
    } catch (err) {
      return { error: 'Failed to report review' };
    }
  },

  // Image processing (stays on client)
  processReviewImage(file: File): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
    return new Promise((resolve) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return resolve({ success: false, error: 'Unsupported format.' });
      }
      if (file.size > 5 * 1024 * 1024) {
        return resolve({ success: false, error: 'File too large.' });
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 800;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve({ success: false, error: 'Buffer error.' });
          ctx.drawImage(img, 0, 0, width, height);
          resolve({ success: true, dataUrl: canvas.toDataURL('image/jpeg', 0.75) });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }
};
