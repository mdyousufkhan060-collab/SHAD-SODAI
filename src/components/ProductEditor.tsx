import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Camera, Plus, Eye, Image as ImageIcon, Youtube, 
  Trash2, Check, Lock, AlertCircle, Save, Sparkles, 
  Percent, DollarSign, Package, ShieldCheck, HelpCircle,
  Truck, FileText, CheckCircle2, ChevronRight, X, ExternalLink,
  Layers, Sliders, Info, RefreshCw
} from 'lucide-react';
import { adminService } from '../utils/adminService';

interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
}

interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  price: number;
  old_price: number;
  stock: number;
}

interface NutritionItem {
  nutrient: string;
  amount: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

export const ProductEditor: React.FC<{
  language: 'en' | 'bn';
  productId?: string;
  onBack: () => void;
}> = ({ language, productId, onBack }) => {
  // Navigation & Submitting state
  const [activeSection, setActiveSection] = useState<string>('sec-basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Categories & Brands list
  const [categories, setCategories] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    name_bn: '',
    sku: '',
    category: 'Dry Food',
    category_id: '',
    brand: '',
    unit: 'kg',
    status: 'active' as 'active' | 'inactive' | 'draft',
    condition_type: 'new',
    badge: '',
    youtube_link: '',

    // Pricing & Confidential Cost
    price: '',
    old_price: '',
    cost_price: '', // Strictly confidential

    // Inventory
    stock_quantity: 50,
    low_stock_threshold: 10,
    track_inventory: true,

    // Descriptions & Highlights
    short_description: '',
    description: '',

    // Specifications & Details
    ingredients: '',
    weight: '',
    dimensions: '',
    technical_details: '',

    // Storage & Usage
    storage: 'Store in an airtight jar in a cool, dry place away from direct sunlight.',
    usage_info: 'Ready to eat as a healthy nutritious daily snack or blend into smoothies and desserts.',

    // Shipping & Policies
    inside_dhaka_time: '24-48 Hours',
    outside_dhaka_time: '2-4 Days',
    delivery_info: 'Cash on delivery and instant digital payment available across Bangladesh.',
    return_policy: '7 days return & replacement policy for broken or defective seals.',
    delivery_charge_enabled: false,
    delivery_charge_amount: '',
    courier_note: '',

    // SEO
    slug: '',
    seo_title: '',
    seo_description: '',
    featured: true
  });

