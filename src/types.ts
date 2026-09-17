export interface Product {
  id: string;
  name: string;
  name_bn?: string;
  slug?: string;
  price: number;
  oldPrice?: number;
  imageUrl: string;
  category: string;
  rating: number;
  badge?: string;
  flashSale?: boolean;
  is_fast_sale?: number;
  stock_quantity?: number;
  sku?: string;
  unit?: string;
  short_description?: string;
  description?: string;
  status?: string;
  seo_title?: string;
  seo_description?: string;
  created_at?: string;
  view_count?: number;
  review_count?: number;
}

export interface Category {
  id: string;
  name: string;
  name_bn?: string;
  imageUrl?: string;
  image_url?: string;
  image?: string;
  iconImage?: string;
  icon_image?: string;
  banner_url?: string;
  slug: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
  sort_order?: number;
  displayOrder?: number;
  is_featured?: number | boolean;
  show_on_homepage?: number | boolean;
  description?: string;
  description_bn?: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  sortOrder?: number;
  status?: 'active' | 'inactive';
}

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
  customer_email?: string;
  customer_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface HomepageSection {
  id: number;
  section_key: string;
  title_en: string;
  title_bn: string;
  enabled: boolean;
  sort_order: number;
  config: any;
  updated_at: string;
}

export interface DBBanner {
  id: number;
  name: string;
  image_url_desktop: string;
  image_url_mobile: string;
  heading_en: string;
  heading_bn: string;
  description_en: string;
  description_bn: string;
  button_text_en: string;
  button_text_bn: string;
  button_link: string;
  destination_type: 'product' | 'category' | 'offer' | 'internal' | 'external';
  display_location: 'homepage_hero' | 'homepage_promo' | 'category_banner' | 'offer_banner';
  status: 'active' | 'inactive';
  sort_order: number;
  category_id?: string | number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  logo: string;
  alt_text?: string;
  status: number;
  sort_order: number;
}

export interface TaglineConfig {
  enabled: boolean;
  text: string;
  text_bn?: string;
  link?: string;
  link_target?: '_self' | '_blank';
  align?: 'left' | 'center' | 'right';
  show_desktop?: boolean;
  show_mobile?: boolean;
  bg_color?: string;
  text_color?: string;
}

export interface BrandingData {
  // Website Identity
  site_name: string;
  site_name_bn: string;
  short_name: string;
  tagline: string;
  tagline_bn: string;
  business_type: string;
  brand_keywords: string;
  brand_description: string;
  brand_description_bn: string;
  copyright_text: string;
  copyright_text_bn: string;

  // Tagline Configuration
  tagline_enabled: boolean;
  tagline_text: string;
  tagline_text_bn: string;
  tagline_link: string;
  tagline_link_target: '_self' | '_blank';
  tagline_align: 'left' | 'center' | 'right';
  tagline_show_desktop: boolean;
  tagline_show_mobile: boolean;
  tagline_bg_color: string;
  tagline_text_color: string;

  // Canonical Brand Assets (Primary Logo is canonical source of truth)
  primary_logo: string;
  compact_logo: string;
  favicon: string;
  social_image: string;
  loading_logo: string;
  admin_logo: string;
  footer_logo: string;

  // Brand Colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  bg_color: string;

  // SEO & Social
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_card: string;
  canonical_url: string;

  // Contact / Business Identity
  store_phone: string;
  store_whatsapp: string;
  store_email: string;
  store_address: string;
  store_city: string;
  store_district: string;
  store_country: string;
  support_hours: string;
  website_url: string;
}
