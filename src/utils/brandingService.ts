import { BrandingData } from '../types';
import { adminService } from './adminService';

export const DEFAULT_BRANDING: BrandingData = {
  // Website Identity
  site_name: 'SHAD SHODAI',
  site_name_bn: 'স্বাদ সদাই',
  short_name: 'ShadShodai',
  tagline: '100% Pure & Organic Grocery in Bangladesh',
  tagline_bn: '১০০% খাঁটি ও প্রাকৃতিক খাবারের বিশ্বস্ত প্রতিষ্ঠান',
  business_type: 'Online Organic Grocery & Food Store',
  brand_keywords: 'organic food, pure honey, mustard oil, desi ghee, spices, nuts, dry fruits, bangladesh, shad shodai',
  brand_description: 'SHAD SHODAI is a premier organic e-commerce destination in Bangladesh, delivering premium pure spices, natural honey, cold-pressed mustard oil, homemade desi ghee, handpicked nuts, and wholesome dry foods directly from authentic sources to your doorstep with guaranteed purity and prompt delivery across the nation.',
  brand_description_bn: 'স্বাদ সদাই বাংলাদেশের একটি নির্ভরযোগ্য প্রিমিয়াম অর্গানিক ফুড শপ। ১০০% খাঁটি মসলা, সুন্দরবনের মধু, ঘানির সরিষার তেল, দেশি গাওয়া ঘি, প্রিমিয়াম বাদাম ও ড্রাই ফ্রুটস সরাসরি গ্রাহকের দোরগোড়ায় পৌঁছে দেয়।',
  copyright_text: '© 2026 SHAD SHODAI. All Rights Reserved.',
  copyright_text_bn: '© ২০২৬ স্বাদ সদাই। সর্বস্বত্ব সংরক্ষিত।',

  // Tagline Configuration
  tagline_enabled: true,
  tagline_text: '🌿 Free Delivery on Orders Over ৳1500 | 100% Pure Organic Guarantee',
  tagline_text_bn: '🌿 ১৫০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি | ১০০% খাঁটি ও অর্গানিক পণ্যের নিশ্চয়তা',
  tagline_link: '#/offers',
  tagline_link_target: '_self',
  tagline_align: 'center',
  tagline_show_desktop: true,
  tagline_show_mobile: true,
  tagline_bg_color: '#065f46',
  tagline_text_color: '#ffffff',

  // Canonical Brand Assets (Primary Logo is canonical source of truth)
  primary_logo: '',
  compact_logo: '',
  favicon: '',
  social_image: '',
  loading_logo: '',
  admin_logo: '',
  footer_logo: '',

  // Brand Colors
  primary_color: '#059669',
  secondary_color: '#047857',
  accent_color: '#f59e0b',
  text_color: '#1f2937',
  bg_color: '#ffffff',

  // SEO & Social
  seo_title: 'SHAD SHODAI — Pure & Organic Grocery Shop',
  seo_description: 'Buy 100% pure organic spices, natural honey, cold-pressed mustard oil, desi ghee, and premium dry foods online in Bangladesh from SHAD SHODAI.',
  seo_keywords: 'shad shodai, organic food bangladesh, pure honey, mustard oil, desi ghee, spices, dry fruits',
  og_title: 'SHAD SHODAI — Pure & Organic Grocery Shop',
  og_description: '100% Pure & Organic Grocery & Natural Food in Bangladesh. Fast home delivery.',
  og_image: '',
  twitter_card: 'summary_large_image',
  canonical_url: 'https://shadshodai.com',

  // Contact / Business Identity
  store_phone: '+880 1700-000000',
  store_whatsapp: '+880 1700-000000',
  store_email: 'info@shadshodai.com',
  store_address: 'Rampura, Dhaka, Bangladesh',
  store_city: 'Dhaka',
  store_district: 'Dhaka',
  store_country: 'Bangladesh',
  support_hours: 'Sat - Thu: 9:00 AM - 9:00 PM',
  website_url: 'https://shadshodai.com'
};

export type LogoType = 'primary' | 'compact' | 'favicon' | 'social' | 'loading' | 'admin' | 'footer';

/**
 * Pure fallback resolver: If a specialized logo is not explicitly set,
 * it immediately falls back to the Global Canonical Primary Brand Logo.
 */
export const getEffectiveLogoUrl = (branding: Partial<BrandingData> | null | undefined, type: LogoType): string => {
  if (!branding) return '';
  const primary = branding.primary_logo || '';
  
  switch (type) {
    case 'compact':
      return branding.compact_logo || primary;
    case 'favicon':
      return branding.favicon || primary;
    case 'social':
      return branding.social_image || branding.og_image || primary;
    case 'loading':
      return branding.loading_logo || primary;
    case 'admin':
      return branding.admin_logo || primary;
    case 'footer':
      return branding.footer_logo || primary;
    case 'primary':
    default:
      return primary;
  }
};

export const brandingService = {
  /**
   * Fetch current public or admin branding
   */
  async fetchBranding(): Promise<BrandingData> {
    try {
      const res = await fetch('/api/branding');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        ...DEFAULT_BRANDING,
        ...data
      };
    } catch (err) {
      console.warn('[BrandingService] Using fallback branding:', err);
      return DEFAULT_BRANDING;
    }
  },

  /**
   * Admin: Save all branding settings
   */
  async saveBranding(data: Partial<BrandingData>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'POST',
        headers: {
          ...adminService.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save branding settings');
      }

      // Trigger cross-component sync event
      window.dispatchEvent(new CustomEvent('branding-updated', { detail: data }));

      return {
        success: true,
        message: resData.message || 'Branding settings updated successfully.'
      };
    } catch (err: any) {
      console.error('[BrandingService] Save error:', err);
      return {
        success: false,
        message: err.message || 'Error occurred while saving branding settings'
      };
    }
  },

  /**
   * Admin: Upload brand asset (primary logo, compact logo, favicon, etc.)
   */
  async uploadAsset(file: File, assetType: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('asset_type', assetType);

      const res = await fetch('/api/admin/branding/upload-asset', {
        method: 'POST',
        headers: adminService.getHeaders(),
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload asset');
      }

      return {
        success: true,
        url: data.url
      };
    } catch (err: any) {
      console.error('[BrandingService] Upload error:', err);
      return {
        success: false,
        error: err.message || 'Asset upload failed'
      };
    }
  },

  /**
   * Dynamically updates browser favicon in document head
   */
  updateFavicon(iconUrl: string) {
    if (!iconUrl) return;
    try {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = iconUrl;
    } catch (e) {
      console.warn('Could not set dynamic favicon', e);
    }
  }
};