  // Dynamic Lists
  const [images, setImages] = useState<ProductImage[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [keyFeatures, setKeyFeatures] = useState<string[]>([
    '100% natural, premium handpicked grade',
    'No artificial preservatives or added chemicals',
    'Hygienically sorted and nitrogen-sealed for crisp freshness'
  ]);
  const [nutrition, setNutrition] = useState<NutritionItem[]>([
    { nutrient: 'Calories (Energy)', amount: '579 kcal' },
    { nutrient: 'Protein', amount: '21.2 g' },
    { nutrient: 'Dietary Fiber', amount: '12.5 g' },
    { nutrient: 'Total Carbohydrates', amount: '21.6 g' },
    { nutrient: 'Healthy Fats', amount: '49.9 g' }
  ]);
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      question: 'Is this product 100% authentic and fresh?',
      answer: 'Yes! All SHAD SHODAI dry food items are directly sourced from authentic origins and hygienically packed without chemical treatments.'
    },
    {
      question: 'How long can I store this after opening?',
      answer: 'When stored in an airtight glass or plastic jar in a cool dry area, it retains optimal crispness and flavor for up to 6 months.'
    }
  ]);

  // Preview Lightbox
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // File Input Refs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch Categories & Initial Product Data
  useEffect(() => {
    // Load categories
    fetch('/api/categories', { headers: adminService.getHeaders() })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(err => console.error('Failed to load categories', err));

    // Load Product for Edit
    if (productId) {
      setIsLoading(true);
      fetch(`/api/admin/products/${productId}`, { headers: adminService.getHeaders() })
        .then(res => res.json())
        .then(resData => {
          const data = resData.data || resData;
          if (data && !data.error) {
            setFormData({
              name: data.name || '',
              name_bn: data.name_bn || '',
              sku: data.sku || '',
              category: data.category || 'Dry Food',
              category_id: data.category_id || '',
              brand: data.brand || 'Shad Ghor',
              unit: data.unit || 'kg',
              status: data.status || 'active',
              condition_type: data.condition_type || 'new',
              badge: data.badge || '',
              youtube_link: data.youtube_link || '',

              price: data.price !== undefined ? String(data.price) : '',
              old_price: data.old_price !== undefined ? String(data.old_price) : '',
              cost_price: data.cost_price !== undefined ? String(data.cost_price) : (data.buying_price !== undefined ? String(data.buying_price) : ''),

              stock_quantity: Number(data.stock_quantity) || 0,
              low_stock_threshold: Number(data.low_stock_threshold) || 10,
              track_inventory: data.track_inventory !== undefined ? Boolean(data.track_inventory) : true,

              short_description: data.short_description || '',
              description: data.description || '',

              ingredients: data.ingredients || '',
              weight: data.weight || '',
              dimensions: data.dimensions || '',
              technical_details: data.technical_details || '',

              storage: data.storage || 'Store in an airtight jar in a cool, dry place away from direct sunlight.',
              usage_info: data.usage_info || 'Ready to eat as a healthy nutritious daily snack or blend into smoothies and desserts.',

              inside_dhaka_time: data.inside_dhaka_time || '24-48 Hours',
              outside_dhaka_time: data.outside_dhaka_time || '2-4 Days',
              delivery_info: data.delivery_info || 'Cash on delivery and instant digital payment available across Bangladesh.',
              return_policy: data.return_policy || '7 days return & replacement policy for broken or defective seals.',
              delivery_charge_enabled: Boolean(data.delivery_charge_enabled),
              delivery_charge_amount: data.delivery_charge_amount ? String(data.delivery_charge_amount) : '',
              courier_note: data.courier_note || '',

              slug: data.slug || '',
              seo_title: data.seo_title || '',
              seo_description: data.seo_description || '',
              featured: data.featured !== undefined ? Boolean(data.featured) : true
            });

            // Reconstruct images
            const loadedImages: ProductImage[] = [];
            if (data.image_url) {
              loadedImages.push({ id: 'main_img', url: data.image_url, isMain: true });
            }
            if (data.gallery) {
              try {
                const parsed = typeof data.gallery === 'string' ? JSON.parse(data.gallery) : data.gallery;
                if (Array.isArray(parsed)) {
                  parsed.forEach((url: string, idx: number) => {
                    if (url && url !== data.image_url) {
                      loadedImages.push({ id: `gal_${idx}_${Date.now()}`, url, isMain: false });
                    }
                  });
                }
              } catch (e) {
                console.error('Failed to parse gallery', e);
              }
            }
            setImages(loadedImages);

            // Reconstruct variants
            if (data.variants) {
              try {
                const parsed = typeof data.variants === 'string' ? JSON.parse(data.variants) : data.variants;
                if (Array.isArray(parsed)) setVariants(parsed);
              } catch (e) {}
            }

            // Reconstruct key features
            if (data.key_features) {
              try {
                const parsed = typeof data.key_features === 'string' ? JSON.parse(data.key_features) : data.key_features;
                if (Array.isArray(parsed) && parsed.length > 0) setKeyFeatures(parsed);
              } catch (e) {}
            }

            // Reconstruct nutrition
            if (data.nutrition) {
              try {
                const parsed = typeof data.nutrition === 'string' ? JSON.parse(data.nutrition) : data.nutrition;
                if (Array.isArray(parsed) && parsed.length > 0) setNutrition(parsed);
              } catch (e) {}
            }

            // Reconstruct FAQs
            if (data.faqs) {
              try {
                const parsed = typeof data.faqs === 'string' ? JSON.parse(data.faqs) : data.faqs;
                if (Array.isArray(parsed) && parsed.length > 0) setFaqs(parsed);
              } catch (e) {}
            }
          }
        })
        .catch(err => {
          console.error('Failed to fetch product detail', err);
          setFeedback({ type: 'error', message: 'Failed to load product data.' });
        })
        .finally(() => setIsLoading(false));
    }
  }, [productId]);

  // Handle Name changes & Auto Slug
  const handleNameChange = (val: string) => {
    setFormData(prev => {
      const generatedSlug = prev.slug && prev.slug !== prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        ? prev.slug
        : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return {
        ...prev,
        name: val,
        slug: generatedSlug,
        seo_title: prev.seo_title || `${val} | SHAD SHODAI`
      };
    });
  };

  // Profit & Discount Calculations
  const sellingPrice = parseFloat(formData.price) || 0;
  const regularPrice = parseFloat(formData.old_price) || 0;
  const costPrice = parseFloat(formData.cost_price) || 0;

  const discountPercent = regularPrice > sellingPrice && regularPrice > 0
    ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100)
    : 0;

  const profitPerUnit = sellingPrice > 0 && costPrice > 0
    ? sellingPrice - costPrice
    : 0;

  const profitMarginPercent = sellingPrice > 0 && costPrice > 0
    ? Math.round(((sellingPrice - costPrice) / sellingPrice) * 100)
    : 0;

  // Image Processing Helpers
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('Please upload valid image files (JPG, PNG, WebP).');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        alert('Image file size exceeds 8MB. Please optimize or choose another file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setImages(prev => {
          const isFirst = prev.length === 0;
          return [...prev, { id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, url, isMain: isFirst }];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const url = imageUrlInput.trim();
    setImages(prev => {
      const isFirst = prev.length === 0;
      return [...prev, { id: `img_${Date.now()}`, url, isMain: isFirst }];
    });
    setImageUrlInput('');
  };

  const setMainImage = (id: string) => {
    setImages(prev => prev.map(img => ({ ...img, isMain: img.id === id })));
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      if (updated.length > 0 && !updated.some(img => img.isMain)) {
        updated[0].isMain = true;
      }
      return updated;
    });
  };

  // Variant Helpers
  const addQuickVariant = (weightLabel: string, multiplier: number) => {
    const basePrice = sellingPrice > 0 ? sellingPrice : 500;
    const baseOldPrice = regularPrice > 0 ? regularPrice : basePrice * 1.15;
    const varPrice = Math.round(basePrice * multiplier);
    const varOldPrice = Math.round(baseOldPrice * multiplier);

    setVariants(prev => [
      ...prev,
      {
        id: `var_${Date.now()}`,
        title: weightLabel,
        sku: `${formData.sku || 'SG'}-${weightLabel.replace(/\s+/g, '')}`,
        price: varPrice,
        old_price: varOldPrice,
        stock: 30
      }
    ]);
  };

  const addCustomVariant = () => {
    setVariants(prev => [
      ...prev,
      {
        id: `var_${Date.now()}`,
        title: '500 gm',
        sku: `${formData.sku || 'SG'}-500G`,
        price: sellingPrice || 0,
        old_price: regularPrice || 0,
        stock: 20
      }
    ]);
  };

  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof ProductVariant, val: any) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: val } : v));
  };

  // Key Features Helpers
  const addKeyFeature = () => {
    setKeyFeatures(prev => [...prev, '']);
  };

  const updateKeyFeature = (index: number, val: string) => {
    setKeyFeatures(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const removeKeyFeature = (index: number) => {
    setKeyFeatures(prev => prev.filter((_, i) => i !== index));
  };

  // Nutrition Helpers
  const addNutritionRow = () => {
    setNutrition(prev => [...prev, { nutrient: '', amount: '' }]);
  };

  const updateNutritionRow = (index: number, field: 'nutrient' | 'amount', val: string) => {
    setNutrition(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const removeNutritionRow = (index: number) => {
    setNutrition(prev => prev.filter((_, i) => i !== index));
  };

  // FAQ Helpers
  const addFaq = () => {
    setFaqs(prev => [...prev, { question: '', answer: '' }]);
  };

  const updateFaq = (index: number, field: 'question' | 'answer', val: string) => {
    setFaqs(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const removeFaq = (index: number) => {
    setFaqs(prev => prev.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmit = async (targetStatus?: 'active' | 'draft') => {
    if (!formData.name.trim()) {
      setActiveSection('sec-basic');
      setFeedback({ type: 'error', message: language === 'bn' ? 'অনুগ্রহ করে প্রোডাক্টের নাম লিখুন।' : 'Please enter the product title.' });
      return;
    }
    if (!sellingPrice) {
      setActiveSection('sec-pricing');
      setFeedback({ type: 'error', message: language === 'bn' ? 'অনুগ্রহ করে বিক্রয়মূল্য নির্ধারণ করুন।' : 'Please set a valid selling price.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    // Identify main image and gallery
    const mainImg = images.find(img => img.isMain)?.url || (images.length > 0 ? images[0].url : '');
    const galleryUrls = images.filter(img => img.url !== mainImg).map(img => img.url);

    // Filter non-empty highlights, nutrition, and FAQs
    const cleanFeatures = keyFeatures.filter(f => f.trim().length > 0);
    const cleanNutrition = nutrition.filter(n => n.nutrient.trim().length > 0);
    const cleanFaqs = faqs.filter(f => f.question.trim().length > 0);

    const payload = {
      ...formData,
      status: targetStatus || formData.status,
      price: sellingPrice,
      old_price: regularPrice || sellingPrice,
      cost_price: costPrice,
      buying_price: costPrice, // Backend synonym
      image_url: mainImg,
      gallery: galleryUrls,
      variants: variants,
      key_features: cleanFeatures,
      nutrition: cleanNutrition,
      faqs: cleanFaqs,
      stock_quantity: Number(formData.stock_quantity) || 0,
      low_stock_threshold: Number(formData.low_stock_threshold) || 10,
      delivery_charge_amount: Number(formData.delivery_charge_amount) || 0,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    };

    const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';
    const method = productId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...adminService.getHeaders()
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (response.ok && (resData.success !== false)) {
        setFeedback({
          type: 'success',
          message: productId
            ? (language === 'bn' ? 'প্রোডাক্ট সফলভাবে আপডেট করা হয়েছে!' : 'Product updated successfully!')
            : (language === 'bn' ? 'নতুন প্রোডাক্ট সফলভাবে পাবলিশ হয়েছে!' : 'Product published successfully!')
        });
        setTimeout(() => {
          onBack();
        }, 800);
      } else {
        setFeedback({
          type: 'error',
          message: resData.error || (language === 'bn' ? 'প্রোডাক্ট সংরক্ষণ করতে ব্যর্থ হয়েছে।' : 'Failed to save product.')
        });
      }
    } catch (err: any) {
      console.error('[Save Product Error]', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Network error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Section List for Sticky Sidebar / Jump Bar
  const sections = [
    { id: 'sec-basic', labelEn: '01. Basic Info', labelBn: '০১. প্রাথমিক তথ্য' },
    { id: 'sec-media', labelEn: '02. Media & Images', labelBn: '০২. ছবি ও মিডিয়া' },
    { id: 'sec-pricing', labelEn: '03. Pricing & Cost', labelBn: '০৩. মূল্য ও লাভ' },
    { id: 'sec-variants', labelEn: '04. Pack Variants', labelBn: '০৪. প্যাক ভ্যারিয়েন্ট' },
    { id: 'sec-inventory', labelEn: '05. Inventory', labelBn: '০৫. স্টক নিয়ন্ত্রণ' },
    { id: 'sec-description', labelEn: '06. Descriptions', labelBn: '০৬. বিবরণ ও বৈশিষ্ট্য' },
    { id: 'sec-nutrition', labelEn: '07. Nutrition & Specs', labelBn: '০৭. পুষ্টিমান ও স্পেক্স' },
    { id: 'sec-storage', labelEn: '08. Storage & FAQ', labelBn: '০৮. সংরক্ষণ ও প্রশ্নাবলী' },
    { id: 'sec-delivery', labelEn: '09. Shipping & Policy', labelBn: '০৯. ডেলিভারি ও পলিসি' },
    { id: 'sec-seo', labelEn: '10. SEO & URL', labelBn: '১০. এসইও ও ইউআরএল' }
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-12 bg-white rounded-2xl border border-gray-200 text-center space-y-3 my-6">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-gray-700">
          {language === 'bn' ? 'ডাটাবেস থেকে প্রোডাক্ট তথ্য লোড হচ্ছে...' : 'Loading product information from MySQL database...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-32 text-left animate-fade-in font-sans" id="admin-product-editor-root">
      
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={(e) => handleFileUpload(e.target.files)}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={(e) => handleFileUpload(e.target.files)}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* TOP BAR: Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-200">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-700 transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'bn' ? 'সব প্রোডাক্টে ফিরে যান' : 'Back to Product List'}</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              {productId
                ? (language === 'bn' ? `প্রোডাক্ট এডিট: ${formData.name || 'লোড হচ্ছে'}` : `Edit Product: ${formData.name || 'Loading'}`)
                : (language === 'bn' ? 'নতুন প্রোডাক্ট যোগ করুন' : 'Add New Dry Food Product')}
            </h1>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
              formData.status === 'active' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : formData.status === 'draft' 
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
              {formData.status}
            </span>
          </div>
        </div>

        {/* Top Quick Save Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {language === 'bn' ? 'ড্রাফট হিসেবে রাখুন' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>
              {productId 
                ? (language === 'bn' ? 'আপডেট করুন' : 'Update Product')
                : (language === 'bn' ? 'পাবলিশ করুন' : 'Publish Product')}
            </span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST / ALERT */}
      {feedback && (
        <div className={`mb-5 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* HORIZONTAL JUMP BAR / SECTION TABS (SCROLLABLE ON MOBILE) */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md py-2.5 mb-6 border-b border-gray-200 -mx-2 px-2 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        {sections.map(sec => (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollToSection(sec.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === sec.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {language === 'bn' ? sec.labelBn : sec.labelEn}
          </button>
        ))}
      </div>

      {/* FORM BODY: 10 SECTION CARDS */}
      <div className="space-y-6">

        {/* ======================================================== */}
        {/* SECTION 01: BASIC PRODUCT INFORMATION                    */}
        {/* ======================================================== */}
        <div id="sec-basic" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-black text-xs">01</div>
              <div>
                <h2 className="text-sm font-black text-gray-800">
                  {language === 'bn' ? 'প্রাথমিক প্রোডাক্ট তথ্য' : 'Product Information'}
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  {language === 'bn' ? 'প্রোডাক্টের নাম, ক্যাটাগরি, ব্র্যান্ড ও স্ট্যাটাস নির্ধারণ করুন' : 'Core identity, category mapping, brand and condition'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name (English) */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>{language === 'bn' ? 'প্রোডাক্টের নাম (ইংরেজি) *' : 'Product Title (English) *'}</span>
                <span className="text-[10px] text-gray-400 font-normal">e.g. Premium Medjool Dates</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Premium California Almonds (বাদাম)"
                className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                required
              />
            </div>

            {/* Product Name (Bangla) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'প্রোডাক্টের বাংলা নাম' : 'Product Title (Bangla)'}
              </label>
              <input
                type="text"
                value={formData.name_bn}
                onChange={(e) => setFormData(prev => ({ ...prev, name_bn: e.target.value }))}
                placeholder="যেমন: প্রিমিয়াম ক্যালিফোর্নিয়া কাঠবাদাম"
                className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
              />
            </div>

            {/* SKU / Code */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  {language === 'bn' ? 'এসকেইউ / প্রোডাক্ট কোড' : 'SKU / Product Code'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const randomCode = `SG-${formData.name ? formData.name.substring(0, 3).toUpperCase() : 'DRY'}-${Math.floor(1000 + Math.random() * 9000)}`;
                    setFormData(prev => ({ ...prev, sku: randomCode }));
                  }}
                  className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  {language === 'bn' ? 'অটো জেনারেট' : 'Auto Generate'}
                </button>
              </div>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="e.g. SG-ALM-1024"
                className="w-full text-xs font-semibold font-mono px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
              />
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'ক্যাটাগরি *' : 'Category *'}
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const sel = categories.find(c => c.name === e.target.value || c.id === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    category: sel ? sel.name : e.target.value,
                    category_id: sel ? sel.id : ''
                  }));
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800 cursor-pointer"
              >
                <option value="Dry Food">Dry Food (ড্রাই ফুড)</option>
                <option value="Nuts & Seeds">Nuts & Seeds (বাদাম ও বীজ)</option>
                <option value="Dates / Khejur">Dates / Khejur (খেজুর)</option>
                <option value="Organic Honey">Organic Honey (মধু)</option>
                <option value="Pure Ghee & Oils">Pure Ghee & Oils (ঘি ও তেল)</option>
                <option value="Spices">Spices (মসলা)</option>
                {categories
                  .filter((c: any) => !['Dry Food', 'Nuts & Seeds', 'Dates / Khejur', 'Organic Honey', 'Pure Ghee & Oils', 'Spices'].includes(c.name))
                  .map((c: any, idx: number) => (
                    <option key={c.id ? `cat-opt-${c.id}-${idx}` : `cat-opt-${idx}`} value={c.name}>
                      {c.name_bn ? `${c.name} (${c.name_bn})` : c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Brand */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'ব্র্যান্ড' : 'Brand'}
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="SHAD SHODAI"
                className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
              />
            </div>

            {/* Unit / Pack Size */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'ডিফল্ট ইউনিট / পরিমাপ' : 'Base Unit / Measurement'}
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800 cursor-pointer"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="gm">Gram (gm)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="jar">Jar / কৌটা</option>
                <option value="pack">Pack / প্যাকেট</option>
                <option value="box">Box / বক্স</option>
              </select>
            </div>

            {/* Badge Tag */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'প্রোডাক্ট ব্যাজ / হাইলাইট' : 'Display Badge / Tag'}
              </label>
              <select
                value={formData.badge}
                onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800 cursor-pointer"
              >
                <option value="">None / সাধারণ</option>
                <option value="Best Seller">Best Seller / বেস্ট সেলার</option>
                <option value="100% Organic">100% Organic / অর্গানিক</option>
                <option value="Premium Grade">Premium Grade / প্রিমিয়াম কোয়ালিটি</option>
                <option value="Winter Special">Winter Special / শীতকালীন স্পেশাল</option>
                <option value="Hot Deal">Hot Deal / হট অফার</option>
              </select>
            </div>

            {/* YouTube Link */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-red-600" />
                <span>{language === 'bn' ? 'ইউটিউব ভিডিও লিঙ্ক (ঐচ্ছিক)' : 'YouTube Video Link (Optional)'}</span>
              </label>
              <input
                type="url"
                value={formData.youtube_link}
                onChange={(e) => setFormData(prev => ({ ...prev, youtube_link: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 02: PRODUCT MEDIA & GALLERY                      */}
        {/* ======================================================== */}
        <div id="sec-media" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-black text-xs">02</div>
              <div>
                <h2 className="text-sm font-black text-gray-800">
                  {language === 'bn' ? 'ছবি ও মিডিয়া গ্যালারি' : 'Product Media & Gallery'}
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  {language === 'bn' ? 'মোবাইল ক্যামেরা বা গ্যালারি থেকে ছবি আপলোড করুন' : 'Camera and gallery upload with 900x1000px portrait ratio'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Required</span>
          </div>

          {/* Action Triggers: Camera, Device Files & Direct URL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all active:scale-95"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{language === 'bn' ? 'ফাইল / গ্যালারি থেকে আপলোড' : 'Upload from Files'}</span>
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-200 flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>{language === 'bn' ? 'মোবাইল ক্যামেরা দিয়ে তুলুন' : 'Take Photo (Camera)'}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Or paste direct image URL..."
                className="flex-1 text-xs px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Ratio / Dimension Advice */}
          <div className="p-3 bg-blue-50/70 border border-blue-150 rounded-xl flex items-start gap-2 text-[11px] text-blue-900 font-medium">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Recommendation:</span> For optimal presentation across mobile cards and customer product pages, use <strong>900 × 1000 px</strong> or portrait 4:5 photos on a clean natural background. The first or starred image is the primary storefront thumbnail.
            </div>
          </div>

          {/* Uploaded Images Grid */}
          {images.length === 0 ? (
            <div 
              onClick={() => galleryInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center space-y-2 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer"
            >
              <ImageIcon className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'কোনো ছবি আপলোড করা হয়নি। এখানে ক্লিক করে ছবি নির্বাচন করুন।' : 'No images uploaded yet. Click to upload from gallery or camera.'}
              </p>
              <p className="text-[10px] text-gray-400">Supports JPG, PNG, WebP up to 8MB each</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.map(img => (
                <div 
                  key={img.id}
                  className={`relative group rounded-xl overflow-hidden border-2 bg-gray-100 aspect-4/5 flex flex-col items-center justify-center ${
                    img.isMain ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={img.url}
                    alt="Product upload"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />

                  {/* Main Badge */}
                  {img.isMain && (
                    <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                      Main
                    </div>
                  )}

                  {/* Hover / Touch Controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPreviewImage(img.url); }}
                      className="p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-lg cursor-pointer transition-transform hover:scale-110"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {!img.isMain && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMainImage(img.id); }}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-transform hover:scale-110"
                        title="Set as Main"
                      >
                        Set Main
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer transition-transform hover:scale-110"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 03: PRICING & CONFIDENTIAL COST (STRICT SECURITY) */}
        {/* ======================================================== */}
        <div id="sec-pricing" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-black text-xs">03</div>
              <div>
                <h2 className="text-sm font-black text-gray-800">
                  {language === 'bn' ? 'মূল্য ও ক্রয়মূল্য (গোপনীয়)' : 'Pricing & Cost (Strictly Confidential)'}
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  {language === 'bn' ? 'গ্রাহক মূল্য ও অ্যাডমিন ক্রয়মূল্য ক্যালকুলেশন' : 'Selling price, regular MRP and admin-only buying cost analysis'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Regular Price (MRP) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'নিয়মিত মূল্য / MRP (৳)' : 'Regular Price / MRP (৳)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">৳</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.old_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, old_price: e.target.value }))}
                  placeholder="e.g. 1200"
                  className="w-full text-xs font-bold pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                />
              </div>
              <p className="text-[10px] text-gray-400">Crossed out strikethrough price</p>
            </div>

            {/* Selling / Offer Price */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-emerald-800 flex items-center justify-between">
                <span>{language === 'bn' ? 'বিক্রয়মূল্য (৳) *' : 'Selling Price (৳) *'}</span>
                {discountPercent > 0 && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                    {discountPercent}% OFF
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-emerald-600">৳</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g. 980"
                  className="w-full text-xs font-black pl-7 pr-3 py-2 bg-emerald-50/40 border border-emerald-300 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-emerald-950"
                  required
                />
              </div>
              <p className="text-[10px] text-gray-400">Actual price charged to customer</p>
            </div>

            {/* STRICTLY SECURE BUYING / COST PRICE */}
            <div className="space-y-1 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-950 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-700" />
                  <span>{language === 'bn' ? 'ক্রয়মূল্য / কস্ট প্রাইজ (৳)' : 'Buying / Cost Price (৳)'}</span>
                </label>
                <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded uppercase">
                  Admin Only
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-amber-700">৳</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.cost_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                  placeholder="e.g. 650"
                  className="w-full text-xs font-bold pl-7 pr-3 py-2 bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:border-amber-500 transition-all text-amber-950"
                />
              </div>
              <p className="text-[9px] text-amber-800 font-semibold leading-tight">
                🔒 Protected: Never sent to customer APIs or UI.
              </p>
            </div>
          </div>

          {/* Real-time Profit & Margin Analytics Card */}
          {sellingPrice > 0 && costPrice > 0 && (
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Selling Price</span>
                <span className="text-sm font-black text-gray-800">৳{sellingPrice.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Buying Cost</span>
                <span className="text-sm font-black text-gray-800">৳{costPrice.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Est. Profit / Unit</span>
                <span className="text-sm font-black text-emerald-700">৳{profitPerUnit.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Profit Margin</span>
                <span className="text-sm font-black text-emerald-700">{profitMarginPercent}%</span>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 04: PRODUCT VARIANTS (PACK WEIGHTS)              */}
        {/* ======================================================== */}
        <div id="sec-variants" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-black text-xs">04</div>
              <div>
                <h2 className="text-sm font-black text-gray-800">
                  {language === 'bn' ? 'প্যাক সাইজ ও ভ্যারিয়েন্ট' : 'Product Variants (Weight / Pack)'}
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  {language === 'bn' ? '২৫০ গ্রাম, ৫০০ গ্রাম, ১ কেজি ইত্যাদি ভ্যারিয়েন্ট তৈরি করুন' : 'Different weight/size pack options with specific pricing and stock'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={addCustomVariant}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'নতুন ভ্যারিয়েন্ট' : 'Add Custom'}</span>
            </button>
          </div>

          {/* Quick presets for dry food */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase">{language === 'bn' ? 'কুইক প্রিসেট:' : 'Quick Presets:'}</span>
            <button
              type="button"
              onClick={() => addQuickVariant('250 gm', 0.3)}
              className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 cursor-pointer"
            >
              + 250 gm
            </button>
            <button
              type="button"
              onClick={() => addQuickVariant('500 gm', 0.55)}
              className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 cursor-pointer"
            >
              + 500 gm
            </button>
            <button
              type="button"
              onClick={() => addQuickVariant('1 kg', 1.0)}
              className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 cursor-pointer"
            >
              + 1 kg
            </button>
            <button
              type="button"
              onClick={() => addQuickVariant('2 kg', 1.95)}
              className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 cursor-pointer"
            >
              + 2 kg
            </button>
          </div>

          {/* Variants Table */}
          {variants.length === 0 ? (
            <p className="text-xs text-gray-400 font-medium italic">
              {language === 'bn' ? 'কোনো ভ্যারিয়েন্ট যোগ করা হয়নি (ডিফল্ট মূল্যে প্রোডাক্ট বিক্রি হবে)।' : 'No extra variants added. The base price and unit will be used by default.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[9px] font-black uppercase tracking-wider border-b border-gray-200">
                    <th className="p-2.5">Variant Title</th>
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5">MRP (৳)</th>
                    <th className="p-2.5">Sale Price (৳)</th>
                    <th className="p-2.5">Stock</th>
                    <th className="p-2.5 text-center w-10">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {variants.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={v.title}
                          onChange={(e) => updateVariant(v.id, 'title', e.target.value)}
                          placeholder="e.g. 500 gm"
                          className="w-full text-xs font-bold px-2 py-1 bg-white border border-gray-200 rounded-md"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => updateVariant(v.id, 'sku', e.target.value)}
                          placeholder="SKU"
                          className="w-full text-xs font-mono px-2 py-1 bg-white border border-gray-200 rounded-md"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.old_price}
                          onChange={(e) => updateVariant(v.id, 'old_price', Number(e.target.value))}
                          className="w-20 text-xs px-2 py-1 bg-white border border-gray-200 rounded-md"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => updateVariant(v.id, 'price', Number(e.target.value))}
                          className="w-20 text-xs font-bold text-emerald-800 px-2 py-1 bg-white border border-gray-200 rounded-md"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => updateVariant(v.id, 'stock', Number(e.target.value))}
                          className="w-16 text-xs px-2 py-1 bg-white border border-gray-200 rounded-md"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeVariant(v.id)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 05: INVENTORY & STOCK CONTROL                    */}
        {/* ======================================================== */}
        <div id="sec-inventory" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-black text-xs">05</div>
              <div>
                <h2 className="text-sm font-black text-gray-800">
                  {language === 'bn' ? 'স্টক ও ইনভেন্টরি ম্যানেজমেন্ট' : 'Inventory & Stock Control'}
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  {language === 'bn' ? 'বর্তমান স্টক সংখ্যা ও লো-স্টক নোটিফিকেশন সেট করুন' : 'Real-time stock quantity, tracking toggle, and low stock threshold alerts'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'বর্তমান মজুদ / স্টক সংখ্যা *' : 'Available Stock Quantity *'}
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: Number(e.target.value) }))}
                className="w-full text-xs font-bold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white text-gray-800"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'অল্প স্টক সতর্কবার্তা সীমা' : 'Low Stock Warning Threshold'}
              </label>
              <input
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: Number(e.target.value) }))}
                className="w-full text-xs font-bold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white text-gray-800"
              />
              <p className="text-[10px] text-gray-400">Triggers admin alert when stock falls below this</p>
            </div>

            <div className="space-y-1 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.track_inventory}
                  onChange={(e) => setFormData(prev => ({ ...prev, track_inventory: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-700">
                  {language === 'bn' ? 'স্বয়ংক্রিয় স্টক ট্র্যাকিং' : 'Auto Deduct Stock on Orders'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 06: DESCRIPTIONS & KEY HIGHLIGHTS                */}
        {/* ======================================================== */}
        <div id="sec-description" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-black text-xs">06</div>
              <div>
                <h2 className="text-sm font-black text-gray-800">
                  {language === 'bn' ? 'বিবরণ ও মূল বৈশিষ্ট্য' : 'Descriptions & Key Highlights'}
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  {language === 'bn' ? 'সংক্ষিপ্ত সারসংক্ষেপ, বিস্তারিত বিবরণ ও বুলেট পয়েন্ট' : 'Customer product details overview, story, and bullet points'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Short Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'সংক্ষিপ্ত বিবরণ (কার্ড ও কুইক ভিউর জন্য)' : 'Short Summary / Overview (For Cards & Highlights)'}
              </label>
              <textarea
                rows={2}
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                placeholder="e.g. 100% natural, crisp and nutrient-rich California almonds, hygienically sorted for maximum freshness."
                className="w-full text-xs font-medium px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white text-gray-800"
              />
            </div>

            {/* Full Story Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'বিস্তারিত বিবরণ' : 'Full Detailed Story / Description'}
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Write the full origin story, processing assurance, taste profile, and health benefits..."
                className="w-full text-xs font-medium px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white text-gray-800 leading-relaxed"
              />
            </div>

            {/* Key Features Bullet Highlights */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  {language === 'bn' ? 'মূল বৈশিষ্ট্যসমূহ (বুলেট পয়েন্ট)' : 'Key Features / Highlights (Bullet Points)'}
                </label>
                <button
                  type="button"
                  onClick={addKeyFeature}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'পয়েন্ট যোগ করুন' : 'Add Point'}</span>
                </button>
              </div>

              <div className="space-y-2">
                {keyFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold w-5">{idx + 1}.</span>
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => updateKeyFeature(idx, e.target.value)}
                      placeholder="e.g. 100% pure without artificial polishing"
                      className="flex-1 text-xs font-semibold px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeKeyFeature(idx)}
                      className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 07: SPECIFICATIONS & NUTRITIONAL FACTS           */}
        {/* ======================================================== */}
        <div id="sec-nutrition" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-black text-xs">07</div>
              <div>
                <h2 className="text-sm font-black text-gray-800">
                  {language === 'bn' ? 'উপাদান, পুষ্টিমান ও স্পেসিফিকেশন' : 'Ingredients, Nutrition & Specifications'}
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  {language === 'bn' ? 'প্রতি ১০০ গ্রামে পুষ্টির পরিমাণ ও টেকনিক্যাল স্পেক্স' : 'Nutritional values per 100g, ingredients and processing specifications'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Ingredients */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'উপাদানসমূহ (Ingredients)' : 'Ingredients List'}
              </label>
              <input
                type="text"
                value={formData.ingredients}
                onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                placeholder="e.g. 100% Raw Whole California Almonds (বাদাম)"
                className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800"
              />
            </div>

            {/* Dynamic Nutrition Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  {language === 'bn' ? 'পুষ্টিমান টেবিল (প্রতি ১০০ গ্রামে)' : 'Nutritional Information (Per 100g)'}
                </label>
                <button
                  type="button"
                  onClick={addNutritionRow}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'নতুন পুষ্টি উপাদান' : 'Add Nutrient Row'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nutrition.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                    <input
                      type="text"
                      value={item.nutrient}
                      onChange={(e) => updateNutritionRow(idx, 'nutrient', e.target.value)}
                      placeholder="Nutrient (e.g. Protein)"
                      className="flex-1 text-xs font-bold px-2 py-1 bg-white border border-gray-200 rounded text-gray-800"
                    />
                    <input
                      type="text"
                      value={item.amount}
                      onChange={(e) => updateNutritionRow(idx, 'amount', e.target.value)}
                      placeholder="Amount (e.g. 21g)"
                      className="w-24 text-xs font-bold text-emerald-700 px-2 py-1 bg-white border border-gray-200 rounded text-right"
                    />
                    <button
                      type="button"
                      onClick={() => removeNutritionRow(idx)}
                      className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  {language === 'bn' ? 'উৎস / দেশ' : 'Origin / Source Country'}
                </label>
                <input
                  type="text"
                  value={formData.technical_details}
                  onChange={(e) => setFormData(prev => ({ ...prev, technical_details: e.target.value }))}
                  placeholder="e.g. USA / Saudi Arabia / Rajshahi, Bangladesh"
                  className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  {language === 'bn' ? 'প্যাকেজিং ধরণ' : 'Packaging Type'}
                </label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                  placeholder="e.g. Food-grade Nitrogen Pouch / Airtight Pet Jar"
                  className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 08: STORAGE GUIDELINES & FAQS                     */}
        {/* ======================================================== */}
        <div id="sec-storage" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-black text-xs">08</div>
              <div>
                <h2 className="text-sm font-black text-gray-800">
                  {language === 'bn' ? 'সংরক্ষণ নির্দেশিকা ও সাধারণ প্রশ্নাবলী' : 'Storage Guidelines & Customer FAQs'}
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  {language === 'bn' ? 'খাবার ভালো রাখার নিয়মাবলী ও জিজ্ঞাসিত প্রশ্ন' : 'Storage best practices and frequently asked questions for customers'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Storage Instructions */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'সংরক্ষণ পদ্ধতি (Storage Instructions)' : 'Storage Instructions'}
              </label>
              <textarea
                rows={2}
                value={formData.storage}
                onChange={(e) => setFormData(prev => ({ ...prev, storage: e.target.value }))}
                className="w-full text-xs font-medium px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800"
              />
            </div>

            {/* Usage Ideas */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'খাওয়ার নিয়ম ও পরামর্শ (Usage Tips)' : 'Usage & Consumption Tips'}
              </label>
              <textarea
                rows={2}
                value={formData.usage_info}
                onChange={(e) => setFormData(prev => ({ ...prev, usage_info: e.target.value }))}
                className="w-full text-xs font-medium px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800"
              />
            </div>

            {/* Dynamic FAQs */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  {language === 'bn' ? 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQs)' : 'Frequently Asked Questions (FAQs)'}
                </label>
                <button
                  type="button"
                  onClick={addFaq}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'প্রশ্ন যোগ করুন' : 'Add FAQ'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                        placeholder="Question (e.g. Is it 100% fresh?)"
                        className="flex-1 text-xs font-bold px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => removeFaq(idx)}
                        className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                      placeholder="Answer..."
                      className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 09: SHIPPING, DELIVERY & RETURN POLICY           */}
        {/* ======================================================== */}
        <div id="sec-delivery" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-black text-xs">09</div>
              <div>
                <h2 className="text-sm font-black text-gray-800">
                  {language === 'bn' ? 'ডেলিভারি সময় ও রিটার্ন পলিসি' : 'Delivery & Return Policies'}
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  {language === 'bn' ? 'ঢাকা ও ঢাকার বাইরে ডেলিভারি টাইম এবং রিটার্ন শর্ত' : 'Delivery timeframes, return terms, and courier instructions'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'ঢাকার ভেতরে ডেলিভারি সময়' : 'Inside Dhaka Delivery Time'}
              </label>
              <input
                type="text"
                value={formData.inside_dhaka_time}
                onChange={(e) => setFormData(prev => ({ ...prev, inside_dhaka_time: e.target.value }))}
                placeholder="24-48 Hours"
                className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'ঢাকার বাইরে ডেলিভারি সময়' : 'Outside Dhaka Delivery Time'}
              </label>
              <input
                type="text"
                value={formData.outside_dhaka_time}
                onChange={(e) => setFormData(prev => ({ ...prev, outside_dhaka_time: e.target.value }))}
                placeholder="2-4 Days"
                className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'রিটার্ন ও রিপ্লেসমেন্ট পলিসি' : 'Return & Replacement Policy'}
              </label>
              <textarea
                rows={2}
                value={formData.return_policy}
                onChange={(e) => setFormData(prev => ({ ...prev, return_policy: e.target.value }))}
                placeholder="7 days easy return if seal is broken or quality issue arises..."
                className="w-full text-xs font-medium px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800"
              />
            </div>

            {/* Custom delivery charge override */}
            <div className="sm:col-span-2 p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-800 block">Custom Shipping Charge Override</span>
                <span className="text-[10px] text-gray-500">Override default store shipping for heavy or fragile jars</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.delivery_charge_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_charge_enabled: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                {formData.delivery_charge_enabled && (
                  <input
                    type="number"
                    value={formData.delivery_charge_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_charge_amount: e.target.value }))}
                    placeholder="৳ Amount"
                    className="w-24 text-xs font-bold px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-800"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 10: SEO & URL SLUG                               */}
        {/* ======================================================== */}
        <div id="sec-seo" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-black text-xs">10</div>
              <div>
                <h2 className="text-sm font-black text-gray-800">
                  {language === 'bn' ? 'এসইও ও পার্মালিঙ্ক ইউআরএল' : 'Search Engine Optimization (SEO) & URL Slug'}
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  {language === 'bn' ? 'গুগল সার্চ ও সোশ্যাল মিডিয়া শেয়ার প্রিভিউ' : 'Custom URL slug, meta title and Google search result preview'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {/* Slug */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {language === 'bn' ? 'ইউআরএল স্লাগ (URL Slug)' : 'Permanent URL Slug'}
              </label>
              <div className="flex items-center">
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-3 py-2 border border-r-0 border-gray-200 rounded-l-xl">
                  shadshodai.com/products/
                </span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="premium-california-almonds"
                  className="flex-1 text-xs font-mono font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-r-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white text-gray-800"
                />
              </div>
            </div>

            {/* Meta Title */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">Meta SEO Title</label>
                <span className="text-[10px] text-gray-400 font-mono">{(formData.seo_title || formData.name).length} / 65 chars</span>
              </div>
              <input
                type="text"
                value={formData.seo_title}
                onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                placeholder={formData.name ? `${formData.name} | SHAD SHODAI` : 'Meta Title'}
                className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800"
              />
            </div>

            {/* Meta Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">Meta SEO Description</label>
                <span className="text-[10px] text-gray-400 font-mono">{(formData.seo_description || formData.short_description).length} / 160 chars</span>
              </div>
              <textarea
                rows={2}
                value={formData.seo_description}
                onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                placeholder="Meta description for search engines..."
                className="w-full text-xs font-medium px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800"
              />
            </div>

            {/* Live Google Search Preview Card */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Google Search Preview</span>
              <p className="text-xs text-[#202124] font-medium font-sans">
                https://shadshodai.com/products/{formData.slug || 'product-slug'}
              </p>
              <h3 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer">
                {formData.seo_title || formData.name || 'Product Title | SHAD SHODAI'}
              </h3>
              <p className="text-xs text-[#4d5156] line-clamp-2">
                {formData.seo_description || formData.short_description || 'Explore premium authentic dry food, organic nuts and dates with cash on delivery at SHAD SHODAI.'}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* FIXED BOTTOM ACTION BAR (MOBILE RESPONSIVE)               */}
      {/* ======================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95"
          >
            {language === 'bn' ? 'বাতিল / ফিরে যান' : 'Cancel / Back'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {language === 'bn' ? 'ড্রাফট রাখুন' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>
                {productId 
                  ? (language === 'bn' ? 'প্রোডাক্ট আপডেট করুন' : 'Update Product')
                  : (language === 'bn' ? 'পাবলিশ ও লাইভ করুন' : 'Publish Product')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X className="w-4 h-4" />
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="w-full max-h-[80vh] object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

    </div>
  );
};
